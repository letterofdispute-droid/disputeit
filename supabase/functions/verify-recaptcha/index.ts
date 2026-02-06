import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error codes that indicate domain configuration issues (not actual bot activity)
const DOMAIN_CONFIG_ERROR_CODES = ['browser-error', 'invalid-keys', 'hostname-mismatch'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'No token provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      // Allow through if secret key not configured (graceful degradation)
      return new Response(
        JSON.stringify({ success: true, score: 1.0, bypassed: true, reason: 'not_configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use reCAPTCHA Enterprise API
    const projectId = Deno.env.get('RECAPTCHA_PROJECT_ID') || 'letter-of-dispute';
    const siteKey = '6Ld622AsAAAAAB0AAUWGc3Bl78A1YKxdM6Piu27-';
    
    // Enterprise assessment endpoint
    const enterpriseUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${secretKey}`;
    
    const assessmentRequest = {
      event: {
        token: token,
        siteKey: siteKey,
        expectedAction: action,
      }
    };

    const verifyResponse = await fetch(enterpriseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentRequest),
    });

    const verifyResult = await verifyResponse.json();

    console.log('reCAPTCHA Enterprise verification result:', JSON.stringify(verifyResult, null, 2));

    // Check for API errors
    if (verifyResult.error) {
      console.error('reCAPTCHA Enterprise API error:', verifyResult.error);
      
      // Check if this is likely a configuration issue - allow through in development
      const host = req.headers.get('origin') || req.headers.get('referer') || '';
      const isDevelopment = host.includes('lovableproject.com') || host.includes('localhost');
      
      if (isDevelopment) {
        console.warn('Allowing through due to API error in development environment');
        return new Response(
          JSON.stringify({ success: true, score: 1.0, bypassed: true, reason: 'dev_api_error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'reCAPTCHA API error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token properties
    const tokenProperties = verifyResult.tokenProperties;
    
    if (!tokenProperties?.valid) {
      const invalidReason = tokenProperties?.invalidReason || 'UNKNOWN';
      console.warn(`Token invalid: ${invalidReason}`);
      
      // Check if this is a domain configuration issue
      const host = req.headers.get('origin') || req.headers.get('referer') || '';
      const isDevelopment = host.includes('lovableproject.com') || host.includes('localhost');
      
      // For domain configuration errors in development, allow through
      if (isDevelopment && (invalidReason === 'BROWSER_ERROR' || invalidReason === 'MISSING' || invalidReason === 'INVALID')) {
        console.warn('Allowing through due to token issue in development environment');
        return new Response(
          JSON.stringify({ success: true, score: 1.0, bypassed: true, reason: 'dev_token_issue' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          invalidReason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the risk score
    const score = verifyResult.riskAnalysis?.score ?? 0;
    const scoreThreshold = 0.5;
    
    console.log(`reCAPTCHA score: ${score} for action: ${action}`);

    if (score < scoreThreshold) {
      console.warn(`Low reCAPTCHA score: ${score} for action: ${action}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          score: score,
          error: 'Verification score too low'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally verify the action matches
    if (action && tokenProperties.action !== action) {
      console.warn(`Action mismatch: expected ${action}, got ${tokenProperties.action}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: score 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    
    // Check if this is a development environment
    const host = req.headers.get('origin') || req.headers.get('referer') || '';
    const isDevelopment = host.includes('lovableproject.com') || host.includes('localhost');
    
    if (isDevelopment) {
      console.warn('Allowing through due to error in development environment');
      return new Response(
        JSON.stringify({ success: true, score: 1.0, bypassed: true, reason: 'dev_error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

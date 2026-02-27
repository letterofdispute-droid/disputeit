import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Create a JWT from a Google Service Account key and exchange it for an access token */
async function getGoogleAccessToken(serviceAccountKey: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContent = serviceAccountKey.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Google OAuth token exchange failed: ${tokenResponse.status} ${errText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/** Fetch search analytics from GSC */
async function fetchSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  startRow: number = 0,
  rowLimit: number = 1000
): Promise<any[]> {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        rowLimit,
        startRow,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'country', expression: 'usa' }]
        }],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GSC API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.rows || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceAccountKeyRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const siteUrl = Deno.env.get('GSC_SITE_URL');

    if (!serviceAccountKeyRaw) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
    }
    if (!siteUrl) {
      throw new Error('GSC_SITE_URL is not configured');
    }

    const serviceAccountKey = JSON.parse(serviceAccountKeyRaw);
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get access token
    const accessToken = await getGoogleAccessToken(serviceAccountKey);

    // Calculate date range (last 28 days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); // GSC data has ~2 day lag
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 28);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    // Fetch data in pages (up to 5000 rows)
    let allRows: any[] = [];
    for (let startRow = 0; startRow < 5000; startRow += 1000) {
      const rows = await fetchSearchAnalytics(accessToken, siteUrl, startStr, endStr, startRow);
      allRows = allRows.concat(rows);
      if (rows.length < 1000) break;
    }

    // Clear old cache data
    await supabase
      .from('gsc_performance_cache')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    // Delete current period data to replace with fresh
    await supabase
      .from('gsc_performance_cache')
      .delete()
      .eq('date_range_start', startStr)
      .eq('date_range_end', endStr);

    // Insert new data in batches
    const batchSize = 200;
    let inserted = 0;
    for (let i = 0; i < allRows.length; i += batchSize) {
      const batch = allRows.slice(i, i + batchSize).map((row: any) => ({
        query: row.keys[0],
        page: row.keys[1],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        date_range_start: startStr,
        date_range_end: endStr,
        country: 'US',
      }));

      const { error } = await supabase.from('gsc_performance_cache').upsert(batch, { onConflict: 'query,page,date_range_start,date_range_end' });
      if (error) {
        console.error('Insert batch error:', error);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalRows: allRows.length,
      inserted,
      dateRange: { start: startStr, end: endStr },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('fetch-gsc-data error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

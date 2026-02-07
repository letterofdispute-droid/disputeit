import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendCreditEmailRequest {
  email: string;
  reason?: string;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    const { email, reason, expiresAt }: SendCreditEmailRequest = await req.json();

    if (!email || !expiresAt) {
      throw new Error("Missing required fields: email or expiresAt");
    }

    console.log(`Sending credit notification email to ${email}`);

    // Calculate days until expiry
    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const reasonSection = reason ? `
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #4b5563; font-size: 14px;">
          <strong>Note from our team:</strong> ${reason}
        </p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
              <img src="https://letterofdispute.com/ld-logo.svg" alt="Letter of Dispute" style="height: 40px; width: auto;" />
              <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0 0;">Professional Dispute Letter Templates</p>
            </div>
          
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                <span style="font-size: 32px;">🎁</span>
              </div>
              <h1 style="color: #111827; font-size: 24px; margin: 0 0 8px 0;">
                You've Received a Free Credit!
              </h1>
              <p style="color: #6b7280; margin: 0;">
                As a token of our appreciation
              </p>
            </div>

            ${reasonSection}

            <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
                1 Free Letter Credit
              </p>
              <p style="color: #15803d; margin: 0; font-size: 14px;">
                Worth $14.99 • Includes PDF + 30 days editing access
              </p>
            </div>

            <div style="margin: 24px 0;">
              <h3 style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">How to Use Your Credit:</h3>
              <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Browse our letter templates at letterofdispute.com</li>
                <li style="margin-bottom: 8px;">Fill out your letter details</li>
                <li style="margin-bottom: 8px;">Click "Generate Letter"</li>
                <li style="margin-bottom: 0;">Select "Use 1 Credit (Free)" at checkout</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://letterofdispute.com/templates" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Browse Templates
              </a>
            </div>

            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                ⏰ <strong>Expires ${formattedExpiry}</strong><br/>
                <span style="font-size: 13px;">Use your credit within ${daysUntilExpiry} days before it expires</span>
              </p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="https://letterofdispute.com/ld-logo-icon.svg" alt="Letter of Dispute" style="height: 32px; width: 32px; margin-bottom: 12px;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Questions? Reply to this email or visit our website.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} Letter of Dispute. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Letter of Dispute <noreply@letterofdispute.com>",
      to: [email],
      subject: "🎁 You've Received a Free Letter Credit!",
      html: emailHtml,
    });

    console.log("Credit notification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as { id?: string })?.id || 'sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending credit notification email:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

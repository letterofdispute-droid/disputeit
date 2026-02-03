import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendPurchaseEmailRequest {
  email: string;
  templateName: string;
  purchaseType: string;
  pdfUrl: string;
  docxUrl?: string;
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

    const { email, templateName, purchaseType, pdfUrl, docxUrl }: SendPurchaseEmailRequest = await req.json();

    if (!email || !templateName || !pdfUrl) {
      throw new Error("Missing required fields: email, templateName, or pdfUrl");
    }

    console.log(`Sending purchase email to ${email} for template: ${templateName}`);

    const downloadLinks = `
      <div style="margin: 24px 0;">
        <a href="${pdfUrl}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 12px;">
          📄 Download PDF
        </a>
        ${docxUrl ? `
        <a href="${docxUrl}" 
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          📝 Download Word Document
        </a>
        ` : ''}
      </div>
    `;

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
              <img src="https://disputeletters.com/ld-logo.svg" alt="DisputeLetters" style="height: 40px; width: auto;" />
              <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0 0;">Professional Dispute Letter Templates</p>
            </div>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              ✓ Your purchase was successful!
            </p>
          </div>

          <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">
            Your Letter: ${templateName}
          </h2>
          
          <p style="color: #4b5563; margin-bottom: 8px;">
            Thank you for your purchase! Your professionally formatted dispute letter is ready for download.
          </p>
          
          <p style="color: #4b5563; margin-bottom: 24px;">
            <strong>Package:</strong> ${purchaseType === 'pdf-editable' ? 'PDF + Editable Word Document' : 'PDF Only'}
          </p>

          ${downloadLinks}

          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⏰ <strong>Important:</strong> These download links will expire in 7 days. Please download your documents and save them to your device.
            </p>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-top: 32px;">
            <h3 style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">Next Steps</h3>
            <ol style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Download your letter using the buttons above</li>
              <li style="margin-bottom: 8px;">Review and customize if needed (Word document)</li>
              <li style="margin-bottom: 8px;">Print and sign the letter</li>
              <li style="margin-bottom: 8px;">Send via certified mail with return receipt</li>
              <li>Keep a copy for your records</li>
            </ol>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <img src="https://disputeletters.com/ld-logo-icon.svg" alt="DisputeLetters" style="height: 32px; width: 32px; margin-bottom: 12px;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Need help? Reply to this email or visit our website.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
              © ${new Date().getFullYear()} DisputeLetters. All rights reserved.
            </p>
          </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "DisputeLetters <noreply@disputeletters.com>",
      to: [email],
      subject: `Your Dispute Letter: ${templateName}`,
      html: emailHtml,
    });

    console.log("Purchase email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as { id?: string })?.id || 'sent' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending purchase email:", errorMessage);
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

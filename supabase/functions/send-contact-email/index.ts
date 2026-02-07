import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function sendEmail(to: string[], from: string, subject: string, html: string, replyTo?: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate field lengths
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Field exceeds maximum length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs
    const sanitize = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedName = sanitize(name);
    const sanitizedSubject = sanitize(subject);
    const sanitizedMessage = sanitize(message).replace(/\n/g, '<br>');

    // Send notification email to support
    await sendEmail(
      ["support@letterofdispute.com"],
      "Letter of Dispute <noreply@letterofdispute.com>",
      `Contact Form: ${sanitizedSubject}`,
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #4a5568; }
            .value { margin-top: 5px; }
            .message-box { background: white; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; }
            .footer { padding: 15px; text-align: center; color: #718096; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From:</div>
                <div class="value">${sanitizedName} (${email})</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${sanitizedSubject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${sanitizedMessage}</div>
              </div>
            </div>
            <div class="footer">
              This message was sent from the Letter of Dispute contact form.
            </div>
          </div>
        </body>
        </html>
      `,
      email
    );

    console.log("Support notification sent");

    // Send confirmation email to the user
    await sendEmail(
      [email],
      "Letter of Dispute <noreply@letterofdispute.com>",
      "We received your message - Letter of Dispute",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; }
            .message-copy { background: white; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0; }
            a { color: #2b6cb0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Thank you for contacting us!</h1>
            </div>
            <div class="content">
              <p>Hi ${sanitizedName},</p>
              <p>We've received your message and will get back to you within 24 hours.</p>
              
              <p><strong>Here's a copy of your message:</strong></p>
              <div class="message-copy">
                <p><strong>Subject:</strong> ${sanitizedSubject}</p>
                <p>${sanitizedMessage}</p>
              </div>
              
              <p>In the meantime, you might find these resources helpful:</p>
              <ul>
                <li><a href="https://letterofdispute.com/templates">Browse our letter templates</a></li>
                <li><a href="https://letterofdispute.com/faq">Frequently Asked Questions</a></li>
                <li><a href="https://letterofdispute.com/how-it-works">How Letter of Dispute works</a></li>
              </ul>
              
              <p>Best regards,<br>The Letter of Dispute Team</p>
            </div>
            <div class="footer">
              <p>Letter of Dispute - Professional dispute resolution letters</p>
              <p><a href="https://letterofdispute.com">letterofdispute.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    );

    console.log("Confirmation email sent");

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send message" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
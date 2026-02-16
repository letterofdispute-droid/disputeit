import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Escalation template suggestions by category
const escalationSuggestions: Record<string, { title: string; slug: string; description: string }[]> = {
  refunds: [
    { title: "Small Claims Court Filing Letter", slug: "small-claims-court-filing", description: "Formal notice of intent to file in small claims court" },
    { title: "Attorney General Consumer Complaint", slug: "attorney-general-complaint", description: "File a complaint with your state Attorney General" },
    { title: "Credit Card Chargeback Request", slug: "credit-card-chargeback", description: "Initiate a chargeback through your card issuer" },
  ],
  housing: [
    { title: "Housing Authority Complaint", slug: "housing-authority-complaint", description: "Report violations to your local housing authority" },
    { title: "Demand Letter Before Legal Action", slug: "housing-demand-letter", description: "Final demand before pursuing legal remedies" },
    { title: "Tenant Rights Organization Referral", slug: "tenant-rights-complaint", description: "Escalate through tenant advocacy organizations" },
  ],
  insurance: [
    { title: "Insurance Commissioner Complaint", slug: "insurance-commissioner-complaint", description: "File a formal complaint with your state's insurance commissioner" },
    { title: "Bad Faith Insurance Claim Letter", slug: "bad-faith-insurance-claim", description: "Assert bad faith handling of your claim" },
    { title: "Independent Appraisal Demand", slug: "insurance-independent-appraisal", description: "Request an independent appraisal of your claim" },
  ],
  vehicle: [
    { title: "Lemon Law Formal Demand", slug: "lemon-law-demand", description: "Invoke your state's lemon law protections" },
    { title: "DMV Dealer Complaint", slug: "dmv-dealer-complaint", description: "File a complaint with the DMV against the dealer" },
    { title: "Manufacturer Executive Escalation", slug: "manufacturer-escalation", description: "Escalate directly to the manufacturer's executive team" },
  ],
  financial: [
    { title: "CFPB Complaint Filing", slug: "cfpb-complaint", description: "File with the Consumer Financial Protection Bureau" },
    { title: "Banking Ombudsman Complaint", slug: "banking-ombudsman-complaint", description: "Escalate to the banking ombudsman" },
    { title: "Credit Bureau Formal Dispute", slug: "credit-bureau-dispute-escalation", description: "Escalate your credit dispute with supporting evidence" },
  ],
  utilities: [
    { title: "Public Utilities Commission Complaint", slug: "puc-complaint", description: "File with your state's Public Utilities Commission" },
    { title: "FCC Informal Complaint", slug: "fcc-informal-complaint", description: "File a telecom complaint with the FCC" },
    { title: "Service Quality Escalation", slug: "utility-service-escalation", description: "Formal escalation for persistent service failures" },
  ],
  employment: [
    { title: "EEOC Charge of Discrimination", slug: "eeoc-charge", description: "File a formal charge with the Equal Employment Opportunity Commission" },
    { title: "Department of Labor Wage Complaint", slug: "dol-wage-complaint", description: "Report wage violations to the Department of Labor" },
    { title: "Wrongful Termination Demand Letter", slug: "wrongful-termination-demand", description: "Formal demand regarding wrongful termination" },
  ],
  ecommerce: [
    { title: "FTC Consumer Complaint", slug: "ftc-consumer-complaint", description: "Report unfair business practices to the FTC" },
    { title: "BBB Complaint Filing", slug: "bbb-complaint", description: "File a complaint with the Better Business Bureau" },
    { title: "Payment Processor Dispute", slug: "payment-processor-dispute", description: "Escalate through PayPal, Stripe, or your payment provider" },
  ],
  "damaged-goods": [
    { title: "Product Safety Complaint (CPSC)", slug: "cpsc-complaint", description: "Report a dangerous or defective product to the CPSC" },
    { title: "Manufacturer Warranty Escalation", slug: "warranty-escalation", description: "Escalate a warranty claim to the manufacturer" },
    { title: "Small Claims Court Filing", slug: "small-claims-damaged-goods", description: "File in small claims for unresolved product disputes" },
  ],
  healthcare: [
    { title: "State Medical Board Complaint", slug: "medical-board-complaint", description: "File a complaint with your state medical board" },
    { title: "Insurance External Review Request", slug: "insurance-external-review", description: "Request an independent external review of a denied claim" },
    { title: "Hospital Patient Advocate Escalation", slug: "patient-advocate-escalation", description: "Escalate billing disputes through the hospital's patient advocate" },
  ],
  hoa: [
    { title: "HOA Board Formal Grievance", slug: "hoa-formal-grievance", description: "Submit a formal grievance to the HOA board" },
    { title: "Real Estate Commission Complaint", slug: "real-estate-commission-complaint", description: "File with your state's real estate regulatory body" },
    { title: "HOA Mediation Request", slug: "hoa-mediation-request", description: "Request formal mediation for your HOA dispute" },
  ],
  contractors: [
    { title: "Contractor License Board Complaint", slug: "contractor-license-complaint", description: "File a complaint with your state's contractor licensing board" },
    { title: "Mechanic's Lien Dispute Letter", slug: "mechanics-lien-dispute", description: "Challenge an improper mechanic's lien" },
    { title: "Construction Defect Demand Letter", slug: "construction-defect-demand", description: "Formal demand for repair or compensation for defective work" },
  ],
  travel: [
    { title: "DOT Aviation Consumer Complaint", slug: "dot-aviation-complaint", description: "File an airline complaint with the Department of Transportation" },
    { title: "Credit Card Travel Protection Claim", slug: "travel-protection-claim", description: "File a claim through your credit card's travel protection" },
    { title: "Travel Agency Regulatory Complaint", slug: "travel-agency-complaint", description: "Escalate to your state's travel agency regulator" },
  ],
};

function getDefaultEscalation(): { title: string; slug: string; description: string }[] {
  return [
    { title: "Small Claims Court Filing Letter", slug: "small-claims-court-filing", description: "Formal notice of intent to file in small claims court" },
    { title: "Attorney General Consumer Complaint", slug: "attorney-general-complaint", description: "File a complaint with your state Attorney General" },
    { title: "BBB Complaint Filing", slug: "bbb-complaint", description: "File a complaint with the Better Business Bureau" },
  ];
}

function getCategoryFromSlug(templateSlug: string): string {
  const categoryPrefixes: Record<string, string> = {
    'refund': 'refunds', 'return': 'refunds', 'chargeback': 'refunds', 'billing-dispute': 'refunds',
    'landlord': 'housing', 'tenant': 'housing', 'rent': 'housing', 'lease': 'housing', 'deposit': 'housing', 'repair': 'housing',
    'insurance': 'insurance', 'claim-denial': 'insurance', 'coverage': 'insurance',
    'vehicle': 'vehicle', 'car': 'vehicle', 'dealer': 'vehicle', 'lemon': 'vehicle', 'auto': 'vehicle',
    'bank': 'financial', 'credit': 'financial', 'debt': 'financial', 'loan': 'financial', 'mortgage': 'financial',
    'utility': 'utilities', 'telecom': 'utilities', 'internet': 'utilities', 'phone': 'utilities', 'energy': 'utilities',
    'employer': 'employment', 'wage': 'employment', 'termination': 'employment', 'workplace': 'employment', 'discrimination': 'employment',
    'ecommerce': 'ecommerce', 'online': 'ecommerce', 'marketplace': 'ecommerce', 'subscription': 'ecommerce',
    'damaged': 'damaged-goods', 'defective': 'damaged-goods', 'warranty': 'damaged-goods', 'broken': 'damaged-goods',
    'medical': 'healthcare', 'hospital': 'healthcare', 'doctor': 'healthcare', 'health': 'healthcare',
    'hoa': 'hoa', 'neighbor': 'hoa', 'community': 'hoa',
    'contractor': 'contractors', 'renovation': 'contractors', 'plumbing': 'contractors', 'electrical': 'contractors', 'roofing': 'contractors',
    'flight': 'travel', 'airline': 'travel', 'hotel': 'travel', 'booking': 'travel', 'travel': 'travel',
  };

  const slug = templateSlug.toLowerCase();
  for (const [prefix, category] of Object.entries(categoryPrefixes)) {
    if (slug.includes(prefix)) return category;
  }
  return 'refunds'; // fallback
}

function buildFollowUpEmail(
  templateName: string,
  purchaseId: string,
  escalationTemplates: { title: string; slug: string; description: string }[],
  siteUrl: string
): string {
  const escalationHtml = escalationTemplates.map(t => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <a href="${siteUrl}/templates/${t.slug}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${t.title}</a>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">${t.description}</p>
      </td>
    </tr>
  `).join('');

  return `
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
          </div>

          <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">
            How did your dispute go?
          </h2>

          <p style="color: #4b5563; margin-bottom: 8px;">
            Two weeks ago, you purchased <strong>"${templateName}"</strong>. We'd love to know — has your issue been resolved?
          </p>

          <p style="color: #4b5563; margin-bottom: 24px;">
            If you've already resolved your dispute, congratulations! 🎉 No further action is needed.
          </p>

          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; color: #92400e; font-weight: 600;">
              Still waiting for a response?
            </p>
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              If you haven't heard back, it may be time to escalate. Here are some recommended next steps:
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px 16px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Escalation Templates</th>
              </tr>
            </thead>
            <tbody>
              ${escalationHtml}
            </tbody>
          </table>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${siteUrl}/dashboard" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View My Letters
            </a>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h3 style="color: #111827; font-size: 14px; margin: 0 0 8px 0;">💡 Tips for Effective Escalation</h3>
            <ul style="color: #4b5563; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 6px;">Reference your original letter and the date you sent it</li>
              <li style="margin-bottom: 6px;">Include any tracking numbers or delivery confirmation</li>
              <li style="margin-bottom: 6px;">Set a clear deadline (usually 10–14 business days)</li>
              <li>Keep copies of all correspondence</li>
            </ul>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <img src="https://letterofdispute.com/ld-logo-icon.svg" alt="Letter of Dispute" style="height: 32px; width: 32px; margin-bottom: 12px;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              You're receiving this because you purchased a letter from Letter of Dispute.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
              © ${new Date().getFullYear()} Letter of Dispute. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(resendApiKey);

    const siteUrl = "https://letterofdispute.com";
    const now = new Date().toISOString();

    // Fetch purchases due for follow-up (max 50 per run to avoid timeouts)
    const { data: duePurchases, error: fetchError } = await supabaseClient
      .from("letter_purchases")
      .select("id, email, template_name, template_slug, created_at")
      .eq("status", "completed")
      .is("follow_up_sent_at", null)
      .lte("follow_up_due_at", now)
      .is("refunded_at", null)
      .order("follow_up_due_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch due purchases: ${fetchError.message}`);
    }

    if (!duePurchases || duePurchases.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No follow-ups due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${duePurchases.length} follow-up reminders`);

    let sent = 0;
    let failed = 0;

    for (const purchase of duePurchases) {
      try {
        const category = getCategoryFromSlug(purchase.template_slug);
        const escalation = escalationSuggestions[category] || getDefaultEscalation();

        const emailHtml = buildFollowUpEmail(
          purchase.template_name,
          purchase.id,
          escalation,
          siteUrl
        );

        await resend.emails.send({
          from: "Letter of Dispute <noreply@mail.letterofdispute.com>",
          to: [purchase.email],
          subject: `Follow-up: How did your "${purchase.template_name}" dispute go?`,
          html: emailHtml,
        });

        // Mark as sent
        await supabaseClient
          .from("letter_purchases")
          .update({ follow_up_sent_at: now })
          .eq("id", purchase.id);

        sent++;
        console.log(`Follow-up sent to ${purchase.email} for purchase ${purchase.id}`);
      } catch (emailErr) {
        failed++;
        console.error(`Failed to send follow-up for purchase ${purchase.id}:`, emailErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent, 
      failed, 
      total: duePurchases.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Follow-up reminder error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

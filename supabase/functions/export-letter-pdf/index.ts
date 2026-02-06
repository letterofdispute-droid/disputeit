import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import {
  loadFonts,
  drawLetterhead,
  drawDate,
  drawDeliveryMethod,
  drawSubjectLine,
  drawBodyContent,
  drawSignatureBlock,
  drawFooter,
  generateReferenceId,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN_TOP,
  LINE_HEIGHT,
  cleanPlaceholders,
  htmlToPlainText,
} from "../_shared/pdfHelpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Extract subject line from letter content
 */
function extractSubject(content: string, fallbackName: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('re:')) {
      return trimmed.substring(3).trim();
    }
  }
  return fallbackName;
}

/**
 * Remove the Re: line from content since we format it separately
 */
function removeSubjectFromContent(content: string): string {
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    return !trimmed.startsWith('re:');
  });
  return filteredLines.join('\n').trim();
}

/**
 * Generate a professional PDF letter
 */
async function generateProfessionalPDF(
  letterContent: string,
  templateName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  
  const referenceId = generateReferenceId();
  const cleanContent = cleanPlaceholders(htmlToPlainText(letterContent));
  const subject = extractSubject(cleanContent, templateName);
  const bodyContent = removeSubjectFromContent(cleanContent);
  
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN_TOP;
  
  // Draw letterhead
  yPosition = drawLetterhead(page, fonts, referenceId);
  
  // Draw date
  yPosition = drawDate(page, fonts, yPosition);
  
  // Draw delivery method
  yPosition = drawDeliveryMethod(page, fonts, yPosition);
  
  // Space for recipient (they can add in editor)
  yPosition -= LINE_HEIGHT * 3;
  
  // Draw subject line
  yPosition = drawSubjectLine(page, fonts, yPosition, subject);
  
  // Draw body content
  const { pages, finalY } = drawBodyContent(
    page,
    fonts,
    bodyContent,
    yPosition,
    pdfDoc,
    referenceId
  );
  
  // Draw signature block
  const lastPage = pages[pages.length - 1];
  drawSignatureBlock(lastPage, fonts, finalY);
  
  // Draw footers
  const totalPages = pages.length;
  for (let i = 0; i < pages.length; i++) {
    drawFooter(pages[i], fonts, i + 1, totalPages, referenceId);
  }
  
  return await pdfDoc.save();
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
    const { purchaseId } = await req.json();

    if (!purchaseId) {
      throw new Error("Missing purchase ID");
    }

    // Get the purchase
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("letter_purchases")
      .select("id, template_name, letter_content, last_edited_content")
      .eq("id", purchaseId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error("Purchase not found");
    }

    // Use last edited content if available
    const content = purchase.last_edited_content || purchase.letter_content;

    // Generate professional PDF
    const pdfBytes = await generateProfessionalPDF(content, purchase.template_name);
    const pdfFileName = `${purchaseId}/letter-export.pdf`;

    // Upload to storage
    const { error: uploadError } = await supabaseClient.storage
      .from("letters")
      .upload(pdfFileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabaseClient.storage
      .from("letters")
      .createSignedUrl(pdfFileName, 60 * 60);

    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      url: urlData.signedUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

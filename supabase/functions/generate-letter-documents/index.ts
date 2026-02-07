import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import {
  loadFonts,
  drawLetterhead,
  drawDate,
  drawDeliveryMethod,
  drawRecipientBlock,
  drawSubjectLine,
  drawBodyContent,
  drawSignatureBlock,
  drawFooter,
  drawEvidenceSection,
  generateReferenceId,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN_TOP,
  LINE_HEIGHT,
  cleanPlaceholders,
  htmlToPlainText,
  EvidencePhoto,
} from "../_shared/pdfHelpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateDocumentsRequest {
  purchaseId: string;
  letterContent: string;
  templateName: string;
  generateDocx?: boolean;
  // Optional metadata for better formatting
  senderName?: string;
  senderAddress?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  // Evidence photos from storage
  evidencePhotoPaths?: { storagePath: string; description?: string }[];
}

/**
 * Extract subject line from letter content
 * Looks for "Re:" line at the beginning
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
 * Remove the Re: line from content since we'll format it separately
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
  templateName: string,
  supabaseClient: ReturnType<typeof createClient>,
  metadata?: {
    senderName?: string;
    senderAddress?: string;
    recipientName?: string;
    recipientCompany?: string;
    recipientAddress?: string;
  },
  evidencePhotoPaths?: { storagePath: string; description?: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  
  // Generate reference ID for this letter
  const referenceId = generateReferenceId();
  
  // Clean the content
  const cleanContent = cleanPlaceholders(htmlToPlainText(letterContent));
  
  // Extract subject from content
  const subject = extractSubject(cleanContent, templateName);
  const bodyContent = removeSubjectFromContent(cleanContent);
  
  // Create first page
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN_TOP;
  
  // Draw letterhead
  yPosition = drawLetterhead(page, fonts, referenceId);
  
  // Draw date (right-aligned)
  yPosition = drawDate(page, fonts, yPosition);
  
  // Draw sender block if we have sender info
  // For now, leave space for user to add their info
  // This will be filled when we have form data
  
  // Draw delivery method
  yPosition = drawDeliveryMethod(page, fonts, yPosition);
  
  // Draw recipient block if we have recipient info
  if (metadata?.recipientName || metadata?.recipientCompany || metadata?.recipientAddress) {
    yPosition = drawRecipientBlock(
      page,
      fonts,
      yPosition,
      metadata.recipientName,
      metadata.recipientCompany,
      metadata.recipientAddress
    );
  } else {
    // Add placeholder space for recipient
    yPosition -= LINE_HEIGHT * 4;
  }
  
  // Draw subject line
  yPosition = drawSubjectLine(page, fonts, yPosition, subject);
  
  // Draw body content (handles multi-page)
  const { pages, finalY } = drawBodyContent(
    page,
    fonts,
    bodyContent,
    yPosition,
    pdfDoc,
    referenceId
  );
  
  // Draw signature block on the last page
  let lastPage = pages[pages.length - 1];
  let currentY = drawSignatureBlock(lastPage, fonts, finalY, metadata?.senderName);
  
  // Fetch and embed evidence photos if provided
  if (evidencePhotoPaths && evidencePhotoPaths.length > 0) {
    console.log(`Fetching ${evidencePhotoPaths.length} evidence photos...`);
    
    const evidencePhotos: EvidencePhoto[] = [];
    
    for (const photo of evidencePhotoPaths) {
      try {
        const { data, error } = await supabaseClient.storage
          .from('evidence-photos')
          .download(photo.storagePath);
        
        if (error) {
          console.error(`Failed to download evidence photo ${photo.storagePath}:`, error);
          continue;
        }
        
        const arrayBuffer = await data.arrayBuffer();
        evidencePhotos.push({
          imageBytes: new Uint8Array(arrayBuffer),
          description: photo.description,
        });
      } catch (err) {
        console.error(`Error processing evidence photo ${photo.storagePath}:`, err);
      }
    }
    
    if (evidencePhotos.length > 0) {
      console.log(`Embedding ${evidencePhotos.length} evidence photos in PDF...`);
      const { pages: evidencePages, finalY: evidenceFinalY } = await drawEvidenceSection(
        pdfDoc,
        lastPage,
        fonts,
        currentY,
        evidencePhotos,
        referenceId
      );
      
      // Add any new pages created by evidence section
      for (let i = 1; i < evidencePages.length; i++) {
        if (!pages.includes(evidencePages[i])) {
          pages.push(evidencePages[i]);
        }
      }
    }
  }
  
  // Draw footers on all pages
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
    const { 
      purchaseId, 
      letterContent, 
      templateName, 
      senderName,
      senderAddress,
      recipientName,
      recipientCompany,
      recipientAddress,
      evidencePhotoPaths,
    }: GenerateDocumentsRequest = await req.json();

    if (!purchaseId || !letterContent || !templateName) {
      throw new Error("Missing required fields: purchaseId, letterContent, templateName");
    }

    console.log(`Generating professional PDF for purchase ${purchaseId}`);
    if (evidencePhotoPaths && evidencePhotoPaths.length > 0) {
      console.log(`Including ${evidencePhotoPaths.length} evidence photos`);
    }

    // Generate PDF with professional template
    const pdfBytes = await generateProfessionalPDF(
      letterContent, 
      templateName, 
      supabaseClient,
      {
        senderName,
        senderAddress,
        recipientName,
        recipientCompany,
        recipientAddress,
      },
      evidencePhotoPaths
    );
    
    const pdfFileName = `${purchaseId}/letter.pdf`;
    
    // Upload to storage
    const { error: pdfUploadError } = await supabaseClient.storage
      .from("letters")
      .upload(pdfFileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (pdfUploadError) {
      console.error("PDF upload error:", pdfUploadError);
      throw new Error(`Failed to upload PDF: ${pdfUploadError.message}`);
    }

    // Get signed URL for PDF (valid for 7 days)
    const { data: pdfUrlData, error: pdfUrlError } = await supabaseClient.storage
      .from("letters")
      .createSignedUrl(pdfFileName, 60 * 60 * 24 * 7);

    if (pdfUrlError) {
      throw new Error(`Failed to create PDF signed URL: ${pdfUrlError.message}`);
    }

    // Update purchase record with PDF URL
    const { error: updateError } = await supabaseClient
      .from("letter_purchases")
      .update({
        pdf_url: pdfUrlData.signedUrl,
        docx_url: null, // No longer generating DOCX
      })
      .eq("id", purchaseId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update purchase: ${updateError.message}`);
    }

    console.log(`Professional PDF generated successfully for purchase ${purchaseId}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfUrlData.signedUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating documents:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "https://esm.sh/docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateDocumentsRequest {
  purchaseId: string;
  letterContent: string;
  templateName: string;
  generateDocx: boolean;
}

// Split text into lines that fit within a given width
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generatePDF(letterContent: string, templateName: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 72; // 1 inch margins
  const fontSize = 12;
  const lineHeight = fontSize * 1.5;
  const maxCharsPerLine = 80;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Add title
  const titleFontSize = 16;
  page.drawText(templateName, {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= titleFontSize * 2;

  // Add date
  const dateText = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  page.drawText(dateText, {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosition -= lineHeight * 2;

  // Process letter content
  const paragraphs = letterContent.split('\n\n');

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const wrappedLines = wrapText(line, maxCharsPerLine);
      
      for (const wrappedLine of wrappedLines) {
        // Check if we need a new page
        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(wrappedLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
    }
    
    // Add extra space between paragraphs
    yPosition -= lineHeight * 0.5;
  }

  return await pdfDoc.save();
}

async function generateDOCX(letterContent: string, templateName: string): Promise<Uint8Array> {
  const paragraphs: Paragraph[] = [];

  // Add title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: templateName,
          bold: true,
          size: 32, // 16pt
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    })
  );

  // Add date
  const dateText = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: dateText,
          color: "666666",
          size: 24, // 12pt
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Process letter content
  const contentParagraphs = letterContent.split('\n\n');

  for (const para of contentParagraphs) {
    const lines = para.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
    
    // Add extra space between paragraphs
    paragraphs.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
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
    const { purchaseId, letterContent, templateName, generateDocx }: GenerateDocumentsRequest = await req.json();

    if (!purchaseId || !letterContent || !templateName) {
      throw new Error("Missing required fields");
    }

    console.log(`Generating documents for purchase ${purchaseId}`);

    // Generate PDF
    const pdfBytes = await generatePDF(letterContent, templateName);
    const pdfFileName = `${purchaseId}/letter.pdf`;
    
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

    let docxUrl: string | null = null;

    // Generate DOCX if requested
    if (generateDocx) {
      const docxBytes = await generateDOCX(letterContent, templateName);
      const docxFileName = `${purchaseId}/letter.docx`;
      
      const { error: docxUploadError } = await supabaseClient.storage
        .from("letters")
        .upload(docxFileName, docxBytes, {
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });

      if (docxUploadError) {
        console.error("DOCX upload error:", docxUploadError);
        throw new Error(`Failed to upload DOCX: ${docxUploadError.message}`);
      }

      // Get signed URL for DOCX
      const { data: docxUrlData, error: docxUrlError } = await supabaseClient.storage
        .from("letters")
        .createSignedUrl(docxFileName, 60 * 60 * 24 * 7);

      if (docxUrlError) {
        throw new Error(`Failed to create DOCX signed URL: ${docxUrlError.message}`);
      }

      docxUrl = docxUrlData.signedUrl;
    }

    // Update purchase record with URLs
    const { error: updateError } = await supabaseClient
      .from("letter_purchases")
      .update({
        pdf_url: pdfUrlData.signedUrl,
        docx_url: docxUrl,
      })
      .eq("id", purchaseId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Failed to update purchase: ${updateError.message}`);
    }

    console.log(`Documents generated successfully for purchase ${purchaseId}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfUrlData.signedUrl,
        docxUrl,
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

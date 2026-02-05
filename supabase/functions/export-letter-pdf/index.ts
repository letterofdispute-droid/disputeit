import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Strip HTML tags and convert to plain text
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  // Convert HTML to plain text
  const plainText = htmlToPlainText(letterContent);

  // Process letter content
  const paragraphs = plainText.split('\n\n');

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

    // Use last edited content if available, otherwise original
    const content = purchase.last_edited_content || purchase.letter_content;

    // Generate PDF
    const pdfBytes = await generatePDF(content, purchase.template_name);
    const pdfFileName = `${purchaseId}/letter-export.pdf`;

    // Upload to storage (overwrite if exists)
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

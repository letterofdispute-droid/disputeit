/**
 * Professional PDF Generation Helpers
 * ===================================
 * 
 * Shared utilities for generating professional legal letter PDFs
 */

import { PDFDocument, PDFPage, StandardFonts, rgb, PDFFont } from "https://esm.sh/pdf-lib@1.17.1";

// Colors (neutral, professional)
export const DARK_GRAY = rgb(0.2, 0.2, 0.2);
export const MEDIUM_GRAY = rgb(0.4, 0.4, 0.4);
export const LIGHT_GRAY = rgb(0.6, 0.6, 0.6);
export const SEPARATOR_GRAY = rgb(0.85, 0.85, 0.85);
export const BLACK = rgb(0, 0, 0);

export interface PDFFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export interface DrawTextOptions {
  x: number;
  y: number;
  size?: number;
  font?: PDFFont;
  color?: ReturnType<typeof rgb>;
  maxWidth?: number;
}

/**
 * Load required fonts
 */
export async function loadFonts(pdfDoc: PDFDocument): Promise<PDFFonts> {
  const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  return { regular, bold };
}

/**
 * Word wrap text to fit within a given width
 */
export function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Strip HTML tags and convert to plain text
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
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

/**
 * Clean up any remaining placeholders
 */
export function cleanPlaceholders(content: string): string {
  // Replace unfilled placeholders with [Not Provided] or remove
  return content
    .replace(/\{[^}]+\}/g, '') // Remove unfilled placeholders
    .replace(/\[\s*\]/g, '') // Remove empty brackets
    .replace(/\n{3,}/g, '\n\n') // Clean up extra whitespace
    .trim();
}

/**
 * Draw the letterhead (professional accent line only - no branding)
 */
export function drawLetterhead(
  page: PDFPage,
  fonts: PDFFonts,
  referenceId?: string
): number {
  let yPosition = PAGE_HEIGHT - MARGIN_TOP;
  
  // Reference ID on the right (neutral identifier)
  if (referenceId) {
    const refText = `Ref: ${referenceId}`;
    const refWidth = fonts.regular.widthOfTextAtSize(refText, FONT_SIZE_FOOTER);
    page.drawText(refText, {
      x: PAGE_WIDTH - MARGIN_RIGHT - refWidth,
      y: yPosition,
      size: FONT_SIZE_FOOTER,
      font: fonts.regular,
      color: MEDIUM_GRAY,
    });
  }
  
  yPosition -= 15;
  
  // Professional accent line (neutral dark gray)
  page.drawLine({
    start: { x: MARGIN_LEFT, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition },
    thickness: 1,
    color: DARK_GRAY,
  });
  
  yPosition -= 30;
  
  return yPosition;
}

/**
 * Draw the date (right-aligned)
 */
export function drawDate(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number
): number {
  const dateText = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const dateWidth = fonts.regular.widthOfTextAtSize(dateText, FONT_SIZE_BODY);
  page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN_RIGHT - dateWidth,
    y: yPosition,
    size: FONT_SIZE_BODY,
    font: fonts.regular,
    color: DARK_GRAY,
  });
  
  return yPosition - LINE_HEIGHT * 2;
}

/**
 * Draw sender information block
 */
export function drawSenderBlock(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  senderName?: string,
  senderAddress?: string
): number {
  // Sender name
  if (senderName) {
    page.drawText(senderName, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: FONT_SIZE_BODY,
      font: fonts.regular,
      color: BLACK,
    });
    yPosition -= LINE_HEIGHT;
  }
  
  // Sender address (can be multi-line)
  if (senderAddress) {
    const addressLines = senderAddress.split('\n').filter(l => l.trim());
    for (const line of addressLines) {
      page.drawText(line.trim(), {
        x: MARGIN_LEFT,
        y: yPosition,
        size: FONT_SIZE_BODY,
        font: fonts.regular,
        color: BLACK,
      });
      yPosition -= LINE_HEIGHT;
    }
  }
  
  return yPosition - LINE_HEIGHT;
}

/**
 * Draw delivery method notation
 */
export function drawDeliveryMethod(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  method: string = 'VIA CERTIFIED MAIL\nRETURN RECEIPT REQUESTED'
): number {
  const lines = method.split('\n');
  for (const line of lines) {
    page.drawText(line, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: FONT_SIZE_BODY - 1,
      font: fonts.bold,
      color: DARK_GRAY,
    });
    yPosition -= LINE_HEIGHT;
  }
  return yPosition - LINE_HEIGHT * 0.5;
}

/**
 * Draw recipient block
 */
export function drawRecipientBlock(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  recipientName?: string,
  recipientCompany?: string,
  recipientAddress?: string
): number {
  if (recipientName) {
    page.drawText(recipientName, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: FONT_SIZE_BODY,
      font: fonts.regular,
      color: BLACK,
    });
    yPosition -= LINE_HEIGHT;
  }
  
  if (recipientCompany) {
    page.drawText(recipientCompany, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: FONT_SIZE_BODY,
      font: fonts.regular,
      color: BLACK,
    });
    yPosition -= LINE_HEIGHT;
  }
  
  if (recipientAddress) {
    const addressLines = recipientAddress.split('\n').filter(l => l.trim());
    for (const line of addressLines) {
      page.drawText(line.trim(), {
        x: MARGIN_LEFT,
        y: yPosition,
        size: FONT_SIZE_BODY,
        font: fonts.regular,
        color: BLACK,
      });
      yPosition -= LINE_HEIGHT;
    }
  }
  
  return yPosition - LINE_HEIGHT;
}

/**
 * Draw subject line with underline
 */
export function drawSubjectLine(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  subject: string
): number {
  // "Re:" prefix
  page.drawText('Re: ', {
    x: MARGIN_LEFT,
    y: yPosition,
    size: FONT_SIZE_SUBJECT,
    font: fonts.bold,
    color: BLACK,
  });
  
  const reWidth = fonts.bold.widthOfTextAtSize('Re: ', FONT_SIZE_SUBJECT);
  
  // Subject text (may need to wrap)
  const subjectLines = wrapText(subject, fonts.bold, FONT_SIZE_SUBJECT, CONTENT_WIDTH - reWidth - 20);
  
  for (let i = 0; i < subjectLines.length; i++) {
    page.drawText(subjectLines[i], {
      x: i === 0 ? MARGIN_LEFT + reWidth : MARGIN_LEFT + 25, // Indent continuation lines
      y: yPosition,
      size: FONT_SIZE_SUBJECT,
      font: fonts.bold,
      color: BLACK,
    });
    yPosition -= LINE_HEIGHT;
  }
  
  // Underline
  page.drawLine({
    start: { x: MARGIN_LEFT, y: yPosition + LINE_HEIGHT * 0.3 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition + LINE_HEIGHT * 0.3 },
    thickness: 0.5,
    color: SEPARATOR_GRAY,
  });
  
  return yPosition - LINE_HEIGHT;
}

/**
 * Draw page footer (unbranded - professional legal format)
 */
export function drawFooter(
  page: PDFPage,
  fonts: PDFFonts,
  pageNumber: number,
  totalPages: number,
  referenceId?: string
): void {
  const footerY = MARGIN_BOTTOM - 25;
  
  // Separator line
  page.drawLine({
    start: { x: MARGIN_LEFT, y: footerY + 15 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: footerY + 15 },
    thickness: 0.5,
    color: SEPARATOR_GRAY,
  });
  
  // Page number (centered)
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  const pageTextWidth = fonts.regular.widthOfTextAtSize(pageText, FONT_SIZE_FOOTER);
  page.drawText(pageText, {
    x: (PAGE_WIDTH - pageTextWidth) / 2,
    y: footerY,
    size: FONT_SIZE_FOOTER,
    font: fonts.regular,
    color: MEDIUM_GRAY,
  });
  
  // Reference ID (right)
  if (referenceId) {
    const refText = `Ref: ${referenceId}`;
    const refWidth = fonts.regular.widthOfTextAtSize(refText, FONT_SIZE_FOOTER);
    page.drawText(refText, {
      x: PAGE_WIDTH - MARGIN_RIGHT - refWidth,
      y: footerY,
      size: FONT_SIZE_FOOTER,
      font: fonts.regular,
      color: MEDIUM_GRAY,
    });
  }
  
  // Disclaimer (professional, neutral)
  const disclaimer = "This document is for dispute resolution purposes only and does not constitute legal advice.";
  const disclaimerWidth = fonts.regular.widthOfTextAtSize(disclaimer, FONT_SIZE_FOOTER - 1);
  page.drawText(disclaimer, {
    x: (PAGE_WIDTH - disclaimerWidth) / 2,
    y: footerY - 12,
    size: FONT_SIZE_FOOTER - 1,
    font: fonts.regular,
    color: LIGHT_GRAY,
  });
}

/**
 * Draw body content with proper paragraph handling
 */
export function drawBodyContent(
  page: PDFPage,
  fonts: PDFFonts,
  content: string,
  startY: number,
  pdfDoc: PDFDocument,
  referenceId?: string
): { pages: PDFPage[]; finalY: number } {
  const pages: PDFPage[] = [page];
  let currentPage = page;
  let yPosition = startY;
  
  // Clean content
  const cleanContent = cleanPlaceholders(htmlToPlainText(content));
  
  // Split into paragraphs
  const paragraphs = cleanContent.split('\n\n');
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;
    
    const lines = paragraph.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Check if this is a section header (all caps or specific patterns)
      const isHeader = /^[A-Z][A-Z\s&:]+$/.test(line.trim()) || 
                       /^(BACKGROUND|LEGAL BASIS|REQUESTED RESOLUTION|NOTICE OF FURTHER ACTION|ENCLOSURES)/i.test(line.trim());
      
      const font = isHeader ? fonts.bold : fonts.regular;
      const fontSize = isHeader ? FONT_SIZE_BODY + 1 : FONT_SIZE_BODY;
      
      // Wrap the line
      const wrappedLines = wrapText(line, font, fontSize, CONTENT_WIDTH);
      
      for (const wrappedLine of wrappedLines) {
        // Check if we need a new page
        if (yPosition < MARGIN_BOTTOM + 40) {
          // Add new page
          currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          pages.push(currentPage);
          
          // Continuation pages - just start from top margin (no branding)
          yPosition = PAGE_HEIGHT - MARGIN_TOP;
        }
        
        currentPage.drawText(wrappedLine, {
          x: MARGIN_LEFT,
          y: yPosition,
          size: fontSize,
          font: font,
          color: BLACK,
        });
        yPosition -= LINE_HEIGHT;
      }
      
      // Add spacing after headers
      if (isHeader) {
        yPosition -= LINE_HEIGHT * 0.3;
      }
    }
    
    // Add spacing between paragraphs
    yPosition -= LINE_HEIGHT * 0.5;
  }
  
  return { pages, finalY: yPosition };
}

/**
 * Draw signature block
 */
export function drawSignatureBlock(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  senderName?: string
): number {
  yPosition -= LINE_HEIGHT;
  
  // Closing
  page.drawText('Sincerely,', {
    x: MARGIN_LEFT,
    y: yPosition,
    size: FONT_SIZE_BODY,
    font: fonts.regular,
    color: BLACK,
  });
  
  yPosition -= LINE_HEIGHT * 4; // Space for signature
  
  // Signature line
  page.drawLine({
    start: { x: MARGIN_LEFT, y: yPosition },
    end: { x: MARGIN_LEFT + 200, y: yPosition },
    thickness: 0.5,
    color: DARK_GRAY,
  });
  
  yPosition -= LINE_HEIGHT;
  
  // Printed name
  if (senderName) {
    page.drawText(senderName, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: FONT_SIZE_BODY,
      font: fonts.regular,
      color: BLACK,
    });
    yPosition -= LINE_HEIGHT;
  }
  
  return yPosition;
}

/**
 * Generate a short reference ID (neutral prefix)
 */
export function generateReferenceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'REF-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Draw salutation (professional legal letter format)
 */
export function drawSalutation(
  page: PDFPage,
  fonts: PDFFonts,
  yPosition: number,
  salutation: string = 'Dear Sir/Madam:'
): number {
  page.drawText(salutation, {
    x: MARGIN_LEFT,
    y: yPosition,
    size: FONT_SIZE_BODY,
    font: fonts.regular,
    color: BLACK,
  });
  
  return yPosition - LINE_HEIGHT * 1.5;
}

import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// Configuration for name placement
// Adjust these values to fit your specific certificate template
const CONFIG = {
  fontSize: 60, // Default font size
  minFontSize: 28, // Floor for dynamic down-scaling for very long names
  yOffset: 0, // Offset from center. Positive = up, Negative = down.
  color: rgb(0.27, 0.54, 0.97), // GDG Blue accent #4589f8
  qrSize: 100, // Size of QR code
  qrBottomOffset: 60, // Distance from bottom
};

// In-memory cache for custom font bytes to eliminate disk I/O per attendee
let cachedFontBytes: Buffer | null = null;

function getFontBytes(): Buffer {
  if (!cachedFontBytes) {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf');
    cachedFontBytes = fs.readFileSync(fontPath);
  }
  return cachedFontBytes;
}

export async function generateCertificate(
  name: string,
  templateBytes: Uint8Array,
  ticketId: string
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // Load Custom Font from in-memory cache
    const fontBytes = getFontBytes();
    const font = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Auto-scale font size dynamically if the attendee's name is exceptionally long
    let effectiveFontSize = CONFIG.fontSize;
    let textWidth = font.widthOfTextAtSize(name, effectiveFontSize);
    const maxWidth = width * 0.76; // Leave generous 12% margins on left and right

    if (textWidth > maxWidth) {
      effectiveFontSize = Math.max(
        CONFIG.minFontSize,
        Math.floor(effectiveFontSize * (maxWidth / textWidth))
      );
      textWidth = font.widthOfTextAtSize(name, effectiveFontSize);
    }

    // Calculate position
    const x = (width - textWidth) / 2;
    const y = height / 2 - 30 + CONFIG.yOffset;

    // Draw text
    firstPage.drawText(name, {
      x: x,
      y: y,
      size: effectiveFontSize,
      font: font,
      color: CONFIG.color,
    });

    // Generate Crisp HD QR Code (without double slashes)
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gdg-cert-app.vercel.app';
    const cleanAppUrl = rawAppUrl.replace(/\/+$/, '');
    const verifyUrl = `${cleanAppUrl}/verify/${encodeURIComponent(ticketId.trim())}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: CONFIG.qrSize * 2,
      errorCorrectionLevel: 'M',
    });
    const qrImage = await pdfDoc.embedPng(qrDataUrl);

    // Draw QR Code at bottom center
    const qrX = (width - CONFIG.qrSize) / 2;
    const qrY = CONFIG.qrBottomOffset;

    firstPage.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: CONFIG.qrSize,
      height: CONFIG.qrSize,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

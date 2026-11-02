import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateCertificate } from '@/lib/pdf-generator';
import { getTemplateBytes } from '@/lib/template-cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTicketId = searchParams.get('ticketId');

  if (!rawTicketId || !rawTicketId.trim()) {
    return NextResponse.json({ error: 'Ticket Order ID is required.' }, { status: 400 });
  }

  const cleanTicketId = rawTicketId.trim();

  try {
    // 1. Fast indexed lookup by exact ticketId
    let attendee = await prisma.attendee.findUnique({
      where: { ticketId: cleanTicketId },
    });

    // 2. Fast uppercase lookup fallback
    if (!attendee && cleanTicketId.toUpperCase() !== cleanTicketId) {
      attendee = await prisma.attendee.findUnique({
        where: { ticketId: cleanTicketId.toUpperCase() },
      });
    }

    // 3. Fallback to case-insensitive lookup
    if (!attendee) {
      attendee = await prisma.attendee.findFirst({
        where: {
          ticketId: {
            equals: cleanTicketId,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!attendee) {
      return NextResponse.json(
        {
          error:
            'It seems you did not check-in at the event, so no certificate was found. Please enter a valid ticket order ID.',
        },
        { status: 404 }
      );
    }

    // 4. Retrieve cached template bytes (avoids multi-megabyte DB roundtrip per request)
    const templateBytes = await getTemplateBytes();

    // 5. Generate PDF with dynamic auto-scaled font sizing and crisp QR
    const pdfBytes = await generateCertificate(attendee.name, templateBytes, attendee.ticketId);

    // 6. Return response with caching headers
    const safeFilename = attendee.name.trim().replace(/\s+/g, '_') || 'Attendee';
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="GDG_Certificate_${safeFilename}.pdf"`,
        'Cache-Control': 'private, no-transform, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while generating certificate.', details: String(error) },
      { status: 500 }
    );
  }
}

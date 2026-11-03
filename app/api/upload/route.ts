import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';
import { invalidateTemplateCache, setTemplateBytes, getTemplateInfo } from '@/lib/template-cache';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const info = await getTemplateInfo();
    return NextResponse.json({ success: true, info });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get template info', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized. Please login as admin.' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. JSON Payload: Confirmed Commit of Pre-validated Attendee Rows
    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.action === 'commit' && Array.isArray(body.entries)) {
        const entries: { ticketId: string; name: string }[] = body.entries;
        if (entries.length === 0) {
          return NextResponse.json({ error: 'No attendee entries provided to import.' }, { status: 400 });
        }

        // Determine which are new and which are updates for reporting
        const allTicketIds = entries.map((e) => e.ticketId);
        const existingAttendees = await prisma.attendee.findMany({
          where: { ticketId: { in: allTicketIds } },
          select: { ticketId: true },
        });
        const existingSet = new Set(existingAttendees.map((a) => a.ticketId));

        let newCount = 0;
        let updateCount = 0;
        entries.forEach((e) => {
          if (existingSet.has(e.ticketId)) updateCount++;
          else newCount++;
        });

        // Chunked Upsert in Batches of 50
        const BATCH_SIZE = 50;
        let processedCount = 0;

        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
          const batch = entries.slice(i, i + BATCH_SIZE);
          await prisma.$transaction(
            batch.map((entry) =>
              prisma.attendee.upsert({
                where: { ticketId: entry.ticketId },
                update: { name: entry.name },
                create: { ticketId: entry.ticketId, name: entry.name },
              })
            )
          );
          processedCount += batch.length;
        }

        return NextResponse.json({
          success: true,
          message: `Successfully imported ${processedCount} attendees (${newCount} new, ${updateCount} updated).`,
          count: processedCount,
          newCount,
          updateCount,
        });
      }
    }

    // 2. FormData: File Upload (Preview or Direct)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const template = formData.get('template') as File | null;
    const isPreview = req.nextUrl.searchParams.get('preview') === 'true' || formData.get('preview') === 'true';

    const hasFile = Boolean(file && typeof file.size === 'number' && file.size > 0);
    const hasTemplate = Boolean(template && typeof template.size === 'number' && template.size > 0);

    if (!hasFile && !hasTemplate) {
      return NextResponse.json(
        { error: 'No valid file received. Please choose an Excel/CSV file or a PDF template.' },
        { status: 400 }
      );
    }

    const messages: string[] = [];

    // Process Certificate PDF Template
    if (hasTemplate && template) {
      const bytes = await template.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Verify PDF Header Magic Bytes (%PDF-)
      const header = buffer.subarray(0, 5).toString('ascii');
      if (!header.startsWith('%PDF')) {
        return NextResponse.json(
          { error: 'Invalid file format: Uploaded template must be a valid PDF document.' },
          { status: 400 }
        );
      }

      const base64Template = buffer.toString('base64');

      // Persist to database Config table
      await prisma.config.upsert({
        where: { key: 'template_data' },
        update: { value: base64Template },
        create: { key: 'template_data', value: base64Template },
      });

      // Also persist to filesystem fallback in public/uploads
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, 'certificate_template.pdf'), buffer);
      } catch (fsErr) {
        console.warn('Could not write template to filesystem fallback:', fsErr);
      }

      // Update in-memory cache immediately
      setTemplateBytes(new Uint8Array(buffer));
      invalidateTemplateCache();

      const sizeKb = (buffer.length / 1024).toFixed(1);
      messages.push(`Certificate template updated successfully (${sizeKb} KB).`);
    }

    // Process Excel / CSV Attendees File
    if (hasFile && file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      // In-memory map to deduplicate records in the spreadsheet
      const attendeeMap = new Map<string, string>(); // ticketId -> formattedName
      let skippedCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) {
          if (row && row.length > 0) skippedCount++;
          continue;
        }

        const rawTicket = row[0]?.toString().trim();
        const rawName = row[1]?.toString().trim();

        if (!rawTicket || !rawName) {
          skippedCount++;
          continue;
        }

        // Skip table headers like "Ticket ID", "Order ID", "Name", "Attendee"
        const lowerTicket = rawTicket.toLowerCase();
        const lowerName = rawName.toLowerCase();
        if (
          lowerTicket.includes('ticket') ||
          lowerTicket.includes('order') ||
          lowerTicket.includes('id') ||
          lowerName === 'name' ||
          lowerName.includes('attendee') ||
          lowerName.includes('participant')
        ) {
          skippedCount++;
          continue;
        }

        const ticketId = rawTicket.toUpperCase().replace(/\s+/g, '');
        // Convert to clean Title Case
        const formattedName = rawName
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        if (ticketId && formattedName) {
          attendeeMap.set(ticketId, formattedName);
        } else {
          skippedCount++;
        }
      }

      const attendeeEntries = Array.from(attendeeMap.entries()).map(([ticketId, name]) => ({
        ticketId,
        name,
      }));

      if (attendeeEntries.length === 0) {
        if (!hasTemplate) {
          return NextResponse.json(
            { error: 'No valid attendee records found in the uploaded spreadsheet.' },
            { status: 400 }
          );
        }
      } else {
        // Find existing attendees in database to mark which are New vs Update
        const allTicketIds = attendeeEntries.map((e) => e.ticketId);
        const existingAttendees = await prisma.attendee.findMany({
          where: { ticketId: { in: allTicketIds } },
          select: { ticketId: true, name: true },
        });
        const existingMap = new Map(existingAttendees.map((a) => [a.ticketId, a.name]));

        const newCount = attendeeEntries.filter((e) => !existingMap.has(e.ticketId)).length;
        const updateCount = attendeeEntries.filter((e) => existingMap.has(e.ticketId)).length;

        // IF PREVIEW REQUESTED: Return preview stats and rows WITHOUT committing to database
        if (isPreview) {
          return NextResponse.json({
            success: true,
            preview: true,
            fileName: file.name,
            fileSizeBytes: file.size,
            totalCount: attendeeEntries.length,
            newCount,
            updateCount,
            skippedCount,
            previewRows: attendeeEntries.slice(0, 30).map((e) => ({
              ticketId: e.ticketId,
              name: e.name,
              isNew: !existingMap.has(e.ticketId),
              existingName: existingMap.get(e.ticketId) || null,
            })),
            allRows: attendeeEntries,
          });
        }

        // DIRECT UPLOAD (no preview requested): Chunked Upsert in Batches of 50
        const BATCH_SIZE = 50;
        let processedCount = 0;

        for (let i = 0; i < attendeeEntries.length; i += BATCH_SIZE) {
          const batch = attendeeEntries.slice(i, i + BATCH_SIZE);

          await prisma.$transaction(
            batch.map((entry) =>
              prisma.attendee.upsert({
                where: { ticketId: entry.ticketId },
                update: { name: entry.name },
                create: { ticketId: entry.ticketId, name: entry.name },
              })
            )
          );

          processedCount += batch.length;
        }

        messages.push(`Synced ${processedCount} attendees (${newCount} new, ${updateCount} updated).`);
      }
    }

    return NextResponse.json({
      message: messages.join(' '),
      success: true,
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while processing upload.', details: String(error) },
      { status: 500 }
    );
  }
}

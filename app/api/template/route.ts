import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTemplateBytes, setTemplateBytes, invalidateTemplateCache, getTemplateInfo } from '@/lib/template-cache';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const download = searchParams.get('download') === 'true' || searchParams.get('preview') === 'true';

  try {
    if (download) {
      const templateBytes = await getTemplateBytes();
      return new NextResponse(Buffer.from(templateBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="active_certificate_template.pdf"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const info = await getTemplateInfo();
    return NextResponse.json({ success: true, info });
  } catch (error) {
    console.error('Failed to retrieve template:', error);
    return NextResponse.json({ error: 'Failed to retrieve template.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const template = formData.get('template') as File | null;

    if (!template || typeof template.size !== 'number' || template.size === 0) {
      return NextResponse.json({ error: 'Please select a valid PDF template file.' }, { status: 400 });
    }

    const bytes = await template.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify PDF Magic Bytes (%PDF-)
    const header = buffer.subarray(0, 5).toString('ascii');
    if (!header.startsWith('%PDF')) {
      return NextResponse.json(
        { error: 'Invalid file format: Uploaded file is not a valid PDF document.' },
        { status: 400 }
      );
    }

    const base64Template = buffer.toString('base64');

    // Save to database
    await prisma.config.upsert({
      where: { key: 'template_data' },
      update: { value: base64Template },
      create: { key: 'template_data', value: base64Template },
    });

    // Save to filesystem fallback in public/uploads
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, 'certificate_template.pdf'), buffer);
    } catch (fsErr) {
      console.warn('Could not write template to filesystem fallback:', fsErr);
    }

    // Invalidate and refresh cache
    setTemplateBytes(new Uint8Array(buffer));
    invalidateTemplateCache();

    const sizeKb = (buffer.length / 1024).toFixed(1);

    return NextResponse.json({
      success: true,
      message: `Certificate template updated successfully (${sizeKb} KB)!`,
      sizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload and save template.', details: String(error) },
      { status: 500 }
    );
  }
}


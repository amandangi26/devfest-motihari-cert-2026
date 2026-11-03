import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

// Helper to check auth
async function isAuthenticated() {
    const cookieStore = await cookies();
    return cookieStore.get('admin_session')?.value === 'true';
}

export async function GET(req: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const attendees = await prisma.attendee.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const count = await prisma.attendee.count();

        return NextResponse.json({ attendees, count });
    } catch (error: any) {
        console.error('Failed to fetch attendees:', error);
        const rawUrl = process.env.DATABASE_URL || '';
        const isDirectSupabase = rawUrl.includes('.supabase.co:5432');
        const isCantReach = error?.message?.includes("Can't reach database server");
        const isPreparedStatementError = error?.message?.includes('prepared statement') || error?.message?.includes('42P05');

        let hint = 'Please verify DATABASE_URL in your environment variables.';
        if (isPreparedStatementError) {
            hint = 'PgBouncer / Supabase Transaction Pooler: Port 6543 requires "?pgbouncer=true" in DATABASE_URL, or switch port 6543 to 5432 (Session Mode).';
        } else if (isDirectSupabase && isCantReach) {
            hint = 'Direct Supabase connection (.supabase.co:5432) is IPv6-only and unsupported by Vercel serverless functions. Switch your DATABASE_URL in Vercel to the Supabase Connection Pooler URL (aws-0-...pooler.supabase.com:6543?pgbouncer=true).';
        }

        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error?.message || 'Failed to query database.',
                hint,
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, ticketId } = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'Attendee Name is required.' }, { status: 400 });
        }

        if (!ticketId || typeof ticketId !== 'string' || !ticketId.trim()) {
            return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
        }

        const cleanName = name.trim();
        const cleanTicketId = ticketId.trim().toUpperCase().replace(/\s+/g, '');

        // Upsert attendee: create if not exists, update name if already exists
        const attendee = await prisma.attendee.upsert({
            where: { ticketId: cleanTicketId },
            update: { name: cleanName },
            create: {
                name: cleanName,
                ticketId: cleanTicketId,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Attendee "${cleanName}" (${cleanTicketId}) saved successfully.`,
            attendee,
        });
    } catch (error) {
        console.error('Failed to save attendee manually:', error);
        return NextResponse.json(
            { error: 'Internal Server Error while saving attendee.' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deleteAll = searchParams.get('all') === 'true';
    const id = searchParams.get('id');

    // 1. Purge / Delete all attendees
    if (deleteAll) {
        try {
            const result = await prisma.attendee.deleteMany({});
            return NextResponse.json({
                success: true,
                message: `Successfully deleted all ${result.count} attendee records.`,
                count: result.count,
            });
        } catch (error) {
            console.error('Failed to delete all attendees:', error);
            return NextResponse.json(
                { error: 'Failed to delete all attendees.' },
                { status: 500 }
            );
        }
    }

    // 2. Delete single attendee by ID
    if (!id) {
        return NextResponse.json({ error: 'Attendee ID or all=true parameter is required' }, { status: 400 });
    }

    try {
        await prisma.attendee.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete attendee' }, { status: 500 });
    }
}

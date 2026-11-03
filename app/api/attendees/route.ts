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
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
            return NextResponse.json({ error: 'Ticket Order ID is required.' }, { status: 400 });
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

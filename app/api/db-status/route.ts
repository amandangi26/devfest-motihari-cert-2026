import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin_session')?.value === 'true';

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const isDirectSupabase = rawUrl.includes('.supabase.co:5432');
  
  // Safe sanitized host extraction (no credentials exposed)
  let safeHost = 'Not configured';
  try {
    const hostMatch = rawUrl.match(/@([^:\/]+)(?::(\d+))?/);
    if (hostMatch) {
      safeHost = `${hostMatch[1]}${hostMatch[2] ? `:${hostMatch[2]}` : ''}`;
    }
  } catch {
    safeHost = 'Configured';
  }

  const startTime = Date.now();

  try {
    const attendeeCount = await prisma.attendee.count();
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'connected',
      latencyMs,
      host: safeHost,
      attendeeCount,
      isDirectSupabase,
      warning: isDirectSupabase
        ? 'Using direct connection (.supabase.co:5432). If hosting on Vercel, this direct connection can fail because direct Supabase connections are IPv6-only and Vercel functions only support IPv4. We strongly recommend using the Supabase Connection Pooler URL (aws-0-...pooler.supabase.com:6543).'
        : null,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Database connection test failed:', error);

    const errorMessage = error?.message || 'Failed to connect to database.';
    const isCantReach = errorMessage.includes("Can't reach database server") || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED');
    const isPreparedStatementError = errorMessage.includes('prepared statement') || errorMessage.includes('42P05');

    let hint = 'Please check your DATABASE_URL in Vercel project settings and ensure credentials are correct and database is active.';
    if (isPreparedStatementError) {
      hint = 'PgBouncer / Supavisor Transaction Pooler collision: Port 6543 does not support named prepared statements. Please append "?pgbouncer=true" to your DATABASE_URL in Vercel, or switch port 6543 to 5432 (Session Mode).';
    } else if (isDirectSupabase && isCantReach) {
      hint = 'Vercel Serverless IPv6 Incompatibility Detected: Your DATABASE_URL uses db.<project-ref>.supabase.co:5432 (direct connection), which only supports IPv6. Vercel functions cannot route outbound IPv6. In your Vercel Dashboard, replace DATABASE_URL with the Supabase Connection Pooler URL (Transaction Mode port 6543 with ?pgbouncer=true).';
    }

    return NextResponse.json(
      {
        status: 'error',
        latencyMs,
        host: safeHost,
        error: errorMessage,
        isDirectSupabase,
        hint,
      },
      { status: 500 }
    );
  }
}


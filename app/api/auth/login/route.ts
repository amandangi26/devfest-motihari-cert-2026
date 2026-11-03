import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        // Strict rate limit: 5 login attempts per 5 minutes per IP
        const ip = getClientIp(request);
        const limitResult = checkRateLimit(`auth-route:${ip}`, {
            windowMs: 5 * 60 * 1000,
            max: 5,
            message: 'Too many login attempts. Please wait 5 minutes before trying again.',
        });

        if (!limitResult.success) {
            return NextResponse.json(
                { error: limitResult.message },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(limitResult.resetSeconds),
                        'X-RateLimit-Limit': String(limitResult.limit),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        const { email, password } = await request.json();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('Admin credentials not set in environment variables');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Simple string comparison - safe from injection as we are not using a DB query here
        if (email === adminEmail && password === adminPassword) {
            // Set a session cookie
            const cookieStore = await cookies();
            cookieStore.set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

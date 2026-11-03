import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. API Rate Limiting
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(request);

    // Differentiate limits by endpoint sensitivity
    let windowMs = 60 * 1000; // 1 minute
    let max = 60; // 60 req/min for general API
    let keyPrefix = 'api';
    let customMessage = 'Too many requests. Please slow down and try again.';

    if (pathname === '/api/auth/login') {
      // Strict protection against credential brute-forcing
      windowMs = 5 * 60 * 1000; // 5 minutes
      max = 5; // 5 attempts per 5 minutes
      keyPrefix = 'auth-login';
      customMessage = 'Too many login attempts. Please wait 5 minutes before trying again.';
    } else if (pathname === '/api/certificate') {
      // Protect PDF rendering and QR generation
      windowMs = 60 * 1000; // 1 minute
      max = 25; // 25 certificates per minute
      keyPrefix = 'cert';
      customMessage = 'Too many certificate requests. Please wait a moment before trying again.';
    } else if (pathname === '/api/upload') {
      // Protect bulk file uploads
      windowMs = 5 * 60 * 1000; // 5 minutes
      max = 10; // 10 uploads per 5 minutes
      keyPrefix = 'upload';
      customMessage = 'Too many file uploads. Please wait before uploading again.';
    }

    const rateLimit = checkRateLimit(`${keyPrefix}:${ip}`, {
      windowMs,
      max,
      message: customMessage,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: rateLimit.message,
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetSeconds));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, ShieldAlert } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console or error tracking service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#111111] font-sans flex flex-col justify-between selection:bg-[#EA4335] selection:text-white">
      {/* Top Header */}
      <header className="w-full bg-[#FFFBF0]/95 backdrop-blur-md border-b-[2.5px] border-black sticky top-0 z-50">
        <div className="google-stripe" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
            <img
              src="/GDG_Logo.svg"
              alt="GDG Logo"
              className="h-6 sm:h-7 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="font-black text-[16px] sm:text-[19px] md:text-[20px] tracking-tight text-black group-hover:text-gdgBlue transition-colors uppercase whitespace-nowrap">
              GDG CLOUD MOTIHARI
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-[#EA4335] text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] select-none">
            <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>System Alert</span>
          </span>
        </div>
      </header>

      {/* Main Error Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 bg-grid-pattern relative">
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Neo-brutalist Error Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] border-[3px] border-black p-6 sm:p-10 shadow-[6px_6px_0_0_#000] relative overflow-hidden">
            
            {/* Warning Badge */}
            <div className="w-16 h-16 rounded-full border-[3px] border-black bg-[#FBBC05] text-[#111111] flex items-center justify-center mx-auto shadow-[3.5px_3.5px_0_0_#000] mb-6">
              <AlertTriangle className="w-9 h-9 stroke-[2.5] text-black" />
            </div>

            {/* Error Code & Headline */}
            <div className="inline-block px-3 py-1 rounded-full border-2 border-black bg-[#FFFBF0] text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] mb-4">
              500 • Internal Application Error
            </div>

            <h1 className="font-black text-2xl sm:text-3xl text-black uppercase tracking-tight mb-3">
              Something went wrong!
            </h1>
            
            <p className="text-sm sm:text-base text-black/70 font-semibold leading-relaxed max-w-md mx-auto mb-6">
              An unexpected error occurred while loading this page. Certificate records and database integrity remain completely secure.
            </p>

            {/* Error Digest (if available) */}
            {error?.digest && (
              <div className="mb-6 p-3 rounded-xl border-2 border-black bg-[#FFF8E7] text-left font-mono text-xs text-black/80 break-all shadow-[2px_2px_0_0_#000]">
                <span className="font-bold uppercase text-black block mb-1">Error Digest:</span>
                <code>{error.digest}</code>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-black bg-[#FBBC05] text-[#111111] font-black text-sm uppercase tracking-wider shadow-[3.5px_3.5px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Try Again</span>
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-black bg-[#4285F4] text-white font-black text-sm uppercase tracking-wider shadow-[3.5px_3.5px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] transition-all"
              >
                <Home className="w-4 h-4 stroke-[2.5]" />
                <span>Return to Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Neo-brutalist Footer */}
      <footer className="w-full bg-[#111111] text-white border-t-2 border-black py-4 px-4 text-center">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
          <p>© 2026 GDG CLOUD MOTIHARI • DevFest 2026</p>
          <p className="font-semibold text-white/50">Official Certificate Verification System</p>
        </div>
      </footer>
    </div>
  );
}


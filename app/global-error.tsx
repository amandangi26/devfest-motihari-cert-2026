'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Critical Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FFFBF0] text-[#111111] font-sans flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md text-center bg-white rounded-[24px] border-[3px] border-black p-8 shadow-[6px_6px_0_0_#000]">
          <div className="w-16 h-16 rounded-full border-[3px] border-black bg-[#EA4335] text-white flex items-center justify-center mx-auto shadow-[3px_3px_0_0_#000] mb-5">
            <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full border-2 border-black bg-[#FBBC05] text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] mb-4">
            Critical System Error
          </span>

          <h1 className="font-black text-2xl uppercase tracking-tight text-black mb-2">
            GDG CLOUD MOTIHARI
          </h1>

          <p className="text-sm text-black/70 font-semibold mb-6">
            A critical error occurred while rendering the portal. Please refresh or retry.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-black bg-[#4285F4] text-white font-black text-sm uppercase tracking-wider shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}

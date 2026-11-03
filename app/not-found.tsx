import Link from 'next/link';
import { Home, ArrowLeft, Search, Award, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#111111] font-sans flex flex-col justify-between selection:bg-[#FBBC05] selection:text-black">
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

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-[#FBBC05] text-[#111] font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] select-none">
            <Award className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>DevFest 2026</span>
          </span>
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 bg-grid-pattern relative">
        <div className="w-full max-w-xl mx-auto text-center">
          {/* Neo-brutalist Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] border-[3px] border-black p-6 sm:p-10 shadow-[6px_6px_0_0_#000] relative overflow-hidden">
            
            {/* Top decorative badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#EA4335] text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] mb-6">
              <FileQuestion className="w-4 h-4 stroke-[2.5]" />
              <span>Error 404 • Page Not Found</span>
            </div>

            {/* Huge 404 Graphic Number */}
            <div className="relative mb-6 select-none">
              <span className="font-black text-7xl sm:text-9xl tracking-tighter text-[#111111] drop-shadow-[4px_4px_0_#FBBC05]">
                404
              </span>
            </div>

            {/* Headline and Description */}
            <h1 className="font-black text-2xl sm:text-3xl text-black uppercase tracking-tight mb-3">
              Route Lost in Cloud Space!
            </h1>
            <p className="text-sm sm:text-base text-black/70 font-semibold leading-relaxed max-w-md mx-auto mb-8">
              The page you are looking for doesn&apos;t exist, was moved, or the link may have been mistyped.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-black bg-[#4285F4] text-white font-black text-sm uppercase tracking-wider shadow-[3.5px_3.5px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] transition-all"
              >
                <Home className="w-4 h-4 stroke-[2.5]" />
                <span>Return to Portal</span>
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-black bg-[#34A853] text-white font-black text-sm uppercase tracking-wider shadow-[3.5px_3.5px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Find Certificate</span>
              </Link>
            </div>

            {/* Helpful Helper note */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-black/20 text-xs text-black/60 font-semibold">
              Looking to verify a participant certificate? Make sure the URL includes a valid Booking ID.
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


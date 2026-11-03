'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Award,
  ShieldCheck,
  FileText,
  Printer,
  ImageIcon,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

interface PdfPage {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: unknown;
  }) => { promise: Promise<void> };
}

interface PdfDocument {
  getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (url: string) => { promise: Promise<PdfDocument> };
}

interface CustomWindow extends Window {
  pdfjsLib?: PdfJsLib;
}

export default function Home() {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [verifiedTicketId, setVerifiedTicketId] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Check URL parameters for ticketId (e.g. ?ticketId=8131XXXX)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTicket = params.get('ticketId');
      if (urlTicket) {
        setTicketId(urlTicket);
        fetchCertificate(urlTicket);
      }
    }
  }, []);

  const fetchCertificate = async (idToSearch: string) => {
    const trimmedId = idToSearch.trim().toUpperCase();
    if (!trimmedId) return;

    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }

    setLoading(true);
    setError('');
    setDownloadUrl(null);
    setAttendeeName('');
    setVerifiedTicketId('');

    try {
      const res = await fetch(`/api/certificate?ticketId=${encodeURIComponent(trimmedId)}`);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setVerifiedTicketId(trimmedId);

        const disposition = res.headers.get('Content-Disposition');
        let filename = 'Certificate.pdf';
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/"/g, '');
        }
        const parsedName = filename
          .replace('GDG_Certificate_', '')
          .replace('.pdf', '')
          .replace(/_/g, ' ');
        setAttendeeName(parsedName);

        // Smooth scroll to preview on mobile/desktop
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
      } else {
        const data = await res.json();
        setError(
          data.error ||
          'It seems you did not check-in at the event, so no certificate was found. Please enter a valid Booking ID.'
        );
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while generating your certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificate(ticketId);
  };

  // Convert PDF to PNG using PDF.js via client-side dynamic load
  const handleDownloadPng = async () => {
    if (!downloadUrl) return;
    setDownloadingPng(true);

    try {
      const customWindow = window as unknown as CustomWindow;

      // Ensure pdfjsLib is loaded in window
      if (!customWindow.pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            const pdfjs = customWindow.pdfjsLib;
            if (pdfjs) {
              pdfjs.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve();
            } else {
              reject(new Error('PDF.js failed to initialize'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load PDF.js script'));
          document.head.appendChild(script);
        });
      }

      const pdfjs = customWindow.pdfjsLib;
      if (!pdfjs) throw new Error('PDF.js not available');

      const loadingTask = pdfjs.getDocument(downloadUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      // Render at 2.5x resolution for ultra-sharp HD PNG
      const scale = 2.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        const safeName = attendeeName.trim().replace(/\s+/g, '_') || 'Attendee';
        link.download = `GDG_Cloud_Motihari_Certificate_${safeName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.warn('PNG rendering fallback to PDF download:', err);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeName = attendeeName.trim().replace(/\s+/g, '_') || 'Attendee';
      link.download = `GDG_Cloud_Motihari_Certificate_${safeName}.pdf`;
      link.click();
    } finally {
      setDownloadingPng(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern text-[#111111] font-sans flex flex-col selection:bg-[#FBBC05] selection:text-black relative overflow-x-hidden">
      {/* Official Main Website Navbar & Announcement Marquee */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-16 space-y-10 relative z-10">
        {/* Clean Hero Section */}
        <div className="text-center space-y-5 max-w-3xl mx-auto pt-2">
          {/* Kicker Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 rounded-full border-2 border-black bg-white shadow-[3px_3px_0_0_#000]">
            <div className="w-5 h-5 rounded-full border border-black/20 bg-[#4285F4]/15 text-[#4285F4] flex items-center justify-center">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-black text-xs uppercase tracking-[0.08em] text-[#111]">
              GDG CLOUD MOTIHARI CREDENTIALS
            </span>
          </div>

          {/* Heading with Yellow Capsule Pill */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-[#111] leading-[1.1] sm:leading-[1.15] flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span>Download Your</span>
            <span className="inline-block px-6 sm:px-10 py-1 sm:py-2.5 rounded-full border-[3px] sm:border-4 border-black bg-[#FBBC05] text-[#111] shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] transform -rotate-1 hover:rotate-0 transition-all select-none">
              Certificate
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base font-medium text-[#444] leading-relaxed max-w-2xl mx-auto">
            Verify your check-in and download your authenticated GDG CLOUD MOTIHARI Certificate of Participation.
          </p>
        </div>

        {/* Neo-Brutalist Main Card & Search */}
        <div className="max-w-2xl mx-auto relative">
          <div className="rounded-[24px] sm:rounded-[28px] border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-6 relative overflow-hidden">
            {/* Step & Status Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b-2 border-black/10">
              <span className="text-xs font-black uppercase text-[#4285F4] tracking-[0.08em] flex items-center gap-1.5">
                <span>STEP 1 — ENTER BOOKING ID</span>
              </span>
              <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border border-black bg-[#E6F4EA] text-[#137333] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Portal
              </span>
            </div>

            {/* Card Heading */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111]">
                Find Your Official Credential
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#555] leading-relaxed">
                Enter your Booking ID from your registration confirmation or badge (e.g.{' '}
                <span className="font-mono font-bold text-[#111]">8131XXXX</span>).
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="ticketIdInput"
                  className="block text-xs font-black uppercase tracking-wider text-[#111]"
                >
                  Booking ID
                </label>
                <div className="relative">
                  <input
                    id="ticketIdInput"
                    type="text"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="e.g. 8131XXXX"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-black bg-white font-mono text-sm font-bold text-[#111] placeholder:text-[#999] shadow-[2.5px_2.5px_0_0_#000] focus:border-[#4285F4] focus:shadow-[3px_3px_0_0_#4285F4] outline-none transition-all uppercase"
                    required
                  />
                  <Search className="w-5 h-5 text-black absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Neo-Brutalist Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#4285F4] hover:bg-[#1a73e8] text-white font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                    <span>Verifying Credential...</span>
                  </>
                ) : (
                  <>
                    <span>Generate & View Certificate</span>
                  </>
                )}
              </button>
            </form>

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl border-2 border-black bg-[#FCE8E6] p-4 text-[#111] shadow-[3px_3px_0_0_#000] space-y-1">
                <div className="flex items-center gap-2 text-[#C5221F] font-black text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Ticket Not Found</span>
                </div>
                <p className="text-xs font-semibold text-[#444] leading-relaxed pl-6">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Found & Live Preview Section */}
        {downloadUrl && (
          <div ref={previewRef} className="max-w-4xl mx-auto space-y-6">
            {/* Verification Badge Card */}
            <div className="rounded-[24px] sm:rounded-[28px] border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-5 relative">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-black bg-[#34A853] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-[#34A853] tracking-wider block">
                      VERIFICATION SUCCESSFUL
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111]">
                      {attendeeName || 'Verified Attendee'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full border border-black bg-[#E6F4EA] text-[#137333] font-mono text-xs font-bold shadow-[1.5px_1.5px_0_0_#000]">
                    {verifiedTicketId}
                  </span>
                  <Link
                    href={`/verify/${encodeURIComponent(verifiedTicketId)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-black bg-white hover:bg-[#FFF8E7] text-[#111] font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] transition-all"
                  >
                    <span>Audit Page</span>
                  </Link>
                </div>
              </div>

              {/* Verified Details Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-black/20 bg-[#FFF8E7] p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#555] block">
                    Event
                  </span>
                  <span className="text-xs font-black text-[#111] block mt-0.5">
                    GDG CLOUD MOTIHARI
                  </span>
                </div>
                <div className="rounded-xl border border-black/20 bg-[#FFF8E7] p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#555] block">
                    Organizer
                  </span>
                  <span className="text-xs font-black text-[#111] block mt-0.5">
                    GDG Cloud Motihari
                  </span>
                </div>
                <div className="rounded-xl border border-black/20 bg-[#FFF8E7] p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#555] block">
                    Credential Status
                  </span>
                  <span className="text-xs font-black text-[#34A853] flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Authentic
                  </span>
                </div>
              </div>

              {/* Certificate Preview Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#111] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#4285F4]" />
                    Official Certificate Preview
                  </span>
                  <span className="text-[11px] font-bold text-[#666]">
                    Interactive Live PDF Document
                  </span>
                </div>

                {/* Neo-Brutalist Frame around Preview */}
                <div className="rounded-[20px] border-[3px] border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
                  {/* Brutalist Title Bar */}
                  <div className="bg-[#FFFBF0] border-b-2 border-black px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border border-black bg-[#EA4335]" />
                      <div className="w-3 h-3 rounded-full border border-black bg-[#FBBC05]" />
                      <div className="w-3 h-3 rounded-full border border-black bg-[#34A853]" />
                    </div>
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#111]">
                      GDG_CLOUD_MOTIHARI_{attendeeName.replace(/\s+/g, '_') || 'CERTIFICATE'}.PDF
                    </span>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-black uppercase text-[#4285F4] hover:underline flex items-center gap-1"
                    >
                      <span>Pop-Out</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* PDF Viewer Frame */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-[1.414/1] max-h-[520px] bg-[#EFEFEF]">
                    <iframe
                      src={`${downloadUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="GDG Cloud Motihari Certificate Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Download & Action Buttons Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Primary Download Button: PDF */}
                  <a
                    href={downloadUrl}
                    download={`GDG_Cloud_Motihari_Certificate_${attendeeName.trim().replace(/\s+/g, '_') || 'Attendee'}.pdf`}
                    className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-[#34A853] hover:bg-[#2d9147] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] active:shadow-none transition-all cursor-pointer select-none"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Download PDF (Official)</span>
                  </a>

                  {/* Secondary Download Button: PNG */}
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={downloadingPng}
                    className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-[#4285F4] hover:bg-[#1a73e8] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] active:shadow-none transition-all cursor-pointer select-none disabled:opacity-60"
                  >
                    {downloadingPng ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>Rendering PNG...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>Download PNG (HD Image)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Print / Open Button */}
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-[#FFF8E7] text-[#111] font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[2.5px_2.5px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-y-[2.5px] transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Certificate</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Official Credential Notice Badge */}
        <div className="max-w-2xl mx-auto rounded-xl border border-black/15 bg-blue-50/60 p-3.5 flex items-center justify-center text-center text-xs font-bold text-[#3B4A60] shadow-[2px_2px_0_0_#000]">
          <span>
            Official Credential Issued by: <strong>GDG CLOUD MOTIHARI</strong>
          </span>
        </div>

        {/* 3 Neo-Brutalist Feature Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Feature Card 1: Blue */}
          <div className="rounded-[24px] border-[3px] border-black bg-white p-6 shadow-[5px_5px_0_0_#000] space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#4285F4] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-[#111]">
              Live QR Verification
            </h3>
            <p className="text-xs font-semibold text-[#555] leading-relaxed">
              Every certificate has a unique cryptographic QR code linking directly to the live GDG CLOUD MOTIHARI attendee registry for instant validation.
            </p>
          </div>

          {/* Feature Card 2: Yellow */}
          <div className="rounded-[24px] border-[3px] border-black bg-white p-6 shadow-[5px_5px_0_0_#000] space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#FBBC05] text-[#111] flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-[#111]">
              Print & Portfolio Ready
            </h3>
            <p className="text-xs font-semibold text-[#555] leading-relaxed">
              Export high-resolution PDF or crisp PNG images calibrated for physical framing, LinkedIn sharing, and professional portfolios.
            </p>
          </div>

          {/* Feature Card 3: Green */}
          <div className="rounded-[24px] border-[3px] border-black bg-white p-6 shadow-[5px_5px_0_0_#000] space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-[#34A853] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <Award className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="font-black text-base uppercase tracking-tight text-[#111]">
              Official GDG Credential
            </h3>
            <p className="text-xs font-semibold text-[#555] leading-relaxed">
              Officially recognized and awarded by GDG CLOUD MOTIHARI to honor active participation in community technical events and workshops.
            </p>
          </div>
        </div>
      </main>

      {/* Official Main Website Footer */}
      <Footer />
    </div>
  );
}

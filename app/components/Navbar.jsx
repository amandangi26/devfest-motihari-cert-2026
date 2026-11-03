'use client'

import { Award } from 'lucide-react'
import Link from 'next/link'
import AnnouncementBar from './AnnouncementBar'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#FFFBF0]/95 backdrop-blur-md border-b-[2.5px] border-black shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      {/* Announcement Marquee Bar */}
      <AnnouncementBar />

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
        {/* Logo & Portal Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group text-left select-none"
          >
            <img
              src="/GDG_Logo.svg"
              alt="GDG Logo"
              className="h-6 sm:h-7 w-auto group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.src = '/GDG-icon.svg'
              }}
            />
            <span className="font-black text-[16px] sm:text-[19px] md:text-[20px] tracking-tight text-black group-hover:text-gdgBlue transition-colors uppercase whitespace-nowrap">
              GDG CLOUD MOTIHARI
            </span>
          </Link>

          {/* Neo-brutalist "Certificates" Tag */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-black bg-[#FBBC05] text-[#111] font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000]">
            <Award className="w-3 h-3 stroke-[2.5]" />
            <span>Portal</span>
          </span>
        </div>

        {/* Right Status Badge (No Admin Link / Button) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-white text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] select-none">
            <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
            <span className="hidden sm:inline">Official Registry</span>
            <span className="sm:hidden">Active</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

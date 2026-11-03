import { memo } from 'react'

const ANNOUNCEMENTS = [
  '🎓 Official Certificate Portal • GDG CLOUD MOTIHARI',
  '✨ Verify & Download Your Event Participation Certificate',
  '⚡ Fast & Instant Credential Verification',
  '📜 High-Resolution PDF & PNG Certificates',
  '🚀 Google Developer Groups Cloud Motihari',
]

function AnnouncementBar() {
  return (
    <aside
      aria-label="Certificate Portal Announcements"
      className="bg-gdgYellow text-black border-b-[2px] border-black overflow-hidden py-1.5 relative z-20 select-none shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]"
    >
      <div className="flex w-max animate-marquee">
        {/* Render twice for seamless infinite -50% loop */}
        {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-3 mx-4 sm:mx-6 text-[11px] sm:text-xs font-black uppercase tracking-wider text-black"
          >
            <span>{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
          </span>
        ))}
      </div>
    </aside>
  )
}

export default memo(AnnouncementBar)

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Terminal, Flame, Cpu, Users, CheckCircle2 } from 'lucide-react'

// Sparkle Star SVG
function SparkleStar({ color = "#FBBC05", size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`pointer-events-none select-none ${className}`}
      style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
  )
}

export default function Loader({ loading }) {
  const [progress, setProgress] = useState(0)

  // Smoothly increment progress counter up to 100%
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setProgress(100), 0)
      return () => clearTimeout(timer)
    }

    const startTime = performance.now()
    const targetDuration = 2000 // 2.0s to reach 100%

    let frameId
    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime
      const factor = Math.min(elapsed / targetDuration, 1)

      // Easing curve (easeOutCubic)
      const eased = 1 - Math.pow(1 - factor, 3)
      const current = Math.min(Math.round(eased * 100), 100)

      setProgress(current)

      if (factor < 1) {
        frameId = requestAnimationFrame(updateProgress)
      }
    }

    frameId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(frameId)
  }, [loading])

  // Contextual loading status steps matching the Halloween developer festival
  const getStatus = () => {
    if (progress < 24) {
      return {
        text: "Summoning Ranchi tech spirits...",
        icon: <Sparkles size={14} className="text-gdgYellow animate-pulse" />,
      }
    }
    if (progress < 50) {
      return {
        text: "Brewing Google Developer spells...",
        icon: <Flame size={14} className="text-gdgRed animate-bounce" />,
      }
    }
    if (progress < 76) {
      return {
        text: "Calibrating Halloween algorithms...",
        icon: <Cpu size={14} className="text-gdgBlue" />,
      }
    }
    if (progress < 98) {
      return {
        text: "Assembling speakers & workshops...",
        icon: <Users size={14} className="text-gdgGreen" />,
      }
    }
    return {
      text: "Welcome to DevFest Ranchi 2026! 🎃",
      icon: <CheckCircle2 size={14} className="text-gdgGreen" />,
    }
  }

  const status = getStatus()

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="devfest-loader-screen"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: {
              duration: 0.65,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
          className="fixed inset-0 z-[9999] bg-[#FFFBF0] flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Subtle DevFest Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #0D2818 1px, transparent 1px), linear-gradient(to bottom, #0D2818 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Ambient Glows in Google Palette */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-gdgYellow/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gdgBlue/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute top-1/3 -right-24 w-60 h-60 bg-gdgRed/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 -left-24 w-60 h-60 bg-gdgGreen/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Floating Atmospheric Sparkles */}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[12%] left-[10%] hidden sm:block pointer-events-none"
          >
            <SparkleStar color="#FBBC05" size={26} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 0.7, 1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute top-[16%] right-[14%] pointer-events-none"
          >
            <SparkleStar color="#EA4335" size={22} />
          </motion.div>
          <motion.div
            animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute bottom-[16%] left-[14%] hidden md:block pointer-events-none"
          >
            <SparkleStar color="#4285F4" size={24} />
          </motion.div>
          <motion.div
            animate={{ scale: [0.9, 1.3, 0.9], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute bottom-[14%] right-[12%] pointer-events-none"
          >
            <SparkleStar color="#34A853" size={20} />
          </motion.div>

          {/* Faint Floating Bats in Top Corners */}
          <motion.img
            src="/bat.svg"
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.12, x: [0, 8, 0], y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-8 w-16 h-auto pointer-events-none hidden sm:block"
          />
          <motion.img
            src="/bat.svg"
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.1, x: [0, -10, 0], y: [0, -8, 0], rotate: -10 }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute top-14 right-10 w-20 h-auto pointer-events-none hidden sm:block"
          />

          {/* =========================================================
              THE NEO-BRUTALIST DEVFEST FESTIVAL CONSOLE
          ========================================================= */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              scale: 0.92,
              opacity: 0,
              y: 20,
              transition: { duration: 0.3, ease: "easeIn" },
            }}
            transition={{ duration: 0.55, ease: "backOut" }}
            className="relative z-10 w-[92vw] max-w-[440px] sm:max-w-[460px] bg-[#FFFDF6] border-[3px] border-black rounded-[26px] sm:rounded-[30px] shadow-[7px_7px_0_0_#000] sm:shadow-[9px_9px_0_0_#000] overflow-hidden"
          >
            {/* Dangling Halloween Spider on Card Top Right */}
            <div className="absolute -top-1 right-8 sm:right-10 flex flex-col items-center pointer-events-none z-30">
              {/* Thread */}
              {/* <div className="w-[1.5px] h-6 sm:h-8 bg-black/80" /> */}
              {/* Swinging Spider */}
              <motion.div
                animate={{ rotate: [-14, 14, -14] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", transformOrigin: "top center" }}
                className="-mt-0.5"
              >
                {/* <img
                  src="/hero-spider.png"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                /> */}
              </motion.div>
            </div>

            {/* Terminal Header Bar */}
            <div className="bg-[#FFF8E7] border-b-2 border-black px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between">
              {/* Google Color Window Control Pills */}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gdgRed border-[1.5px] border-black shadow-[1px_1px_0_0_#000]" />
                <div className="w-3 h-3 rounded-full bg-gdgYellow border-[1.5px] border-black shadow-[1px_1px_0_0_#000]" />
                <div className="w-3 h-3 rounded-full bg-gdgGreen border-[1.5px] border-black shadow-[1px_1px_0_0_#000]" />
                <div className="w-3 h-3 rounded-full bg-gdgBlue border-[1.5px] border-black shadow-[1px_1px_0_0_#000]" />
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 bg-black text-[#FFFBF0] px-2.5 py-0.5 rounded-full border border-black text-[10px] sm:text-[11px] font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-gdgGreen animate-ping" />
                <span>DEVFEST.RANCHI // 26</span>
              </div>

              {/* Empty placeholder for alignment balance with spider */}
              <div className="w-6" />
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-6 flex flex-col items-center">
              {/* Center Mascot & Logo Stage */}
              <div className="relative w-full bg-[#FFF8E7] border-2 border-black rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] mb-5">
                {/* Background Rotating Sunburst Accent */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                    className="w-48 h-48 rounded-full border-2 border-dashed border-gdgYellow"
                  />
                </div>

                {/* Animated Halloween Android Mascot */}
                <motion.div
                  animate={{
                    y: [-4, 4, -4],
                    rotate: [-1.5, 1.5, -1.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 my-1 cursor-pointer transition-transform hover:scale-105"
                >
                  <img
                    src="/android.svg"
                    alt="DevFest Halloween Android"
                    className="w-24 sm:w-28 h-auto object-contain select-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.22)]"
                  />
                </motion.div>

                {/* DevFest Ranchi Event Identity */}
                <div className="relative z-10 mt-2 flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-black rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_0_#000] mb-1">
                    <img src="/GDG_Logo.svg" alt="GDG" className="w-3.5 h-3.5 object-contain" />
                    <span className="font-extrabold text-[11px] text-black">GDG Ranchi</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none mt-0.5">
                    DevFest <span className="text-gdgBlue">Ranchi</span> <span className="text-gdgYellow">&apos;26</span>
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-bold text-black/60 tracking-wider uppercase mt-1">
                    Jharkhand&apos;s Biggest Tech Festival
                  </p>

                </div>
              </div>

              {/* Neo-brutalist Striped Progress Track */}
              <div className="w-full bg-[#FFFBF0] border-2 border-black rounded-full h-6 sm:h-7 p-0.5 relative overflow-hidden shadow-[2px_2px_0_0_#000] mb-3">
                <motion.div
                  className="h-full rounded-full animate-stripes relative overflow-hidden transition-all duration-150 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundImage: `repeating-linear-gradient(
                      -45deg,
                      #4285F4 0,
                      #4285F4 12px,
                      #EA4335 12px,
                      #EA4335 24px,
                      #FBBC05 24px,
                      #FBBC05 36px,
                      #34A853 36px,
                      #34A853 48px
                    )`,
                    backgroundSize: "48px 48px",
                  }}
                >
                  {/* Subtle Top Glass Shine */}
                  <div className="absolute inset-x-0 top-0 h-[40%] bg-white/30 rounded-full" />
                </motion.div>
              </div>

              {/* Dynamic Status Text & Percentage Badge */}
              <div className="w-full flex items-center justify-between gap-2 px-1">
                {/* Status Message */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-black/85 font-mono truncate">
                  {status.icon}
                  <span className="truncate">{status.text}</span>
                </div>

                {/* Percentage Digital Badge */}
                <div className="flex-shrink-0 bg-black text-[#FFFBF0] font-mono font-black text-xs px-2.5 py-0.5 rounded-md border border-black shadow-[2px_2px_0_0_#FBBC05]">
                  {progress}%
                </div>
              </div>
            </div>

            {/* Tribal Border Accent (4-Color Google Gradient) */}
            <div className="tribal-border w-full" />

            {/* Terminal Footer Note */}
            <div className="bg-[#FFF8E7] px-4 py-2 border-t border-black/20 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-black/60">
              <span>📅 31 October 2026</span>
              <span className="flex items-center gap-1">
                <Terminal size={11} className="text-black/60" />
                <span>Ready to Hack & Build</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

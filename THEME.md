# DevFest Ranchi Design System & Theme Guide (`THEME.md`)

Use this comprehensive guide to style any companion web application (like the **DevFest Certificate Downloader**) with the exact visual identity, colors, typography, and neo-brutalist components of the official **DevFest Ranchi 2026** platform.

---

## 1. Core Visual Identity

* **Style**: Retro-Tech Neo-Brutalism + Modern Google Material Accent.
* **Key Principles**:
  1. **Warm Cream Background**: Never use pure cold `#FFF` or dark backgrounds as page canvas. The canvas is always `#FFFBF0` (Ranchi Sand).
  2. **High-Contrast Black Borders**: Everything is framed in solid `border-2 border-black` or `border-[3px] border-black`.
  3. **Hard Drop Shadows (No Blur)**: Neo-brutalist offset shadows like `shadow-[4px_4px_0_0_#000]` or `shadow-[6px_6px_0_0_#000]`.
  4. **Google 4-Color Stripe**: The signature Google 4-color repeating linear gradient on top borders and dividers.
  5. **Bold, Punchy Typography**: `Plus Jakarta Sans` in `font-black` (800/900 weight), uppercase titles with tight tracking.

---

## 2. Color Palette (Tailwind Tokens & Hex)

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| `gdgBlue` | `#4285F4` | Primary brand color, primary CTA buttons, active tabs, key highlights |
| `gdgRed` | `#EA4335` | "Live" badge, alerts, urgent action chips, secondary accents |
| `gdgYellow` | `#FBBC05` | Warning, feature badges, glowing stars, highlight pills |
| `gdgGreen` | `#34A853` | Verification checkmarks, success states, confirmed status badges |
| `ranchiSand` | `#FFFBF0` | **Global Page Background** (warm vintage paper feel) |
| `ranchiCream` | `#FFF8E7` | Card hover states, secondary container backgrounds |
| `black` | `#000000` / `#111111` | All borders, hard drop shadows, and high-emphasis headlines |
| `white` | `#FFFFFF` | Card surfaces, inputs, modal bodies |
| `textMuted` | `#555555` / `#7A6A61` | Secondary description text, captions |

---

## 3. Typography & Google Fonts

Add this import to the top of your `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
```

* **Main Body & Headings**: `'Plus Jakarta Sans', sans-serif`
* **Certificate ID / Hash / Code**: `'JetBrains Mono', monospace`
* **Heading Styling**: `font-black uppercase tracking-tight text-[#111] leading-tight sm:leading-snug`
* **Section Tag / Kicker**: `text-xs font-black uppercase tracking-[0.08em] text-gdgBlue`

---

## 4. `tailwind.config.js` Setup

Drop this configuration into your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gdgBlue: "#4285F4",
        gdgRed: "#EA4335",
        gdgYellow: "#FBBC05",
        gdgGreen: "#34A853",
        ranchiSand: "#FFFBF0",
        ranchiCream: "#FFF8E7",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        'neo-sm': '2px 2px 0 0 #000',
        'neo': '4px 4px 0 0 #000',
        'neo-lg': '6px 6px 0 0 #000',
        'neo-xl': '8px 8px 0 0 #000',
        'neo-blue': '4px 4px 0 0 #4285F4',
      },
    },
  },
  plugins: [],
}
```

---

## 5. Global CSS (`src/index.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #FFFBF0;
  color: #111111;
  font-weight: 600;
  overflow-x: hidden;
}

/* Signature Google 4-Color Stripe Header */
.google-stripe {
  background-image: repeating-linear-gradient(
    90deg,
    #4285F4 0 16px,
    #EA4335 16px 32px,
    #FBBC05 32px 48px,
    #34A853 48px 64px
  );
  height: 6px;
  width: 100%;
}
```

---

## 6. Pre-Built Neo-Brutalist Component Patterns

### A. Signature Header Bar with 4-Color Stripe
```jsx
<div className="w-full bg-[#FFFBF0] border-b-2 border-black sticky top-0 z-50">
  <div className="google-stripe" />
  <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-black bg-gdgBlue text-white flex items-center justify-center font-black text-xs shadow-neo-sm">
        GDG
      </div>
      <span className="font-black text-sm uppercase tracking-tight text-[#111]">
        DevFest Ranchi 2026
      </span>
    </div>
    <span className="px-3 py-1 rounded-full border border-black bg-gdgYellow text-black font-black text-[11px] uppercase tracking-wider shadow-neo-sm">
      Certificates
    </span>
  </div>
</div>
```

### B. Neo-Brutalist Main Card
```jsx
<div className="rounded-[24px] sm:rounded-[28px] border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] space-y-5">
  <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
    <span className="text-xs font-black uppercase text-gdgBlue tracking-wider">
      STEP 1 - VERIFY DETAILS
    </span>
    <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border border-black bg-[#E6F4EA] text-[#137333]">
      Verified Attendee
    </span>
  </div>
  
  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111]">
    Download Your DevFest 2026 Certificate
  </h2>
  
  <p className="text-xs sm:text-sm font-semibold text-[#555] leading-relaxed">
    Enter your registered email address or Attendee ID to generate and download your high-resolution official DevFest certificate.
  </p>
</div>
```

### C. Search & Input Fields
```jsx
<div className="space-y-1.5">
  <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
    Registered Email / Attendee ID
  </label>
  <div className="relative">
    <input
      type="text"
      placeholder="e.g. rahul@gmail.com or DF26-1049"
      className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white font-mono text-sm font-bold text-[#111] placeholder:text-[#999] shadow-[2.5px_2.5px_0_0_#000] focus:border-gdgBlue focus:shadow-[3px_3px_0_0_#4285F4] outline-none transition-all"
    />
  </div>
</div>
```

### D. Primary Action Button (Download Certificate)
```jsx
<button
  type="button"
  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gdgBlue hover:bg-[#1a73e8] text-white font-black text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] active:shadow-none transition-all cursor-pointer select-none"
>
  <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  <span>Download Certificate (HD PNG / PDF)</span>
</button>
```

### E. Secondary / Ghost Button
```jsx
<button
  type="button"
  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-[#FFF3E8] text-[#111] font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-y-[2px] transition-all cursor-pointer"
>
  Preview Certificate
</button>
```

### F. Status & Metadata Chips
```jsx
{/* Official Challenge Tag / Verified Badge */}
<div className="rounded-xl border border-black/15 bg-blue-50/60 p-3 flex items-center justify-between gap-2 text-xs font-bold text-[#3B4A60]">
  <span>Official Credential: <strong>Google Developer Groups Ranchi</strong></span>
  <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-black font-black uppercase text-[10px]">
    100% Verified
  </span>
</div>
```

---

## 7. Ready-to-Use AI Prompt for Other Apps

Copy and paste the prompt in section below directly into your AI assistant for the **Certificate Downloader** app.

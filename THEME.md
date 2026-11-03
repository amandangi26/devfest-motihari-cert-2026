# GDG Cloud Motihari Design System & Theme Guide (`THEME.md`)

Use this comprehensive guide to style any companion web application (like the **Certificate Portal**) with the exact visual identity, colors, typography, and neo-brutalist components of the official **GDG CLOUD MOTIHARI** platform.

---

## 1. Core Visual Identity

* **Style**: Retro-Tech Neo-Brutalism + Modern Google Material Accent.
* **Key Principles**:
  1. **Warm Cream Background**: Never use pure cold `#FFF` or dark backgrounds as page canvas. The canvas is always `#FFFBF0` (`motihariSand`).
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
| `motihariSand` | `#FFFBF0` | **Global Page Background** (warm vintage paper feel) |
| `motihariCream` | `#FFF8E7` | Card hover states, secondary container backgrounds |
| `black` | `#000000` / `#111111` | All borders, hard drop shadows, and high-emphasis headlines |
| `white` | `#FFFFFF` | Card surfaces, inputs, modal bodies |
| `textMuted` | `#555555` / `#7A6A61` | Secondary description text, captions |

---

## 3. Typography & Google Fonts

* **Main Body & Headings**: `'Plus Jakarta Sans', sans-serif`
* **Certificate ID / Hash / Code**: `'JetBrains Mono', monospace`
* **Heading Styling**: `font-black uppercase tracking-tight text-[#111] leading-tight sm:leading-snug`
* **Section Tag / Kicker**: `text-xs font-black uppercase tracking-[0.08em] text-gdgBlue`

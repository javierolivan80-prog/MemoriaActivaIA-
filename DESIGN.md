---
name: Memoria Activa
description: Compañía real por teléfono para quien más quieres, con memoria de cada conversación.
colors:
  background: "#f7f8f6"
  surface: "#ffffff"
  surface-alt: "#eaeeee"
  primary: "#073d5d"
  primary-hover: "#062f4b"
  primary-light: "#e1e8ec"
  secondary: "#639293"
  secondary-light: "#e0e9e9"
  secondary-text: "#456174"
  text-primary: "#062f4b"
  text-secondary: "#345369"
  text-muted: "#5c7383"
  border: "#d1dade"
  alert-urgent: "#b3432f"
  alert-urgent-bg: "#f7ecea"
  alert-warning: "#8a5819"
  alert-warning-bg: "#f1ebe3"
  alert-info: "#4f6b85"
  alert-info-bg: "#edf0f3"
typography:
  display:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.08
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.5rem"
  lg: "2.5rem"
  xl: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Memoria Activa

## Overview

**Creative North Star: the canonical logo mark.**

Memoria Activa's screens are built around its real brand asset — two overlapping deep-blue circles crossed by a soft teal wave, painted with a warm brush texture, under a plain rounded wordmark. This replaced an earlier terracotta/sage "Sunday Table" system: the redesign kept the product's warmth and calm but rebuilt color and type entirely around the actual logo instead of an invented palette, per a direct product/brand brief. The logo file itself is canonical and is never redrawn, recolored, or reinterpreted — every screen treatment below is *derived from* it (crop, transparency, motion), not a repaint of it.

Blue carries trust, navigation, and primary action. Teal is reserved for positive/confirming moments — it never becomes a second "brand blue." Off-white and white carry warmth and surface, not identity. The three-level alert system is the one place color is allowed to be genuinely urgent, and it deliberately sits *outside* the blue/teal family so a severity color can never be mistaken for a navigation or action color.

This system rejects the same things it always did: cold corporate chrome, dense data-grid dashboards, hard drop shadows, decorative gradients, and iconography for its own sake. The addition from the rebrand is a stricter one: nothing in the interface may compete with or reinterpret the actual logo asset.

**Key Characteristics:**
- Deep blue + soft teal, sourced from the real logo file (see Colors → provenance), never invented or eyeballed
- One humanist sans (Figtree) across the entire type scale — no separate display serif
- Soft, blue-tinted ambient shadows only — no hard elevation, no colored glow
- The logo mark (not a text wordmark) is the brand touchpoint in the header and auth screens
- Severity color (the 3-level alert system) is the one deliberate exception to the calm palette, and lives in its own hue family so it never reads as a brand action

## Brand Asset

The canonical logo lives at `public/brand/`:
- `icon-transparent.png` — the mark alone (two circles + wave), transparent background. Use this everywhere compact: header, auth aside, favicon source, loading/idle motion.
- `lockup-transparent.png` — mark + wordmark stacked, transparent background. Use only on light/cream surfaces (the wordmark's soft brush edge was decontaminated against a cream background and can show a faint fringe on saturated colors) — marketing and auth panels where there's room for the full lockup.
- `wordmark-transparent.png` — the type only, rarely needed standalone.
- `icon-square.png` — the mark padded to a square, source for `src/app/favicon.ico` and `src/app/icon.png`.

### Named Rules
**The Canonical-Asset Rule.** Never redraw, recolor, simplify, or reinterpret the logo mark or wordmark. Every use is the same source file (or a crop of it) at a different size — never a CSS/SVG recreation, never a color swap for a themed context. A dark-mode surface is designed to keep the mark legible as-is (a lighter dark tone, not nearing black) rather than producing a "dark-mode logo."
**The Compact-Mark Rule.** Any horizontal nav bar or inline brand mention uses the icon-only mark, not the full lockup — the lockup's vertical stack doesn't fit a slim bar, and setting "memoriaActiva" again in live UI type would compete with the logo's own painted wordmark.

## Colors

Provenance: every value below was either given directly in the rebrand brief or sampled from the real logo PNG and cross-checked against the brief's approximation (they matched closely). Every text/background pairing was verified against WCAG contrast — see the per-role notes.

### Primary — Blue
**Deep Blue** (#073d5d): primary buttons, links, focus rings, active tab, brand identity. 11.45:1 on white. Hover deepens to **Dark Blue** (#062f4b, 13.85:1 on white) — also used as `text-primary`, tying body copy into the brand rather than true black. Tint **Primary Light** (#e1e8ec) fills icon roundels and hover backgrounds.

### Secondary — Teal
**Teal** (#639293): icons, checkmarks, decorative graphics, dots — a 3:1-class role, not body text (3.46:1 on white — clears the large-scale/graphical-object threshold, not the 4.5:1 text one). Tint **Secondary Light** (#e0e9e9) fills matching roundels and success banners. Where teal must carry actual small text (a topic-tag pill is the one real case in this app), use **Secondary Text** (#456174, 5.3:1 on white, 3.9:1 on Secondary Light's own tint via `text-secondary-text`) instead of the raw accent — the deepened variant exists specifically because the raw teal fails AA there.

### Neutral
**Off-White** (#f7f8f6): page background. **White** (#ffffff): cards, surfaces. **Surface Alt** (#eaeeee): alternate section background, a cool neutral (not warm cream) so it reads as "part of the blue system," not a leftover from the old palette. **Border** (#d1dade): hairlines and dividers. **Text Secondary** (#345369, 8.1:1 on white) and **Text Muted** (#5c7383, 4.9:1 on white) are both blue-tinted grays, not true gray — everything neutral in this system still carries a trace of the brand hue.

### Severity (used only for alerts)
**Rust** (#b3432f) on **Rust Whisper** (#f7ecea): urgency (level 3), 5.58:1 / 4.82:1. **Ochre** (#8a5819) on **Ochre Whisper** (#f1ebe3): attention (level 2), 6.0:1 / 5.1:1. **Slate** (#4f6b85) on **Slate Whisper** (#edf0f3): info (level 1), 5.56:1 / 4.86:1.

### Named Rules
**The Severity-Only Rule.** Rust, Ochre, and Slate exist only inside the alert system. None of them may appear as a decorative accent, a chart color, or a brand touch anywhere else — Slate in particular must never be reached for as "a calmer blue," because that's exactly the confusion the separate hue family exists to prevent.
**The Teal-Is-Not-Text Rule.** Default to `text-secondary` only on icons and decorative marks. Any place teal carries readable text — however small — uses `text-secondary-text`, never the raw accent.

### Dark Mode

Follows `prefers-color-scheme`; there is no in-app toggle yet. Every color token is a CSS custom property declared in a plain (non-`inline`) `@theme` block specifically so a `@media (prefers-color-scheme: dark) { :root { ... } }` override re-themes every Tailwind utility that reads it — no per-component `dark:` classes needed, except the handful of places a literal `text-white` sat on a token background that flips lightness (those use `dark:text-background` instead). **If you ever see a color read back as its light-mode value while `prefers-color-scheme: dark` is active, suspect `@theme inline` on that block before anything else** — `inline` bakes the literal hex into each generated utility at build time instead of emitting `var(--color-*)`, which silently breaks the override with no error. This cost real debugging time once already.

| Token | Light | Dark |
|---|---|---|
| background | #f7f8f6 | #0a1520 |
| surface | #ffffff | #10202c |
| surface-alt | #eaeeee | #162a38 |
| primary | #073d5d | #4a90b8 |
| primary-hover | #062f4b | #5aa3ca |
| primary-light | #e1e8ec | #203f53 |
| secondary | #639293 | #639293 (unchanged — already clears 4.5:1 on the dark background) |
| secondary-light | #e0e9e9 | #29424b |
| text-primary | #062f4b | #eef3f5 |
| text-secondary | #345369 | #bdcad1 |
| text-muted | #5c7383 | #abbbc4 |
| border | #d1dade | #334756 |
| alert-urgent / -bg | #b3432f / #f7ecea | #cb7f72 / #2a262c |
| alert-warning / -bg | #8a5819 / #f1ebe3 | #af8d63 / #242929 |
| alert-info / -bg | #4f6b85 / #edf0f3 | #879aac / #1a2c3a |

**Why the dark background isn't close to the logo's own darkest tone.** The mark's deepest pixels sit around #04395c — a dark background chosen near that value would let the unaltered logo camouflage into it. #0a1520 sits low enough that the mark still reads as a distinct (if subtle) shape, and the teal wave running through it stays bright at 7.5–8.4:1 either way. This is what the Canonical-Asset Rule's "tune the surface, not the logo" instruction means in practice — verify it by compositing the real asset over any new dark surface candidate before shipping one.

**Why `primary` needed a real lighten, not just a tint.** Light mode's Deep Blue (#073d5d) is already near the bottom of the luminance range — used as-is on a dark background it would barely register, and white button text on top of it only clears 3.5:1 (fails AA). Dark-mode primary lightens to #4a90b8 and filled buttons swap to dark text (`dark:text-background`) instead of white, which is why that pairing shows up as a named exception above rather than a plain value swap.

## Typography

**Typeface:** Figtree (with system-ui, sans-serif fallback) — one humanist sans across the entire scale, replacing the earlier Fraunces-display/Inter-body pairing. The rebrand brief asked for legibility over trend for a mixed-age audience and a single coherent scale rather than a serif "feeling" register; Figtree is warm and rounded without being a novelty face, and it's deliberately not Inter, Roboto, Poppins, or Montserrat — genuinely distinct from the default AI-product look, not just re-themed.

### Hierarchy
- **Display** (600, clamp(3rem, 6vw, 3.75rem), line-height 1.08): the hero headline only. One per page, at most.
- **Headline** (600, 1.875rem, line-height 1.25): section titles.
- **Title** (600, 1.5rem, line-height 1.3): page/card headers, plan names, an elderly profile's name.
- **Body** (400, 1rem, line-height 1.5): paragraph copy, usually in Text Secondary rather than Text Primary.
- **Label** (500, 0.875rem, line-height 1.4): form labels and small UI text.

### Named Rules
**The One-Family Rule.** There is no second "feeling" typeface. Weight and size carry the hierarchy that a display serif used to carry — a heading is `font-semibold` at its size step, not a font-family switch. Do not reintroduce a second family for "warmth"; that is what the logo mark and the color system already do.

## Layout

Marketing sections (landing page) center in a `max-w-6xl` container with `px-6` gutters and generous vertical rhythm — `py-20` between major sections. Authenticated views narrow further: the dashboard is `max-w-2xl` (it's a short list of narrative person-cards, not a wide admin grid), elderly-profile subpages are `max-w-3xl`–`max-w-4xl`. Grids are mobile-first single column, opening to 2–3 columns at `md` only where content genuinely tiles (the pricing cards, the onboarding step icons) — the dashboard itself is intentionally a single vertical column of person-cards, not a grid, since the point is a calm read top-to-bottom rather than a scanned data grid.

## Elevation & Depth

Soft, blue-tinted ambient shadows exclusively (`rgba(6, 47, 75, …)` — never pure black, never a saturated color glow). A shadow always signals "gently lifted for calm," never a hard stacking order.

### Shadow Vocabulary
- **Soft** (`0 4px 20px rgba(6, 47, 75, 0.08)`): resting elevation for cards and panels.
- **Soft MD** (`0 8px 30px rgba(6, 47, 75, 0.1)`): the more prominent case — the header once scrolled, a hovered card.

### Named Rules
**The Ambient-Only Rule.** Unchanged from the previous system: shadows are always soft, diffuse, and hue-tinted from the brand, never sharp, dark, or colored as a "glow" effect.

## Shapes

Corners are rounded everywhere; nothing in the system is sharp. Buttons and inputs use `rounded-xl` (0.75rem); cards and panels use `rounded-2xl` (1rem); badges, progress tracks, and icon roundels use `rounded-full`. This three-step hierarchy (interactive → container → pill) is deliberate and is *not* "everything is a pill" — each tier is reserved for its own category of element.

### Named Rules
**The Oversized Numeral Rule.** A sequential, ordered process (the landing page's "Cómo funciona" steps) earns one giant numeral per item — `text-8xl`/`text-9xl`, `leading-none`, `font-bold`, tinted to ~15% opacity of Deep Blue (`text-primary/15`) so it reads as a quiet structural watermark. This is the system's one exception to "Display is the hero headline only, one per page" — the numeral is a graphic device carrying real sequence information (which step is which), not decorative text, which is what keeps it inside the "no decoration without purpose" rule rather than outside it.

## Components

### Buttons
`rounded-xl`, `px-6 py-3`, `gap-2` for icon+label, 200ms color transition. **Primary:** Deep Blue background, white text; hovers to Dark Blue. **Secondary:** transparent, Deep Blue border and text; hovers to a Primary Light fill. **Ghost:** transparent, Text Primary; hovers to a Surface Alt fill — low-emphasis actions only.

### Cards
`rounded-2xl`, White background, Soft shadow, 1px Border (the featured pricing card upgrades to a 2px Deep Blue border). 24px padding, 32px at `sm+`.

### Inputs / Fields
White background, 1px Border, `rounded-xl`. Focus: border shifts to Deep Blue plus a 30%-opacity Deep Blue ring. Any input rendered outside the shared `Input`/`Textarea` components (a compact inline composer, for instance) imports `fieldClasses` from `Input.tsx` rather than re-typing the Tailwind string — see the Named Rule below.

### Navigation (Header)
Sticky top bar, transparent over the hero; once scrolled, Paper-White at 95% opacity with backdrop blur and Soft shadow. The brand mark is the logo icon image (see Brand Asset → Compact-Mark Rule), not text.

### Tabs
Underline style — 2px bottom border, no background pill. Active: Deep Blue text and border. Inactive: Text Secondary, transparent border, hover to Text Primary.

### Alerts (signature component)
Left border (4px) plus a tinted background, colored by severity. An icon matching the severity sits at the start of the message. The one component allowed to break the calm palette.

### Dashboard person-card (signature component)
Not a data card — a narrative one. Name + active/inactive status up top; below it, either a call-issue message, a quoted excerpt of the real call summary with a relative-time lead-in ("Habló contigo esta mañana"), or a plain "sin llamadas todavía" state — never a fabricated or templated line. Plan/subscription status is secondary information below a divider, not the headline.

### Named Rules
**The Shared-Chrome Rule.** A field's visual chrome (border, radius, focus ring) is defined once, in `Input.tsx`'s exported `fieldClasses`, and reused by every input in the app — including ones that render outside the `Input` component itself. Don't hand-copy the Tailwind string a second time; import the token.

## Do's and Don'ts

### Do:
- **Do** use the real logo asset (a crop of the canonical file) for every brand touchpoint, per the Canonical-Asset Rule.
- **Do** keep every shadow soft, diffuse, and blue-tinted per the Ambient-Only Rule.
- **Do** round every corner — `rounded-xl` minimum on any interactive element, `rounded-2xl` on containers, `rounded-full` on badges/pills.
- **Do** reserve Rust / Ochre / Slate strictly for the alert system per the Severity-Only Rule.
- **Do** use `text-secondary-text`, not `text-secondary`, anywhere teal carries readable text.

### Don't:
- **Don't** redraw, recolor, or reinterpret the logo — not even a "dark mode variant." Place the same asset on a surface tuned to keep it legible instead.
- **Don't** reintroduce a second "feeling" typeface — weight and size carry hierarchy now, not a font-family switch.
- **Don't** introduce purple, electric blue, neon green, or any color outside the blue/teal/severity palette as a UI accent.
- **Don't** use decorative gradients or blurred color blobs as atmosphere — if a visual element's only job is "looks nice," per the brief's own standard, remove it rather than theme it.
- **Don't** use a hard, dark, or crisply-edged drop shadow.
- **Don't** reach for dense corporate-dashboard patterns (data grids, sharp dividers, monospace stat blocks) even on data-heavy screens — the dashboard's person-cards are the proof this is achievable even for the most data-adjacent screen in the app.

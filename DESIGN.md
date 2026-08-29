---
name: Memoria Activa
description: Compañía real por teléfono para quien más quieres, con memoria de cada conversación.
colors:
  background: "#fdf8f3"
  surface: "#ffffff"
  surface-alt: "#f5ede4"
  primary: "#8f5238"
  primary-hover: "#6b3d2a"
  primary-light: "#f0ddd3"
  secondary: "#6b8f71"
  secondary-light: "#e1ebe2"
  text-primary: "#2d2a26"
  text-secondary: "#6b6560"
  text-muted: "#6f665e"
  border: "#e8dfd5"
  alert-urgent: "#c24b3f"
  alert-urgent-bg: "#fbeae7"
  alert-warning: "#c98a3a"
  alert-warning-bg: "#fbf1e3"
  alert-info: "#4a7a8c"
  alert-info-bg: "#e8f0f2"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.1
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
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

**Creative North Star: "The Sunday Table"**

Memoria Activa's screens should feel like the warmth of family gathered around a table, not a monitoring dashboard. The palette pairs terracotta clay with garden sage on a warm linen background; the Fraunces serif carries the moments meant to feel human (a hero line, a greeting, the wordmark) while Inter handles everything functional. Shadows stay soft and diffuse — never a hard drop shadow — and every corner is rounded, so nothing reads as clinical or corporate. The product's actual job is to reassure someone worried about a parent living alone; the interface earns that trust by feeling unhurried, domestic, and specific to real people rather than generic SaaS chrome.

This system deliberately rejects cold tech blues, clinical medical-device chrome, and dense corporate-dashboard patterns (data grids, sharp dividers, monospace stat blocks). The one place the system is allowed to feel urgent is the three-level alert system — real severity gets real color, everywhere else stays calm.

**Key Characteristics:**
- Warm terracotta + sage palette on cream linen, never cold gray or blue as a UI accent
- Fraunces serif reserved for feeling-moments; Inter for all interface chrome
- Soft, warm-tinted ambient shadows only — no hard elevation
- Rounded corners everywhere (xl / 2xl / full), no sharp edges
- Severity color (the 3-level alert system) is the one intentional exception to the calm palette

## Colors

A warm, low-saturation palette built from two natural pigments — clay and sage — on a cream linen ground; color is used sparingly and functionally, not decoratively.

### Primary
- **Terracotta Clay** (#8f5238): the one recurring accent — primary buttons, active tab underline, focus rings, links, the "popular plan" border. Deepened from the original #c97a5b so it clears 4.5:1 text contrast both as white-on-fill (buttons) and as foreground text on Clay Light — the brand still reads unmistakably terracotta, just richer. Hover deepens further to **Deep Terracotta** (#6b3d2a); its lighter tint, **Clay Light** (#f0ddd3), fills icon roundels and hover backgrounds and is unchanged.

### Secondary
- **Sage Garden** (#6b8f71): reserved for positive/confirming moments — checkmarks, benefit icons, success banners. Its tint **Sage Light** (#e1ebe2) fills the matching icon roundels.

### Neutral
- **Cream Linen** (#fdf8f3): page background.
- **Paper White** (#ffffff): card and surface background, sits one step lighter than the page.
- **Toasted Sand** (#f5ede4): alternate section background, used to separate page regions without a hard line.
- **Espresso Ink** (#2d2a26): primary text.
- **Warm Taupe** (#6b6560): secondary text (descriptions, supporting copy).
- **Faded Clay** (#6f665e): muted text (hints, timestamps, placeholders). Darkened from the original #a39d96, which measured ~2.6:1 on white — well under the 4.5:1 text minimum.
- **Sand Border** (#e8dfd5): all hairline borders and dividers.

### Severity (used only for alerts)
- **Burnt Rust** (#c24b3f) on **Rust Whisper** (#fbeae7): urgency (level 3).
- **Honey Amber** (#c98a3a) on **Amber Whisper** (#fbf1e3): attention (level 2).
- **Dusty Teal** (#4a7a8c) on **Teal Whisper** (#e8f0f2): info (level 1).

### Named Rules
**The Severity-Only Rule.** Burnt Rust, Honey Amber, and Dusty Teal exist only inside the alert system. They never appear as decorative accents, chart colors, or brand color anywhere else in the product.

## Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)

**Character:** Fraunces is a soft, slightly bookish serif — it reads as warm and handwritten rather than editorial-luxury or corporate. Inter stays completely neutral underneath it, so the serif is what carries feeling and Inter never competes with it.

### Hierarchy
- **Display** (500, clamp(3rem, 6vw, 3.75rem), line-height 1.1): the hero headline only. One per page, at most.
- **Headline** (400, 1.875rem, line-height 1.25): section titles ("Así de simple," "Por qué Memoria Activa").
- **Title** (600, 1.5rem, line-height 1.3): page/card headers — dashboard greeting, plan names, elderly profile name.
- **Body** (400, 1rem, line-height 1.5): paragraph copy and descriptions, usually in Warm Taupe rather than Espresso Ink.
- **Label** (500, 0.875rem, line-height 1.4): form labels and small UI text.

### Named Rules
**The Serif-for-Feeling Rule.** Fraunces appears only where the moment should feel human: the hero line, a page greeting ("Hola {name}"), the wordmark, section titles. Every interactive element — buttons, nav, labels, form fields — stays in Inter, even when adjacent to serif text.

## Layout

Marketing sections (landing page) center in a `max-w-6xl` container with `px-6` gutters and generous vertical rhythm — `py-20` between major sections. Authenticated views (dashboard, elderly profile) narrow to `max-w-4xl` with `py-16`, reflecting a single-task, less exploratory context. Grids are mobile-first single column, opening to 2 or 3 columns at the `md` breakpoint (features, plans, onboarding steps). Cards and content blocks generally sit inside one consistent horizontal gutter rather than edge-to-edge.

## Elevation & Depth

The system uses soft, warm-tinted ambient shadows exclusively — never a crisp or dark drop shadow, and never a tiered "elevation level" system implying hard stacking order. A shadow always signals "this surface is gently lifted for calm," not "this is on top of that."

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 4px 20px rgba(45, 42, 38, 0.08)`): resting elevation for cards, the featured pricing card, panels.
- **Soft MD** (`box-shadow: 0 8px 30px rgba(45, 42, 38, 0.1)`): the slightly more prominent case — the header once the page has scrolled.

### Named Rules
**The Ambient-Only Rule.** Shadows are always soft, diffuse, and warm-tinted (`rgba(45, 42, 38, …)`, never pure black). If a shadow reads as sharp or heavy, it's wrong for this system.

## Shapes

Corners are rounded everywhere; nothing in the system is sharp. Buttons and inputs use `rounded-xl` (0.75rem); cards and panels use `rounded-2xl` (1rem); badges, progress tracks, and icon roundels use `rounded-full`. Icon roundels — a circular tint (Clay Light or Sage Light) housing a single-color icon — are the recurring decorative motif for inline lists, used on the landing page's benefit list.

### Named Rules
**The Oversized Numeral Rule.** A sequential, ordered process (the landing page's "Así de simple" steps) earns one giant Fraunces numeral per item — `text-8xl`/`text-9xl`, `leading-none`, tinted to roughly 15% opacity of Terracotta Clay (`text-primary/15`) so it reads as a quiet structural watermark, not a second headline. This is the system's one deliberate exception to "Display is the hero headline only, one per page": the numeral is a graphic device, not text content, and its low opacity keeps the hero the only saturated, full-contrast display moment on the page. Icon roundels are dropped from any list that uses this device — the numeral alone carries the per-item identity.

## Components

### Buttons
- **Shape:** rounded-xl (0.75rem), `px-6 py-3`, `gap-2` for icon+label, 200ms color transition.
- **Primary:** Terracotta Clay background, white text; hovers to Deep Terracotta.
- **Secondary:** transparent background, Terracotta Clay border and text; hovers to a Clay Light fill.
- **Ghost:** transparent, Espresso Ink text; hovers to a Toasted Sand fill. Used for low-emphasis actions (nav "Iniciar sesión," logout).

### Cards
- **Corner Style:** rounded-2xl (1rem).
- **Background:** Paper White.
- **Shadow Strategy:** Soft (see Elevation).
- **Border:** 1px Sand Border (the featured pricing card upgrades to a 2px Terracotta Clay border instead).
- **Internal Padding:** 24px, expanding to 32px at `sm` and above.

### Inputs / Fields
- **Style:** Paper White background, 1px Sand Border, rounded-xl.
- **Focus:** border shifts to Terracotta Clay plus a 30%-opacity Terracotta Clay ring.
- **Label:** Label-style text directly above the field; a Faded Clay hint line may follow below.

### Navigation (Header)
- **Style:** sticky top bar, transparent over the hero; once scrolled, becomes Paper White at 95% opacity with a backdrop blur and Soft shadow. Wordmark in Headline-weight Fraunces; nav actions are Ghost/Primary buttons.

### Tabs
- **Style:** underline style — a 2px bottom border, no background pill. Active tab: Terracotta Clay text and border. Inactive: Warm Taupe text, transparent border, hover to Espresso Ink text.

### Alerts (signature component)
- **Style:** left border (4px) plus a tinted background, colored by severity (Burnt Rust / Honey Amber / Dusty Teal, see Colors → Severity). An icon matching the severity sits at the start of the message. This is the one component allowed to break the calm palette — that contrast is what makes it legible as "this needs attention."

### Pricing Cards (signature component)
- **Style:** Card token, `p-8`. The featured plan gets a 2px Terracotta Clay border instead of the default hairline, plus a floating rounded-full badge ("Más elegido") in solid Terracotta Clay with white text, centered on the top edge.

## Do's and Don'ts

### Do:
- **Do** reserve Fraunces for feeling-moments (hero line, greetings, the wordmark, section titles) per the Serif-for-Feeling Rule.
- **Do** keep every shadow soft, diffuse, and warm-tinted per the Ambient-Only Rule.
- **Do** round every corner — rounded-xl minimum on any interactive element, rounded-2xl on containers, rounded-full on badges/pills/tracks.
- **Do** reserve Burnt Rust / Honey Amber / Dusty Teal strictly for the alert system per the Severity-Only Rule.

### Don't:
- **Don't** introduce cold blues, cool grays, or any color outside the terracotta/sage/severity palette as a UI accent.
- **Don't** use sharp (0-radius) corners anywhere, including on cards, inputs, or data displays.
- **Don't** use a hard, dark, or crisply-edged drop shadow — it reads as generic SaaS, not this product.
- **Don't** reach for dense corporate-dashboard patterns (data grids, sharp dividers, monospace stat blocks, cold chrome) even on data-heavy admin screens; find the warm equivalent instead.

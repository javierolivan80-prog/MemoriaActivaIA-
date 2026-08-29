# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: an adult child (or other close family member) of an elderly person who lives independently and worries about their wellbeing day to day. They are the one who signs up, builds the elderly relative's profile, pays for the subscription, and reads the dashboard — comfortable with ordinary modern web apps, no special digital-literacy accommodation assumed.

The elderly relative is the beneficiary of the product but never touches the web app: their only interaction is answering an ordinary phone call.

Family is the whole target; professional caregivers and care homes managing unrelated clients are explicitly out of scope for now.

## Product Purpose

Memoria Activa places a daily AI phone call to an elderly relative — a warm, natural conversation that remembers what was discussed in previous calls — so the family member gets peace of mind through a summary and alerts after each call, without the elderly person ever needing to learn an app or a new device.

## Positioning

The elderly relative's entire interface is their existing phone; there is nothing to install and nothing to learn. The AI carries memory across calls the way an ongoing relationship would, not a fresh script each time. Family sees only what matters (summaries and severity-leveled alerts), never a full transcript — the elderly person's dignity and privacy are preserved even while family is kept informed.

## Operating Context

- Family member creates one profile per elderly relative: name, phone number, age, family info, interests, hobbies, routines, favorite topics, and sensitive topics the AI must avoid.
- An onboarding wizard can auto-parse a free-text description of the relative into these structured fields via AI, instead of the family member filling every field by hand.
- Family member sets a call schedule (1 or 2 calls/day depending on plan) at chosen times; a cron job triggers calls, a voice AI (Retell) conducts them, and each call is summarized afterward.
- Dashboard surfaces: unread alerts (3 severity levels), a monthly calendar with mood indicators derived from calls, a memories/photo timeline, and multiple named chat threads per elderly profile for the family to converse with the AI about their relative.
- A family member can invite other family members to share access to the same elderly profile.
- Auth is email/password or Google OAuth (Supabase), with Cloudflare Turnstile bot protection on the auth forms.
- Subscriptions and billing run through Stripe; the customer portal lets a family member manage or cancel their plan.

## Capabilities and Constraints

- Two subscription plans, priced and sold in EUR: Esencial (1 call/day, 4 min/call, 30.99€) and Completo (2 calls/day, 4 min/call, 61.99€).
- Spanish phone numbers only — onboarding validates against the Spanish mobile format. Spain is the market now and is treated as a durable constraint, not a launch-only default; the ambition to expand to other Spanish-speaking countries has not been confirmed.
- All product copy is Spanish-only.
- Full call transcripts are not exposed to family; only AI-generated summaries and alerts are.
- Sensitive topics are set per elderly profile and must be excluded from that relative's calls.

## Brand Commitments

- Name: **Memoria Activa** ("Active Memory") — plays on both the AI's persistent memory of the relative across calls and the emotional idea of keeping an elderly person's memories/story alive.
- Voice: warm, reassuring, non-clinical, emotionally direct. Landing tagline: "Compañía real para quien más quieres" ("Real companionship for the person you love most"). Footer: "Hecho con cariño para las familias" ("Made with care for families").
- Copy consistently frames the product around trust and family peace of mind rather than technology or features.

## Evidence on Hand

No real testimonials, case studies, press mentions, or usage benchmarks exist yet — future work must not fabricate them. Plan pricing, feature lists, and the onboarding/call/alert mechanics described above are real, shipped product facts, not placeholders.

## Product Principles

1. The elderly relative's experience must require zero new technology: the phone call is the entire interface, full stop.
2. Family gets peace of mind from summaries and alerts, not from surveillance — never expose full transcripts, to protect the elderly relative's dignity.
3. Conversations should read as an ongoing relationship (memory carried across calls), never a repeated script.
4. Per-profile sensitive topics are a hard exclusion, not a suggestion, for what the AI raises with that relative.
5. The product commits to Spain and Spanish-only; do not design or write copy that assumes other locales or languages.

## Accessibility & Inclusion

Dashboard users (family members) are assumed tech-comfortable; standard web accessibility best practice applies with no additional low-literacy accommodation. The elderly relative has no digital accessibility surface at all — their only contact with the product is an ordinary voice phone call.

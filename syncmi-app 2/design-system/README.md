# Sync·MI — Design System

> **Sincronize-se com a IA, sem o ruído.**
> *(Sync up with AI, without the noise.)*

**Sync·MI** ("IA destilada" / *AI, distilled*) is a Brazilian-Portuguese product for **people who have no time to waste but want to stay current on technology, Artificial Intelligence, and security — fast.** Everything that matters, in one place. It curates the week in AI and delivers it in three formats, each built to fit into the gaps of a busy routine:

1. **Newsletter** — a weekly edition (Tuesdays). Five minutes to understand the whole week of AI. News, launches, and movements that matter — no hype, no noise.
2. **Podcast Semanal** — a short weekly video (Fridays). Missed the week? Watch it in five minutes — on the treadmill, on the commute, on a coffee break.
3. **Learning de Inovação** — occasional deep dives for when a topic deserves more than five minutes. Each one distills one theme into a practical explainer: what it is, why it matters, what to do about it.

Behind these sits an **Admin Studio** — an internal content-creation workspace (newsletter builder, podcast/video generator, Learning deep-research tool, social-media "Divulgação" studio, source feeds, audience analytics, settings, archive). It uses AI (Claude) to research, draft, and package each format, and ships to subscribers via email with open-tracking.

The product manifesto: *"Acreditamos que entender IA não deveria custar o seu tempo. Curadoria sem ruído é o nosso ofício — e a sua vantagem."* (We believe understanding AI shouldn't cost you your time. Curation without noise is our craft — and your edge.)

---

## Sources

This design system was reverse-engineered from the product's real source code. Explore these to build more faithfully:

- **GitHub — primary app:** [`EMigotto/podcast-studio`](https://github.com/EMigotto/podcast-studio) — the entire product is a single-file React SPA (`index.html`, ~6,000 lines, no build step) plus Vercel serverless functions in `api/`. The `BRAND` object, all CSS, the `<Logo>` component, the Floema-style chaptered landing, the public reader, the podcasts page, and the full Admin Studio all live in that one file. **A local read-only copy is at [`_source/syncmi-app.html`](_source/syncmi-app.html).**
- Related repos by the same author (context, not used directly): [`EMigotto/certificado-digital`](https://github.com/EMigotto/certificado-digital), [`EMigotto/Squad-autonoma`](https://github.com/EMigotto/Squad-autonoma).
- Production deploy referenced in the source: `podcast-studio-lac.vercel.app`.

> The reader is encouraged to open `EMigotto/podcast-studio` and read `index.html` directly when building anything non-trivial — every token, component, and screen here is lifted from it, but the live code is the ultimate source of truth.

---

## Content Fundamentals

**Language.** Everything is **Brazilian Portuguese (pt-BR)**. Keep it that way for any Sync·MI-branded surface. English appears only inside the team-facing Admin.

**Voice & tone.** *Editorial, calm, confident, and time-respecting.* The brand sells **subtraction** — it removes noise so you don't have to. Copy is **direct, succinct, sem hype, sem jargão** (no hype, no excessive jargon). It is warm but not chatty; intelligent but never showy.

**Person.** Speaks **directly to "você"** (you), often imperative and inviting: *"Sincronize-se", "Para você ler no café da manhã", "Assista em cinco minutos"*. The team voice ("nós/we") shows up in the manifesto and process — *"Curamos / Destilamos / Entregamos"* (We curate / We distill / We deliver).

**Casing.** Headlines are **sentence case** in editorial serif (often ending with a period — they read like statements: *"Cinco minutos para entender a semana inteira de IA."*). Eyebrows, labels, meta, and section numbers are **UPPERCASE mono with wide tracking** (*"NEWSLETTER", "EDIÇÃO № 07", "LER MATÉRIA ↗"*).

**Signature motifs in copy:**
- **"Cinco minutos"** / "5 min" — the core promise, repeated everywhere.
- **"Sem ruído" / "sem hype"** — the differentiator.
- **Numbered chapters & editions** — *"Edição № 07", "Capítulo 01", "Aprofundamento Nº 03"*. The `№`/`Nº` glyph and zero-padded numerals (`01`, `02`) are part of the identity.
- **Time-of-day framing** — content is sold by *when* you'll consume it: *"na esteira" (treadmill), "no café da manhã" (breakfast), "no trajeto" (commute)*.
- **One coral word.** Headlines frequently set a single emphasized word in accent italic or in a coral highlight block (the `.mark`).

**Punctuation & glyphs.** The middle dot in the wordmark — **Sync·MI** — is non-negotiable, with `·MI` in accent color. Arrows (`→ ↗ ↓`) terminate CTAs and links. The `№`/`Nº` numero glyph labels editions.

**Emoji.** **Not used in public marketing or editorial copy.** A small, utilitarian set appears **only inside the Admin Studio** as tab/section markers (📰 Newsletter, 🎬 Podcast, 🎓 Learning, 📣 Divulgação, 📡 Fontes, 📊 Audiência, ⚙️ Configurações, 📚 Arquivo) and a few reader controls (🎧 podcast, 💬 comments, 🔍 zoom). Keep public surfaces emoji-free and lean on the stroke-SVG icon set instead.

**Example copy (verbatim):**
- Hero: *"Sincronize-se com a IA, **sem o ruído**."* / sub: *"Cinco minutos para entender a semana inteira."*
- Newsletter chapter: *"Cinco minutos para entender a semana inteira de IA. Toda terça, uma edição com as notícias, lançamentos e movimentos que importam — sem hype, sem ruído."*
- Learning: *"Quando um tema merece mais que cinco minutos."*
- Routine: *"Feito para quem não tem tempo a perder — só os momentos certos para ganhar."*

---

## Visual Foundations

**The feeling:** a **printed editorial object** — a well-set independent magazine — rendered in the browser. Warm paper, real ink, one decisive coral signal, and serif typography doing the talking. Premium, quiet, unhurried.

### Color
- **Warm paper, not white.** The page is `#F5F1E6` (paper) — never pure white. Cards/inputs lift to `#FBF8EE` (paper-light); recessed paper is `#E8E1CD`.
- **Ink, not black.** Text and dark surfaces are `#241F21` (a warm near-black), softening to `#3A3236` and `#807679` for hierarchy.
- **One signal.** A single coral-red — `#E5431B` (`--accent` / `--signal`) — carries *all* emphasis: the live dot in the logo, the highlight mark, link hovers, active states, the progress bar. Deepened to `#A82C0F` for large numerals and alerts. **Resist adding a second accent.**
- **Chapter hues (sparingly).** The Floema landing gives each of its four chapters a full-bleed color: coral `#E97852` (Newsletter), deep blue `#2A3645` (Podcast), sage green `#B3D29B` (Learning), warm tan `#D4B896` (Routine). These are *section-scoped*, not part of the everyday UI palette.
- **Hairlines** are `#DDD4BD` (`--rule`) — warm, low-contrast dividers everywhere.

### Type
- **Instrument Serif** is the editorial voice — hero, headlines, big numerals, italic subtitles. Light, optical, set tight (`-.02em`) with `line-height` near 1.0 on display sizes.
- **Fraunces** (variable, `opsz 144`, with `SOFT`/`WONK` axes) is the original brand display serif — still used for some marks and the Learning-card numerals; lends a soft, slightly wonky personality.
- **Geist** is the body/UI sans — frequently set **light (300)** for an airy editorial feel.
- **JetBrains Mono** is the machine voice — eyebrows, meta, section numbers, labels — always UPPERCASE with `.14em–.28em` tracking.
- Accent emphasis = a single word in **serif italic, coral**.

### Backgrounds & texture
- **Grain.** A fixed SVG `feTurbulence` noise overlay (`.grain`, ~25% opacity, `mix-blend: multiply`) sits over the whole page; the body itself carries a subtler baked-in noise. This is the single most important texture — it makes the paper feel real.
- **Radial glows.** The body has soft, large radial gradients — a coral glow top-left, an ink shadow bottom-right — at very low opacity (4–10%). The hero adds layered radial glows behind the headline.
- **Flowing-information line art.** A signature decorative layer: thin coral SVG paths (`.flow-line`) drifting slowly, with pulsing particles (`.flow-particle`) — an "information flowing" motif behind headers.
- **Particle network.** A canvas of connected dots with subtle mouse attraction sits behind the hero.
- **Chapter photography.** Landing chapters use full-bleed Unsplash-style photos at low opacity (28–42%) with `mix-blend-mode` (multiply/luminosity) so the chapter color dominates and the image becomes texture, not subject. **Imagery is warm, atmospheric, blended-down — never a crisp foreground photo.**

### Animation
- **Easing:** one curve everywhere — `cubic-bezier(.22,.61,.36,1)` (`--ease`), a smooth decelerate. No bounces.
- **Scroll reveals:** content fades up ~40px on entering the viewport (`.fl-reveal`, `.lp-reveal`, GSAP ScrollTrigger), durations ~1.1s.
- **Marquee:** an endless italic-serif strip and a dark mono ticker, both looping linearly.
- **Magnetic CTAs:** buttons drift slightly toward the cursor, then snap back.
- **Hover-to-play:** video cards play muted on hover, pause on leave.
- **The logo** breathes — rings pulse, center signal expands — on a slow infinite loop.
- All motion respects `prefers-reduced-motion`.

### Hover, press & interactive states
- **Buttons:** primary is `ink → accent` on hover with a `-1px` lift; ghost inverts to filled ink. CTA arrows nudge `translate(2px,-2px)`.
- **Cards:** lift on hover (`translateY(-2px to -6px)`) and deepen shadow.
- **List items** (Edições Recentes): the *whole row's background floods coral* and indents `18px` on hover — a bold, magazine-y interaction.
- **Press:** magnetic CTAs scale to `.96`.
- **Nav links:** color → accent on hover.

### Borders, radii & elevation
- **Editorial cards are nearly square-cornered** — `4px` radius — to read as printed cards. Inputs/alerts are `8px`. Video frames and moment cards `18px`. Feature/Learning cards `26px`. Pills, chips, and buttons are fully round (`999px`).
- **Borders** are the warm `1px solid --rule` hairline; dark surfaces use `rgba(245,241,230,.14)`.
- **Two everyday shadows:** `--shadow` (a crisp 1px seat + soft 24px drop) and `--shadow-lg`. Feature cards float on a big soft `0 30px 80px -30px rgba(27,25,20,.35)`.
- **No left-border-accent cards, no purple gradients, no glassmorphism on light surfaces.** (Backdrop blur appears only on the sticky nav and on dark/learning panels.)

### Layout
- **Container:** `max-width: 1320px`, `32px` side padding (`20px` on mobile).
- **Generous vertical rhythm:** sections breathe at `110–120px` vertical padding; the manifesto at `18vh`.
- **Sticky, blurred nav** at top. **Two-color chaptering** drives the landing: alternating paper and full-color sections, each numbered.
- **Section labels:** a mono eyebrow with a number and a `flex:1` hairline that runs to the edge.

---

## Iconography

- **Primary system: custom inline stroke SVGs.** Public/marketing surfaces use hand-tuned line icons — `stroke-width: 1–1.4`, `fill: none`, rounded caps, `currentColor` — in the "moments", "process", and chapter sections. They are lightweight, geometric, and match the editorial line weight. There is **no icon font and no external icon library** in the source. When you need an icon not present in the repo, substitute **[Lucide](https://lucide.dev)** (matching stroke style — 1.5px, round caps) via CDN and **flag the substitution**; do not hand-draw new ones to mix with the originals if a Lucide equivalent exists.
- **The Logo** is the hero icon — the **"Sinal"** mark: five vertical bars in a synced equalizer, the **center coral bar** standing tallest as *the signal*. It animates as a live equalizer pulse (the always-in-sync weekly curation). Provided as [`assets/logo.svg`](assets/logo.svg) (animated), [`assets/logo-static.svg`](assets/logo-static.svg) (print/PDF), and [`assets/logo-mono.svg`](assets/logo-mono.svg) (takes `currentColor`). Default ink bars + coral signal; on dark surfaces pass a light `color` and the signal bar stays coral.
- **Arrows as icons.** Unicode arrows (`→ ↗ ↓ ←`) are used pervasively as CTA/link affordances — part of the type system, not the icon set.
- **The `№` / `Nº` glyph** marks editions and aplied numbering.
- **Emoji** are used **only in the Admin Studio** (tab markers) and a few reader buttons — never in public editorial. See Content Fundamentals.
- **Decorative SVG line art** (`.flow-line` / `.flow-particle`, the particle-network canvas) is illustration, not iconography — copy the patterns from the source if you need them.

---

## Index — what's in this design system

**Foundations**
- [`README.md`](README.md) — this file.
- [`colors_and_type.css`](colors_and_type.css) — all color + type tokens (base classes and semantic `.h1/.h2/.p/.eyebrow` styles). **Import this first** in any artifact.
- [`SKILL.md`](SKILL.md) — Agent-Skill front-matter so this folder works as a downloadable Claude skill.

**Assets** — [`assets/`](assets/)
- `logo.svg` (animated "Sinal" equalizer mark), `logo-static.svg` (print/PDF), `logo-mono.svg` (currentColor) — the brand mark.

**Source (read-only reference)** — [`_source/`](_source/)
- `syncmi-app.html` — the complete production app, imported from GitHub.

**Preview cards** — [`preview/`](preview/)
- The small specimen cards that populate the Design System tab (colors, type, spacing, components, brand). Each is a standalone HTML file.

**UI Kits** — [`ui_kits/`](ui_kits/)
- [`site/`](ui_kits/site/) — the public product: the Floema chaptered **landing**, the **newsletter reader**, the **podcasts page**, and the **Learning** deep-dive. Editorial, brand-defining.
- [`studio/`](ui_kits/studio/) — the internal **Admin Studio**: sidebar/tab navigation and the content-builder surfaces.

Open each kit's `index.html` for an interactive walkthrough; the `.jsx` files are the reusable, mostly-cosmetic component recreations.

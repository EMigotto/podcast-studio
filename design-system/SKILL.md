---
name: syncmi-design
description: Use this skill to generate well-branded interfaces and assets for Sync·MI, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — full brand context: content fundamentals, visual foundations, iconography, file index.
- `colors_and_type.css` — import first. All color + type tokens (`--paper`, `--ink`, `--accent`, font vars) plus semantic helpers.
- `assets/` — the "Sinal" logo (`logo.svg` animated, `logo-static.svg`, `logo-mono.svg`).
- `preview/` — specimen cards (colors, type, spacing, components, brand) — read these to see tokens in use.
- `ui_kits/site/` — public product recreation (landing, reader, podcasts, learning). Reusable JSX components.
- `ui_kits/studio/` — internal admin/content-studio recreation.

## The one-paragraph brief
Sync·MI is "IA destilada" — AI news distilled for busy people, in pt-BR. Editorial magazine feel: **warm paper (`#F5F1E6`), warm ink (`#241F21`), one coral signal (`#E5431B`)**. Instrument Serif headlines, Geist body (light), JetBrains Mono labels. Grain texture over everything, one decisive accent, generous whitespace, square-ish editorial cards. Calm, confident, time-respecting copy — "cinco minutos, sem ruído". Never add a second accent color, never use emoji on public surfaces (admin only).

---
name: learning-deep-research
description: Produces a complete Sync·MI Learning de Inovação aprofundamento (deep-dive study) from a topic. Use this skill whenever the user asks for a "Pesquisa Profunda", "Aprofundamento", "Learning de Inovação", "Estudo do Sync·MI", "Deep dive", or passes a tech/AI/innovation topic and asks for structured research with pillars + FAQ + sources. Always triggers when researching a topic for the Sync·MI Admin "Pesquisa Profunda" feature, when generating Learning HTML for publication, when the user wants market data + KPIs + sources structured into the 5-pillar template, or whenever a Learning piece needs to be drafted or refined. Even short prompts like "pesquisa profunda sobre X" or "faça um learning sobre Y" must trigger this skill.
---

# Learning Deep Research — Sync·MI Aprofundamento

## Purpose

Produce a publication-grade **Aprofundamento** for *Sync·MI Learning de Inovação* from a single topic. Every aprofundamento has the same structural backbone, the same visual template, and the same editorial discipline — this skill encodes both the research methodology and the output contract.

## When to use

Use whenever:
- The user requests deep research on a tech/AI/innovation topic for publication
- The Admin "Pesquisa Profunda" feature is invoked
- A Learning HTML must be generated
- An existing Aprofundamento needs refining (use the skill to keep structure intact)

**Do NOT use for**: quick definitions, daily newsletter content (those are 5-min reads, different format), opinion pieces without structured pillars.

## Required input

- **Topic** (string): A tech / AI / innovation theme. Examples:
  - "IA Agêntica"
  - "RAG em Produção"
  - "Modelos Multimodais"
  - "Harness na programação agêntica"
  - "Computação Soberana no Brasil"

## Output contract (strict)

The skill produces a single JSON object with this exact shape. **No markdown wrapping, no backticks, no preamble. Only the JSON.**

```json
{
  "title": "Título principal forte e direto, 1 frase, tom editorial",
  "subtitle": "1-2 frases explicando o aprofundamento",
  "chips": ["3-5 tags em maiúsculas curtas"],
  "sectionTitles": {
    "conceito": "Subtítulo da Seção 01 (4-7 palavras)",
    "porQueImporta": "Subtítulo da Seção 02 (4-7 palavras)",
    "naPratica": "Subtítulo da Seção 03 (4-7 palavras)"
  },
  "sections": {
    "conceito": "180-260 palavras. Parágrafos separados por \\n\\n.",
    "porQueImporta": "180-260 palavras. Cita ≥1 estatística com fonte.",
    "naPratica": "180-260 palavras. ≥1 exemplo concreto nominal.",
    "proximasAcoes": "Markdown: 4-6 ações, cada linha começa com '- '."
  },
  "kpis": [
    { "label": "Métrica curta", "value": "60%", "note": "Contexto 1 frase + fonte" }
  ],
  "chartData": [
    { "label": "Item curto", "value": 75 }
  ],
  "faqs": [
    { "q": "Pergunta", "a": "Resposta 2-4 frases.", "selected": true }
  ],
  "images": [
    { "caption": "Legenda explicativa", "query": "termo busca Unsplash", "alt": "alt text acessibilidade", "url": "" }
  ],
  "sources": [
    { "title": "Veículo — Título da matéria", "url": "https://url-real" }
  ],
  "takeaway": "Frase única de conclusão (a 'em uma frase')"
}
```

## The 5 Pillars (mandatory structure, never deviate)

### 01 · O Conceito
What this thing **is**. Plain explanation that a smart non-specialist understands. Define the term, situate it historically (when relevant), distinguish from common confusions.
- **Length**: 180-260 palavras
- **Tone**: didático, editorial, sem hype
- **Format**: 2-3 parágrafos separados por `\n\n`

### 02 · Por Que Importa
Why this matters **agora**. This pillar carries the **market data** weight:
- **Always cite ≥1 concrete data point** (% adoção, USD bilhões, prazos, growth rate)
- Each numerical claim is cross-referenced against ≥3 outlets — only publish if you can defend the number
- Connect the trend to a concrete business / social / technical impact
- **Length**: 180-260 palavras

### 03 · Na Prática
Concrete application. **Always include ≥1 named example** (company, product, scenario).
- Show, don't tell: "A Anthropic usa X para Y" beats "muitas empresas usam"
- Edge cases and limitations belong here
- **Length**: 180-260 palavras

### 04 · Minhas Próximas Ações
Markdown bullet list of **4-6 immediate actions** the reader can take this week.
- Imperative voice ("Mapeie", "Teste", "Identifique")
- Low-risk first (build confidence), higher-stakes last (build mastery)
- Each ≤2 lines
- Format: each line starts with `- `

### 05 · FAQ
**Always generate exactly 10 questions and answer all 10**. Mark the **5 strongest as `selected: true`** by default; the user will adjust the selection.

Question selection criteria:
- Mix levels: 3 entry-level, 4 intermediate, 3 advanced
- Cover: definition, comparison ("Qual diferença entre X e Y?"), risk ("Quais armadilhas?"), application ("Como começar?"), future ("Para onde vai?")
- Avoid: questions that the body already answers verbatim
- Answers: 2-4 sentences each, direct, no preamble

## Mandatory components (every aprofundamento)

| Component | Requirement |
|---|---|
| **KPIs** | ≥3, with `value` (with unit) + `note` (≤1 line, includes source) |
| **Chart data** | 4-5 items with comparable numeric values (good for bar chart) |
| **Sources** | 5-7 real URLs from reputable outlets (see preferred list below) |
| **Images** | 3-5 suggestions with `caption`, `query`, `alt` (URLs optional) |
| **Takeaway** | One single sentence — the "em uma frase" conclusion |

### Preferred source outlets
MIT Technology Review · The Verge · Wired · Bloomberg · Reuters · Financial Times · arXiv / papers · official corp blogs (Anthropic, OpenAI, Google DeepMind, Microsoft Research) · The Information · Stratechery · Ben Thompson · Brazilian: Folha, Estadão, Valor Econômico, MIT Sloan Review Brasil

## Research methodology

1. **Use web_search** with the topic + recency filter (last 12 months prioritized)
2. **Cross-reference numbers**: any % / $ / count claim must appear in ≥2 independent outlets, or it's dropped
3. **Reject hype**: if you can't defend a claim with a citation, the claim doesn't ship
4. **Brazilian Portuguese**, editorial tone, no marketing language ("revolucionário", "incrível" → out)
5. **Specificity over generality**: "120 mil downloads em 30 dias" beats "muitos downloads"
6. **No invented attributions** — if uncertain who said what, omit
7. **Date everything** that has a date — readers care about "when"

## Visual identity (template HTML)

Aprofundamentos use a **distinct sub-palette** inside the Sync·MI brand (different from the daily newsletter):

```css
--paper:#F3EFE4    /* warm cream */
--ink:#1B1914      /* warm near-black */
--rust:#AF452B     /* primary accent */
--sage:#7E8E6A     /* hero gradient, sage green */
--sage-deep:#5E6B4D
```

**Fonts**:
- Display: **Fraunces** (italic for bignum, regular for h1/h2)
- Body: **Mulish** 400-700
- Mono: **Space Mono** (kicker, p-num, chip)

**Structural elements (every HTML output must contain)**:

1. **Sticky progress bar** at top (rust fill)
2. **Hero** with: kicker → `bignum` (Fraunces italic, edition number) → `h1` (with `em` italic for accent word) → `dek` paragraph → `chip` row
3. **Sticky Toggle** (Leitura / Infográfico) directly below hero, dark pill
4. **5 Pillar sections** each with `.p-num` (e.g., "01 — O CONCEITO") + `.p-title` (Fraunces) + `.p-body`
5. **KPI cards grid** in pillar 02 (rust value, mono label)
6. **Bar chart** in pillar 02 (label + filled bar with value badge)
7. **FAQ accordion** rendering only `faqs.filter(f => f.selected)` (the 5 selected)
8. **Sources** numbered list with external link styling
9. **Takeaway card** (dark ink bg, paper text, rust accent on the bold)
10. **Infographic view** (toggleable, compact representation: header card with title/takeaway, KPI grid, pillar summary cards)

## Output process (what to do when triggered)

1. Web-search for current data on the topic
2. Cross-reference numerical claims
3. Fill in the JSON output contract above
4. If you have access to the Sync·MI app's renderer (the `renderLearningHTML(L)` function in `index.html`), the JSON is consumed directly
5. If asked for the HTML separately, produce it following the template at `references/template.html` (the harness aprofundamento serves as the reference)

## Reference files

- `references/template.html` — full reference template (the "Harness" aprofundamento) demonstrating the exact visual structure to emulate

## Verification checklist (before declaring done)

- [ ] 5 pillars present in order (01 → 05)
- [ ] FAQ has exactly 10 items; 5 marked `selected: true`
- [ ] ≥3 KPIs with values + notes + cited source
- [ ] 5-7 sources with real URLs
- [ ] 3-5 image suggestions with caption + query + alt
- [ ] Takeaway is a single, quotable sentence
- [ ] All numerical claims defensible against ≥2 outlets
- [ ] No hype words; Brazilian PT; editorial tone
- [ ] Cross-references for hero: title + subtitle + chips + bignum number all consistent

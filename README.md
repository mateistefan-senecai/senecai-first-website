# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML. No build step, no framework, no dependencies.

- `index.html` — the main scrolling page (Hero, Challenge, Partners, Testimonials, How We
  Work, Engagement, Team, FAQ, final CTA), with styling inline on the elements plus one
  `<style>` block in `<head>` (base reset, CTA hover wipe, nav breakpoint, generated
  `:hover`/`:focus-visible` rules), and inline `<script>` blocks (services tabs, scroll
  reveals). Type is Archivo from Google Fonts.
- `regulations-covered.html` / `resources.html` — standalone pages (same nav/footer shell)
  for the two sections that intentionally sit off the main scroll. Linked from the top nav.
  The Regulations page has its own regulation-specific FAQ at the bottom.
- Compliance checkers — three rules-based decision trees on `resources.html`
  (`#compliance-checkers`): general applicability (AI Act, GDPR, NIS2, DORA, CRA), AI Act
  risk class & role (AI systems only; GPAI models are deliberately out of scope), and NIS2 essential / important. Trees, rules and the UI engine live in
  `assets/checkers.v2.js` (versioned like the dot wave — rename on change). Deep links:
  `resources.html#general-checker`, `#aiact-checker`, `#nis2-checker`; the hero's
  "Try the compliance checker" link opens the general one. Legal position: October 2026.
- `legal-notice.html` / `privacy-policy.html` / `terms-of-use.html` — legal pages linked from
  the footer, currently structured placeholders.
- Palette: black `#17160f` and gold `#f8f1de` are the only section backgrounds; every gold
  section (`.bg-gold`) gets the animated gold dot wave
  (`assets/dot-wave.v1.js`, from the design handoff). The file name is versioned because
  `/assets/*` is cached as immutable: rename it (v2, …) whenever it changes.
- `assets/` — product screenshots and the logo used on the page.
- `vercel.json` — long-lived cache headers for `/assets/*`.

## Romanian version

The Romanian site lives in `ro/` (served at `/ro/…`) and is **generated** from the English
pages: `python3 tools/i18n/build_ro.py` translates every text node and attribute using the
dictionaries in `tools/i18n/ro_pages.py` (pages) and `tools/i18n/ro_checkers.py` (compliance
checkers → `assets/checkers.ro.v1.js`), rewrites asset paths and wires the EN/RO switch.
After editing any English page or `assets/checkers.v2.js`, re-run the script: it fails and
lists every string that has no Romanian translation yet, so add those to the dictionaries.
Never edit `ro/*.html` or `assets/checkers.ro.*.js` by hand.

## Local preview

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to Vercel

This is a static site, so Vercel needs zero configuration — Framework preset **Other**, no
build command, output directory **/** (repo root). Just import the repo in the Vercel
dashboard (or run `vercel` from this directory with the Vercel CLI) and it will deploy as-is.

## Known placeholders to fill in before launch

- **Links**: LinkedIn in the footer is still a `#` placeholder. Swap in the real URL.
- **Partner logos** — AIVERGENT still shows a text placeholder (`data-partner` tiles in
  `index.html`); swap it for an `<img>` once the logo file is supplied.
- **Legal pages** — Legal Notice, Privacy Policy and Terms of Use contain placeholder text.
- **OSIM registration number** — the footer reads `[REGISTRATION NUMBER]` on every page.
- **Team bios** — all four team members currently say "Full bio coming soon." Team photos live in `assets/team/`.
- **Substack article titles** in the Research section are derived from the article URLs
  (Substack truncates slugs), not fetched from the live pages — verify wording against the
  published titles.

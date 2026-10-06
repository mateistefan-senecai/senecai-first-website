# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML. No build step, no framework, no dependencies.

- `index.html` — the main scrolling page (Hero, Challenge, Partners, Testimonials, How We
  Work, Engagement, Team, FAQ, final CTA), with styling inline on the elements plus one
  `<style>` block in `<head>` (base reset, CTA hover wipe, nav breakpoint, generated
  `:hover`/`:focus-visible` rules), and inline `<script>` blocks (services tabs, scroll
  reveals). Type is Archivo, self-hosted from `assets/fonts/` (no requests to Google Fonts).
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
  the footer (operator: SenecAI Compliance S.R.L.; text ported from the old senecai.eu site).
- `global-ai-policy-map.html` — the interactive Jurisdiction Map from the Global AI Policy
  Report, ported from the old Next.js site. The React component lives in `tools/policy-map/`
  and is bundled into `assets/policy-map.v1.{js,css}` (`cd tools/policy-map && npm install &&
  npm run build`; bump the version in the file names when it changes). Its data is
  `data/ai-policy-geo.json`; the report PDF is `SenecAI-Global-AI-Policy-Report-2026.pdf`.
- `404.html` — served by Vercel for unknown URLs; all its links are root-absolute.
- SEO: every page's `<head>` carries a generated block (canonical, hreflang incl.
  `x-default`, favicon, Open Graph / Twitter card using `assets/og-image.v1.png`), and
  `sitemap.xml` is generated too — both by `tools/i18n/build_ro.py` (see below).
  `robots.txt`, `favicon.ico` and `apple-touch-icon.png` sit at the root.
- Palette: black `#17160f` and gold `#f8f1de` are the only section backgrounds; every gold
  section (`.bg-gold`) gets the animated gold dot wave
  (`assets/dot-wave.v1.js`, from the design handoff). The file name is versioned because
  `/assets/*` is cached as immutable: rename it (v2, …) whenever it changes.
- `assets/` — product screenshots and the logo used on the page.
- `vercel.json` — long-lived cache headers for `/assets/*`, and permanent redirects from the
  old site's URLs (`/blog/*` → the matching Substack posts, `/compliance`, `/eu-ai-act`,
  `/global-ai-policy-study`).

## Romanian version

The Romanian site lives in `ro/` (served at `/ro/…`) and is **generated** from the English
pages: `python3 tools/i18n/build_ro.py` translates every text node and attribute using the
dictionaries in `tools/i18n/ro_pages.py` (pages) and `tools/i18n/ro_checkers.py` (compliance
checkers → `assets/checkers.ro.v1.js`), rewrites asset paths and wires the EN/RO switch.
The same script writes the SEO head block of every page (both languages) and `sitemap.xml`;
to add a page, append it to `PAGE_FILES`.
After editing any English page or `assets/checkers.v2.js`, re-run the script: it fails and
lists every string that has no Romanian translation yet, so add those to the dictionaries.
Never edit `ro/*.html` or `assets/checkers.ro.*.js` by hand.

## Local preview

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000  (fonts and the policy map use root-absolute paths, so
# opening the files directly from disk shows fallback fonts and no map)
```

## Deploying to Vercel

This is a static site, so Vercel needs zero configuration — Framework preset **Other**, no
build command, output directory **/** (repo root). Just import the repo in the Vercel
dashboard (or run `vercel` from this directory with the Vercel CLI) and it will deploy as-is.

## Known placeholders to fill in before launch

- **Links**: LinkedIn in the footer still points to `#top`. Swap in the real URL.
- **Partner logos** — AIVERGENT still shows a text placeholder (`data-partner` tiles in
  `index.html`); swap it for an `<img>` once the logo file is supplied.
- **Research cards** list the 10 latest *The AI Act Guy* editions (#21–#30, as of
  5 October 2026); update them by hand as new editions go out.

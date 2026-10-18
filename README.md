# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML. No build step, no framework; the only dependencies are `nodemailer` and
`pdfkit`, for the two serverless functions in `api/` (contact form, checker report).

- `index.html` — the main scrolling page (Hero, Challenge, Partners, Testimonials, How We
  Work, Engagement, Team, FAQ, final CTA), with styling inline on the elements plus one
  `<style>` block in `<head>` (base reset, CTA hover wipe, nav breakpoint, generated
  `:hover`/`:focus-visible` rules), and inline `<script>` blocks (services tabs, scroll
  reveals). Type is Archivo, self-hosted from `assets/fonts/` (no requests to Google Fonts).
- `regulations-covered.html` / `resources.html` — standalone pages (same nav/footer shell)
  for the two sections that intentionally sit off the main scroll. Linked from the top nav.
  The Regulations page has its own regulation-specific FAQ at the bottom.
- Compliance checkers — three rules-based decision trees: general applicability (AI Act,
  GDPR, NIS2, DORA, CRA), AI Act risk class & role (AI systems only; GPAI models are
  deliberately out of scope), and NIS2 essential / important. Trees, rules and the UI engine
  live in `assets/checkers.v4.js`, their styles in `assets/checkers.v1.css` (both versioned
  like the dot wave — rename on change). Each checker runs on a page of its own, to share
  directly: `/eu-compliance-checker`, `/ai-act-checker`, `/nis2-checker` (and `/ro/…`); the
  engine's `PAGES` map lists them, and each page has a "Copy link" button.
  `resources.html#compliance-checkers` shows only three title cards linking to those pages
  (old deep links `#general-checker`, `#aiact-checker`, `#nis2-checker` forward to them), and
  the hero's "Try the compliance checker" link opens the general one.

  Legal position: October 2026.
- Checker PDF report by email (lead magnet) — after the last question the visitor must leave
  their email to see the result (name, company and a follow-up consent box are optional);
  the result appears on screen once the report has been emailed. Changing an answer and
  finishing again asks again, with the email pre-filled. If sending fails on our side
  (5xx or network), the result is shown anyway with a note, and the function logs the
  visitor's details so the lead is still in the Vercel logs.
  `api/checker-report.js` receives only the tool id and the answers, re-walks the tree with
  the same engine file the page runs (`walk()` rejects any answer that is not on the path or
  not an option), renders the result with `pdfkit` (`api/_lib/report-pdf.js`, Archivo
  embedded from `api/_lib/fonts/`, logo from `assets/`) and emails it to the visitor, with a
  copy to `LEADS_TO` (default `hello@senecai.eu`) saying who asked and whether they agreed to a follow-up. Nothing is
  stored. Same SMTP environment variables as the contact form. When `checkers.v4.js` or
  `checkers.ro.v3.js` is renamed, update `ENGINES` in `api/checker-report.js` and
  `includeFiles` in `vercel.json`. The PDF and email text lives in the engine's `UI` object,
  so the Romanian build translates it like everything else.
- Quote questionnaires — two forms rendered by `assets/quote.v3.js` (data + engine, versioned
  like the checkers) and emailed through `api/quote.js` to `LEADS_TO` (default `hello@senecai.eu`; same SMTP variables as the contact form;
  nothing is stored, progress is kept in the visitor's browser until they submit):
  - `get-a-quote.html` — Tier 1, "Get a quote in 24 hours", the lead magnet linked from the hero
    and the Resources page (`/quote` redirects here). Scope checks for NIS2, DORA and CRA come
    first; their targeted questions appear only when the company is likely in scope. AI Act roles
    are inferred from plain-language questions, never asked by name.
  - `discovery.html` — Tier 2, the detailed discovery brief for interested clients. Unlisted
    (`noindex`, not in the sitemap or nav). It can be opened pre-filled with a profile
    (`/discovery?p=…`), but the Tier 1 email no longer includes that link; its sections follow the same scope logic, and the Cyber section
    is the security partners' wording, unchanged.
- `legal-notice.html` / `privacy-policy.html` / `terms-of-use.html` — legal pages linked from
  the footer (operator: SenecAI Compliance S.R.L.; text ported from the old senecai.eu site).
- `global-ai-policy-map.html` — the interactive Jurisdiction Map from the Global AI Policy
  Report, ported from the old Next.js site. The React component lives in `tools/policy-map/`
  and is bundled into `assets/policy-map.v1.{js,css}` (`cd tools/policy-map && npm install &&
  npm run build`; bump the version in the file names when it changes). Its data is
  `data/ai-policy-geo.json`; the report PDF is `SenecAI-Global-AI-Policy-Report-2026.pdf`.
- `404.html` — served by Vercel for unknown URLs; all its links are root-absolute.
- Contact form — in the "Ready to get compliant?" band on every page. `assets/contact-form.v1.js`
  posts it to `api/contact.js`, a Vercel serverless function that emails the enquiry (nothing is
  stored) through Google Workspace SMTP (`api/_lib/mail.js`, shared with the checker report) to `matei.stefan@senecai.eu`, with Reply-To set to the
  sender. It needs two environment variables in Vercel (Settings → Environment Variables,
  Production): `SMTP_USER` (the Workspace address that sends, e.g. `matei.stefan@senecai.eu`)
  and `SMTP_PASS` (a Google app password for that account). Optional: `CONTACT_TO` (contact form recipient), `LEADS_TO` (quote and checker-report recipient),
  `SMTP_HOST`, `SMTP_PORT`. Without them the form shows its error line, which points to the
  email address. `package.json` exists only for the functions' dependencies.
- SEO: every page's `<head>` carries a generated block (canonical, hreflang incl.
  `x-default`, favicon, Open Graph / Twitter card using `assets/og-image.v1.png`), and
  `sitemap.xml` is generated too — both by `tools/i18n/build_ro.py` (see below).
  `robots.txt`, `favicon.ico` and `apple-touch-icon.png` sit at the root.
- Palette: black `#17160f` and gold `#f8f1de` are the only section backgrounds; every gold
  section (`.bg-gold`) gets the animated gold dot wave
  (`assets/dot-wave.v1.js`, from the design handoff). The file name is versioned because
  `/assets/*` is cached as immutable: rename it (v2, …) whenever it changes.
- `assets/` — product screenshots and the logo used on the page.
- `vercel.json` — long-lived cache headers for `/assets/*`, the files the checker-report
  function reads at run time (`includeFiles`), and permanent redirects from the
  old site's URLs (`/blog/*` → the matching Substack posts, `/compliance`, `/eu-ai-act`,
  `/global-ai-policy-study`).

## Romanian version

The Romanian site lives in `ro/` (served at `/ro/…`) and is **generated** from the English
pages: `python3 tools/i18n/build_ro.py` translates every text node and attribute using the
dictionaries in `tools/i18n/ro_pages.py` (pages) and `tools/i18n/ro_checkers.py` (compliance
checkers → `assets/checkers.ro.v3.js`) and `tools/i18n/ro_quote.py` (quote questionnaires →
`assets/quote.ro.v3.js`), rewrites asset paths and wires the EN/RO switch.
The same script writes the SEO head block of every page (both languages) and `sitemap.xml`;
to add a page, append it to `PAGE_FILES`.
After editing any English page or `assets/checkers.v4.js`, re-run the script: it fails and
lists every string that has no Romanian translation yet, so add those to the dictionaries.
Never edit `ro/*.html`, `assets/checkers.ro.*.js` or `assets/quote.ro.*.js` by hand.

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

- **Partner logos** — AIVERGENT still shows a text placeholder (`data-partner` tiles in
  `index.html`); swap it for an `<img>` once the logo file is supplied.
- **Research cards** list the 10 latest *The AI Act Guy* editions (#21–#30, as of
  5 October 2026); update them by hand as new editions go out.

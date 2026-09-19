# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML. No build step, no framework, no dependencies.

- `index.html` — the main scrolling page (Hero, Challenge, Partners, Testimonials, How We
  Work, Engagement, Team, FAQ, final CTA), with styling inline on the elements plus one
  `<style>` block in `<head>` (base reset, CTA hover wipe, nav breakpoint, generated
  `:hover`/`:focus-visible` rules), and inline `<script>` blocks (services tabs, scroll
  reveals). Type is Archivo from Google Fonts.
- `regulations-covered.html` / `research.html` — standalone pages (same nav/footer shell)
  for the two sections that intentionally sit off the main scroll. Linked from the top nav.
- `assets/` — product screenshots and the logo used on the page.
- `vercel.json` — long-lived cache headers for `/assets/*`.

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
- **Team bios** — all three team members currently say "Full bio coming soon."
- **Language toggle** — EN/RO switch is a visual placeholder only; Romanian copy isn't
  implemented yet.
- **Substack article titles** in the Research section are derived from the article URLs
  (Substack truncates slugs), not fetched from the live pages — verify wording against the
  published titles.

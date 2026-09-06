# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML. No build step, no framework, no dependencies.

- `index.html` — all page content and markup, with styling inline on the elements plus one
  `<style>` block in `<head>` (base reset, CTA hover wipe, nav breakpoint, generated
  `:hover`/`:focus-visible` rules), and two inline `<script>` blocks (services tabs, platform
  slideshow, scroll reveals). Type is Archivo from Google Fonts.
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

- **Links**: the Research nav item points at the footer Substack entry (`#substack`), and
  both Substack and LinkedIn are `#` placeholders. Swap in real URLs.
- **Governance Hub CTA** links to the on-page `#cta` section — update once the Hub product
  has a public URL.
- **Testimonials & Partners** section has a "coming soon" placeholder rather than real
  quotes/logos.
- **Team bios** — all four team members currently say "Full bio coming soon."
- **Language toggle** — EN/RO switch is a visual placeholder only; Romanian copy isn't
  implemented yet.
- **Hero screenshot** is labelled as an illustrative view of the Governance Hub.

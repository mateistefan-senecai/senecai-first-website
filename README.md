# SenecAI Website

Marketing site for SenecAI — EU digital compliance (AI Act, GDPR, DORA, NIS2) in the AI era.

## Stack

Plain static HTML/CSS/JS. No build step, no framework, no dependencies.

- `index.html` — all page content, sectioned and commented (1. Hero, 2. Method, 3. Governance Hub, ... 11. Closing CTA)
- `assets/css/styles.css` — all styling (colors/spacing are CSS custom properties at the top of the file — edit those to retheme)
- `assets/js/main.js` — services tab switching, FAQ accordion, mobile nav toggle, language toggle (visual only)

## Local preview

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to Vercel

This is a static site, so Vercel needs zero configuration — just import the repo in the Vercel dashboard (or run `vercel` from this directory with the Vercel CLI) and it will deploy as-is.

## Known placeholders to fill in before launch

- **CTA email links** (`#cta` section, and header "Book a free intro call") currently point to `mailto:hello@senecai.eu` as a placeholder — replace with a real contact address, booking link (e.g. Calendly), or contact form.
- **Governance Hub CTA** ("Explore the SenecAI Governance Hub") currently links to the on-page `#cta` section — update once the Hub product has a public URL.
- **Testimonials & Partners** section has an honest "coming soon" placeholder rather than empty logo boxes — swap in real quotes/logos once available.
- **Team bios** — all four team members currently say "Full bio coming soon."
- **Language toggle** — EN/RO switch is a visual placeholder only; Romanian copy isn't implemented yet.

# Marketing material

Not deployed: `marketing/` is listed in `.vercelignore`.

- `senecai-promo-1080p.mp4`: an 18.5-second promo video, 1920x1080, 30 fps, H.264, no audio
  (add music in the platform you post it on).
- `senecai-promo-reels-1080x1920.mp4`: the same video as a 9:16 cut for Instagram Reels, TikTok
  and Stories, using phone screenshots of the site and keeping text clear of the Reels buttons.
  Rebuild with `node marketing/src/render-video.mjs --vertical`.
- `SenecAI-Prospect-Deck.pdf`: a 12-slide 16:9 deck to send to prospects. Its links (Calendly,
  email, LinkedIn, site) are clickable.

Both are built from the HTML in `src/` and use the live site's fonts, logo and screenshots
(`src/shots/`). All copy comes from the site. To rebuild after editing:

```bash
python3 -m http.server 8000          # from the repo root
node marketing/src/render-video.mjs  # add --preview 2,6,10 for stills of single frames
node marketing/src/render-deck.mjs
```

These need Playwright (Chromium) and ffmpeg. Retake the screenshots in `src/shots/` whenever
the site changes visibly.

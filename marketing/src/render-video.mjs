// Renders video.html frame by frame into an H.264 MP4.
//   python3 -m http.server 8000   (from the repo root)
//   node marketing/src/render-video.mjs [--preview 0,4,8,12,17]
// Needs Playwright (Chromium) and ffmpeg on PATH.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..');
const FPS = 30;
const URL = process.env.VIDEO_URL || 'http://localhost:8000/marketing/src/video.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
const stage = await page.$('#stage');
const duration = await page.evaluate(() => window.DURATION);

const previewArg = process.argv.indexOf('--preview');
if (previewArg > -1) {
  const dir = join(here, 'preview');
  mkdirSync(dir, { recursive: true });
  for (const t of process.argv[previewArg + 1].split(',').map(Number)) {
    await page.evaluate((t) => window.render(t), t);
    await stage.screenshot({ path: join(dir, `t${t}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const out = join(outDir, 'senecai-promo-1080p.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const frames = Math.round(duration * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.render(t), i / FPS);
  const buf = await stage.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 60 === 0) console.log(`frame ${i}/${frames}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('wrote', out);

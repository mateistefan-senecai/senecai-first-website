// Renders linkedin-cover.html to marketing/senecai-linkedin-cover.png (3168x792, i.e. 1584x396 at 2x)
// and a preview with a profile photo placed where LinkedIn puts it.
//   python3 -m http.server 8000   (from the repo root)
//   node marketing/src/render-linkedin-cover.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1584, height: 396 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:8000/marketing/src/linkedin-cover.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.locator('#cover').screenshot({ path: join(here, '..', 'senecai-linkedin-cover.png') });

// Preview only (not uploaded): the desktop profile photo sits about 24px from the left, centred on the bottom edge.
await page.evaluate(() => {
  const img = document.createElement('img');
  img.src = '/assets/team/matei-stefan.jpg';
  img.style.cssText = 'position:absolute;left:24px;top:170px;width:300px;height:300px;border-radius:50%;object-fit:cover;border:6px solid #fff;box-shadow:0 0 0 1px #ddd';
  document.getElementById('cover').style.overflow = 'visible';
  document.getElementById('cover').appendChild(img);
  return new Promise((r) => (img.complete ? r() : (img.onload = r)));
});
await page.setViewportSize({ width: 1584, height: 480 });
await page.screenshot({ path: join(here, 'preview-linkedin-cover.png'), clip: { x: 0, y: 0, width: 1584, height: 480 } });
await browser.close();
console.log('ok');

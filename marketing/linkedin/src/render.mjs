// Renders the LinkedIn rebrand graphics into ../exports with headless Chromium.
// Run from the repo root: node marketing/linkedin/src/render.mjs
// Playwright is not a site dependency: point NODE_PATH at a global install, e.g.
// NODE_PATH=$(npm root -g) node marketing/linkedin/src/render.mjs
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const out = path.resolve(here, "../exports");
const url = (p) => pathToFileURL(path.join(root, p)).href;

const C = { black: "#17160f", ink: "#201e1d", cream: "#f8f1de", gold: "#d5aa4b", goldDeep: "#c9a227", bronze: "#8a6a1f", muted: "#4a453e", line: "#ddd7c8" };

const base = `
<style>
@font-face { font-family: Archivo; font-weight: 400 900; src: url(${url("assets/fonts/archivo-latin-ext.v1.woff2")}); unicode-range: U+0100-02BA, U+1E00-1EFF; }
@font-face { font-family: Archivo; font-weight: 400 900; src: url(${url("assets/fonts/archivo-latin.v1.woff2")}); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122, U+2192; }
* { box-sizing: border-box; margin: 0; }
html, body { background: ${C.black}; }
body { font-family: Archivo, sans-serif; -webkit-font-smoothing: antialiased; }
.frame { position: relative; overflow: hidden; }
.dark { background: ${C.black}; color: ${C.cream}; }
.bg-gold { background: ${C.cream}; color: ${C.ink}; }
.frame > * { position: relative; z-index: 1; }
canvas[data-dot-wave] { position: absolute !important; inset: 0; width: 100%; height: 100%; z-index: 0 !important; }
.eyebrow { font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.display { font-weight: 900; text-transform: uppercase; line-height: .92; letter-spacing: -.01em; }
.gold { color: ${C.gold}; }
.bronze { color: ${C.bronze}; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; background: ${C.gold}; }
.logo { display: block; }
.pill { display: inline-block; border: 2px solid currentColor; border-radius: 999px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
</style>`;

const logoLight = url("assets/senecai-compliance-logo-light.png");
const mark = pathToFileURL(path.join(here, "mark.png")).href;
const wave = `<script src="${url("assets/dot-wave.v1.js")}"></script>`;
const REGS = "AI Act · GDPR · NIS2 · DORA · CRA · ISO 27001 · ISO 42001";

// A gold dot-wave for dark frames: same maths as the site, drawn on a dark ground.
const darkWave = (cls = "") => `<div class="bg-gold ${cls}" data-wave-strength="0.9" style="position:absolute;inset:0;background:transparent;z-index:0"></div>`;

const assets = [];
const png = (name, w, h, body) => assets.push({ name, w, h, body, kind: "png" });

// ---------- Logo (square, LinkedIn crops it to a circle on personal profiles) ----------
png("logo-400", 400, 400, `
<div class="frame dark" style="width:400px;height:400px;display:grid;place-items:center">
  <img src="${mark}" style="width:230px">
</div>`);

// ---------- Company cover 1128x191 ----------
png("company-cover-1128x191", 1128, 191, `
<div class="frame dark" style="width:1128px;height:191px">
  ${darkWave()}
  <div style="position:absolute;right:56px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right">
    <div class="display" style="font-size:38px">EU digital compliance</div>
    <div class="display gold" style="font-size:38px;margin-top:4px">for startups & SMEs</div>
    <div class="eyebrow" style="font-size:12px;color:${C.line};margin-top:14px">${REGS} &nbsp;·&nbsp; <span class="gold">senecai.eu</span></div>
  </div>
  <div class="bar" style="height:5px"></div>
</div>`);

// ---------- Personal cover 1584x396 (profile photo covers the bottom-left) ----------
png("personal-cover-1584x396", 1584, 396, `
<div class="frame dark" style="width:1584px;height:396px">
  ${darkWave()}
  <div style="position:absolute;right:80px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right">
    <img class="logo" src="${logoLight}" style="height:66px;margin-bottom:30px">
    <div class="display" style="font-size:54px">EU digital compliance</div>
    <div class="display gold" style="font-size:54px;margin-top:6px">for startups & SMEs</div>
    <div class="eyebrow" style="font-size:15px;color:${C.line};margin-top:22px">Legal · Technical · Security &nbsp;—&nbsp; <span class="gold">senecai.eu</span></div>
  </div>
  <div class="bar" style="height:7px"></div>
</div>`);

// ---------- Post 01: rebrand announcement ----------
png("post-01-rebrand", 1200, 1200, `
<div class="frame dark" style="width:1200px;height:1200px;padding:96px">
  ${darkWave()}
  <div class="eyebrow gold" style="font-size:22px">New name. Wider remit.</div>
  <div style="margin-top:70px;font-size:46px;font-weight:600;color:${C.line};text-decoration:line-through;text-decoration-color:${C.gold};text-decoration-thickness:4px">SenecAI Consulting</div>
  <div class="display" style="font-size:108px;margin-top:26px">SenecAI is now</div>
  <img class="logo" src="${logoLight}" style="height:200px;margin-top:60px;margin-left:-4px">
  <div style="position:absolute;left:96px;right:96px;bottom:110px">
    <div style="font-size:34px;line-height:1.35;font-weight:500;max-width:880px">From the EU AI Act to the whole EU digital rulebook, with one legal, technical and security team.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:36px;color:${C.gold}">
      ${["AI Act", "GDPR", "NIS2", "DORA", "CRA", "ISO 27001", "ISO 42001"].map((r) => `<span class="pill" style="font-size:19px;padding:9px 18px">${r}</span>`).join("")}
    </div>
  </div>
  <div class="bar" style="height:12px"></div>
</div>`);

// ---------- Posts 02-07: service series (cream frames with the dot wave) ----------
const services = [
  ["post-02-ai-inventory", "AI Act · ISO 42001", "AI inventory & risk classification", "Built, bought, or quietly embedded by a vendor: you can't classify what you don't know you run.", ["Inventory of every AI system", "Role determination & risk tier", "Conformity documentation"]],
  ["post-03-agentic", "AI Act", "Governing agentic workflows", "When an AI agent acts, who is accountable?", ["Human oversight & accountability mapping", "Guardrails & escalation logic", "Agentic governance documentation"]],
  ["post-04-gdpr", "GDPR", "Data governance & privacy", "AI doesn't create a GDPR carve-out. It usually adds obligations.", ["Data mapping & legal basis review", "DPIAs & privacy by design", "Vendor & DPA review"]],
  ["post-05-dora", "DORA", "Operational resilience", "DORA doesn't only apply to banks. It reaches their ICT providers too.", ["ICT risk management framework", "Incident classification & reporting", "Resilience testing & third-party risk"]],
  ["post-06-nis2", "NIS2 · ISO 27001", "Security governance", "NIS2 puts personal liability on management. Make it a board-level plan.", ["NIS2 gap assessment & governance", "ISO 27001 implementation", "Incident response planning"]],
  ["post-07-audits", "AI Act · GDPR · NIS2 · DORA · CRA", "Compliance audits", "Compliant on paper isn't the same as proving it under pressure.", ["Audits across every framework", "Evidence & documentation review", "Readiness for regulators, clients & investors"]],
];
services.forEach(([name, tag, title, hook, bullets], i) => png(name, 1200, 1200, `
<div class="frame bg-gold" data-wave-strength="1" style="width:1200px;height:1200px;padding:96px">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div class="eyebrow bronze" style="font-size:22px">What we do · ${String(i + 1).padStart(2, "0")}/06</div>
    <span class="pill bronze" style="font-size:18px;padding:8px 18px">${tag}</span>
  </div>
  <div class="display" style="font-size:100px;margin-top:90px;max-width:960px">${title}</div>
  <div style="font-size:40px;line-height:1.3;font-weight:500;margin-top:44px;max-width:900px;color:${C.muted}">${hook}</div>
  <div style="position:absolute;left:96px;right:96px;bottom:96px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="background:${C.black};color:${C.cream};padding:34px 40px;border-radius:6px;min-width:560px">
      ${bullets.map((b) => `<div style="font-size:26px;font-weight:600;line-height:1.7"><span class="gold">→</span>&nbsp; ${b}</div>`).join("")}
    </div>
    <div style="text-align:right">
      <div style="background:${C.black};padding:18px 22px;border-radius:6px;display:inline-block"><img src="${logoLight}" style="height:56px;display:block"></div>
      <div class="eyebrow bronze" style="font-size:18px;margin-top:16px">senecai.eu</div>
    </div>
  </div>
</div>`));

// ---------- Post 08: testimonial ----------
png("post-08-testimonial", 1200, 1200, `
<div class="frame dark" style="width:1200px;height:1200px;padding:96px">
  ${darkWave()}
  <div class="eyebrow gold" style="font-size:22px">What founders say</div>
  <div class="gold" style="font-size:260px;font-weight:900;line-height:.8;margin-top:60px">“</div>
  <div style="font-size:58px;line-height:1.18;font-weight:700;max-width:980px;margin-top:-30px">Precise, honest about the limits, and written for founders, not for lawyers.</div>
  <div style="margin-top:56px;font-size:28px;font-weight:600">Leo Dumitru</div>
  <div style="margin-top:6px;font-size:24px;color:${C.line}">Founder, WebHunt.io</div>
  <div style="position:absolute;left:96px;right:96px;bottom:96px;display:flex;justify-content:space-between;align-items:flex-end">
    <img src="${logoLight}" style="height:78px">
    <div class="eyebrow gold" style="font-size:18px">senecai.eu</div>
  </div>
  <div class="bar" style="height:12px"></div>
</div>`);

// ---------- Carousel (PDF document post, 1080x1350) ----------
const slide = (n, inner, { cream = false } = {}) => `
<section class="frame ${cream ? "bg-gold" : "dark"}" ${cream ? 'data-wave-strength="1"' : ""} style="width:1080px;height:1350px;padding:88px;page-break-after:always">
  ${cream ? "" : darkWave()}
  ${inner}
  <div style="position:absolute;left:88px;right:88px;bottom:70px;display:flex;justify-content:space-between;align-items:center">
    <img src="${cream ? mark : logoLight}" style="height:${cream ? 54 : 50}px">
    <div class="eyebrow ${cream ? "bronze" : "gold"}" style="font-size:18px">${n}/8</div>
  </div>
</section>`;

const regSlide = (n, ref, name, what, who, key, cream) => slide(n, `
  <div class="eyebrow ${cream ? "bronze" : "gold"}" style="font-size:20px">${ref}</div>
  <div class="display" style="font-size:118px;margin-top:30px">${name}</div>
  <div style="margin-top:70px">
    ${[["What", what], ["Who", who]].map(([k, v]) => `
      <div style="border-top:2px solid ${cream ? C.ink : C.muted};padding:26px 0 34px">
        <div class="eyebrow ${cream ? "bronze" : "gold"}" style="font-size:18px">${k}</div>
        <div style="font-size:36px;line-height:1.32;font-weight:500;margin-top:12px">${v}</div>
      </div>`).join("")}
  </div>
  <div style="background:${cream ? C.black : C.gold};color:${cream ? C.cream : C.black};padding:28px 34px;border-radius:6px;font-size:32px;font-weight:700;line-height:1.3;margin-top:10px">${key}</div>
`, { cream });

const carousel = [
  slide(1, `
    <div class="eyebrow gold" style="font-size:22px">The 2026 rulebook for startups & SMEs</div>
    <div class="display" style="font-size:150px;margin-top:80px">Which EU digital rules</div>
    <div class="display gold" style="font-size:150px">apply to you?</div>
    <div style="font-size:38px;font-weight:500;margin-top:70px;color:${C.line}">${REGS}</div>
    <div class="eyebrow gold" style="font-size:26px;margin-top:90px">Swipe →</div>`),
  regSlide(2, "Regulation (EU) 2024/1689", "EU AI Act", "Risk-based rules for AI systems and general-purpose AI models: prohibited, high-risk, transparency and minimal-risk tiers.", "Providers, deployers, importers and distributors, including non-EU companies whose AI is used in the EU.", "Fines up to €35M or 7% of global turnover.", true),
  regSlide(3, "Regulation (EU) 2016/679", "GDPR", "Any processing of personal data of people in the EU, including AI training, inference and log data.", "Controllers and processors, wherever they are based.", "Fines up to €20M or 4% of global turnover.", false),
  regSlide(4, "Directive (EU) 2022/2555", "NIS2", "Cybersecurity risk management and incident reporting: early warning in 24h, notification in 72h.", "Medium and large “essential” and “important” entities across 18 sectors.", "Management can be held personally liable.", true),
  regSlide(5, "Regulation (EU) 2022/2554", "DORA", "ICT risk management, incident reporting, resilience testing and a register of ICT third parties.", "Banks, insurers, investment, payment, e-money and crypto firms, and the ICT providers serving them.", "In force since 17 January 2025.", false),
  regSlide(6, "Regulation (EU) 2024/2847", "Cyber Resilience Act", "Security by design, vulnerability handling and an SBOM for hardware and software with digital elements.", "Manufacturers, importers and distributors of connected products sold in the EU.", "Reporting from 11 Sept 2026; most duties from 11 Dec 2027.", true),
  regSlide(7, "ISO/IEC 27001 · ISO/IEC 42001", "ISO 27001 & 42001", "Certifiable management systems for information security (ISMS) and AI (AIMS).", "Voluntary, but increasingly requested by enterprise buyers and investors.", "Overlap heavily with NIS2, DORA and the AI Act.", false),
  slide(8, `
    <div class="eyebrow bronze" style="font-size:22px">How we work</div>
    <div class="display" style="font-size:108px;margin-top:60px">One programme.</div>
    <div class="display bronze" style="font-size:108px">Every framework.</div>
    <div style="font-size:38px;line-height:1.35;font-weight:500;margin-top:56px;max-width:860px;color:${C.muted}">Risk management, incident reporting, supplier management and documentation overlap. We build the controls once and map them to every regulation that applies to you.</div>
    <div style="margin-top:70px;background:${C.black};color:${C.cream};padding:36px 40px;border-radius:6px">
      <div class="eyebrow gold" style="font-size:18px">Free compliance checker</div>
      <div style="font-size:44px;font-weight:800;margin-top:10px">senecai.eu/resources →</div>
    </div>`, { cream: true }),
];

const page = (body, w, h) => `<!doctype html><html><head><meta charset="utf-8">${base}
<style>@page { size: ${w}px ${h}px; margin: 0 }</style></head><body>${body}${wave}</body></html>`;

const browser = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
// Reduced motion makes the dot wave draw a single static frame.
const ctx = await browser.newContext({ deviceScaleFactor: 2, reducedMotion: "reduce" });
const tab = await ctx.newPage();
// Pages load from a file:// URL so they may reference the local fonts, logo and dot-wave script.
const tmp = path.join(here, ".render.html");
const load = async (html) => {
  fs.writeFileSync(tmp, html);
  await tab.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(150);
};
fs.mkdirSync(out, { recursive: true });

for (const a of assets) {
  await tab.setViewportSize({ width: a.w, height: a.h });
  await load(page(a.body, a.w, a.h));
  await tab.screenshot({ path: path.join(out, `${a.name}.png`), clip: { x: 0, y: 0, width: a.w, height: a.h } });
  console.log("wrote", a.name);
}

await tab.setViewportSize({ width: 1080, height: 1350 });
await load(page(carousel.join(""), 1080, 1350));
await tab.pdf({ path: path.join(out, "carousel-which-rules-apply.pdf"), width: "1080px", height: "1350px", printBackground: true });
// Slide PNGs too, for previews and for platforms that don't take PDFs.
const slides = await tab.$$("section");
for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(out, `carousel-slide-${i + 1}.png`) });
console.log("wrote carousel");
await browser.close();
fs.rmSync(tmp, { force: true });

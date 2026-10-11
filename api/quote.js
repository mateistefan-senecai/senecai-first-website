// Quote questionnaire endpoint (Vercel serverless function): receives the answers from
// get-a-quote.html (Tier 1) or discovery.html (Tier 2), rendered client-side by
// assets/quote.v1.js, and emails them as a brief through Google Workspace SMTP.
// Nothing is stored. Uses the same SMTP_USER / SMTP_PASS (and optional CONTACT_TO,
// SMTP_HOST, SMTP_PORT) as api/contact.js.
const nodemailer = require("nodemailer");

const TO = process.env.CONTACT_TO || "matei.stefan@senecai.eu";
const SITE = "https://www.senecai.eu";
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const MAX_ITEMS = 250;

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function oneLine(value) {
  return value.replace(/[\r\n]+/g, " ");
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function list(value, max) {
  return Array.isArray(value) ? value.slice(0, 20).map((x) => oneLine(clean(x, max))).filter(Boolean) : [];
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "method" });
    return;
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};

  // Spam traps: a hidden field people never fill in, and forms sent within 20 s of the page loading.
  const started = Number(b.t);
  if (clean(b.website, 200) || (started && Date.now() - started < 20000)) {
    res.status(200).json({ ok: true });
    return;
  }

  const tool = b.tool === "discovery" ? "discovery" : "quick";
  const lang = b.lang === "ro" ? "ro" : "en";
  const name = oneLine(clean(b.name, 200));
  const email = oneLine(clean(b.email, 254));
  const company = oneLine(clean(b.company, 200));
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, MAX_ITEMS).map((it) => ({
    s: oneLine(clean(it && it.s, 120)),
    n: oneLine(clean(it && it.n, 12)),
    q: oneLine(clean(it && it.q, 600)),
    a: clean(it && it.a, 4000),
  })).filter((it) => it.q && it.a);
  const sm = b.summary && typeof b.summary === "object" ? b.summary : {};
  const likely = list(sm.likely, 120);
  const unlikely = list(sm.unlikely, 120);
  const roles = list(sm.roles, 120);
  // Only a link to our own discovery page is passed on; anything else is dropped.
  const prefill = /^\/(ro\/)?discovery\?p=[A-Za-z0-9_-]{1,6000}$/.test(String(b.prefill || "")) ? SITE + b.prefill : "";

  if (!name || !EMAIL_RE.test(email) || items.length < 3) {
    res.status(400).json({ ok: false, error: "invalid" });
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("quote: SMTP_USER / SMTP_PASS are not set");
    res.status(500).json({ ok: false, error: "config" });
    return;
  }

  const title = tool === "discovery" ? "Discovery brief" : "Quote request (24h)";
  const who = company || name;
  const meta = [
    ["Company", company || "-"],
    ["Contact", `${name} <${email}>`],
    ["Form", `${title} · ${lang.toUpperCase()}`],
  ];
  if (likely.length) meta.push(["Likely applies", likely.join(", ")]);
  if (unlikely.length) meta.push(["Ticked but likely out of scope", unlikely.join(", ")]);
  if (roles.length) meta.push(["Likely AI Act role", roles.join("; ")]);
  if (prefill) meta.push(["Pre-filled Tier 2 link", prefill]);

  // Plain text, grouped by step.
  const text = [];
  meta.forEach(([k, v]) => text.push(`${k}: ${v}`));
  let last = "";
  items.forEach((it) => {
    if (it.s !== last) { text.push("", `== ${it.s} ==`); last = it.s; }
    text.push(`${it.n ? it.n + " " : ""}${it.q}`, `  ${it.a.replace(/\n/g, "\n  ")}`);
  });

  // HTML in the layout of the discovery brief PDFs.
  let html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17160f;max-width:760px">` +
    `<div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#a37c17;font-weight:bold">SenecAI · ${esc(title)}</div>` +
    `<h1 style="font-size:22px;margin:8px 0 14px">${esc(who)}</h1><table style="border-collapse:collapse;font-size:14px;margin-bottom:18px">` +
    meta.map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#6b665c;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${
      k === "Pre-filled Tier 2 link" ? `<a href="${esc(v)}">Open Tier 2 with these answers</a>` : esc(v)}</td></tr>`).join("") +
    `</table>`;
  last = "";
  items.forEach((it) => {
    if (it.s !== last) {
      html += `<div style="margin:22px 0 8px;padding:8px 12px;background:#f8f1de;border-left:4px solid #d5aa4b;font-weight:bold">${esc(it.s)}</div>`;
      last = it.s;
    }
    html += `<p style="margin:10px 0 2px;font-size:14px;font-weight:bold">${it.n ? `<span style="color:#a37c17">${esc(it.n)}</span> ` : ""}${esc(it.q)}</p>` +
      `<p style="margin:0 0 8px;padding-left:10px;border-left:2px solid #ddd7c8;font-size:14px;white-space:pre-wrap">${esc(it.a)}</p>`;
  });
  html += `</div>`;

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: { name: "senecai.eu questionnaire", address: process.env.SMTP_USER },
      to: TO,
      replyTo: { name, address: email },
      subject: `${title}: ${who}`,
      text: text.join("\n"),
      html,
    });
  } catch (err) {
    console.error("quote: sending failed", err && err.message);
    res.status(502).json({ ok: false, error: "send" });
    return;
  }
  res.status(200).json({ ok: true });
};

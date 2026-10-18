// Renders a compliance checker result as a branded A4 PDF (pdfkit). The text comes from
// the checker engine itself (assets/checkers.v4.js or its Romanian build), so the PDF
// always says exactly what the page says. Archivo is embedded as static instances of the
// variable font (SIL OFL 1.1), subset to Latin + Latin Extended for Romanian diacritics.
const path = require("path");
const PDFDocument = require("pdfkit");

const FONTS = path.join(__dirname, "fonts");
const LOGO = path.join(__dirname, "..", "..", "assets", "senecai-compliance-logo-light.png");
const CALENDLY = "https://calendly.com/senecai-consulting/30min";

const INK = "#201e1d";
const MUTED = "#5c564c";
const GOLD = "#8a6a1f";
const GOLD_BRIGHT = "#d5aa4b";
const BLACK = "#17160f";
const CREAM = "#f8f1de";
const RULE = "#ddd7c8";
const M = 50; // page margin

function renderReport({ engine, tool, result, path: answered, answers, lang, recipient }) {
  const ui = engine.ui;
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: M, bottom: M + 20, left: M, right: M },
    bufferPages: true,
    font: path.join(FONTS, "Archivo-Regular.ttf"),
    info: { Title: `${tool.title} — SenecAI`, Author: "SenecAI Compliance S.R.L.", Subject: ui.pdfKicker },
    lang: lang === "ro" ? "ro-RO" : "en-GB",
  });
  doc.registerFont("R", path.join(FONTS, "Archivo-Regular.ttf"));
  doc.registerFont("B", path.join(FONTS, "Archivo-Bold.ttf"));
  doc.registerFont("X", path.join(FONTS, "Archivo-ExtraBold.ttf"));

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const W = doc.page.width - 2 * M;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const room = (h) => { if (doc.y + h > bottom()) doc.addPage(); };
  const kicker = (text, color, size) => {
    doc.font("X").fontSize(size || 8).fillColor(color || GOLD).text(text.toUpperCase(), { characterSpacing: 1.2 });
  };

  // ---- Header band
  doc.rect(0, 0, doc.page.width, 92).fill(BLACK);
  doc.image(LOGO, M, 26, { height: 40 });
  doc.font("X").fontSize(8).fillColor(GOLD_BRIGHT)
    .text(ui.pdfKicker.toUpperCase(), M, 42, { width: W, align: "right", characterSpacing: 1.2 });
  doc.y = 92 + 34;

  // ---- Title and meta
  doc.x = M;
  doc.font("X").fontSize(21).fillColor(INK).text(tool.title, { width: W, lineGap: 1 });
  doc.moveDown(0.4);
  const date = new Date().toLocaleDateString(lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const who = [recipient.name, recipient.company].filter(Boolean).join(", ");
  doc.font("R").fontSize(9.5).fillColor(MUTED)
    .text(`${ui.pdfDate}: ${date}   ·   ${ui.pdfFor}: ${who ? `${who} (${recipient.email})` : recipient.email}`, { width: W });
  doc.moveDown(1.2);

  // ---- Headline box
  const h = result.headline;
  const pad = 14;
  const inner = W - pad * 2 - 4;
  doc.font("X").fontSize(14);
  const hTitle = doc.heightOfString(h.title, { width: inner });
  doc.font("R").fontSize(10.5);
  const hText = doc.heightOfString(h.text, { width: inner, lineGap: 2 });
  const boxH = pad + 12 + hTitle + 6 + hText + pad;
  room(boxH);
  const top = doc.y;
  doc.rect(M, top, W, boxH).fill(CREAM);
  doc.rect(M, top, 4, boxH).fill(h.status === "prohibited" ? "#c4513b" : GOLD_BRIGHT);
  doc.x = M + 4 + pad; doc.y = top + pad;
  doc.font("X").fontSize(8).fillColor(GOLD).text(ui.result.toUpperCase(), { width: inner, characterSpacing: 1.2 });
  doc.moveDown(0.3);
  doc.font("X").fontSize(14).fillColor(INK).text(h.title, { width: inner });
  doc.moveDown(0.3);
  doc.font("R").fontSize(10.5).fillColor(INK).text(h.text, { width: inner, lineGap: 2 });
  doc.x = M; doc.y = top + boxH + 22;

  // ---- Result cards
  const bullets = (items, cite) => {
    items.forEach((it) => {
      const text = typeof it === "string" ? it : it.text;
      const ref = typeof it === "string" ? "" : it.ref;
      doc.font("R").fontSize(10);
      room(Math.min(doc.heightOfString(text, { width: W - 14, lineGap: 1.5 }), 60) + 4);
      const y = doc.y;
      doc.fillColor(GOLD_BRIGHT).text("•", M, y, { width: 10, lineBreak: false });
      doc.fillColor(INK).text(text + (cite && ref ? "  " : ""), M + 14, y, { width: W - 14, lineGap: 1.5, continued: Boolean(cite && ref) });
      if (cite && ref) doc.font("B").fontSize(8.5).fillColor(GOLD).text(ref, { lineGap: 1.5 });
      doc.moveDown(0.35);
      doc.x = M;
    });
  };
  const sub = (label) => {
    room(40);
    doc.moveDown(0.3);
    doc.x = M;
    kicker(label, MUTED, 7.5);
    doc.moveDown(0.35);
  };

  result.cards.forEach((c, i) => {
    room(70);
    if (i > 0) {
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y).lineWidth(0.6).strokeColor(RULE).stroke();
      doc.moveDown(1);
    }
    const cardTop = doc.y;
    const pill = tool.id === "general" ? (c.label || engine.statusLabel[c.status] || "").toUpperCase() : "";
    let pillW = 0;
    if (pill) {
      doc.font("X").fontSize(7.5);
      pillW = doc.widthOfString(pill, { characterSpacing: 1 }) + 14;
      const strong = ["applies", "high", "essential", "prohibited"].indexOf(c.status) !== -1;
      const col = c.status === "prohibited" ? "#c4513b" : c.status === "no" ? "#a39d90" : GOLD_BRIGHT;
      if (strong) doc.rect(M + W - pillW, cardTop, pillW, 17).fill(col);
      else doc.rect(M + W - pillW, cardTop, pillW, 17).lineWidth(0.9).strokeColor(col).stroke();
      doc.fillColor(strong ? BLACK : c.status === "no" ? "#7a7469" : GOLD)
        .text(pill, M + W - pillW, cardTop + 5, { width: pillW, align: "center", characterSpacing: 1, lineBreak: false });
    }
    doc.x = M; doc.y = cardTop;
    doc.font("X").fontSize(8).fillColor(GOLD).text(c.reg.toUpperCase(), M, cardTop, { width: W - pillW - 10, characterSpacing: 1.2 });
    doc.moveDown(0.25);
    doc.font("X").fontSize(13).fillColor(INK).text(c.title, { width: W - pillW - 10 });
    doc.moveDown(0.5);
    if (c.reasons && c.reasons.length) bullets(c.reasons, true);
    if (c.actions && c.actions.length) { sub(ui.means); bullets(c.actions); }
    if (c.notes && c.notes.length) { sub(ui.good); bullets(c.notes); }
    if (c.dates && c.dates.length) { sub(ui.dates); bullets(c.dates); }
    doc.moveDown(0.6);
  });

  // ---- Answers recap
  room(80);
  doc.moveTo(M, doc.y).lineTo(M + W, doc.y).lineWidth(0.6).strokeColor(RULE).stroke();
  doc.moveDown(1);
  doc.x = M;
  kicker(ui.answers, GOLD, 9);
  doc.moveDown(0.6);
  answered.forEach((id, i) => {
    const n = tool.nodes[id];
    const a = engine.answerLabels(n, answers[id]).join("; ");
    doc.font("B").fontSize(9.5);
    room(doc.heightOfString(n.q, { width: W - 18 }) + 24);
    const y = doc.y;
    doc.fillColor(MUTED).text(`${i + 1}.`, M, y, { width: 16, lineBreak: false });
    doc.fillColor(INK).text(n.q, M + 18, y, { width: W - 18 });
    doc.font("R").fontSize(9.5).fillColor(MUTED).text(a, M + 18, doc.y + 1, { width: W - 18 });
    doc.moveDown(0.5);
  });

  // ---- Call to action and disclaimer
  room(110);
  doc.moveDown(0.8);
  const ctaTop = doc.y;
  doc.font("B").fontSize(10.5);
  const ctaH = 14 + doc.heightOfString(ui.pdfCta, { width: W - 28 }) + 4 + 14 + 14;
  doc.rect(M, ctaTop, W, ctaH).fill(BLACK);
  doc.fillColor("#faf3e3").text(ui.pdfCta, M + 14, ctaTop + 14, { width: W - 28 });
  doc.moveDown(0.2);
  doc.font("X").fontSize(10.5).fillColor(GOLD_BRIGHT).text(CALENDLY.replace("https://", ""), M + 14, doc.y, { width: W - 28, link: CALENDLY, underline: false });
  doc.x = M; doc.y = ctaTop + ctaH + 16;
  doc.font("R").fontSize(8).fillColor(MUTED).text(ui.disclaimer, { width: W, lineGap: 1.5 });

  // ---- Footer on every page
  const range = doc.bufferedPageRange();
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p);
    const keep = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const fy = doc.page.height - 36;
    doc.moveTo(M, fy - 8).lineTo(M + W, fy - 8).lineWidth(0.5).strokeColor(RULE).stroke();
    doc.font("R").fontSize(7.5).fillColor(MUTED)
      .text("SenecAI Compliance S.R.L. · senecai.eu · hello@senecai.eu", M, fy, { width: W, lineBreak: false, link: "https://www.senecai.eu/" });
    doc.text(`${p + 1} / ${range.count}`, M, fy, { width: W, align: "right", lineBreak: false });
    doc.page.margins.bottom = keep;
  }

  doc.end();
  return done;
}

module.exports = { renderReport };

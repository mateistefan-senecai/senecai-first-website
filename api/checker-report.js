// Compliance checker report endpoint (Vercel serverless function). The checkers are a lead
// magnet: the visitor sees their result only after leaving their email, gets it as a PDF by
// email, and a copy (with the PDF) goes to CONTACT_TO so we know who completed it. Nothing
// is stored.
//
// The client sends only the tool id and the answers. The result is rebuilt here with the
// same engine the page runs (assets/checkers.v3.js, or its Romanian build), after re-walking
// the decision tree, so the emailed report can only ever contain the checker's own text.
// When the engine file is renamed (v4, …), update ENGINES below and includeFiles in vercel.json.
const { TO, EMAIL_RE, clean, oneLine, configured, transport } = require("./_lib/mail");
const { renderReport } = require("./_lib/report-pdf");

const ENGINES = {
  en: () => require("../assets/checkers.v3.js"),
  ro: () => require("../assets/checkers.ro.v2.js"),
};
const FILES = { general: "SenecAI-EU-compliance-report.pdf", aiact: "SenecAI-AI-Act-report.pdf", nis2: "SenecAI-NIS2-report.pdf" };
const CALENDLY = "https://calendly.com/senecai-consulting/30min";

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    send(res, 405, { ok: false, error: "method" });
    return;
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};

  // Spam traps: a hidden field people never fill in, and forms sent within 2 s of appearing.
  const shown = Number(b.t);
  if (clean(b.website, 200) || (shown && Date.now() - shown < 2000)) {
    send(res, 200, { ok: true });
    return;
  }

  const lang = b.lang === "ro" ? "ro" : "en";
  const engine = ENGINES[lang]();
  const tool = Object.prototype.hasOwnProperty.call(engine.tools, b.tool) ? engine.tools[b.tool] : null;
  const email = oneLine(clean(b.email, 254));
  const name = oneLine(clean(b.name, 200));
  const company = oneLine(clean(b.company, 200));
  const consent = b.consent === true;
  const answers = b.answers && typeof b.answers === "object" && !Array.isArray(b.answers) ? b.answers : null;
  const walked = tool && answers ? engine.walk(tool, answers) : null;
  if (!walked || !EMAIL_RE.test(email)) {
    send(res, 400, { ok: false, error: "invalid" });
    return;
  }

  if (!configured()) {
    console.error("checker-report: SMTP_USER / SMTP_PASS are not set");
    send(res, 500, { ok: false, error: "config" });
    return;
  }

  const result = tool.evaluate(walked.answers);
  let pdf;
  try {
    pdf = await renderReport({ engine, tool, result, path: walked.path, answers: walked.answers, lang, recipient: { email, name, company } });
  } catch (err) {
    console.error("checker-report: PDF failed", err && err.message);
    send(res, 500, { ok: false, error: "pdf" });
    return;
  }

  const ui = engine.ui;
  const attachment = { filename: FILES[tool.id], content: pdf, contentType: "application/pdf" };
  const mailer = transport();
  try {
    await mailer.sendMail({
      from: { name: "SenecAI", address: process.env.SMTP_USER },
      to: email,
      replyTo: TO,
      subject: `${ui.mailSubject}: ${tool.title}`,
      text: [
        `${ui.mailHello}${name ? ` ${name}` : ""},`,
        "",
        ui.mailIntro,
        "",
        `${ui.result}: ${result.headline.title}`,
        "",
        ui.mailCta,
        CALENDLY,
        "",
        ui.mailSign,
        "senecai.eu",
      ].join("\n"),
      attachments: [attachment],
    });
  } catch (err) {
    // Keep the lead visible in the Vercel logs even when the email could not go out.
    console.error("checker-report: sending failed", err && err.message, JSON.stringify({ email, name, company, consent, tool: tool.id, result: result.headline.title }));
    send(res, 502, { ok: false, error: "send" });
    return;
  }

  // Copy for us. The visitor already has their report, so a failure here is only logged.
  const recap = walked.path.map((id, i) => `${i + 1}. ${tool.nodes[id].q}\n   ${engine.answerLabels(tool.nodes[id], walked.answers[id]).join("; ")}`);
  try {
    await mailer.sendMail({
      from: { name: "senecai.eu compliance checker", address: process.env.SMTP_USER },
      to: TO,
      replyTo: name ? { name, address: email } : email,
      subject: `Checker report sent: ${email} (${tool.short})${consent ? " — follow-up OK" : ""}`,
      text: [
        `Email: ${email}`,
        `Name: ${name || "-"}`,
        `Company: ${company || "-"}`,
        `May follow up: ${consent ? "YES (ticked the box)" : "no"}`,
        `Checker: ${tool.title} (${lang.toUpperCase()})`,
        `Page: ${oneLine(clean(req.headers.referer, 300)) || "-"}`,
        "",
        `Result: ${result.headline.title}`,
        "",
        "Answers:",
        ...recap,
      ].join("\n"),
      attachments: [attachment],
    });
  } catch (err) {
    console.error("checker-report: copy to CONTACT_TO failed", err && err.message);
  }

  send(res, 200, { ok: true });
};

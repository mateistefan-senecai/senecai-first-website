// Contact form endpoint (Vercel serverless function): validates the enquiry from the
// "Ready to get compliant?" band and emails it through Google Workspace SMTP.
// Nothing is stored. Needs SMTP_USER and SMTP_PASS (a Google app password) in Vercel.
const nodemailer = require("nodemailer");

const TO = process.env.CONTACT_TO || "matei.stefan@senecai.eu";
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const LIMITS = { name: 200, email: 254, company: 200, message: 5000 };

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function oneLine(value) {
  return value.replace(/[\r\n]+/g, " ");
}

function reply(req, res, status, body) {
  const wantsJson = (req.headers.accept || "").includes("application/json");
  if (wantsJson) {
    res.status(status).json(body);
    return;
  }
  // Without JavaScript the browser posted the form itself: send it back to the page it came from.
  let back = "/";
  try {
    const ref = new URL(req.headers.referer || "");
    if (ref.host === req.headers.host) back = ref.pathname;
  } catch (e) { /* no or foreign referer */ }
  res.statusCode = 303;
  res.setHeader("Location", `${back}?contact=${body.ok ? "sent" : "error"}#cta`);
  res.end();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "method" });
    return;
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};

  // Spam traps: a hidden field people never fill in, and forms sent within 3 s of the page loading.
  const started = Number(b.t);
  if (clean(b.website, 200) || (started && Date.now() - started < 3000)) {
    reply(req, res, 200, { ok: true });
    return;
  }

  const name = oneLine(clean(b.name, LIMITS.name));
  const email = oneLine(clean(b.email, LIMITS.email));
  const company = oneLine(clean(b.company, LIMITS.company));
  const message = clean(b.message, LIMITS.message);
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    reply(req, res, 400, { ok: false, error: "invalid" });
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("contact: SMTP_USER / SMTP_PASS are not set");
    reply(req, res, 500, { ok: false, error: "config" });
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const page = oneLine(clean(req.headers.referer, 300));
  try {
    await transport.sendMail({
      from: { name: "senecai.eu contact form", address: process.env.SMTP_USER },
      to: TO,
      replyTo: { name, address: email },
      subject: `Website enquiry: ${name}${company ? ` (${company})` : ""}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "-"}`,
        `Page: ${page || "-"}`,
        "",
        message,
      ].join("\n"),
    });
  } catch (err) {
    console.error("contact: sending failed", err && err.message);
    reply(req, res, 502, { ok: false, error: "send" });
    return;
  }
  reply(req, res, 200, { ok: true });
};

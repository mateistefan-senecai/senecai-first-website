// Shared by the serverless functions that send email (api/contact.js, api/checker-report.js, api/quote.js):
// input cleaning and the Google Workspace SMTP transport. Files under api/_lib are not
// deployed as functions.
const nodemailer = require("nodemailer");

const TO = process.env.CONTACT_TO || "matei.stefan@senecai.eu";
// Leads from the quote questionnaires and the checker reports go to the shared inbox.
const LEADS_TO = process.env.LEADS_TO || "hello@senecai.eu";
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function oneLine(value) {
  return value.replace(/[\r\n]+/g, " ");
}

function configured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

module.exports = { TO, LEADS_TO, EMAIL_RE, clean, oneLine, configured, transport };

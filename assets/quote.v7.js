/* SenecAI quote questionnaires.
 *
 *   quick     : Tier 1, the public "Get a quote in 24 hours" form (get-a-quote.html)
 *   discovery : Tier 2, the detailed discovery brief sent to interested clients (discovery.html)
 *   aiact     : the AI Act scoping questionnaire sent to prospects (scoping-ai-act.html)
 *   gdpr      : the GDPR scoping questionnaire sent to prospects (scoping-gdpr.html)
 *   cyber     : the cybersecurity scoping questionnaire, our security partners' questions (scoping-cyber.html)
 *
 * Each questionnaire is plain data: steps holding questions, each question with an optional
 * show(answers) condition. Scope checks for NIS2, DORA and CRA run first; their targeted
 * questions appear only when the company is likely in scope. On submit the answers are
 * posted to /api/quote, which emails them to SenecAI; nothing is stored on the server.
 * Progress is kept in the visitor's own browser (localStorage) until they submit.
 *
 * Code strings use single quotes; every double-quoted string is visitor-facing text, which
 * tools/i18n/build_ro.py translates into assets/quote.ro.v7.js. The file name is versioned
 * because /assets/* is cached as immutable: rename it (v2, …) whenever it changes.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ text */
  var UI = {
    next: "Continue →",
    back: "← Back",
    step: "Step",
    of: "of",
    optional: "optional",
    selectAll: "Select all that apply.",
    missing: "Please answer the questions marked with *.",
    submitQuick: "Get my quote in 24 hours →",
    submitDiscovery: "Send my discovery brief →",
    sending: "Sending…",
    sendError: "Your answers could not be sent. Please try again, or email them to hello@senecai.eu.",
    print: "Print / save as PDF",
    restart: "Start a new questionnaire",
    yourAnswers: "Your answers",
    likely: "These likely apply to you",
    unlikely: "These likely don’t, based on your answers",
    unlikelyNote: "We’ll confirm this in your quote.",
    thanksQuickTitle: "Thank you. Your quote is on its way.",
    thanksQuick: "We’ll email your quote within 24 hours. Prefer to talk first?",
    thanksDiscoveryTitle: "Thank you. Your discovery brief has been sent.",
    thanksDiscovery: "We’ll review it and come back to you with your proposal. You can print or save a copy of your answers below.",
    bookCall: "Book a free intro call →",
    resumed: "We kept the answers you gave earlier in this browser.",
    none: "None",
    dataNote: "We use your answers only to prepare your quote. See our",
    privacy: "Privacy Policy",
    viaClients: "through your financial clients’ contracts",
    art: "Art.",
    annex: "Annex"
  };

  var REG = {
    aiact: "EU AI Act",
    gdpr: "GDPR",
    nis2: "NIS2",
    dora: "DORA",
    cra: "Cyber Resilience Act",
    iso27: "ISO 27001",
    iso42: "ISO 42001",
    sec: "Security testing"
  };

  var YPND = [{ v: 'yes', l: "Yes" }, { v: 'partly', l: "Partly" }, { v: 'no', l: "No" }, { v: 'dk', l: "Don’t know" }];
  var YND = [{ v: 'yes', l: "Yes" }, { v: 'no', l: "No" }, { v: 'dk', l: "Don’t know" }];
  var YNU = [{ v: 'yes', l: "Yes" }, { v: 'no', l: "No" }, { v: 'unsure', l: "Unsure" }];
  var NOTES = "Notes";

  /* ------------------------------------------------------------------ helpers */
  function has(a, id, v) { var x = a[id]; return Array.isArray(x) ? x.indexOf(v) !== -1 : x === v; }
  function hasAny(a, id, vs) { for (var i = 0; i < vs.length; i++) if (has(a, id, vs[i])) return true; return false; }

  var NIS2_SECTORS = ['energy', 'transport', 'banking', 'health', 'water', 'cloud', 'dns', 'msp', 'platform',
    'postal', 'waste', 'chemicals', 'food', 'manufacturing', 'research', 'public'];
  var DORA_ENTITIES = ['bank', 'payment', 'investment', 'insurance', 'crypto', 'fin-other'];

  /* What applies, from the profile questions (shared by both tiers). */
  function scope(a) {
    var big = hasAny(a, 'q3', ['50-249', '250+']) || hasAny(a, 'q4', ['10-50', '50+']);
    var s = {};
    s.nis2 = (hasAny(a, 'q5', NIS2_SECTORS) && big) || has(a, 'q5', 'dns');
    s.doraEntity = hasAny(a, 'q6', DORA_ENTITIES);
    s.doraIct = has(a, 'q6', 'ict');
    s.dora = s.doraEntity || s.doraIct;
    s.cra = hasAny(a, 'q7', ['hw', 'sw']) && !has(a, 'q8r', 'own');
    s.ai = hasAny(a, 'q11', ['yes', 'unsure']);
    s.aiBuilt = s.ai && hasAny(a, 'q12', ['self', 'commissioned']);
    s.aiReady = s.ai && has(a, 'q12', 'ready');
    s.gdpr = Array.isArray(a.q19) && a.q19.length > 0 && !has(a, 'q19', 'none');
    s.sec = has(a, 'q9', 'sec');
    s.iso27 = has(a, 'q9', 'iso27');
    s.iso42 = has(a, 'q9', 'iso42');
    return s;
  }

  /* Likely AI Act role(s), from plain-language answers (never shown to the visitor). */
  function roles(a) {
    var s = scope(a), out = [];
    if (!s.ai) return out;
    if (s.aiBuilt) out.push(has(a, 'q13', 'internal') ? 'provider and deployer (built for own use)' : 'provider');
    if (s.aiReady) {
      if (has(a, 'q14', 'asis')) out.push('deployer');
      if (hasAny(a, 'q14', ['brand', 'changed'])) out.push('deployer; provider under Art. 25 if high-risk');
      if (has(a, 'q14', 'import')) out.push('importer');
      if (has(a, 'q14', 'resell')) out.push('distributor');
    }
    return out;
  }

  /* ------------------------------------------------------------------ profile questions (both tiers) */
  var Q = {
    q1: { id: 'q1', n: 'Q1', t: 'text', req: true, q: "Company name and website" },
    q2: { id: 'q2', n: 'Q2', t: 'one', req: true, q: "Where is your company established?", opts: [
      { v: 'eu', l: "In the EU or EEA" },
      { v: 'non-eu-market', l: "Outside the EU, with customers or users in the EU" },
      { v: 'non-eu', l: "Outside the EU, with no EU customers or users" }] },
    q2c: { id: 'q2c', n: '', t: 'text', q: "Which country?", show: function (a) { return has(a, 'q2', 'eu'); } },
    q3: { id: 'q3', n: 'Q3', t: 'one', inline: true, req: true, q: "How many people work at your company?", opts: [
      { v: '1-9', l: "1–9" }, { v: '10-49', l: "10–49" }, { v: '50-249', l: "50–249" }, { v: '250+', l: "250+" }] },
    q4: { id: 'q4', n: 'Q4', t: 'one', inline: true, req: true, q: "What is your annual turnover?", opts: [
      { v: '0-10', l: "Up to €10m" }, { v: '10-50', l: "€10–50m" }, { v: '50+', l: "Over €50m" }, { v: 'na', l: "Prefer not to say" }] },
    q5: { id: 'q5', n: 'Q5', t: 'many', req: true, q: "Which of these does your company do?", opts: [
      { v: 'software', l: "Software or SaaS" },
      { v: 'energy', l: "Energy" },
      { v: 'transport', l: "Transport" },
      { v: 'banking', l: "Banking or financial market infrastructure" },
      { v: 'finance', l: "Other financial services (payments, investment, insurance, crypto)" },
      { v: 'health', l: "Healthcare, labs, pharma or medical devices" },
      { v: 'water', l: "Drinking water or waste water" },
      { v: 'cloud', l: "Cloud, data centres or content delivery" },
      { v: 'dns', l: "DNS, domain registry, trust services or public telecoms" },
      { v: 'msp', l: "Managed IT or security services for businesses" },
      { v: 'platform', l: "Online marketplace, search engine or social network" },
      { v: 'postal', l: "Postal or courier" },
      { v: 'waste', l: "Waste management" },
      { v: 'chemicals', l: "Chemicals" },
      { v: 'food', l: "Food production or distribution" },
      { v: 'manufacturing', l: "Manufacturing (machinery, electronics, vehicles, medical devices)" },
      { v: 'research', l: "Research" },
      { v: 'public', l: "Public administration" },
      { v: 'other', l: "Something else" }] },
    q6: { id: 'q6', n: 'Q6', t: 'one', req: true, q: "Which describes your company best?",
      show: function (a) { return hasAny(a, 'q5', ['banking', 'finance', 'cloud', 'msp', 'software']); }, opts: [
      { v: 'bank', l: "Bank or credit institution" },
      { v: 'payment', l: "Payment or e-money institution" },
      { v: 'investment', l: "Investment firm or fund manager" },
      { v: 'insurance', l: "Insurer, reinsurer or insurance broker" },
      { v: 'crypto', l: "Crypto-asset service provider" },
      { v: 'fin-other', l: "Another regulated financial entity" },
      { v: 'ict', l: "We provide ICT services (cloud, software, data, managed services) to financial entities" },
      { v: 'none', l: "None of these" }] },
    q7: { id: 'q7', n: 'Q7', t: 'one', req: true, q: "Do you sell hardware or software products on the EU market?",
      hint: "Products you sell or ship, not services you run for customers online.", opts: [
      { v: 'hw', l: "Yes, connected hardware (IoT, devices)" },
      { v: 'sw', l: "Yes, installable software or firmware sold commercially" },
      { v: 'saas', l: "Only SaaS or online services" },
      { v: 'no', l: "No" }] },
    q8: { id: 'q8', n: 'Q8', t: 'one', inline: true, req: true, q: "For those products, are you the manufacturer, importer or distributor?",
      show: function (a) { return hasAny(a, 'q7', ['hw', 'sw']); }, opts: [
      { v: 'manufacturer', l: "Manufacturer" }, { v: 'importer', l: "Importer" }, { v: 'distributor', l: "Distributor" }] },
    q8r: { id: 'q8r', n: '', t: 'one', inline: true, req: true, q: "Are they covered by their own EU product rules (medical devices, motor vehicles, aviation, marine equipment)?",
      show: function (a) { return hasAny(a, 'q7', ['hw', 'sw']); }, opts: [
      { v: 'own', l: "Yes, covered by their own rules" }, { v: 'not', l: "No" }, { v: 'dk', l: "Don’t know" }] },
    q9: { id: 'q9', n: 'Q9', t: 'many', req: true, q: "What do you need help with?", opts: [
      { v: 'aiact', l: "EU AI Act" }, { v: 'gdpr', l: "GDPR" }, { v: 'nis2', l: "NIS2" }, { v: 'dora', l: "DORA" },
      { v: 'cra', l: "Cyber Resilience Act" }, { v: 'iso27', l: "ISO 27001" }, { v: 'iso42', l: "ISO 42001" },
      { v: 'sec', l: "Security testing (pen test, AI red teaming)" },
      { v: 'unsure', l: "Not sure, help me figure it out" }] },
    q10: { id: 'q10', n: 'Q10', t: 'area', req: true, q: "In one or two sentences, what does your product or service do?" },
    q11: { id: 'q11', n: 'Q11', t: 'one', inline: true, req: true, q: "Does your company use or offer AI?",
      hint: "Chatbots, features built on models like ChatGPT, scoring or recommendation models, and AI tools you buy all count.", opts: [
      { v: 'yes', l: "Yes" }, { v: 'no', l: "No" }, { v: 'unsure', l: "Not sure" }] },
    q12: { id: 'q12', n: 'Q12', t: 'many', req: true, q: "Who built the AI?",
      show: function (a) { return scope(a).ai; }, opts: [
      { v: 'self', l: "We built it ourselves" },
      { v: 'commissioned', l: "An outside developer built it for us, to our specifications" },
      { v: 'ready', l: "We use a ready-made AI product or tool from another company" }] },
    q13: { id: 'q13', n: 'Q13', t: 'one', req: true, q: "Do other people or companies use this AI as your product, under your name?",
      show: function (a) { return scope(a).aiBuilt; }, opts: [
      { v: 'product', l: "Yes, our clients or users use it as our product" },
      { v: 'internal', l: "No, we only use it inside our company" }] },
    q14: { id: 'q14', n: 'Q14', t: 'many', req: true, q: "What do you do with the ready-made AI product?",
      show: function (a) { return scope(a).aiReady; }, opts: [
      { v: 'asis', l: "We use it in our work as it comes" },
      { v: 'brand', l: "We put our own name or brand on it" },
      { v: 'changed', l: "We changed how it works, or use it for something its maker didn’t intend" },
      { v: 'resell', l: "We resell it to others" },
      { v: 'import', l: "We bring it into the EU from a company outside the EU" }] },
    q15: { id: 'q15', n: 'Q15', t: 'many', req: true, q: "Who does your AI make or support decisions about?",
      show: function (a) { return scope(a).ai; }, opts: [
      { v: 'hr', l: "Job candidates or employees" },
      { v: 'education', l: "Students" },
      { v: 'credit', l: "Credit or insurance applicants" },
      { v: 'patients', l: "Patients" },
      { v: 'public', l: "Access to public services" },
      { v: 'biometric', l: "People identified by face, voice or other biometrics" },
      { v: 'consumers', l: "Consumers in general" },
      { v: 'b2b', l: "Businesses only" }] },
    q16: { id: 'q16', n: 'Q16', t: 'one', req: true, q: "How is your AI built?",
      show: function (a) { return scope(a).aiBuilt; }, opts: [
      { v: 'api', l: "On a third-party model via API (e.g. OpenAI, Anthropic)" },
      { v: 'finetuned', l: "On a fine-tuned model" },
      { v: 'own', l: "On our own model" },
      { v: 'mix', l: "A mix of these" }] },
    q17: { id: 'q17', n: 'Q17', t: 'one', inline: true, req: true, q: "How many AI systems does your company use?",
      hint: "Count each one separately, for example: a chatbot for customers, a CV-screening tool, a credit-scoring or fraud-detection model, an AI feature inside your product, or tools like ChatGPT or Copilot used by your team.",
      show: function (a) { return scope(a).ai; }, opts: [
      { v: '1', l: "1" }, { v: '2-3', l: "2–3" }, { v: '4-10', l: "4–10" }, { v: '10+', l: "More than 10" }, { v: 'dk', l: "Not sure" }] },
    q18: { id: 'q18', n: 'Q18', t: 'one', req: true, q: "Where does your product stand today?", opts: [
      { v: 'dev', l: "In development" }, { v: 'pilot', l: "Pilot with first clients" },
      { v: 'live-eu', l: "Live in the EU" }, { v: 'live-non-eu', l: "Live outside the EU only" }] },
    q19: { id: 'q19', n: 'Q19', t: 'many', req: true, q: "What personal data do you process?", opts: [
      { v: 'contact', l: "Contact or account data" },
      { v: 'staff', l: "Employee or candidate data" },
      { v: 'sensitive', l: "Sensitive data (health, biometrics, children, financial)" },
      { v: 'tracking', l: "Large-scale tracking or monitoring" },
      { v: 'none', l: "None", none: true }] },
    q23: { id: 'q23', n: 'Q23', t: 'many', req: true, q: "Which security tests do you need?",
      show: function (a) { return scope(a).sec; }, opts: [
      { v: 'pentest', l: "Penetration test of a web app or API" },
      { v: 'redteam', l: "AI red teaming (prompt injection, jailbreaks)" },
      { v: 'bias', l: "Bias and robustness testing" },
      { v: 'cloud', l: "Cloud configuration review" }] }
  };

  function ypnd(id, n, q, extra) {
    var o = { id: id, n: n, t: 'one', inline: true, q: q, opts: YPND };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  var CONTACT = [
    { id: 'name', n: '', t: 'text', req: true, q: "Your name", ac: 'name' },
    { id: 'role', n: '', t: 'text', q: "Your role", ac: 'organization-title' },
    { id: 'email', n: '', t: 'email', req: true, q: "Work email", ac: 'email' },
    { id: 'phone', n: '', t: 'text', q: "Phone", ac: 'tel' }
  ];

  /* ================================================================ TIER 1 */
  var quick = {
    id: 'quick',
    profile: ['q1', 'q2', 'q2c', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q8r', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14',
      'q15', 'q16', 'q17', 'q18', 'q19', 'q23', 'name', 'role', 'email', 'phone'],
    steps: [
      { title: "About you", intro: "A few questions about your company. They also tell us which EU rules are likely to apply.",
        items: [Q.q1, Q.q2, Q.q2c, Q.q3, Q.q4, Q.q5, Q.q6, Q.q7, Q.q8, Q.q8r, Q.q9] },
      { title: "Your product", intro: "No legal terms needed: tell us what you do, and we work out your role under the rules.",
        items: [Q.q10, Q.q11, Q.q12, Q.q13, Q.q14, Q.q15, Q.q16, Q.q17, Q.q18, Q.q19] },
      { title: "Targeted questions", intro: "Based on your answers, these rules likely apply to you. A few quick questions on each.",
        show: function (a) { var s = scope(a); return s.nis2 || s.dora || s.cra; },
        items: [
          { h: "NIS2", show: function (a) { return scope(a).nis2; } },
          { id: 'n1', n: 'N1', t: 'one', inline: true, q: "Have you checked whether you are an essential or an important entity?", show: function (a) { return scope(a).nis2; },
            opts: [{ v: 'essential', l: "Essential" }, { v: 'important', l: "Important" }, { v: 'notyet', l: "Not yet" }] },
          { id: 'n2', n: 'N2', t: 'one', inline: true, q: "Have you registered with your national cybersecurity authority (in Romania, DNSC)?", show: function (a) { return scope(a).nis2; },
            opts: [{ v: 'yes', l: "Yes" }, { v: 'no', l: "No" }, { v: 'unaware', l: "Didn’t know we had to" }] },
          ypnd('n3', 'N3', "Has management approved your cybersecurity measures and completed training?", { show: function (a) { return scope(a).nis2; } }),
          ypnd('n4', 'N4', "Could you send an early warning within 24 hours of a significant incident?", { show: function (a) { return scope(a).nis2; } }),
          ypnd('n5', 'N5', "Do you assess the security of your key suppliers?", { show: function (a) { return scope(a).nis2; } }),
          { h: "DORA", show: function (a) { return scope(a).dora; } },
          ypnd('d1', 'D1', "Do you have an ICT risk management framework approved by your management body?", { show: function (a) { return scope(a).doraEntity; } }),
          ypnd('d2', 'D2', "Can you classify major ICT incidents and report them to your authority?", { show: function (a) { return scope(a).doraEntity; } }),
          ypnd('d3', 'D3', "Do you keep a register of information on all your ICT third-party contracts?", { show: function (a) { return scope(a).doraEntity; } }),
          ypnd('d4', 'D4', "Do you run digital resilience testing (vulnerability scans, scenario tests)?", { show: function (a) { return scope(a).doraEntity; } }),
          { id: 'd5', n: 'D5', t: 'one', inline: true, q: "Do your financial-sector clients ask you for DORA contract terms, audit rights or exit plans?", show: function (a) { return scope(a).doraIct; },
            opts: [{ v: 'yes', l: "Yes, already" }, { v: 'notyet', l: "Not yet" }, { v: 'dk', l: "Don’t know" }] },
          { id: 'd6', n: 'D6', t: 'one', inline: true, q: "Do any of your services support a critical function for a client, such as payments, core banking or trading?", show: function (a) { return scope(a).doraIct; }, opts: YND },
          { h: "Cyber Resilience Act", show: function (a) { return scope(a).cra; } },
          { id: 'cr1', n: 'CR1', t: 'one', inline: true, q: "Which category is your product in?", show: function (a) { return scope(a).cra; },
            hint: "Important class I: e.g. password managers, VPNs, routers, smart home security devices. Class II: e.g. firewalls, hypervisors, tamper-resistant chips. Critical: smart meter gateways, smartcards. Most products are in the default category.",
            opts: [{ v: 'default', l: "Default" }, { v: 'class1', l: "Important class I" }, { v: 'class2', l: "Important class II" }, { v: 'critical', l: "Critical" }, { v: 'dk', l: "Don’t know" }] },
          ypnd('cr2', 'CR2', "Do you commit to a support period with security updates?", { show: function (a) { return scope(a).cra; } }),
          ypnd('cr3', 'CR3', "Do you have a process to receive, fix and disclose vulnerabilities?", { show: function (a) { return scope(a).cra; } }),
          ypnd('cr4', 'CR4', "Do you produce a software bill of materials (SBOM)?", { show: function (a) { return scope(a).cra; } }),
          ypnd('cr5', 'CR5', "Could you report an actively exploited vulnerability within 24 hours (required from 11 September 2026)?", { show: function (a) { return scope(a).cra; } })
        ] },
      { title: "Where you stand", intro: "Answer each line as best you can. “Don’t know” is a perfectly good answer.",
        items: [
          { id: 'grid', t: 'grid', q: "What do you already have in place?", rows: [
            { id: 'c1', l: "A named person is responsible for compliance" },
            { id: 'c2', l: "AI risk classification is documented", show: function (a) { return scope(a).ai; } },
            { id: 'c3', l: "Technical documentation describes the AI system, its purpose and limits", show: function (a) { return scope(a).aiBuilt; } },
            { id: 'c4', l: "Accuracy and bias have been tested and documented", show: function (a) { return scope(a).aiBuilt; } },
            { id: 'c5', l: "The system logs enough to reconstruct a specific decision", show: function (a) { return scope(a).aiBuilt; } },
            { id: 'c6', l: "A human can review or override AI outputs, and this is documented", show: function (a) { return scope(a).ai; } },
            { id: 'c7', l: "People are told they are interacting with AI", show: function (a) { return scope(a).ai; } },
            { id: 'c8', l: "Claims like “unbiased” or “AI Act compliant” in our marketing are backed by evidence", show: function (a) { return scope(a).ai; } },
            { id: 'c9', l: "A record of processing activities (RoPA), the GDPR register of what personal data you process and why", show: function (a) { return scope(a).gdpr; } },
            { id: 'c10', l: "A data protection impact assessment (DPIA) for risky processing", show: function (a) { return scope(a).gdpr; } },
            { id: 'c11', l: "Data processing agreements with all vendors that handle personal data", show: function (a) { return scope(a).gdpr; } },
            { id: 'c12', l: "A privacy notice specific to our product", show: function (a) { return scope(a).gdpr; } },
            { id: 'c13', l: "An information security policy and risk assessment", show: function (a) { var s = scope(a); return s.iso27 || s.sec; } },
            { id: 'c14', l: "An incident response process", show: function (a) { var s = scope(a); return s.iso27 || s.sec; } },
            { id: 'c15', l: "A penetration test in the last 12 months", show: function (a) { var s = scope(a); return s.iso27 || s.sec; } }
          ] },
          { id: 'certs', n: '', t: 'many', q: "Certifications you already hold", opts: [
            { v: 'iso27', l: "ISO 27001" }, { v: 'iso42', l: "ISO 42001" }, { v: 'soc2', l: "SOC 2" }, { v: 'none', l: "None", none: true }] }
        ] },
      { title: "What you need",
        items: [
          { id: 'q20', n: 'Q20', t: 'many', req: true, q: "What’s driving this?", opts: [
            { v: 'client', l: "A client or procurement requirement" }, { v: 'investor', l: "Investor due diligence" },
            { v: 'regulator', l: "A regulator or audit" }, { v: 'deadline', l: "A legal deadline" }, { v: 'ahead', l: "Getting ahead of it" }] },
          { id: 'q21', n: 'Q21', t: 'one', inline: true, req: true, q: "When do you need it done?", opts: [
            { v: 'asap', l: "As soon as possible" }, { v: '3m', l: "Within 3 months" }, { v: '6m', l: "3–6 months" }, { v: 'none', l: "No hard deadline" }] },
          { id: 'q22', n: 'Q22', t: 'one', req: true, q: "What kind of help do you want?", opts: [
            { v: 'assessment', l: "An assessment of where we stand" }, { v: 'implementation', l: "Assessment and implementation" },
            { v: 'retainer', l: "Ongoing support (retainer)" }, { v: 'unsure', l: "Not sure yet" }] },
          Q.q23,
          { id: 'q24', n: 'Q24', t: 'one', inline: true, q: "Budget range", opt: true, opts: [
            { v: '<5k', l: "Under €5k" }, { v: '5-15k', l: "€5–15k" }, { v: '15-40k', l: "€15–40k" }, { v: '40k+', l: "Over €40k" }, { v: 'na', l: "Prefer not to say" }] }
        ] },
      { title: "Get your quote", intro: "Where should we send it?", final: true,
        items: CONTACT.concat([
          { id: 'notes', n: '', t: 'area', q: "Anything else we should know?" },
          { id: 'source', n: '', t: 'text', q: "How did you hear about us?" }
        ]) }
    ]
  };

  /* ================================================================ TIER 2 */
  function yn(id, n, q, notes, opts) {
    var f = [{ k: 'v', t: 'one', inline: true, opts: opts || YND }];
    if (notes !== false) f.push({ k: 'd', t: notes && notes.area ? 'area' : 'text', label: (notes && notes.label) || NOTES });
    return { id: id, n: n, q: q, fields: f };
  }
  function open(id, n, q, area) { return { id: id, n: n, t: area === false ? 'text' : 'area', q: q }; }
  function aiOn(a) { return scope(a).ai; }
  function cyberOn(a) { return scope(a).sec; }
  function on(fn, items) { items.forEach(function (it) { if (!it.show) it.show = fn; }); return items; }

  /* The security partners' questions (C1–C41), word for word. Used by the discovery brief and by
     the cyber scoping questionnaire. */
  var CYBER = [
    { h: "Engagement overview" },
    { id: 'C1', n: 'C1', t: 'text', q: "What is the name/description of the GenAI application/system?" },
    { id: 'C2', n: 'C2', t: 'area', q: "What business purpose does it serve?" },
    { id: 'C3', n: 'C3', t: 'one', q: "Is the target internal facing, external facing, or embedded in another product?", opts: [{ v: 'internal', l: "Internal facing" }, { v: 'external', l: "External facing" }, { v: 'embedded', l: "Embedded in another product" }] },
    { h: "Architecture & deployment" },
    { id: 'C4', n: 'C4', t: 'area', q: "Please provide a high-level architecture diagram.", label: "Link or note on how it will be shared" },
    { id: 'C5', n: 'C5', t: 'area', q: "Describe the GenAI system architecture." },
    { id: 'C6', n: 'C6', t: 'one', q: "Is the system a single LLM app, an agent/multi-agent framework, a tool-using assistant, an autonomous workflow/orchestration, or a hybrid AI pipeline?", opts: [{ v: 'single', l: "Single LLM app" }, { v: 'agent', l: "Agent/multi-agent framework" }, { v: 'tool', l: "Tool-using assistant" }, { v: 'auto', l: "Autonomous workflow/orchestration" }, { v: 'hybrid', l: "Hybrid AI pipeline" }] },
    { id: 'C7', n: 'C7', t: 'many', q: "Is the application a web application, API only, mobile application, desktop application, Slack/Teams/Discord bot, embedded widget, voice interface, or other?", opts: [{ v: 'web', l: "Web application" }, { v: 'api', l: "API only" }, { v: 'mobile', l: "Mobile application" }, { v: 'desktop', l: "Desktop application" }, { v: 'bot', l: "Slack/Teams/Discord bot" }, { v: 'widget', l: "Embedded widget" }, { v: 'voice', l: "Voice interface" }, { v: 'other', l: "Other" }] },
    { h: "Model information" },
    { id: 'C8', n: 'C8', t: 'area', q: "Which models are used (e.g. OpenAI GPT-4.1/GPT-4o/o-series, Anthropic Claude, Google Gemini, Meta Llama, a self-hosted OSS model, or a proprietary fine-tuned model)?" },
    { id: 'C9', n: 'C9', t: 'many', q: "Are models hosted by a vendor API, self-hosted, hosted in a cloud VPC/private endpoint, or on-premise?", opts: [{ v: 'vendor', l: "Vendor API" }, { v: 'self', l: "Self-hosted" }, { v: 'vpc', l: "Cloud VPC/private endpoint" }, { v: 'onprem', l: "On-premise" }] },
    yn('C10', 'C10', "Are any models fine-tuned/custom-trained? If yes, please describe the training/fine-tuning process.", { area: true, label: "If yes — describe" }, YNU),
    yn('C11', 'C11', "Are multiple models used in routing/chains? If yes, please explain the orchestration logic.", { area: true, label: "If yes — explain" }, YNU),
    { h: "Prompting / system design" },
    yn('C12', 'C12', "Can you provide system prompts, developer prompts, hidden instructions, and prompt templates?", null, YNU),
    yn('C13', 'C13', "Is a prompt templating framework used (e.g. LangChain, LlamaIndex, Semantic Kernel, or a custom framework)?", { label: "Which one" }, YNU),
    { h: "RAG / information retrieval" },
    yn('C14', 'C14', "Does the application use RAG (Retrieval-Augmented Generation)?", false, YNU),
    { id: 'C15', n: 'C15', t: 'area', show: function (a) { return a['C14.v'] === 'yes'; }, q: "What data sources feed the RAG pipeline (internal documents, customer documents, database records, web search, third-party APIs, uploaded files, other)?" },
    { id: 'C16', n: 'C16', t: 'text', show: function (a) { return a['C14.v'] === 'yes'; }, q: "What vector DB / retrieval system is used (e.g. Pinecone, Weaviate, Chroma, Elasticsearch, PGVector, other)?" },
    { id: 'C17', n: 'C17', t: 'many', q: "How is ingestion performed (manual upload, automated sync, API ingestion, user uploads)?", opts: [{ v: 'manual', l: "Manual upload" }, { v: 'sync', l: "Automated sync" }, { v: 'api', l: "API ingestion" }, { v: 'user', l: "User uploads" }] },
    { h: "Agent / tool / plugin capabilities" },
    yn('C18', 'C18', "Does the model invoke tools/functions?", false, YNU),
    { id: 'C19', n: 'C19', t: 'area', show: function (a) { return a['C18.v'] === 'yes'; }, q: "List all available tools/functions/plugins. For each: name, purpose, required permissions, and side effects (read/write/delete/send)." },
    { id: 'C20', n: 'C20', t: 'many', q: "Can the AI send emails, create tickets, modify data, execute code, query databases, access internal APIs, trigger workflows, or access cloud resources?", opts: [{ v: 'email', l: "Send emails" }, { v: 'tickets', l: "Create tickets" }, { v: 'modify', l: "Modify data" }, { v: 'exec', l: "Execute code" }, { v: 'db', l: "Query databases" }, { v: 'apis', l: "Access internal APIs" }, { v: 'workflows', l: "Trigger workflows" }, { v: 'cloud', l: "Access cloud resources" }, { v: 'none', l: "None of these", none: true }] },
    yn('C21', 'C21', "Are tool calls user-confirmed before execution?", false, YNU),
    yn('C22', 'C22', "Are there role/permission boundaries for tool access?", null, YNU),
    { h: "Memory / context handling" },
    { id: 'C23', n: 'C23', t: 'one', q: "Does the system store conversation memory (session only, persistent per user, or shared/global memory)?", opts: [{ v: 'session', l: "Session only" }, { v: 'user', l: "Persistent per user" }, { v: 'shared', l: "Shared/global memory" }, { v: 'none', l: "No memory" }] },
    { id: 'C24', n: 'C24', t: 'text', q: "How long is memory retained?" },
    yn('C25', 'C25', "Is memory isolated between users/tenants?", false, YNU),
    yn('C26', 'C26', "Can users edit/delete stored memory?", false, YNU),
    { h: "Authentication / authorization" },
    { id: 'C27', n: 'C27', t: 'many', q: "What authentication mechanisms protect the application (SSO, OAuth, JWT, API keys, none/public)?", opts: [{ v: 'sso', l: "SSO" }, { v: 'oauth', l: "OAuth" }, { v: 'jwt', l: "JWT" }, { v: 'keys', l: "API keys" }, { v: 'none', l: "None / public" }] },
    yn('C28', 'C28', "Are there multiple user roles/tiers?", { label: "Which roles" }, YNU),
    yn('C29', 'C29', "Is RBAC/ABAC enforced on prompts, retrieved data, tool access, and generated outputs?", null, YNU),
    { h: "Security controls / guardrails" },
    { id: 'C30', n: 'C30', t: 'many', q: "What protections are implemented (prompt filtering, moderation API, input sanitization, output filtering, jailbreak detection, prompt injection detection, policy engine, human approval workflows)?", opts: [{ v: 'prompt', l: "Prompt filtering" }, { v: 'moderation', l: "Moderation API" }, { v: 'input', l: "Input sanitization" }, { v: 'output', l: "Output filtering" }, { v: 'jailbreak', l: "Jailbreak detection" }, { v: 'injection', l: "Prompt injection detection" }, { v: 'policy', l: "Policy engine" }, { v: 'human', l: "Human approval workflows" }, { v: 'none', l: "None", none: true }] },
    { id: 'C31', n: 'C31', t: 'many', q: "Are guardrails applied pre-prompt, pre-tool, post-output, or via continuous/agent loop controls?", opts: [{ v: 'pre', l: "Pre-prompt" }, { v: 'tool', l: "Pre-tool" }, { v: 'post', l: "Post-output" }, { v: 'loop', l: "Continuous/agent loop controls" }] },
    yn('C32', 'C32', "Are there rate limits / abuse protections?", null, YNU),
    { h: "Environment / access for testing" },
    { id: 'C33', n: 'C33', t: 'one', q: "Which environment will be tested (production, staging, QA, dedicated test)?", opts: [{ v: 'prod', l: "Production" }, { v: 'staging', l: "Staging" }, { v: 'qa', l: "QA" }, { v: 'test', l: "Dedicated test" }] },
    { id: 'C34', n: 'C34', t: 'many', q: "Will testers receive user accounts, admin accounts, API keys, documentation, and/or source code / white-box access?", opts: [{ v: 'user', l: "User accounts" }, { v: 'admin', l: "Admin accounts" }, { v: 'keys', l: "API keys" }, { v: 'docs', l: "Documentation" }, { v: 'source', l: "Source code / white-box access" }] },
    yn('C35', 'C35', "Are there IP allowlisting requirements?", { label: "Details" }, YNU),
    yn('C36', 'C36', "Are there test window restrictions?", { label: "Details" }, YNU),
    { h: "Rules of engagement" },
    yn('C37', 'C37', "Are destructive tests permitted?", false, YNU),
    yn('C38', 'C38', "Is data exfiltration proof-of-concept allowed?", false, YNU),
    yn('C39', 'C39', "Are automated fuzzing / high-volume attacks allowed?", false, YNU),
    yn('C40', 'C40', "Are model-cost-generating tests restricted?", { label: "Details" }, YNU),
    yn('C41', 'C41', "Are there any prohibited actions or sensitive systems?", { area: true, label: "If yes — list them" }, YNU)
  ];
  function copy(it) { var c = {}; for (var k in it) c[k] = it[k]; return c; }

  var discovery = {
    id: 'discovery',
    steps: [
      { title: "Your profile", intro: "If we sent you a pre-filled link, check these answers. They decide which sections follow.",
        items: [Q.q1, Q.q2, Q.q2c, Q.q3, Q.q4, Q.q5, Q.q6, Q.q7, Q.q8, Q.q8r, Q.q9, Q.q10, Q.q11, Q.q12, Q.q13, Q.q14, Q.q15, Q.q16, Q.q17, Q.q18, Q.q19, Q.q23] },
      { title: "Engagement",
        items: [
          open('e1', 'E1', "Which legal entity operates the product, and where is it registered?", false),
          open('e2', 'E2', "How large is the engineering team, and who owns infrastructure and data?"),
          open('e3', 'E3', "How many client deployments are live, and in which countries?"),
          { id: 'e4', n: 'E4', q: "If implementation is needed, who would carry it out?", fields: [
            { k: 'v', t: 'one', inline: true, opts: [{ v: 'us', l: "Our own team" }, { v: 'senecai', l: "SenecAI" }, { v: 'mixed', l: "Mixed" }, { v: 'tbd', l: "Not decided yet" }] },
            { k: 'd', t: 'text', label: "Notes on internal capacity or expectations" }] },
          open('e5', 'E5', "Who are your contacts for legal, technical and security topics?"),
          open('e6', 'E6', "Which documents can you share now (policies, DPIA, architecture, test reports)? Paste links or list them.")
        ] },
      { title: "AI Act", show: aiOn,
        items: on(aiOn, [
          { h: "Classification and role" },
          { id: 'ai1', n: 'AI1', q: "Have you self-assessed each system’s risk class under the AI Act?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YND },
            { k: 'class', t: 'one', inline: true, label: "If yes, the result", opts: [{ v: 'prohibited', l: "Prohibited" }, { v: 'high', l: "High-risk" }, { v: 'transparency', l: "Transparency obligations" }, { v: 'minimal', l: "Minimal" }, { v: 'unsure', l: "Unsure" }] },
            { k: 'd', t: 'text', label: "Where is it documented?" }] },
          { id: 'ai2', n: 'AI2', q: "Does any system do any of these?", fields: [{ k: 'v', t: 'many', opts: [
            { v: 'emotion', l: "Recognise emotions at work or in education" },
            { v: 'biocat', l: "Categorise people by sensitive traits from biometric data" },
            { v: 'scoring', l: "Social scoring" },
            { v: 'manipulation', l: "Use manipulative or exploitative techniques" },
            { v: 'scraping', l: "Build face databases by untargeted scraping" },
            { v: 'none', l: "None of these", none: true }] }] },
          open('ai3', 'AI3', "For each system: who built it, who uses it under their name, and has any third-party AI been rebranded, changed or put to a new use?"),
          yn('ai4', 'AI4', "Do you train, or place on the market, a general-purpose AI model?"),
          { h: "Stack and data" },
          { id: 'ai5', n: 'AI5', t: 'area', q: "Which third-party services power the system, and which integrations are live today?", show: function (a) { return aiOn(a) && !cyberOn(a); } },
          yn('ai6', 'AI6', "Is anything trained or fine-tuned in-house, and on your own historical decisions?", { area: true, label: "If yes, what and on which data" }),
          { id: 'ai7', n: 'AI7', t: 'one', inline: true, q: "Are model versions pinned, or set to auto-update?", opts: [
            { v: 'pinned', l: "Pinned" }, { v: 'auto', l: "Auto-update / latest" }, { v: 'mixed', l: "Mixed" }, { v: 'unsure', l: "Unsure" }] },
          open('ai8', 'AI8', "What data was the model trained and tested on, and who provides it?"),
          yn('ai9', 'AI9', "Is that data documented, including checks for quality and representativeness?"),
          yn('ai10', 'AI10', "Has accuracy been tested, including across the groups your users belong to (e.g. gender, age, language, accent)? Is it documented?", { area: true, label: "What was tested" }),
          yn('ai11', 'AI11', "Has robustness been tested (unusual inputs, edge cases)? Is it documented?"),
          yn('ai12', 'AI12', "Does the system log enough to reconstruct a specific outcome?"),
          yn('ai13', 'AI13', "Do you collect demographic data about the people affected?"),
          { h: "Governance and documentation" },
          { id: 'ai14', n: 'AI14', q: "Is there a documented risk management process (risks, mitigations, residual risk)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: [{ v: 'documented', l: "Documented process" }, { v: 'informal', l: "Informal only" }, { v: 'nothing', l: "Nothing yet" }] },
            { k: 'd', t: 'text', label: NOTES }] },
          yn('ai15', 'AI15', "Are changes to the system reviewed before release, and are policies and documentation version-controlled?"),
          yn('ai16', 'AI16', "Is a named person or team responsible for AI compliance, with quality and compliance roles assigned?", { label: "Who" }),
          yn('ai17', 'AI17', "Do you have technical documentation describing the system’s architecture, purpose and limits?", { area: true, label: "If yes, list the documents" }),
          { h: "Transparency and oversight" },
          yn('ai18', 'AI18', "Do you give clients instructions for use (capabilities, limits, how to read outputs)?"),
          { id: 'ai19', n: 'AI19', q: "Are people told they are interacting with AI?", show: function (a) { return aiOn(a) && !(Array.isArray(a.q15) && a.q15.length === 1 && a.q15[0] === 'b2b'); }, fields: [
            { k: 'told', t: 'one', inline: true, label: "Told before the interaction?", opts: YND },
            { k: 'alt', t: 'one', inline: true, label: "Is a non-AI alternative offered?", opts: YND }] },
          { id: 'ai20', n: 'AI20', q: "Can a human review or override an AI output, and do they review negative outcomes before they reach the person?", fields: [
            { k: 'v', t: 'one', inline: true, label: "Human review possible?", opts: YND },
            { k: 'doc', t: 'one', inline: true, label: "Is it documented?", opts: [{ v: 'documented', l: "Documented" }, { v: 'informal', l: "Informal only" }, { v: 'none', l: "No workflow" }] },
            { k: 'neg', t: 'one', label: "Negative outcomes", opts: [{ v: 'always', l: "A human always reviews them" }, { v: 'sometimes', l: "Sometimes fully automated" }, { v: 'auto', l: "Always fully automated" }, { v: 'na', l: "Not applicable" }] }] },
          yn('ai21', 'AI21', "Do you track performance, accuracy or complaints once live (post-market monitoring)?"),
          yn('ai22', 'AI22', "Is there an incident response process that could cover AI incidents?"),
          yn('ai23', 'AI23', "Does your marketing use terms like “unbiased”, “fair” or “AI Act compliant”?", { area: true, label: "If yes, what evidence backs them" }),
          open('ai24', 'AI24', "Rough usage volume to date and monthly run rate, split by market if relevant")
        ]) },
      { title: "GDPR", show: function (a) { return scope(a).gdpr; },
        items: [
          yn('p1', 'P1', "Do you have a record of processing activities (RoPA)?", { label: "Last updated" }),
          yn('p2', 'P2', "Do you have a data protection impact assessment (DPIA)?", { label: "Prepared by, and when" }),
          yn('p3', 'P3', "Are data processing agreements in place with all sub-processors?"),
          yn('p4', 'P4', "Is the lawful basis documented for each processing activity (e.g. a legitimate interest assessment)?"),
          yn('p5', 'P5', "Is your privacy notice specific to this product, not a generic template?", false),
          yn('p6', 'P6', "Are people told how their data is used, kept and shared, before or during the interaction?", { label: "How" }),
          open('p7', 'P7', "What is stored per interaction (audio, transcripts, logs, metadata), and for how long?"),
          { id: 'p8', n: 'P8', q: "Where is data hosted, and is any of it processed outside the EEA?", fields: [
            { k: 'host', t: 'text', label: "Cloud provider and region" },
            { k: 'eea', t: 'one', inline: true, label: "Any processing outside the EEA?", opts: YND }] },
          { id: 'p9', n: 'P9', t: 'one', inline: true, q: "Have you appointed a data protection officer (DPO)?", opts: [
            { v: 'yes', l: "Yes" }, { v: 'notneeded', l: "No, we assessed we don’t need one" }, { v: 'no', l: "No" }, { v: 'dk', l: "Don’t know" }] },
          yn('p10', 'P10', "Is there a process for data subject requests, and for notifying breaches within 72 hours?")
        ] },
      { title: "NIS2", show: function (a) { return scope(a).nis2; },
        items: [
          open('n6', 'N6', "Confirm the size test: staff, annual turnover and balance sheet, including partner and linked companies"),
          open('n7', 'N7', "In which EU countries do you provide services, and where is your main establishment?"),
          { id: 'n8', n: 'N8', t: 'many', q: "Which of these security measures are in place?", opts: [
            { v: 'policy', l: "Risk analysis and security policies" }, { v: 'incident', l: "Incident handling" },
            { v: 'bcm', l: "Business continuity, backups and crisis management" }, { v: 'supply', l: "Supply chain security" },
            { v: 'sdlc', l: "Secure development and vulnerability handling" }, { v: 'effect', l: "Checks that measures work" },
            { v: 'hygiene', l: "Cyber hygiene and training" }, { v: 'crypto', l: "Cryptography and encryption" },
            { v: 'access', l: "Staff security and access control" }, { v: 'mfa', l: "Multi-factor authentication" },
            { v: 'none', l: "None of these yet", none: true }] },
          open('n9', 'N9', "Significant incidents in the last 24 months, and how they were handled"),
          yn('n10', 'N10', "Is your security work aligned with ISO 27001 or another framework?", { label: "Which" })
        ] },
      { title: "DORA", show: function (a) { return scope(a).dora; },
        items: [
          yn('d7', 'D7', "Do you qualify for the simplified ICT risk management framework (Art. 16 DORA)?", false, YND),
          yn('d8', 'D8', "Have you mapped your critical or important functions and the ICT services behind them?"),
          yn('d9', 'D9', "Do you have an ICT third-party risk policy and exit strategies for critical providers?"),
          yn('d10', 'D10', "Has your authority designated you for threat-led penetration testing (TLPT)?", false),
          { id: 'd11', n: 'D11', t: 'area', q: "Which DORA contract clauses (Art. 30) are already in your client contracts?", show: function (a) { return scope(a).doraIct; } }
        ].map(function (it) { if (!it.show && it.id !== 'd11') it.show = function (a) { return scope(a).doraEntity; }; return it; }) },
      { title: "Cyber Resilience Act", show: function (a) { return scope(a).cra; },
        items: [
          open('cr6', 'CR6', "Which products and versions are on the market, and how often do you release?"),
          { id: 'cr7', n: 'CR7', t: 'one', q: "Which conformity assessment route do you expect?", opts: [
            { v: 'self', l: "Self-assessment" }, { v: 'standard', l: "Harmonised standard" }, { v: 'nb', l: "Notified body" }, { v: 'dk', l: "Don’t know" }] },
          yn('cr8', 'CR8', "Do you have a cybersecurity risk assessment and technical documentation for each product?"),
          open('cr9', 'CR9', "Which open-source components do you ship, and do you act as an open-source steward?"),
          open('cr10', 'CR10', "When does the support period end for each product?", false)
        ] },
      { title: "ISO certification", show: function (a) { var s = scope(a); return s.iso27 || s.iso42; },
        items: [
          open('i1', 'I1', "Which standard, and what scope (whole company, one product, one site)?"),
          yn('i2', 'I2', "Is there an existing management system (ISMS or AIMS) to build on?"),
          open('i3', 'I3', "Target certification date, and have you chosen a certification body?", false)
        ] },
      { title: "Cyber", cyber: true, intro: "For security testing (pen test, AI red teaming). Answered by engineering or security.", show: cyberOn,
        items: on(cyberOn, CYBER.map(copy)) },
      { title: "Send", intro: "Who should we follow up with?", final: true,
        items: CONTACT.concat([{ id: 'notes', n: '', t: 'area', q: "Anything else we should know?" }]) }
    ]
  };

  /* ================================================================ AI ACT SCOPING */
  /* Sent to prospects after first contact (scoping-ai-act.html). Section 1 is one card per AI
     system; the documents checklist (section 9) shows only the groups that fit the answers. */
  var YPN = [{ v: 'yes', l: "Yes" }, { v: 'partly', l: "Partly" }, { v: 'no', l: "No" }];
  var DOCS = [{ v: 'yes', l: "Yes" }, { v: 'partly', l: "Partly" }, { v: 'no', l: "No" }, { v: 'dk', l: "We don’t know" }];
  function art(s) { return UI.art + ' ' + s; }
  function annex(s) { return UI.annex + ' ' + s; }
  function vals(a, id) { var x = a[id]; return Array.isArray(x) ? x.filter(function (v) { return v !== 'none'; }) : []; }
  function cards(a) {
    var n = Number(a['k0.n']) || 1, out = [];
    for (var i = 1; i <= n; i++) {
      var c = {};
      ['name', 'use', 'built', 'brand'].forEach(function (f) { c[f] = a['k0.' + i + '.' + f]; });
      out.push(c);
    }
    return out;
  }
  function aiScope(a) {
    var cs = cards(a), known = cs.some(function (c) { return c.built || c.use; });
    var s = {};
    s.provider = !known || cs.some(function (c) { return c.built === 'self' || c.built === 'commissioned' || c.brand === 'yes'; });
    s.deployer = !known || cs.some(function (c) { return c.built === 'ready' || c.use === 'internal' || c.use === 'both'; });
    s.annex3 = vals(a, 'k11');
    var annex3Unknown = !filled(a.k11);
    s.annex1 = a.k12 === 'yes' || a.k12 === 'dk';
    s.high = s.annex3.length > 0 || annex3Unknown || s.annex1 || a['k9.result'] === 'high';
    s.publicBody = a['g2.type'] === 'public';
    s.fria = s.deployer && s.high && (s.publicBody || a['g2.type'] === 'service' || has(a, 'k11', 'credit') || has(a, 'k11', 'insurance'));
    s.gpaiProvider = a.k13 === 'finetune' || a.k13 === 'own';
    s.nonEU = a['g2.est'] === 'non';
    s.prohibited = vals(a, 'k10');
    return s;
  }
  function when(fn) { return function (a) { return fn(aiScope(a), a); }; }

  /* "About you": the same first step in every scoping questionnaire. */
  var ABOUT = [
    { id: 'g1', n: '1', t: 'text', req: true, q: "Company name and website" },
    { id: 'g2', n: '2', q: "Legal entity and country of registration", fields: [
      { k: 'entity', t: 'text' },
      { k: 'est', t: 'one', inline: true, label: "Established", opts: [{ v: 'eu', l: "In the EU or EEA" }, { v: 'non', l: "Outside the EU or EEA" }] },
      { k: 'type', t: 'one', label: "Type of organisation", opts: [{ v: 'private', l: "Private company" }, { v: 'public', l: "Public body" }, { v: 'service', l: "Private company providing a public service" }] }] },
    { id: 'g3', n: '3', q: "Company size, and who owns infrastructure and data", fields: [
      { k: 'size', t: 'one', inline: true, label: "People", opts: [{ v: '1-9', l: "1–9" }, { v: '10-49', l: "10–49" }, { v: '50-249', l: "50–249" }, { v: '250+', l: "250+" }] },
      { k: 'team', t: 'text', label: "Engineering team size, and who owns infrastructure and data" }] },
    { id: 'g4', n: '4', t: 'area', req: true, q: "In one or two sentences, what does your product or service do?" },
    { id: 'g5', n: '5', t: 'area', q: "Who are your clients (sectors, size, countries), and who is affected by your AI’s outputs?" },
    { id: 'g6', n: '6', q: "Where does your product stand today?", fields: [
      { k: 'status', t: 'one', inline: true, opts: [{ v: 'dev', l: "In development" }, { v: 'pilot', l: "Pilot" }, { v: 'live', l: "Live" }] },
      { k: 'where', t: 'text', label: "Live deployments, and in which countries (EU / non-EU)" }] },
    { id: 'g7', n: '7', q: "What is driving this, and is there a hard deadline?", fields: [
      { k: 'drivers', t: 'many', opts: [{ v: 'client', l: "A client or procurement requirement" }, { v: 'investor', l: "Investor due diligence" },
        { v: 'regulator', l: "A regulator or audit" }, { v: 'deadline', l: "A legal deadline" }, { v: 'ahead', l: "Getting ahead of it" }] },
      { k: 'deadline', t: 'text', label: "Hard deadline, if any" }] },
    { id: 'g8', n: '8', q: "Are you looking for an audit of where you stand, or also the work to close the gaps?", fields: [
      { k: 'scope', t: 'one', inline: true, opts: [{ v: 'audit', l: "Audit only" }, { v: 'both', l: "Audit and implementation" }, { v: 'unsure', l: "Not sure yet" }] },
      { k: 'who', t: 'one', inline: true, label: "If implementation is needed, who would carry it out?", opts: [{ v: 'us', l: "Our own team" }, { v: 'senecai', l: "SenecAI" }, { v: 'mixed', l: "Mixed" }, { v: 'tbd', l: "Not decided yet" }] },
      { k: 'notes', t: 'text', label: "Notes on internal capacity or expectations" }] }
  ];

  var aiact = {
    id: 'aiact',
    submit: "Send my answers →",
    thanksTitle: "Thank you. Your answers have been sent.",
    thanks: "We’ll review them and come back to you with our proposal. You can print or save a copy of your answers below.",
    dataNote: "We use your answers only to scope your project and prepare our proposal. See our",
    steps: [
      { title: "About you", intro: "A few questions about your company. They are the same in all our scoping questionnaires.",
        items: ABOUT },
      { title: "Your AI systems", intro: "Add one card per AI system, whether it is part of your product or used internally. Be as concrete as you can: these answers are the basis of the assessment.",
        items: [
          { id: 'k0', t: 'repeat', item: "AI system", add: "+ Add another AI system", remove: "Remove", max: 10, fields: [
            { k: 'name', t: 'text', label: "Name of the system or tool (e.g. ChatGPT, an in-house model, a vendor platform)" },
            { k: 'desc', t: 'area', label: "What it does and how it works, briefly" },
            { k: 'use', t: 'one', inline: true, label: "Used in", opts: [{ v: 'product', l: "Our product (used by customers)" }, { v: 'internal', l: "Internal operations" }, { v: 'both', l: "Both" }] },
            { k: 'process', t: 'text', label: "Business process it supports (e.g. credit scoring, support triage, stock optimisation)" },
            { k: 'input', t: 'text', label: "Input data (e.g. transactions, images, text, sensor data, user data)" },
            { k: 'output', t: 'text', label: "Output (e.g. score, recommendation, classification, automated action, alert)" },
            { k: 'source', t: 'text', label: "Where the data comes from (internal databases, third parties, external APIs, user-generated, synthetic)" },
            { k: 'built', t: 'one', label: "Who built it?", opts: [{ v: 'self', l: "We built it ourselves" }, { v: 'commissioned', l: "An outside developer built it to our specifications" }, { v: 'ready', l: "A ready-made product from another company" }] },
            { k: 'brand', t: 'one', inline: true, label: "Is it offered to others under your name?", opts: [{ v: 'yes', l: "Yes" }, { v: 'no', l: "No" }] },
            { k: 'auto', t: 'one', label: "Autonomy", opts: [{ v: 'full', l: "Fully automated" }, { v: 'on', l: "Partly automated: a human monitors and can step in (human-on-the-loop)" }, { v: 'in', l: "Advisory: a human makes the final decision (human-in-the-loop)" }] },
            { k: 'impact', t: 'area', label: "Decisions it influences, and the impact of a wrong output (financial, operational, on customers)" },
            { k: 'users', t: 'text', label: "Number of internal users; does it affect end customers?" },
            { k: 'stage', t: 'one', inline: true, label: "Stage", opts: [{ v: 'live', l: "Live" }, { v: 'pilot', l: "Pilot" }, { v: 'planned', l: "Planned" }] },
            { k: 'owner', t: 'text', label: "Person responsible (name and role)" }] }
        ] },
      { title: "Scope and classification",
        items: [
          { id: 'k9', n: '9', q: "Have you self-assessed the AI Act risk class of your systems?", fields: [
            { k: 'done', t: 'one', inline: true, opts: YND },
            { k: 'result', t: 'one', inline: true, label: "If yes, the result", opts: [{ v: 'prohibited', l: "Prohibited" }, { v: 'high', l: "High-risk" }, { v: 'limited', l: "Limited risk (transparency)" }, { v: 'minimal', l: "Minimal risk" }, { v: 'unsure', l: "Unsure" }] },
            { k: 'where', t: 'text', label: "Where is it documented?" }] },
          { id: 'k10', n: '10', t: 'many', q: "Does any of your systems do any of the following?", opts: [
            { v: 'manipulation', l: "Manipulates behaviour, or exploits vulnerabilities linked to age, disability or social situation" },
            { v: 'scoring', l: "Social scoring" },
            { v: 'crime', l: "Predicts the risk of someone committing a crime, based on profiling" },
            { v: 'scraping', l: "Builds face databases by scraping the internet or CCTV footage" },
            { v: 'emotion', l: "Infers emotions at work or in education" },
            { v: 'biocat', l: "Categorises people by sensitive traits (e.g. ethnicity, religion, sexual orientation) from biometric data" },
            { v: 'rbi', l: "Real-time remote biometric identification in public spaces" },
            { v: 'none', l: "None of these", none: true }] },
          { id: 'k11', n: '11', t: 'many', q: "Does any of your systems make or support decisions in these areas?", opts: [
            { v: 'biometrics', l: "Biometrics: identification, categorisation or emotion recognition" },
            { v: 'infra', l: "Critical infrastructure (energy, water, transport, digital infrastructure)" },
            { v: 'education', l: "Education and vocational training" },
            { v: 'employment', l: "Employment, HR and worker management" },
            { v: 'credit', l: "Creditworthiness or credit scoring" },
            { v: 'insurance', l: "Risk assessment and pricing in life or health insurance" },
            { v: 'public', l: "Access to public benefits and essential public services" },
            { v: 'emergency', l: "Emergency calls and dispatch" },
            { v: 'law', l: "Law enforcement, migration or border control" },
            { v: 'justice', l: "Justice and democratic processes" },
            { v: 'none', l: "None of these", none: true }] },
          { id: 'k12', n: '12', t: 'one', inline: true, q: "Is any of your systems a safety component of a regulated product?",
            hint: "For example machinery, medical devices, vehicles, toys, lifts or radio equipment.", opts: YND },
          { id: 'k13', n: '13', t: 'one', q: "Do you use general-purpose AI models (e.g. GPT, Claude, Gemini, Llama)?", opts: [
            { v: 'no', l: "No" }, { v: 'api', l: "Yes, through an API or a ready-made product" },
            { v: 'finetune', l: "Yes, and we fine-tune or significantly modify them" }, { v: 'own', l: "Yes, we train our own general-purpose model" }, { v: 'dk', l: "Don’t know" }] }
        ] },
      { title: "How the AI works",
        items: [
          { id: 'k14', n: '14', t: 'area', q: "Where exactly does AI step in? Describe the flow: input → processing → output → decision.", hint: "Be specific for each system; avoid general descriptions." },
          { id: 'k15', n: '15', t: 'area', q: "Does the AI influence real decisions? What is the impact, and what happens when it gets something wrong?" },
          { id: 'k16', n: '16', t: 'area', q: "What can the AI do on its own (e.g. access databases, start processes, send commands), and what are the limits?" },
          { id: 'k17', n: '17', t: 'area', q: "Which third-party services or APIs are used (LLM provider, speech, hosting…), and what role does each play?" },
          { id: 'k18', n: '18', q: "If anything was trained or fine-tuned in-house, was it trained on your own historical decisions?", fields: [
            { k: 'v', t: 'one', inline: true, opts: [{ v: 'yes', l: "Yes" }, { v: 'no', l: "No" }, { v: 'na', l: "Nothing is trained in-house" }, { v: 'dk', l: "Don’t know" }] },
            { k: 'd', t: 'text', label: "If yes, which data and outcomes" }] },
          { id: 'k19', n: '19', t: 'one', inline: true, q: "Are model versions pinned, or set to auto-update?", opts: [
            { v: 'pinned', l: "Pinned" }, { v: 'auto', l: "Auto-update / latest" }, { v: 'mixed', l: "Mixed" }, { v: 'unsure', l: "Unsure" }] },
          { id: 'k20', n: '20', q: "Integrations and usage volume", fields: [
            { k: 'int', t: 'text', label: "Integrations live today, and planned (e.g. CRM, email, voice, messaging)" },
            { k: 'vol', t: 'text', label: "Usage volume to date and monthly run rate" }] }
        ] },
      { title: "Data governance and testing",
        items: [
          { id: 'k21', n: '21', t: 'area', q: "What data were the models trained on: sources, period, and whether it is real, synthetic or third-party?" },
          { id: 'k22', n: '22', q: "Is data quality and representativeness checked and documented?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How (e.g. sampling, internal audits)" }] },
          { id: 'k23', n: '23', q: "Is incoming data validated automatically (missing values, outliers, consistency)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Examples (rules, filters)" }] },
          { id: 'k24', n: '24', t: 'area', q: "How are data updates and quality problems (incomplete or wrong data) handled?" },
          { id: 'k25', n: '25', q: "Has accuracy been measured, and is it consistent across subgroups (e.g. gender, age, language, accent)? Is it documented?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "What was tested" }] },
          { id: 'k26', n: '26', q: "Has robustness been tested (edge cases, unusual inputs, stress tests)? Is it documented?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Methods used" }] },
          { id: 'k27', n: '27', q: "Do you collect demographic data about the people affected (e.g. gender, age, nationality)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YND }, { k: 'd', t: 'text', label: "If yes, what" }] }
        ] },
      { title: "Logging and traceability",
        items: [
          { id: 'k28', n: '28', t: 'area', q: "What is logged for each AI output (e.g. input, output, model version, timestamp)?" },
          { id: 'k29', n: '29', q: "Can a specific decision be reconstructed from the logs (input → model → output)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How" }] },
          { id: 'k30', n: '30', q: "What is stored per interaction, for how long, and where?", fields: [
            { k: 'stored', t: 'area', label: "What is stored (audio, transcripts, scores, logs, metadata), and for how long" },
            { k: 'host', t: 'text', label: "Hosting provider and region" },
            { k: 'eea', t: 'one', inline: true, label: "Any processing outside the EEA?", opts: YND }] }
        ] },
      { title: "Human oversight",
        items: [
          { id: 'k31', n: '31', q: "Can a human review, override or escalate an AI output?", fields: [
            { k: 'v', t: 'one', inline: true, label: "Possible?", opts: YND },
            { k: 'doc', t: 'one', inline: true, label: "Is it documented?", opts: [{ v: 'documented', l: "Documented" }, { v: 'informal', l: "Informal only" }, { v: 'none', l: "No workflow" }] },
            { k: 'how', t: 'text', label: "How it works in practice (interface, procedure, reaction time)" }] },
          { id: 'k32', n: '32', t: 'one', q: "Are high-impact outcomes (e.g. a rejection) ever acted on without a human checking that specific case?", opts: [
            { v: 'always', l: "No, a human always checks the case first" }, { v: 'sometimes', l: "Sometimes they are acted on automatically" },
            { v: 'auto', l: "Yes, always automated" }, { v: 'na', l: "Not applicable: no high-impact outcomes" }] },
          { id: 'k33', n: '33', t: 'text', q: "Who has final responsibility for decisions made or supported by AI?" }
        ] },
      { title: "Transparency",
        items: [
          { id: 'k34', n: '34', t: 'one', inline: true, q: "Do your clients receive instructions for use (capabilities, limits, how to read outputs)?",
            opts: YPN.concat([{ v: 'na', l: "Not applicable: we don’t supply AI to clients" }]) },
          { id: 'k35', n: '35', t: 'one', inline: true, q: "Are people told they are interacting with AI?",
            opts: YPN.concat([{ v: 'na', l: "Not applicable: no AI interacts with people directly" }]) },
          { id: 'k36', n: '36', t: 'one', inline: true, q: "Is AI-generated content you publish (text, images, audio, video) labelled as such?",
            opts: YPN.concat([{ v: 'na', l: "Not applicable: we don’t publish AI-generated content" }]) },
          { id: 'k37', n: '37', t: 'one', inline: true, opt: true, q: "Is a non-AI alternative offered to people who prefer one?", opts: YND }
        ] },
      { title: "Governance and risk management",
        items: [
          { id: 'k38', n: '38', q: "Is there a documented risk management process (risks, mitigations, residual risk), or is risk only handled informally?", fields: [
            { k: 'v', t: 'one', inline: true, opts: [{ v: 'documented', l: "Documented process" }, { v: 'informal', l: "Informal only" }, { v: 'nothing', l: "Nothing yet" }] },
            { k: 'd', t: 'text', label: NOTES }] },
          { id: 'k39', n: '39', q: "How are changes to the AI reviewed and approved before deployment?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How" }] },
          { id: 'k40', n: '40', t: 'one', inline: true, q: "Is there version control for AI policies and technical documentation?", opts: YPND },
          { id: 'k41', n: '41', q: "Are compliance roles assigned, and is there a named person for the AI Act?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'who', t: 'text', label: "Who" }] },
          { id: 'k42', n: '42', q: "Do you monitor performance in production (accuracy, drift, complaints, alert thresholds)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How" }] },
          { id: 'k43', n: '43', t: 'one', inline: true, q: "Is there an incident process that could cover AI incidents?", opts: YPND },
          { id: 'k44', n: '44', q: "Who has access to the AI systems and their data? Is access role-based?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Roles and access levels (e.g. admin, operator)" }] },
          { id: 'k45', n: '45', q: "Are there AI policies or governance processes, formal or informal?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Which, and who owns them" }] },
          { id: 'k46', n: '46', t: 'one', inline: true, q: "Have the people who use or build AI had AI literacy training?", opts: YPND },
          { id: 'k47', n: '47', q: "Security: which measures protect the AI systems, and which tests have been done?",
            hint: "A short overview is enough here. The detail goes in our cybersecurity questionnaire.", fields: [
            { k: 'measures', t: 'area', label: "Measures (e.g. access control, protection against data manipulation, attack monitoring)" },
            { k: 'tests', t: 'text', label: "Tests done, and how often (e.g. penetration test, vulnerability assessment)" }] },
          { id: 'k48', n: '48', q: "Does your marketing describe the AI as “unbiased”, “fair” or “AI Act compliant”?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YND }, { k: 'd', t: 'text', label: "If yes, what backs these claims" }] },
          { id: 'k49', n: '49', t: 'one', inline: true, q: "Have you carried out a fundamental rights impact assessment (FRIA)?", opts: YPND,
            hint: "Required before using a high-risk system if you are a public body or provide a public service, or if you use AI for credit scoring or for life or health insurance pricing.",
            show: when(function (s) { return s.fria; }) }
        ] },
      { title: "Documents",
        items: [
          { id: 'k50', n: '50', t: 'grid', q: "Which of these documents do you have?", opts: DOCS, note: "Link or note (optional)",
            intro: "Only the documents that fit your answers are listed.", rows: [
            { h: "Every company using or building AI" },
            { id: 'd1', l: "AI system inventory", d: "Which systems you use, what for, and who owns them.", ref: "Good practice" },
            { id: 'd2', l: "Written risk-classification assessment for each system", ref: art('6') },
            { id: 'd3', l: "Documented reasoning for treating an Annex III system as not high-risk", ref: art('6(3)–(4)'), show: when(function (s) { return s.annex3.length > 0; }) },
            { id: 'd4', l: "AI literacy measures: training plan and records", ref: art('4') },
            { id: 'd5', l: "Internal AI policy or acceptable-use policy", ref: "Good practice" },
            { h: "Transparency", show: function (a) { return a.k35 !== 'na' || a.k36 !== 'na' || has(a, 'k11', 'biometrics'); } },
            { id: 'd6', l: "Notice telling users they are interacting with AI", ref: art('50(1)'), show: function (a) { return a.k35 !== 'na'; } },
            { id: 'd7', l: "Labelling or marking of AI-generated content, including deepfakes", ref: art('50(2), (4)'), show: function (a) { return a.k36 !== 'na'; } },
            { id: 'd8', l: "Notice for people exposed to emotion recognition or biometric categorisation", ref: art('50(3)'), show: function (a) { return has(a, 'k11', 'biometrics'); } },
            { h: "Providers of high-risk AI", show: when(function (s) { return s.provider && s.high; }) },
            { id: 'd9', l: "Risk management system documentation", ref: art('9') },
            { id: 'd10', l: "Data governance documentation (sources, preparation, bias checks)", ref: art('10') },
            { id: 'd11', l: "Technical documentation", ref: art('11') + ', ' + annex('IV') },
            { id: 'd12', l: "Logging specification, with logs kept for at least 6 months", ref: art('12, 19') },
            { id: 'd13', l: "Instructions for use for your clients", ref: art('13') },
            { id: 'd14', l: "Human oversight design (who, how, with which tools)", ref: art('14') },
            { id: 'd15', l: "Accuracy, robustness and cybersecurity test reports", ref: art('15') },
            { id: 'd16', l: "Quality management system: written policies and procedures", ref: art('17') },
            { id: 'd17', l: "Procedure for corrective actions and for informing authorities", ref: art('20') },
            { id: 'd18', l: "Conformity assessment record", ref: art('43') },
            { id: 'd19', l: "EU declaration of conformity", ref: art('47') },
            { id: 'd20', l: "CE marking", ref: art('48') },
            { id: 'd21', l: "Registration in the EU database", ref: art('49') },
            { id: 'd22', l: "Post-market monitoring plan", ref: art('72') },
            { id: 'd23', l: "Serious incident reporting procedure", ref: art('73') },
            { id: 'd24', l: "Mandate for an authorised representative in the EU", ref: art('22'), show: when(function (s) { return s.nonEU; }) },
            { h: "Deployers of high-risk AI", show: when(function (s) { return s.deployer && s.high; }) },
            { id: 'd25', l: "Named people assigned to human oversight, and their training", ref: art('26(2)') },
            { id: 'd26', l: "Check that your input data is relevant and representative", ref: art('26(4)') },
            { id: 'd27', l: "Logs kept for at least 6 months", ref: art('26(6)') },
            { id: 'd28', l: "Information given to workers and their representatives (if used at work)", ref: art('26(7)') },
            { id: 'd29', l: "Information given to people affected by AI-supported decisions", ref: art('26(11)') },
            { id: 'd30', l: "DPIA that uses the provider’s information", ref: art('26(9)') + ' · GDPR ' + art('35') },
            { id: 'd31', l: "Procedure for explaining individual decisions on request", ref: art('86') },
            { id: 'd32', l: "Fundamental rights impact assessment (FRIA)", ref: art('27'), show: when(function (s) { return s.fria; }) },
            { id: 'd33', l: "Registration in the EU database (public bodies)", ref: art('26(8), 49(3)'), show: when(function (s) { return s.publicBody; }) },
            { h: "Providers of general-purpose AI models", show: when(function (s) { return s.gpaiProvider; }) },
            { id: 'd34', l: "Technical documentation of the model", ref: art('53(1)(a)') + ', ' + annex('XI') },
            { id: 'd35', l: "Information for downstream providers", ref: art('53(1)(b)') + ', ' + annex('XII') },
            { id: 'd36', l: "Copyright compliance policy", ref: art('53(1)(c)') },
            { id: 'd37', l: "Public summary of training content", ref: art('53(1)(d)') }] },
          { id: 'k51', n: '51', t: 'area', q: "Which of these documents can you share now? Paste links or list them." }
        ] },
      { title: "Send", intro: "Who should we follow up with?", final: true,
        items: CONTACT.concat([{ id: 'notes', n: '', t: 'area', q: "Anything else we should know?" }]) }
    ]
  };

  /* For our email only (never shown to the visitor): roles, likely risk level and document gaps. */
  aiact.summary = function (a) {
    var s = aiScope(a), facts = [];
    var roleOf = { self: 'provider', commissioned: 'provider', ready: 'deployer' };
    var list = cards(a).map(function (c, i) {
      if (!c.built && !c.brand) return '';
      var r = c.brand === 'yes' ? 'provider' : roleOf[c.built] || '';
      if (r === 'provider' && (c.use === 'internal' || c.use === 'both')) r = 'provider and deployer';
      return (c.name || 'AI system' + ' ' + (i + 1)) + ': ' + r;
    }).filter(Boolean);
    if (list.length) facts.push(['Likely role per system', list.join('; ')]);
    var optLabel = function (id, v) { var q = findQ(id); return q ? label(q.opts, v) : v; };
    if (s.prohibited.length) facts.push(['Possible prohibited practice', s.prohibited.map(function (v) { return optLabel('k10', v); }).join('; ')]);
    if (s.annex3.length) facts.push(['Annex III areas', s.annex3.map(function (v) { return optLabel('k11', v); }).join('; ')]);
    if (s.annex1) facts.push(['Annex I product', optLabel('k12', a.k12)]);
    if (a.k13 && a.k13 !== 'no') facts.push(['General-purpose AI', optLabel('k13', a.k13)]);
    var level = s.prohibited.length ? 'Check for prohibited practices first' :
      s.annex3.length || s.annex1 || a['k9.result'] === 'high' ? 'High-risk likely for at least one system' :
      a.k35 === 'yes' || a.k35 === 'partly' || a.k35 === 'no' || a.k36 === 'yes' || a.k36 === 'partly' || a.k36 === 'no' ? 'Limited risk (transparency obligations)' : 'Minimal risk, unless the call shows otherwise';
    facts.push(['Likely risk level', level]);
    if (s.fria) facts.push(['FRIA', 'Likely required']);
    var grid = findQ('k50'), group = '', counts = {};
    grid.rows.forEach(function (r) {
      if (r.h) { group = visible(r, a) ? r.h : ''; return; }
      if (!group || !visible(r, a)) return;
      var c = counts[group] || (counts[group] = { yes: 0, partly: 0, gap: 0, total: 0 });
      c.total++;
      if (a[r.id] === 'yes') c.yes++; else if (a[r.id] === 'partly') c.partly++; else c.gap++;
    });
    for (var g in counts) {
      var c = counts[g];
      facts.push(['Documents: ' + g, c.yes + ' ' + 'in place' + ' · ' + c.partly + ' ' + 'partly' + ' · ' + c.gap + ' ' + 'missing or unknown' + ' (' + c.total + ')']);
    }
    return { likely: [], unlikely: [], roles: [], facts: facts };
  };
  function findIn(t, id) {
    for (var i = 0; i < t.steps.length; i++)
      for (var j = 0; j < t.steps[i].items.length; j++) if (t.steps[i].items[j].id === id) return t.steps[i].items[j];
    return null;
  }
  function findQ(id) { return findIn(aiact, id); }

  /* ================================================================ GDPR SCOPING */
  /* Sent to prospects after first contact (scoping-gdpr.html). Section 1 is one card per
     processing activity, in the spirit of a record of processing; questions marked [RO] in the
     comments show only to companies established in Romania (Law 190/2018). */
  function acts(a) {
    var n = Number(a['p0.n']) || 1, out = [];
    for (var i = 1; i <= n; i++) {
      var c = {};
      ['name', 'role', 'basis', 'eea', 'where'].forEach(function (f) { c[f] = a['p0.' + i + '.' + f]; });
      ['people', 'special'].forEach(function (f) { c[f] = vals(a, 'p0.' + i + '.' + f); });
      out.push(c);
    }
    return out;
  }
  function gScope(a) {
    var cs = acts(a), s = {};
    s.processor = a.p9 === 'processor' || a.p9 === 'both' || cs.some(function (c) { return c.role === 'processor'; });
    s.joint = cs.some(function (c) { return c.role === 'joint'; });
    s.consent = cs.some(function (c) { return c.basis === 'consent'; });
    s.li = cs.some(function (c) { return c.basis === 'li'; });
    s.transfers = cs.some(function (c) { return c.eea === 'yes' || c.eea === 'dk'; });
    s.children = a.p10 === 'yes' || cs.some(function (c) { return c.people.indexOf('children') !== -1; });
    s.special = [];
    cs.forEach(function (c) { c.special.forEach(function (v) { if (s.special.indexOf(v) === -1) s.special.push(v); }); });
    s.ro = a['p12.est'] === 'ro';
    s.nonEU = a['p12.est'] === 'non' || a['g2.est'] === 'non';
    s.dpoLikely = a.p11 === 'yes';
    s.dpo = a['p13.v'] === 'yes' || s.dpoLikely;
    s.triggers = vals(a, 'p37');
    s.monitoring = has(a, 'p37', 'employees');
    s.automated = a['p26.v'] === 'yes';
    return s;
  }
  function gWhen(fn) { return function (a) { return fn(gScope(a), a); }; }

  var gdpr = {
    id: 'gdpr',
    submit: "Send my answers →",
    thanksTitle: "Thank you. Your answers have been sent.",
    thanks: "We’ll review them and come back to you with our proposal. You can print or save a copy of your answers below.",
    dataNote: "We use your answers only to scope your project and prepare our proposal. See our",
    steps: [
      { title: "About you", intro: "A few questions about your company. They are the same in all our scoping questionnaires.", items: ABOUT },
      { title: "Your processing activities", intro: "Add one card per activity in which you use personal data, for example customer accounts, recruitment, payroll, newsletter, product analytics or support. Be as concrete as you can: these answers are the basis of the assessment.",
        items: [
          { id: 'p0', t: 'repeat', item: "Activity", add: "+ Add another activity", remove: "Remove", max: 15, fields: [
            { k: 'name', t: 'text', label: "Name of the activity (e.g. customer accounts, recruitment, newsletter)" },
            { k: 'purpose', t: 'text', label: "Purpose: what you use the data for" },
            { k: 'role', t: 'one', label: "Your role", opts: [{ v: 'controller', l: "We decide why and how the data is used (controller)" }, { v: 'processor', l: "We process it on behalf of our clients (processor)" }, { v: 'joint', l: "We decide jointly with another company (joint controller)" }] },
            { k: 'people', t: 'many', label: "People concerned", opts: [{ v: 'customers', l: "Customers" }, { v: 'users', l: "Users" }, { v: 'employees', l: "Employees" }, { v: 'candidates', l: "Job candidates" },
              { v: 'children', l: "Children" }, { v: 'patients', l: "Patients" }, { v: 'suppliers', l: "Suppliers and business contacts" }, { v: 'other', l: "Other" }] },
            { k: 'data', t: 'text', label: "Data categories (e.g. name, email, address, payment data, IP address, location)" },
            { k: 'special', t: 'many', label: "Sensitive data", opts: [{ v: 'health', l: "Health" }, { v: 'biometric', l: "Biometric" }, { v: 'genetic', l: "Genetic" }, { v: 'ethnic', l: "Racial or ethnic origin" },
              { v: 'political', l: "Political opinions" }, { v: 'religion', l: "Religious or philosophical beliefs" }, { v: 'union', l: "Trade union membership" }, { v: 'sex', l: "Sex life or sexual orientation" },
              { v: 'criminal', l: "Criminal records" }, { v: 'none', l: "None", none: true }] },
            { k: 'scale', t: 'one', inline: true, label: "Approximate number of people", opts: [{ v: '<1k', l: "Under 1,000" }, { v: '1k-10k', l: "1,000–10,000" }, { v: '10k-100k', l: "10,000–100,000" }, { v: '100k+', l: "Over 100,000" }] },
            { k: 'basis', t: 'one', label: "Lawful basis", opts: [{ v: 'consent', l: "Consent" }, { v: 'contract', l: "Contract" }, { v: 'legal', l: "Legal obligation" }, { v: 'vital', l: "Vital interests" },
              { v: 'public', l: "Public task" }, { v: 'li', l: "Legitimate interest" }, { v: 'dk', l: "Don’t know" }] },
            { k: 'source', t: 'one', inline: true, label: "Where the data comes from", opts: [{ v: 'direct', l: "Directly from the people" }, { v: 'third', l: "From third parties" }, { v: 'publicsrc', l: "Public sources" }] },
            { k: 'recipients', t: 'text', label: "Who receives it (vendors, partners, authorities)" },
            { k: 'eea', t: 'one', inline: true, label: "Is it transferred outside the EEA?", opts: YND },
            { k: 'where', t: 'text', label: "If yes, where and to whom" },
            { k: 'tools', t: 'text', label: "Tools or systems used (e.g. CRM, HR software, cloud storage)" },
            { k: 'retention', t: 'text', label: "How long it is kept" }] }
        ] },
      { title: "Scope and role",
        items: [
          { id: 'p9', n: '9', t: 'one', q: "Overall, are you a controller, a processor for your clients, or both?", opts: [
            { v: 'controller', l: "Controller: we decide how personal data is used" }, { v: 'processor', l: "Processor: we handle personal data for our clients" },
            { v: 'both', l: "Both" }, { v: 'dk', l: "Don’t know" }] },
          { id: 'p10', n: '10', t: 'one', inline: true, q: "Do you process children’s data (under 16)?", opts: YND },
          { id: 'p11', n: '11', t: 'one', inline: true, q: "Is processing personal data at the core of your business, at large scale, either by regularly and systematically monitoring people or by handling sensitive data?",
            hint: "For example behavioural tracking or profiling of many users, location tracking, or health data at scale. This decides whether a data protection officer is mandatory.", opts: YND },
          { id: 'p12', n: '12', q: "Where are you established, and whom do you serve?", fields: [
            { k: 'est', t: 'one', inline: true, opts: [{ v: 'ro', l: "In Romania" }, { v: 'eu', l: "In another EU or EEA country" }, { v: 'non', l: "Outside the EU or EEA" }] },
            { k: 'multi', t: 'one', inline: true, label: "Do you serve people in several EU countries?", opts: YND }] }
        ] },
      { title: "Governance and accountability",
        items: [
          { id: 'p13', n: '13', q: "Have you appointed a data protection officer (DPO)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: [{ v: 'yes', l: "Yes" }, { v: 'notneeded', l: "No, we assessed we don’t need one" }, { v: 'no', l: "No" }, { v: 'dk', l: "Don’t know" }] },
            { k: 'notified', t: 'one', inline: true, label: "If yes, are the DPO’s contact details published and notified to the authority (ANSPDCP in Romania)?", opts: YPND }] },
          { id: 'p14', n: '14', t: 'text', q: "Who handles data protection day to day?" },
          { id: 'p15', n: '15', q: "Do you have a record of processing activities (RoPA)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Last updated" }] },
          { id: 'p16', n: '16', q: "Are there internal data protection policies, and has staff been trained?", fields: [
            { k: 'policies', t: 'one', inline: true, label: "Policies", opts: YPND }, { k: 'training', t: 'one', inline: true, label: "Staff training", opts: YPND }] },
          { id: 'p17', n: '17', q: "Are new features, products and vendors checked for privacy before launch (privacy by design)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How" }] }
        ] },
      { title: "Lawful basis and transparency",
        items: [
          { id: 'p18', n: '18', q: "Is the lawful basis documented for each activity? Where you rely on legitimate interest, has a legitimate interest assessment (LIA) been done?", fields: [
            { k: 'v', t: 'one', inline: true, label: "Lawful basis documented", opts: YPND },
            { k: 'lia', t: 'one', inline: true, label: "Legitimate interest assessments", opts: YPND.concat([{ v: 'na', l: "We don’t rely on legitimate interest" }]) }] },
          { id: 'p19', n: '19', t: 'area', q: "How is consent collected, recorded and withdrawn?", show: gWhen(function (s) { return s.consent; }) },
          { id: 'p20', n: '20', t: 'one', inline: true, q: "Is there a current privacy notice that reflects your actual processing, not a generic template?", opts: YPND },
          { id: 'p21', n: '21', q: "Are people told, before or during the interaction, how their data is used, kept and shared?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "How" }] },
          { id: 'p22', n: '22', t: 'one', q: "Does your website use a cookie banner, with non-essential cookies blocked until consent?", opts: [
            { v: 'yes', l: "Yes" }, { v: 'banner', l: "We have a banner, but cookies load before consent" }, { v: 'no', l: "No" }, { v: 'none', l: "We only use essential cookies" }, { v: 'dk', l: "Don’t know" }] },
          { id: 'p23', n: '23', t: 'one', inline: true, q: "If you send direct marketing (email, SMS, calls), do you have consent or another basis, and an easy opt-out?",
            opts: YPND.concat([{ v: 'na', l: "We don’t send direct marketing" }]) }
        ] },
      { title: "Data subject rights",
        items: [
          { id: 'p24', n: '24', t: 'one', inline: true, q: "Is there a process for access, rectification, erasure, portability and objection requests, with answers within one month?", opts: YPND },
          { id: 'p25', n: '25', t: 'text', q: "How many such requests did you receive in the last 12 months?" },
          { id: 'p26', n: '26', q: "Do you make automated decisions with legal or similarly significant effects (e.g. automatic rejections, credit scoring)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YND }, { k: 'd', t: 'text', label: "If yes, which, and can a person ask for human review?" }] }
        ] },
      { title: "Vendors, sharing and transfers",
        items: [
          { id: 'p27', n: '27', q: "Is there a list of vendors and sub-processors that handle personal data, with data processing agreements (DPAs) signed?", fields: [
            { k: 'list', t: 'one', inline: true, label: "Vendor list", opts: YPND }, { k: 'dpa', t: 'one', inline: true, label: "DPAs signed with all of them", opts: YPND }] },
          { id: 'p28', n: '28', q: "As a processor: do you have DPAs with your clients, and do you pass the same obligations on to your sub-processors?", show: gWhen(function (s) { return s.processor; }), fields: [
            { k: 'clients', t: 'one', inline: true, label: "DPAs with clients", opts: YPND }, { k: 'flow', t: 'one', inline: true, label: "Obligations passed on to sub-processors", opts: YPND }] },
          { id: 'p29', n: '29', q: "Transfers outside the EEA: where, and on what basis?", show: gWhen(function (s) { return s.transfers; }), fields: [
            { k: 'where', t: 'text', label: "Countries and vendors" },
            { k: 'mech', t: 'many', label: "Transfer mechanism", opts: [{ v: 'adequacy', l: "Adequacy decision" }, { v: 'dpf', l: "EU-US Data Privacy Framework" }, { v: 'scc', l: "Standard contractual clauses (SCCs)" },
              { v: 'bcr', l: "Binding corporate rules" }, { v: 'derog', l: "Derogations (e.g. explicit consent)" }, { v: 'dk', l: "Don’t know" }] },
            { k: 'tia', t: 'one', inline: true, label: "Transfer impact assessment (TIA) done?", opts: YPND }] },
          { id: 'p30', n: '30', t: 'one', inline: true, q: "Is there a written arrangement with the company you decide jointly with (joint controllers)?", opts: YPND, show: gWhen(function (s) { return s.joint; }) }
        ] },
      { title: "Security and breaches",
        items: [
          { id: 'p31', n: '31', t: 'many', q: "Which of these security measures are in place?", opts: [
            { v: 'encryption', l: "Encryption at rest and in transit" }, { v: 'mfa', l: "Multi-factor authentication" }, { v: 'rbac', l: "Role-based access" }, { v: 'backups', l: "Backups, tested" },
            { v: 'pseudo', l: "Pseudonymisation" }, { v: 'logging', l: "Access logging" }, { v: 'endpoint', l: "Endpoint protection" }, { v: 'offboarding', l: "Offboarding procedure (access removed when people leave)" },
            { v: 'none', l: "None of these yet", none: true }] },
          { id: 'p32', n: '32', t: 'one', inline: true, q: "Is there a breach response procedure, covering notification to the authority within 72 hours and a breach register?", opts: YPND },
          { id: 'p33', n: '33', q: "Any personal data breaches in the last 24 months?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YND }, { k: 'd', t: 'text', label: "If yes, what happened, and were they notified?" }] },
          { id: 'p34', n: '34', t: 'text', q: "Where is the data hosted (provider and region)?" }
        ] },
      { title: "Retention and minimisation",
        items: [
          { id: 'p35', n: '35', q: "Are retention periods defined, and is data actually deleted when they expire?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'how', t: 'one', inline: true, label: "Deletion", opts: [{ v: 'auto', l: "Automatic" }, { v: 'manual', l: "Manual" }, { v: 'none', l: "Not done yet" }] }] },
          { id: 'p36', n: '36', q: "Do you collect only the data you need, and what data is used in test or development environments?", fields: [
            { k: 'v', t: 'one', inline: true, label: "Only what we need", opts: YPND },
            { k: 'test', t: 'one', label: "Test and development environments", opts: [{ v: 'synthetic', l: "Anonymised or synthetic data" }, { v: 'real', l: "Real personal data" }, { v: 'na', l: "No such environments" }, { v: 'dk', l: "Don’t know" }] }] }
        ] },
      { title: "Higher-risk processing",
        items: [
          { id: 'p37', n: '37', t: 'many', q: "Do you do any of the following?", opts: [
            { v: 'specialscale', l: "Sensitive data at large scale" }, { v: 'publicmon', l: "Systematic monitoring of public areas (e.g. CCTV)" },
            { v: 'profiling', l: "Profiling with significant effects on people" }, { v: 'ai', l: "AI or other new technology applied to personal data" },
            { v: 'employees', l: "Monitoring of employees" }, { v: 'childrenscale', l: "Children’s data at scale" },
            { v: 'combining', l: "Combining datasets from different sources" }, { v: 'biometrics', l: "Biometrics" }, { v: 'location', l: "Location tracking" },
            { v: 'none', l: "None of these", none: true }] },
          { id: 'p38', n: '38', q: "Have you done a data protection impact assessment (DPIA)?", fields: [
            { k: 'v', t: 'one', inline: true, opts: YPND }, { k: 'd', t: 'text', label: "Prepared by, and when" }] },
          { id: 'p39', n: '39', q: "How are employees monitored?", show: gWhen(function (s) { return s.ro && s.monitoring; }), fields: [
            { k: 'how', t: 'many', opts: [{ v: 'email', l: "Email" }, { v: 'video', l: "Video" }, { v: 'gps', l: "GPS or location" }, { v: 'activity', l: "Computer activity tracking" }, { v: 'other', l: "Other" }] },
            { k: 'informed', t: 'one', inline: true, label: "Were employees informed in advance?", opts: YND },
            { k: 'consulted', t: 'one', inline: true, label: "Was the union or were employee representatives consulted?", opts: YND },
            { k: 'retention', t: 'one', inline: true, label: "Are recordings kept no longer than 30 days?", opts: YND }] },
          { id: 'p40', n: '40', t: 'one', inline: true, q: "Do you process national identification numbers (CNP) on the basis of legitimate interest?", opts: YND, show: gWhen(function (s) { return s.ro; }) },
          { id: 'p41', n: '41', q: "Do you use personal data to train or run AI, and do you collect demographic data?", fields: [
            { k: 'ai', t: 'one', inline: true, label: "Personal data used to train or run AI", opts: YND },
            { k: 'demo', t: 'one', inline: true, label: "Demographic data collected (e.g. gender, age, nationality)", opts: YND }] }
        ] },
      { title: "Documents",
        items: [
          { id: 'p42', n: '42', t: 'grid', q: "Which of these documents do you have?", opts: DOCS, note: "Link or note (optional)",
            intro: "Only the documents that fit your answers are listed.", rows: [
            { h: "Every company" },
            { id: 'e1', l: "Record of processing activities (RoPA)", ref: art('30') },
            { id: 'e2', l: "Privacy notice for customers and users", ref: art('13–14') },
            { id: 'e3', l: "Privacy notice for employees and candidates", ref: art('13') },
            { id: 'e4', l: "Internal data protection policy", ref: art('24') },
            { id: 'e5', l: "Retention schedule", ref: art('5(1)(e)') },
            { id: 'e6', l: "Procedure for data subject requests", ref: art('12–22') },
            { id: 'e7', l: "Breach response procedure and breach register", ref: art('33(5)') },
            { id: 'e8', l: "Information security policy or description of security measures", ref: art('32') },
            { id: 'e9', l: "Vendor list with signed DPAs", ref: art('28') },
            { id: 'e10', l: "Staff training records", ref: art('39') },
            { id: 'e11', l: "Cookie policy and consent records", ref: "ePrivacy" },
            { h: "Depending on your answers" },
            { id: 'e12', l: "Legitimate interest assessments (LIA)", ref: art('6(1)(f)'), show: gWhen(function (s) { return s.li; }) },
            { id: 'e13', l: "Consent records", ref: art('7(1)'), show: gWhen(function (s) { return s.consent; }) },
            { id: 'e14', l: "Data protection impact assessment (DPIA)", ref: art('35'), show: gWhen(function (s) { return s.triggers.length > 0; }) },
            { id: 'e15', l: "DPO appointment and notification to the authority", ref: art('37(7)'), show: gWhen(function (s) { return s.dpo; }) },
            { id: 'e16', l: "Transfer mechanism (e.g. standard contractual clauses)", ref: art('46'), show: gWhen(function (s) { return s.transfers; }) },
            { id: 'e17', l: "Transfer impact assessment (TIA)", ref: art('46'), show: gWhen(function (s) { return s.transfers; }) },
            { id: 'e18', l: "DPA template for your clients and sub-processor list", ref: art('28'), show: gWhen(function (s) { return s.processor; }) },
            { id: 'e19', l: "Joint controller arrangement", ref: art('26'), show: gWhen(function (s) { return s.joint; }) },
            { id: 'e20', l: "Appointment of a representative in the EU", ref: art('27'), show: gWhen(function (s) { return s.nonEU; }) },
            { id: 'e21', l: "Parental consent mechanism", ref: art('8'), show: gWhen(function (s) { return s.children; }) },
            { id: 'e22', l: "Safeguards for automated decisions (human review, right to contest)", ref: art('22'), show: gWhen(function (s) { return s.automated; }) },
            { id: 'e23', l: "Employee monitoring policy and record of consulting employees or their representatives", ref: "Law 190/2018, art. 5", show: gWhen(function (s) { return s.ro && s.monitoring; }) }] },
          { id: 'p43', n: '43', t: 'area', q: "Which of these documents can you share now? Paste links or list them." }
        ] },
      { title: "Send", intro: "Who should we follow up with?", final: true,
        items: CONTACT.concat([{ id: 'notes', n: '', t: 'area', q: "Anything else we should know?" }]) }
    ]
  };

  /* For our email only (never shown to the visitor): role, DPO, DPIA, transfers and document gaps. */
  gdpr.summary = function (a) {
    var s = gScope(a), facts = [], cs = acts(a);
    var lbl = function (id, v) { var q = findIn(gdpr, id); return q ? label(q.opts, v) : v; };
    var card = findIn(gdpr, 'p0'), fopt = function (k, v) { var f = card.fields.filter(function (x) { return x.k === k; })[0]; return label(f.opts, v); };
    var roles = [];
    if (s.processor) roles.push('processor');
    if (a.p9 !== 'processor' || cs.some(function (c) { return c.role === 'controller'; })) roles.unshift('controller');
    if (s.joint) roles.push('joint controller');
    facts.push(['Role', roles.join(', ')]);
    facts.push(['Processing activities', String(cs.filter(function (c) { return c.name || c.role || c.basis; }).length)]);
    if (s.special.length) facts.push(['Sensitive data', s.special.map(function (v) { return fopt('special', v); }).join(', ')]);
    if (s.children) facts.push(['Children', 'Yes']);
    facts.push(['DPO', a['p13.v'] === 'yes' ? 'Appointed' : s.dpoLikely ? 'Likely mandatory, not appointed' : 'Not appointed (check whether needed)']);
    if (s.triggers.length || s.special.length) facts.push(['DPIA', 'Likely required (' + (s.triggers.map(function (v) { return lbl('p37', v); }).join(', ') || 'sensitive data') + '); done: ' + (a['p38.v'] ? label(YPND, a['p38.v']) : 'not answered')]);
    var dest = cs.filter(function (c) { return c.eea === 'yes' || c.eea === 'dk'; }).map(function (c) { return c.where || (c.name || '') + (c.eea === 'dk' ? ' (unsure)' : ''); }).filter(Boolean).join('; ');
    if (s.transfers) facts.push(['Transfers outside the EEA', (a['p29.where'] || dest || 'yes') + '; TIA: ' + (a['p29.tia'] ? label(YPND, a['p29.tia']) : 'not answered')]);
    if (a['p33.v'] === 'yes') facts.push(['Breaches in the last 24 months', 'Yes']);
    if (s.ro && s.monitoring) facts.push(['Romania', 'Employee monitoring: check Law 190/2018, art. 5']);
    if (a['p41.ai'] === 'yes') facts.push(['AI', 'Personal data used for AI: send the AI Act questionnaire too']);
    var grid = findIn(gdpr, 'p42'), group = '', counts = {};
    grid.rows.forEach(function (r) {
      if (r.h) { group = r.h; return; }
      if (!visible(r, a)) return;
      var c = counts[group] || (counts[group] = { yes: 0, partly: 0, gap: 0, total: 0 });
      c.total++;
      if (a[r.id] === 'yes') c.yes++; else if (a[r.id] === 'partly') c.partly++; else c.gap++;
    });
    for (var g in counts) {
      var c = counts[g];
      facts.push(['Documents: ' + g, c.yes + ' in place · ' + c.partly + ' partly · ' + c.gap + ' missing or unknown (' + c.total + ')']);
    }
    return { likely: [], unlikely: [], roles: [], facts: facts };
  };

  /* ================================================================ CYBER SCOPING */
  /* Sent to prospects for security testing (scoping-cyber.html): the partners' C1–C41, split
     into steps along their own section headings. */
  function cyberSteps() {
    var plan = [["System overview", 2], ["Models and prompts", 3], ["Tools and memory", 2], ["Access and guardrails", 2], ["Testing scope", 2]];
    var out = [], i = 0;
    plan.forEach(function (p, ix) {
      var items = [], heads = 0;
      while (i < CYBER.length && !(CYBER[i].h && heads === p[1])) {
        if (CYBER[i].h) heads++;
        items.push(CYBER[i]); i++;
      }
      out.push({ title: p[0], intro: ix === 0 ? "To be answered by your engineering or security team. These are the questions we use to scope a penetration test or an AI red-teaming engagement." : '', items: items });
    });
    return out;
  }

  var cyber = {
    id: 'cyber',
    submit: "Send my answers →",
    thanksTitle: "Thank you. Your answers have been sent.",
    thanks: "We’ll review them and come back to you with our proposal. You can print or save a copy of your answers below.",
    dataNote: "We use your answers only to scope your project and prepare our proposal. See our",
    summary: function () { return { likely: [], unlikely: [], roles: [], facts: [] }; },
    steps: [{ title: "About you", intro: "A few questions about your company. They are the same in all our scoping questionnaires.", items: ABOUT }]
      .concat(cyberSteps())
      .concat([{ title: "Send", intro: "Who should we follow up with?", final: true,
        items: CONTACT.concat([{ id: 'notes', n: '', t: 'area', q: "Anything else we should know?" }]) }])
  };

  var TOOLS = { quick: quick, discovery: discovery, aiact: aiact, gdpr: gdpr, cyber: cyber };

  /* ------------------------------------------------------------------ engine */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function visible(item, a) { return !item.show || item.show(a); }
  function fieldsOf(q) { return q.fields || [{ k: '', t: q.t, opts: q.opts, label: q.label, inline: q.inline }]; }
  function key(q, f) { return f.k ? q.id + '.' + f.k : q.id; }
  function filled(v) { return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ''; }
  function label(opts, v) { for (var i = 0; i < opts.length; i++) if (opts[i].v === v) return opts[i].l; return v; }
  function show(f, v) {
    if (!filled(v)) return '';
    if (f.opts) return Array.isArray(v) ? v.map(function (x) { return label(f.opts, x); }).join('; ') : label(f.opts, v);
    return String(v).trim();
  }

  function b64encode(obj) {
    var s = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }

  function store() {
    try { var ls = window.localStorage; ls.setItem('__q', '1'); ls.removeItem('__q'); return ls; } catch (e) { return null; }
  }

  function mount(el) {
    var tool = TOOLS[el.getAttribute('data-quote')];
    if (!tool) return;
    var lang = document.documentElement.lang || 'en';
    var KEY = 'senecai-quote-' + tool.id + '-' + lang;
    var ls = store();
    var A = {}, stepIx = 0, errors = false, done = null, resumed = false;
    var started = Date.now();

    try {
      var saved = ls && JSON.parse(ls.getItem(KEY) || 'null');
      if (saved && saved.a) { A = saved.a; stepIx = saved.s || 0; resumed = Object.keys(A).length > 0; }
    } catch (e) { /* ignore */ }
    var pm = /[?&]p=([^&#]+)/.exec(location.search);
    if (pm) {
      try { var pre = b64decode(pm[1]); for (var k in pre) if (!filled(A[k])) A[k] = pre[k]; } catch (e) { /* bad link */ }
    }

    function save() {
      if (!ls) return;
      try { ls.setItem(KEY, JSON.stringify({ a: A, s: stepIx })); } catch (e) { /* full or blocked */ }
    }
    function steps() { return tool.steps.filter(function (s) { return visible(s, A); }); }

    function optHtml(q, f, o, multi) {
      var k = key(q, f), v = A[k];
      var onNow = multi ? Array.isArray(v) && v.indexOf(o.v) !== -1 : v === o.v;
      return '<button type="button" class="q-opt' + (onNow ? ' is-on' : '') + (o.none ? ' q-none' : '') + '"' +
        ' role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + onNow + '"' +
        ' data-k="' + esc(k) + '" data-v="' + esc(o.v) + '" data-multi="' + (multi ? 1 : 0) + '"' + (o.none ? ' data-none="1"' : '') + '>' +
        (multi ? '<span class="q-box" aria-hidden="true"></span>' : '') + '<span>' + esc(o.l) + '</span></button>';
    }

    function fieldHtml(q, f, req) {
      var k = key(q, f), v = A[k], h = '';
      if (f.label) h += '<div class="q-sub">' + esc(f.label) + '</div>';
      if (f.t === 'one' || f.t === 'many') {
        var multi = f.t === 'many';
        h += (multi ? '<div class="q-hint">' + esc(UI.selectAll) + '</div>' : '') +
          '<div class="q-opts' + (f.inline ? ' q-inline' : f.opts.length > 8 ? ' q-cols' : '') + '" role="' + (multi ? 'group' : 'radiogroup') + '">' +
          f.opts.map(function (o) { return optHtml(q, f, o, multi); }).join('') + '</div>';
      } else if (f.t === 'area') {
        h += '<textarea class="q-input" rows="3" data-k="' + esc(k) + '"' + (req ? ' aria-required="true"' : '') + '>' + esc(v || '') + '</textarea>';
      } else {
        h += '<input class="q-input" type="' + (f.t === 'email' ? 'email' : 'text') + '" data-k="' + esc(k) + '" value="' + esc(v || '') + '"' +
          (q.ac ? ' autocomplete="' + q.ac + '"' : '') + (req ? ' aria-required="true"' : '') + '>';
      }
      return h;
    }

    function missing(q) {
      if (!q.req) return false;
      return fieldsOf(q).some(function (f) { return !filled(A[key(q, f)]); });
    }

    function refHtml(x) { return x.ref ? ' <span class="q-ref">' + esc(x.ref) + '</span>' : ''; }
    function count(q) { return Math.min(q.max, Math.max(1, Number(A[q.id + '.n']) || 1)); }
    /* Grid rows that apply: a heading hides its whole group, and a heading with no visible row is dropped. */
    function gridRows(q) {
      var out = [], head = null, on = true;
      q.rows.forEach(function (r) {
        if (r.h) { head = r; on = visible(r, A); return; }
        if (!on || !visible(r, A)) return;
        if (head) { out.push(head); head = null; }
        out.push(r);
      });
      return out;
    }

    function qHtml(q) {
      if (q.h) return '<h3 class="q-group">' + esc(q.h) + '</h3>';
      if (q.t === 'grid') {
        var rows = gridRows(q), gopts = q.opts || YPND;
        return '<div class="q q-grid"><div class="q-text">' + (q.n ? '<span class="q-n">' + esc(q.n) + '</span>' : '') + esc(q.q) + refHtml(q) + '</div>' +
          (q.intro ? '<div class="q-help">' + esc(q.intro) + '</div>' : '') +
          rows.map(function (r) {
            if (r.h) return '<div class="q-row-h">' + esc(r.h) + '</div>';
            return '<div class="q-row"><div class="q-row-l">' + esc(r.l) + refHtml(r) + (r.d ? '<span class="q-row-d">' + esc(r.d) + '</span>' : '') + '</div>' +
              '<div class="q-opts q-inline" role="radiogroup" aria-label="' + esc(r.l) + '">' +
              gopts.map(function (o) { return optHtml({ id: r.id }, { k: '' }, o, false); }).join('') + '</div>' +
              (q.note && filled(A[r.id]) ? '<input class="q-input q-row-note" type="text" data-k="' + esc(r.id + '.note') + '" value="' + esc(A[r.id + '.note'] || '') + '" placeholder="' + esc(q.note) + '" aria-label="' + esc(q.note) + '">' : '') +
              '</div>';
          }).join('') + '</div>';
      }
      if (q.t === 'repeat') {
        var n = count(q), h = '';
        for (var i = 1; i <= n; i++) {
          h += '<div class="q-card"><div class="q-card-h"><span>' + esc(q.item) + ' ' + i + '</span>' +
            (n > 1 ? '<button type="button" class="q-link" data-remove="' + esc(q.id) + '" data-i="' + i + '">' + esc(q.remove) + '</button>' : '') + '</div>' +
            q.fields.map(function (f) { return fieldHtml({ id: q.id + '.' + i }, f, false); }).join('') + '</div>';
        }
        if (n < q.max) h += '<button type="button" class="q-btn q-ghost q-add" data-add="' + esc(q.id) + '">' + esc(q.add) + '</button>';
        return '<div class="q q-repeat">' + h + '</div>';
      }
      var bad = errors && missing(q);
      return '<div class="q' + (bad ? ' is-missing' : '') + '" data-q="' + esc(q.id) + '">' +
        '<div class="q-text">' + (q.n ? '<span class="q-n">' + esc(q.n) + '</span>' : '') + esc(q.q) +
        (q.req ? ' <span class="q-req" aria-hidden="true">*</span>' : '') +
        (q.opt ? ' <span class="q-optional">(' + esc(UI.optional) + ')</span>' : '') + refHtml(q) + '</div>' +
        (q.hint ? '<div class="q-help">' + esc(q.hint) + '</div>' : '') +
        fieldsOf(q).map(function (f) { return fieldHtml(q, f, q.req); }).join('') + '</div>';
    }

    function render(focusKey) {
      var list = steps();
      if (stepIx >= list.length) stepIx = list.length - 1;
      if (done) { renderDone(); return; }
      var st = list[stepIx];
      var pct = Math.round(stepIx / (list.length - 1 || 1) * 100);
      var h = '<div class="q-steps" aria-hidden="true">' + list.map(function (s, i) {
        return '<span class="q-step' + (i < stepIx ? ' is-done' : i === stepIx ? ' is-current' : '') + '">' + esc(s.title) + '</span>';
      }).join('') + '</div><div class="q-bar"><span style="width:' + pct + '%"></span></div>';
      if (resumed && stepIx === 0) h += '<p class="q-note">' + esc(UI.resumed) + ' <button type="button" class="q-link" data-restart>' + esc(UI.restart) + '</button></p>';
      h += '<div class="q-eyebrow">' + esc(UI.step) + ' ' + (stepIx + 1) + ' ' + esc(UI.of) + ' ' + list.length + '</div>' +
        '<h2 class="q-title" tabindex="-1">' + esc(st.title) + '</h2>' +
        (st.intro ? '<p class="q-intro">' + esc(st.intro) + '</p>' : '');
      h += st.items.filter(function (q) { return visible(q, A); }).map(qHtml).join('');
      if (st.final) {
        h += '<input class="q-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" data-hp>' +
          '<p class="q-note">' + esc(tool.dataNote || UI.dataNote) + ' <a href="privacy-policy.html">' + esc(UI.privacy) + '</a>.</p>';
      }
      if (errors) h += '<p class="q-error" role="alert">' + esc(errors === 'send' ? UI.sendError : UI.missing) + '</p>';
      h += '<div class="q-nav">' + (stepIx > 0 ? '<button type="button" class="q-btn q-ghost" data-back>' + esc(UI.back) + '</button>' : '') +
        '<button type="button" class="q-btn q-primary" data-next>' + esc(st.final ? (tool.submit || (tool.id === 'quick' ? UI.submitQuick : UI.submitDiscovery)) : UI.next) + '</button></div>';
      el.innerHTML = h;
      if (focusKey) {
        var f = el.querySelector(focusKey);
        if (f) f.focus({ preventScroll: true });
      }
    }

    /* Human-readable answers, in the visitor's language, for the email and the printout. */
    function collect() {
      var out = [];
      steps().forEach(function (st) {
        st.items.forEach(function (q) {
          if (q.h || !visible(q, A)) return;
          if (q.t === 'grid') {
            gridRows(q).forEach(function (r) {
              if (r.h || !filled(A[r.id])) return;
              var note = String(A[r.id + '.note'] || '').trim();
              out.push({ s: st.title, n: '', q: r.l, a: label(q.opts || YPND, A[r.id]) + (note ? ' · ' + note : '') });
            });
            return;
          }
          if (q.t === 'repeat') {
            for (var i = 1; i <= count(q); i++) {
              var lines = q.fields.map(function (f) {
                var v = f.k === 'name' ? '' : show(f, A[q.id + '.' + i + '.' + f.k]);
                return v ? f.label.replace(/ \(.*\)$/, '') + ': ' + v : '';
              }).filter(Boolean);
              var name = String(A[q.id + '.' + i + '.name'] || '').trim();
              if (lines.length) out.push({ s: st.title, n: '', q: q.item + ' ' + i + (name ? ': ' + name : ''), a: lines.join('\n') });
            }
            return;
          }
          var parts = fieldsOf(q).map(function (f) {
            var v = show(f, A[key(q, f)]);
            return v && f.label ? f.label + ': ' + v : v;
          }).filter(Boolean);
          if (parts.length) out.push({ s: st.title, n: q.n || '', q: q.q, a: parts.join(' · ') });
        });
      });
      return out;
    }

    function summary() {
      if (tool.summary) return tool.summary(A);
      var s = scope(A), likely = [], unlikely = [];
      if (s.ai) likely.push(REG.aiact);
      if (s.gdpr) likely.push(REG.gdpr);
      if (s.nis2) likely.push(REG.nis2);
      if (s.doraEntity) likely.push(REG.dora);
      else if (s.doraIct) likely.push(REG.dora + ' (' + UI.viaClients + ')');
      if (s.cra) likely.push(REG.cra);
      if (s.iso27) likely.push(REG.iso27);
      if (s.iso42) likely.push(REG.iso42);
      var map = { aiact: s.ai, gdpr: s.gdpr, nis2: s.nis2, dora: s.dora, cra: s.cra };
      for (var k in map) if (has(A, 'q9', k) && !map[k]) unlikely.push(REG[k]);
      return { likely: likely, unlikely: unlikely, roles: roles(A) };
    }

    function profileLink() {
      if (!tool.profile) return '';
      var p = {};
      tool.profile.forEach(function (id) {
        Object.keys(A).forEach(function (k) { if ((k === id || k.indexOf(id + '.') === 0) && filled(A[k])) p[k] = A[k]; });
      });
      return (lang === 'ro' ? '/ro/discovery?p=' : '/discovery?p=') + b64encode(p);
    }

    function submit(btn) {
      var hp = el.querySelector('[data-hp]');
      var payload = {
        tool: tool.id, lang: lang, t: started, website: hp ? hp.value : '',
        company: A.q1 || A.g1 || '', name: A.name || '', email: A.email || '',
        items: collect(), summary: summary(), prefill: profileLink()
      };
      btn.disabled = true;
      btn.textContent = UI.sending;
      fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) {
            done = { items: payload.items, summary: payload.summary };
            errors = false;
            if (ls) try { ls.removeItem(KEY); } catch (e) { /* ignore */ }
            render();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else { errors = 'send'; render(); }
        })
        .catch(function () { errors = 'send'; render(); });
    }

    function renderDone() {
      var sm = done.summary, quickTool = tool.id === 'quick';
      var h = '<div class="q-done"><h2 class="q-title" tabindex="-1">' + esc(tool.thanksTitle || (quickTool ? UI.thanksQuickTitle : UI.thanksDiscoveryTitle)) + '</h2>' +
        '<p class="q-intro">' + esc(tool.thanks || (quickTool ? UI.thanksQuick : UI.thanksDiscovery)) +
        (quickTool ? ' <a class="q-link" href="https://calendly.com/senecai-consulting/30min" target="_blank" rel="noopener">' + esc(UI.bookCall) + '</a>' : '') + '</p>';
      if (quickTool && sm.likely.length) h += '<div class="q-result"><div class="q-sub">' + esc(UI.likely) + '</div><ul>' + sm.likely.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      if (quickTool && sm.unlikely.length) h += '<div class="q-result q-result-no"><div class="q-sub">' + esc(UI.unlikely) + '</div><ul>' + sm.unlikely.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p>' + esc(UI.unlikelyNote) + '</p></div>';
      h += '<details class="q-recap"' + (quickTool ? '' : ' open') + '><summary>' + esc(UI.yourAnswers) + '</summary><dl>';
      var last = '';
      done.items.forEach(function (it) {
        if (it.s !== last) { h += '<dt class="q-recap-s">' + esc(it.s) + '</dt>'; last = it.s; }
        h += '<dt>' + (it.n ? esc(it.n) + ' ' : '') + esc(it.q) + '</dt><dd>' + esc(it.a) + '</dd>';
      });
      h += '</dl></details><div class="q-nav"><button type="button" class="q-btn q-ghost" data-print>' + esc(UI.print) + '</button></div></div>';
      el.innerHTML = h;
      var t = el.querySelector('.q-title'); if (t) t.focus();
    }

    el.addEventListener('click', function (e) {
      var o = e.target.closest('.q-opt');
      if (o) {
        var k = o.getAttribute('data-k'), v = o.getAttribute('data-v');
        if (o.getAttribute('data-multi') === '1') {
          var cur = Array.isArray(A[k]) ? A[k].slice() : [];
          var i = cur.indexOf(v);
          if (i !== -1) cur.splice(i, 1);
          else if (o.hasAttribute('data-none')) cur = [v];
          else {
            cur = cur.filter(function (x) { var b = el.querySelector('.q-opt[data-k="' + k + '"][data-v="' + x + '"]'); return !(b && b.hasAttribute('data-none')); });
            cur.push(v);
          }
          A[k] = cur;
        } else A[k] = v;
        save();
        render('.q-opt[data-k="' + k + '"][data-v="' + v + '"]');
        return;
      }
      var add = e.target.closest('[data-add]');
      if (add) {
        var rid = add.getAttribute('data-add');
        A[rid + '.n'] = (Number(A[rid + '.n']) || 1) + 1;
        save(); render();
        var cs = el.querySelectorAll('.q-card');
        if (cs.length) { var last = cs[cs.length - 1]; last.scrollIntoView({ behavior: 'smooth', block: 'start' }); var inp = last.querySelector('.q-input'); if (inp) inp.focus({ preventScroll: true }); }
        return;
      }
      var rm = e.target.closest('[data-remove]');
      if (rm) {
        var qid = rm.getAttribute('data-remove'), at = Number(rm.getAttribute('data-i')), n = Number(A[qid + '.n']) || 1;
        var pre = qid + '.', moved = {};
        Object.keys(A).forEach(function (k) {
          var m = k.indexOf(pre) === 0 && /^(\d+)\.(.+)$/.exec(k.slice(pre.length));
          if (!m) { moved[k] = A[k]; return; }
          var i = Number(m[1]);
          if (i < at) moved[k] = A[k];
          else if (i > at) moved[pre + (i - 1) + '.' + m[2]] = A[k];
        });
        moved[qid + '.n'] = n - 1;
        A = moved; save(); render();
        return;
      }
      if (e.target.closest('[data-next]')) {
        var st = steps()[stepIx];
        var bad = st.items.some(function (q) { return !q.h && visible(q, A) && missing(q); });
        if (!bad && st.final && A.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(A.email).trim())) bad = true;
        if (bad) {
          errors = true; render();
          var first = el.querySelector('.is-missing .q-input, .is-missing .q-opt') || el.querySelector('.q-error');
          if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          return;
        }
        errors = false;
        if (st.final) { submit(e.target.closest('[data-next]')); return; }
        stepIx++; save(); render('.q-title');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (e.target.closest('[data-back]')) {
        errors = false; stepIx = Math.max(0, stepIx - 1); save(); render('.q-title');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (e.target.closest('[data-restart]')) {
        A = {}; stepIx = 0; resumed = false; errors = false;
        if (ls) try { ls.removeItem(KEY); } catch (e2) { /* ignore */ }
        render('.q-title');
        return;
      }
      if (e.target.closest('[data-print]')) window.print();
    });

    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-k');
      if (!k) return;
      A[k] = e.target.value;
      save();
    });

    render();
  }

  function init() { [].forEach.call(document.querySelectorAll('[data-quote]'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

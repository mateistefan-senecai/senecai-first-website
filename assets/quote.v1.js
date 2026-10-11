/* SenecAI quote questionnaires.
 *
 *   quick     : Tier 1, the public "Get a quote in 24 hours" form (get-a-quote.html)
 *   discovery : Tier 2, the detailed discovery brief sent to interested clients (discovery.html)
 *
 * Each questionnaire is plain data: steps holding questions, each question with an optional
 * show(answers) condition. Scope checks for NIS2, DORA and CRA run first; their targeted
 * questions appear only when the company is likely in scope. On submit the answers are
 * posted to /api/quote, which emails them to SenecAI; nothing is stored on the server.
 * Progress is kept in the visitor's own browser (localStorage) until they submit.
 *
 * Code strings use single quotes; every double-quoted string is visitor-facing text, which
 * tools/i18n/build_ro.py translates into assets/quote.ro.v1.js. The file name is versioned
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
    sendError: "Your answers could not be sent. Please try again, or email them to matei.stefan@senecai.eu.",
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
    viaClients: "through your financial clients’ contracts"
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
    q17: { id: 'q17', n: 'Q17', t: 'one', inline: true, req: true, q: "How many AI systems or features should the quote cover?",
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
        items: on(cyberOn, [
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
          { id: 'C15', n: 'C15', t: 'area', q: "What data sources feed the RAG pipeline (internal documents, customer documents, database records, web search, third-party APIs, uploaded files, other)?" },
          { id: 'C16', n: 'C16', t: 'text', q: "What vector DB / retrieval system is used (e.g. Pinecone, Weaviate, Chroma, Elasticsearch, PGVector, other)?" },
          { id: 'C17', n: 'C17', t: 'many', q: "How is ingestion performed (manual upload, automated sync, API ingestion, user uploads)?", opts: [{ v: 'manual', l: "Manual upload" }, { v: 'sync', l: "Automated sync" }, { v: 'api', l: "API ingestion" }, { v: 'user', l: "User uploads" }] },
          { h: "Agent / tool / plugin capabilities" },
          yn('C18', 'C18', "Does the model invoke tools/functions?", false, YNU),
          { id: 'C19', n: 'C19', t: 'area', q: "List all available tools/functions/plugins. For each: name, purpose, required permissions, and side effects (read/write/delete/send)." },
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
        ]) },
      { title: "Send", intro: "Who should we follow up with?", final: true,
        items: CONTACT.concat([{ id: 'notes', n: '', t: 'area', q: "Anything else we should know?" }]) }
    ]
  };

  var TOOLS = { quick: quick, discovery: discovery };

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

    function qHtml(q) {
      if (q.h) return '<h3 class="q-group">' + esc(q.h) + '</h3>';
      if (q.t === 'grid') {
        var rows = q.rows.filter(function (r) { return visible(r, A); });
        return '<div class="q q-grid"><div class="q-text">' + esc(q.q) + '</div>' +
          rows.map(function (r) {
            return '<div class="q-row"><div class="q-row-l">' + esc(r.l) + '</div><div class="q-opts q-inline" role="radiogroup" aria-label="' + esc(r.l) + '">' +
              YPND.map(function (o) { return optHtml({ id: r.id }, { k: '' }, o, false); }).join('') + '</div></div>';
          }).join('') + '</div>';
      }
      var bad = errors && missing(q);
      return '<div class="q' + (bad ? ' is-missing' : '') + '" data-q="' + esc(q.id) + '">' +
        '<div class="q-text">' + (q.n ? '<span class="q-n">' + esc(q.n) + '</span>' : '') + esc(q.q) +
        (q.req ? ' <span class="q-req" aria-hidden="true">*</span>' : '') +
        (q.opt ? ' <span class="q-optional">(' + esc(UI.optional) + ')</span>' : '') + '</div>' +
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
          '<p class="q-note">' + esc(UI.dataNote) + ' <a href="privacy-policy.html">' + esc(UI.privacy) + '</a>.</p>';
      }
      if (errors) h += '<p class="q-error" role="alert">' + esc(errors === 'send' ? UI.sendError : UI.missing) + '</p>';
      h += '<div class="q-nav">' + (stepIx > 0 ? '<button type="button" class="q-btn q-ghost" data-back>' + esc(UI.back) + '</button>' : '') +
        '<button type="button" class="q-btn q-primary" data-next>' + esc(st.final ? (tool.id === 'quick' ? UI.submitQuick : UI.submitDiscovery) : UI.next) + '</button></div>';
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
            q.rows.forEach(function (r) {
              if (visible(r, A) && filled(A[r.id])) out.push({ s: st.title, n: '', q: r.l, a: label(YPND, A[r.id]) });
            });
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
        company: A.q1 || '', name: A.name || '', email: A.email || '',
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
      var h = '<div class="q-done"><h2 class="q-title" tabindex="-1">' + esc(quickTool ? UI.thanksQuickTitle : UI.thanksDiscoveryTitle) + '</h2>' +
        '<p class="q-intro">' + esc(quickTool ? UI.thanksQuick : UI.thanksDiscovery) +
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

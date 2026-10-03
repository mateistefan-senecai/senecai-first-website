/* SenecAI compliance checkers: three rules-based decision trees.
 *
 *   general : which of the AI Act, GDPR, NIS2, DORA and CRA apply
 *   aiact   : AI Act risk classification and provider / deployer role
 *   nis2    : NIS2 scope and essential / important classification
 *
 * Each tool is plain data: a start node, nodes with options and a next(answers) function,
 * and an evaluate(answers) function that turns the answers into results with a rule
 * trace (every result line cites the article it rests on). No answer leaves the browser.
 *
 * The file name is versioned because /assets/* is cached as immutable: rename it (v3, …)
 * whenever it changes, and update the <script> tag in research.html.
 *
 * Legal position as of October 2026: AI Act as amended by Regulation (EU) 2026/1744
 * (Digital Omnibus on AI, in force 27 July 2026); NIS2 as adopted (the January 2026
 * targeted amendment proposal is flagged as pending only); DORA; CRA; GDPR.
 */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ helpers */
  function val(a, id) { return a[id]; }
  function is(a, id, v) { return a[id] === v; }
  function picked(a, id, v) { var x = a[id]; return Array.isArray(x) && x.indexOf(v) !== -1; }
  function anyPicked(a, id) { var x = a[id]; return Array.isArray(x) && x.length > 0 && x.indexOf("none") === -1; }
  function pickedAny(a, id, vs) { for (var i = 0; i < vs.length; i++) if (picked(a, id, vs[i])) return true; return false; }
  function r(text, ref) { return { text: text, ref: ref || "" }; }

  var NONE = { v: "none", l: "None of these", none: true };

  /* =================================================================== TOOL 1
   * General applicability: AI Act · GDPR · NIS2 · DORA · CRA
   * ========================================================================= */
  var general = {
    id: "general",
    title: "Which EU digital regulations apply to you?",
    short: "General compliance check",
    intro: "Answer a few questions about your organisation and we’ll map which of the EU AI Act, GDPR, NIS2, DORA and the Cyber Resilience Act apply, and why.",
    sections: ["Your organisation", "GDPR", "AI Act", "NIS2", "DORA", "CRA"],
    start: "est",
    nodes: {
      est: {
        section: "Your organisation",
        q: "Where is your organisation established?",
        help: "“Established” means you carry out a real and effective activity through stable arrangements, such as a registered office, a branch or a subsidiary. Choose the option that best describes the entity you are assessing.",
        options: [
          { v: "eu", l: "In the EU or EEA" },
          { v: "non", l: "Outside the EU, but we sell to, serve or monitor people or businesses in the EU" },
          { v: "none", l: "Outside the EU, with no EU customers, users or market" }
        ],
        next: function (a) { return is(a, "est", "none") ? null : "g_pd"; }
      },

      /* ---- GDPR ---- */
      g_pd: {
        section: "GDPR",
        q: "Do you process personal data?",
        help: "Personal data is any information relating to an identified or identifiable person: names, e-mail addresses, employee records, customer contacts, IP addresses, cookie identifiers, location data. “Processing” covers almost anything: collecting, storing, hosting, analysing, sharing or deleting. Almost every organisation with staff or customers processes personal data.",
        ref: "Art. 4(1)–(2) GDPR",
        options: [
          { v: "yes", l: "Yes" },
          { v: "unsure", l: "Not sure" },
          { v: "no", l: "No, we hold no information about identifiable individuals, not even staff or customer contacts" }
        ],
        next: function (a) { return is(a, "g_pd", "no") ? "ai_sys" : "g_excl"; }
      },
      g_excl: {
        section: "GDPR",
        multi: true,
        q: "Does one of these describe all of your processing?",
        help: "These are the material-scope exclusions of the GDPR. They only take you out of the GDPR if they cover all of your processing; for example, a police authority still applies the GDPR to its HR data.",
        ref: "Art. 2(2)–(3) GDPR",
        options: [
          { v: "household", l: "Purely personal or household activity by an individual" },
          { v: "lawenf", l: "Processing by a competent authority to prevent, investigate or prosecute criminal offences", d: "Covered by the Law Enforcement Directive (EU) 2016/680 instead" },
          { v: "euinst", l: "Processing by an EU institution, body, office or agency", d: "Covered by Regulation (EU) 2018/1725 instead" },
          { v: "outside", l: "Activities outside the scope of Union law, such as national security" },
          NONE
        ],
        next: function (a) {
          if (anyPicked(a, "g_excl")) return "ai_sys";
          return is(a, "est", "non") ? "g_terr" : "g_role";
        }
      },
      g_terr: {
        section: "GDPR",
        multi: true,
        q: "How do you deal with people in the EU?",
        help: "A non-EU organisation is directly subject to the GDPR when it targets people in the EU with goods or services (EU languages, euro pricing, EU delivery), or monitors their behaviour in the EU (tracking, profiling, behavioural advertising).",
        ref: "Art. 3(2) GDPR · EDPB Guidelines 3/2018",
        options: [
          { v: "offer", l: "We offer goods or services to individuals in the EU, paid or free" },
          { v: "monitor", l: "We monitor the behaviour of individuals in the EU" },
          { v: "processor", l: "We only process personal data on behalf of EU-based business clients" },
          NONE
        ],
        next: function (a) { return pickedAny(a, "g_terr", ["offer", "monitor"]) ? "g_role" : "ai_sys"; }
      },
      g_role: {
        section: "GDPR",
        q: "What is your role for the personal data you process?",
        help: "A controller decides why and how personal data is processed. A processor processes it on behalf of a controller, following its documented instructions. Most companies are controllers for their own staff and customer data, and may also be processors for client data they host.",
        ref: "Art. 4(7)–(8), 24, 28 GDPR",
        options: [
          { v: "controller", l: "Controller: we decide why and how the data is processed" },
          { v: "processor", l: "Processor: we only process data on our clients’ behalf and instructions" },
          { v: "both", l: "Both: controller for our own data, processor for client data" }
        ],
        next: function () { return "g_dpo"; }
      },
      g_dpo: {
        section: "GDPR",
        multi: true,
        q: "Do any of these apply to you?",
        help: "These are the situations in which a Data Protection Officer is mandatory. “Core activities” means your main business, not ancillary functions such as payroll or IT support.",
        ref: "Art. 37(1) GDPR",
        options: [
          { v: "public", l: "We are a public authority or body" },
          { v: "monitor", l: "Our core activities involve regular and systematic monitoring of individuals on a large scale", d: "e.g. tracking and profiling, behavioural advertising, location tracking, connected devices" },
          { v: "special", l: "Our core activities involve large-scale processing of special-category or criminal-offence data", d: "health, genetic or biometric data, ethnicity, religion, political opinions, sexual orientation, trade-union membership" },
          NONE
        ],
        next: function () { return "ai_sys"; }
      },

      /* ---- AI Act ---- */
      ai_sys: {
        section: "AI Act",
        q: "Do you develop, use, integrate or resell AI?",
        help: "An AI system is a machine-based system that, with some autonomy, infers from its input how to generate outputs such as predictions, content, recommendations or decisions (machine learning, LLMs, computer vision, knowledge-based reasoning). Using third-party AI tools at work, such as ChatGPT, Copilot or AI recruitment software, counts: that makes you a deployer. Software that only executes rules written by people, or performs basic data processing, is not an AI system.",
        ref: "Art. 3(1) AI Act · Commission Guidelines on the AI system definition (2025)",
        options: [
          { v: "yes", l: "Yes: we build, buy, use or resell AI systems" },
          { v: "unsure", l: "Not sure" },
          { v: "no", l: "No: only conventional, rule-based software" }
        ],
        next: function (a) { return is(a, "ai_sys", "no") ? "nis_sector" : "ai_excl"; }
      },
      ai_excl: {
        section: "AI Act",
        multi: true,
        q: "Is all of your AI activity covered by one of these exclusions?",
        help: "These exclusions apply only if they cover the AI activity as a whole. A free and open-source licence is not an exclusion for prohibited, high-risk or transparency-relevant AI, so it is not listed here.",
        ref: "Art. 2(3), (6), (8), (10) AI Act",
        options: [
          { v: "military", l: "Exclusively for military, defence or national-security purposes" },
          { v: "research", l: "Developed and put into service solely for scientific research and development" },
          { v: "prerel", l: "Only research, testing or development before placing on the market", d: "Testing in real-world conditions is not covered by this exclusion" },
          { v: "personal", l: "Use by individuals in a purely personal, non-professional activity" },
          NONE
        ],
        next: function (a) {
          if (anyPicked(a, "ai_excl")) return "nis_sector";
          return is(a, "est", "non") ? "ai_terr" : "ai_role";
        }
      },
      ai_terr: {
        section: "AI Act",
        multi: true,
        q: "What is your AI’s link to the EU?",
        help: "The AI Act reaches non-EU providers that place AI on the EU market or put it into service in the EU, and non-EU providers and deployers whose AI output is used in the EU.",
        ref: "Art. 2(1)(a), (c) AI Act",
        options: [
          { v: "market", l: "We place AI systems on the EU market, or put them into service in the EU" },
          { v: "output", l: "The output produced by our AI is used in the EU" },
          NONE
        ],
        next: function (a) { return anyPicked(a, "ai_terr") ? "ai_role" : "nis_sector"; }
      },
      ai_role: {
        section: "AI Act",
        multi: true,
        q: "What do you do with AI?",
        help: "Select every role that applies; most organisations hold more than one. Building an AI tool and using it internally makes you both its provider and its deployer.",
        ref: "Art. 3(3)–(7) AI Act",
        options: [
          { v: "provider", l: "We develop AI (or have it developed) and offer it under our own name, to customers or for our own use", d: "Provider" },
          { v: "deployer", l: "We use AI systems in a professional context, including third-party tools", d: "Deployer" },
          { v: "impdist", l: "We import or resell AI systems made by others", d: "Importer / distributor" }
        ],
        next: function () { return "ai_flags"; }
      },
      ai_flags: {
        section: "AI Act",
        multi: true,
        q: "Quick risk screen: do any of these describe your AI?",
        help: "This is a first screen only. The AI Act checker on this page classifies each system in detail.",
        ref: "Art. 5, 6, 50 and Annexes I and III AI Act",
        options: [
          { v: "art5", l: "Manipulation, exploiting vulnerabilities, social scoring, emotion recognition at work or school, untargeted facial-image scraping, or similar", d: "Possible prohibited practice" },
          { v: "annex3", l: "Hiring or HR decisions, education, creditworthiness, life or health insurance pricing, public benefits, biometrics, critical infrastructure, law enforcement, migration, justice or elections", d: "Annex III use case" },
          { v: "annex1", l: "AI that is a safety component of (or is itself) a regulated product: medical device, machinery, toy, vehicle, lift, radio equipment, etc.", d: "Annex I product" },
          { v: "art50", l: "Chatbots or voice agents, generated text, images, audio or video, deepfakes", d: "Transparency" },
          NONE
        ],
        next: function () { return "nis_sector"; }
      },

      /* ---- NIS2 (screen) ---- */
      nis_sector: {
        section: "NIS2",
        q: "Do you operate in one of the NIS2 sectors?",
        help: "Annex I (high criticality): energy, transport, banking, financial-market infrastructure, health, drinking water, waste water, digital infrastructure (cloud, data centres, DNS, telecoms, trust services…), B2B ICT service management (managed and managed-security service providers), public administration, space.\n\nAnnex II (other critical): postal and courier, waste management, chemicals, food production and distribution, manufacturing (medical devices, electronics, electrical equipment, machinery, motor vehicles, other transport equipment), online marketplaces, search engines and social networks, research organisations.",
        ref: "Art. 2 and Annexes I–II NIS2 (Directive (EU) 2022/2555)",
        options: [
          { v: "annex1", l: "Yes, an Annex I sector (high criticality)" },
          { v: "annex2", l: "Yes, an Annex II sector (other critical)" },
          { v: "no", l: "No, none of these sectors" }
        ],
        next: function (a) { return is(a, "nis_sector", "no") ? "dora_fe" : "nis_size"; }
      },
      nis_size: {
        section: "NIS2",
        q: "How large is your organisation?",
        help: "Thresholds follow Commission Recommendation 2003/361/EC. Count the data of partner and linked enterprises (e.g. your group) together with your own.\n\nSome entity types are covered regardless of size: providers of public electronic communications networks or services, trust service providers, TLD name registries, DNS service providers and public administration entities.",
        ref: "Art. 2(1)–(2) NIS2",
        options: [
          { v: "large", l: "Large: 250+ staff, or annual turnover above €50m and balance sheet above €43m" },
          { v: "medium", l: "Medium: 50–249 staff, or turnover and balance sheet both above €10m" },
          { v: "small", l: "Small or micro: under 50 staff, and turnover or balance sheet of €10m or less" },
          { v: "indep", l: "We are a type of entity covered regardless of size (telecoms, trust services, DNS, TLD registry, public administration)" }
        ],
        next: function () { return "dora_fe"; }
      },

      /* ---- DORA ---- */
      dora_fe: {
        section: "DORA",
        multi: true,
        q: "Are you part of the financial sector?",
        help: "DORA financial entities: credit institutions, payment and e-money institutions, account information service providers, investment firms, crypto-asset service providers and issuers of asset-referenced tokens, central securities depositories, central counterparties, trading venues, trade repositories, AIFMs and UCITS management companies, data reporting service providers, insurance and reinsurance undertakings and intermediaries, occupational pension funds (IORPs), credit rating agencies, administrators of critical benchmarks, crowdfunding service providers and securitisation repositories.",
        ref: "Art. 2(1) DORA (Regulation (EU) 2022/2554)",
        options: [
          { v: "fe", l: "We are a regulated financial entity of one of these types" },
          { v: "ict", l: "We provide ICT services (cloud, software, data, managed IT or security) to financial entities" },
          NONE
        ],
        next: function (a) { return picked(a, "dora_fe", "fe") ? "dora_excl" : "cra_pde"; }
      },
      dora_excl: {
        section: "DORA",
        multi: true,
        q: "Does one of DORA’s exclusions apply to you?",
        ref: "Art. 2(3) DORA",
        options: [
          { v: "aifm", l: "Small AIFM benefiting from the Art. 3(2) AIFMD exemption" },
          { v: "ins", l: "Small insurance undertaking under Art. 4 Solvency II" },
          { v: "iorp", l: "IORP operating pension schemes with no more than 15 members in total" },
          { v: "mifid", l: "Person exempted under Art. 2 or 3 MiFID II" },
          { v: "intermed", l: "Insurance, reinsurance or ancillary insurance intermediary that is a micro, small or medium-sized enterprise" },
          { v: "giro", l: "Post-office giro institution" },
          NONE
        ],
        next: function () { return "cra_pde"; }
      },

      /* ---- CRA ---- */
      cra_pde: {
        section: "CRA",
        q: "Do you place products with digital elements on the EU market?",
        help: "A product with digital elements is hardware or software, including components sold separately, whose intended or foreseeable use includes a data connection to a device or network: IoT and smart devices, mobile and desktop apps, firmware, routers, operating systems and software libraries you sell. Pure SaaS is out of scope unless it is a remote data-processing solution without which a product could not perform its functions.",
        ref: "Art. 2(1), 3(1)–(2) CRA (Regulation (EU) 2024/2847)",
        options: [
          { v: "yes", l: "Yes: we make, import or distribute connected hardware or software products" },
          { v: "saas", l: "We only provide cloud or SaaS services, not products" },
          { v: "no", l: "No" }
        ],
        next: function (a) { return is(a, "cra_pde", "yes") ? "cra_role" : null; }
      },
      cra_role: {
        section: "CRA",
        multi: true,
        q: "What is your role for these products?",
        ref: "Art. 3(13)–(18) CRA",
        options: [
          { v: "manufacturer", l: "Manufacturer: we develop or have the product made, and market it under our own name or trademark" },
          { v: "importer", l: "Importer: we place a non-EU manufacturer’s product on the EU market" },
          { v: "distributor", l: "Distributor: we make products available on the market without changing them" },
          { v: "steward", l: "Open-source software steward: a legal person systematically supporting FOSS intended for commercial activities" }
        ],
        next: function () { return "cra_excl"; }
      },
      cra_excl: {
        section: "CRA",
        multi: true,
        q: "Does one of these exclusions cover your products?",
        ref: "Art. 2(2)–(8) and recitals 18–19 CRA",
        options: [
          { v: "sector", l: "Covered by the Medical Devices or IVD Regulations, motor-vehicle type-approval, civil aviation or marine equipment rules" },
          { v: "defence", l: "Developed or modified exclusively for national security or defence, or to process classified information" },
          { v: "spare", l: "Identical spare parts, made to the same specifications as the components they replace" },
          { v: "foss", l: "Free and open-source software supplied outside the course of a commercial activity (not monetised)" },
          NONE
        ],
        next: function (a) { return anyPicked(a, "cra_excl") ? null : "cra_class"; }
      },
      cra_class: {
        section: "CRA",
        q: "Which category best describes your main product?",
        help: "Important class I includes: identity-management and privileged-access software, browsers, password managers, anti-malware, VPNs, network management systems, SIEM, boot managers, PKI software, operating systems, routers, modems and switches, microprocessors and microcontrollers with security functions, smart-home assistants and security devices (locks, cameras, alarms), connected toys with social interaction or location tracking, and health-monitoring or children’s wearables.\n\nImportant class II includes: hypervisors and container runtimes, firewalls and intrusion detection or prevention systems, tamper-resistant microprocessors and microcontrollers.\n\nCritical products include: hardware devices with security boxes, smart-meter gateways, smartcards and secure elements.",
        ref: "Art. 7–8 and Annexes III–IV CRA",
        options: [
          { v: "critical", l: "Critical product (Annex IV)" },
          { v: "class2", l: "Important product, class II (Annex III)" },
          { v: "class1", l: "Important product, class I (Annex III)" },
          { v: "default", l: "None of these (default category, most products)" }
        ],
        next: function () { return null; }
      }
    },

    evaluate: function (a) {
      var cards = [];
      var outside = is(a, "est", "none");

      /* ---- GDPR ---- */
      (function () {
        var c = { reg: "GDPR", title: "General Data Protection Regulation", reasons: [], actions: [], dates: [] };
        if (outside) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You are established outside the EU and do not offer goods or services to, or monitor, people in the EU.", "Art. 3 GDPR"));
        } else if (is(a, "g_pd", "no")) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You do not process personal data. Double-check this: staff records, customer contacts and website analytics are all personal data.", "Art. 2(1), 4(1) GDPR"));
        } else if (anyPicked(a, "g_excl")) {
          c.status = "no"; c.label = "Does not apply";
          if (picked(a, "g_excl", "household")) c.reasons.push(r("Purely personal or household activity is outside the GDPR.", "Art. 2(2)(c) GDPR"));
          if (picked(a, "g_excl", "lawenf")) c.reasons.push(r("Criminal-law enforcement processing by competent authorities falls under the Law Enforcement Directive (EU) 2016/680 as transposed nationally.", "Art. 2(2)(d) GDPR"));
          if (picked(a, "g_excl", "euinst")) c.reasons.push(r("EU institutions and bodies apply Regulation (EU) 2018/1725 (EUDPR) instead.", "Art. 2(3) GDPR"));
          if (picked(a, "g_excl", "outside")) c.reasons.push(r("Activities outside the scope of Union law are excluded.", "Art. 2(2)(a) GDPR"));
        } else if (is(a, "est", "non") && !pickedAny(a, "g_terr", ["offer", "monitor"])) {
          if (picked(a, "g_terr", "processor")) {
            c.status = "indirect"; c.label = "Applies indirectly";
            c.reasons.push(r("As a non-EU processor for EU controllers you are not directly targeted by Art. 3(2), but your clients must bind you contractually to GDPR-level obligations, and transfers to you need a Chapter V transfer tool.", "Art. 28, 44–46 GDPR"));
            c.actions.push("Expect a data processing agreement (Art. 28(3)) and Standard Contractual Clauses from each EU client.");
          } else {
            c.status = "no"; c.label = "Does not apply";
            c.reasons.push(r("You are not established in the EU and neither target nor monitor individuals in the EU.", "Art. 3 GDPR"));
          }
        } else {
          c.status = is(a, "g_pd", "unsure") ? "likely" : "applies";
          c.label = c.status === "likely" ? "Likely applies" : "Applies";
          if (is(a, "est", "eu")) c.reasons.push(r("You process personal data in the context of an EU establishment.", "Art. 3(1) GDPR"));
          if (picked(a, "g_terr", "offer")) c.reasons.push(r("You offer goods or services to individuals in the EU.", "Art. 3(2)(a) GDPR"));
          if (picked(a, "g_terr", "monitor")) c.reasons.push(r("You monitor the behaviour of individuals in the EU.", "Art. 3(2)(b) GDPR"));
          if (is(a, "g_pd", "unsure")) c.reasons.push(r("You were unsure whether you process personal data. Almost every organisation with staff, customers or a website does.", "Art. 4(1) GDPR"));
          var role = val(a, "g_role");
          if (role === "controller" || role === "both") {
            c.actions.push("As controller: keep a record of processing activities, identify a lawful basis for each purpose, give privacy notices and handle data-subject requests (Arts. 6, 12–22, 30).");
            c.actions.push("Notify personal-data breaches to the supervisory authority within 72 hours where there is a risk to individuals (Art. 33).");
            c.actions.push("Sign Art. 28 data processing agreements with your vendors and put transfer tools in place for non-EU transfers (Chapter V).");
          }
          if (role === "processor" || role === "both") {
            c.actions.push("As processor: act only on documented instructions, keep a processor record (Art. 30(2)), secure the data (Art. 32), flow obligations down to sub-processors and notify controllers of breaches without undue delay (Art. 33(2)).");
          }
          if (anyPicked(a, "g_dpo")) {
            c.reasons.push(r("A Data Protection Officer is mandatory for you.", "Art. 37(1) GDPR"));
            c.actions.push("Appoint a Data Protection Officer and publish their contact details (Arts. 37–39).");
          }
          if (pickedAny(a, "g_dpo", ["monitor", "special"])) {
            c.actions.push("Carry out Data Protection Impact Assessments for large-scale monitoring or special-category processing (Art. 35).");
          }
          if (is(a, "est", "non")) {
            c.actions.push("Designate a representative in the EU in writing, unless the occasional-processing exemption applies (Art. 27).");
          }
          c.dates.push("Applicable since 25 May 2018. The Digital Omnibus proposal amending the GDPR (November 2025) is still in negotiation.");
        }
        cards.push(c);
      })();

      /* ---- AI Act ---- */
      (function () {
        var c = { reg: "AI Act", title: "EU Artificial Intelligence Act", reasons: [], actions: [], dates: [], link: { tool: "aiact", label: "Classify your AI systems in detail →" } };
        if (outside) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("No EU market, users or output use.", "Art. 2(1) AI Act"));
        } else if (is(a, "ai_sys", "no")) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You do not develop, use or distribute AI systems. Re-check if you adopt AI tools, including off-the-shelf assistants.", "Art. 2–3 AI Act"));
        } else if (anyPicked(a, "ai_excl")) {
          c.status = "no"; c.label = "Does not apply";
          if (picked(a, "ai_excl", "military")) c.reasons.push(r("Exclusively military, defence or national-security AI is excluded.", "Art. 2(3) AI Act"));
          if (picked(a, "ai_excl", "research")) c.reasons.push(r("AI developed and put into service solely for scientific R&D is excluded.", "Art. 2(6) AI Act"));
          if (picked(a, "ai_excl", "prerel")) c.reasons.push(r("Pre-market research, testing and development is excluded (real-world testing is not).", "Art. 2(8) AI Act"));
          if (picked(a, "ai_excl", "personal")) c.reasons.push(r("Purely personal, non-professional use is excluded.", "Art. 2(10) AI Act"));
        } else if (is(a, "est", "non") && !anyPicked(a, "ai_terr")) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("Your AI is neither placed on the EU market nor is its output used in the EU.", "Art. 2(1) AI Act"));
        } else {
          c.status = is(a, "ai_sys", "unsure") ? "review" : "applies";
          c.label = c.status === "review" ? "Needs review" : "Applies";
          if (is(a, "ai_sys", "unsure")) c.reasons.push(r("You are not sure whether your software qualifies as an AI system. Check it against the seven elements of the definition.", "Art. 3(1) AI Act"));
          var roles = [];
          if (picked(a, "ai_role", "provider")) roles.push("provider");
          if (picked(a, "ai_role", "deployer")) roles.push("deployer");
          if (picked(a, "ai_role", "impdist")) roles.push("importer / distributor");
          if (roles.length) c.reasons.push(r("Your role(s): " + roles.join(", ") + ".", "Art. 3 AI Act"));
          c.actions.push("Take measures to support the AI literacy of staff who operate or use AI on your behalf (Art. 4, as rewritten by Regulation (EU) 2026/1744).");
          c.actions.push("Confirm that none of your AI falls under the Art. 5 prohibitions, in force since 2 February 2025.");
          if (picked(a, "ai_flags", "art5")) {
            c.status = "prohibited"; c.label = "Possible prohibited practice";
            c.reasons.push(r("You flagged a use that may be a prohibited practice. Stop and get a legal review before continuing; fines reach €35m or 7% of worldwide turnover.", "Art. 5, 99(3) AI Act"));
          }
          if (pickedAny(a, "ai_flags", ["annex3", "annex1"])) {
            c.reasons.push(r("You flagged a use case that is potentially high-risk.", "Art. 6, Annexes I & III AI Act"));
            c.actions.push("Run each system through the AI Act checker to confirm its risk class and your obligations.");
          }
          if (picked(a, "ai_flags", "art50")) {
            c.reasons.push(r("Chatbots, generated content and deepfakes trigger transparency duties, applicable since 2 August 2026.", "Art. 50 AI Act"));
          }
          if (is(a, "est", "non") && picked(a, "ai_role", "provider")) {
            c.actions.push("As a non-EU provider of high-risk AI systems, appoint an authorised representative in the EU (Art. 22).");
          }
          c.dates.push("Prohibitions and AI literacy: 2 Feb 2025 · Transparency (Art. 50): 2 Aug 2026 · New prohibition on non-consensual intimate imagery: 2 Dec 2026 · High-risk, Annex III: 2 Dec 2027 · High-risk, Annex I: 2 Aug 2028 (Regulation (EU) 2026/1744).");
        }
        cards.push(c);
      })();

      /* ---- NIS2 ---- */
      (function () {
        var c = { reg: "NIS2", title: "NIS2 Directive", reasons: [], actions: [], dates: [], link: { tool: "nis2", label: "Check essential vs important status →" } };
        var sector = val(a, "nis_sector"), size = val(a, "nis_size");
        if (outside) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You do not provide services or carry out activities in the EU.", "Art. 2(1) NIS2"));
        } else if (!sector || sector === "no") {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You do not operate in an Annex I or Annex II sector. Your Member State may still have extended national scope (e.g. to education), and you may be pulled in as a supplier of in-scope entities.", "Art. 2, 5 NIS2"));
        } else if (size === "small") {
          c.status = "review"; c.label = "Likely out of scope";
          c.reasons.push(r("Micro and small enterprises in NIS2 sectors are out of scope unless they are a size-independent type, were identified by their Member State, or are a critical entity under the CER Directive.", "Art. 2(1)–(4) NIS2"));
        } else {
          c.status = "likely"; c.label = "Likely in scope";
          c.reasons.push(r(sector === "annex1" ? "You operate in an Annex I (high-criticality) sector" + (size === "indep" ? " as an entity covered regardless of size." : " at medium size or above.") : "You operate in an Annex II (other critical) sector" + (size === "indep" ? "." : " at medium size or above."), "Art. 2–3 NIS2"));
          if (sector === "annex1" && size === "large") c.reasons.push(r("Large Annex I entities are, as a rule, essential entities.", "Art. 3(1)(a) NIS2"));
          if (sector === "annex2") c.reasons.push(r("Annex II entities are, as a rule, important entities.", "Art. 3(2) NIS2"));
          c.actions.push("Run the NIS2 checker to pin down your entity type and essential / important status.");
          c.actions.push("Register with your national authority, implement the Art. 21 risk-management measures and prepare the 24h / 72h / one-month incident reporting chain (Art. 23).");
          if (picked(a, "dora_fe", "fe")) c.reasons.push(r("As a DORA financial entity, DORA’s ICT risk-management and incident-reporting rules apply instead of the equivalent NIS2 provisions.", "Art. 4 NIS2 · Art. 1(2) DORA"));
          c.dates.push("Transposition deadline 17 Oct 2024; Member States were to establish entity lists by 17 Apr 2025.");
        }
        cards.push(c);
      })();

      /* ---- DORA ---- */
      (function () {
        var c = { reg: "DORA", title: "Digital Operational Resilience Act", reasons: [], actions: [], dates: [] };
        var fe = picked(a, "dora_fe", "fe"), ict = picked(a, "dora_fe", "ict");
        if (outside || (!fe && !ict)) {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You are neither a DORA financial entity nor an ICT third-party service provider to one.", "Art. 2 DORA"));
        } else if (fe && !anyPicked(a, "dora_excl")) {
          c.status = "applies"; c.label = "Applies";
          c.reasons.push(r("You are a financial entity listed in Art. 2(1) DORA.", "Art. 2(1) DORA"));
          c.actions.push("Maintain a management-approved ICT risk-management framework (Arts. 5–16); smaller entities may use the simplified framework (Art. 16).");
          c.actions.push("Classify ICT incidents and report major ones to your competent authority: initial, intermediate and final reports (Arts. 17–19).");
          c.actions.push("Run a digital operational resilience testing programme; threat-led penetration testing if designated (Arts. 24–27).");
          c.actions.push("Keep a register of information on all ICT third-party contracts and include the Art. 30 mandatory clauses (Arts. 28–30).");
          c.dates.push("Applicable since 17 January 2025.");
        } else if (fe) {
          c.status = "no"; c.label = "Excluded";
          c.reasons.push(r("You fall under one of the DORA exclusions.", "Art. 2(3) DORA"));
        }
        if (ict) {
          if (!c.status || c.status === "no") { c.status = "indirect"; c.label = "Applies indirectly"; c.reasons = []; }
          c.reasons.push(r("As an ICT third-party service provider to financial entities, you will be bound contractually to DORA’s Art. 30 clauses (audit, access, incident assistance, exit). The ESAs may designate you a critical ICT third-party provider under direct oversight.", "Art. 28–31 DORA"));
          c.actions.push("Prepare DORA-ready contract terms, incident-assistance procedures and exit plans for financial-sector clients.");
          if (!c.dates.length) c.dates.push("Applicable since 17 January 2025.");
        }
        cards.push(c);
      })();

      /* ---- CRA ---- */
      (function () {
        var c = { reg: "CRA", title: "Cyber Resilience Act", reasons: [], actions: [], dates: [] };
        var p = val(a, "cra_pde");
        if (outside || !p || p === "no") {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("You do not make products with digital elements available on the EU market.", "Art. 2(1) CRA"));
        } else if (p === "saas") {
          c.status = "no"; c.label = "Does not apply";
          c.reasons.push(r("Pure SaaS is outside the CRA unless it is a remote data-processing solution of a product with digital elements. Your SaaS may instead fall under NIS2 (e.g. as a cloud provider).", "Art. 3(2) and recital 12 CRA"));
        } else if (anyPicked(a, "cra_excl")) {
          c.status = "no"; c.label = "Does not apply";
          if (picked(a, "cra_excl", "sector")) c.reasons.push(r("Products covered by the MDR/IVDR, vehicle type-approval, civil aviation or marine equipment rules are excluded.", "Art. 2(2)–(4) CRA"));
          if (picked(a, "cra_excl", "defence")) c.reasons.push(r("Products developed exclusively for national security or defence are excluded.", "Art. 2(7) CRA"));
          if (picked(a, "cra_excl", "spare")) c.reasons.push(r("Identical spare parts are excluded.", "Art. 2(6) CRA"));
          if (picked(a, "cra_excl", "foss")) c.reasons.push(r("Free and open-source software supplied outside a commercial activity is not covered.", "Recitals 18–19 CRA"));
        } else {
          c.status = "applies"; c.label = "Applies";
          c.reasons.push(r("You make products with digital elements available on the EU market.", "Art. 2(1) CRA"));
          if (picked(a, "cra_role", "manufacturer")) c.actions.push("Manufacturer: design to the Annex I essential cybersecurity requirements, handle vulnerabilities for the support period (at least 5 years as a rule), draw up technical documentation, the EU declaration of conformity and CE marking (Arts. 13, 28, 30–31).");
          if (picked(a, "cra_role", "importer")) c.actions.push("Importer: only place compliant, CE-marked products on the market and verify the manufacturer’s conformity assessment and documentation (Art. 19).");
          if (picked(a, "cra_role", "distributor")) c.actions.push("Distributor: check CE marking and documentation before making products available (Art. 20).");
          if (picked(a, "cra_role", "steward")) c.actions.push("Open-source steward: put a cybersecurity policy in place and cooperate with market surveillance authorities (Art. 24).");
          c.actions.push("Report actively exploited vulnerabilities and severe incidents through ENISA’s single reporting platform: 24h early warning, 72h notification, final report (Art. 14).");
          var cls = val(a, "cra_class");
          if (cls === "critical") c.reasons.push(r("Critical product: a European cybersecurity certificate may be required, otherwise third-party conformity assessment.", "Art. 8, 32(4) CRA"));
          else if (cls === "class2") c.reasons.push(r("Important product, class II: third-party conformity assessment (EU-type examination or full quality assurance) is mandatory.", "Art. 32(3) CRA"));
          else if (cls === "class1") c.reasons.push(r("Important product, class I: self-assessment only if you fully apply harmonised standards or certification; otherwise third-party assessment.", "Art. 32(2) CRA"));
          else if (cls === "default") c.reasons.push(r("Default category: internal control (self-assessment, Module A) is enough.", "Art. 32(1) CRA"));
          c.dates.push("Reporting obligations: 11 Sep 2026 (also for products already on the market) · Notified-body rules: 11 Jun 2026 · Full application: 11 Dec 2027.");
        }
        cards.push(c);
      })();

      var applies = cards.filter(function (c) { return c.status !== "no"; }).map(function (c) { return c.reg; });
      return {
        headline: {
          status: applies.length ? "applies" : "no",
          title: applies.length ? "Regulations to look at: " + applies.join(", ") : "None of the five regulations appear to apply",
          text: applies.length ? "Here is what applies to you, and why. Each finding cites the provision it rests on." : "Based on your answers, none of these regimes applies directly. Re-run the check if your products, customers or sector change."
        },
        cards: cards
      };
    }
  };

  /* =================================================================== TOOL 2
   * AI Act: risk classification and role determination
   * ========================================================================= */
  var ANNEX3 = [
    { v: "b_rbi", g: "1 · Biometrics", l: "Remote biometric identification", d: "Not biometric verification whose sole purpose is to confirm a person is who they claim to be" },
    { v: "b_cat", g: "1 · Biometrics", l: "Biometric categorisation according to sensitive or protected attributes" },
    { v: "b_emo", g: "1 · Biometrics", l: "Emotion recognition" },
    { v: "ci", g: "2 · Critical infrastructure", l: "Safety component in the management and operation of critical digital infrastructure, road traffic, or the supply of water, gas, heating or electricity" },
    { v: "ed_access", g: "3 · Education and vocational training", l: "Determining access or admission to, or assigning people to, education and training institutions" },
    { v: "ed_eval", g: "3 · Education and vocational training", l: "Evaluating learning outcomes, including to steer the learning process" },
    { v: "ed_level", g: "3 · Education and vocational training", l: "Assessing the appropriate level of education a person will receive or can access" },
    { v: "ed_proct", g: "3 · Education and vocational training", l: "Monitoring and detecting prohibited behaviour of students during tests" },
    { v: "emp_rec", g: "4 · Employment and workers management", l: "Recruitment or selection: targeted job ads, analysing and filtering applications, evaluating candidates" },
    { v: "emp_mgmt", g: "4 · Employment and workers management", l: "Decisions on work terms, promotion or termination, task allocation based on behaviour or traits, or monitoring and evaluating performance" },
    { v: "svc_pub", g: "5 · Essential private and public services", l: "Evaluating eligibility for public assistance benefits and services (incl. healthcare), or granting, reducing, revoking or reclaiming them" },
    { v: "svc_credit", g: "5 · Essential private and public services", l: "Evaluating the creditworthiness or credit score of natural persons", d: "Except AI used to detect financial fraud" },
    { v: "svc_ins", g: "5 · Essential private and public services", l: "Risk assessment and pricing for natural persons in life and health insurance" },
    { v: "svc_emerg", g: "5 · Essential private and public services", l: "Evaluating and classifying emergency calls, dispatching emergency services, or emergency patient triage" },
    { v: "le_victim", g: "6 · Law enforcement (by or for law-enforcement authorities)", l: "Assessing the risk of a person becoming a victim of crime" },
    { v: "le_poly", g: "6 · Law enforcement (by or for law-enforcement authorities)", l: "Polygraphs or similar tools" },
    { v: "le_evid", g: "6 · Law enforcement (by or for law-enforcement authorities)", l: "Evaluating the reliability of evidence" },
    { v: "le_offend", g: "6 · Law enforcement (by or for law-enforcement authorities)", l: "Assessing the risk of (re-)offending not solely on profiling, or assessing personality traits or past criminal behaviour" },
    { v: "le_prof", g: "6 · Law enforcement (by or for law-enforcement authorities)", l: "Profiling in the detection, investigation or prosecution of criminal offences" },
    { v: "mig_poly", g: "7 · Migration, asylum and border control", l: "Polygraphs or similar tools" },
    { v: "mig_risk", g: "7 · Migration, asylum and border control", l: "Assessing security, irregular-migration or health risks posed by a person entering the EU" },
    { v: "mig_app", g: "7 · Migration, asylum and border control", l: "Examining asylum, visa or residence-permit applications and related complaints" },
    { v: "mig_id", g: "7 · Migration, asylum and border control", l: "Detecting, recognising or identifying persons in migration or border management", d: "Except verification of travel documents" },
    { v: "jus", g: "8 · Justice and democratic processes", l: "Assisting a judicial authority or ADR body in researching and interpreting facts and law and applying the law" },
    { v: "elect", g: "8 · Justice and democratic processes", l: "Influencing the outcome of an election or referendum, or voting behaviour", d: "Except tools used to organise, optimise or structure political campaigns logistically" },
    NONE
  ];

  var aiact = {
    id: "aiact",
    title: "AI Act risk classification & role",
    short: "AI Act checker",
    intro: "Classify one AI system under the EU AI Act, find out whether you are its provider, deployer, importer or distributor, and see the obligations and deadlines that follow. Run it once per system.",
    sections: ["Scope", "Your role", "Prohibited", "High-risk", "Transparency"],
    start: "def",
    nodes: {
      def: {
        section: "Scope",
        q: "Does the system infer from its inputs how to generate outputs?",
        help: "The AI Act definition has seven elements: a machine-based system; designed to operate with varying levels of autonomy; that may show adaptiveness after deployment; for explicit or implicit objectives; infers from the input it receives; how to generate outputs such as predictions, content, recommendations or decisions; that can influence physical or virtual environments.\n\nThe Commission’s guidelines exclude systems for improving mathematical optimisation, basic data processing, classical heuristics and simple prediction systems (e.g. plain averages). Machine-learning and logic or knowledge-based systems that infer are in.",
        ref: "Art. 3(1) AI Act · Commission Guidelines on the AI system definition (Feb 2025)",
        options: [
          { v: "yes", l: "Yes: it uses machine learning, an LLM, or logic or knowledge-based inference" },
          { v: "unsure", l: "Not sure" },
          { v: "no", l: "No: it only executes rules defined by people, basic data processing or simple statistics" }
        ],
        next: function (a) { return is(a, "def", "no") ? null : "excl"; }
      },
      excl: {
        section: "Scope",
        multi: true,
        q: "Does one of these exclusions apply to the system?",
        ref: "Art. 2(3), (4), (6), (8), (10), (12) AI Act",
        options: [
          { v: "military", l: "Placed on the market, put into service or used exclusively for military, defence or national-security purposes" },
          { v: "research", l: "Developed and put into service solely for scientific research and development" },
          { v: "prerel", l: "Still in research, testing or development, not yet placed on the market or put into service", d: "Testing in real-world conditions is not excluded" },
          { v: "personal", l: "Used by an individual in a purely personal, non-professional activity" },
          { v: "intl", l: "Used by a third-country public authority or international organisation under an international law-enforcement or judicial cooperation agreement with adequate safeguards" },
          { v: "foss", l: "Released under a free and open-source licence", d: "Not an exclusion for prohibited, high-risk or Art. 50 systems; we’ll keep checking" },
          NONE
        ],
        next: function (a) { return pickedAny(a, "excl", ["military", "research", "prerel", "personal", "intl"]) ? null : "role"; }
      },
      role: {
        section: "Your role",
        multi: true,
        q: "What is your relationship with this AI system?",
        help: "Roles attach to each system, not to your company as a whole. If you build a system and use it yourself, you are both provider and deployer.",
        ref: "Art. 3(3)–(7) AI Act",
        options: [
          { v: "provider", l: "We developed it (or had it developed) and place it on the market or put it into service under our own name or trademark", d: "Provider · this includes building it for in-house use" },
          { v: "deployer", l: "We use it under our authority in a professional context", d: "Deployer" },
          { v: "importer", l: "We are established in the EU and place on the EU market a system bearing the name of a non-EU company", d: "Importer" },
          { v: "distributor", l: "We make it available on the EU market without being its provider or importer, e.g. as a reseller", d: "Distributor" },
          { v: "authrep", l: "We hold a written mandate from a non-EU provider to act on its behalf in the EU", d: "Authorised representative" }
        ],
        next: function () { return "est"; }
      },
      est: {
        section: "Your role",
        q: "Where are you established, and how does the system reach the EU?",
        ref: "Art. 2(1) AI Act",
        options: [
          { v: "eu", l: "We are established in the EU" },
          { v: "non_market", l: "Outside the EU: the system is placed on the EU market or put into service in the EU" },
          { v: "non_output", l: "Outside the EU: the system is not on the EU market, but its output is used in the EU" },
          { v: "none", l: "Outside the EU, and neither the system nor its output reaches the EU" }
        ],
        next: function (a) { return is(a, "est", "none") ? null : "art5"; }
      },
      art5: {
        section: "Prohibited",
        multi: true,
        q: "Does the system do any of the following?",
        help: "These practices are banned outright. The exceptions written into each item (e.g. medical or safety reasons for emotion recognition) are not prohibited. A new prohibition added by Regulation (EU) 2026/1744 applies from 2 December 2026.",
        ref: "Art. 5(1) AI Act · Commission Guidelines on prohibited practices (Feb 2025)",
        options: [
          { v: "a", l: "Uses subliminal, manipulative or deceptive techniques that materially distort behaviour and cause, or are likely to cause, significant harm", d: "Art. 5(1)(a)" },
          { v: "b", l: "Exploits vulnerabilities due to age, disability or a specific social or economic situation, materially distorting behaviour and causing significant harm", d: "Art. 5(1)(b)" },
          { v: "c", l: "Social scoring: evaluating or classifying people by social behaviour or personal traits, leading to unjustified or disproportionate detrimental treatment", d: "Art. 5(1)(c)" },
          { v: "d", l: "Predicts the risk of a person committing a crime based solely on profiling or personality traits", d: "Art. 5(1)(d)" },
          { v: "e", l: "Builds or expands facial-recognition databases through untargeted scraping of facial images from the internet or CCTV", d: "Art. 5(1)(e)" },
          { v: "f", l: "Infers emotions of people in the workplace or in education institutions, other than for medical or safety reasons", d: "Art. 5(1)(f)" },
          { v: "g", l: "Biometric categorisation to infer race, political opinions, trade-union membership, religious or philosophical beliefs, sex life or sexual orientation", d: "Art. 5(1)(g) · except labelling or filtering lawfully acquired datasets" },
          { v: "h", l: "Real-time remote biometric identification in publicly accessible spaces for law enforcement, outside the narrow authorised exceptions", d: "Art. 5(1)(h)" },
          { v: "i", l: "Generates realistic non-consensual sexual or intimate imagery of identifiable persons, or child sexual abuse material", d: "New prohibition added to Art. 5 by Regulation (EU) 2026/1744, from 2 Dec 2026" },
          NONE
        ],
        next: function (a) { return anyPicked(a, "art5") ? null : "annex1"; }
      },
      annex1: {
        section: "High-risk",
        q: "Is the system a product, or a safety component of a product, covered by EU product legislation in Annex I?",
        help: "A safety component fulfils a safety function for the product, or its failure endangers the health and safety of people or property.\n\nSection A: medical devices (MDR), in-vitro diagnostics (IVDR), toys, lifts, radio equipment, pressure equipment, personal protective equipment, gas appliances, equipment for explosive atmospheres (ATEX), recreational craft, cableways.\n\nSection B: motor vehicles, two- or three-wheel vehicles, agricultural and forestry vehicles, civil aviation, marine equipment, rail systems and, since Regulation (EU) 2026/1744, machinery.",
        ref: "Art. 6(1) and Annex I AI Act (as amended by Reg. (EU) 2026/1744)",
        options: [
          { v: "A", l: "Yes, Section A legislation (medical devices, toys, lifts, radio equipment, …)" },
          { v: "B", l: "Yes, Section B legislation (vehicles, aviation, marine, rail, machinery)" },
          { v: "no", l: "No" }
        ],
        next: function (a) { return is(a, "annex1", "no") ? "annex3" : "annex1_tpca"; }
      },
      annex1_tpca: {
        section: "High-risk",
        q: "Must that product undergo a third-party conformity assessment (by a notified body) under that legislation?",
        help: "Example: most class IIa, IIb and III medical devices need notified-body assessment; class I devices without measuring or sterile functions do not.",
        ref: "Art. 6(1)(b) AI Act",
        options: [
          { v: "yes", l: "Yes" },
          { v: "no", l: "No, self-assessment is enough under that legislation" }
        ],
        next: function (a) { return is(a, "annex1_tpca", "yes") ? "art50" : "annex3"; }
      },
      annex3: {
        section: "High-risk",
        multi: true,
        q: "Is the system intended to be used for any of these purposes?",
        help: "These are the Annex III high-risk use cases. What counts is the intended purpose stated by the provider (or the purpose you actually use it for, if you repurpose it).",
        ref: "Art. 6(2) and Annex III AI Act",
        options: ANNEX3,
        next: function (a) { return anyPicked(a, "annex3") ? "profiling" : "art50"; }
      },
      profiling: {
        section: "High-risk",
        q: "Does the system profile natural persons?",
        help: "Profiling means automated processing of personal data to evaluate personal aspects of a person, such as their work performance, economic situation, health, preferences, reliability, behaviour or location (GDPR definition). An Annex III system that profiles is always high-risk.",
        ref: "Art. 6(3), last subparagraph AI Act · Art. 4(4) GDPR",
        options: [
          { v: "yes", l: "Yes" },
          { v: "no", l: "No" }
        ],
        next: function (a) { return is(a, "profiling", "yes") ? "art50" : "derog"; }
      },
      derog: {
        section: "High-risk",
        multi: true,
        q: "Is the system’s role limited in one of these ways?",
        help: "An Annex III system is not high-risk if it does not pose a significant risk of harm, including by not materially influencing the outcome of decision-making, because it is intended only for one of these tasks.",
        ref: "Art. 6(3) AI Act · Commission guidelines on high-risk classification",
        options: [
          { v: "a", l: "It performs a narrow procedural task", d: "e.g. converting unstructured data into structured data, classifying incoming documents, detecting duplicates" },
          { v: "b", l: "It improves the result of a previously completed human activity", d: "e.g. polishing the language of a document a person has already drafted" },
          { v: "c", l: "It detects decision-making patterns or deviations from prior patterns, without replacing or influencing the prior human assessment without proper human review" },
          { v: "d", l: "It performs a preparatory task to an assessment relevant to an Annex III use case", d: "e.g. file handling, indexing, searching, translation" },
          NONE
        ],
        next: function (a) { return anyPicked(a, "derog") ? "derog_ok" : "art50"; }
      },
      derog_ok: {
        section: "High-risk",
        q: "Can you document that the system does not materially influence the outcome of decisions and poses no significant risk of harm to health, safety or fundamental rights?",
        ref: "Art. 6(3)–(4) AI Act",
        options: [
          { v: "yes", l: "Yes, and we will record that assessment before placing it on the market" },
          { v: "no", l: "No, or not with confidence" }
        ],
        next: function () { return "art50"; }
      },
      art50: {
        section: "Transparency",
        multi: true,
        q: "Does the system do any of the following?",
        ref: "Art. 50 AI Act",
        options: [
          { v: "chat", l: "Interacts directly with people (chatbot, voice agent, AI assistant)", d: "Provider must design it so people know they are interacting with AI · Art. 50(1)" },
          { v: "synth", l: "Generates synthetic audio, image, video or text content", d: "Provider must mark outputs in a machine-readable way · Art. 50(2)" },
          { v: "emo", l: "Performs emotion recognition or biometric categorisation", d: "Deployer must inform people exposed to it · Art. 50(3)" },
          { v: "deepfake", l: "Generates or manipulates image, audio or video content that is a deepfake", d: "Deployer must disclose it · Art. 50(4)" },
          { v: "text", l: "Generates or manipulates text published to inform the public on matters of public interest", d: "Deployer must disclose it unless human editorial review applies · Art. 50(4)" },
          NONE
        ],
        next: function (a) { return pickedAny(a, "role", ["deployer", "importer", "distributor"]) ? "art25" : null; }
      },
      art25: {
        section: "Transparency",
        multi: true,
        q: "Have you done any of the following with this system?",
        help: "Any of these makes a deployer, importer, distributor or other third party the provider of a high-risk AI system, with the full provider obligations. The original provider is then no longer the provider for that system.",
        ref: "Art. 25(1) AI Act",
        options: [
          { v: "brand", l: "Put our name or trademark on a high-risk AI system already on the market" },
          { v: "subst", l: "Made a substantial modification to a high-risk AI system so that it remains high-risk" },
          { v: "purpose", l: "Changed the intended purpose of an AI system so that it became high-risk", d: "e.g. using a general chatbot to screen job applicants" },
          NONE
        ],
        next: function () { return null; }
      }
    },

    evaluate: function (a) {
      var out = { cards: [] };
      var why = [];

      /* --- scope --- */
      if (is(a, "def", "no")) {
        out.headline = { status: "no", title: "Not an AI system", text: "Based on your answers, the system does not infer how to generate outputs, so it is not an AI system under the AI Act. Other law (GDPR, product safety) may still apply." };
        out.cards.push({ reg: "Rule trace", title: "Why", status: "no", label: "Out of scope", reasons: [r("Systems that only execute rules defined by people, perform basic data processing or use simple statistics fall outside the definition.", "Art. 3(1) AI Act · Commission Guidelines on the AI system definition")], actions: [], dates: [] });
        return out;
      }
      if (pickedAny(a, "excl", ["military", "research", "prerel", "personal", "intl"])) {
        var ex = [];
        if (picked(a, "excl", "military")) ex.push(r("Exclusively military, defence or national-security use.", "Art. 2(3)"));
        if (picked(a, "excl", "research")) ex.push(r("Developed and put into service solely for scientific research and development.", "Art. 2(6)"));
        if (picked(a, "excl", "prerel")) ex.push(r("Research, testing and development before placing on the market or putting into service.", "Art. 2(8)"));
        if (picked(a, "excl", "personal")) ex.push(r("Purely personal, non-professional use.", "Art. 2(10)"));
        if (picked(a, "excl", "intl")) ex.push(r("Third-country authority or international organisation under a cooperation agreement.", "Art. 2(4)"));
        out.headline = { status: "no", title: "Outside the scope of the AI Act", text: "An exclusion in Art. 2 applies to this system. Re-assess if its use changes, for example when you move from R&D to market or start real-world testing." };
        out.cards.push({ reg: "Rule trace", title: "Why", status: "no", label: "Excluded", reasons: ex, actions: [], dates: [] });
        return out;
      }
      if (is(a, "est", "none")) {
        out.headline = { status: "no", title: "Outside the territorial scope", text: "The system is neither placed on the EU market nor is its output used in the EU." };
        out.cards.push({ reg: "Rule trace", title: "Why", status: "no", label: "Out of scope", reasons: [r("No EU placing on the market, putting into service, establishment or use of output in the EU.", "Art. 2(1) AI Act")], actions: [], dates: [] });
        return out;
      }

      /* --- roles (incl. Art. 25 reclassification) --- */
      var roles = { provider: picked(a, "role", "provider"), deployer: picked(a, "role", "deployer"), importer: picked(a, "role", "importer"), distributor: picked(a, "role", "distributor"), authrep: picked(a, "role", "authrep") };

      /* --- tier --- */
      var tier, tierWhy = [];
      if (anyPicked(a, "art5")) {
        tier = "prohibited";
        var labels = { a: "manipulative or deceptive techniques", b: "exploitation of vulnerabilities", c: "social scoring", d: "crime prediction based solely on profiling", e: "untargeted facial-image scraping", f: "emotion recognition at work or in education", g: "sensitive biometric categorisation", h: "real-time remote biometric identification for law enforcement", i: "non-consensual intimate imagery or CSAM generation" };
        a.art5.forEach(function (k) { if (labels[k]) tierWhy.push(r("Prohibited practice: " + labels[k] + ".", (k === "i" ? "Art. 5 as amended by Reg. (EU) 2026/1744" : "Art. 5(1)(" + k + ")"))); });
      } else if (!is(a, "annex1", "no") && val(a, "annex1") && is(a, "annex1_tpca", "yes")) {
        tier = is(a, "annex1", "A") ? "high_I_A" : "high_I_B";
        tierWhy.push(r("Product or safety component under Annex I " + (tier === "high_I_A" ? "Section A" : "Section B") + " legislation that requires third-party conformity assessment.", "Art. 6(1) AI Act"));
      } else if (anyPicked(a, "annex3")) {
        var cats = ANNEX3.filter(function (o) { return picked(a, "annex3", o.v); }).map(function (o) { return o.g.replace(/^\d · /, ""); });
        cats = cats.filter(function (x, i) { return cats.indexOf(x) === i; });
        if (is(a, "profiling", "yes")) {
          tier = "high_III";
          tierWhy.push(r("Annex III use case (" + cats.join("; ") + ").", "Art. 6(2), Annex III"));
          tierWhy.push(r("The system profiles natural persons, so the Art. 6(3) derogation is unavailable.", "Art. 6(3), last subpara."));
        } else if (anyPicked(a, "derog") && is(a, "derog_ok", "yes")) {
          tier = "derog";
          tierWhy.push(r("Annex III use case (" + cats.join("; ") + "), but the system only performs a limited task and does not materially influence decisions.", "Art. 6(3)"));
        } else {
          tier = "high_III";
          tierWhy.push(r("Annex III use case (" + cats.join("; ") + ").", "Art. 6(2), Annex III"));
          if (anyPicked(a, "derog")) tierWhy.push(r("You could not confirm the absence of significant risk, so the Art. 6(3) derogation is not relied on.", "Art. 6(3)"));
        }
      } else {
        tier = anyPicked(a, "art50") ? "transparency" : "minimal";
        if (val(a, "annex1") && !is(a, "annex1", "no")) tierWhy.push(r("Annex I product, but no third-party conformity assessment is required, so it is not high-risk under Art. 6(1).", "Art. 6(1)(b)"));
        tierWhy.push(r("No prohibited practice and no Annex III use case.", "Art. 5, 6"));
      }
      var high = tier.indexOf("high") === 0;

      /* Art. 25: becoming the provider */
      var became = [];
      if (picked(a, "art25", "purpose")) {
        became.push(r("By changing the intended purpose so the system became high-risk, you are now its provider.", "Art. 25(1)(c)"));
        if (!high && tier !== "prohibited") { tier = "high_III"; high = true; tierWhy.push(r("Repurposed into a high-risk use.", "Art. 25(1)(c)")); }
      }
      if (high && picked(a, "art25", "brand")) became.push(r("By putting your name or trademark on a high-risk system, you are now its provider.", "Art. 25(1)(a)"));
      if (high && picked(a, "art25", "subst")) became.push(r("By substantially modifying a high-risk system, you are now its provider.", "Art. 25(1)(b)"));
      if (became.length) roles.provider = true;

      var TIERS = {
        prohibited: { status: "prohibited", title: "Prohibited AI practice", text: "This use is banned in the EU. It must not be placed on the market, put into service or used. Fines reach €35m or 7% of worldwide annual turnover." },
        high_I_A: { status: "high", title: "High-risk AI system (Annex I, Section A)", text: "High-risk under Art. 6(1). The AI Act requirements are assessed within your product’s existing notified-body conformity assessment. Applies from 2 August 2028; the Commission may limit requirements where sector law already gives equivalent protection (Art. 2(13), as amended)." },
        high_I_B: { status: "high", title: "High-risk AI system (Annex I, Section B)", text: "High-risk under Art. 6(1), but for Section B legislation (vehicles, aviation, marine, rail, machinery) the AI Act requirements apply through that sectoral legislation and its implementing acts, not directly (Art. 2(2))." },
        high_III: { status: "high", title: "High-risk AI system (Annex III)", text: "Full high-risk regime. Obligations apply from 2 December 2027 (Regulation (EU) 2026/1744)." },
        derog: { status: "review", title: "Annex III use, not high-risk (Art. 6(3))", text: "Not high-risk, provided you document the assessment before placing on the market and register the system in the EU database. Authorities can request the documentation and challenge the classification." },
        transparency: { status: "likely", title: "Limited risk: transparency obligations", text: "Not high-risk, but Art. 50 transparency duties apply (since 2 August 2026)." },
        minimal: { status: "no", title: "Minimal risk", text: "No specific obligations beyond AI literacy (Art. 4) and the prohibitions. Voluntary codes of conduct are encouraged (Art. 95)." }
      };
      out.headline = TIERS[tier];
      if (is(a, "def", "unsure")) out.headline.text += " Note: you were unsure whether this is an AI system at all. Confirm that first.";

      out.cards.push({ reg: "Classification", title: "Why this risk class", status: TIERS[tier].status, label: TIERS[tier].title, reasons: tierWhy, actions: [], dates: [] });

      /* --- roles card --- */
      var rl = [];
      if (roles.provider) rl.push("Provider");
      if (roles.deployer) rl.push("Deployer");
      if (roles.importer) rl.push("Importer");
      if (roles.distributor) rl.push("Distributor");
      if (roles.authrep) rl.push("Authorised representative");
      var roleWhy = became.slice();
      if (picked(a, "role", "provider")) roleWhy.push(r("You develop the system (or have it developed) and place it on the market or put it into service under your own name.", "Art. 3(3)"));
      if (roles.deployer) roleWhy.push(r("You use the system under your authority in a professional context.", "Art. 3(4)"));
      if (roles.importer) roleWhy.push(r("You place on the EU market a system bearing a non-EU provider’s name.", "Art. 3(6)"));
      if (roles.distributor) roleWhy.push(r("You make the system available on the EU market as a non-provider, non-importer.", "Art. 3(7)"));
      if (roles.authrep) roleWhy.push(r("You hold a written mandate from a non-EU provider.", "Art. 3(5)"));
      if (picked(a, "excl", "foss")) roleWhy.push(r("The open-source exclusion does not help here unless the system is minimal-risk: it never covers prohibited, high-risk or Art. 50 systems.", "Art. 2(12)"));
      if (val(a, "est") !== "eu" && roles.provider && high) roleWhy.push(r("As a non-EU provider of a high-risk system, you must appoint an EU authorised representative by written mandate.", "Art. 22"));
      out.cards.push({ reg: "Your role", title: rl.length ? rl.join(" · ") : "No role selected", status: "applies", label: rl.length ? rl.join(" + ") : "-", reasons: roleWhy, actions: [], dates: [] });

      /* --- obligations card --- */
      var act = [];
      if (tier === "prohibited") {
        act.push("Stop placing on the market, putting into service or using the system for the prohibited purpose.");
        act.push("Get a legal review: some prohibitions carry narrow exceptions (e.g. medical or safety reasons for emotion recognition).");
      }
      if (high && roles.provider) {
        act.push("Provider: risk-management system across the lifecycle (Art. 9).");
        act.push("Provider: data and data governance for training, validation and testing data (Art. 10).");
        act.push("Provider: Annex IV technical documentation and automatic event logging (Arts. 11–12).");
        act.push("Provider: transparency and instructions for use for deployers, human-oversight design, accuracy, robustness and cybersecurity (Arts. 13–15).");
        act.push("Provider: quality management system (Art. 17; simplified for SMEs and small mid-caps), conformity assessment (Art. 43), EU declaration of conformity and CE marking (Arts. 47–48).");
        act.push("Provider: registration in the EU database (Art. 49), post-market monitoring (Art. 72), serious-incident reporting (Art. 73), corrective actions (Art. 20).");
      }
      if (high && roles.deployer) {
        act.push("Deployer: use the system according to its instructions, assign competent human oversight, ensure input data is relevant, monitor operation and keep logs for at least six months (Art. 26).");
        act.push("Deployer: inform workers’ representatives before workplace use, and inform people subject to decisions made or assisted by the system (Art. 26(7), (11)).");
        var fria = pickedAny(a, "annex3", ["svc_credit", "svc_ins"]);
        if (tier === "high_III" && !picked(a, "annex3", "ci")) act.push(fria ? "Deployer: carry out a fundamental-rights impact assessment before first use (Art. 27), mandatory for credit-scoring and life or health insurance pricing." : "Deployer: a fundamental-rights impact assessment (Art. 27) is required if you are a public body or a private entity providing public services.");
        act.push("Deployer: give affected persons an explanation of the system’s role in decisions on request (Art. 86), and use the provider’s information for your GDPR DPIA (Art. 26(9)).");
      }
      if (high && roles.importer) act.push("Importer: verify conformity assessment, technical documentation, CE marking and authorised representative before placing on the market; show your name and address (Art. 23).");
      if (high && roles.distributor) act.push("Distributor: verify CE marking, declaration of conformity and instructions; do not make available a system you believe non-compliant (Art. 24).");
      if (high && roles.authrep) act.push("Authorised representative: keep documentation available to authorities and cooperate with them, as set out in your mandate (Art. 22).");
      if (tier === "derog") {
        if (roles.provider) act.push("Provider: document the Art. 6(3) assessment before placing on the market, provide it to authorities on request (Art. 6(4)), and register the system in the EU database (Art. 49(2)).");
        if (roles.deployer) act.push("Deployer: ensure the provider’s Art. 6(3) assessment matches how you actually use the system. Using it beyond those limited tasks can make it high-risk.");
      }
      if (picked(a, "art50", "chat") && roles.provider) act.push("Provider: design the system so people are informed they are interacting with AI, unless obvious (Art. 50(1)).");
      if (picked(a, "art50", "synth") && roles.provider) act.push("Provider: mark synthetic outputs in a machine-readable, detectable format (Art. 50(2)); for systems on the market before 2 August 2026 this applies from 2 December 2026.");
      if (picked(a, "art50", "emo") && roles.deployer) act.push("Deployer: inform people exposed to emotion recognition or biometric categorisation and process their data in line with the GDPR (Art. 50(3)).");
      if (picked(a, "art50", "deepfake") && roles.deployer) act.push("Deployer: disclose that deepfake content is artificially generated or manipulated (Art. 50(4)); lighter for evidently artistic or satirical works.");
      if (picked(a, "art50", "text") && roles.deployer) act.push("Deployer: disclose AI-generated public-interest text unless it underwent human review and editorial responsibility (Art. 50(4)).");
      if (anyPicked(a, "art50") && !roles.provider && !roles.deployer) act.push("Check with the provider and deployer how the Art. 50 transparency duties are met.");
      act.push("All roles: take measures to support AI literacy of staff dealing with the system (Art. 4, as amended).");
      out.cards.push({ reg: "Obligations", title: "What you need to do", status: high ? "high" : (tier === "prohibited" ? "prohibited" : "applies"), label: "Obligations", reasons: [], actions: act, dates: [] });

      /* --- timeline --- */
      var dates = ["2 Feb 2025: prohibitions (Art. 5) and AI literacy (Art. 4) apply."];
      if (picked(a, "art5", "i")) dates.push("2 Dec 2026: new prohibition on non-consensual intimate imagery and CSAM applies.");
      if (anyPicked(a, "art50")) dates.push("2 Aug 2026: Art. 50 transparency obligations apply (Art. 50(2) marking for legacy generative systems: 2 Dec 2026).");
      if (tier === "high_III" || tier === "derog") dates.push("2 Dec 2027: high-risk obligations for Annex III systems apply (postponed from 2 Aug 2026 by Reg. (EU) 2026/1744).");
      if (tier === "high_I_A" || tier === "high_I_B") dates.push("2 Aug 2028: high-risk obligations for Annex I systems apply (postponed from 2 Aug 2027 by Reg. (EU) 2026/1744).");
      out.cards.push({ reg: "Timeline", title: "Key dates", status: "applies", label: "Dates", reasons: [], actions: [], dates: dates });
      return out;
    }
  };


  /* =================================================================== TOOL 3
   * NIS2: scope and essential / important classification
   * ========================================================================= */
  /* Entity types. ann: Annex I or II · si: in scope regardless of size (Art. 2(2)(a))
   * ess: always essential (Art. 3(1)(b)) · ec: public electronic communications (Art. 3(1)(c))
   * pa: public administration · dig: Implementing Regulation (EU) 2024/2690 applies
   * main: main-establishment jurisdiction rule (Art. 26(1)(b)) · fin: DORA lex specialis */
  var ENT = [
    { v: "en_elec", g: "Annex I · Energy", l: "Electricity: supply, distribution or transmission system operator, producer, NEMO, aggregation, demand response or storage, or operator of recharging points", ann: 1 },
    { v: "en_dh", g: "Annex I · Energy", l: "District heating or cooling operator", ann: 1 },
    { v: "en_oil", g: "Annex I · Energy", l: "Oil: pipeline, production, refining, treatment, storage or transmission operator, or central stockholding entity", ann: 1 },
    { v: "en_gas", g: "Annex I · Energy", l: "Gas: supply undertaking, distribution, transmission or storage operator, LNG system operator, natural gas undertaking, or refining and treatment", ann: 1 },
    { v: "en_h2", g: "Annex I · Energy", l: "Hydrogen production, storage or transmission operator", ann: 1 },
    { v: "tr_air", g: "Annex I · Transport", l: "Air: air carrier, airport managing body or entity operating ancillary airport installations, or air traffic control", ann: 1 },
    { v: "tr_rail", g: "Annex I · Transport", l: "Rail: infrastructure manager or railway undertaking (incl. service-facility operators)", ann: 1 },
    { v: "tr_water", g: "Annex I · Transport", l: "Water: inland, sea or coastal passenger or freight transport company, port managing body, or vessel traffic service operator", ann: 1 },
    { v: "tr_road", g: "Annex I · Transport", l: "Road: road authority responsible for traffic management, or operator of intelligent transport systems", ann: 1 },
    { v: "bank", g: "Annex I · Banking & financial-market infrastructure", l: "Credit institution", ann: 1, fin: true },
    { v: "fmi", g: "Annex I · Banking & financial-market infrastructure", l: "Operator of a trading venue, or central counterparty (CCP)", ann: 1, fin: true },
    { v: "h_prov", g: "Annex I · Health", l: "Healthcare provider", ann: 1 },
    { v: "h_lab", g: "Annex I · Health", l: "EU reference laboratory", ann: 1 },
    { v: "h_rd", g: "Annex I · Health", l: "Research and development of medicinal products", ann: 1 },
    { v: "h_pharma", g: "Annex I · Health", l: "Manufacturer of basic pharmaceutical products and preparations (NACE C21)", ann: 1 },
    { v: "h_md", g: "Annex I · Health", l: "Manufacturer of medical devices considered critical during a public-health emergency", ann: 1 },
    { v: "dw", g: "Annex I · Water", l: "Supplier or distributor of drinking water", d: "Excluding distributors for whom it is a non-essential part of a wider activity", ann: 1 },
    { v: "ww", g: "Annex I · Water", l: "Collection, disposal or treatment of urban, domestic or industrial waste water", d: "Excluding where it is a non-essential part of a wider activity", ann: 1 },
    { v: "di_ixp", g: "Annex I · Digital infrastructure", l: "Internet Exchange Point provider", ann: 1 },
    { v: "di_dns", g: "Annex I · Digital infrastructure", l: "DNS service provider", d: "Excluding operators of root name servers", ann: 1, si: true, ess: true, dig: true, main: true },
    { v: "di_tld", g: "Annex I · Digital infrastructure", l: "TLD name registry", ann: 1, si: true, ess: true, dig: true, main: true },
    { v: "di_cloud", g: "Annex I · Digital infrastructure", l: "Cloud computing service provider", ann: 1, dig: true, main: true },
    { v: "di_dc", g: "Annex I · Digital infrastructure", l: "Data centre service provider", ann: 1, dig: true, main: true },
    { v: "di_cdn", g: "Annex I · Digital infrastructure", l: "Content delivery network provider", ann: 1, dig: true, main: true },
    { v: "di_qtsp", g: "Annex I · Digital infrastructure", l: "Qualified trust service provider", ann: 1, si: true, ess: true, dig: true },
    { v: "di_tsp", g: "Annex I · Digital infrastructure", l: "Non-qualified trust service provider", ann: 1, si: true, dig: true },
    { v: "di_pecn", g: "Annex I · Digital infrastructure", l: "Provider of public electronic communications networks", ann: 1, si: true, ec: true },
    { v: "di_ecs", g: "Annex I · Digital infrastructure", l: "Provider of publicly available electronic communications services", ann: 1, si: true, ec: true },
    { v: "ict_msp", g: "Annex I · ICT service management (B2B)", l: "Managed service provider", ann: 1, dig: true, main: true },
    { v: "ict_mssp", g: "Annex I · ICT service management (B2B)", l: "Managed security service provider", ann: 1, dig: true, main: true },
    { v: "pa_central", g: "Annex I · Public administration", l: "Central government public administration entity", ann: 1, si: true, pa: "central" },
    { v: "pa_regional", g: "Annex I · Public administration", l: "Regional public administration entity", d: "In scope where your Member State includes it after a risk-based assessment", ann: 1, si: true, pa: "regional" },
    { v: "space", g: "Annex I · Space", l: "Operator of ground-based infrastructure supporting space-based services", ann: 1 },
    { v: "post", g: "Annex II · Other critical sectors", l: "Postal or courier service provider", ann: 2 },
    { v: "waste", g: "Annex II · Other critical sectors", l: "Waste management undertaking", d: "Excluding where waste management is not the principal economic activity", ann: 2 },
    { v: "chem", g: "Annex II · Other critical sectors", l: "Manufacture, production or distribution of chemical substances and mixtures, or production of articles from them", ann: 2 },
    { v: "food", g: "Annex II · Other critical sectors", l: "Food business in wholesale distribution or industrial production and processing", ann: 2 },
    { v: "mf_md", g: "Annex II · Manufacturing", l: "Medical devices and in-vitro diagnostic medical devices", ann: 2 },
    { v: "mf_elec", g: "Annex II · Manufacturing", l: "Computer, electronic and optical products (NACE C26)", ann: 2 },
    { v: "mf_eq", g: "Annex II · Manufacturing", l: "Electrical equipment (NACE C27)", ann: 2 },
    { v: "mf_mach", g: "Annex II · Manufacturing", l: "Machinery and equipment n.e.c. (NACE C28)", ann: 2 },
    { v: "mf_veh", g: "Annex II · Manufacturing", l: "Motor vehicles, trailers and semi-trailers (NACE C29)", ann: 2 },
    { v: "mf_trans", g: "Annex II · Manufacturing", l: "Other transport equipment (NACE C30)", ann: 2 },
    { v: "dp_market", g: "Annex II · Digital providers", l: "Online marketplace", ann: 2, dig: true, main: true },
    { v: "dp_search", g: "Annex II · Digital providers", l: "Online search engine", ann: 2, dig: true, main: true },
    { v: "dp_social", g: "Annex II · Digital providers", l: "Social networking services platform", ann: 2, dig: true, main: true },
    { v: "research", g: "Annex II · Research", l: "Research organisation", d: "Education institutions are not covered unless your Member State extends scope", ann: 2 },
    { v: "dreg", g: "Other", l: "Domain-name registration services (registrar, or reseller or agent acting for one)", dreg: true, main: true },
    { v: "fin_other", g: "Other", l: "Other financial entity: insurer, payment or e-money institution, investment firm, crypto-asset service provider, …", fin: true, nonis: true },
    { v: "none", g: "Other", l: "None of the above" }
  ];
  function ent(v) { for (var i = 0; i < ENT.length; i++) if (ENT[i].v === v) return ENT[i]; return null; }

  var nis2 = {
    id: "nis2",
    title: "NIS2: are you in scope?",
    short: "NIS2 checker",
    intro: "Find out whether your organisation is covered by the NIS2 Directive and, if so, whether it is an essential or an important entity: the difference decides how you are supervised and how high the fines can go.",
    sections: ["EU activity", "Entity type", "Size", "Designation"],
    start: "eu",
    nodes: {
      eu: {
        section: "EU activity",
        q: "Do you provide services or carry out activities in the EU?",
        ref: "Art. 2(1), 26 NIS2",
        options: [
          { v: "eu", l: "Yes, and we are established in the EU" },
          { v: "non", l: "Yes, but we are established outside the EU" },
          { v: "none", l: "No" }
        ],
        next: function (a) { return is(a, "eu", "none") ? null : "type"; }
      },
      type: {
        section: "Entity type",
        q: "Which entity type best describes your main activity?",
        help: "Choose the type that matches your main activity in the EU. If several apply, run the checker for each: you may be essential for one activity and important for another. Annex I sectors are of high criticality; Annex II sectors are other critical sectors.",
        ref: "Annexes I and II NIS2",
        select: true,
        options: ENT,
        next: function (a) {
          var e = ent(val(a, "type"));
          if (!e) return null;
          if (e.nonis) return null;
          if (e.pa) return "pa_excl";
          if (e.ess || e.dreg) return "desig";
          if (e.v === "none") return "desig";
          return "size";
        }
      },
      pa_excl: {
        section: "Entity type",
        q: "Does your entity carry out activities in national security, public security, defence or law enforcement, or is it the judiciary, a parliament or a central bank?",
        ref: "Art. 2(7) and Annex I, point 10 NIS2",
        options: [
          { v: "yes", l: "Yes" },
          { v: "no", l: "No" }
        ],
        next: function (a) { return is(a, "pa_excl", "yes") ? null : "desig"; }
      },
      size: {
        section: "Size",
        q: "How large is your organisation?",
        help: "Thresholds follow Commission Recommendation 2003/361/EC. Add the figures of partner enterprises (25–50% holdings, pro rata) and linked enterprises (over 50%, in full). Staff is counted in annual work units. Your Member State may take into account how independent you are from your group (recital 16 NIS2).",
        ref: "Art. 2(1) NIS2 · Recommendation 2003/361/EC",
        options: [
          { v: "large", l: "Large: 250+ staff, or annual turnover above €50m and balance-sheet total above €43m" },
          { v: "medium", l: "Medium: 50–249 staff, or turnover and balance-sheet total both above €10m (and not large)" },
          { v: "small", l: "Small or micro: under 50 staff, and turnover or balance-sheet total of €10m or less" }
        ],
        next: function (a) {
          var e = ent(val(a, "type"));
          return (is(a, "size", "large") && e && e.ann === 1) ? "smc" : "desig";
        }
      },
      smc: {
        section: "Size",
        q: "Do you have fewer than 750 staff, and turnover of €150m or less (or balance-sheet total of €129m or less)?",
        help: "This tests the proposed new “small mid-cap” category in the Commission’s January 2026 NIS2 amendment, COM(2026) 13. It is not yet law and does not change today’s result; we show its likely effect.",
        ref: "Proposal COM(2026) 13 (pending)",
        options: [
          { v: "yes", l: "Yes" },
          { v: "no", l: "No" }
        ],
        next: function () { return "desig"; }
      },
      desig: {
        section: "Designation",
        multi: true,
        q: "Has any of the following happened?",
        help: "Member States identify entities that are in scope regardless of size, for example because they are the sole provider of a critical service, or because a disruption could have a significant impact on public safety or create systemic risk. If you have received such a notification, select it.",
        ref: "Art. 2(2)(b)–(e), 2(3), 3(1)(e)–(g) NIS2",
        options: [
          { v: "cer", l: "We have been identified as a critical entity under the CER Directive (EU) 2022/2557" },
          { v: "ess", l: "Our national authority has identified us as an essential entity" },
          { v: "imp", l: "Our national authority has identified us as an important entity" },
          { v: "oes", l: "We were an operator of essential services under NIS1 and our Member State kept that status" },
          NONE
        ],
        next: function () { return null; }
      }
    },

    evaluate: function (a) {
      var e = ent(val(a, "type")) || {};
      var size = val(a, "size");
      var why = [], status, title, text, cls = null;
      var notes = [];

      if (is(a, "eu", "none")) {
        status = "no"; title = "Not in scope";
        text = "NIS2 applies to entities that provide services or carry out activities in the EU.";
        why.push(r("No services or activities in the EU.", "Art. 2(1)"));
      } else if (e.nonis) {
        status = "no"; title = "Not covered by NIS2: DORA applies";
        text = "Insurers, payment and e-money institutions, investment firms and other financial entities are not NIS2 entity types. Their ICT security and incident reporting is governed by DORA.";
        why.push(r("Not listed in Annex I or II NIS2; covered by DORA.", "Annexes I–II NIS2 · Art. 2 DORA"));
      } else if (e.pa && is(a, "pa_excl", "yes")) {
        status = "no"; title = "Excluded";
        text = "Public administration entities carrying out national-security, public-security, defence or law-enforcement activities, and the judiciary, parliaments and central banks, are outside NIS2.";
        why.push(r("Excluded public administration entity.", "Art. 2(7) and Annex I, point 10"));
      } else {
        var d = val(a, "desig") || [];
        var has = function (k) { return d.indexOf(k) !== -1; };
        /* Rules, in order. First match decides essential; important is the fallback for in-scope entities. */
        if (e.dreg && !has("cer") && !has("ess") && !has("imp")) {
          cls = "dreg";
          why.push(r("Entities providing domain-name registration services are covered regardless of size for the purposes of Art. 28 (accurate and complete domain-registration data).", "Art. 2(4), 28"));
        } else if (e.ess) {
          cls = "essential";
          why.push(r(e.l + ": essential regardless of size.", "Art. 3(1)(b)"));
        } else if (e.pa === "central") {
          cls = "essential";
          why.push(r("Central government public administration entity.", "Art. 2(2)(f)(i), 3(1)(d)"));
        } else if (has("cer")) {
          cls = "essential";
          why.push(r("Identified as a critical entity under the CER Directive: in scope and essential regardless of size.", "Art. 2(3), 3(1)(f)"));
        } else if (e.ec && (size === "medium" || size === "large")) {
          cls = "essential";
          why.push(r("Provider of public electronic communications networks or services of at least medium size.", "Art. 3(1)(a), (c)"));
        } else if (e.ann === 1 && size === "large") {
          cls = "essential";
          why.push(r("Annex I entity exceeding the medium-sized enterprise ceilings.", "Art. 3(1)(a)"));
        } else if (has("ess")) {
          cls = "essential";
          why.push(r("Identified by your Member State as an essential entity.", "Art. 2(2)(b)–(e), 3(1)(e)"));
        } else if (has("oes")) {
          cls = "essential";
          why.push(r("Former NIS1 operator of essential services, kept as essential by your Member State.", "Art. 3(1)(g)"));
        } else if (e.ann && (size === "medium" || size === "large" || e.si)) {
          cls = "important";
          if (e.pa === "regional") why.push(r("Regional public administration entity (where your Member State includes it).", "Art. 2(2)(f)(ii), 3(2)"));
          else if (e.si && size === "small") why.push(r(e.l + ": in scope regardless of size; as a small or micro entity it is important.", "Art. 2(2)(a), 3(2)"));
          else why.push(r((e.ann === 1 ? "Annex I entity of medium size." : "Annex II entity of " + size + " size.") + " Entities in scope that are not essential are important.", "Art. 2(1), 3(2)"));
        } else if (has("imp")) {
          cls = "important";
          why.push(r("Identified by your Member State as an important entity.", "Art. 2(2)(b)–(e), 3(2)"));
        }

        if (cls === "essential") {
          status = "essential"; title = "Essential entity";
          text = "You are in scope as an essential entity: the stricter tier, with proactive (ex ante) supervision.";
        } else if (cls === "important") {
          status = "important"; title = "Important entity";
          text = "You are in scope as an important entity: the same security and reporting obligations as essential entities, with reactive (ex post) supervision and lower maximum fines.";
        } else if (cls === "dreg") {
          status = "review"; title = "In scope for domain-registration data only";
          text = "As a domain-name registration service you must keep accurate and complete registration data and publish or disclose it as Art. 28 requires. The wider Art. 20–23 obligations apply only if you are also another in-scope entity type, such as a DNS provider.";
        } else {
          status = "no"; title = "Not in scope";
          if (e.v === "none" || !e.v) {
            text = "Your activity is not an entity type listed in Annex I or II. Your Member State may have extended national scope (e.g. to education), and your NIS2 customers may impose security requirements on you as a supplier (Art. 21(2)(d)).";
            why.push(r("Not an Annex I or II entity type.", "Art. 2(1)"));
          } else {
            text = "Small and micro entities of this type are outside NIS2 unless your Member State identifies them under Art. 2(2)(b)–(e). Expect security clauses from NIS2-covered customers who must manage supply-chain risk.";
            why.push(r(e.l + " that is a small or micro enterprise.", "Art. 2(1)"));
          }
        }
        if (e.pa === "regional" && cls) notes.push("Regional public administration entities are in scope only where the Member State includes them after a risk-based assessment (Art. 2(2)(f)(ii)).");
        if (is(a, "eu", "non") && e.main) notes.push("You are not established in the EU but offer services here: designate a representative in a Member State where you offer services; you then fall under that Member State’s jurisdiction (Art. 26(3)).");
        else if (is(a, "eu", "non") && cls) notes.push("NIS2 is enforced through national transposition laws. Check whether the Member States where you operate treat you as in scope despite having no EU establishment.");
        if (e.main && cls) notes.push("For your entity type, jurisdiction lies with the Member State of your main establishment in the EU, not every Member State you serve (Art. 26(1)(b)).");
        if (e.fin && cls) notes.push("DORA is lex specialis: as a credit institution or financial-market infrastructure, DORA’s ICT risk-management and incident-reporting rules replace the equivalent NIS2 obligations (Art. 4 NIS2, recital 28).");
        if (is(a, "smc", "yes") && cls === "essential" && e.ann === 1 && !e.ess && !e.ec && !has("cer") && !has("ess") && !has("oes")) notes.push("Pending reform: under the Commission’s January 2026 proposal COM(2026) 13, small mid-caps (fewer than 750 staff and turnover ≤ €150m or balance sheet ≤ €129m) would generally be important rather than essential entities. This is not yet law.");
        if (e.v === "en_elec" && cls) notes.push("Pending reform: COM(2026) 13 would limit electricity producers in scope to those above 1 MW of generation capacity. Not yet law.");
        if (e.v === "chem" && cls) notes.push("Pending reform: COM(2026) 13 would limit the chemicals sector to manufacturers subject to REACH, removing pure importers and distributors. Not yet law.");
      }

      var out = { headline: { status: status, title: title, text: text }, cards: [] };
      out.cards.push({ reg: "Classification", title: "Why", status: status, label: title, reasons: why, actions: [], dates: [], notes: notes });

      if (status === "essential" || status === "important") {
        var act = [
          "Governance: your management body must approve and oversee the cybersecurity risk-management measures, follow regular training, and can be held liable for infringements (Art. 20).",
          "Risk management: implement appropriate and proportionate technical, operational and organisational measures covering at least the ten Art. 21(2) areas: risk analysis and security policies; incident handling; business continuity, backup and crisis management; supply-chain security; secure acquisition, development and maintenance, including vulnerability handling and disclosure; effectiveness assessment; cyber hygiene and training; cryptography and encryption; HR security, access control and asset management; multi-factor authentication and secured communications.",
          "Incident reporting to your CSIRT or competent authority for significant incidents: early warning within 24 hours, incident notification within 72 hours, intermediate reports on request, final report within one month (Art. 23).",
          "Registration: submit your entity details to the competent authority, and keep them up to date (Art. 3(4), 27)."
        ];
        if (e.dig) act.push("As a digital-infrastructure or digital-provider entity, apply Commission Implementing Regulation (EU) 2024/2690, which sets the technical requirements and the significance thresholds for incidents.");
        if (e.ec) act.push("As a public electronic communications provider, inform your service recipients of significant cyber threats and possible remedies (Art. 23(2)).");
        act.push("Use of certified ICT products, services and processes may be required by your Member State (Art. 24).");
        var sup = status === "essential"
          ? ["Supervision: ex ante. Authorities may run on-site inspections, regular and targeted audits, security scans and request evidence at any time (Art. 32).", "Fines: up to at least €10m or 2% of total worldwide annual turnover, whichever is higher (Art. 34(4)). Temporary suspension of certifications and of managers’ functions is possible (Art. 32(5))."]
          : ["Supervision: ex post. Authorities act when they have evidence or indications of non-compliance (Art. 33).", "Fines: up to at least €7m or 1.4% of total worldwide annual turnover, whichever is higher (Art. 34(5))."];
        out.cards.push({ reg: "Obligations", title: "What you need to do", status: status, label: "Obligations", reasons: [], actions: act.concat(sup), dates: [] });
        out.cards.push({ reg: "Timeline & local rules", title: "Key dates", status: "applies", label: "Dates", reasons: [], actions: [], dates: [
          "17 Oct 2024: transposition deadline; national NIS2 laws apply from their entry into force.",
          "17 Apr 2025: Member States’ deadline to establish their lists of essential and important entities.",
          "Romania: NIS2 was transposed by Government Emergency Ordinance (OUG) no. 155/2024; the competent authority is the National Cyber Security Directorate (DNSC).",
          "Pending: the targeted NIS2 amendment COM(2026) 13 (January 2026) is in negotiation between Parliament and Council."
        ] });
      }
      return out;
    }
  };

  var TOOLS = { general: general, aiact: aiact, nis2: nis2 };

  /* ========================================================================
   * UI engine (browser only)
   * ====================================================================== */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function paras(s) { return String(s).split("\n\n").map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); }

  var STATUS_LABEL = { applies: "Applies", likely: "Likely", indirect: "Indirect", review: "Review", no: "Does not apply", prohibited: "Prohibited", high: "High-risk", essential: "Essential", important: "Important" };

  function Checker(el, tool) {
    this.el = el; this.tool = tool;
    this.reset();
  }
  Checker.prototype.reset = function () {
    this.answers = {}; this.history = []; this.current = this.tool.start; this.done = false; this.draft = null;
  };
  /* Answers that are on the current path only (back-navigation drops stale branches). */
  Checker.prototype.pathAnswers = function () {
    var out = {}, self = this;
    this.history.forEach(function (id) { if (id in self.answers) out[id] = self.answers[id]; });
    return out;
  };
  Checker.prototype.answer = function (value) {
    var node = this.tool.nodes[this.current];
    this.answers[this.current] = value;
    this.history.push(this.current);
    var nxt = node.next(this.pathAnswers());
    if (nxt) { this.current = nxt; } else { this.done = true; this.current = null; }
    this.draft = null;
    this.render(true);
  };
  Checker.prototype.back = function () {
    if (!this.history.length) return;
    this.current = this.history.pop();
    this.done = false;
    var prev = this.answers[this.current];
    this.draft = Array.isArray(prev) ? prev.slice() : null;
    this.render(true);
  };
  Checker.prototype.restart = function () { this.reset(); this.render(true); };

  Checker.prototype.render = function (focus) {
    var t = this.tool, html = "";
    var secIdx = this.done ? t.sections.length : t.sections.indexOf(t.nodes[this.current].section);
    html += '<div class="ck-steps" aria-hidden="true">';
    t.sections.forEach(function (s, i) {
      html += '<span class="ck-step' + (i < secIdx ? " is-done" : "") + (i === secIdx ? " is-current" : "") + '">' + esc(s) + "</span>";
    });
    html += "</div>";
    html += '<div class="ck-bar"><span style="width:' + Math.round(100 * Math.min(secIdx, t.sections.length) / t.sections.length) + '%"></span></div>';
    html += this.done ? this.renderResult() : this.renderNode();
    this.el.innerHTML = html;
    this.bind();
    if (focus) {
      var h = this.el.querySelector("[data-ck-focus]");
      if (h) { h.focus({ preventScroll: true }); var nav = document.getElementById("top"); var top = this.el.getBoundingClientRect().top + window.pageYOffset - (nav ? nav.offsetHeight : 0) - 16; if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: "smooth" }); }
    }
  };

  Checker.prototype.renderNode = function () {
    var n = this.tool.nodes[this.current], self = this, html = "";
    var qn = this.history.length + 1;
    html += '<div class="ck-q">';
    html += '<div class="ck-eyebrow">' + esc(n.section) + " · Question " + qn + "</div>";
    html += '<h3 class="ck-title" tabindex="-1" data-ck-focus>' + esc(n.q) + "</h3>";
    if (n.help) html += '<details class="ck-help"><summary>What does this mean?</summary>' + paras(n.help) + "</details>";
    if (n.select) {
      var prev = this.answers[this.current] || "";
      var groups = [], byG = {};
      n.options.forEach(function (o) { if (!byG[o.g]) { byG[o.g] = []; groups.push(o.g); } byG[o.g].push(o); });
      html += '<label class="ck-label" for="ck-sel-' + this.tool.id + '">Entity type</label><select class="ck-select" id="ck-sel-' + this.tool.id + '" data-ck-select><option value="">Select…</option>';
      groups.forEach(function (g) {
        html += '<optgroup label="' + esc(g) + '">';
        byG[g].forEach(function (o) { html += '<option value="' + o.v + '"' + (prev === o.v ? " selected" : "") + ">" + esc(o.l) + "</option>"; });
        html += "</optgroup>";
      });
      html += "</select>";
      html += '<div class="ck-sel-desc" data-ck-seldesc></div>';
      html += '<div class="ck-nav"><button type="button" class="ck-btn ck-primary" data-ck-continue disabled>Continue →</button>' + (this.history.length ? '<button type="button" class="ck-btn ck-ghost" data-ck-back>← Back</button>' : "") + "</div>";
    } else if (n.multi) {
      var sel = this.draft || [];
      html += '<div class="ck-hint">Select all that apply.</div><div class="ck-opts" role="group" aria-label="' + esc(n.q) + '">';
      var lastG = null;
      n.options.forEach(function (o) {
        if (o.g && o.g !== lastG) { html += '<div class="ck-group">' + esc(o.g) + "</div>"; lastG = o.g; }
        var on = sel.indexOf(o.v) !== -1;
        html += '<button type="button" class="ck-opt ck-check' + (o.none ? " ck-none" : "") + (on ? " is-on" : "") + '" aria-pressed="' + on + '" data-ck-toggle="' + o.v + '"><span class="ck-box" aria-hidden="true"></span><span><span class="ck-ol">' + esc(o.l) + "</span>" + (o.d ? '<span class="ck-od">' + esc(o.d) + "</span>" : "") + "</span></button>";
      });
      html += "</div>";
      html += '<div class="ck-nav"><button type="button" class="ck-btn ck-primary" data-ck-continue' + (sel.length ? "" : " disabled") + ">Continue →</button>" + (this.history.length ? '<button type="button" class="ck-btn ck-ghost" data-ck-back>← Back</button>' : "") + "</div>";
    } else {
      var cur = this.answers[this.current];
      html += '<div class="ck-opts">';
      n.options.forEach(function (o) {
        html += '<button type="button" class="ck-opt' + (cur === o.v ? " is-on" : "") + '" data-ck-pick="' + o.v + '"><span><span class="ck-ol">' + esc(o.l) + "</span>" + (o.d ? '<span class="ck-od">' + esc(o.d) + "</span>" : "") + '</span><span class="ck-arrow" aria-hidden="true">→</span></button>';
      });
      html += "</div>";
      if (this.history.length) html += '<div class="ck-nav"><button type="button" class="ck-btn ck-ghost" data-ck-back>← Back</button></div>';
    }
    if (n.ref) html += '<div class="ck-ref">Legal basis: ' + esc(n.ref) + "</div>";
    html += "</div>";
    void self;
    return html;
  };

  Checker.prototype.renderResult = function () {
    var res = this.tool.evaluate(this.pathAnswers()), html = "", self = this;
    var h = res.headline;
    html += '<div class="ck-result">';
    html += '<div class="ck-head ck-s-' + h.status + '"><div class="ck-eyebrow">Your result</div><h3 class="ck-title" tabindex="-1" data-ck-focus>' + esc(h.title) + '</h3><p>' + esc(h.text) + "</p></div>";
    html += '<div class="ck-cards">';
    res.cards.forEach(function (c) {
      html += '<div class="ck-card">';
      html += '<div class="ck-card-top"><div><div class="ck-reg">' + esc(c.reg) + '</div><div class="ck-card-title">' + esc(c.title) + "</div></div>";
      if (self.tool.id === "general") html += '<span class="ck-pill ck-s-' + c.status + '">' + esc(c.label || STATUS_LABEL[c.status] || "") + "</span>";
      html += "</div>";
      if (c.reasons && c.reasons.length) {
        html += '<ul class="ck-why">';
        c.reasons.forEach(function (x) { html += "<li>" + esc(x.text) + (x.ref ? ' <span class="ck-cite">' + esc(x.ref) + "</span>" : "") + "</li>"; });
        html += "</ul>";
      }
      if (c.actions && c.actions.length) {
        html += '<div class="ck-sub">What this means for you</div><ul class="ck-acts">';
        c.actions.forEach(function (x) { html += "<li>" + esc(x) + "</li>"; });
        html += "</ul>";
      }
      if (c.notes && c.notes.length) {
        html += '<div class="ck-sub">Good to know</div><ul class="ck-acts">';
        c.notes.forEach(function (x) { html += "<li>" + esc(x) + "</li>"; });
        html += "</ul>";
      }
      if (c.dates && c.dates.length) {
        html += '<div class="ck-sub">Key dates</div><ul class="ck-acts ck-dates">';
        c.dates.forEach(function (x) { html += "<li>" + esc(x) + "</li>"; });
        html += "</ul>";
      }
      if (c.link && c.status !== "no") html += '<a class="ck-link" href="#' + c.link.tool + '-checker" data-ck-goto="' + c.link.tool + '">' + esc(c.link.label) + "</a>";
      html += "</div>";
    });
    html += "</div>";

    /* answer recap */
    var a = this.pathAnswers(), t = this.tool;
    html += '<details class="ck-recap"><summary>Your answers</summary><ol>';
    this.history.forEach(function (id) {
      var n = t.nodes[id], v = a[id], vals = Array.isArray(v) ? v : [v];
      var labels = vals.map(function (x) { for (var i = 0; i < n.options.length; i++) if (n.options[i].v === x) return n.options[i].l; return x; });
      html += "<li><strong>" + esc(n.q) + "</strong><br>" + esc(labels.join("; ")) + "</li>";
    });
    html += "</ol></details>";

    html += '<div class="ck-nav ck-end">';
    html += '<a class="ck-btn ck-primary" href="mailto:hello@senecai.eu?subject=' + encodeURIComponent("Compliance checker result: " + h.title) + '">Discuss your result with us →</a>';
    html += '<button type="button" class="ck-btn ck-ghost" data-ck-back>← Change last answer</button>';
    html += '<button type="button" class="ck-btn ck-ghost" data-ck-restart>Start over</button>';
    html += '<button type="button" class="ck-btn ck-ghost" data-ck-print>Print / save as PDF</button>';
    html += "</div>";
    html += '<p class="ck-disclaimer">This checker applies a fixed set of rules to your answers. It gives general information, not legal advice, and is no substitute for an assessment of your specific situation. Legal position as of October 2026, including the AI Act as amended by Regulation (EU) 2026/1744.</p>';
    html += "</div>";
    return html;
  };

  Checker.prototype.bind = function () {
    var self = this, el = this.el;
    var node = this.current ? this.tool.nodes[this.current] : null;
    el.querySelectorAll("[data-ck-pick]").forEach(function (b) {
      b.addEventListener("click", function () { self.answer(b.getAttribute("data-ck-pick")); });
    });
    el.querySelectorAll("[data-ck-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-ck-toggle"), d = self.draft || [];
        if (v === "none") d = d.indexOf("none") !== -1 ? [] : ["none"];
        else {
          d = d.filter(function (x) { return x !== "none"; });
          d = d.indexOf(v) !== -1 ? d.filter(function (x) { return x !== v; }) : d.concat([v]);
        }
        self.draft = d;
        el.querySelectorAll("[data-ck-toggle]").forEach(function (o) {
          var on = d.indexOf(o.getAttribute("data-ck-toggle")) !== -1;
          o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", on);
        });
        var c = el.querySelector("[data-ck-continue]"); if (c) c.disabled = !d.length;
      });
    });
    var selEl = el.querySelector("[data-ck-select]");
    if (selEl) {
      var upd = function () {
        var o = ent(selEl.value), desc = el.querySelector("[data-ck-seldesc]");
        desc.textContent = o && o.d ? o.d : "";
        el.querySelector("[data-ck-continue]").disabled = !selEl.value;
      };
      selEl.addEventListener("change", upd); upd();
    }
    var cont = el.querySelector("[data-ck-continue]");
    if (cont) cont.addEventListener("click", function () {
      if (node && node.select) { if (selEl.value) self.answer(selEl.value); }
      else if (self.draft && self.draft.length) self.answer(self.draft.slice());
    });
    el.querySelectorAll("[data-ck-back]").forEach(function (b) { b.addEventListener("click", function () { self.back(); }); });
    var rs = el.querySelector("[data-ck-restart]"); if (rs) rs.addEventListener("click", function () { self.restart(); });
    var pr = el.querySelector("[data-ck-print]"); if (pr) pr.addEventListener("click", function () { window.print(); });
    el.querySelectorAll("[data-ck-goto]").forEach(function (l) {
      l.addEventListener("click", function (ev) { ev.preventDefault(); if (root.SenecaiCheckers.activate) root.SenecaiCheckers.activate(l.getAttribute("data-ck-goto"), true); });
    });
  };

  /* Tabs + hash routing: #general-checker, #aiact-checker, #nis2-checker */
  function mount() {
    var wrap = document.querySelector("[data-checkers]");
    if (!wrap) return;
    var instances = {};
    wrap.querySelectorAll("[data-checker]").forEach(function (panel) {
      var id = panel.getAttribute("data-checker");
      var mountEl = panel.querySelector("[data-ck-mount]");
      instances[id] = new Checker(mountEl, TOOLS[id]);
      instances[id].render(false);
    });
    var tabs = wrap.querySelectorAll("[data-ck-tab]");
    function activate(id, scroll) {
      if (!instances[id]) return;
      tabs.forEach(function (tb) {
        var on = tb.getAttribute("data-ck-tab") === id;
        tb.setAttribute("aria-selected", on); tb.classList.toggle("is-active", on); tb.tabIndex = on ? 0 : -1;
      });
      wrap.querySelectorAll("[data-checker]").forEach(function (p) { p.hidden = p.getAttribute("data-checker") !== id; });
      if (history.replaceState) history.replaceState(null, "", "#" + id + "-checker");
      if (scroll) { var nav = document.getElementById("top"); var top = wrap.getBoundingClientRect().top + window.pageYOffset - (nav ? nav.offsetHeight : 0) - 16; window.scrollTo({ top: top, behavior: "smooth" }); }
    }
    root.SenecaiCheckers.activate = activate;
    tabs.forEach(function (tb, i) {
      tb.addEventListener("click", function () { activate(tb.getAttribute("data-ck-tab"), false); });
      tb.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
        var n = tabs[(i + (ev.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); activate(n.getAttribute("data-ck-tab"), false);
      });
    });
    function fromHash(scroll) {
      var m = /^#(general|aiact|nis2)-checker$/.exec(location.hash);
      if (m) activate(m[1], scroll);
    }
    fromHash(true);
    window.addEventListener("hashchange", function () { fromHash(true); });
    document.querySelectorAll("[data-ck-open]").forEach(function (l) {
      l.addEventListener("click", function (ev) { ev.preventDefault(); activate(l.getAttribute("data-ck-open"), true); });
    });
  }

  root.SenecaiCheckers = { tools: TOOLS, Checker: Checker };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SenecaiCheckers;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }
})(typeof window !== "undefined" ? window : globalThis);

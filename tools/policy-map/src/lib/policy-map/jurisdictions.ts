// Generated from the SenecAI Global AI Policy Report (First Edition, August 2026).
// 22 jurisdictions scored on a 15-criterion rubric across five weighted pillars.

export type JurisdictionKind = 'country' | 'state' | 'marker';

export interface Pillars {
    legal: number;
    operational: number;
    enforcement: number;
    penalty: number;
    extraterritorial: number;
}

export interface OnePagerSection {
    label: string;
    text: string;
}

export interface Jurisdiction {
    key: string;
    display: string;
    archetype: string;
    kind: JurisdictionKind;
    /** GeoJSON feature name this jurisdiction paints on the map. */
    match: string | null;
    lat: number | null;
    lon: number | null;
    rank: number;
    tier: 1 | 2 | 3;
    composite: number;
    pillars: Pillars;
    tagline: string;
    intro: string;
    sections: OnePagerSection[];
}

export const PILLAR_LABELS: { key: keyof Pillars; label: string; weight: string }[] = [
    { key: 'legal', label: 'Legal Density', weight: '25%' },
    { key: 'operational', label: 'Operational Burden', weight: '25%' },
    { key: 'enforcement', label: 'Enforcement Capacity', weight: '20%' },
    { key: 'penalty', label: 'Penalty Severity', weight: '15%' },
    { key: 'extraterritorial', label: 'Extraterritorial Reach', weight: '15%' },
];

export const JURISDICTIONS: Jurisdiction[] = [
    {
        "key": "Italy",
        "display": "Italy",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "Italy",
        "lat": null,
        "lon": null,
        "rank": 1,
        "tier": 1,
        "composite": 91.2,
        "pillars": {
            "legal": 95,
            "operational": 100,
            "enforcement": 88.3,
            "penalty": 91.7,
            "extraterritorial": 73.3
        },
        "tagline": "EU Member State — National AI Statute Layered on the AI Act",
        "intro": "Italy was the first EU member state to enact a dedicated, comprehensive national AI law, layering domestic criminal and civil provisions on top of the EU AI Act rather than merely transposing it.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "Law No. 132/2025 entered into force on 10 October 2025, making Italy the first EU country with a standalone national AI statute. Two implementing decrees received preliminary Council of Ministers approval on 10 June 2026 but are not yet in force; final adoption is expected within the October 2026 delegation deadline."
            },
            {
                "label": "Enforcement architecture",
                "text": "A dual-authority model: the Agency for Digital Italy (AgID) acts as notifying authority and drives conformity assessment, while the National Cybersecurity Agency (ACN) is the market surveillance authority with inspection and sanctioning power."
            },
            {
                "label": "Deployer obligations",
                "text": "Mandatory AI training obligations across public administration, healthcare, and professional sectors; restrictions on police use of biometric AI; sector-specific rules for healthcare, employment, justice, and education."
            },
            {
                "label": "Penalty architecture",
                "text": "Graduated administrative fines aligned with the EU AI Act's ceilings, reinforced by a new standalone criminal offence (Article 437-bis of the Criminal Code) and a civil liability presumption shifting evidentiary burden toward deployers."
            },
            {
                "label": "Distinctive feature",
                "text": "Italy is the only jurisdiction in this Index that pairs the EU AI Act with independent national criminal exposure."
            },
            {
                "label": "What to watch",
                "text": "Both implementing decrees are still pre-final. Track the October 2026 delegation deadline, since the decrees will fix the operative AgID/ACN division of labour."
            }
        ]
    },
    {
        "key": "France",
        "display": "France",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "France",
        "lat": null,
        "lon": null,
        "rank": 2,
        "tier": 1,
        "composite": 90.6,
        "pillars": {
            "legal": 91.7,
            "operational": 100,
            "enforcement": 93.3,
            "penalty": 90,
            "extraterritorial": 70
        },
        "tagline": "EU Member State — Designation Gap, Sector-Split Model Proposed",
        "intro": "France has not formally designated its national competent authorities under the EU AI Act. A sector-split coordination model has been proposed since September 2025 but remains before Parliament.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "France has no standalone national AI statute; the EU AI Act applies directly. A government scheme designating competent authorities was published 9 September 2025, but as of mid-2026 is still not formally enacted."
            },
            {
                "label": "Enforcement architecture (proposed)",
                "text": "DGCCRF as proposed coordinator under Article 70; CNIL as de facto lead for AI systems processing personal data and biometrics; Arcom for audiovisual content and deepfakes; ACPR for finance; ANSSI for cybersecurity; HAS/ANSM for health AI."
            },
            {
                "label": "Deployer obligations",
                "text": "No additional French-specific obligations beyond the AI Act itself. CNIL has published extensive GDPR-AI guidance and a voluntary sandbox programme."
            },
            {
                "label": "Penalty architecture",
                "text": "EU AI Act ceilings apply directly — up to €35 million or 7% of global turnover for prohibited practices, up to €15 million or 3% for other high-risk breaches."
            },
            {
                "label": "Distinctive feature",
                "text": "France is one of the clearest designation-gap cases among major EU economies: a workable multi-regulator structure has been on the table since September 2025, but formal adoption has not followed."
            },
            {
                "label": "What to watch",
                "text": "CNIL, Arcom, and DGCCRF are already operating in a de facto capacity. Track the parliamentary calendar for formal enactment of the September 2025 scheme."
            }
        ]
    },
    {
        "key": "Spain",
        "display": "Spain",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "Spain",
        "lat": null,
        "lon": null,
        "rank": 3,
        "tier": 1,
        "composite": 90.2,
        "pillars": {
            "legal": 96.3,
            "operational": 100,
            "enforcement": 93,
            "penalty": 76.7,
            "extraterritorial": 73.3
        },
        "tagline": "EU Member State — Most Operational Dedicated AI Authority in the EU",
        "intro": "Spain pairs the EU's most mature dedicated AI regulator with a national AI statute still moving through Parliament, giving deployers earlier practical guidance than most member states.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The draft Organic Law for the Proper Use and Governance of Artificial Intelligence was approved by the Council of Ministers on 26 May 2026 and published in the Official Journal of Parliament on 12 June 2026. The bill remains in Congress."
            },
            {
                "label": "Enforcement architecture",
                "text": "AESIA (Agencia Española de Supervisión de la Inteligencia Artificial) has been operational since 2024, held full sanctioning powers since August 2025, and runs the EU's first operational AI regulatory sandbox with more than a dozen active projects."
            },
            {
                "label": "Deployer obligations",
                "text": "The draft law adds market governance and supervision structures, formalises the sandbox regime, and sets rules for responsible AI use in the public sector — largely institutional rather than new substantive obligations beyond the AI Act."
            },
            {
                "label": "Penalty architecture",
                "text": "Aligned to EU AI Act ceilings: up to €35 million or 7% of global turnover for the most serious violations, down to €500,000 or 0.5% of turnover for the least serious."
            },
            {
                "label": "Distinctive feature",
                "text": "Spain is the only EU member state with a purpose-built, fully operational AI regulator rather than a repurposed or fragmented structure."
            },
            {
                "label": "What to watch",
                "text": "The national AI law remains in Congress; AESIA has flagged its existing guidance will be revised once the Digital Omnibus is formally adopted at EU level."
            }
        ]
    },
    {
        "key": "Germany",
        "display": "Germany",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "Germany",
        "lat": null,
        "lon": null,
        "rank": 4,
        "tier": 1,
        "composite": 87.5,
        "pillars": {
            "legal": 88.3,
            "operational": 100,
            "enforcement": 88.3,
            "penalty": 78.3,
            "extraterritorial": 73.3
        },
        "tagline": "EU Member State — Institutional Implementation, Not Yet in Force",
        "intro": "Germany's national AI legislation is purely institutional: it creates no new substantive obligations beyond the AI Act itself, but as of mid-2026 it still is not in force.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The AI Market Surveillance and Innovation Promotion Act (KI-MIG) advanced to a Federal Cabinet draft on 10–11 February 2026 and passed the Bundestag on 11 June 2026. It still requires Bundesrat consideration and formal promulgation."
            },
            {
                "label": "Enforcement architecture",
                "text": "The Bundesnetzagentur (BNetzA) is designated as the central market surveillance authority, notifying authority, and single point of contact with the EU AI Office. BaFin retains financial-sector AI jurisdiction; BfDI keeps data-protection oversight."
            },
            {
                "label": "Deployer obligations",
                "text": "KI-MIG adds no new substantive compliance requirements — obligations remain those set directly by the EU AI Act. Its function is procedural: fixing competent authorities, cooperation, and the national fine procedure."
            },
            {
                "label": "Penalty architecture",
                "text": "Fines follow the AI Act's own ceilings (up to €35 million or 7% of global turnover for prohibited practices); KI-MIG supplies domestic procedural mechanics rather than a separate scale."
            },
            {
                "label": "Distinctive feature",
                "text": "Germany chose consolidation over creation: no new AI-specific regulator, but a strong central authority (BNetzA) layered onto existing sectoral bodies."
            },
            {
                "label": "What to watch",
                "text": "KI-MIG has cleared the Bundestag but not the Bundesrat, with no confirmed entry-into-force date. Substantive obligations are already live under the AI Act directly."
            }
        ]
    },
    {
        "key": "China",
        "display": "China",
        "archetype": "Centralized/Sovereign",
        "kind": "country",
        "match": "China",
        "lat": null,
        "lon": null,
        "rank": 5,
        "tier": 1,
        "composite": 87.1,
        "pillars": {
            "legal": 91.7,
            "operational": 85,
            "enforcement": 90.7,
            "penalty": 98.3,
            "extraterritorial": 66.7
        },
        "tagline": "Sovereign/Centralized Model — Layered, Registration-Based, Actively Enforced",
        "intro": "China governs AI through a dense stack of departmental measures enforced by the Cyberspace Administration of China, built around mandatory registration and content control — the most actively enforced regime in this Index.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No single AI act exists. The framework layers the Algorithm Recommendation Provisions (2022), Deep Synthesis Provisions (2023), Interim Measures for Generative AI Services (2023), Labelling Measures (2025), and Anthropomorphic Interactive Services Measures (effective 15 July 2026)."
            },
            {
                "label": "Enforcement architecture",
                "text": "The Cyberspace Administration of China (CAC) is the primary regulator, with power to order rectification, suspend services, revoke licences, and impose fines. As of 28 February 2026, 796 generative AI services had completed registration."
            },
            {
                "label": "Deployer obligations",
                "text": "Generative AI providers with public-opinion capability must complete a security assessment and algorithm filing before launch; recommendation algorithms must be filed and disclosed; AI-generated content must carry visible and machine-readable labels."
            },
            {
                "label": "Penalty architecture",
                "text": "Fines can reach into the hundreds of thousands of RMB per violation, with severe violations exposed to penalties up to 10% of annual revenue; the CAC can also take services offline pending compliance."
            },
            {
                "label": "Distinctive feature",
                "text": "China combines high legal density with genuinely active enforcement — filings, takedowns, and coordinated rulemaking are routine, not aspirational."
            },
            {
                "label": "What to watch",
                "text": "The anthropomorphic AI rules take effect 15 July 2026. China's broader draft AI Law also remains under legislative review."
            }
        ]
    },
    {
        "key": "EU",
        "display": "European Union (baseline)",
        "archetype": "Comprehensive",
        "kind": "marker",
        "match": null,
        "lat": 50.85,
        "lon": 4.35,
        "rank": 6,
        "tier": 1,
        "composite": 81.9,
        "pillars": {
            "legal": 91.7,
            "operational": 100,
            "enforcement": 65,
            "penalty": 73.3,
            "extraterritorial": 66.7
        },
        "tagline": "Comprehensive Legislation — Regional Framework",
        "intro": "The EU AI Act (Regulation (EU) 2024/1689) is the world's first comprehensive, horizontal AI statute, and it forms the regulatory floor on which every EU member state's national framework is built.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The AI Act entered into force in August 2024 and is being rolled out on a staggered timeline. In May–June 2026, the EU institutions agreed the Digital Omnibus on AI, the first amendment package to the Act, which the Council formally approved on 29 June 2026."
            },
            {
                "label": "What changed and what did not",
                "text": "The Omnibus defers high-risk obligations for stand-alone Annex III systems from 2 August 2026 to 2 December 2027, and for AI embedded in regulated products (Annex I) from 2 August 2027 to 2 August 2028. It does not touch Article 50 transparency obligations, GPAI penalty powers, or market surveillance authority, all of which remain live from 2 August 2026."
            },
            {
                "label": "Enforcement architecture",
                "text": "The EU AI Office supervises general-purpose AI models directly. Each member state must designate at least one market surveillance authority and one notifying authority under Article 70, coordinated through the AI Board. As of mid-2026, member state designations remain uneven."
            },
            {
                "label": "Deployer obligations",
                "text": "Conformity assessment, technical documentation, risk-management systems, and human oversight for high-risk systems; registration in the EU database; transparency and labelling obligations for GPAI outputs and synthetic content; foreign-provider representative requirements."
            },
            {
                "label": "Penalty architecture",
                "text": "Up to €35 million or 7% of global annual turnover for prohibited practices; up to €15 million or 3% of turnover for other high-risk or GPAI breaches — among the highest statutory ceilings of any AI-specific regime globally."
            },
            {
                "label": "What this means for deployers",
                "text": "The Act sets a genuine floor, not a ceiling: national overlays in Italy, Germany, France, and Spain each add their own institutional layer on top."
            }
        ]
    },
    {
        "key": "South Korea",
        "display": "South Korea",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "South Korea",
        "lat": null,
        "lon": null,
        "rank": 7,
        "tier": 1,
        "composite": 77.6,
        "pillars": {
            "legal": 96.7,
            "operational": 83.3,
            "enforcement": 76.7,
            "penalty": 53.3,
            "extraterritorial": 61.7
        },
        "tagline": "Comprehensive Legislation — In Force, Grace-Period Enforcement",
        "intro": "South Korea became the second jurisdiction after the EU to bring a comprehensive, horizontal AI statute into force, but paired it with an explicit commitment to defer administrative fines for at least a year.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The AI Framework Act (AI Basic Act), passed 26 December 2024, took effect 22 January 2026 together with its Enforcement Decree (Presidential Decree No. 36053)."
            },
            {
                "label": "Enforcement architecture",
                "text": "The Ministry of Science and ICT (MSIT) is the competent authority. The government has explicitly stated enforcement will initially emphasise guidance, with a grace period of at least one year before fines are generally imposed."
            },
            {
                "label": "Deployer obligations",
                "text": "The Enforcement Decree sets the 'high-impact AI' threshold at 10^26 FLOPS; generative AI operators face advance notice and disclosure obligations; foreign operators must appoint a domestic representative above defined thresholds."
            },
            {
                "label": "Penalty architecture",
                "text": "Corrective orders are the primary near-term tool; administrative fines exist in the statute but are being deferred under the grace-period policy."
            },
            {
                "label": "Distinctive feature",
                "text": "A deliberate case of legal density arriving ahead of enforcement appetite: the statute is fully in force, but the government has chosen to hold back the fine regime it already has authority to use."
            },
            {
                "label": "What to watch",
                "text": "The one-year grace period runs through early 2027; how MSIT handles its first non-emergency enforcement actions will be the clearest signal of how the gap closes."
            }
        ]
    },
    {
        "key": "California",
        "display": "California",
        "archetype": "Sectoral/Fragmented",
        "kind": "state",
        "match": "California",
        "lat": null,
        "lon": null,
        "rank": 8,
        "tier": 1,
        "composite": 72.5,
        "pillars": {
            "legal": 91.7,
            "operational": 83.3,
            "enforcement": 65,
            "penalty": 60,
            "extraterritorial": 45
        },
        "tagline": "US State — Frontier-Model Transparency, First Mover",
        "intro": "California was the first US state to enact a targeted frontier-AI transparency law, and its narrower, disclosure-based model has become the reference point other states have since aligned to.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The Transparency in Frontier Artificial Intelligence Act (SB 53), signed 29 September 2025, took effect 1 January 2026. Complemented by AB 2013 (training-data transparency) and SB 942 (content-provenance, deferred to 2 August 2026), plus CPPA ADMT regulations."
            },
            {
                "label": "Enforcement architecture",
                "text": "TFAIA obligations run to frontier model developers directly; critical safety incidents are reported to the state Office of Emergency Services. The CPPA enforces the separate ADMT regulatory regime."
            },
            {
                "label": "Deployer obligations",
                "text": "Frontier developers (models trained above 10^26 FLOPs) must publish a safety framework and transparency report and report critical safety incidents. Businesses using ADMT for significant decisions must give pre-use notices."
            },
            {
                "label": "Penalty architecture",
                "text": "Up to $1 million per violation under the TFAIA; ADMT violations are enforced under the CCPA's existing penalty structure."
            },
            {
                "label": "Distinctive feature",
                "text": "TFAIA is deliberately narrow: transparency and incident reporting, not the pre-deployment testing or 'kill switch' requirements of the vetoed SB 1047."
            },
            {
                "label": "What to watch",
                "text": "SB 942's content-provenance obligations activate 2 August 2026. The ADMT regime's second wave activates 1 January 2027 — the same date New York's RAISE Act comes into force."
            }
        ]
    },
    {
        "key": "Canada",
        "display": "Canada",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "Canada",
        "lat": null,
        "lon": null,
        "rank": 9,
        "tier": 2,
        "composite": 66.8,
        "pillars": {
            "legal": 78.3,
            "operational": 71.7,
            "enforcement": 56.7,
            "penalty": 53.3,
            "extraterritorial": 66.7
        },
        "tagline": "Sectoral Absorption — Federal AI Statute Dead, Provinces Leading",
        "intro": "Canada's proposed federal AI statute died on the order paper in early 2025 and has not returned, leaving Quebec's private-sector privacy law as the country's most demanding binding AI-adjacent obligation.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The Artificial Intelligence and Data Act (AIDA), part of federal Bill C-27, died when Parliament was prorogued in January 2025. No successor had been reintroduced as of mid-2026."
            },
            {
                "label": "Enforcement architecture",
                "text": "No federal AI-specific regulator exists. PIPEDA governs personal information federally; Quebec's Law 25 is enforced by Quebec's data protection authority; OSFI enforces Guideline E-23 for federally regulated financial institutions."
            },
            {
                "label": "Deployer obligations",
                "text": "Quebec's Law 25 requires privacy impact assessments before deploying technology processing personal information, disclosure of automated-decision use, and a right to request human review."
            },
            {
                "label": "Penalty architecture",
                "text": "Quebec Law 25 penalties reach $25 million CAD or 4% of global revenue for serious violations, with a minimum fine of $15,000."
            },
            {
                "label": "Distinctive feature",
                "text": "A clean case of federal legislative failure paired with vigorous provincial substitution: AIDA's death handed the field to Quebec, and increasingly Ontario, BC, and Alberta."
            },
            {
                "label": "What to watch",
                "text": "The federal government's November 2025 Digital Sovereignty Framework signals renewed interest, but any future federal AI law will be a new design, not an AIDA revival."
            }
        ]
    },
    {
        "key": "Brazil",
        "display": "Brazil",
        "archetype": "Comprehensive",
        "kind": "country",
        "match": "Brazil",
        "lat": null,
        "lon": null,
        "rank": 10,
        "tier": 2,
        "composite": 64.2,
        "pillars": {
            "legal": 75,
            "operational": 63.3,
            "enforcement": 76.7,
            "penalty": 45,
            "extraterritorial": 50
        },
        "tagline": "Comprehensive Legislation — Advanced but Not Yet Enacted",
        "intro": "Brazil's AI bill has cleared the Senate and is the most advanced comprehensive AI legislation outside the EU and South Korea, but remains pending in the Chamber of Deputies.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "Bill of Law No. 2338/2023 was approved by the Senate on 10 December 2024 and forwarded to the Chamber of Deputies in March 2025. As of mid-2026 it remains under committee review."
            },
            {
                "label": "Enforcement architecture",
                "text": "The bill establishes a National System for the Regulation and Governance of AI (SIA). The National Data Protection Authority (ANPD) coordinates the SIA and acts as residual regulator."
            },
            {
                "label": "Deployer obligations",
                "text": "A subject-based risk classification with heightened obligations for systems affecting fundamental rights, health, education, employment, public safety, or biometric identification."
            },
            {
                "label": "Penalty architecture",
                "text": "Proposed fines of up to R$50 million per violation or up to 2% of group revenue in Brazil, doubled for repeat offenders."
            },
            {
                "label": "Distinctive feature",
                "text": "Brazil's bill cross-references the American Convention on Human Rights and Inter-American Court advisory opinions, a treaty-body exposure pathway with no direct analogue elsewhere in this Index."
            },
            {
                "label": "What to watch",
                "text": "Chamber of Deputies passage is the single event most likely to move Brazil's profile; effective dates are unlikely before late 2026 at the earliest."
            }
        ]
    },
    {
        "key": "Saudi Arabia",
        "display": "Saudi Arabia",
        "archetype": "Centralized/Sovereign",
        "kind": "country",
        "match": "Saudi Arabia",
        "lat": null,
        "lon": null,
        "rank": 11,
        "tier": 2,
        "composite": 56.1,
        "pillars": {
            "legal": 58.3,
            "operational": 50,
            "enforcement": 60,
            "penalty": 46.7,
            "extraterritorial": 66.7
        },
        "tagline": "Sovereign/Centralized Model — Guidance-Led, Moving Toward a Risk-Tiered Framework",
        "intro": "Saudi Arabia governs AI through an active national authority (SDAIA) issuing non-binding guidance atop an enforced data protection law, and has now opened consultation on a draft Responsible AI Policy.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No standalone AI statute is yet in force. The legal base is the PDPL (Royal Decree M/19), fully enforceable since 14 September 2024. In April 2026, SDAIA opened public consultation on a draft Responsible AI Policy."
            },
            {
                "label": "Enforcement architecture",
                "text": "SDAIA leads national AI strategy and issues guidance; the NDMO enforces data governance for government data; sectoral regulators (SAMA, SFDA) layer AI-relevant provisions onto existing mandates."
            },
            {
                "label": "Deployer obligations",
                "text": "Current binding obligations flow through the PDPL: lawful basis for processing, data residency and cross-border transfer restrictions, and security/incident-response requirements."
            },
            {
                "label": "Penalty architecture",
                "text": "PDPL fines can reach SAR 5 million; SDAIA's enforcement committees issued 48 confirmed PDPL violation decisions across 2025–2026."
            },
            {
                "label": "Distinctive feature",
                "text": "The draft Responsible AI Policy would introduce a four-tier risk classification — a structural shift from broad ethics statements toward an EU-style operational framework."
            },
            {
                "label": "What to watch",
                "text": "The Responsible AI Policy consultation will determine whether the Kingdom moves from guidance-led governance to a binding, risk-tiered AI law."
            }
        ]
    },
    {
        "key": "UK",
        "display": "United Kingdom",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "United Kingdom",
        "lat": null,
        "lon": null,
        "rank": 12,
        "tier": 2,
        "composite": 55,
        "pillars": {
            "legal": 68.3,
            "operational": 35,
            "enforcement": 68.3,
            "penalty": 65,
            "extraterritorial": 38.3
        },
        "tagline": "Sectoral Absorption — No AI Bill, Regulator-Led 'Growth' Model",
        "intro": "The UK has formally abandoned the idea of an AI Bill as its near-term legislative vehicle, replacing it with a regulatory sandbox programme and continuing to route AI oversight through existing regulators.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No AI-specific statute exists and none is before Parliament as of mid-2026. DSIT published a Blueprint for AI regulation (21 October 2025) centred on the AI Growth Lab, a programme of sector-specific regulatory sandboxes."
            },
            {
                "label": "Enforcement architecture",
                "text": "AI oversight runs entirely through existing sectoral regulators: the ICO, the FCA, Ofcom, the MHRA, and the CMA (backed by an 80-person Data, Technology and Analytics unit)."
            },
            {
                "label": "Deployer obligations",
                "text": "Obligations flow from each regulator's own framework: UK GDPR (as amended) for personal data in AI systems; FCA rules for regulated financial firms; Online Safety Act obligations for platforms; MHRA conformity requirements."
            },
            {
                "label": "Penalty architecture",
                "text": "No AI-specific penalty regime exists; exposure runs through each regulator's own enforcement powers (UK GDPR fines via the ICO, FSMA-based sanctions via the FCA, MHRA safety notices)."
            },
            {
                "label": "Distinctive feature",
                "text": "DSIT reported 38 of 50 AI Opportunities Action Plan commitments met as of January 2026, indicating an actively managed programme even though none of it converts into binding horizontal AI law."
            },
            {
                "label": "What to watch",
                "text": "The ICO's forthcoming statutory code of practice on AI and automated decision-making, and the first AI Growth Lab sandboxes spinning up through 2026–2027."
            }
        ]
    },
    {
        "key": "South Africa",
        "display": "South Africa",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "South Africa",
        "lat": null,
        "lon": null,
        "rank": 13,
        "tier": 2,
        "composite": 54.3,
        "pillars": {
            "legal": 66.7,
            "operational": 50,
            "enforcement": 48.3,
            "penalty": 53.3,
            "extraterritorial": 50
        },
        "tagline": "Sectoral Absorption — Draft Policy Withdrawn Mid-Process",
        "intro": "South Africa's draft National AI Policy was withdrawn in June 2026 after officials discovered it contained fabricated references — a rare, concrete instance of an AI-governance document failing basic AI-output verification.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The Draft South Africa National AI Policy was gazetted for public comment 10 April 2026, then officially withdrawn 12 June 2026 for containing references to sources that do not exist. A revised version is expected by January 2027."
            },
            {
                "label": "Enforcement architecture",
                "text": "The withdrawn draft proposed a sector-specific, multi-regulator model. Until finalised, the Information Regulator continues to enforce POPIA, which remains the primary binding instrument reaching AI systems."
            },
            {
                "label": "Deployer obligations",
                "text": "No AI-specific obligations are currently in force. POPIA's existing rules on automated decision-making (section 71) apply to AI systems handling personal information."
            },
            {
                "label": "Penalty architecture",
                "text": "No AI-specific penalty regime exists. POPIA's existing enforcement and penalty framework is the operative exposure."
            },
            {
                "label": "Distinctive feature",
                "text": "The clearest case in this Index of institutional capacity failing before the policy even reached a vote — the withdrawal for fabricated citations occurred in the drafting process itself."
            },
            {
                "label": "What to watch",
                "text": "The revised policy's Cabinet review (targeted November 2026) and public release (targeted January 2027) are the next concrete milestones."
            }
        ]
    },
    {
        "key": "Japan",
        "display": "Japan",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "Japan",
        "lat": null,
        "lon": null,
        "rank": 14,
        "tier": 2,
        "composite": 53.6,
        "pillars": {
            "legal": 76.7,
            "operational": 33.3,
            "enforcement": 81.7,
            "penalty": 26.7,
            "extraterritorial": 38.3
        },
        "tagline": "Sectoral Absorption — Soft Law by Design, Reputational Enforcement",
        "intro": "Japan's AI Promotion Act is deliberately non-binding: it carries no fines, no bans, and no mandatory conformity assessments, relying instead on a 'name and shame' mechanism.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The AI Promotion Act was promulgated 4 June 2025 and fully in force by 1 September 2025 — Japan's first national AI-specific statute, functioning as a promotional, coordination-focused framework."
            },
            {
                "label": "Enforcement architecture",
                "text": "No dedicated AI regulator exists; enforcement is shared across the PPC (APPI), METI and MIC (AI Guidelines for Business, v1.2), and the Digital Agency. The Act's only enforcement mechanism is public identification of non-compliant operators."
            },
            {
                "label": "Deployer obligations",
                "text": "No binding AI-specific obligations exist under the Act itself. The METI/MIC AI Guidelines for Business set expectations for risk assessment, bias testing, and transparency, increasingly treated as a de facto standard of care."
            },
            {
                "label": "Penalty architecture",
                "text": "None under the AI Promotion Act itself. Exposure runs through underlying sectoral statutes, principally the APPI, which the PPC is actively reforming."
            },
            {
                "label": "Distinctive feature",
                "text": "Japan's near-zero statutory penalty exposure sits alongside a near-zero enforcement gap in this Index's own terms — the law promises almost nothing legally binding."
            },
            {
                "label": "What to watch",
                "text": "The APPI amendment bill moving through the Diet will likely be Japan's most consequential AI-adjacent legal change in 2026."
            }
        ]
    },
    {
        "key": "Texas",
        "display": "Texas",
        "archetype": "Sectoral/Fragmented",
        "kind": "state",
        "match": "Texas",
        "lat": null,
        "lon": null,
        "rank": 15,
        "tier": 2,
        "composite": 50.4,
        "pillars": {
            "legal": 78.3,
            "operational": 30,
            "enforcement": 51.7,
            "penalty": 45,
            "extraterritorial": 41.7
        },
        "tagline": "US State — Intent-Based Liability, Narrowest Trigger",
        "intro": "Texas took the narrowest liability approach of any major state AI law: intent-based rather than impact-based, with exclusive enforcement vested in the Attorney General and no private right of action.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The Texas Responsible Artificial Intelligence Governance Act (TRAIGA, HB 149), signed 22 June 2025, took effect 1 January 2026."
            },
            {
                "label": "Enforcement architecture",
                "text": "The Texas Attorney General holds exclusive enforcement authority; no private right of action. Before enforcement, the AG must give notice and allow a 60-day cure period."
            },
            {
                "label": "Deployer obligations",
                "text": "TRAIGA prohibits developing or deploying AI with intent to unlawfully discriminate, incite self-harm or violence, facilitate criminal activity, produce CSAM, or infringe constitutional rights. Also restricts government AI use."
            },
            {
                "label": "Penalty architecture",
                "text": "Curable violations: $10,000–$12,000 per violation. Uncurable violations: $80,000–$200,000. Continuing violations: $2,000–$40,000 per day."
            },
            {
                "label": "Distinctive feature",
                "text": "TRAIGA's intent-based trigger is a deliberate departure from the impact-based model used in Colorado's original law and the EU AI Act. It preempts local AI ordinances outright."
            },
            {
                "label": "What to watch",
                "text": "The Attorney General's formal complaint mechanism was due by September 2026. Early enforcement patterns will be the first real signal of how the standard is applied."
            }
        ]
    },
    {
        "key": "Singapore",
        "display": "Singapore",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "Singapore",
        "lat": null,
        "lon": null,
        "rank": 16,
        "tier": 2,
        "composite": 50,
        "pillars": {
            "legal": 66.7,
            "operational": 36.7,
            "enforcement": 78.3,
            "penalty": 33.3,
            "extraterritorial": 23.3
        },
        "tagline": "Sectoral Absorption — Voluntary, Framework-Driven, Regional Benchmark",
        "intro": "Singapore governs AI almost entirely through voluntary, principles-based frameworks rather than binding statute, and its Model AI Governance Framework has become a regional reference point despite carrying no legal force.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No AI-specific statute exists. The Model AI Governance Framework (first issued 2019) has been extended twice: a Generative AI edition (2024), and a Model AI Governance Framework for Agentic AI (January 2026, updated to v1.5 in May 2026)."
            },
            {
                "label": "Enforcement architecture",
                "text": "Digital and AI governance is distributed: MDDI sets strategy; IMDA develops frameworks; the PDPC administers the binding Personal Data Protection Act 2012; sector regulators (notably MAS) layer mandatory requirements."
            },
            {
                "label": "Deployer obligations",
                "text": "The Agentic AI framework asks organisations to assess and bound risk upfront and maintain human accountability. None of this is legally binding outside regulated sectors; the PDPA remains the one hard-law layer."
            },
            {
                "label": "Penalty architecture",
                "text": "No AI-specific penalties exist. Exposure runs through the PDPA's existing enforcement regime, or sector-specific rules where those apply."
            },
            {
                "label": "Distinctive feature",
                "text": "Singapore accepts near-zero legal density in exchange for being first and most detailed on emerging risk categories, making its guidance a de facto regional standard."
            },
            {
                "label": "What to watch",
                "text": "IMDA's discussion paper on legal responsibility for AI agents and the PDPC's proposed guidelines on generative AI data use are the most likely sources of Singapore's next move toward binding rules."
            }
        ]
    },
    {
        "key": "UAE",
        "display": "United Arab Emirates",
        "archetype": "Centralized/Sovereign",
        "kind": "country",
        "match": "United Arab Emirates",
        "lat": null,
        "lon": null,
        "rank": 17,
        "tier": 3,
        "composite": 46.7,
        "pillars": {
            "legal": 51.7,
            "operational": 35,
            "enforcement": 36.7,
            "penalty": 51.7,
            "extraterritorial": 66.7
        },
        "tagline": "Sovereign/Centralized Model — Layered Regime, Newly Consolidated",
        "intro": "The UAE has no horizontal AI statute; it governs AI through a layered stack of federal data-protection law, free-zone rules, and sectoral guidance. A newly created federal authority is the clearest sign yet of consolidation.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No AI-specific federal statute exists. The framework layers the Federal PDPL, the non-binding UAE Charter for AI (June 2024), DIFC's Regulation 10 (in force since January 2026), and ADGM's separate regime."
            },
            {
                "label": "Enforcement architecture",
                "text": "On 14 June 2026, the UAE announced the Federal Authority for Artificial Intelligence and Data, a new centralised body reporting directly to Cabinet, absorbing the Emirates Data Office."
            },
            {
                "label": "Deployer obligations",
                "text": "PDPL obligations apply to AI systems processing personal data; full compliance required by 1 January 2027. DIFC-registered entities must meet Regulation 10 now. A federal Child Digital Safety Law took effect 1 January 2026."
            },
            {
                "label": "Penalty architecture",
                "text": "PDPL administrative fines can reach AED 20 million for severe violations. DIFC Regulation 10 violations carry separate exposure in the USD 25,000–50,000 range."
            },
            {
                "label": "Distinctive feature",
                "text": "A clear sovereign-model case: legal density remains comparatively low and fragmented, but institutional intent is unusually concentrated and fast-moving."
            },
            {
                "label": "What to watch",
                "text": "The Federal Authority's first concrete outputs — likely finalised PDPL implementing regulations — will determine whether enforcement capacity catches up to institutional ambition."
            }
        ]
    },
    {
        "key": "US Federal",
        "display": "United States (Federal)",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "United States of America",
        "lat": null,
        "lon": null,
        "rank": 18,
        "tier": 3,
        "composite": 46.3,
        "pillars": {
            "legal": 65,
            "operational": 26.7,
            "enforcement": 53.3,
            "penalty": 53.3,
            "extraterritorial": 31.7
        },
        "tagline": "Sectoral Absorption — Executive Action, No Federal Statute",
        "intro": "The United States has no comprehensive federal AI statute. The federal layer consists entirely of executive orders and non-binding policy documents, while binding obligations sit almost exclusively at the state level.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "No AI-specific federal legislation exists. The operative federal layer is a stack of executive actions: the July 2025 AI Action Plan, Executive Order 14365 (11 December 2025), a non-binding National Policy Framework for AI (20 March 2026), and later orders on AI cyber defense and national-security AI adoption."
            },
            {
                "label": "The preemption fight",
                "text": "Congress has twice rejected a federal moratorium on state AI laws: a 99-1 Senate vote stripped a 10-year freeze from the 2025 budget bill, and a similar provision was omitted from the 2026 NDAA."
            },
            {
                "label": "Enforcement architecture",
                "text": "A Department of Justice AI Litigation Task Force, operating since 10 January 2026, challenges state AI laws in federal court. The FTC has been directed to treat state-mandated bias mitigation as a per se deceptive trade practice."
            },
            {
                "label": "Deployer obligations",
                "text": "None directly imposed by binding federal AI law. Deployers' actual compliance obligations continue to come from state statutes (California, Colorado, Texas, New York, Connecticut) and existing cross-sectoral law."
            },
            {
                "label": "Distinctive feature",
                "text": "The clearest illustration in this Index of legal density and enforcement capacity moving in opposite directions: statutory density is near zero, yet the federal government is actively deploying litigation, funding conditionality, and agency guidance."
            },
            {
                "label": "What this means for deployers",
                "text": "Treat state laws as fully operative until a statute or definitive court ruling says otherwise. The federal preemption push is a live risk factor to monitor, not a basis for relaxing state-level compliance work already underway."
            }
        ]
    },
    {
        "key": "Colorado",
        "display": "Colorado",
        "archetype": "Sectoral/Fragmented",
        "kind": "state",
        "match": "Colorado",
        "lat": null,
        "lon": null,
        "rank": 19,
        "tier": 3,
        "composite": 39.6,
        "pillars": {
            "legal": 60,
            "operational": 53.3,
            "enforcement": 25,
            "penalty": 18.3,
            "extraterritorial": 23.3
        },
        "tagline": "US State — Repealed and Replaced Before Taking Effect",
        "intro": "Colorado is the first US state to repeal and replace a comprehensive AI statute before it ever took effect, doing so under active federal litigation that still clouds the enforceability of its replacement law.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The original Colorado AI Act (SB 24-205) was repealed before its 30 June 2026 effective date. Governor Polis signed its replacement, SB 26-189 (the Automated Decision-Making Technology Act), on 14 May 2026; scheduled to take effect 1 January 2027."
            },
            {
                "label": "Litigation and enforcement posture",
                "text": "xAI sued Colorado's Attorney General in April 2026 challenging the original law's constitutionality; the DOJ intervened in support. A federal court enforcement stay was extended to cover SB 26-189 as well."
            },
            {
                "label": "Deployer obligations",
                "text": "The replacement law drops the original's affirmative duty of care and annual impact-assessment requirement. In their place: notification for consequential decisions, a human-review pathway, and three-year record retention."
            },
            {
                "label": "Distinctive feature",
                "text": "A live case study in the gap this Index measures directly: a statute with high legal density collapsed under litigation and industry pressure before enforcement capacity was ever tested."
            },
            {
                "label": "Penalty architecture",
                "text": "Enforcement runs through the Colorado Attorney General; the replacement framework's specific penalty schedule is being finalized through pending rulemaking."
            },
            {
                "label": "What to watch",
                "text": "Both the rulemaking timeline and the xAI litigation are unresolved. 1 January 2027 is the operative planning date, contingent on both tracks."
            }
        ]
    },
    {
        "key": "India",
        "display": "India",
        "archetype": "Sectoral/Fragmented",
        "kind": "country",
        "match": "India",
        "lat": null,
        "lon": null,
        "rank": 20,
        "tier": 3,
        "composite": 39.6,
        "pillars": {
            "legal": 48.3,
            "operational": 31.7,
            "enforcement": 36.7,
            "penalty": 43.3,
            "extraterritorial": 38.3
        },
        "tagline": "Sectoral Absorption — Guidelines, Not Law, 'Techno-Legal' by Design",
        "intro": "India has deliberately chosen guidance over legislation: its newly unveiled AI Governance Guidelines are explicitly non-binding, favouring existing law, voluntary compliance, and regulatory sandboxes.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "MeitY unveiled the India AI Governance Guidelines on 5 November 2025, resting on seven guiding principles ('sutras') and a 'techno-legal' approach embedding safeguards into technology design rather than new regulation."
            },
            {
                "label": "Enforcement architecture",
                "text": "No dedicated AI regulator exists. The guidelines propose an inter-ministerial AI Governance Group, a Technology & Policy Expert Committee, and an AI Safety Institute, alongside existing law under the IT Act."
            },
            {
                "label": "Deployer obligations",
                "text": "The IT Amendment Rules 2026, notified 20 February 2026, impose labelling/provenance metadata and traceability requirements for 'synthetically generated information' as a condition of retaining safe-harbour protection."
            },
            {
                "label": "Penalty architecture",
                "text": "No AI-specific penalty regime exists outside the intermediary rules, which carry safe-harbour-conditionality rather than direct fines."
            },
            {
                "label": "Distinctive feature",
                "text": "India is a deliberate light-touch outlier: officials have stated explicitly that India has 'consciously chosen not to lead with regulation.'"
            },
            {
                "label": "What to watch",
                "text": "The shape of any future Digital India Act will be the clearest indicator of whether India's light-touch posture holds."
            }
        ]
    },
    {
        "key": "New York",
        "display": "New York",
        "archetype": "Sectoral/Fragmented",
        "kind": "state",
        "match": "New York",
        "lat": null,
        "lon": null,
        "rank": 21,
        "tier": 3,
        "composite": 34.2,
        "pillars": {
            "legal": 40,
            "operational": 41.7,
            "enforcement": 20,
            "penalty": 33.3,
            "extraterritorial": 31.7
        },
        "tagline": "US State — Frontier-Model Law, Aligned to California with a Faster Clock",
        "intro": "New York's RAISE Act became the second US state frontier-AI law after California's, deliberately aligned to the California model, but with a materially faster incident-reporting requirement.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "The RAISE Act was signed 19 December 2025, conditioned on a chapter amendment. Governor Hochul signed that amendment (S8828) on 27 March 2026. The law takes effect 1 January 2027."
            },
            {
                "label": "Enforcement architecture",
                "text": "The chapter amendment creates a new oversight office within the NY Department of Financial Services (NYDFS), which assesses large frontier developers and issues annual reports; DFS holds rulemaking and enforcement authority."
            },
            {
                "label": "Deployer obligations",
                "text": "Covers frontier developers with annual revenue above $500 million whose models are trained above 10^26 FLOPs. Covered developers must publish safety protocols and report critical safety incidents within 72 hours."
            },
            {
                "label": "Distinctive feature",
                "text": "The 72-hour critical-incident reporting clock is markedly stricter than California's 15-day window."
            },
            {
                "label": "Penalty architecture",
                "text": "The chapter amendment lowered penalties from the originally enacted bill; DFS-administered civil penalties apply."
            },
            {
                "label": "What to watch",
                "text": "The law takes effect 1 January 2027, the same date as California's ADMT second wave and Colorado's replacement framework."
            }
        ]
    },
    {
        "key": "Connecticut",
        "display": "Connecticut",
        "archetype": "Sectoral/Fragmented",
        "kind": "state",
        "match": "Connecticut",
        "lat": null,
        "lon": null,
        "rank": 22,
        "tier": 3,
        "composite": 31.4,
        "pillars": {
            "legal": 53.3,
            "operational": 28.3,
            "enforcement": 25,
            "penalty": 11.7,
            "extraterritorial": 28.3
        },
        "tagline": "US State — Broadest Use-Case Coverage, Second Attempt",
        "intro": "Connecticut's SB 5 succeeded on its second legislative attempt, and now covers more distinct AI use cases in a single statute than any other state law in this Index.",
        "sections": [
            {
                "label": "Instrument and status",
                "text": "Governor Ned Lamont signed SB 5, Public Act No. 26-15, into law in late May 2026, after passing with bipartisan margins (131-17 House, 32-4 Senate)."
            },
            {
                "label": "Enforcement architecture",
                "text": "Enforcement is largely vested in the Connecticut Attorney General. Violations are generally treated as unfair or deceptive trade practices, with a 60-day cure period through end of 2027."
            },
            {
                "label": "Deployer obligations",
                "text": "The 39-section law covers frontier-model whistleblower protections, AI companion chatbot restrictions for minors, automated employment decision technology, synthetic content watermarking, and AI-related layoff notice requirements."
            },
            {
                "label": "Penalty architecture",
                "text": "Enforced under the state's unfair/deceptive trade practices framework by the Attorney General, with the 60-day cure period; specific figures vary by provision."
            },
            {
                "label": "Distinctive feature",
                "text": "SB 5 has the broadest use-case span of any state law in this Index, and its companion-chatbot restrictions for minors are among the most restrictive in the country."
            },
            {
                "label": "What to watch",
                "text": "Provisions phase in from 1 October 2026 through January 2028, with employment-related obligations starting 1 October 2027."
            }
        ]
    }
];

export const JURISDICTION_BY_KEY: Record<string, Jurisdiction> = Object.fromEntries(
    JURISDICTIONS.map((j) => [j.key, j])
);

/** GeoJSON country name -> jurisdiction key. */
export const COUNTRY_LOOKUP: Record<string, string> = Object.fromEntries(
    JURISDICTIONS.filter((j) => j.kind === 'country' && j.match).map((j) => [j.match as string, j.key])
);

/** GeoJSON US state name -> jurisdiction key. */
export const STATE_LOOKUP: Record<string, string> = Object.fromEntries(
    JURISDICTIONS.filter((j) => j.kind === 'state' && j.match).map((j) => [j.match as string, j.key])
);

export const EU_MARKER = JURISDICTIONS.find((j) => j.kind === 'marker') as Jurisdiction;

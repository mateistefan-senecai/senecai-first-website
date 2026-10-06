'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './lang';
import {
    COUNTRY_LOOKUP,
    EU_MARKER,
    JURISDICTIONS,
    JURISDICTION_BY_KEY,
    PILLAR_LABELS,
    STATE_LOOKUP,
    type Jurisdiction,
} from './lib/policy-map/jurisdictions';
import { intensityColor, TIER_CHIP, TIER_CHIP_ON_DARK, UNSCORED_FILL, type Tier } from './lib/policy-map/scale';

const VIEW_W = 960;
const VIEW_H = 470;
const STUDY_URL = '/SenecAI-Global-AI-Policy-Report-2026.pdf';
const COMPARE_ID = 'compare-section';

interface GeoShape {
    n: string;
    d: string;
}

interface GeoData {
    world: GeoShape[];
    states: GeoShape[];
    eu: { x: number; y: number };
}

const content = {
    en: {
        eyebrow: 'Global AI Policy Report',
        edition: ['First Edition', 'August 2026'],
        kicker: 'SenecAI · First Edition, August 2026',
        title: 'The Jurisdiction Map',
        lead: 'Regulatory intensity across 22 jurisdictions, scored on a 15-criterion rubric spanning five weighted pillars. Hover a jurisdiction for its score breakdown, select it for the full one-pager, or compare two jurisdictions side by side below.',
        cta: 'Download the full study',
        loading: 'Loading the map…',
        legendLow: 'Lower intensity',
        legendHigh: 'Higher intensity',
        euNote: 'EU baseline — bloc-level, not a single country',
        statesNote: 'Outlined US states are scored separately from the federal row.',
        tapHint: 'Tap a jurisdiction on the map, or pick one from the ranking below.',
        compareTitle: 'Compare two jurisdictions',
        compareLead:
            'Select any two jurisdictions to compare composite scores, tiers, and the five underlying pillars side by side.',
        jurisdictionA: 'Jurisdiction A',
        jurisdictionB: 'Jurisdiction B',
        selectPlaceholder: 'Select a jurisdiction…',
        swap: 'Swap',
        compareEmpty: 'Select two jurisdictions above to compare them.',
        vs: 'vs.',
        tied: 'Composite scores are effectively tied.',
        higherBy: (name: string, points: number) => `${name} scores ${points} points higher overall.`,
        compareFromDetail: 'Compare this jurisdiction →',
        railTitle: 'Composite ranking — all 22 jurisdictions',
        railHint: 'Scroll right for the full ranking →',
        scrollLeft: 'Scroll left',
        scrollRight: 'Scroll right',
        tierNames: {
            1: 'Tier 1 — High intensity',
            2: 'Tier 2 — Moderate',
            3: 'Tier 3 — Emerging',
        } as Record<Tier, string>,
        tierShort: { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' } as Record<Tier, string>,
        rankOf: (rank: number) => `Rank ${rank} / 22`,
        scoreBreakdown: 'Score breakdown',
        selectHint: 'Select for the full jurisdiction one-pager.',
        close: 'Close',
        methodology:
            'Composite scores are the weighted sum of five pillar averages — Legal Density 25%, Operational Burden 25%, Enforcement Capacity 20%, Penalty Severity 15%, Extraterritorial Reach 15%. Tier 1 ≥ 70, Tier 2 ≥ 50, Tier 3 < 50.',
        source:
            'SenecAI Global AI Policy Report — What Awaits Organizations Deploying AI Globally. First Edition, August 2026.',
        note: null as string | null,
    },
    ro: {
        eyebrow: 'Raportul Global de Politici AI',
        edition: ['Prima ediție', 'August 2026'],
        kicker: 'SenecAI · Prima ediție, august 2026',
        title: 'Harta jurisdicțiilor',
        lead: 'Intensitatea reglementării în 22 de jurisdicții, evaluată pe o grilă de 15 criterii grupate în cinci piloni ponderați. Treci cu mouse-ul peste o jurisdicție pentru detalierea scorului, selecteaz-o pentru fișa completă sau compară două jurisdicții una lângă alta mai jos.',
        cta: 'Descarcă studiul complet',
        loading: 'Se încarcă harta…',
        legendLow: 'Intensitate scăzută',
        legendHigh: 'Intensitate ridicată',
        euNote: 'Reper UE — la nivel de bloc, nu o singură țară',
        statesNote: 'Statele SUA conturate sunt evaluate separat de nivelul federal.',
        tapHint: 'Atinge o jurisdicție pe hartă sau alege una din clasamentul de mai jos.',
        compareTitle: 'Compară două jurisdicții',
        compareLead:
            'Selectează oricare două jurisdicții pentru a compara scorurile compozite, nivelurile și cei cinci piloni, una lângă alta.',
        jurisdictionA: 'Jurisdicția A',
        jurisdictionB: 'Jurisdicția B',
        selectPlaceholder: 'Alege o jurisdicție…',
        swap: 'Inversează',
        compareEmpty: 'Selectează două jurisdicții mai sus pentru a le compara.',
        vs: 'vs.',
        tied: 'Scorurile compozite sunt practic egale.',
        higherBy: (name: string, points: number) => `${name} are un scor cu ${points} puncte mai mare per total.`,
        compareFromDetail: 'Compară această jurisdicție →',
        railTitle: 'Clasament compozit — toate cele 22 de jurisdicții',
        railHint: 'Derulează la dreapta pentru clasamentul complet →',
        scrollLeft: 'Derulează la stânga',
        scrollRight: 'Derulează la dreapta',
        tierNames: {
            1: 'Nivel 1 — Intensitate ridicată',
            2: 'Nivel 2 — Moderat',
            3: 'Nivel 3 — Emergent',
        } as Record<Tier, string>,
        tierShort: { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' } as Record<Tier, string>,
        rankOf: (rank: number) => `Locul ${rank} / 22`,
        scoreBreakdown: 'Detalierea scorului',
        selectHint: 'Selectează pentru fișa completă a jurisdicției.',
        close: 'Închide',
        methodology:
            'Scorurile compozite reprezintă suma ponderată a mediilor celor cinci piloni — Densitate legislativă 25%, Sarcină operațională 25%, Capacitate de aplicare 20%, Severitatea sancțiunilor 15%, Aplicabilitate extrateritorială 15%. Nivel 1 ≥ 70, Nivel 2 ≥ 50, Nivel 3 < 50.',
        source:
            'SenecAI Global AI Policy Report — What Awaits Organizations Deploying AI Globally. Prima ediție, august 2026.',
        note: 'Fișele de jurisdicție sunt reproduse în limba engleză, așa cum apar în raport.' as string | null,
    },
};

type Copy = typeof content.en;

const WRAP = 'mx-auto max-w-7xl';
const WRAP_STYLE = { width: '90%' } as const;

/* -------------------------------------------------------------------------- */
/*  Pillar bars                                                               */
/* -------------------------------------------------------------------------- */

function PillarBars({ jurisdiction, compact }: { jurisdiction: Jurisdiction; compact?: boolean }) {
    return (
        <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
            {PILLAR_LABELS.map(({ key, label, weight }) => {
                const value = jurisdiction.pillars[key];
                return (
                    <div key={key} className="flex items-center gap-3">
                        <span
                            className={`flex-shrink-0 leading-tight text-gray-600 ${compact ? 'w-[118px] text-[10.5px]' : 'w-[132px] text-xs sm:text-[13px]'}`}
                        >
                            {label}
                            {!compact && <span className="text-gray-400"> {weight}</span>}
                        </span>
                        <span className={`flex-1 overflow-hidden rounded-full bg-gray-100 ${compact ? 'h-1' : 'h-1.5'}`}>
                            <span
                                className="block h-full rounded-full"
                                style={{ width: `${value}%`, background: intensityColor(value) }}
                            />
                        </span>
                        <span
                            className={`flex-shrink-0 text-right tabular-nums text-gray-900 ${compact ? 'w-6 text-[11px]' : 'w-7 text-xs sm:text-[13px]'}`}
                        >
                            {Math.round(value)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Hover tooltip — tracks the pointer itself so the 240-path map never        */
/*  re-renders while the cursor moves.                                        */
/* -------------------------------------------------------------------------- */

function MapTooltip({
    jurisdiction,
    origin,
    copy,
}: {
    jurisdiction: Jurisdiction;
    origin: { x: number; y: number };
    copy: Copy;
}) {
    const [pos, setPos] = useState(origin);

    useEffect(() => {
        const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        document.addEventListener('mousemove', onMove);
        return () => document.removeEventListener('mousemove', onMove);
    }, []);

    const width = 300;
    const height = 250;
    const left = pos.x + 20 + width > window.innerWidth - 12 ? pos.x - width - 20 : pos.x + 20;
    const top = pos.y + 20 + height > window.innerHeight - 12 ? Math.max(12, pos.y - height - 20) : pos.y + 20;

    return createPortal(
        <div
            className="pointer-events-none fixed z-[99998] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
            style={{ left, top, width }}
        >
            <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-2">
                <span className="text-sm font-semibold text-gray-900">{jurisdiction.display}</span>
                <span className="whitespace-nowrap text-[11px] text-gray-400">{copy.rankOf(jurisdiction.rank)}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl font-bold leading-none tabular-nums text-gray-900">
                    {Math.round(jurisdiction.composite)}
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider ${TIER_CHIP[jurisdiction.tier]}`}
                >
                    {copy.tierShort[jurisdiction.tier]}
                </span>
            </div>
            <div className="mb-3 mt-1.5 text-[11px] text-gray-500">{jurisdiction.archetype}</div>
            <PillarBars jurisdiction={jurisdiction} compact />
            <div className="mt-3 border-t border-gray-100 pt-2 text-[10.5px] text-gray-400">{copy.selectHint}</div>
        </div>,
        document.body
    );
}

/* -------------------------------------------------------------------------- */
/*  One-pager drawer                                                          */
/* -------------------------------------------------------------------------- */

function DetailDrawer({
    jurisdiction,
    onClose,
    onCompare,
    copy,
}: {
    jurisdiction: Jurisdiction | null;
    onClose: () => void;
    onCompare: (key: string) => void;
    copy: Copy;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isOpen = Boolean(jurisdiction);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);

        const html = document.documentElement;
        const body = document.body;
        const scrollY = window.scrollY;
        const scrollbarWidth = window.innerWidth - html.clientWidth;
        if (window.__lenis) window.__lenis.stop();
        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.width = '100%';
        body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.removeEventListener('keydown', onKey);
            html.style.overflow = '';
            body.style.overflow = '';
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            body.style.paddingRight = '';
            if (window.__lenis) window.__lenis.start();
            window.scrollTo(0, scrollY);
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {jurisdiction && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm"
                    />
                    <motion.aside
                        key="panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed bottom-0 right-0 top-0 z-[999999] w-full max-w-[640px] overflow-y-auto bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label={jurisdiction.display}
                    >
                        <div className="bg-black px-6 pb-7 pt-7 text-white sm:px-10">
                            <div className="flex items-start justify-between gap-5">
                                <div className="min-w-0">
                                    <div className="mb-3 text-[10.5px] uppercase tracking-[0.14em] text-primary-500">
                                        {copy.kicker}
                                    </div>
                                    <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{jurisdiction.display}</h2>
                                    <p className="mt-2 text-sm italic text-gray-400">{jurisdiction.tagline}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label={copy.close}
                                    className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-gray-800 pt-5">
                                <span className="text-4xl font-bold leading-none tabular-nums">
                                    {Math.round(jurisdiction.composite)}
                                </span>
                                <span className="text-[11px] text-gray-400">{copy.rankOf(jurisdiction.rank)}</span>
                                <span
                                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${TIER_CHIP_ON_DARK[jurisdiction.tier]}`}
                                >
                                    {copy.tierNames[jurisdiction.tier]}
                                </span>
                                <span className="ml-auto text-[11px] uppercase tracking-[0.08em] text-gray-400">
                                    {jurisdiction.archetype}
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-16 pt-7 sm:px-10">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 px-5 py-5">
                                <div className="mb-4 text-[11px] uppercase tracking-[0.12em] text-gray-500">
                                    {copy.scoreBreakdown}
                                </div>
                                <PillarBars jurisdiction={jurisdiction} />
                            </div>

                            <p className="mt-7 text-lg leading-relaxed text-gray-800">{jurisdiction.intro}</p>

                            <div className="mt-8 space-y-7">
                                {jurisdiction.sections.map((section) => (
                                    <div key={section.label}>
                                        <h3 className="mb-2.5 border-b border-gray-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-700">
                                            {section.label}
                                        </h3>
                                        <p className="text-[15px] leading-relaxed text-gray-700">{section.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => onCompare(jurisdiction.key)}
                                    className="rounded-full bg-gray-900 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-500 hover:text-black"
                                >
                                    {copy.compareFromDetail}
                                </button>
                                <a
                                    href={STUDY_URL}
                                    className="rounded-full bg-gradient-to-br from-primary-400 to-primary-600 px-7 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
                                >
                                    {copy.cta}
                                </a>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

/* -------------------------------------------------------------------------- */
/*  Comparison                                                                */
/* -------------------------------------------------------------------------- */

function JurisdictionSelect({
    id,
    label,
    value,
    onChange,
    copy,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    copy: Copy;
}) {
    return (
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor={id} className="text-[10.5px] uppercase tracking-[0.1em] text-gray-500">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3.5 pr-9 text-sm text-gray-900 transition-colors hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">{copy.selectPlaceholder}</option>
                    {JURISDICTIONS.map((j) => (
                        <option key={j.key} value={j.key}>
                            {`${j.rank}. ${j.display} — ${Math.round(j.composite)}`}
                        </option>
                    ))}
                </select>
                <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

function CompareHead({
    jurisdiction,
    align,
    copy,
}: {
    jurisdiction: Jurisdiction;
    align: 'left' | 'right';
    copy: Copy;
}) {
    const right = align === 'right';
    return (
        <div className={`flex flex-col gap-1.5 ${right ? 'md:items-end md:text-right' : ''}`}>
            <div className="text-xl font-bold leading-tight text-gray-900">{jurisdiction.display}</div>
            <div className={`flex items-baseline gap-2.5 ${right ? 'md:flex-row-reverse' : ''}`}>
                <span className="text-3xl font-bold leading-none tabular-nums text-gray-900">
                    {Math.round(jurisdiction.composite)}
                </span>
                <span className="text-[10.5px] text-gray-500">{copy.rankOf(jurisdiction.rank)}</span>
            </div>
            <span
                className={`w-fit rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider ${TIER_CHIP[jurisdiction.tier]}`}
            >
                {copy.tierNames[jurisdiction.tier]}
            </span>
            <div className="text-[11px] uppercase tracking-[0.06em] text-gray-500">{jurisdiction.archetype}</div>
        </div>
    );
}

function CompareSection({
    keyA,
    keyB,
    setKeyA,
    setKeyB,
    copy,
}: {
    keyA: string;
    keyB: string;
    setKeyA: (key: string) => void;
    setKeyB: (key: string) => void;
    copy: Copy;
}) {
    const a = keyA ? JURISDICTION_BY_KEY[keyA] : null;
    const b = keyB ? JURISDICTION_BY_KEY[keyB] : null;

    const delta = a && b ? a.composite - b.composite : 0;
    const deltaText =
        a && b
            ? Math.abs(delta) < 0.05
                ? copy.tied
                : copy.higherBy(delta > 0 ? a.display : b.display, Math.abs(Math.round(delta)))
            : '';

    return (
        <section id={COMPARE_ID} className="scroll-mt-28 bg-white pb-6">
            <div className={WRAP} style={WRAP_STYLE}>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                        <div className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-gray-900">
                            {copy.compareTitle}
                        </div>
                        <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-gray-500">
                            {copy.compareLead}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                        <JurisdictionSelect
                            id="compare-a"
                            label={copy.jurisdictionA}
                            value={keyA}
                            onChange={setKeyA}
                            copy={copy}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const next = keyA;
                                setKeyA(keyB);
                                setKeyB(next);
                            }}
                            title={copy.swap}
                            className="flex-shrink-0 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-700"
                        >
                            ⇄ {copy.swap}
                        </button>
                        <JurisdictionSelect
                            id="compare-b"
                            label={copy.jurisdictionB}
                            value={keyB}
                            onChange={setKeyB}
                            copy={copy}
                        />
                    </div>

                    {!a || !b ? (
                        <div className="px-5 py-10 text-center text-[13px] text-gray-400">{copy.compareEmpty}</div>
                    ) : (
                        <div className="px-5 py-5 sm:px-6">
                            <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
                                <CompareHead jurisdiction={a} align="left" copy={copy} />
                                <div className="hidden self-center pt-2 text-sm italic text-primary-600 md:block">
                                    {copy.vs}
                                </div>
                                <CompareHead jurisdiction={b} align="right" copy={copy} />
                            </div>

                            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-2.5 text-center text-xs text-gray-600">
                                {deltaText}
                            </div>

                            <div className="mt-4 border-t border-gray-100 pt-2">
                                {PILLAR_LABELS.map(({ key, label }) => {
                                    const va = Math.round(a.pillars[key]);
                                    const vb = Math.round(b.pillars[key]);
                                    return (
                                        <div
                                            key={key}
                                            className="grid grid-cols-1 items-center gap-x-3 gap-y-1 border-b border-gray-100 py-2.5 last:border-b-0 md:grid-cols-[1fr_160px_1fr]"
                                        >
                                            {/* A — bar mirrored so it grows toward the centre label. */}
                                            <div className="flex items-center gap-2 md:flex-row-reverse">
                                                <span
                                                    className={`w-6 flex-shrink-0 text-center text-[12.5px] tabular-nums ${va > vb ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                                                >
                                                    {va}
                                                </span>
                                                <span className="flex h-[7px] flex-1 justify-start overflow-hidden rounded-full bg-gray-100 md:justify-end">
                                                    <span
                                                        className="block h-full rounded-full"
                                                        style={{ width: `${va}%`, background: intensityColor(va) }}
                                                    />
                                                </span>
                                            </div>

                                            <div className="order-first text-[11.5px] font-semibold text-gray-700 md:order-none md:text-center md:font-normal md:text-gray-600">
                                                {label}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="flex h-[7px] flex-1 justify-start overflow-hidden rounded-full bg-gray-100">
                                                    <span
                                                        className="block h-full rounded-full"
                                                        style={{ width: `${vb}%`, background: intensityColor(vb) }}
                                                    />
                                                </span>
                                                <span
                                                    className={`w-6 flex-shrink-0 text-center text-[12.5px] tabular-nums ${vb > va ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                                                >
                                                    {vb}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Ranking rail                                                              */
/* -------------------------------------------------------------------------- */

function RankingRail({ onSelect, copy }: { onSelect: (key: string) => void; copy: Copy }) {
    const railRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const updateArrows = useCallback(() => {
        const el = railRef.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = railRef.current;
        if (!el) return;
        updateArrows();
        el.addEventListener('scroll', updateArrows, { passive: true });
        window.addEventListener('resize', updateArrows);
        return () => {
            el.removeEventListener('scroll', updateArrows);
            window.removeEventListener('resize', updateArrows);
        };
    }, [updateArrows]);

    const scrollBy = (direction: 'left' | 'right') => {
        const el = railRef.current;
        if (!el) return;
        const step = 176 * 3;
        el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
    };

    const arrowClass =
        'flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-700 disabled:cursor-default disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600';

    return (
        <section className="bg-white pb-10">
            <div className={WRAP} style={WRAP_STYLE}>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3 sm:px-6">
                        <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-gray-900">
                            {copy.railTitle}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-[11px] text-gray-400 lg:inline">{copy.railHint}</span>
                            <div className="hidden items-center gap-1.5 md:flex">
                                <button
                                    type="button"
                                    onClick={() => scrollBy('left')}
                                    disabled={atStart}
                                    aria-label={copy.scrollLeft}
                                    className={arrowClass}
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollBy('right')}
                                    disabled={atEnd}
                                    aria-label={copy.scrollRight}
                                    className={arrowClass}
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div ref={railRef} className="scrollbar-hide flex snap-x snap-proximity overflow-x-auto">
                        {JURISDICTIONS.map((j) => (
                            <button
                                key={j.key}
                                type="button"
                                onClick={() => onSelect(j.key)}
                                className="group w-44 flex-shrink-0 snap-start border-r border-gray-100 px-4 pb-4 pt-3.5 text-left transition-colors last:border-r-0 hover:bg-gray-50"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[11px] tabular-nums text-gray-400">
                                        {String(j.rank).padStart(2, '0')}
                                    </span>
                                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                                        {Math.round(j.composite)}
                                    </span>
                                </div>
                                <div className="mt-2 h-[34px] overflow-hidden text-[13px] leading-[1.3] text-gray-800 transition-colors group-hover:text-primary-700">
                                    {j.display}
                                </div>
                                <div className="mt-1 h-[3px] rounded-full bg-gray-100">
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: `${j.composite}%`, background: intensityColor(j.composite) }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page body                                                                 */
/* -------------------------------------------------------------------------- */

export default function GlobalPolicyMap() {
    const { language } = useLanguage();
    const copy = content[language];

    const [geo, setGeo] = useState<GeoData | null>(null);
    const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [canHover, setCanHover] = useState(false);
    const [keyA, setKeyA] = useState('EU');
    const [keyB, setKeyB] = useState('US Federal');

    useEffect(() => {
        setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch('/data/ai-policy-geo.json')
            .then((res) => res.json())
            .then((data: GeoData) => {
                if (!cancelled) setGeo(data);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const keyFromTarget = (target: EventTarget | null): string | null =>
        target instanceof Element ? target.getAttribute('data-jkey') : null;

    const handleOver = useCallback(
        (e: React.MouseEvent) => {
            if (!canHover) return;
            const key = keyFromTarget(e.target);
            setHover(key ? { key, x: e.clientX, y: e.clientY } : null);
        },
        [canHover]
    );

    const handleClick = useCallback((e: React.MouseEvent) => {
        const key = keyFromTarget(e.target);
        if (key) {
            setHover(null);
            setSelectedKey(key);
        }
    }, []);

    const closeDetail = useCallback(() => setSelectedKey(null), []);

    /* Close the drawer, load it into slot A, then scroll — the delay lets the
       exit animation finish and the drawer's scroll-lock cleanup run first. */
    const compareFromDetail = useCallback((key: string) => {
        setSelectedKey(null);
        setKeyA(key);
        setTimeout(() => {
            const el = document.getElementById(COMPARE_ID);
            if (!el) return;
            if (window.__lenis) window.__lenis.scrollTo(el, { offset: -100, duration: 1 });
            else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 450);
    }, []);

    /* Memoised so tooltip movement never re-reconciles 240 paths. */
    const countryPaths = useMemo(
        () =>
            geo?.world.map((shape) => {
                const key = COUNTRY_LOOKUP[shape.n];
                const jurisdiction = key ? JURISDICTION_BY_KEY[key] : undefined;
                return (
                    <path
                        key={shape.n}
                        d={shape.d}
                        data-jkey={key || undefined}
                        fill={jurisdiction ? intensityColor(jurisdiction.composite) : UNSCORED_FILL}
                        stroke="#FFFFFF"
                        strokeWidth={0.6}
                        style={{ cursor: jurisdiction ? 'pointer' : 'default' }}
                    >
                        {jurisdiction && (
                            <title>{`${jurisdiction.display} — ${Math.round(jurisdiction.composite)}`}</title>
                        )}
                    </path>
                );
            }),
        [geo]
    );

    const statePaths = useMemo(
        () =>
            geo?.states.map((shape) => {
                const key = STATE_LOOKUP[shape.n];
                const jurisdiction = key ? JURISDICTION_BY_KEY[key] : undefined;
                return (
                    <path
                        key={shape.n}
                        d={shape.d}
                        data-jkey={key || undefined}
                        fill={jurisdiction ? intensityColor(jurisdiction.composite) : UNSCORED_FILL}
                        stroke="#FFFFFF"
                        strokeWidth={1}
                        style={{ cursor: jurisdiction ? 'pointer' : 'default' }}
                    >
                        {jurisdiction && (
                            <title>{`${jurisdiction.display} — ${Math.round(jurisdiction.composite)}`}</title>
                        )}
                    </path>
                );
            }),
        [geo]
    );

    const hovered = hover ? JURISDICTION_BY_KEY[hover.key] : null;
    const selected = selectedKey ? JURISDICTION_BY_KEY[selectedKey] : null;

    return (
        <>
            {/* Masthead band — one horizontal strip under the menu. */}
            <header className="border-b border-gray-200 bg-gray-50/80">
                <div className={`${WRAP} pt-5`} style={WRAP_STYLE}>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.16em] text-primary-600">
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                            {copy.eyebrow}
                        </div>
                        <div className="flex items-center gap-3 whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-gray-500">
                            <span>{copy.edition[0]}</span>
                            <span className="h-1 w-1 rounded-full bg-primary-500" />
                            <span>{copy.edition[1]}</span>
                        </div>
                    </div>
                </div>
                <div className={`${WRAP} flex flex-wrap items-baseline gap-x-8 gap-y-3 pb-5 pt-2.5`} style={WRAP_STYLE}>
                    <h1 className="flex-shrink-0 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                        {copy.title}
                    </h1>
                    <p className="min-w-[260px] flex-1 text-[13.5px] leading-relaxed text-gray-600">{copy.lead}</p>
                    <a
                        href={STUDY_URL}
                        className="flex-shrink-0 whitespace-nowrap rounded-full bg-gradient-to-br from-primary-400 to-primary-600 px-6 py-2.5 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
                    >
                        {copy.cta}
                    </a>
                </div>
            </header>

            {/* Map */}
            <section className="bg-white pb-6 pt-6">
                <div className={WRAP} style={WRAP_STYLE}>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
                        {geo ? (
                            <svg
                                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                                preserveAspectRatio="xMidYMid meet"
                                className="block h-auto w-full"
                                role="img"
                                aria-label={copy.title}
                                onMouseOver={handleOver}
                                onMouseLeave={() => setHover(null)}
                                onClick={handleClick}
                            >
                                <rect width={VIEW_W} height={VIEW_H} fill="#FFFFFF" />
                                <g shapeRendering="geometricPrecision">{countryPaths}</g>
                                <g shapeRendering="geometricPrecision">{statePaths}</g>
                                <g transform={`translate(${geo.eu.x},${geo.eu.y})`} style={{ cursor: 'pointer' }}>
                                    <circle
                                        r={7}
                                        data-jkey={EU_MARKER.key}
                                        fill={intensityColor(EU_MARKER.composite)}
                                        stroke="#FFFFFF"
                                        strokeWidth={1.6}
                                    />
                                    {/* White pill keeps the label readable over the dark
                                        Tier 1 cluster it sits on. */}
                                    <rect
                                        x={11}
                                        y={-7.5}
                                        width={23}
                                        height={15}
                                        rx={4}
                                        fill="#FFFFFF"
                                        fillOpacity={0.94}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    <text
                                        x={15}
                                        y={3.5}
                                        fontSize={10}
                                        fontWeight={700}
                                        fill="#111827"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        EU
                                    </text>
                                </g>
                            </svg>
                        ) : (
                            <div className="flex aspect-[960/470] w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
                                {copy.loading}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2.5">
                            <span>{copy.legendLow}</span>
                            <span
                                className="block h-2 w-40 rounded-full"
                                style={{
                                    background: `linear-gradient(to right, ${intensityColor(15)}, ${intensityColor(57.5)}, ${intensityColor(100)})`,
                                }}
                            />
                            <span>{copy.legendHigh}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full ring-1 ring-gray-300"
                                style={{ background: intensityColor(EU_MARKER.composite) }}
                            />
                            <span>{copy.euNote}</span>
                        </div>
                        <span className="italic text-gray-400">{copy.statesNote}</span>
                    </div>
                    {!canHover && <p className="mt-2.5 text-xs text-gray-400">{copy.tapHint}</p>}
                </div>
            </section>

            <CompareSection keyA={keyA} keyB={keyB} setKeyA={setKeyA} setKeyB={setKeyB} copy={copy} />

            <RankingRail onSelect={setSelectedKey} copy={copy} />

            {/* Methodology */}
            <section className="bg-white pb-14">
                <div className={WRAP} style={WRAP_STYLE}>
                    <div className="grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-[minmax(0,1fr)_320px]">
                        <p className="max-w-[78ch] text-xs leading-relaxed text-gray-500">{copy.methodology}</p>
                        <p className="text-xs leading-relaxed text-gray-500">
                            {copy.source}
                            {copy.note && <span className="mt-2 block text-gray-400">{copy.note}</span>}
                        </p>
                    </div>
                </div>
            </section>

            {hovered && hover && !selected && (
                <MapTooltip jurisdiction={hovered} origin={{ x: hover.x, y: hover.y }} copy={copy} />
            )}
            <DetailDrawer
                jurisdiction={selected}
                onClose={closeDetail}
                onCompare={compareFromDetail}
                copy={copy}
            />
        </>
    );
}

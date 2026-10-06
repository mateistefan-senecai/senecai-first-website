/**
 * Regulatory-intensity ramp for the jurisdiction map, kept inside the SenecAI
 * palette: pale gold (low) -> brand gold (mid) -> deep bronze (high).
 */
const STOPS: { at: number; rgb: [number, number, number] }[] = [
    { at: 15, rgb: [231, 220, 184] },
    { at: 57.5, rgb: [212, 175, 55] },
    { at: 100, rgb: [61, 50, 9] },
];

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

export function intensityColor(value: number): string {
    const v = Math.min(STOPS[STOPS.length - 1].at, Math.max(STOPS[0].at, value));
    let lo = STOPS[0];
    let hi = STOPS[STOPS.length - 1];
    for (let i = 0; i < STOPS.length - 1; i++) {
        if (v >= STOPS[i].at && v <= STOPS[i + 1].at) {
            lo = STOPS[i];
            hi = STOPS[i + 1];
            break;
        }
    }
    const span = hi.at - lo.at;
    const t = span === 0 ? 0 : (v - lo.at) / span;
    const c = lo.rgb.map((from, i) => from + (hi.rgb[i] - from) * t);
    return `#${hex(c[0])}${hex(c[1])}${hex(c[2])}`;
}

/** Fill for landmasses that are not part of the 22 scored jurisdictions. */
export const UNSCORED_FILL = '#EFEEEA';

export type Tier = 1 | 2 | 3;

/** Tier chip styling on light surfaces — black / gold / gray. */
export const TIER_CHIP: Record<Tier, string> = {
    1: 'bg-gray-900 text-white',
    2: 'bg-primary-500 text-black',
    3: 'bg-gray-200 text-gray-700',
};

/** Same hierarchy re-weighted for the black drawer header, where a
 *  near-black Tier 1 chip would vanish into the background. */
export const TIER_CHIP_ON_DARK: Record<Tier, string> = {
    1: 'bg-white text-gray-900',
    2: 'bg-primary-500 text-black',
    3: 'bg-white/15 text-white ring-1 ring-inset ring-white/25',
};

export const TIER_DOT: Record<Tier, string> = {
    1: 'bg-gray-900',
    2: 'bg-primary-500',
    3: 'bg-gray-400',
};

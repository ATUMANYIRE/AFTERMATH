/**
 * Pure deterministic 32-bit PRNG (Mulberry32).
 * Returns both the generated float in [0, 1) and the next 32-bit state integer,
 * enabling snapshot serialization and exact time-travel replay.
 */
export function nextRandom(state: number): { value: number; nextState: number } {
  const nextState = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(nextState ^ (nextState >>> 15), 1 | nextState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState };
}

/**
 * Generates deterministic bounded noise in [-amplitude, +amplitude].
 */
export function nextBoundedNoise(
  state: number,
  amplitude: number
): { delta: number; nextState: number } {
  const { value, nextState } = nextRandom(state);
  return {
    delta: (value * 2 - 1) * amplitude,
    nextState,
  };
}

/**
 * Clamps a numeric value within [min, max] and guards against NaN/Infinity.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Rounds to a fixed number of decimal places for clean deterministic floating-point output.
 */
export function roundTo(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

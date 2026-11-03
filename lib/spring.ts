// iOS describes springs by response (seconds) and damping ratio. GSAP wants
// an ease over a duration, so solve the spring once and hand back both.

export type Spring = { ease: (p: number) => number; duration: number };

const cache = new Map<string, Spring>();

export function spring(response = 0.5, damping = 0.86): Spring {
  const id = `${response}:${damping}`;
  const hit = cache.get(id);
  if (hit) return hit;

  const w0 = (2 * Math.PI) / response;
  const z = Math.min(damping, 0.9999);
  const wd = w0 * Math.sqrt(1 - z * z);
  const x = (t: number) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));

  // Settled once it stays within 0.1% of rest.
  let duration = response;
  for (let t = response * 0.5; t < 4; t += 0.005) {
    if (Math.abs(1 - x(t)) < 0.001 && Math.exp(-z * w0 * t) < 0.002) {
      duration = t;
      break;
    }
  }
  const s: Spring = { ease: (p) => (p >= 1 ? 1 : x(p * duration)), duration };
  cache.set(id, s);
  return s;
}

/** The system's default for app launches and window moves. */
export const LAUNCH = () => spring(0.52, 0.84);
/** Snappier, for small controls and sheets. */
export const SNAP = () => spring(0.38, 0.9);

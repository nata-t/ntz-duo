import { POSE_KEYS, type Pose } from "@/components/device/pose";

// The scroll story, as poses on a clock. One unit of story time is one
// viewport height of scrolling. Between keys every property follows a
// monotone cubic, so motion carries through the in-between poses without
// stopping at each, never overshoots (the fold can't pass flat), and comes
// to rest wherever two keys hold the same value.

export const HERO: Pose = { x: 0, y: 11, s: 0.5, view: -6, yaw: -16, pitch: 0, roll: 0, fold: 180, wake: 0, shadow: 1 };

/** Phones: a bigger device on display, and the open phone turned upright
 *  (roll 90) so its inner display runs portrait. */
const HERO_PORTRAIT: Pose = { ...HERO, y: 5, s: 1.02 };

function build(portrait: boolean) {
  const out: [number, Pose][] = [];
  const P = (land: Partial<Pose>, port: Partial<Pose>) => (portrait ? { ...land, ...port } : land);
  const hero = portrait ? HERO_PORTRAIT : HERO;
  let p = hero;
  const at = (t: number, patch: Partial<Pose>) => {
    p = { ...p, ...patch };
    out.push([t, p]);
  };
  at(0, {});
  // Turn to show the hinge, then the back with its cameras.
  at(1.15, P({ yaw: 172, s: 0.6, y: 1, view: -12, pitch: 4 }, { s: 1, y: 0 }));
  at(1.55, { yaw: 196, view: -10 });
  // Edge on, open side facing the viewer.
  at(2.2, P({ yaw: 270, s: 0.6, view: -4, pitch: 0 }, { s: 0.92 }));
  // Open like a book toward the viewer; the V stays symmetric.
  at(3.15, P({ fold: 16, yaw: 352, s: 0.68, view: -3, wake: 1, shadow: 0.6 }, { s: 0.66 }));
  // Flatten and come close: the display takes the viewport.
  at(3.9, P({ fold: 0, yaw: 360, s: 1, y: 0, view: 0, shadow: 0 }, { roll: 90 }));
  // Live: the visitor uses the phone.
  at(5.0, {});
  // Pull back, then fold into the tent and stand it up for StandBy.
  at(5.75, P({ s: 0.6, fold: 22, yaw: 349, view: -4, y: -4, shadow: 0.4 }, { s: 0.72 }));
  at(7.0, P({ fold: 118, roll: 90, pitch: -50, yaw: 334, view: -16, s: 0.46, y: -21, wake: 0, shadow: 1 }, { s: 0.62, y: -27 }));
  at(8.2, {});
  // Close and return to the opening pose, one turn on.
  at(9.6, { ...hero, yaw: hero.yaw + 360 });
  return out;
}

export const MARKS = {
  liveIn: 3.9,
  liveOut: 5.0,
  standbyIn: 7.0,
  standbyOut: 8.2,
};

export type Story = { keys: [number, Pose][]; poseAt: (t: number, out: Pose) => Pose };

export function createStory(portrait: boolean): Story {
  const keys = build(portrait);
  const times = keys.map(([t]) => t);
  // Fritsch–Carlson monotone cubic slopes, per property, computed once.
  const slopes: Record<string, number[]> = {};
  for (const prop of POSE_KEYS) {
    const v = keys.map(([, p]) => p[prop]);
    const n = v.length;
    const d: number[] = [];
    for (let i = 0; i < n - 1; i++) d.push((v[i + 1]! - v[i]!) / (times[i + 1]! - times[i]!));
    const m: number[] = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
      const a = d[i - 1]!, b = d[i]!;
      const h0 = times[i]! - times[i - 1]!, h1 = times[i + 1]! - times[i]!;
      m[i] = a * b <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / a + (h1 + 2 * h0) / b);
    }
    // Ends start and finish at rest.
    slopes[prop] = m;
  }

  const poseAt = (t: number, out: Pose): Pose => {
    const tt = Math.min(LENGTH, Math.max(0, t));
    let i = 0;
    while (i < times.length - 2 && tt > times[i + 1]!) i++;
    const t0 = times[i]!, t1 = times[i + 1]!;
    const h = t1 - t0;
    const s = h > 0 ? (tt - t0) / h : 0;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const a = keys[i]![1], b = keys[i + 1]![1];
    for (const prop of POSE_KEYS) {
      const m = slopes[prop]!;
      out[prop] = h00 * a[prop] + h10 * h * m[i]! + h01 * b[prop] + h11 * h * m[i + 1]!;
    }
    return out;
  };
  return { keys, poseAt };
}

export const LENGTH = 9.6;

/** 0 → 1 across [a, b] of story time, eased in and out. */
export function span(t: number, a: number, b: number): number {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

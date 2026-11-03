// A pose is everything the scroll story changes about the device. The
// stage tweens one plain object through a list of poses and the device
// reads it every frame.

export type Pose = {
  /** Offset from the viewport centre, in viewport units (vw, vh). */
  x: number;
  y: number;
  /** Scale relative to the zoomed-in size (1 = filling the viewport). */
  s: number;
  /** View elevation, yaw, then the device's own pitch and roll (degrees). */
  view: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Angle of the left half about the hinge: 0 open flat, 180 closed. */
  fold: number;
  /** Inner display brightness while it wakes (0 off, 1 on). */
  wake: number;
  /** Ground shadow strength. */
  shadow: number;
};

export const POSE_KEYS = ["x", "y", "s", "view", "yaw", "pitch", "roll", "fold", "wake", "shadow"] as const;

export function clonePose(p: Pose): Pose {
  return { ...p };
}

// --- tiny 3D math for face shading -------------------------------------

type V = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;

function rx(v: V, a: number): V {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}
function ry(v: V, a: number): V {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
function rz(v: V, a: number): V {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

/** World-space normal of a face, given its normal inside the device. CSS
 *  applies the transform list right to left, so the innermost turn runs first. */
export function worldNormal(p: Pose, n: V, half: "L" | "R"): V {
  let v = n;
  if (half === "L") v = ry(v, p.fold);
  v = rz(v, p.roll);
  v = rx(v, p.pitch);
  v = ry(v, p.yaw);
  v = rx(v, p.view);
  return v;
}

// CSS y points down, so a light from above has a negative y.
const LIGHT: V = (() => {
  const v: V = [-0.35, -0.55, 1];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

/** 0 when a face looks straight at the light, up to 1 when it turns away. */
export function shade(n: V): number {
  const d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
  return Math.min(1, Math.max(0, 1 - d));
}

/** Where a specular streak sits across a face, from its normal's x tilt. */
export function glint(n: V): number {
  return 50 + n[0] * 120;
}

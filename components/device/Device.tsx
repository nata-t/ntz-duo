"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { BEZEL, BODY, HALF, INNER, OUTER, PLATEAU, R_HINGE, R_OUT, RIM, T, outline, stripTone, type Seg } from "./geometry";
import { type Pose, glint, shade, worldNormal } from "./pose";
import s from "./device.module.css";

export type DeviceHandle = { apply: (p: Pose) => void };

type Props = {
  /** Points to CSS px: the zoom at which the device fills the viewport. */
  k: number;
  /** Inner display content, rendered once per half while the device folds. */
  inner: (half: "L" | "R") => React.ReactNode;
  /** The live inner display, shown only while the device lies open flat. */
  live: React.ReactNode;
  /** The outer display (Lock Screen, StandBy). */
  outer: React.ReactNode;
  /** The inner display runs portrait: its content is turned a quarter
   *  inside the glass so it stands upright once the device is. */
  portrait?: boolean;
  /** Star White titanium, or Night Sky (dark blue). */
  finish?: Finish;
};

export type Finish = "star" | "night";

// The device is a CSS 3D object: two slabs joined at the hinge. Each slab
// has a front face, a back face and a side wall of thin strips stood on
// edge around its rounded outline. The group's origin is the centre of the
// hinge; the left slab turns about it to fold.
const Device = forwardRef<DeviceHandle, Props>(function Device({ k, inner, live, outer, portrait = false, finish = "star" }, ref) {
  const group = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const halves = useRef<HTMLDivElement[]>([]);
  const shades = useRef<Record<string, HTMLDivElement | null>>({});
  const glare = useRef<HTMLDivElement[]>([]);
  const wakeRef = useRef<HTMLDivElement[]>([]);
  const crease = useRef<HTMLDivElement>(null);
  const last = useRef({ live: false, pull: 0 });

  const u = (v: number) => v * k;
  const hw = HALF.w, h = HALF.h;

  // Side walls: left slab rounds its far (left) corners, right slab its far
  // (right) corners; the hinge corners are nearly square.
  const wallL = useMemo(() => outline(hw, h, [R_OUT, R_HINGE, R_HINGE, R_OUT]), [hw, h]);
  const wallR = useMemo(() => outline(hw, h, [R_HINGE, R_OUT, R_OUT, R_HINGE]), [hw, h]);
  const plateauX = hw - PLATEAU.inset - PLATEAU.w;
  const wallP = useMemo(
    () => outline(PLATEAU.w, PLATEAU.h, [PLATEAU.h / 2, PLATEAU.h / 2, PLATEAU.h / 2, PLATEAU.h / 2], 6),
    [],
  );

  useImperativeHandle(ref, () => ({
    apply(p: Pose) {
      const g = group.current, l = left.current;
      if (!g || !l) return;
      // Closed, the device's mass sits right of the hinge: shift it back so
      // every turn pivots about what the eye reads as the centre.
      const cx = -(hw * k * 0.5) * Math.min(1, p.fold / 180);
      g.style.transform =
        `translate3d(${p.x}vw, ${p.y}vh, 0) scale(${p.s}) rotateX(${p.view}deg) rotateY(${p.yaw}deg) ` +
        `rotateX(${p.pitch}deg) rotateZ(${p.roll}deg) translateX(${cx}px)`;
      l.style.transform = `rotateY(${p.fold}deg)`;

      const nRf = worldNormal(p, [0, 0, 1], "R");
      const nLf = worldNormal(p, [0, 0, 1], "L");
      const nRb = worldNormal(p, [0, 0, -1], "R");
      const nLb = worldNormal(p, [0, 0, -1], "L");
      const set = (key: string, v: number) => {
        const el = shades.current[key];
        if (el) el.style.opacity = v.toFixed(3);
      };
      set("Lf", shade(nLf) * 0.55);
      set("Rf", shade(nRf) * 0.55);
      set("Lb", shade(nLb) * 0.4);
      set("Rb", shade(nRb) * 0.34);
      const gl = [glint(nLf), glint(nRf)];
      glare.current.forEach((el, i) => {
        el.style.backgroundPosition = `${gl[i]}% 0`;
        el.style.opacity = String(0.35 + 0.65 * Math.min(1, p.fold / 60));
      });
      wakeRef.current.forEach((el) => (el.style.opacity = String(1 - p.wake)));
      // The display wakes with a focus pull, as in Apple's film: soft and
      // dim, settling sharp. Only while it happens: blur isn't free.
      const pull = p.wake > 0.02 && p.wake < 0.985 ? (1 - p.wake) * 16 : 0;
      if (pull !== last.current.pull) {
        last.current.pull = pull;
        halves.current.forEach((el) => (el.style.filter = pull ? `blur(${pull.toFixed(1)}px) saturate(${(1 + (1 - p.wake) * 0.4).toFixed(2)})` : ""));
      }
      if (crease.current) crease.current.style.opacity = String(Math.min(1, p.fold / 25));

      // Hand the screen over between the mirrored halves and the live
      // display once the device lies flat.
      const flat = p.fold < 0.4;
      if (flat !== last.current.live) {
        last.current.live = flat;
        if (liveRef.current) liveRef.current.style.visibility = flat ? "visible" : "hidden";
        halves.current.forEach((el) => (el.style.visibility = flat ? "hidden" : "visible"));
      }
    },
  }));

  const screenInset = BEZEL + RIM;
  const half = (side: "L" | "R") => {
    const isL = side === "L";
    const walls = isL ? wallL : wallR;
    const far = isL ? "left" : "right";
    const radius = isL
      ? `${u(R_OUT)}px ${u(R_HINGE)}px ${u(R_HINGE)}px ${u(R_OUT)}px`
      : `${u(R_HINGE)}px ${u(R_OUT)}px ${u(R_OUT)}px ${u(R_HINGE)}px`;
    const backRadius = isL
      ? `${u(R_HINGE)}px ${u(R_OUT)}px ${u(R_OUT)}px ${u(R_HINGE)}px`
      : `${u(R_OUT)}px ${u(R_HINGE)}px ${u(R_HINGE)}px ${u(R_OUT)}px`;
    const glassR = (r: number) => `${u(r)}px`;
    const innerRadius = isL
      ? `${glassR(R_OUT - RIM)} 0 0 ${glassR(R_OUT - RIM)}`
      : `0 ${glassR(R_OUT - RIM)} ${glassR(R_OUT - RIM)} 0`;
    const screenRadius = isL
      ? `${glassR(R_OUT - screenInset)} 0 0 ${glassR(R_OUT - screenInset)}`
      : `0 ${glassR(R_OUT - screenInset)} ${glassR(R_OUT - screenInset)} 0`;

    return (
      <div
        ref={isL ? left : undefined}
        className={s.half}
        style={{
          left: isL ? u(-hw) : 0,
          top: u(-h / 2),
          width: u(hw),
          height: u(h),
          transformOrigin: isL ? "100% 50% 0" : undefined,
        }}
      >
        <Wall segs={walls} k={k} z0={0} depth={T} finish={finish} />

        {/* Front: titanium band, black glass, then the display running to the hinge. */}
        <div className={`${s.face} ${s.front}`} style={{ borderRadius: radius }}>
          <div
            className={s.glass}
            style={{
              borderRadius: innerRadius,
              inset: isL ? `${u(RIM)}px 0 ${u(RIM)}px ${u(RIM)}px` : `${u(RIM)}px ${u(RIM)}px ${u(RIM)}px 0`,
            }}
          >
            <div
              className={s.screen}
              style={{
                borderRadius: screenRadius,
                top: u(BEZEL),
                bottom: u(BEZEL),
                [far]: u(BEZEL),
                [isL ? "right" : "left"]: 0,
              }}
            >
              <div
                ref={(el) => {
                  if (el) halves.current[isL ? 0 : 1] = el;
                }}
                className={s.mirror}
                style={{ width: u(INNER.w), height: u(INNER.h), left: isL ? 0 : u(-INNER.w / 2) }}
              >
                <div style={{ width: INNER.w, height: INNER.h, zoom: k }}>
                  <Upright portrait={portrait}>{inner(side)}</Upright>
                </div>
              </div>
              <div
                ref={(el) => {
                  if (el) wakeRef.current[isL ? 0 : 1] = el;
                }}
                className={s.sleep}
              />
              {isL ? null : <div ref={crease} className={s.crease} />}
              <div
                ref={(el) => {
                  if (el) glare.current[isL ? 0 : 1] = el;
                }}
                className={s.glare}
              />
            </div>
          </div>
          <div ref={(el) => void (shades.current[`${side}f`] = el)} className={s.shade} style={{ borderRadius: radius }} />
        </div>

        {/* Back: the outer display on the left slab, back glass and cameras on the right. */}
        <div
          className={`${s.face} ${s.back}`}
          style={{ borderRadius: backRadius, transform: `translateZ(${u(-T)}px) rotateY(180deg)` }}
        >
          {isL ? (
            <div className={s.glass} style={{ borderRadius: backRadius, inset: u(RIM) }}>
              <div
                className={s.outer}
                style={{
                  width: u(OUTER.w),
                  height: u(OUTER.h),
                  left: u((hw - 2 * RIM - OUTER.w) / 2),
                  top: u((h - 2 * RIM - OUTER.h) / 2),
                  borderRadius: `${u(4)}px ${u(R_OUT - 12)}px ${u(R_OUT - 12)}px ${u(4)}px`,
                }}
              >
                <div className={s.outerContent} style={{ width: OUTER.w, height: OUTER.h, zoom: k }}>
                  {outer}
                </div>
                <div className={s.punch} style={{ width: u(26), height: u(26), right: u(22), top: u(22) }} />
              </div>
            </div>
          ) : (
            <div className={s.backGlass} style={{ borderRadius: backRadius, inset: u(RIM - 1) }} />
          )}
          <div ref={(el) => void (shades.current[`${side}b`] = el)} className={s.shade} style={{ borderRadius: backRadius }} />
        </div>

        {isL ? null : (
          <>
            <Wall segs={wallP} k={k} z0={-T} depth={PLATEAU.depth} ox={plateauX} oy={PLATEAU.inset} tone="plateau" finish={finish} />
            <div
              className={s.plateau}
              style={{
                left: u(plateauX),
                top: u(PLATEAU.inset),
                width: u(PLATEAU.w),
                height: u(PLATEAU.h),
                borderRadius: u(PLATEAU.h / 2),
                transform: `translateZ(${u(-T - PLATEAU.depth)}px) rotateY(180deg)`,
              }}
            >
              <Lens k={k} x={14} />
              <Lens k={k} x={14 + 102} />
              <span className={s.flash} style={{ width: u(22), height: u(22), left: u(234), top: u(30) }} />
              <span className={s.mic} style={{ width: u(7), height: u(7), left: u(241), top: u(80) }} />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div ref={group} className={s.group} data-finish={finish}>
      {half("R")}
      {half("L")}
      <div
        ref={liveRef}
        className={s.live}
        style={{
          left: u(-INNER.w / 2),
          top: u(-INNER.h / 2),
          width: u(INNER.w),
          height: u(INNER.h),
          borderRadius: u(R_OUT - BEZEL - RIM),
          visibility: "hidden",
        }}
      >
        <div style={{ width: INNER.w, height: INNER.h, zoom: k }}>
          <Upright portrait={portrait}>{live}</Upright>
        </div>
      </div>
    </div>
  );
});

export default Device;

/** Holds the inner display's content, turned a quarter for portrait. */
function Upright({ portrait, children }: { portrait: boolean; children: React.ReactNode }) {
  if (!portrait) return <>{children}</>;
  return (
    <div
      className="absolute"
      style={{ width: INNER.h, height: INNER.w, left: (INNER.w - INNER.h) / 2, top: (INNER.h - INNER.w) / 2, transform: "rotate(-90deg)" }}
    >
      {children}
    </div>
  );
}

/** Body size in CSS px at zoom k (for layout outside the device). */
export function bodySize(k: number) {
  return { w: BODY.w * k, h: BODY.h * k };
}

function Wall({
  segs,
  k,
  z0,
  depth,
  ox = 0,
  oy = 0,
  tone = "rim",
  finish,
}: {
  finish: Finish;
  segs: Seg[];
  k: number;
  z0: number;
  depth: number;
  ox?: number;
  oy?: number;
  tone?: "rim" | "plateau";
}) {
  return (
    <>
      {segs.map((g, i) => {
        const t = stripTone(g.phi);
        // Titanium: a bright machined lip at each edge and a satin middle.
        // Star White is a warm silver; Night Sky a deep blue that still
        // catches the light on its polished lips.
        const night = finish === "night";
        const c = (base: number, gain: number, tint: [number, number, number]) => {
          const v = base + gain * t;
          return `rgb(${Math.round(v + tint[0])},${Math.round(v + tint[1])},${Math.round(v + tint[2])})`;
        };
        const tint: [number, number, number] = night ? [-6, 0, 18] : [0, -3, -8];
        const lo = night ? c(18, 30, tint) : c(110, 60, tint);
        const hi = night ? c(70, 70, tint) : c(205, 45, tint);
        const mid = night ? c(34, 40, tint) : c(178, 55, tint);
        const bg =
          tone === "rim"
            ? `linear-gradient(90deg, ${lo} 0%, ${hi} 9%, ${mid} 30%, ${mid} 50%, ${mid} 70%, ${hi} 91%, ${lo} 100%)`
            : `linear-gradient(90deg, ${hi}, ${mid})`;
        return (
          <div
            key={i}
            className={s.strip}
            style={{
              width: depth * k,
              height: g.len * k,
              marginLeft: (-depth * k) / 2,
              marginTop: (-g.len * k) / 2,
              transform: `translate3d(${(ox + g.x) * k}px, ${(oy + g.y) * k}px, ${(z0 - depth / 2) * k}px) rotateZ(${g.phi}deg) rotateY(90deg)`,
              background: bg,
            }}
          />
        );
      })}
    </>
  );
}

function Lens({ k, x }: { k: number; x: number }) {
  return (
    <span className={s.lens} style={{ width: k * 96, height: k * 96, left: k * x, top: k * 14 }}>
      <span className={s.lensGlass} />
    </span>
  );
}

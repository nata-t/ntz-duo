"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { BEZEL, BODY, BUTTONS, HALF, INNER, OUTER, PLATEAU, R_HINGE, R_OUT, RIM, T, TEX, outline, type Seg } from "./geometry";
import { type Pose, glint, shade, worldNormal } from "./pose";
import { paintFacet, type Facet, type Finish } from "./material";

export type { Finish };
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

type Register = (el: HTMLElement | null, phi: number, half: "L" | "R", soft?: boolean) => void;

// Every plane keeps backface-visibility hidden so only the side facing the
// camera paints; that also keeps the browser from sorting planes it can't
// see. Metal is painted per frame (material.ts); the classes here are glass,
// optics and the static layers.
const FINISH: Record<Finish, string> = { star: "finish-star", night: "finish-night" };
const FACE = "absolute inset-0 overflow-hidden backface-hidden";
const STRIP = "absolute top-0 left-0 bg-[#9a968f] backface-hidden";
/** Cover glass: a broad reflection that slides as the glass turns. */
const GLARE =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.06)_42%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.04)_57%,rgba(255,255,255,0)_70%)] bg-size-[260%_100%] mix-blend-screen";

// The device is a CSS 3D object: two slabs joined at the hinge. Each slab
// has a front face, a back face and a side wall of thin strips stood on
// edge around its rounded outline. The group's origin is the centre of the
// hinge; the left slab turns about it to fold.
//
// Materials: the fronts wear the UI kit's own bezel renders (rim line,
// charcoal glass, hinge block), so face-on the phone is the kit's phone.
// Everything that turns away from the camera is lit live: the polished
// walls reflect a studio (material.ts), the satin back catches a sheen
// that slides with the angle.
const Device = forwardRef<DeviceHandle, Props>(function Device({ k, inner, live, outer, portrait = false, finish = "star" }, ref) {
  const group = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const liveBezel = useRef<HTMLDivElement>(null);
  const halves = useRef<HTMLDivElement[]>([]);
  const shades = useRef<Record<string, HTMLDivElement | null>>({});
  const glare = useRef<HTMLDivElement[]>([]);
  const sheen = useRef<HTMLDivElement | null>(null);
  const wakeRef = useRef<HTMLDivElement[]>([]);
  const crease = useRef<HTMLDivElement>(null);
  const facets = useRef<Map<HTMLElement, Facet>>(new Map());
  const last = useRef({ live: false, pull: 0 });
  const lastPose = useRef<Pose | null>(null);

  const register: Register = (el, phi, half, soft) => {
    if (el && !facets.current.has(el)) facets.current.set(el, { el, phi, half, soft });
  };

  const u = (v: number) => v * k;
  const hw = HALF.w, h = HALF.h;

  // Side walls: left slab rounds its far (left) corners, right slab its far
  // (right) corners; the hinge corners are nearly square.
  const wallL = useMemo(() => outline(hw, h, [R_OUT, R_HINGE, R_HINGE, R_OUT], 6), [hw, h]);
  const wallR = useMemo(() => outline(hw, h, [R_HINGE, R_OUT, R_OUT, R_HINGE], 6), [hw, h]);
  const plateauX = hw - PLATEAU.inset - PLATEAU.w;
  const wallP = useMemo(() => outline(PLATEAU.w, PLATEAU.h, [PLATEAU.h / 2, PLATEAU.h / 2, PLATEAU.h / 2, PLATEAU.h / 2], 7), []);

  useImperativeHandle(ref, () => ({
    apply(p: Pose) {
      const g = group.current, l = left.current;
      if (!g || !l) return;
      lastPose.current = { ...p };
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
      set("Lf", shade(nLf) * 0.4);
      set("Rf", shade(nRf) * 0.4);
      set("Lb", shade(nLb) * 0.35);
      set("Rb", shade(nRb) * 0.22);
      const gl = [glint(nLf), glint(nRf)];
      glare.current.forEach((el, i) => {
        el.style.backgroundPosition = `${gl[i]}% 0`;
        el.style.opacity = String(0.35 + 0.65 * Math.min(1, p.fold / 60));
      });
      // The back's satin sheen sits where the softbox would reflect.
      if (sheen.current) {
        sheen.current.style.backgroundPosition = `${50 - nRb[0] * 140}% ${30 - nRb[1] * 140}%`;
        sheen.current.style.opacity = String(0.35 + 0.65 * Math.max(0, nRb[2]));
      }
      facets.current.forEach((f) => paintFacet(f, p, finish));

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
        const v = flat ? "visible" : "hidden";
        if (liveRef.current) liveRef.current.style.visibility = v;
        if (liveBezel.current) liveBezel.current.style.visibility = v;
        halves.current.forEach((el) => (el.style.visibility = flat ? "hidden" : "visible"));
      }
    },
  }));

  // A new finish repaints the metal even when nothing is moving.
  useEffect(() => {
    const p = lastPose.current;
    if (p) facets.current.forEach((f) => paintFacet(f, p, finish));
  }, [finish]);

  const inset = BEZEL + RIM;
  const innerTex = `url(/device/inner-${finish}.webp)`;
  const outerTex = `url(/device/outer-${finish}.webp)`;

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

    return (
      <div
        ref={isL ? left : undefined}
        className="absolute transform-3d"
        style={{ left: isL ? u(-hw) : 0, top: u(-h / 2), width: u(hw), height: u(h), transformOrigin: isL ? "100% 50% 0" : undefined }}
      >
        <Wall segs={walls} k={k} z0={0} depth={T} side={side} register={register} />
        {isL ? null : <Buttons k={k} register={register} />}

        {/* Front: the display running to the hinge, under the kit's bezel. */}
        <div className={`${FACE} bg-transparent`} style={{ borderRadius: radius }}>
          <div className="absolute isolate overflow-hidden bg-black" style={{ top: u(inset), bottom: u(inset), [far]: u(inset), [isL ? "right" : "left"]: 0 }}>
            <div
              ref={(el) => {
                if (el) halves.current[isL ? 0 : 1] = el;
              }}
              className="pointer-events-none absolute top-0"
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
              className="pointer-events-none absolute inset-0 bg-black"
            />
            {/* The fold reads as a soft crease once the halves leave the flat. */}
            {isL ? null : <div ref={crease} className="pointer-events-none absolute inset-y-0 -left-[18px] w-[36px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.16)_38%,rgba(255,255,255,0.1)_52%,rgba(0,0,0,0.12)_62%,rgba(0,0,0,0)_100%)] opacity-0" />}
            <div
              ref={(el) => {
                if (el) glare.current[isL ? 0 : 1] = el;
              }}
              className={GLARE}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: innerTex,
              backgroundSize: `${u(TEX.inner.w)}px ${u(TEX.inner.h)}px`,
              backgroundPosition: `${-u(TEX.inner.x + (isL ? 0 : hw))}px ${-u(TEX.inner.y)}px`,
            }}
          />
          <div ref={(el) => void (shades.current[`${side}f`] = el)} className="pointer-events-none absolute inset-0 bg-black opacity-0" style={{ borderRadius: radius }} />
        </div>

        {/* Back: the outer display on the left slab, satin glass and cameras on the right. */}
        <div className={`${FACE} bg-(image:--back-rim)`} style={{ borderRadius: backRadius, transform: `translateZ(${u(-T)}px) rotateY(180deg)` }}>
          {isL ? (
            <>
              <div
                className="absolute isolate overflow-hidden bg-black"
                style={{ width: u(OUTER.w), height: u(OUTER.h), left: u(TEX.outerScreen.x), top: u(TEX.outerScreen.y) }}
              >
                <div className="absolute top-0 left-0" style={{ width: OUTER.w, height: OUTER.h, zoom: k }}>
                  {outer}
                </div>
                <div className={`${GLARE} opacity-50`} />
              </div>
              <div
                className="pointer-events-none absolute inset-0 bg-no-repeat"
                style={{
                  backgroundImage: outerTex,
                  backgroundSize: `${u(TEX.outer.w)}px ${u(TEX.outer.h)}px`,
                  backgroundPosition: `${-u(TEX.outer.x)}px ${-u(TEX.outer.y)}px`,
                }}
              />
            </>
          ) : (
            // Back glass: satin, with a fine frost and a soft sheen that moves.
            <div className="absolute overflow-hidden bg-[linear-gradient(172deg,var(--glass-top)_0%,var(--glass-mid)_52%,var(--glass-low)_100%)] shadow-[inset_0_0_0_0.6px_rgba(0,0,0,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.45)] before:absolute before:inset-0 before:opacity-(--glass-grain) before:mix-blend-overlay before:grain" style={{ borderRadius: backRadius, inset: u(2.2) }}>
              <div
                ref={sheen}
                className="absolute inset-0 bg-[radial-gradient(42%_30%_at_50%_50%,rgba(255,255,255,0.55),rgba(255,255,255,0.12)_55%,rgba(255,255,255,0)_100%)] bg-size-[260%_260%] bg-no-repeat mix-blend-soft-light"
              />
              <span className="absolute left-1/2 -translate-x-1/2 font-display font-semibold tracking-[0.02em] whitespace-nowrap text-(--mark) mix-blend-overlay" style={{ fontSize: u(15), bottom: u(64) }}>
                ntz duo
              </span>
            </div>
          )}
          <div ref={(el) => void (shades.current[`${side}b`] = el)} className="pointer-events-none absolute inset-0 bg-black opacity-0" style={{ borderRadius: backRadius }} />
        </div>

        {isL ? null : (
          <>
            <Wall segs={wallP} k={k} z0={-T} depth={PLATEAU.depth} ox={plateauX} oy={PLATEAU.inset} side="R" soft register={register} />
            {/* Camera plateau: the same glass, polished a little brighter. */}
            <div
              className="absolute bg-[radial-gradient(70%_90%_at_30%_10%,rgba(255,255,255,0.35),rgba(255,255,255,0)_60%),linear-gradient(170deg,var(--plateau-top)_0%,var(--plateau-low)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_2px_rgba(0,0,0,0.12)] backface-hidden"
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
              <Lens k={k} x={14 + 124} />
              <span className="absolute rounded-[50%] bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.9)_0_10%,rgba(255,255,255,0)_22%),repeating-radial-gradient(circle,#f3ead2_0_1.2px,#e1d5b4_1.2px_2.4px)] shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.12),0_0_0_1.5px_rgba(255,255,255,0.5)]" style={{ width: u(24), height: u(24), left: u(272), top: u(34) }} />
              <span className="absolute rounded-[50%] bg-[radial-gradient(circle,#1d1d1f_0_45%,#6f6c66_50%_100%)]" style={{ width: u(8), height: u(8), left: u(280), top: u(96) }} />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div ref={group} className={`absolute top-1/2 left-1/2 h-0 w-0 transform-3d will-change-transform ${FINISH[finish]}`}>
      {half("R")}
      {half("L")}
      <div
        ref={liveRef}
        className="absolute transform-[translateZ(0.6px)] overflow-hidden bg-black"
        style={{ left: u(-INNER.w / 2), top: u(-INNER.h / 2), width: u(INNER.w), height: u(INNER.h), borderRadius: u(42), visibility: "hidden" }}
      >
        <div style={{ width: INNER.w, height: INNER.h, zoom: k }}>
          <Upright portrait={portrait}>{live}</Upright>
        </div>
      </div>
      {/* The bezel again, over the live display, so its corners and the
          hinge block sit on top exactly as on the folding halves. */}
      <div
        ref={liveBezel}
        className="pointer-events-none absolute transform-[translateZ(1px)] bg-no-repeat backface-hidden"
        style={{
          left: u(-TEX.inner.w / 2),
          top: u(-TEX.inner.h / 2),
          width: u(TEX.inner.w),
          height: u(TEX.inner.h),
          backgroundImage: innerTex,
          backgroundSize: "100% 100%",
          visibility: "hidden",
        }}
      />
    </div>
  );
});

export default Device;

/** Holds the inner display's content, turned a quarter for portrait. */
function Upright({ portrait, children }: { portrait: boolean; children: React.ReactNode }) {
  if (!portrait) return <>{children}</>;
  return (
    <div
      className="absolute -rotate-90"
      style={{ width: INNER.h, height: INNER.w, left: (INNER.w - INNER.h) / 2, top: (INNER.h - INNER.w) / 2 }}
    >
      {children}
    </div>
  );
}

/** Body size in CSS px at zoom k (for layout outside the device). */
export function bodySize(k: number) {
  return { w: BODY.w * k, h: BODY.h * k };
}

/** A band of polished metal: thin strips stood on edge around an outline,
 *  each repainted from its own normal every frame. */
function Wall({
  segs,
  k,
  z0,
  depth,
  ox = 0,
  oy = 0,
  side,
  soft = false,
  register,
}: {
  segs: Seg[];
  k: number;
  z0: number;
  depth: number;
  ox?: number;
  oy?: number;
  side: "L" | "R";
  soft?: boolean;
  register: Register;
}) {
  return (
    <>
      {segs.map((g, i) => (
        <div
          key={i}
          ref={(el) => register(el, g.phi, side, soft)}
          className={STRIP}
          style={{
            width: depth * k,
            height: g.len * k,
            marginLeft: (-depth * k) / 2,
            marginTop: (-g.len * k) / 2,
            transform: `translate3d(${(ox + g.x) * k}px, ${(oy + g.y) * k}px, ${(z0 - depth / 2) * k}px) rotateZ(${g.phi}deg) rotateY(90deg)`,
          }}
        />
      ))}
    </>
  );
}

/** Volume buttons on the top edge and the side button, standing just
 *  proud of the band. */
function Buttons({ k, register }: { k: number; register: Register }) {
  const proud = 1.6, depth = T * 0.4;
  return (
    <>
      {BUTTONS.map((b) => {
        const top = b.edge === "top";
        const x = top ? b.at : HALF.w + proud;
        const y = top ? -proud : b.at;
        const phi = top ? -90 : 0;
        return (
          <div
            key={`${b.edge}${b.at}`}
            ref={(el) => register(el, phi, "R", true)}
            className={`${STRIP} shadow-[0_0_0_0.5px_rgba(0,0,0,0.25)]`}
            style={{
              width: depth * k,
              height: b.len * k,
              marginLeft: (-depth * k) / 2,
              marginTop: (-b.len * k) / 2,
              borderRadius: (depth * k) / 2,
              transform: `translate3d(${x * k}px, ${y * k}px, ${(-T / 2) * k}px) rotateZ(${phi}deg) rotateY(90deg)`,
            }}
          />
        );
      })}
    </>
  );
}

/** A lens: a polished ring around coated sapphire over black optics. */
function Lens({ k, x }: { k: number; x: number }) {
  const d = 114;
  return (
    <span className="absolute rounded-[50%] shadow-[0_2px_5px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.15)]" style={{ width: k * d, height: k * d, left: k * x, top: k * 14 }}>
      <span className="absolute inset-0 rounded-[50%] bg-[conic-gradient(from_210deg,var(--ring-a),var(--ring-b)_14%,var(--ring-c)_30%,var(--ring-d)_46%,var(--ring-a)_58%,var(--ring-b)_74%,var(--ring-c)_88%,var(--ring-a))] after:absolute after:inset-[7%] after:rounded-[50%] after:bg-[#0b0c0f] after:shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.08),inset_0_3px_6px_rgba(0,0,0,0.8)]" />
      <span className="absolute inset-[17%] overflow-hidden rounded-[50%] bg-[radial-gradient(circle_at_50%_50%,#020203_0_22%,#0d1018_23%_34%,#04050a_35%_52%,#15192a_53%_56%,#05060a_57%_100%)] shadow-[inset_0_0_0_1.2px_rgba(120,130,160,0.25),inset_0_0_12px_rgba(0,0,0,0.9)]">
        <span className="absolute inset-0 rounded-[50%] lens-flare" />
      </span>
    </span>
  );
}

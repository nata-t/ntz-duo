"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { BEZEL, BODY, BUTTONS, HALF, INNER, OUTER, PLATEAU, R_HINGE, R_OUT, RIM, T, TEX, outline, type Seg } from "./geometry";
import { type Pose, glint, shade, worldNormal } from "./pose";
import { paintFacet, type Facet, type Finish } from "./material";
import s from "./device.module.css";

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
        className={s.half}
        style={{ left: isL ? u(-hw) : 0, top: u(-h / 2), width: u(hw), height: u(h), transformOrigin: isL ? "100% 50% 0" : undefined }}
      >
        <Wall segs={walls} k={k} z0={0} depth={T} side={side} register={register} />
        {isL ? null : <Buttons k={k} register={register} />}

        {/* Front: the display running to the hinge, under the kit's bezel. */}
        <div className={`${s.face} ${s.front}`} style={{ borderRadius: radius }}>
          <div className={s.screen} style={{ top: u(inset), bottom: u(inset), [far]: u(inset), [isL ? "right" : "left"]: 0 }}>
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
          <div
            className={s.bezel}
            style={{
              backgroundImage: innerTex,
              backgroundSize: `${u(TEX.inner.w)}px ${u(TEX.inner.h)}px`,
              backgroundPosition: `${-u(TEX.inner.x + (isL ? 0 : hw))}px ${-u(TEX.inner.y)}px`,
            }}
          />
          <div ref={(el) => void (shades.current[`${side}f`] = el)} className={s.shade} style={{ borderRadius: radius }} />
        </div>

        {/* Back: the outer display on the left slab, satin glass and cameras on the right. */}
        <div className={`${s.face} ${s.back}`} style={{ borderRadius: backRadius, transform: `translateZ(${u(-T)}px) rotateY(180deg)` }}>
          {isL ? (
            <>
              <div
                className={s.outer}
                style={{ width: u(OUTER.w), height: u(OUTER.h), left: u(TEX.outerScreen.x), top: u(TEX.outerScreen.y) }}
              >
                <div className={s.outerContent} style={{ width: OUTER.w, height: OUTER.h, zoom: k }}>
                  {outer}
                </div>
                <div className={s.glare} style={{ opacity: 0.5 }} />
              </div>
              <div
                className={s.bezel}
                style={{
                  backgroundImage: outerTex,
                  backgroundSize: `${u(TEX.outer.w)}px ${u(TEX.outer.h)}px`,
                  backgroundPosition: `${-u(TEX.outer.x)}px ${-u(TEX.outer.y)}px`,
                }}
              />
            </>
          ) : (
            <div className={s.backGlass} style={{ borderRadius: backRadius, inset: u(2.2) }}>
              <div ref={sheen} className={s.sheen} />
              <span className={s.mark} style={{ fontSize: u(15), bottom: u(64) }}>
                ntz duo
              </span>
            </div>
          )}
          <div ref={(el) => void (shades.current[`${side}b`] = el)} className={s.shade} style={{ borderRadius: backRadius }} />
        </div>

        {isL ? null : (
          <>
            <Wall segs={wallP} k={k} z0={-T} depth={PLATEAU.depth} ox={plateauX} oy={PLATEAU.inset} side="R" soft register={register} />
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
              <Lens k={k} x={14 + 124} />
              <span className={s.flash} style={{ width: u(24), height: u(24), left: u(272), top: u(34) }} />
              <span className={s.mic} style={{ width: u(8), height: u(8), left: u(280), top: u(96) }} />
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
        className={s.liveBezel}
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
          className={s.strip}
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
            className={`${s.strip} ${s.button}`}
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

function Lens({ k, x }: { k: number; x: number }) {
  const d = 114;
  return (
    <span className={s.lens} style={{ width: k * d, height: k * d, left: k * x, top: k * 14 }}>
      <span className={s.lensRing} />
      <span className={s.lensGlass}>
        <span className={s.lensFlare} />
      </span>
    </span>
  );
}

"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HALF, INNER, OUTER } from "../geometry";
import type { Pose } from "../pose";
import type { DeviceHandle, Finish } from "../Device";
import { os } from "@/lib/os";
import { backlight, linearLevel } from "@/lib/backlight";
import { rasterize } from "@/lib/raster";
import { gsap } from "@/lib/gsap";
import { pressSide, releaseVolume, stepVolume } from "@/lib/buttons";
import { wake } from "@/lib/backlight";
import { stage } from "@/components/stage/stage-state";
import { HINGE, INNER_Z, OUTER_X, OUTER_Z, UNIT, createDuo, loadModel, type ButtonName, type Duo } from "./duo";

type Props = {
  k: number;
  inner: (half: "L" | "R") => React.ReactNode;
  live: React.ReactNode;
  outer: React.ReactNode;
  portrait?: boolean;
  finish?: Finish;
  /** The model is in and its first frame drawn. */
  onReady?: () => void;
};

/** Camera distance, matching the CSS perspective the rest of the stage uses. */
const DISTANCE = 2800;
/** Display elements run this far under the bezel on every open side, so
 *  the hole's anti-aliased edge always has picture beneath it. */
const BLEED = 3;
/** The display hole's corner (pt); the DOM's matches it plus the bleed. */
const HOLE_R = 48;
/** The folding halves run this far past the hinge into each other, so no
 *  hairline of page shows between them. */
const SEAM = 2;
/** Where the displays lie, in points from the hinge axis: a hair beneath
 *  each display's glass. */
const Z_INNER = (INNER_Z - HINGE) * UNIT - 0.2;
const Z_OUTER = (OUTER_Z - HINGE) * UNIT + 0.2;
const rad = (d: number) => (d * Math.PI) / 180;

type GL = {
  renderer: THREE.WebGLRenderer;
  css: CSS3DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  model: THREE.Group;
  L: THREE.Group;
  duo: Duo | null;
  cover: THREE.MeshBasicMaterial;
  objects: CSS3DObject[];
  size: { w: number; h: number };
};

// The device in WebGL: the measured iPhone Duo model (duo.ts) under a
// room's reflections. While a display shows the Lock Screen, the GPU
// draws it, folding with the glass. Once the phone is unlocked (and always
// once it lies flat) that display turns into a transparent hole over live
// DOM, which sits in a CSS 3D layer *under* the canvas, positioned by the
// same camera, so a slab passing in front of a display hides it the way
// glass and titanium would.
//
// Both layers are sized from this component's own box (never the window,
// whose width includes the scrollbar), so they can't drift apart.
const DeviceGL = forwardRef<DeviceHandle, Props>(function DeviceGL({ k, inner, live, outer, portrait = false, finish = "star", onReady }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const gl = useRef<GL | null>(null);
  const last = useRef({ pose: null as Pose | null, inner: "", outer: "", flat: true, shut: true });
  /** Whether the live display's latest picture is on the GPU. */
  const picture = useRef<{ ready: (leaving: boolean) => boolean }>({ ready: () => false });
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const [els] = useState(() => {
    if (typeof document === "undefined") return null;
    const make = () => {
      const d = document.createElement("div");
      // Composited once and kept: the displays only ever move, they never
      // need repainting for it.
      Object.assign(d.style, { backfaceVisibility: "hidden", overflow: "hidden", background: "#000", willChange: "transform, opacity", opacity: "0" });
      return d;
    };
    return { L: make(), R: make(), live: make(), outer: make() };
  });
  const sleep = useRef<HTMLDivElement[]>([]);
  const m4 = useRef(new THREE.Matrix4()).current, t4 = useRef(new THREE.Matrix4()).current;
  const eye = useRef(new THREE.Vector3()).current;

  // Scene, renderers, camera, environment, then the model. Once.
  useEffect(() => {
    const el = host.current;
    if (!el || !els) return;
    let alive = true;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const css = new CSS3DRenderer();
    Object.assign(css.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", opacity: "0", transition: "opacity 0.6s ease-out" });
    el.append(css.domElement, renderer.domElement);

    const scene = new THREE.Scene();
    // The studio every surface reflects: a softly lit room.
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.85;
    room.dispose();
    pmrem.dispose();
    // A tight depth range around the device, which never comes nearer than
    // ~1500 or goes further than ~4000: layers a fraction of a point apart
    // keep their order.
    const camera = new THREE.PerspectiveCamera(30, 1, 1200, 4600);
    camera.position.set(0, 0, DISTANCE);

    // root carries the pose, in points, hinge on the y axis. The model
    // inside it is in its own units, its hinge lifted onto that axis; L
    // turns with the cover half and carries its displays.
    const root = new THREE.Group();
    root.matrixAutoUpdate = false;
    const model = new THREE.Group();
    model.scale.setScalar(UNIT);
    model.position.z = -HINGE * UNIT;
    const L = new THREE.Group();
    root.add(model, L);
    scene.add(root);

    // Where a display shows through: transparent black that still writes
    // depth, so the slabs hide whatever display they pass in front of.
    const hole = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, toneMapped: false });
    // Cover glass over the live displays: reflections of the room only,
    // added onto the display underneath without touching its alpha.
    const cover = new THREE.MeshBasicMaterial({
      color: 0x000000,
      envMap: environment,
      combine: THREE.AddOperation,
      reflectivity: 0.12,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
    });

    // The displays, attached to the halves they belong to, each a touch
    // under its glass and centred on it, bleed included.
    const attach = (node: HTMLElement, parent: THREE.Object3D, at: { x: number; y: number; z: number }, back = false) => {
      const o = new CSS3DObject(node);
      o.position.set(at.x, at.y, at.z);
      if (back) o.rotation.y = Math.PI;
      parent.add(o);
      return o;
    };
    const objects = [
      attach(els.L, L, { x: -INNER.w / 4 - BLEED / 2 + SEAM / 2, y: 0, z: Z_INNER }),
      attach(els.R, root, { x: INNER.w / 4 + BLEED / 2 - SEAM / 2, y: 0, z: Z_INNER }),
      attach(els.live, root, { x: 0, y: 0, z: Z_INNER + 0.1 }),
      attach(els.outer, L, { x: OUTER_X * UNIT, y: 0, z: Z_OUTER }, true),
    ];

    gl.current = { renderer, css, scene, camera, root, model, L, duo: null, cover, objects, size: { w: 1, h: 1 } };

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || !gl.current) return;
      gl.current.size = { w, h };
      renderer.setSize(w, h, false);
      css.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = (2 * Math.atan(h / 2 / DISTANCE) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      redraw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const loader = new THREE.TextureLoader();
    const bezel = (url: string) => {
      const t = loader.load(url, () => redraw());
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const bezels = { star: bezel("/device/inner-star.webp"), night: bezel("/device/inner-night.webp") };

    loadModel()
      .then(async (group) => {
        if (!alive || !gl.current) return;
        const duo = createDuo(group, { anisotropy: renderer.capabilities.getMaxAnisotropy(), environment, bezel: bezels, cover, hole });
        model.add(duo.root);
        gl.current.duo = duo;
        await duo.setDark(finishRef.current === "night");
        duo.setPortrait(portraitRef.current);
        await duo.ready();
        if (!alive) return;
        // Compile every program now, so the first turn doesn't stall.
        await renderer.compileAsync(scene, camera).catch(() => {});
        if (!alive) return;
        redraw();
        renderer.domElement.style.opacity = "1";
        readyRef.current?.();
      })
      .catch((e) => {
        console.error(e);
        readyRef.current?.();
      });

    // Apps and the Home Screen fold through the GPU too, as a picture of
    // the live display (lib/raster.ts). It's retaken, in idle time, a beat
    // after anything on the display changes, so a fresh one is usually
    // waiting when the phone starts to fold; until it is, the plain DOM
    // halves stand in.
    const shot = { seen: 0, taken: -1, busy: false, timer: 0 };
    const liveRoot = () => document.querySelector<HTMLElement>('[data-os-root="live"]');
    const capture = async () => {
      const root = liveRoot(), duo = gl.current?.duo;
      if (!root || !duo || shot.busy || shot.taken === shot.seen) return;
      shot.busy = true;
      const v = shot.seen;
      try {
        const w = root.offsetWidth, h = root.offsetHeight;
        const pic = await rasterize(root, w, h, 1600 / Math.max(w, h));
        if (!alive) return;
        duo.setContent(pic);
        shot.taken = v;
      } catch (e) {
        console.warn("Display picture failed", e);
      } finally {
        shot.busy = false;
      }
      redraw();
      if (shot.taken !== shot.seen) later();
    };
    const later = (delay = 700) => {
      window.clearTimeout(shot.timer);
      shot.timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) window.requestIdleCallback(() => void capture(), { timeout: 600 });
        else void capture();
      }, delay);
    };
    const changed = () => {
      shot.seen++;
      later();
    };
    // Folding, the picture only has to be as new as the moment the phone
    // left flat: what changes after that (a ticking clock) is retaken in
    // the background and swapped in, never shown as a gap.
    let mark = 0;
    picture.current = {
      ready(leaving) {
        if (leaving) mark = shot.seen;
        const ok = shot.taken >= mark;
        if (!ok) {
          window.clearTimeout(shot.timer);
          void capture();
        }
        return ok;
      },
    };
    const watch = new MutationObserver(changed);
    let watched: HTMLElement | null = null;
    const find = window.setInterval(() => {
      const root = liveRoot();
      if (!root || root === watched) return;
      watched?.removeEventListener("scroll", changed, true);
      watch.disconnect();
      watched = root;
      watch.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
      root.addEventListener("scroll", changed, { capture: true, passive: true });
      changed();
    }, 1000);
    const offPicture = os.subscribe(changed);

    // The physical buttons. A press lands on the model (its edge has to
    // face the eye), travels in at once and springs back on release; the
    // phone answers on the way down, as iOS does. Holding a volume button
    // repeats.
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), ray = new THREE.Ray();
    const inv = new THREE.Matrix4(), eyeLocal = new THREE.Vector3();
    const buttonAt = (x: number, y: number): ButtonName | null => {
      const g = gl.current;
      if (!g?.duo || renderer.domElement.style.opacity !== "1") return null;
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      g.scene.updateMatrixWorld();
      raycaster.setFromCamera(ndc, g.camera);
      inv.copy(g.model.matrixWorld).invert();
      ray.copy(raycaster.ray).applyMatrix4(inv);
      eyeLocal.copy(g.camera.position).applyMatrix4(inv);
      return g.duo.buttonAt(ray, eyeLocal);
    };
    const travel: Record<ButtonName, { v: number }> = { volumeUp: { v: 0 }, volumeDown: { v: 0 }, side: { v: 0 }, camera: { v: 0 } };
    // In fast and firm; out on a little spring. A quick click still shows
    // the whole press: the release waits for the button to bottom out.
    const pressedAt: Record<ButtonName, number> = { volumeUp: 0, volumeDown: 0, side: 0, camera: 0 };
    const move = (n: ButtonName, to: number, duration: number) =>
      gsap.to(travel[n], {
        v: to,
        duration,
        delay: to ? 0 : Math.max(0, 0.11 - (performance.now() - pressedAt[n]) / 1000),
        ease: to ? "power3.out" : "back.out(2.6)",
        overwrite: true,
        onStart: () => {
          if (to) pressedAt[n] = performance.now();
        },
        onUpdate: () => {
          gl.current?.duo?.setPress(n, travel[n].v);
          redraw();
        },
      });
    let held: ButtonName | null = null, repeat = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || held) return;
      const n = buttonAt(e.clientX, e.clientY);
      if (!n) return;
      e.preventDefault();
      e.stopPropagation();
      held = n;
      pressedAt[n] = performance.now();
      move(n, 1, 0.08);
      if (n === "side") pressSide();
      if (n === "volumeUp" || n === "volumeDown") {
        const dir = n === "volumeUp" ? 1 : -1;
        stepVolume(dir);
        repeat = window.setTimeout(function again() {
          stepVolume(dir);
          repeat = window.setTimeout(again, 110);
        }, 450);
      }
    };
    const onUp = () => {
      if (!held) return;
      window.clearTimeout(repeat);
      if (held !== "side" && held !== "camera") releaseVolume();
      move(held, 0, 0.42);
      held = null;
    };
    let hoverAt: { x: number; y: number } | null = null, hovering = false, hoverFrame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hoverAt = { x: e.clientX, y: e.clientY };
      hoverFrame ||= requestAnimationFrame(() => {
        hoverFrame = 0;
        const on = !!hoverAt && buttonAt(hoverAt.x, hoverAt.y) !== null;
        if (on !== hovering) document.documentElement.style.cursor = (hovering = on) ? "pointer" : "";
      });
    };
    window.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    // A locked phone, StandBy and the minute turning change the displays
    // even while the pose holds still.
    const offOS = os.subscribe(() => redraw());
    const offStage = stage.subscribe(() => redraw());
    const offLight = backlight.subscribe(() => redraw());
    const clock = window.setInterval(() => {
      if (gl.current?.duo?.tick()) window.setTimeout(redraw, 60);
    }, 5000);

    return () => {
      alive = false;
      ro.disconnect();
      offOS();
      offStage();
      offLight();
      offPicture();
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(repeat);
      cancelAnimationFrame(hoverFrame);
      document.documentElement.style.cursor = "";
      watch.disconnect();
      watched?.removeEventListener("scroll", changed, true);
      window.clearInterval(find);
      window.clearTimeout(shot.timer);
      window.clearInterval(clock);
      objects.forEach((o) => o.removeFromParent());
      gl.current?.duo?.dispose();
      environment.dispose();
      Object.values(bezels).forEach((t) => t.dispose());
      renderer.dispose();
      css.domElement.remove();
      renderer.domElement.remove();
      gl.current = null;
    };
    // Built once per mount; finish, zoom and orientation have their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [els]);

  const finishRef = useRef(finish);
  finishRef.current = finish;
  const portraitRef = useRef(portrait);
  portraitRef.current = portrait;

  // The finish (and with it the Lock Screen's light or dark wallpaper).
  useEffect(() => {
    const duo = gl.current?.duo;
    if (!duo) return;
    void duo.setDark(finish === "night").then(() => redraw());
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  useEffect(() => {
    gl.current?.duo?.setPortrait(portrait);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait]);

  // DOM displays are sized in px at zoom k, then scaled back to points so
  // the scene can scale them with the device: at full size they land at
  // exactly 1:1, crisp.
  useEffect(() => {
    gl.current?.objects.forEach((o) => o.scale.setScalar(1 / k));
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  // Display element sizes, bleed included.
  useLayoutEffect(() => {
    if (!els) return;
    const px = (v: number) => `${v * k}px`, r = px(HOLE_R + BLEED);
    const half = { width: px(INNER.w / 2 + BLEED + SEAM), height: px(INNER.h + 2 * BLEED) };
    Object.assign(els.L.style, half, { borderRadius: `${r} 0 0 ${r}` });
    Object.assign(els.R.style, half, { borderRadius: `0 ${r} ${r} 0` });
    Object.assign(els.live.style, { width: px(INNER.w + 2 * BLEED), height: px(INNER.h + 2 * BLEED), borderRadius: r });
    // The outer display is nearly square on its hinge side.
    Object.assign(els.outer.style, { width: px(OUTER.w + 2 * BLEED), height: px(OUTER.h + 2 * BLEED), borderRadius: `${px(6 + BLEED)} ${r} ${r} ${px(6 + BLEED)}` });
  }, [els, k]);

  function redraw() {
    const p = last.current.pose;
    if (p) apply(p);
  }

  function apply(p: Pose) {
    const g = gl.current;
    last.current.pose = { ...p };
    if (!g || !els) return;
    const { w: vw, h: vh } = g.size;
    // Mirrors the CSS chain: translate, scale, view, yaw, pitch, roll, then
    // the closed device's mass shifted onto the pivot, so it centres itself
    // as it opens. CSS's y points down, so its X and Z turns flip sign here.
    const cx = -(HALF.w * 0.5) * Math.min(1, p.fold / 180);
    m4.makeTranslation((p.x * vw) / 100, (-p.y * vh) / 100, 0)
      .multiply(t4.makeScale(p.s * k, p.s * k, p.s * k))
      .multiply(t4.makeRotationX(-rad(p.view)))
      .multiply(t4.makeRotationY(rad(p.yaw)))
      .multiply(t4.makeRotationX(-rad(p.pitch)))
      .multiply(t4.makeRotationZ(-rad(p.roll)))
      .multiply(t4.makeTranslation(cx, 0, 0));
    g.root.matrix.copy(m4);
    g.root.matrixWorldNeedsUpdate = true;
    g.L.rotation.y = rad(p.fold);
    // Cover-glass reflections belong to the turning object, not to the
    // phone in use: they fade almost away as it comes flat and close.
    g.cover.reflectivity = 0.02 + 0.16 * Math.min(1, p.fold / 30 + Math.abs(1 - p.s) * 1.5);

    const flat = p.fold < 0.4;
    // Opening the phone wakes it, as a foldable does.
    if (p.fold < 178 && last.current.shut && !os.get().awake) wake();
    last.current.shut = p.fold >= 178;
    const { locked } = os.get();
    // The inner display: live DOM once flat; folding, the GPU's Lock Screen
    // while locked, else the live display's picture through the same
    // pipeline (the DOM halves stand in until a fresh one is ready). The
    // outer: live DOM while the phone is shut and still (its Liquid Glass is
    // real) and for StandBy; the GPU's as it opens, from the same picture.
    const leaving = !flat && last.current.flat;
    last.current.flat = flat;
    const ready = !flat && !locked && picture.current.ready(leaving);
    const innerMode = flat ? "hole" : locked ? "lock" : ready ? "content" : "hole";
    const outerMode = stage.get().outer === "standby" || p.fold >= 179.5 ? "hole" : "lock";
    const duo = g.duo;
    if (duo) {
      duo.setFold(p.fold);
      duo.setWake(p.wake);
      duo.setLevel(linearLevel());
      duo.setMode("inner", innerMode);
      duo.setMode("outer", outerMode);
      g.scene.updateMatrixWorld();
      duo.setViewpoint(g.model.worldToLocal(eye.copy(g.camera.position)));
      duo.render(g.renderer);
    }
    const was = last.current;
    if (outerMode !== was.outer) {
      was.outer = outerMode;
      els.outer.style.opacity = outerMode === "hole" ? "1" : "0";
    }

    sleep.current.forEach((el) => (el.style.opacity = (1 - p.wake).toFixed(3)));

    // The live display takes over from the two halves once flat. Opacity,
    // not visibility: both stay painted, so the swap costs one frame.
    const state = `${flat}-${innerMode}`;
    if (state !== was.inner) {
      was.inner = state;
      els.live.style.opacity = flat ? "1" : "0";
      els.live.style.pointerEvents = flat ? "auto" : "none";
      els.L.style.opacity = els.R.style.opacity = !flat && innerMode === "hole" ? "1" : "0";
    }

    g.renderer.render(g.scene, g.camera);
    g.css.render(g.scene, g.camera);
  }

  useImperativeHandle(ref, () => ({ apply }));

  // Development: a handle for headless inspection scripts.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __duoGL?: unknown }).__duoGL = { gl, apply, redraw, THREE, rasterize, os };
  });

  const u = (v: number) => v * k;
  // Each half: the whole display, slid so its own half shows, then the
  // sleeping display's black. They only stand in for the GPU's picture.
  const half = (side: "L" | "R") => (
    <>
      <div
        className="pointer-events-none absolute isolate"
        style={{ width: u(INNER.w), height: u(INNER.h), top: u(BLEED), left: side === "L" ? u(BLEED) : u(SEAM - INNER.w / 2) }}
      >
        <div style={{ width: INNER.w, height: INNER.h, zoom: k }}>
          <Upright portrait={portrait}>{inner(side)}</Upright>
        </div>
      </div>
      <div
        ref={(el) => {
          if (el) sleep.current[side === "L" ? 0 : 1] = el;
        }}
        className="pointer-events-none absolute inset-0 bg-black"
      />
    </>
  );

  return (
    <div ref={host} className="absolute inset-0">
      {els ? (
        <>
          {createPortal(half("L"), els.L)}
          {createPortal(half("R"), els.R)}
          {createPortal(
            // Inside a zoomed box, offsets are in points: zoom scales them.
            <div className="absolute" style={{ left: BLEED, top: BLEED, width: INNER.w, height: INNER.h, zoom: k }}>
              <Upright portrait={portrait}>{live}</Upright>
            </div>,
            els.live,
          )}
          {createPortal(
            <div className="absolute" style={{ left: BLEED, top: BLEED, width: OUTER.w, height: OUTER.h, zoom: k }}>
              {outer}
            </div>,
            els.outer,
          )}
        </>
      ) : null}
    </div>
  );
});

export default DeviceGL;

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

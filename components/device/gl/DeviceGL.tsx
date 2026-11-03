"use client";

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { HALF, INNER, OUTER } from "../geometry";
import type { Pose } from "../pose";
import type { DeviceHandle, Finish } from "../Device";
import { buildDevice, makeMaterials, SCREENS } from "./model";
import { studioEnvironment } from "./studio";

type Props = {
  k: number;
  inner: (half: "L" | "R") => React.ReactNode;
  live: React.ReactNode;
  outer: React.ReactNode;
  portrait?: boolean;
  finish?: Finish;
};

/** Camera distance, matching the CSS perspective the rest of the stage uses. */
const DISTANCE = 2800;
/** Display elements run this far under the bezel on every open side, so
 *  the hole's anti-aliased edge always has picture beneath it. */
const BLEED = 3;
/** The display hole's corner (pt); the DOM's matches it plus the bleed. */
const HOLE_R = 48;
const rad = (d: number) => (d * Math.PI) / 180;

type GL = {
  renderer: THREE.WebGLRenderer;
  css: CSS3DRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  L: THREE.Group;
  R: THREE.Group;
  meshes: THREE.Object3D[];
  cover: THREE.MeshPhysicalMaterial | null;
  objects: CSS3DObject[];
  tex: { inner: Record<Finish, THREE.Texture>; outer: Record<Finish, THREE.Texture> };
  env: Partial<Record<Finish, THREE.Texture>>;
  size: { w: number; h: number };
};

// The device in WebGL. The body is real geometry under a studio's
// reflections; the displays stay live DOM. They sit in a CSS 3D layer
// *under* the canvas, positioned by the same camera, and the model cuts
// transparent holes where they are, so a slab passing in front of a display
// hides it the way glass and titanium would.
//
// Both layers are sized from this component's own box (never the window,
// whose width includes the scrollbar), so they can't drift apart.
const DeviceGL = forwardRef<DeviceHandle, Props>(function DeviceGL({ k, inner, live, outer, portrait = false, finish = "star" }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const gl = useRef<GL | null>(null);
  const last = useRef<{ pose: Pose | null; live: boolean | null; pull: number }>({ pose: null, live: null, pull: -1 });
  const [els] = useState(() => {
    if (typeof document === "undefined") return null;
    const make = () => {
      const d = document.createElement("div");
      // Composited once and kept: the displays only ever move, they never
      // need repainting for it.
      Object.assign(d.style, { backfaceVisibility: "hidden", overflow: "hidden", background: "#000", willChange: "transform, opacity" });
      return d;
    };
    const live = make();
    // The live display waits, invisible, until the device first lies flat.
    live.style.opacity = "0";
    return { L: make(), R: make(), live, outer: make() };
  });
  const sleep = useRef<HTMLDivElement[]>([]);
  const mirrors = useRef<HTMLDivElement[]>([]);
  const crease = useRef<HTMLDivElement>(null);
  const m4 = useRef(new THREE.Matrix4()).current, t4 = useRef(new THREE.Matrix4()).current;

  // Scene, renderers, camera, lights. Once.
  useEffect(() => {
    const el = host.current;
    if (!el || !els) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const css = new CSS3DRenderer();
    Object.assign(css.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
    el.append(css.domElement, renderer.domElement);

    const scene = new THREE.Scene();
    // A tight depth range around the device, which never comes nearer than
    // ~1500 or goes further than ~4000: layers a fraction of a point apart
    // keep their order.
    const camera = new THREE.PerspectiveCamera(30, 1, 1200, 4600);
    camera.position.set(0, 0, DISTANCE);

    // A broad soft box up and to the left, for the satin back's falloff and
    // the long highlights down the band; the environment does the rest.
    RectAreaLightUniformsLib.init();
    const box = new THREE.RectAreaLight(0xfffaf2, 3.4, 2600, 1500);
    box.position.set(-1200, 1300, 1900);
    box.lookAt(0, 0, 0);
    const key = new THREE.DirectionalLight(0xffffff, 0.35);
    key.position.set(-0.6, 0.8, 1);
    scene.add(box, key);

    const root = new THREE.Group();
    root.matrixAutoUpdate = false;
    const L = new THREE.Group(), R = new THREE.Group();
    root.add(L, R);
    scene.add(root);

    const loader = new THREE.TextureLoader();
    const load = (url: string) => {
      const t = loader.load(url, () => redraw());
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const tex = {
      inner: { star: load("/device/inner-star.webp"), night: load("/device/inner-night.webp") },
      outer: { star: load("/device/outer-star.webp"), night: load("/device/outer-night.webp") },
    };

    // The displays, attached to the halves they belong to, each a touch
    // under its hole and centred on it, bleed included.
    const attach = (node: HTMLElement, parent: THREE.Object3D, at: { x: number; y: number; z: number }, back = false) => {
      const o = new CSS3DObject(node);
      o.position.set(at.x, at.y, at.z);
      if (back) o.rotation.y = Math.PI;
      parent.add(o);
      return o;
    };
    const objects = [
      attach(els.L, L, { ...SCREENS.innerL, x: SCREENS.innerL.x - BLEED / 2 }),
      attach(els.R, R, { ...SCREENS.innerR, x: SCREENS.innerR.x + BLEED / 2 }),
      attach(els.live, root, SCREENS.live),
      attach(els.outer, L, SCREENS.outer, true),
    ];

    gl.current = { renderer, css, scene, camera, root, L, R, meshes: [], cover: null, objects, tex, env: {}, size: { w: 1, h: 1 } };

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

    return () => {
      ro.disconnect();
      objects.forEach((o) => o.removeFromParent());
      disposeMeshes(gl.current);
      Object.values(gl.current?.env ?? {}).forEach((t) => t?.dispose());
      [...Object.values(tex.inner), ...Object.values(tex.outer)].forEach((t) => t.dispose());
      renderer.dispose();
      css.domElement.remove();
      renderer.domElement.remove();
      gl.current = null;
    };
    // Built once per mount; finish and zoom are applied by their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [els]);

  // The model, in the current finish.
  useEffect(() => {
    const g = gl.current;
    if (!g) return;
    disposeMeshes(g);
    g.env[finish] ??= studioEnvironment(g.renderer, finish === "night");
    const m = makeMaterials(finish, g.env[finish]!, g.tex.inner[finish], g.tex.outer[finish]);
    const { L, R } = buildDevice(m);
    g.L.add(L);
    g.R.add(R);
    g.meshes = [L, R];
    g.cover = m.cover;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

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
    const half = { width: px(INNER.w / 2 + BLEED), height: px(INNER.h + 2 * BLEED) };
    Object.assign(els.L.style, half, { borderRadius: `${r} 0 0 ${r}` });
    Object.assign(els.R.style, half, { borderRadius: `0 ${r} ${r} 0` });
    Object.assign(els.live.style, { width: px(INNER.w + 2 * BLEED), height: px(INNER.h + 2 * BLEED), borderRadius: r });
    Object.assign(els.outer.style, { width: px(OUTER.w + 2 * BLEED), height: px(OUTER.h + 2 * BLEED), borderRadius: `${px(6 + BLEED)} ${r} ${r} ${px(6 + BLEED)}` });
  }, [els, k]);

  function redraw() {
    const p = last.current.pose;
    if (p) apply(p);
  }

  function apply(p: Pose) {
    const g = gl.current;
    last.current.pose = { ...p };
    if (!g) return;
    const { w: vw, h: vh } = g.size;
    // Mirrors the CSS chain: translate, scale, view, yaw, pitch, roll, then
    // the closed device's mass shifted onto the pivot. CSS's y points down,
    // so its X and Z turns flip sign here.
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
    if (g.cover) g.cover.envMapIntensity = 0.03 + 0.45 * Math.min(1, p.fold / 30 + Math.abs(1 - p.s) * 1.5);

    sleep.current.forEach((el) => (el.style.opacity = (1 - p.wake).toFixed(3)));
    // Blur steps in half pixels: fewer distinct filters, fewer re-rasters.
    const pull = p.wake > 0.02 && p.wake < 0.985 ? Math.round((1 - p.wake) * 32) / 2 : 0;
    if (pull !== last.current.pull) {
      last.current.pull = pull;
      mirrors.current.forEach((el) => (el.style.filter = pull ? `blur(${pull}px)` : ""));
    }
    if (crease.current) crease.current.style.opacity = Math.min(1, p.fold / 25).toFixed(3);

    // The live display takes over from the two halves once flat. Opacity,
    // not visibility: both stay painted, so the swap costs one frame.
    const flat = p.fold < 0.4;
    if (flat !== last.current.live && els) {
      last.current.live = flat;
      els.live.style.opacity = flat ? "1" : "0";
      els.live.style.pointerEvents = flat ? "auto" : "none";
      els.L.style.opacity = els.R.style.opacity = flat ? "0" : "1";
    }

    g.renderer.render(g.scene, g.camera);
    g.css.render(g.scene, g.camera);
  }

  useImperativeHandle(ref, () => ({ apply }));

  const u = (v: number) => v * k;
  const half = (side: "L" | "R") => (
    <>
      <div
        ref={(el) => {
          if (el) mirrors.current[side === "L" ? 0 : 1] = el;
        }}
        className="pointer-events-none absolute"
        style={{ width: u(INNER.w), height: u(INNER.h), top: u(BLEED), left: side === "L" ? u(BLEED) : u(-INNER.w / 2) }}
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
      {side === "R" ? (
        <div
          ref={crease}
          className="pointer-events-none absolute inset-y-0 left-0 w-[18px] opacity-0"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.18), rgba(255,255,255,0.06) 40%, rgba(0,0,0,0))" }}
        />
      ) : null}
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

function disposeMeshes(g: GL | null) {
  if (!g) return;
  for (const o of g.meshes) {
    o.removeFromParent();
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        Object.values(x).forEach((v) => v instanceof THREE.CanvasTexture && v.dispose());
        x.dispose();
      });
    });
  }
  g.meshes = [];
}

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

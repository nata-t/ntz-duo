import * as THREE from "three";
import { HALF, INNER, OUTER, PLATEAU, R_HINGE, R_OUT, T, TEX } from "../geometry";
import type { Finish } from "../material";

// The iPhone Duo as real geometry, in display points, y up (three.js), the
// hinge on the y axis, fronts facing +z. Each half is a titanium band (an
// extruded ring with a rolled lip front and back) holding front glass, back
// glass and, on the right half, the camera plateau.
//
// Every layer that sits on another is lifted clear of it and given a
// polygon offset, and the band is hollow, so no two surfaces ever share a
// depth: that's what keeps the displays from shimmering as the device moves.

/** The band's rolled lip, front and back. */
const LIP = 5;
/** How far glass stands proud of the band, and screens above the glass. */
const GLASS = 0.35;
const SCREEN_Z = 0.5;
/** The display's corner, and the outer display's camera. */
const SCREEN_R = 40;
const OUTER_CAM = { x: 418.2, y: 46.3, r: 17.5 };
/** Raised plateau: height, the round of its top edge, the fillet at its foot. */
const PD = 7, P_ROUND = 4, P_FILLET = 3.5;
/** Lens rings stand this far proud of the plateau (≈1.5 mm). */
const LENS_H = 8.5, LENS_R = 55;

const hw = HALF.w, hh = HALF.h / 2;

/** A rounded rect as a path, y up, corners [top-left, top-right, bottom-right, bottom-left]. */
function rounded<P extends THREE.Path>(path: P, x0: number, y0: number, x1: number, y1: number, r: [number, number, number, number]): P {
  const [tl, tr, br, bl] = r;
  // Continuous corners: a cubic with handles at 0.62 of the radius lies
  // between a circle and a squircle, close to Apple's corner run.
  const k = 0.62;
  path.moveTo(x0 + bl, y0);
  path.lineTo(x1 - br, y0);
  path.bezierCurveTo(x1 - br * (1 - k), y0, x1, y0 + br * (1 - k), x1, y0 + br);
  path.lineTo(x1, y1 - tr);
  path.bezierCurveTo(x1, y1 - tr * (1 - k), x1 - tr * (1 - k), y1, x1 - tr, y1);
  path.lineTo(x0 + tl, y1);
  path.bezierCurveTo(x0 + tl * (1 - k), y1, x0, y1 - tl * (1 - k), x0, y1 - tl);
  path.lineTo(x0, y0 + bl);
  path.bezierCurveTo(x0, y0 + bl * (1 - k), x0 + bl * (1 - k), y0, x0 + bl, y0);
  return path;
}

const ROUT = R_OUT * 1.2;

function bodyRadii(side: "L" | "R", inset: number): [number, number, number, number] {
  const o = Math.max(1, ROUT - inset), g = Math.max(0.5, R_HINGE - inset * 0.5);
  return side === "R" ? [g, o, o, g] : [o, g, g, o];
}

function bodyPath<P extends THREE.Path>(path: P, side: "L" | "R", inset: number): P {
  const x0 = side === "R" ? 0 : -hw, x1 = side === "R" ? hw : 0;
  return rounded(path, x0 + inset, -hh + inset, x1 - inset, hh - inset, bodyRadii(side, inset));
}

/** The front glass: inside the band's lip, running to the hinge. */
function frontShape(side: "L" | "R") {
  const o = ROUT - LIP;
  return side === "R"
    ? rounded(new THREE.Shape(), 0, -hh + LIP, hw - LIP, hh - LIP, [0, o, o, 0])
    : rounded(new THREE.Shape(), -hw + LIP, -hh + LIP, 0, hh - LIP, [o, 0, 0, o]);
}

/** The inner display's half, open edge at the hinge. */
function screenPath<P extends THREE.Path>(side: "L" | "R", path: P): P {
  const w = INNER.w / 2, h = INNER.h / 2, r = SCREEN_R * 1.2;
  return side === "R" ? rounded(path, 0, -h, w, h, [0, r, r, 0]) : rounded(path, -w, -h, 0, h, [r, 0, 0, r]);
}

/** The outer display in the left slab's back coordinates (hinge at x 0). */
export function outerScreen() {
  const x0 = TEX.outerScreen.x, y1 = hh - TEX.outerScreen.y;
  return { x0, x1: x0 + OUTER.w, y0: y1 - OUTER.h, y1 };
}

/** UVs from a function mapping a vertex to texture points (y down). */
function mapUV(geo: THREE.BufferGeometry, tex: { w: number; h: number }, toTex: (x: number, y: number) => [number, number]) {
  const pos = geo.attributes.position!, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [px, py] = toTex(pos.getX(i), pos.getY(i));
    uv[i * 2] = px / tex.w;
    uv[i * 2 + 1] = 1 - py / tex.h;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Lift a material toward the camera in the depth test, for layers that
 *  lie on another surface. */
function lift<M extends THREE.Material>(m: M, units = -4): M {
  m.polygonOffset = true;
  m.polygonOffsetFactor = -1;
  m.polygonOffsetUnits = units;
  return m;
}

// ---- textures painted once on a canvas ------------------------------------

function canvas(n: number) {
  const c = document.createElement("canvas");
  c.width = c.height = n;
  return [c, c.getContext("2d")!] as const;
}

/** What you see through a camera lens: element rings stepping down into
 *  a dark aperture, tinted by the coating's wine and violet. */
function opticsTexture() {
  const n = 512, [c, x] = canvas(n), r = n / 2;
  const ring = (r1: number, stops: [number, string][]) => {
    const g = x.createRadialGradient(r, r, 0, r, r, r1 * r);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g;
    x.beginPath();
    x.arc(r, r, r1 * r, 0, Math.PI * 2);
    x.fill();
  };
  ring(1, [[0, "#140a12"], [0.8, "#0c070b"], [0.88, "#241823"], [0.93, "#0a0609"], [1, "#030203"]]);
  ring(0.72, [[0, "#050306"], [0.82, "#0d0810"], [0.9, "#2a1f2e"], [0.95, "#0b070c"], [1, "#060407"]]);
  ring(0.46, [[0, "#110a1c"], [0.5, "#06040a"], [0.82, "#1d1428"], [1, "#050307"]]);
  ring(0.2, [[0, "#02020a"], [0.7, "#0a0716"], [1, "#030208"]]);
  // A soft wine bloom and a cool arc, the coating catching the room.
  const bloom = x.createRadialGradient(r * 1.22, r * 1.28, 0, r * 1.22, r * 1.28, r * 0.55);
  bloom.addColorStop(0, "rgba(150,40,80,0.35)");
  bloom.addColorStop(1, "rgba(150,40,80,0)");
  x.fillStyle = bloom;
  x.fillRect(0, 0, n, n);
  x.strokeStyle = "rgba(120,90,200,0.22)";
  x.lineWidth = n * 0.01;
  x.beginPath();
  x.arc(r, r, r * 0.6, Math.PI * 1.05, Math.PI * 1.42);
  x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The flash: a frosted Fresnel lens, fine rings around a warm centre. */
function flashTexture() {
  const n = 256, [c, x] = canvas(n), r = n / 2;
  const g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "#fbf3dc");
  g.addColorStop(0.55, "#efe4c6");
  g.addColorStop(1, "#d9cfba");
  x.fillStyle = g;
  x.fillRect(0, 0, n, n);
  x.strokeStyle = "rgba(120,100,70,0.28)";
  x.lineWidth = 1.2;
  for (let k = 0.14; k < 1; k += 0.075) {
    x.beginPath();
    x.arc(r, r, k * r, 0, Math.PI * 2);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Frosted glass: a fine, soft variation in roughness. Mipmapped, so at a
 *  distance it averages to satin instead of sparkling. */
function frostTexture() {
  const n = 256, [c, x] = canvas(n);
  const img = x.createImageData(n, n);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * n; i++) {
    const v = 214 + rnd() * 41;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // Shape UVs are in points: one tile every 40 pt.
  t.repeat.set(1 / 40, 1 / 40);
  return t;
}

/** Soft contact shadow around the plateau: the occlusion that makes a
 *  raised object read as sitting on the glass. Drawn with a canvas shadow
 *  (works everywhere, unlike canvas filters). */
function occlusionTexture(w: number, h: number, margin: number) {
  const scale = 2, W = Math.round((w + 2 * margin) * scale), H = Math.round((h + 2 * margin) * scale);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  // The shape itself sits off-canvas; only its blurred shadow lands here.
  x.shadowColor = "#fff";
  x.shadowBlur = margin * scale * 0.55;
  x.shadowOffsetX = W * 2;
  x.fillStyle = "#fff";
  x.beginPath();
  x.roundRect(margin * scale - W * 2, margin * scale, w * scale, h * scale, (h / 2) * scale);
  x.fill();
  return new THREE.CanvasTexture(c);
}

export type Materials = ReturnType<typeof makeMaterials>;

export function makeMaterials(finish: Finish, env: THREE.Texture, inner: THREE.Texture, outer: THREE.Texture) {
  const night = finish === "night";
  // Polished grade 5 titanium. Star White is a pale champagne silver.
  const metal = new THREE.MeshPhysicalMaterial({
    color: night ? "#46516e" : "#d9d5cc",
    metalness: 1,
    roughness: night ? 0.2 : 0.17,
    envMap: env,
    envMapIntensity: 1,
  });
  // Front cover glass over the kit's bezel render: the black stays black;
  // only a faint sheen of the studio sits on it.
  const glass = (map: THREE.Texture) =>
    lift(new THREE.MeshPhysicalMaterial({ map, roughness: 0.32, metalness: 0, specularIntensity: 0.35, envMap: env, envMapIntensity: 0.22 }));
  // The back: white glass with a frosted, satin face. Its clear coat keeps
  // soft reflections of the studio; the frost breaks them up.
  const frost = frostTexture();
  const satin = lift(
    new THREE.MeshPhysicalMaterial({
      color: night ? "#222a40" : "#d9d8d4",
      roughness: 0.3,
      roughnessMap: frost,
      metalness: 0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      clearcoatRoughnessMap: frost,
      envMap: env,
      envMapIntensity: night ? 1.15 : 0.95,
    }),
  );
  // The plateau is the same glass, a little glossier.
  const plateau = satin.clone();
  plateau.polygonOffset = false;
  plateau.roughness = 0.3;
  plateau.clearcoatRoughness = 0.12;
  // Lens cover glass: near black, its reflections tinted wine by the
  // anti-reflective coating. Transparent, so the optics read beneath.
  const lensGlass = new THREE.MeshPhysicalMaterial({
    color: "#000000",
    roughness: 0.02,
    metalness: 0,
    specularIntensity: 1,
    specularColor: new THREE.Color("#d0436b"),
    iridescence: 0.25,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [400, 520],
    envMap: env,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const optics = new THREE.MeshBasicMaterial({ map: opticsTexture() });
  // The lens rings: mirror-polished, brighter than the band.
  const lensRing = new THREE.MeshPhysicalMaterial({
    color: night ? "#7d88a6" : "#eeece8",
    metalness: 1,
    roughness: 0.06,
    envMap: env,
    envMapIntensity: 1.15,
  });
  const barrel = new THREE.MeshPhysicalMaterial({ color: "#0b0a0d", roughness: 0.45, metalness: 0.3, envMap: env, envMapIntensity: 0.4 });
  const flash = new THREE.MeshPhysicalMaterial({ map: flashTexture(), roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.08, envMap: env, envMapIntensity: 0.9 });
  const black = new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.1, clearcoat: 1, envMap: env });
  // The outer camera sits over the display's hole: lifted hard, so the
  // hole never wins the depth test at a steep angle.
  const camera = lift(black.clone(), -24);
  const camEye = lift(optics.clone(), -28);
  // Contact shadows: drawn just above what they darken, never pulled
  // forward in depth, so whatever stands on them still covers them.
  const shadow = (map: THREE.Texture, opacity: number) =>
    new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: map, transparent: true, opacity, depthWrite: false });
  // Where a screen shows through: transparent black that still writes depth,
  // so the slabs hide whatever screen they pass in front of.
  const hole = lift(new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending }), -6);
  // Cover glass over the screens: reflections of the room only (an unlit
  // material, so the studio's lights never wash across a live display),
  // added onto the display underneath without touching its alpha.
  const cover = new THREE.MeshBasicMaterial({
    color: 0x000000,
    envMap: env,
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
  return { metal, innerGlass: glass(inner), outerGlass: glass(outer), satin, plateau, lensGlass, optics, lensRing, barrel, flash, black, camera, camEye, shadow, hole, cover };
}

/** One slab: hollow band, front glass with its screen hole, back. */
function slab(side: "L" | "R", m: Materials) {
  const g = new THREE.Group();

  // The band: a ring, so nothing solid lies under the glass to fight it.
  const ring = bodyPath(new THREE.Shape(), side, LIP);
  ring.holes.push(bodyPath(new THREE.Path(), side, LIP + 4));
  const band = new THREE.ExtrudeGeometry(ring, {
    depth: T - 2 * LIP,
    bevelEnabled: true,
    bevelThickness: LIP,
    bevelSize: LIP,
    bevelSegments: 24,
    curveSegments: 64,
  });
  band.translate(0, 0, -T + LIP);
  g.add(new THREE.Mesh(band, m.metal));

  // Front: the kit's bezel render on glass, the display cut out of it.
  const front = frontShape(side);
  front.holes.push(screenPath(side, new THREE.Path()));
  const fg = mapUV(new THREE.ShapeGeometry(front, 48), TEX.inner, (x, y) => [TEX.inner.x + (side === "L" ? x + hw : hw + x), TEX.inner.y + (hh - y)]);
  const fm = new THREE.Mesh(fg, m.innerGlass);
  fm.position.z = GLASS;
  g.add(fm);
  const sg = new THREE.ShapeGeometry(screenPath(side, new THREE.Shape()), 48);
  const hole = new THREE.Mesh(sg, m.hole);
  hole.position.z = SCREEN_Z;
  g.add(hole);
  const cover = new THREE.Mesh(sg, m.cover);
  cover.position.z = SCREEN_Z + 0.3;
  cover.renderOrder = 3;
  g.add(cover);

  // Back, turned to face -z: satin glass on the right slab, the outer
  // display on the left. Turned around, the right slab's outline is the
  // left one's and vice versa.
  const back = new THREE.Group();
  back.rotation.y = Math.PI;
  back.position.z = -T - GLASS;
  if (side === "R") {
    back.add(new THREE.Mesh(new THREE.ShapeGeometry(bodyPath(new THREE.Shape(), "L", LIP), 48), m.satin));
  } else {
    const shape = bodyPath(new THREE.Shape(), "R", LIP);
    const s = outerScreen();
    const r = SCREEN_R * 1.2;
    shape.holes.push(rounded(new THREE.Path(), s.x0, s.y0, s.x1, s.y1, [6, r, r, 6]));
    const og = mapUV(new THREE.ShapeGeometry(shape, 48), TEX.outer, (x, y) => [TEX.outer.x + x, TEX.outer.y + (hh - y)]);
    back.add(new THREE.Mesh(og, m.outerGlass));
    const screen = new THREE.ShapeGeometry(rounded(new THREE.Shape(), s.x0, s.y0, s.x1, s.y1, [6, r, r, 6]), 48);
    const h = new THREE.Mesh(screen, m.hole);
    h.position.z = SCREEN_Z - GLASS;
    back.add(h);
    const c = new THREE.Mesh(screen, m.cover);
    c.position.z = SCREEN_Z - GLASS + 0.3;
    c.renderOrder = 3;
    back.add(c);
    // The outer camera, over the display.
    const cam = new THREE.Mesh(new THREE.CircleGeometry(OUTER_CAM.r, 64), m.camera);
    cam.position.set(s.x0 + OUTER_CAM.x, s.y1 - OUTER_CAM.y, SCREEN_Z + 0.4);
    cam.renderOrder = 4;
    back.add(cam);
    const eye = new THREE.Mesh(new THREE.CircleGeometry(OUTER_CAM.r * 0.42, 48), m.camEye);
    eye.position.set(cam.position.x, cam.position.y, SCREEN_Z + 0.5);
    eye.renderOrder = 5;
    back.add(eye);
  }
  g.add(back);
  return g;
}

/** Points and outward normals around a stadium, evenly spaced. */
function stadium(cx: number, cy: number, w: number, h: number, n: number) {
  const r = h / 2, straight = w - h, per = 2 * straight + 2 * Math.PI * r;
  const out: { p: THREE.Vector2; n: THREE.Vector2 }[] = [];
  for (let i = 0; i < n; i++) {
    let s = (i / n) * per;
    let p: THREE.Vector2, nn: THREE.Vector2;
    if (s < straight) {
      p = new THREE.Vector2(cx - straight / 2 + s, cy - r);
      nn = new THREE.Vector2(0, -1);
    } else if ((s -= straight) < Math.PI * r) {
      const a = -Math.PI / 2 + s / r;
      nn = new THREE.Vector2(Math.cos(a), Math.sin(a));
      p = new THREE.Vector2(cx + straight / 2 + nn.x * r, cy + nn.y * r);
    } else if ((s -= Math.PI * r) < straight) {
      p = new THREE.Vector2(cx + straight / 2 - s, cy + r);
      nn = new THREE.Vector2(0, 1);
    } else {
      s -= straight;
      const a = Math.PI / 2 + s / r;
      nn = new THREE.Vector2(Math.cos(a), Math.sin(a));
      p = new THREE.Vector2(cx - straight / 2 + nn.x * r, cy + nn.y * r);
    }
    out.push({ p, n: nn });
  }
  return out;
}

/** The concave fillet where the plateau rises out of the back glass: a
 *  quarter round swept around its foot. */
function filletGeometry(cx: number, cy: number, w: number, h: number, r: number) {
  const ring = stadium(cx, cy, w, h, 220), segs = 8;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  ring.forEach(({ p, n }) => {
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * (Math.PI / 2);
      // From flat on the glass (a = 0) up to vertical against the wall.
      pos.push(p.x + n.x * (r - r * Math.sin(a)), p.y + n.y * (r - r * Math.sin(a)), r - r * Math.cos(a));
      nor.push(n.x * Math.sin(a), n.y * Math.sin(a), Math.cos(a));
    }
  });
  const cols = segs + 1;
  for (let i = 0; i < ring.length; i++) {
    const a = i * cols, b = ((i + 1) % ring.length) * cols;
    for (let j = 0; j < segs; j++) idx.push(a + j, b + j, a + j + 1, b + j, b + j + 1, a + j + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}

/** The camera plateau, lenses, flash and mic, on the right slab's back. */
function cameras(m: Materials) {
  const g = new THREE.Group();
  g.rotation.y = Math.PI;
  g.position.z = -T - GLASS;
  // Seen from behind, the plateau sits top-left, away from the hinge.
  const pw = PLATEAU.w, ph = PLATEAU.h;
  const x0 = -hw + PLATEAU.inset, y1 = hh - PLATEAU.inset;
  const cx = x0 + pw / 2, cy = y1 - ph / 2;

  // Its shadow on the glass, so it sits rather than floats.
  const margin = 26;
  // Lit from above, so the shadow sits a little low.
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(pw + 2 * margin, ph + 2 * margin), m.shadow(occlusionTexture(pw, ph, margin), 0.28));
  ao.position.set(cx, cy - 4.5, 0.12);
  g.add(ao);

  // The plateau: rounded over at the top; its lower round is sunk into the
  // body so its wall meets the glass straight, where the fillet takes over.
  const bs = P_ROUND;
  const shape = rounded(new THREE.Shape(), x0 + bs, y1 - ph + bs, x0 + pw - bs, y1 - bs, [ph / 2 - bs, ph / 2 - bs, ph / 2 - bs, ph / 2 - bs]);
  const pg = new THREE.ExtrudeGeometry(shape, { depth: PD - bs, bevelEnabled: true, bevelThickness: bs, bevelSize: bs, bevelSegments: 24, curveSegments: 96 });
  g.add(new THREE.Mesh(pg, m.plateau));
  g.add(new THREE.Mesh(filletGeometry(cx, cy, pw, ph, P_FILLET), m.plateau));
  const top = PD;

  // Each lens: a polished ring standing well proud of the plateau, its
  // top rolled over into a short inner wall that drops to the cover glass,
  // with the optics beneath.
  const R = LENS_R, H = LENS_H;
  const prof = [
    [R + 0.4, -0.6],
    [R + 0.2, 0.3],
    [R, 0.9],
    [R, H - 2.2],
    [R - 0.4, H - 1],
    [R - 1.3, H - 0.25],
    [R - 2.4, H],
    [R - 6.6, H],
    [R - 7.6, H - 0.4],
    [R - 8.2, H - 1.3],
    [R - 8.4, H - 2.6],
  ].map(([r, z]) => new THREE.Vector2(r!, z!));
  const lathe = new THREE.LatheGeometry(prof, 160);
  lathe.rotateX(Math.PI / 2);
  const rg = R - 8.3, RS = 520;
  const dome = new THREE.SphereGeometry(RS, 128, 6, 0, Math.PI * 2, 0, Math.asin(rg / RS));
  dome.rotateX(Math.PI / 2);
  const sag = RS - Math.sqrt(RS * RS - rg * rg);
  const lens = (lx: number) => {
    const ly = cy;
    const rm = new THREE.Mesh(lathe, m.lensRing);
    rm.position.set(lx, ly, top);
    g.add(rm);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(rg + 0.2, 128), m.optics);
    floor.position.set(lx, ly, top + H - 3.4);
    g.add(floor);
    const gm = new THREE.Mesh(dome, m.lensGlass);
    gm.renderOrder = 2;
    // The glass crowns just under the ring's lip.
    gm.position.set(lx, ly, top + H - 2.7 + sag - RS);
    g.add(gm);
  };
  const lx0 = x0 + 15 + R;
  lens(lx0);
  lens(lx0 + 2 * R + 10);

  // To the right of the lenses, one above the other: the mic, then the flash.
  const col = x0 + 15 + 4 * R + 10 + (pw - (15 + 4 * R + 10)) / 2 - 2;
  const mic = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), m.black);
  mic.position.set(col, y1 - ph * 0.3, top + 0.2);
  g.add(mic);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(12.5, 64), m.flash);
  flash.position.set(col, y1 - ph * 0.66, top + 0.2);
  g.add(flash);
  const rim = new THREE.Mesh(new THREE.RingGeometry(12.5, 13.8, 64), m.lensRing);
  rim.position.set(col, y1 - ph * 0.66, top + 0.22);
  g.add(rim);
  return g;
}

/** Volume buttons on the top edge and the side button: pills standing
 *  just proud of the band. */
function buttons(m: Materials) {
  const g = new THREE.Group();
  const pill = (len: number) => new THREE.CapsuleGeometry(6, len - 12, 10, 32);
  for (const [at, len] of [
    [261, 62],
    [347, 66],
  ] as const) {
    const b = new THREE.Mesh(pill(len), m.metal);
    b.rotation.z = Math.PI / 2;
    b.scale.set(0.42, 1, 1);
    b.position.set(at, hh, -T / 2);
    g.add(b);
  }
  const s = new THREE.Mesh(pill(116), m.metal);
  s.scale.set(0.42, 1, 1);
  s.position.set(hw, hh - 248, -T / 2);
  g.add(s);
  return g;
}

export function buildDevice(m: Materials) {
  const L = new THREE.Group();
  const R = new THREE.Group();
  L.add(slab("L", m));
  R.add(slab("R", m), cameras(m), buttons(m));
  return { L, R };
}

/** Where the DOM displays attach, in each half's coordinates, just under
 *  their holes. */
export const SCREENS = {
  innerL: { x: -INNER.w / 4, y: 0, z: SCREEN_Z - 0.2 },
  innerR: { x: INNER.w / 4, y: 0, z: SCREEN_Z - 0.2 },
  live: { x: 0, y: 0, z: SCREEN_Z - 0.1 },
  /** The outer display, centre, on the left slab's back (front view coords). */
  outer: (() => {
    const s = outerScreen();
    return { x: -(s.x0 + s.x1) / 2, y: (s.y0 + s.y1) / 2, z: -T - SCREEN_Z + 0.2 };
  })(),
};

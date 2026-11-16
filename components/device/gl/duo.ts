import * as THREE from "three";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";
import { BODY, TEX } from "../geometry";
import type { Finish } from "../material";
import { canvas, loadFonts, loadSheets, paintChrome, paintTime, type Panel, type Sheets, type Theme } from "../lockart";
import { ScreenWipe } from "./wipe";

// The iPhone Duo as a measured model: the render file, materials and fold
// of iphone-duo-animation (MIT), driven by this site's story.
//
// One value, the fold angle, drives everything that moves. The cover half
// (the left one, with the outer display on its back) turns about the
// hinge in the vertex shader; the flexible display and the hinge liner
// bend through a short Hermite strip, their shading normals turning across
// a wider band so the crease reads as a curve. The displays have two
// modes: "lock", where they show the Lock Screen composed on the GPU (the
// wallpaper's sheets pushed in by their own depths as the phone shuts, the
// half that wakes last blurred and dark), and "hole", where they turn
// transparent over the live DOM display lying beneath the canvas.
//
// Model units: the inner display is 15.7987 wide; UNIT converts to points.
// The model is the UI kit's phone to the tenth of a point (body 992 × 710,
// inner 951 × 669, outer 466 × 678), so it sits exactly where the CSS
// device and the DOM displays expect it.

const MODEL_URL = "/device/duo/model.usdc";
/** Fallback for progress when the server compresses the response and omits its length. */
const MODEL_BYTES = 3_638_212;
const MODEL_SCALE = 100;
const MODEL_DROP = 5.8974;
export const UNIT = 951 / 15.7987;
/** The hinge axis's depth, in model units. */
export const HINGE = 0.275454;
/** The inner and outer display planes. */
export const INNER_Z = 0.24948;
export const OUTER_Z = -0.275;
/** The outer display's centre (model units). */
export const OUTER_X = -(0.23396 + 7.73936 / 2);

const COVER_HALF = "upTUAKvMVkPOMKq";
const CAMERA_HALF = "SiftyleUEEZwLhF";
const INNER_SCREEN = "UXtsBZYlaUvHoEh";
const OUTER_SCREEN = "hhgAIoCGsHXeDPY";
const FLEXIBLE_MESHES = new Set(["JnJdTkxbQgUtLwU", "xdyyaajWsatVNxN", INNER_SCREEN, "MvKPXGSdYDVvSpk"]);
/** The inner bezel glass, left and right: this site's own bezel is laid
 *  on them (the kit's render, rim line and hinge block included). */
const BEZELS = new Set(["svvOILdVxasRAOk", "gjdjMOcCfrwBMYH"]);
/** The outer camera and its ring sit in the outer display's plane. */
const OUTER_CAMERA = new Set(["aPxlVqZVqWStoGD", "vTcSkzvfyxWyWLx", "ZcRVEBTagyUDrqj", "RsMYVEApMypWrpd", "eTOVbDQVsswgAUz", "rqynQLtWLECDNtb"]);
/** The body's black insides. Between the halves on the hinge side they
 *  read as a gap: dressed as the hinge's darker metal instead. */
const INSIDES = new Set(["RwQzmCvUWHGlFfV", "PXwNjghIIgDPXsa", "iKZSoAlRlDlkSEw", "SCDZMtVjLrcxENj", "mjecbCFnfurWWJV", "uWPCbpPKzwJOmUY"]);
// The frame's own metal, satin: polished, from below it mirrors the room's
// light box as a white flare between the halves; dark, it reads as holes
// beside the spine's ends.
const INSIDE_STAR: Look = { color: "#b8afa1", roughness: 0.48, metalness: 1, env: 0.7 };
const INSIDE_NIGHT: Look = { color: "#3a465e", roughness: 0.48, metalness: 1, env: 0.7 };
/** The titanium frame, one per half. */
const FRAMES = new Set(["qyiwePzfWzVHIDO", "jJermpgmctotTSe"]);
/** The hinge cover and spine ship dark; they take the frame's finish. */
const HINGE_MESHES = new Set(["MvKPXGSdYDVvSpk", "pmvwSuCeZpxeLmT", "bsNHOLGaZbhIluH"]);
/** The flexible display's liner: it runs up between the bezel halves at
 *  the hinge, under the bezel plate, whose own render draws the hinge
 *  block there. */
const LINER = "xdyyaajWsatVNxN";

/** The physical buttons, on the right half: volume on the top edge (up
 *  further from the hinge), the side button with Touch ID and, below it,
 *  Camera Control on the far edge. Each presses in along its edge. */
export type ButtonName = "volumeUp" | "volumeDown" | "side" | "camera";
const BUTTONS: Record<ButtonName, { meshes: string[]; dir: THREE.Vector3 }> = {
  volumeUp: { meshes: ["YhaSRqOjDUQrQTc"], dir: new THREE.Vector3(0, 1, 0) },
  volumeDown: { meshes: ["FcJBPLgEScWGyXd"], dir: new THREE.Vector3(0, 1, 0) },
  side: { meshes: ["UXtkILReLwCJaov", "fbvEqfwjsAMSDkr", "tkSBzAjLTdhANqx"], dir: new THREE.Vector3(1, 0, 0) },
  camera: { meshes: ["AjfIgUpXxKaENDl", "VNIQJMrwFmXgrBf", "ejUvJHtjfcqjSvM"], dir: new THREE.Vector3(1, 0, 0) },
};
/** The spine, measured off a film of the real phone (model units; 1 pt ≈
 *  0.0166). Shut and seen edge on it's a rounded bar about 70% of the
 *  body's thickness, the halves' rounded hinge edges showing as thin rims
 *  either side; it stands ~14 pt proud of them and stops ~10 pt short of the
 *  top and bottom, its ends rounded. CORNER: the halves' back corners'
 *  distance from the hinge axis. */
const CORNER = 0.5495;
const BODY_TOP = 5.897;
/** How near the hinge axis (the open display's plane) the spine may come. */
const CLEAR = 0.2;
const SPINE = {
  /** Across the hinge (the body's thickness, shut, is 2 × CORNER). */
  width: 0.78,
  /** Proud of the halves' hinge edges, shut. */
  proud: 0.195,
  /** Sunk between the halves, behind their rounded edges. */
  sunk: 0.3,
  /** Short of the top and bottom: barely, so its ends tuck in under the
   *  halves' rounded ends. */
  inset: 0.1,
  /** Corner of its face, seen edge on (no rounder than its edges, so it
   *  fills the halves' ends); round of its long edges. */
  corner: 0.235,
  edge: 0.22,
  /** Its face is a shallow arc across: this far proud at the middle. */
  crown: 0.045,
  roughness: 0.36,
};

/** How far a button travels when pressed, in model units: about 60% of
 *  how far it stands out of the frame (≈ 3.8 pt), enough to read on screen. */
const TRAVEL = 0.063;
/** Hit zones reach this far around a button: they're thin on screen. */
const REACH = 0.14;

const UI_REFERENCE_EYE = new THREE.Vector3(0, 0, 40);
const INNER_UI_FRAME = new THREE.Vector4(-7.89935, 0.34562 - MODEL_DROP, 15.7987, 11.1035);
const OUTER_UI_FRAME = new THREE.Vector4(0.23396, 0.27173 - MODEL_DROP, 7.73936, 11.2513).multiplyScalar(
  (UI_REFERENCE_EYE.z - 0.24948) / (UI_REFERENCE_EYE.z - 0.825538),
);
const SIZES = { inner: new THREE.Vector2(1600, 1125), outer: new THREE.Vector2(774, 1125) };
const CLOSED_ZOOM = 1.47;
type LayerName = "sky" | "ridge" | "dune";
const LAYERS: readonly LayerName[] = ["sky", "ridge", "dune"];
const LAYER_DEPTH: Record<LayerName, number> = { sky: 0.47, ridge: 1, dune: 0.7 };

// Finishes. Star White is the model's own; Night Sky turns every pale
// surface to a deep blue titanium and glass, keeping each one's shade.
/** The scene's reflection strength (DeviceGL's environmentIntensity). */
const ENVIRONMENT = 0.85;
const SHELL_COLOR = 0xf5f1ea;
const FRAME_COLOR = 0xe3d9c8;
const FRAME_ROUGHNESS = 0.16;
// Night Sky, part by part, measured off Apple's photographs: dark navy
// titanium that throws cool, bright highlights; slate back glass, frosted;
// the camera island in that same navy, a shade darker and smoother; lens
// rings and antenna bands in navy-tinted metal.
type Look = { color: string; roughness?: number; metalness?: number; clearcoat?: number; clearcoatRoughness?: number; /** Share of the room's reflection. */ env?: number; hidden?: boolean; noMap?: boolean };
const TITANIUM: Look = { color: "#56647f", roughness: 0.2, metalness: 1 };
/** The lens rings' outer walls: navy-tinted metal. */
const LENS_RING: Look = { color: "#2c3850", roughness: 0.32, metalness: 1, env: 0.6 };
const NIGHT_PARTS: Record<string, Look> = {
  // Frame halves, buttons, lens rings, port and grilles, hinge.
  qyiwePzfWzVHIDO: TITANIUM, jJermpgmctotTSe: TITANIUM,
  YhaSRqOjDUQrQTc: TITANIUM, FcJBPLgEScWGyXd: TITANIUM, UXtkILReLwCJaov: TITANIUM, AjfIgUpXxKaENDl: TITANIUM,
  tkSBzAjLTdhANqx: { ...TITANIUM, roughness: 0.05 }, VNIQJMrwFmXgrBf: { ...TITANIUM, roughness: 0.05 },
  fbvEqfwjsAMSDkr: { color: "#3e4a62", roughness: 0.6, metalness: 0.8 }, ejUvJHtjfcqjSvM: { color: "#3e4a62", roughness: 0.6, metalness: 0.8 },
  TjnQASEQBIHreGe: LENS_RING, zKTkIrxcXzWwBYK: LENS_RING,
  SxeyDDoPvaCZQxB: { ...LENS_RING, color: "#34405a", roughness: 0.42 }, gCGRiYiWIxXRhXE: { ...LENS_RING, color: "#34405a", roughness: 0.42 },
  // The lenses' inner bezels: the same navy metal, deeper, not black.
  iUykZAiNlEUXJDD: { ...LENS_RING, color: "#1d2638", roughness: 0.26 }, PkkUoNvpaBExwuc: { ...LENS_RING, color: "#1d2638", roughness: 0.26 },
  WzRveeKjvQZVqRA: TITANIUM, cIpbiCGlEcdljuC: TITANIUM, EdsRvWYVMNVqBab: { ...TITANIUM, color: "#3a465e" },
  MvKPXGSdYDVvSpk: TITANIUM, pmvwSuCeZpxeLmT: TITANIUM, bsNHOLGaZbhIluH: TITANIUM, xdyyaajWsatVNxN: TITANIUM,
  // Antenna bands: the colour of the lens rings' outer walls.
  jnMRBCmgCrfRBeG: { ...LENS_RING, clearcoat: 0 }, fdaipPEGAeomuPG: { ...LENS_RING, clearcoat: 0 },
  // Back glass: frosted slate.
  fapSTOypmavuPic: { color: "#232c38" }, UPeNpLgJbcWzHun: { color: "#232c38" }, tLtsGCMtMAZfCYN: { color: "#232c38" },
  // The island: the back's navy, a shade darker and smoother.
  MnPSgwdtGmrkVcg: { color: "#202935", roughness: 0.66, env: 0.85 },
  // The gloss coats over the plateau and the logo. Head on, the plateau's
  // mirrors the room's light box as a silver slab: barely there in Night Sky.
  XziVXUmXQoAudpp: { color: "#0e141e", env: 0.12 },
  // No logo on Night Sky's back: the glass runs plain.
  tnxsltexVWtEjsz: { color: "#232c38", hidden: true }, tYVfzVmYBKhfUhm: { color: "#232c38", hidden: true },
  // The flash: a brushed silver disc in a dark ring, its LED unseen.
  zdStWfgHXiitQgl: { color: "#bdb9b2", roughness: 0.38, metalness: 0.9, noMap: true }, msUTSJTbdlDoNLs: { color: "#b3afa8", roughness: 0.34, metalness: 0.92 },
  ONfbMSsVikXcwwp: { color: "#2b3242", roughness: 0.5 },
  // The microphone: a dark grille in the glass.
  FafuGBBSaHXLqhj: { color: "#3a4252", roughness: 0.7 }, hMQYrwNoNcNjoRj: { color: "#141a24", roughness: 0.6 }, itODWJLNRbBbHzD: { color: "#141a24", roughness: 0.6 },
};

const screenShader = /* glsl */ `
uniform float foldAngle;
uniform vec4 screenFrame;
uniform vec3 uiReferenceEye;
uniform float uiParallax;
uniform vec2 uiShade;
uniform float uiWipePosition;
varying vec3 vUIPosition;
vec3 screenColor() {
  float depth = (0.24948 - uiReferenceEye.z) / (vUIPosition.z - uiReferenceEye.z);
  vec2 plane = uiReferenceEye.xy + (vUIPosition.xy - uiReferenceEye.xy) * depth;
  #ifndef INNER_UI
    float c = cos(foldAngle), s = sin(foldAngle);
    vec2 hingeEdge = vec2(-0.23396, -0.27463 - 0.275454);
    vec2 foldedEdge = vec2(c * hingeEdge.x + s * hingeEdge.y, -s * hingeEdge.x + c * hingeEdge.y + 0.275454);
    float edgeDepth = (0.24948 - uiReferenceEye.z) / (foldedEdge.y - uiReferenceEye.z);
    plane.x += screenFrame.x - (uiReferenceEye.x + (foldedEdge.x - uiReferenceEye.x) * edgeDepth);
  #endif
  float progress = clamp(foldAngle / 3.141592654, 0.0, 1.0);
  #ifdef INNER_UI
    float wipeAmount = progress;
  #else
    float wipeAmount = clamp(1.0 - 2.0 * abs(progress - 0.5), 0.0, 1.0) * 0.5;
  #endif
  plane = mix(screenFrame.xy + vEmissiveMapUv * screenFrame.zw, plane, uiParallax);
  vec2 uv = ((plane - screenFrame.xy) / screenFrame.zw - 0.5) / 1.12 + 0.5;
  float distanceToWipe = distance(vEmissiveMapUv.x, uiWipePosition);
  float wipe = 1.0 - clamp(smoothstep(uiShade.x, uiShade.y, distanceToWipe) * wipeAmount * 1.5, 0.0, 1.0);
  float edges = smoothstep(1.1, 1.0, uv.x) * smoothstep(-0.1, 0.0, uv.x) * smoothstep(1.1, 1.0, uv.y) * smoothstep(-0.1, 0.0, uv.y);
  #ifdef INNER_UI
    edges = mix(edges, edges * smoothstep(0.05, 0.5, uv.x), smoothstep(0.0, 0.55, wipeAmount));
  #endif
  return texture2D(emissiveMap, uv).rgb * wipe * edges;
}
`;

const foldShader = /* glsl */ `
uniform float foldAngle;
vec2 rotateHinge(vec2 p) {
  float c = cos(foldAngle), s = sin(foldAngle);
  p.y -= 0.275454;
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y + 0.275454);
}
#ifdef FLEXIBLE_SCREEN
vec2 bendStrip(vec3 p) {
  float halfWidth = 0.35;
  if (p.x >= halfWidth) return vec2(p.x, p.z);
  if (p.x <= -halfWidth) return rotateHinge(p.xz);
  float t = (p.x + halfWidth) / (2.0 * halfWidth);
  float t2 = t * t, t3 = t2 * t;
  vec2 a = rotateHinge(vec2(-halfWidth, p.z));
  vec2 b = vec2(halfWidth, p.z);
  vec2 ta = 2.0 * halfWidth * vec2(cos(foldAngle), -sin(foldAngle));
  vec2 tb = vec2(2.0 * halfWidth, 0.0);
  return (2.0*t3-3.0*t2+1.0)*a + (t3-2.0*t2+t)*ta + (-2.0*t3+3.0*t2)*b + (t3-t2)*tb;
}
#endif
`;

/** The render file names eight textures that were never shipped. A 1 px
 *  blank stands at each path (no failed requests); it's dropped here. */
const isBlank = (t: THREE.Texture) => !t.image || (t.image as { width?: number }).width! <= 1;

const TEXTURE_SLOTS = [
  "map", "roughnessMap", "metalnessMap", "normalMap", "aoMap", "alphaMap", "clearcoatMap", "clearcoatNormalMap",
  "clearcoatRoughnessMap", "specularColorMap", "specularIntensityMap", "sheenColorMap", "transmissionMap",
] as const;

/** An absent map samples black, so drop it (an absent base map gets the
 *  shell's colour). */
function dropMissingTextures(material: THREE.Material) {
  const slots = material as unknown as Record<string, unknown> & { color?: THREE.Color };
  for (const slot of TEXTURE_SLOTS) {
    const texture = slots[slot];
    if (!(texture instanceof THREE.Texture) || !isBlank(texture)) continue;
    slots[slot] = null;
    if (slot === "map") slots.color?.set(SHELL_COLOR);
    material.needsUpdate = true;
  }
}

function matchFrame(material: THREE.MeshStandardMaterial) {
  material.color.set(FRAME_COLOR);
  material.metalness = 1;
  material.roughness = FRAME_ROUGHNESS;
  material.map = material.aoMap = material.roughnessMap = material.metalnessMap = null;
  material.needsUpdate = true;
}

function belongsToCoverHalf(object: THREE.Object3D) {
  let a: THREE.Object3D | null = object;
  while (a && a.name !== COVER_HALF && a.name !== CAMERA_HALF) a = a.parent;
  return a?.name === COVER_HALF;
}

function texture(image: TexImageSource, anisotropy: number, premultiplied = false) {
  const t = new THREE.Texture(image as THREE.Texture["image"]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.premultiplyAlpha = premultiplied;
  t.needsUpdate = true;
  return t;
}

function frameLayer(openness: number, depth: number, frame: THREE.Vector4) {
  const shut = 1 + (CLOSED_ZOOM - 1) * depth;
  const zoom = THREE.MathUtils.lerp(shut, 1, THREE.MathUtils.smoothstep(openness, 0.3, 1));
  const w = INNER_UI_FRAME.z * zoom, h = INNER_UI_FRAME.w * zoom;
  frame.set(-w / 2, INNER_UI_FRAME.y + INNER_UI_FRAME.w / 2 - h / 2, w, h);
}

function frameWithin(panel: THREE.Vector4, layer: THREE.Vector4, out: THREE.Vector4) {
  return out.set((panel.x - layer.x) / layer.z, (panel.y - layer.y) / layer.w, panel.z / layer.z, panel.w / layer.w);
}

/** Cover a canvas with an image, centred. */
function drawCover(x: CanvasRenderingContext2D, image: CanvasImageSource & { width: number; height: number }, w: number, h: number) {
  const s = Math.max(w / image.width, h / image.height);
  x.drawImage(image, (w - image.width * s) / 2, (h - image.height * s) / 2, image.width * s, image.height * s);
}

export function loadModel(onProgress?: (fraction: number) => void): Promise<THREE.Group> {
  return new USDLoader().loadAsync(MODEL_URL, (e) => onProgress?.(Math.min(e.loaded / (e.total || MODEL_BYTES), 1)));
}

/** What a display shows: the Lock Screen composed on the GPU, a picture of
 *  the live display (apps, the Home Screen) through the same pipeline, or
 *  a hole over the live DOM. */
export type Mode = "lock" | "content" | "hole";

type Screen = {
  mesh: THREE.Mesh;
  lit: THREE.MeshStandardMaterial;
  hole: THREE.Material;
  cover: THREE.Mesh;
  parallax: { value: number };
  mode: Mode;
  time: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: THREE.Texture };
  chrome: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: THREE.Texture };
};

export type Duo = ReturnType<typeof createDuo>;

export function createDuo(
  model: THREE.Group,
  opts: { anisotropy: number; environment: THREE.Texture; bezel: Record<Finish, THREE.Texture>; cover: THREE.Material; hole: THREE.Material },
) {
  const { anisotropy, environment } = opts;
  const root = new THREE.Group();
  const bend = { value: Math.PI };
  const referenceEye = { value: UI_REFERENCE_EYE.clone() };
  const wipe = new ScreenWipe(anisotropy, SIZES);
  let sheets: Record<"backdrop" | "sky" | "ridge", THREE.Texture> | null = null;
  let theme: Theme = "light";
  let portrait = false;
  let turned: THREE.Texture | null = null;
  /** The live display's picture (lib/raster.ts), in the wide buffer. */
  let content: THREE.Texture | null = null;
  let openness = 0;
  let wake = 1;
  /** The panels' light (brightness and backlight, lib/backlight.ts). */
  let level = 1;
  let viewAmount = 1;
  let dirty = true;
  let minute = -1;

  const plate = (w: number, h: number) => {
    const [c, x] = canvas(w, h);
    return { canvas: c, ctx: x, tex: texture(c, anisotropy, true) };
  };

  function makeScreen(kind: Panel): Omit<Screen, "mesh" | "cover"> {
    const inner = kind === "inner";
    const parallax = { value: 1 };
    const lit = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveMap: wipe.texture(kind),
      envMap: environment,
      roughness: inner ? 1 : 0.06,
      metalness: 0,
      envMapIntensity: inner ? 0 : 0.35,
      toneMapped: false,
    });
    const uniforms = {
      foldAngle: bend,
      uiParallax: parallax,
      screenFrame: { value: inner ? INNER_UI_FRAME : OUTER_UI_FRAME },
      uiWipePosition: { value: inner ? 1 : 0 },
      uiShade: { value: inner ? new THREE.Vector2(0.5, 1) : new THREE.Vector2(0, 1) },
      uiReferenceEye: referenceEye,
    };
    lit.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <emissivemap_pars_fragment>", `#include <emissivemap_pars_fragment>\n${inner ? "#define INNER_UI" : ""}\n${screenShader}`)
        .replace("#include <emissivemap_fragment>", "totalEmissiveRadiance *= screenColor();");
      shader.vertexShader = `varying vec3 vUIPosition;\n${shader.vertexShader}`.replace(
        "#include <project_vertex>",
        "vUIPosition = transformed;\n#include <project_vertex>",
      );
      fold(shader, inner, true);
    };
    lit.customProgramCacheKey = () => `duo-screen-${kind}`;
    const [w, h] = [SIZES[kind].x, SIZES[kind].y];
    return { lit, hole: opts.hole, parallax, mode: "lock", time: plate(w, h), chrome: plate(w, h) };
  }

  /** The hinge turn (and the flexible strip's bend) in a material's vertex shader. */
  function fold(shader: THREE.WebGLProgramParametersWithUniforms, flexible: boolean, moving: boolean) {
    if (!moving && !flexible) return;
    shader.uniforms.foldAngle = bend;
    shader.vertexShader = `${flexible ? "#define FLEXIBLE_SCREEN\n" : ""}${foldShader}\n${shader.vertexShader}`
      .replace(
        "#include <begin_vertex>",
        `vec2 folded = ${flexible ? "bendStrip(position)" : "rotateHinge(position.xz)"};\nvec3 transformed = vec3(folded.x, position.y, folded.y);`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `vec3 objectNormal = vec3(normal);
        float a = foldAngle${flexible ? " * (1.0 - smoothstep(-1.6, 1.6, position.x))" : ""};
        objectNormal.x = cos(a) * normal.x + sin(a) * normal.z;
        objectNormal.z = -sin(a) * normal.x + cos(a) * normal.z;`,
      );
  }

  /** The frame's baked occlusion was painted with the model's own hinge
   *  cover in place, so it darkens the frame's hinge side to black; that
   *  side now meets the spine with a hairline, so the shadow fades out there. */
  function clearHingeShadow(shader: THREE.WebGLProgramParametersWithUniforms) {
    shader.vertexShader = `varying float vHingeX;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvHingeX = position.x;",
    );
    shader.fragmentShader = `varying float vHingeX;\n${shader.fragmentShader}`.replace(
      "#include <aomap_fragment>",
      THREE.ShaderChunk.aomap_fragment.replace("* aoMapIntensity", "* aoMapIntensity * smoothstep( 0.12, 0.5, abs( vHingeX ) )"),
    );
  }

  /** A per-mesh copy of a shared material, folding with the mesh. */
  function folding<M extends THREE.Material>(m: M, key: string, flexible: boolean, moving: boolean): M {
    if (!flexible && !moving) return m;
    const c = m.clone() as M;
    c.onBeforeCompile = (shader) => fold(shader, flexible, moving);
    c.customProgramCacheKey = () => `duo-${key}-${flexible ? "flex" : "cover"}`;
    return c;
  }

  const partial: Record<Panel, Omit<Screen, "mesh" | "cover">> = { inner: makeScreen("inner"), outer: makeScreen("outer") };
  const screens = {} as Record<Panel, Screen>;
  // Pale surfaces, kept with their Star White colour, for the Night Sky tint.
  type Saved = { color: THREE.Color; roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number; env: number; map: THREE.Texture | null; visible: boolean };
  const parts: { material: THREE.MeshPhysicalMaterial; star: Saved; night: Look }[] = [];
  const bezels: (THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial)[] = [];
  const buttons = Object.fromEntries(
    (Object.keys(BUTTONS) as ButtonName[]).map((n) => [n, { meshes: [] as THREE.Mesh[], box: new THREE.Box3() }]),
  ) as Record<ButtonName, { meshes: THREE.Mesh[]; box: THREE.Box3 }>;

  model.scale.multiplyScalar(MODEL_SCALE);
  model.updateMatrixWorld(true);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = (object.geometry as THREE.BufferGeometry).clone().applyMatrix4(object.matrixWorld);
    geometry.translate(0, -MODEL_DROP, 0);
    const moving = belongsToCoverHalf(object);
    const flexible = FLEXIBLE_MESHES.has(object.name);
    const kind: Panel | null = object.name === INNER_SCREEN ? "inner" : object.name === OUTER_SCREEN ? "outer" : null;
    let material: THREE.Material;

    if (kind) {
      const position = geometry.getAttribute("position");
      const uv = new Float32Array(position.count * 2);
      for (let i = 0; i < position.count; i++) {
        uv[i * 2] = kind === "inner" ? (position.getX(i) + 7.89935) / 15.7987 : (-0.23396 - position.getX(i)) / 7.73936;
        uv[i * 2 + 1] = kind === "inner" ? (position.getY(i) + MODEL_DROP - 0.34562) / 11.1035 : (position.getY(i) + MODEL_DROP - 0.27173) / 11.2513;
      }
      geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      material = partial[kind].lit;
    } else if (BEZELS.has(object.name)) {
      // This site's bezel, mapped flat across the open front in points.
      const position = geometry.getAttribute("position");
      const uv = new Float32Array(position.count * 2);
      for (let i = 0; i < position.count; i++) {
        const px = TEX.inner.x + BODY.w / 2 + position.getX(i) * UNIT;
        const py = TEX.inner.y + BODY.h / 2 - position.getY(i) * UNIT;
        uv[i * 2] = px / TEX.inner.w;
        uv[i * 2 + 1] = 1 - py / TEX.inner.h;
      }
      geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      const m = new THREE.MeshPhysicalMaterial({ map: opts.bezel.star, roughness: 0.32, metalness: 0, specularIntensity: 0.35, envMap: environment, envMapIntensity: 0.22 });
      bezels.push(m);
      material = m;
    } else {
      material = (object.material as THREE.Material).clone();
      dropMissingTextures(material);
      if (HINGE_MESHES.has(object.name)) matchFrame(material as THREE.MeshStandardMaterial);
      if (object.name === LINER) {
        // Shut, its ends show between the halves at the top and bottom:
        // the frame's metal there, as on the real hinge.
        matchFrame(material as THREE.MeshStandardMaterial);
        material.polygonOffset = true;
        material.polygonOffsetFactor = 2;
        material.polygonOffsetUnits = 24;
      }
      if (OUTER_CAMERA.has(object.name)) {
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -4;
      }
      const inside = INSIDES.has(object.name);
      const night = inside ? INSIDE_NIGHT : NIGHT_PARTS[object.name];
      const m = material as THREE.MeshPhysicalMaterial;
      if (inside) {
        m.color.set(INSIDE_STAR.color);
        m.roughness = INSIDE_STAR.roughness!;
        m.metalness = INSIDE_STAR.metalness!;
        m.aoMap = null;
        m.needsUpdate = true;
      }
      if (night && m.color) {
        parts.push({
          material: m,
          star: { color: m.color.clone(), roughness: m.roughness, metalness: m.metalness, clearcoat: m.clearcoat ?? 0, clearcoatRoughness: m.clearcoatRoughness ?? 0, env: inside ? INSIDE_STAR.env! : 1, map: m.map, visible: m.visible },
          night,
        });
      }
    }

    if (!kind) {
      const key = object.name;
      const hingeSide = FRAMES.has(object.name);
      material.onBeforeCompile = (shader) => {
        fold(shader, flexible, moving);
        if (hingeSide) clearHingeShadow(shader);
      };
      material.customProgramCacheKey = () => `duo-${key}-${moving || flexible ? (flexible ? "flex" : "cover") : "still"}`;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = object.name;
    mesh.frustumCulled = false;
    root.add(mesh);
    for (const n of Object.keys(BUTTONS) as ButtonName[]) {
      if (!BUTTONS[n].meshes.includes(object.name)) continue;
      geometry.computeBoundingBox();
      buttons[n].meshes.push(mesh);
      buttons[n].box.union(geometry.boundingBox!);
    }

    if (kind) {
      // Cover glass over a live display: the room's reflection only, added
      // onto the DOM beneath without touching its alpha.
      const cover = new THREE.Mesh(geometry, folding(opts.cover, `cover-${kind}`, flexible, moving));
      cover.renderOrder = 3;
      cover.visible = false;
      screens[kind] = { ...partial[kind], mesh, cover, hole: folding(opts.hole, `hole-${kind}`, flexible, moving) };
      root.add(cover);
    }
  });

  function light() {
    const lit = THREE.MathUtils.lerp(0.25, 1, THREE.MathUtils.smoothstep(openness, 0.02, 0.3));
    screens.inner.lit.emissiveIntensity = lit * wake * level;
    screens.outer.lit.emissiveIntensity = level;
  }

  function sync() {
    screens.inner.parallax.value = portrait ? 0 : viewAmount;
    // Shut, the outer display shows its picture flat, as the DOM's Lock
    // Screen does; the eye's projection eases in as it opens.
    screens.outer.parallax.value = viewAmount * THREE.MathUtils.smoothstep(openness, 0, 0.15);
  }

  const layerFrame = new THREE.Vector4();
  const composed: Record<LayerName, THREE.Vector4> = { sky: new THREE.Vector4(), ridge: new THREE.Vector4(), dune: new THREE.Vector4() };

  function paint(renderer: THREE.WebGLRenderer, kind: Panel) {
    if (!sheets) return;
    const screen = screens[kind];
    const shown = kind === "inner" && screen.mode === "content" ? content : null;
    const fitted = kind === "inner" && portrait && (shown ?? turned);
    // Apps and the Home Screen are one sheet, at the ridge's depth.
    const flat = shown !== null;
    const panel = kind === "inner" ? INNER_UI_FRAME : OUTER_UI_FRAME;
    for (const layer of LAYERS) {
      if (fitted) layerFrame.copy(panel);
      else frameLayer(openness, LAYER_DEPTH[layer], layerFrame);
      frameWithin(panel, layerFrame, composed[layer]);
    }
    const shut = 1 - openness;
    const swept = kind === "inner" ? shut : Math.max(0, 1 - 2 * Math.abs(shut - 0.5)) / 2;
    wipe.render(
      renderer,
      kind,
      {
        backdrop: fitted ? fitted : (shown ?? sheets.backdrop),
        backdropFrame: composed.ridge,
        landscape: fitted || flat ? null : { sky: sheets.sky, skyFrame: composed.sky, mountain: sheets.ridge, mountainFrame: composed.ridge, duneFrame: composed.dune },
        clock: fitted || flat ? null : { time: screen.time.tex, chrome: screen.chrome.tex },
      },
      swept,
    );
  }

  /** The inner Lock Screen held upright (phones): one flat picture, turned
   *  into the wide display buffer so it reads the right way up. */
  async function paintTurned() {
    if (!portrait) return;
    const [W, H] = [SIZES.inner.x, SIZES.inner.y];
    const [c, x] = canvas(W, H);
    const [fw, fh] = [H, W];
    const [frame, f] = canvas(fw, fh);
    const s = await loadSheets(theme);
    drawCover(f, s.base, fw, fh);
    const [time, t] = canvas(fw, fh);
    paintTime(t, fw, fh, "outer", theme, new Date());
    f.drawImage(time, 0, 0);
    const [fore, g] = canvas(fw, fh);
    drawCover(g, s.base, fw, fh);
    g.globalCompositeOperation = "destination-out";
    drawCover(g, s.sky, fw, fh);
    f.drawImage(fore, 0, 0);
    const [chrome, k] = canvas(fw, fh);
    await paintChrome(k, fw, fh, "outer", { glass: true });
    f.drawImage(chrome, 0, 0);
    // Upright on the device means a quarter turn back inside the display.
    x.translate(0, H);
    x.rotate(-Math.PI / 2);
    x.drawImage(frame, 0, 0);
    turned?.dispose();
    turned = texture(c, anisotropy);
    dirty = true;
  }

  async function paintClock(now: Date) {
    await loadFonts();
    for (const kind of ["inner", "outer"] as const) {
      const p = screens[kind].time;
      paintTime(p.ctx, p.canvas.width, p.canvas.height, kind, theme, now);
      p.tex.needsUpdate = true;
    }
    if (portrait) await paintTurned();
    dirty = true;
  }

  async function paintChromes() {
    await loadFonts();
    for (const kind of ["inner", "outer"] as const) {
      const p = screens[kind].chrome;
      await paintChrome(p.ctx, p.canvas.width, p.canvas.height, kind, kind === "outer" ? { glass: true, notice: true } : { glass: true });
      p.tex.needsUpdate = true;
    }
    dirty = true;
  }

  async function setTheme(next: Theme) {
    theme = next;
    const s: Sheets = await loadSheets(next);
    if (theme !== next) return;
    const old = sheets;
    sheets = { backdrop: texture(s.base, anisotropy), sky: texture(s.sky, anisotropy, true), ridge: texture(s.ridge, anisotropy, true) };
    if (old) Object.values(old).forEach((t) => t.dispose());
    minute = -1;
    dirty = true;
  }

  /** Star White (the model's own) or Night Sky, part by part, and the bezel. */
  function setFinish(finish: Finish) {
    const night = finish === "night";
    for (const { material: m, star, night: look } of parts) {
      m.color.set(night ? look.color : star.color);
      m.roughness = night ? (look.roughness ?? star.roughness) : star.roughness;
      m.metalness = night ? (look.metalness ?? star.metalness) : star.metalness;
      // The room, as the scene gives it, scaled per part.
      m.envMap = environment;
      m.envMapIntensity = ENVIRONMENT * (night ? (look.env ?? star.env) : star.env);
      m.visible = night ? !look.hidden : star.visible;
      m.map = night && look.noMap ? null : star.map;
      if ("clearcoat" in m) {
        m.clearcoat = night ? (look.clearcoat ?? star.clearcoat) : star.clearcoat;
        m.clearcoatRoughness = night ? (look.clearcoatRoughness ?? star.clearcoatRoughness) : star.clearcoatRoughness;
      }
      m.needsUpdate = true;
    }
    bezels.forEach((m) => {
      m.map = opts.bezel[finish];
      m.needsUpdate = true;
    });
  }

  let ready: Promise<void> = Promise.resolve();
  // The hinge's spine, built here rather than taken from the model (whose
  // strip sits flush, in a dark slot, with a notch at each end).
  //
  // A rigid rounded bar on the hinge axis, turned to the halves' bisector:
  // a rounded rectangle (its face, seen edge on) extruded outward with its
  // edges rolled. Shut it stands proud of the hinge edge between the halves'
  // rounded rims; as the phone opens and their back corners close in, it
  // narrows to fit between them and sinks into the seam, gone when flat.
  const spineMaterial = new THREE.MeshPhysicalMaterial({
    color: FRAME_COLOR,
    metalness: 1,
    roughness: SPINE.roughness,
    envMap: environment,
  });
  parts.push({
    material: spineMaterial,
    star: { color: spineMaterial.color.clone(), roughness: SPINE.roughness, metalness: 1, clearcoat: 0, clearcoatRoughness: 0, env: 1, map: null, visible: true },
    night: { ...TITANIUM, roughness: SPINE.roughness },
  });
  const spine = (() => {
    // A rounded rectangle (its face, seen edge on) extruded outward, its
    // edges rolled on a soft radius. Its corners are only as round as that
    // roll, so its ends sit square under the halves' rounded ends.
    const e = SPINE.edge;
    const w = SPINE.width / 2 - e, h = BODY_TOP - SPINE.inset - e, r = SPINE.corner - e;
    const face = new THREE.Shape();
    face.moveTo(-w + r, -h);
    face.lineTo(w - r, -h);
    face.quadraticCurveTo(w, -h, w, -h + r);
    face.lineTo(w, h - r);
    face.quadraticCurveTo(w, h, w - r, h);
    face.lineTo(-w + r, h);
    face.quadraticCurveTo(-w, h, -w, h - r);
    face.lineTo(-w, -h + r);
    face.quadraticCurveTo(-w, -h, -w + r, -h);
    const depth = SPINE.proud + SPINE.sunk - 2 * e;
    const geometry = new THREE.ExtrudeGeometry(face, { depth, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 16, curveSegments: 40 });
    // Local: x across the hinge, y along it, z outward; the face at z = 0.
    geometry.translate(0, 0, -(depth + e));
    // The face crowned into a shallow arc across.
    const at = geometry.getAttribute("position");
    for (let i = 0; i < at.count; i++) {
      const u = at.getX(i) / (SPINE.width / 2);
      at.setZ(i, at.getZ(i) - SPINE.crown * u * u);
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, spineMaterial);
    mesh.name = "spine";
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
    const basis = new THREE.Matrix4(), scale = new THREE.Matrix4();
    const across = new THREE.Vector3(), out = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    return {
      fold(angle: number) {
        const s = Math.sin(angle / 2), c = Math.cos(angle / 2);
        // Out along the bisector, across from the right corner to the left.
        out.set(-s, 0, -c);
        across.set(-c, 0, s);
        // Room between the back corners, and how far out their chord lies.
        const room = 2 * CORNER * s, chord = CORNER * c;
        const fit = Math.min(1, Math.max(0, (room - 0.12) / SPINE.width));
        const reach = chord + SPINE.proud * s * s;
        // Its sunk part shortens as the phone opens, so it never reaches the
        // display, which lies on the hinge axis once flat. Shut, it may run
        // just past the axis, between the halves.
        const floor = -0.08 + (CLEAR + 0.08) * c;
        const deep = Math.min(1, Math.max(0.05, (reach - floor) / (SPINE.proud + SPINE.sunk)));
        basis.makeBasis(across, up, out).setPosition(out.x * reach, 0, HINGE + out.z * reach);
        mesh.matrix.copy(basis).multiply(scale.makeScale(fit, 1, deep));
        mesh.matrixWorldNeedsUpdate = true;
        mesh.visible = s > 0.12;
      },
    };
  })();
  spine.fold(bend.value);
  root.traverse((o) => {
    if (o.name === "MvKPXGSdYDVvSpk") o.visible = false;
  });

  // The open front, face on, is the UI kit's own render (public/device/
  // inner-*.webp): its rim line, charcoal bezel and hinge block over the
  // model's front, one plate per half, just above the glass. Transparent
  // where the kit's picture is: around the body, and over the display.
  // Clear of the hinge liner, which stands 0.6 pt proud of the glass.
  const PLATE_Z = 0.29;
  // Shut, the plates lie in the phone's middle, and the render's titanium
  // band would show between the halves' rounded ends: they're only drawn
  // while the front can be seen.
  const plates: THREE.Mesh[] = [];
  for (const side of ["L", "R"] as const) {
    const x0 = side === "L" ? -(TEX.inner.x + BODY.w / 2) / UNIT : 0;
    const x1 = side === "L" ? 0 : (TEX.inner.w - TEX.inner.x - BODY.w / 2) / UNIT;
    const yTop = (BODY.h / 2 + TEX.inner.y) / UNIT, yBottom = -(TEX.inner.h - TEX.inner.y - BODY.h / 2) / UNIT;
    const geometry = new THREE.PlaneGeometry(x1 - x0, yTop - yBottom, 8, 1);
    geometry.translate((x0 + x1) / 2, (yTop + yBottom) / 2, PLATE_Z);
    const position = geometry.getAttribute("position");
    const uv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i++) {
      uv[i * 2] = (TEX.inner.x + BODY.w / 2 + position.getX(i) * UNIT) / TEX.inner.w;
      uv[i * 2 + 1] = 1 - (TEX.inner.y + BODY.h / 2 - position.getY(i) * UNIT) / TEX.inner.h;
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    // Unlit: the render has its light painted in. A faint sheen of the
    // room on top, as cover glass gives it.
    const m = new THREE.MeshBasicMaterial({
      map: opts.bezel.star,
      envMap: environment,
      combine: THREE.AddOperation,
      reflectivity: 0.035,
      toneMapped: false,
      transparent: true,
      alphaTest: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -6,
    });
    if (side === "L") {
      m.onBeforeCompile = (shader) => fold(shader, false, true);
      m.customProgramCacheKey = () => "duo-plate-cover";
    }
    bezels.push(m);
    const plate = new THREE.Mesh(geometry, m);
    plate.name = `plate-${side}`;
    plate.frustumCulled = false;
    plate.renderOrder = 2;
    root.add(plate);
    plates.push(plate);
  }
  for (const p of plates) p.visible = bend.value < THREE.MathUtils.degToRad(150);

  ready = Promise.all([setTheme("light"), paintChromes()]).then(() => paintClock(new Date()));

  return {
    root,
    ready: () => ready,
    setFold(deg: number) {
      const angle = THREE.MathUtils.degToRad(deg);
      if (angle === bend.value) return;
      bend.value = angle;
      spine.fold(angle);
      for (const p of plates) p.visible = deg < 150;
      openness = 1 - THREE.MathUtils.clamp(deg / 180, 0, 1);
      dirty = true;
      light();
      sync();
    },
    setWake(v: number) {
      wake = v;
      light();
    },
    setLevel(v: number) {
      level = v;
      light();
    },
    setMode(kind: Panel, mode: Mode) {
      const s = screens[kind];
      if (s.mode === mode) return;
      s.mode = mode;
      s.mesh.material = mode === "hole" ? s.hole : s.lit;
      s.cover.visible = mode === "hole";
      dirty = true;
    },
    setDark(dark: boolean) {
      setFinish(dark ? "night" : "star");
      const next: Theme = dark ? "dark" : "light";
      if (next !== theme) ready = setTheme(next).then(() => paintClock(new Date()));
      return ready;
    },
    setPortrait(p: boolean) {
      if (p === portrait) return;
      portrait = p;
      sync();
      if (p) void paintTurned();
      dirty = true;
    },
    setViewpoint(eye: THREE.Vector3) {
      referenceEye.value.copy(eye);
      const reach = eye.length();
      viewAmount = reach > 0 ? THREE.MathUtils.clamp(eye.z / reach, 0, 1) ** 1.5 : 1;
      sync();
    },
    /** Repaints the clock when the minute turns; true when it did. */
    tick(now = new Date()) {
      const m = Math.floor(now.getTime() / 60000);
      if (m === minute) return false;
      minute = m;
      void paintClock(now);
      return true;
    },
    /** Composes the displays that show the Lock Screen, if anything changed. */
    render(renderer: THREE.WebGLRenderer) {
      if (!dirty || !sheets) return;
      dirty = false;
      for (const kind of ["inner", "outer"] as const) if (screens[kind].mode !== "hole") paint(renderer, kind);
    },
    dirty: () => dirty,
    /** A button pressed in by `amount` (0 out … 1 home). */
    setPress(name: ButtonName, amount: number) {
      for (const m of buttons[name].meshes) m.position.copy(BUTTONS[name].dir).multiplyScalar(-TRAVEL * amount);
    },
    /** The button a ray (in model units) lands on, unless it's round the back. */
    buttonAt(ray: THREE.Ray, eye: THREE.Vector3): ButtonName | null {
      let best: ButtonName | null = null, near = Infinity;
      const hit = new THREE.Vector3(), zone = new THREE.Box3(), toEye = new THREE.Vector3();
      for (const n of Object.keys(BUTTONS) as ButtonName[]) {
        zone.copy(buttons[n].box).expandByScalar(REACH);
        if (!ray.intersectBox(zone, hit)) continue;
        // Not from the far side of the body. Face on, an edge looks a little
        // away from the eye, but the button still stands out of the outline.
        if (toEye.copy(eye).sub(hit).normalize().dot(BUTTONS[n].dir) < -0.5) continue;
        const d = hit.distanceTo(ray.origin);
        if (d < near) [near, best] = [d, n];
      }
      return best;
    },
    /** A picture of the live display (w × h as laid out; upright on a
     *  phone, turned here into the wide buffer). */
    setContent(picture: HTMLCanvasElement) {
      const [W, H] = [SIZES.inner.x, SIZES.inner.y];
      const [c, x] = canvas(W, H);
      if (picture.height > picture.width) {
        x.translate(0, H);
        x.rotate(-Math.PI / 2);
        x.drawImage(picture, 0, 0, H, W);
      } else x.drawImage(picture, 0, 0, W, H);
      content?.dispose();
      content = texture(c, anisotropy);
      if (screens.inner.mode === "content") dirty = true;
    },
    dispose() {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
      });
      Object.values(sheets ?? {}).forEach((t) => t.dispose());
      turned?.dispose();
      content?.dispose();
    },
  };
}

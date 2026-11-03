import * as THREE from "three";

// The photo studio every reflection on the device sees, pre-filtered into
// an environment map. Product shots of polished titanium read as real
// because of what they reflect: a large soft box overhead, tall strip
// lights at the sides, a graded sweep behind the camera broken by black
// flags, and a darker floor. Each of those lands on the band as a distinct
// highlight or shadow, so the edge always shows structure, never a flat
// tint.

function panel(w: number, h: number, intensity: number, color = 0xffffff) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

/** A panel lit brighter at the top than the bottom, like a soft box's falloff. */
function graded(w: number, h: number, top: number, bottom: number) {
  const g = new THREE.PlaneGeometry(w, h, 1, 8);
  const colors: number[] = [];
  const pos = g.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + h / 2) / h;
    const v = bottom + (top - bottom) * t * t;
    colors.push(v, v, v);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
}

export function studioEnvironment(renderer: THREE.WebGLRenderer, night: boolean) {
  const scene = new THREE.Scene();
  const n = night ? 0.55 : 1;

  // The room: a lit ceiling falling to a dark floor.
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(40, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        top: { value: new THREE.Color(0.62 * n, 0.62 * n, 0.64 * n) },
        mid: { value: new THREE.Color(0.3 * n, 0.3 * n, 0.31 * n) },
        bottom: { value: new THREE.Color(0.13, 0.13, 0.14) },
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader:
        "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0. ? mix(mid, top, smoothstep(0., .7, y)) : mix(mid, bottom, smoothstep(0., .45, -y)); gl_FragColor = vec4(c, 1.); }",
    }),
  );
  scene.add(room);

  // Overhead soft box: the long bright line along the top of the band.
  const soft = panel(24, 14, 6 * n);
  soft.position.set(0, 17, 3);
  soft.rotation.x = Math.PI / 2;
  scene.add(soft);

  // Tall strip lights left and right, forward of the device.
  for (const [x, i] of [
    [-15, 5],
    [16, 3.6],
  ] as const) {
    const s = panel(2.6, 24, i * n);
    s.position.set(x, 3, 9);
    s.lookAt(0, 0, 0);
    scene.add(s);
  }

  // Behind the camera: a graded sweep, broken by two black flags and a
  // dark horizon, so edges facing the viewer carry bands, not a flat fill.
  const sweep = graded(46, 30, 2.2 * n, 1.05 * n);
  sweep.position.set(0, 3, 24);
  sweep.lookAt(0, 0, 0);
  scene.add(sweep);
  for (const [x, w] of [
    [-6.5, 1.3],
    [8, 0.9],
  ] as const) {
    const f = panel(w, 30, 0, 0x000000);
    f.position.set(x, 2, 20);
    f.lookAt(0, 0, 0);
    scene.add(f);
  }
  const horizon = panel(50, 0.8, 0, 0x000000);
  horizon.position.set(0, -6, 20);
  horizon.lookAt(0, 0, 0);
  scene.add(horizon);

  // A small hard light, up left: the glint on rounded corners.
  const glint = panel(1.4, 1.4, 14 * n);
  glint.position.set(-9, 11, 14);
  glint.lookAt(0, 0, 0);
  scene.add(glint);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.012).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose();
  });
  return env;
}

// Capability checks. Client-only; each returns the conservative answer on
// the server.

export function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function finePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine) and (hover: hover)").matches;
}

export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 1024px)").matches;
}


let webgl: boolean | null = null;
/** Probe once before mounting a canvas. */
export function webglAvailable(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") ?? c.getContext("webgl");
    webgl = !!ctx;
    (ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

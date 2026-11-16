// A picture of the live display, for the GPU. While the phone folds, the
// inner display is drawn by the same pipeline as the Lock Screen (the
// sheets' depth, the waking half's blur and shade, the eye's projection),
// so apps and the Home Screen fold exactly as the wallpaper does. That
// needs them as a texture: a deep copy of the live DOM, laid out at its own
// size inside an SVG foreignObject, with the page's styles, fonts and
// images inlined (an SVG image may fetch nothing), drawn into a canvas.

const cache = new Map<string, Promise<string>>();

function dataURL(url: string): Promise<string> {
  if (url.startsWith("data:")) return Promise.resolve(url);
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then(
        (b) =>
          new Promise<string>((resolve, reject) => {
            const f = new FileReader();
            f.onload = () => resolve(String(f.result));
            f.onerror = reject;
            f.readAsDataURL(b);
          }),
      )
      .catch(() => "data:,");
    cache.set(url, p);
  }
  return p;
}

const URL_RE = /url\((["']?)([^"')]+)\1\)/g;

/** Every url() in a block of CSS, inlined. */
async function inlineURLs(css: string, base: string) {
  const urls = new Set<string>();
  for (const m of css.matchAll(URL_RE)) if (!m[2]!.startsWith("data:") && !m[2]!.startsWith("#")) urls.add(m[2]!);
  const map = new Map<string, string>();
  await Promise.all([...urls].map(async (u) => map.set(u, await dataURL(new URL(u, base).href))));
  return css.replace(URL_RE, (all, q, u) => (map.has(u) ? `url(${q}${map.get(u)}${q})` : all));
}

let styles: Promise<string> | null = null;
/** The page's own CSS (same-origin sheets), fonts and images inlined. */
function pageCSS() {
  styles ??= (async () => {
    const parts: string[] = [];
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const text = [...rules].map((r) => r.cssText).join("\n");
      parts.push(await inlineURLs(text, sheet.href ?? location.href));
    }
    return parts.join("\n");
  })();
  return styles;
}
/** New styles arrived (development reloads): read them again next time. */
export function forgetStyles() {
  styles = null;
}

/** The document's custom properties (the theme's colours, the fonts), to
 *  set on the copy: :root's rules don't reach into the picture. */
function rootVars() {
  const cs = getComputedStyle(document.documentElement);
  const out: string[] = [];
  for (let i = 0; i < cs.length; i++) {
    const name = cs[i]!;
    if (name.startsWith("--")) out.push(`${name}:${cs.getPropertyValue(name)}`);
  }
  return out.join(";");
}

/** In a picture, backdrop filters render as unclipped boxes: the glass
 *  keeps its tint and rim and drops the blur. Nothing animates. */
const PICTURE_CSS = "*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important;caret-color:transparent!important}";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Draw `root` (w × h CSS px) into a canvas at `scale`. Scroll positions,
 * form values and canvases are carried over; the panel's veil is left out
 * (the GPU applies the light itself).
 */
export async function rasterize(root: HTMLElement, w: number, h: number, scale: number): Promise<HTMLCanvasElement> {
  const copy = root.cloneNode(true) as HTMLElement;
  copy.removeAttribute("data-os-root");
  copy.style.borderRadius = "0";
  copy.querySelectorAll("[data-veil], script, iframe, video").forEach((n) => n.remove());

  // Walk the original and the copy together (what was removed skipped).
  const jobs: Promise<unknown>[] = [];
  const pairs: [Element, HTMLElement][] = [];
  const walk = (a: Element, b: Element) => {
    pairs.push([a, b as HTMLElement]);
    const ac = [...a.children].filter((c) => !(c as HTMLElement).matches?.("[data-veil], script, iframe, video"));
    const bc = [...b.children];
    for (let i = 0; i < Math.min(ac.length, bc.length); i++) walk(ac[i]!, bc[i]!);
  };
  walk(root, copy);

  for (const [a, b] of pairs) {
    // Scrolled boxes: shift their content, since a picture can't scroll.
    if (a.scrollTop || a.scrollLeft) {
      b.style.overflow = "hidden";
      for (const c of [...b.children] as HTMLElement[]) {
        c.style.translate = `${-a.scrollLeft}px ${-a.scrollTop}px`;
      }
    }
    // Liquid Glass's refraction filter lives in the page; the picture
    // falls back to the CSS frost.
    b.style?.removeProperty?.("--lg");
    if (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) {
      b.setAttribute("value", a.value);
      if (a instanceof HTMLTextAreaElement) b.textContent = a.value;
      if (a instanceof HTMLInputElement && a.checked) b.setAttribute("checked", "");
    }
    if (a instanceof HTMLCanvasElement) {
      const img = document.createElement("img");
      try {
        img.src = a.toDataURL();
      } catch {}
      img.className = a.className;
      img.setAttribute("style", a.getAttribute("style") ?? "");
      b.replaceWith(img);
      continue;
    }
    if (b instanceof HTMLImageElement) {
      const src = (a as HTMLImageElement).currentSrc || (a as HTMLImageElement).src;
      b.removeAttribute("srcset");
      b.removeAttribute("loading");
      jobs.push(dataURL(src).then((d) => b.setAttribute("src", d)));
    }
    if (b instanceof SVGImageElement) {
      const href = b.getAttribute("href") ?? b.getAttribute("xlink:href");
      if (href) jobs.push(dataURL(new URL(href, location.href).href).then((d) => b.setAttribute("href", d)));
    }
    const style = b.getAttribute?.("style");
    if (style && style.includes("url(")) jobs.push(inlineURLs(style, location.href).then((s) => b.setAttribute("style", s)));
  }
  const [css] = await Promise.all([pageCSS(), ...jobs]);

  const html = document.documentElement;
  const wrapper =
    `<div xmlns="http://www.w3.org/1999/xhtml" class="${esc(html.className)}" data-theme="${esc(copy.dataset.theme ?? html.dataset.theme ?? "light")}" ` +
    `style="${esc(rootVars())};position:relative;width:${w}px;height:${h}px;overflow:hidden;margin:0;font-family:var(--font-sans);-webkit-font-smoothing:antialiased">` +
    // CDATA: the CSS has nesting's "&" and selectors' ">" in it.
    `<style><![CDATA[${css.replace(/\]\]>/g, "]]]]><![CDATA[>")}\n${PICTURE_CSS}]]></style>` +
    new XMLSerializer().serializeToString(copy) +
    `</div>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}">${wrapper}</foreignObject></svg>`;
  // A data: URL, not a blob: one: Chromium taints a canvas that draws a
  // foreignObject from a blob, which would keep it off the GPU.
  const img = new Image();
  img.decoding = "sync";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const x = c.getContext("2d")!;
  x.scale(scale, scale);
  x.drawImage(img, 0, 0, w, h);
  return c;
}

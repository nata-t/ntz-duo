// Copies of the live display. Wherever the screen must be shown somewhere
// the live OS isn't (the two halves while the device folds, the frame a
// full-screen transition starts or ends on), it shows a deep copy of the
// live DOM: open apps, their own state, scroll offsets and typed text, so
// the picture never changes when the handover happens.

type Offsets = [path: number[], top: number, left: number][];

const LIVE = '[data-os-root="live"]';

export function liveRoot() {
  return document.querySelector<HTMLElement>(LIVE);
}

/** Where every scrolled element inside `root` sits, by child-index path. */
export function scrollOffsets(root: HTMLElement): Offsets {
  const out: Offsets = [];
  const walk = (el: Element, path: number[]) => {
    if (el.scrollTop || el.scrollLeft) out.push([path, el.scrollTop, el.scrollLeft]);
    for (let i = 0; i < el.children.length; i++) walk(el.children[i]!, [...path, i]);
  };
  walk(root, []);
  return out;
}

export function applyOffsets(root: HTMLElement, offsets: Offsets) {
  for (const [path, top, left] of offsets) {
    let el: Element | undefined = root;
    for (const i of path) el = el?.children[i];
    if (el) {
      el.scrollTop = top;
      el.scrollLeft = left;
    }
  }
}

/** A still copy of the live display, inert and unannounced. Put it in the
 *  document, then hand it to `settle` to restore its scroll offsets. */
export function copyLive(): { node: HTMLElement; settle: () => void } | null {
  const live = liveRoot();
  if (!live) return null;
  const node = live.cloneNode(true) as HTMLElement;
  node.dataset.osRoot = "mirror";
  node.removeAttribute("data-lenis-prevent");
  node.setAttribute("aria-hidden", "true");
  node.inert = true;
  node.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  node.querySelectorAll("img[loading]").forEach((el) => el.setAttribute("loading", "eager"));
  // Form state lives in properties, which cloning leaves behind.
  const from = live.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const to = node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  from.forEach((el, i) => {
    const c = to[i];
    if (!c) return;
    c.value = el.value;
    if (el instanceof HTMLInputElement && c instanceof HTMLInputElement) c.checked = el.checked;
  });
  const offsets = scrollOffsets(live);
  return { node, settle: () => applyOffsets(node, offsets) };
}

// The folding halves.
const slots = new Set<HTMLElement>();
let flat = false;
let queued = 0;

/** Fill every folding half with a fresh copy of the live display. */
export function snapshot() {
  cancelAnimationFrame(queued);
  queued = 0;
  for (const slot of slots) {
    const copy = copyLive();
    if (!copy) return;
    slot.replaceChildren(copy.node);
    copy.settle();
  }
}

/** Refresh the halves on the next frame, unless the live display is the
 *  one on show (the halves are hidden then, and copy it as they fold). */
export function scheduleSnapshot() {
  if (flat || queued) return;
  queued = requestAnimationFrame(() => {
    queued = 0;
    if (!flat) snapshot();
  });
}

/** The device reports when it lies flat. Leaving flat, the halves take
 *  the live display exactly as it stands, before the frame that shows them. */
export function setFlat(v: boolean) {
  if (v === flat) return;
  flat = v;
  if (!v) snapshot();
}

export function registerMirror(el: HTMLElement) {
  slots.add(el);
  scheduleSnapshot();
  return () => {
    slots.delete(el);
  };
}

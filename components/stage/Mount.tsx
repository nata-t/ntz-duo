"use client";

import { useLayoutEffect, useRef } from "react";
import { applyOffsets, registerMirror, scrollOffsets } from "@/lib/mirror";

/** Scroll offsets of a node on its way between places. */
const carried = new WeakMap<HTMLElement, ReturnType<typeof scrollOffsets>>();

/** A place for a node that React renders elsewhere (through a portal), so
 *  the node can move between places without remounting: the live display
 *  goes from the device to full screen and back with every app, scroll
 *  offset and half-typed message intact. The active place holds it. */
export default function Mount({ node, active, className }: { node: HTMLElement; active: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = host.current;
    if (!active || !el) return;
    if (node.parentNode !== el) {
      // Leaving the document resets scroll offsets; carry them over.
      const offsets = node.isConnected ? scrollOffsets(node) : (carried.get(node) ?? []);
      el.append(node);
      applyOffsets(node, offsets);
    }
    // Runs before this place leaves the document, while offsets still read.
    return () => {
      if (node.parentNode === el) carried.set(node, scrollOffsets(node));
    };
  }, [active, node]);

  return <div ref={host} className={className} />;
}

/** One folding half of the inner display: a copy of the live display,
 *  refreshed as the device leaves flat (lib/mirror.ts). */
export function Mirror() {
  return <div ref={(el) => (el ? registerMirror(el) : undefined)} />;
}

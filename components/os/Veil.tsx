"use client";

import { useVeil } from "@/lib/backlight";

/** The panel's light over a DOM display: brightness, as the panel would
 *  dim, and the backlight going off and on. Above everything on it. */
export default function Veil() {
  const veil = useVeil();
  return <div data-veil aria-hidden="true" className="pointer-events-none absolute inset-0 z-[60] bg-black" style={{ opacity: veil }} />;
}

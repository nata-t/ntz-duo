"use client";

import { useRef } from "react";
import { FACES } from "./icons";
import { APPS } from "@/components/apps/registry";
import { launch } from "./launch";

type Props = {
  id: string;
  size?: number;
  /** Show the name under the icon (off in the dock). */
  label?: boolean;
  mirror?: boolean;
};

/** The icon shape: iOS's continuous corner sits near 22.4% of the side. */
export const iconRadius = (size: number) => size * 0.2237;

export function IconFace({ id, size }: { id: string; size: number }) {
  const Face = FACES[id];
  return (
    <span
      className="relative block overflow-hidden"
      style={{ width: size, height: size, borderRadius: iconRadius(size) }}
    >
      {Face ? <Face /> : <span className="block h-full w-full bg-gray" />}
      {/* iOS 27's glass edge: a lit rim, a soft top sheen. */}
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_46%)] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.32),inset_0_1px_1.2px_rgba(255,255,255,0.45),inset_0_-1px_1.5px_rgba(0,0,0,0.08)]"
        style={{ borderRadius: iconRadius(size) }}
      />
    </span>
  );
}

export default function AppIcon({ id, size = 62, label = true, mirror = false }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const app = APPS[id];
  const name = app?.name ?? id;

  return (
    <button
      ref={ref}
      type="button"
      data-app={id}
      tabIndex={mirror ? -1 : 0}
      aria-label={name}
      onClick={() => {
        const face = ref.current?.querySelector<HTMLElement>("[data-face]");
        if (face) launch(id, face);
      }}
      className="group flex flex-col items-center outline-none select-none"
      style={{ width: size + 18 }}
    >
      <span
        data-face
        className="block transition-[transform,filter] duration-200 ease-out group-active:scale-[0.9] group-active:brightness-[0.82]"
        style={{
          borderRadius: iconRadius(size),
          filter: "drop-shadow(0 1px 2.5px rgba(0,0,0,0.16))",
        }}
      >
        <IconFace id={id} size={size} />
      </span>
      {label ? (
        <span
          className="mt-[5px] max-w-full truncate text-[11.5px] leading-[1.15] font-medium tracking-[0.005em] text-white text-shadow-[0_0.5px_2px_rgba(0,0,0,0.3)]"
        >
          {name}
        </span>
      ) : null}
    </button>
  );
}

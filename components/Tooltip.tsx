"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { TOOLTIPS } from "@/lib/tooltips";

export function Tooltip({
  term,
  text,
  width = "w-56",
}: {
  term?: keyof typeof TOOLTIPS | string;
  text?: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const definition = text ?? (term ? TOOLTIPS[term] : undefined);

  // Render the popover through a portal into document.body. This is the
  // fix for the layering bug: several cards use a backdrop-blur
  // background, and `backdrop-filter` creates a new CSS stacking context.
  // That traps a normally-positioned absolute child inside that one card,
  // so a later sibling card in the grid paints over it regardless of
  // z-index. Rendering at the document root sidesteps every parent
  // stacking context entirely.
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (!definition) return null;

  return (
    <span className="relative inline-block ml-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-neutral-500 hover:text-neutral-300 text-xs rounded-full border border-neutral-700 w-4 h-4 inline-flex items-center justify-center"
        aria-label={`More information${term ? `: ${term}` : ""}`}
      >
        ?
      </button>
      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <span
            style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateX(-50%)", zIndex: 9999 }}
            className={`${width} rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-xs text-neutral-300 leading-relaxed shadow-xl whitespace-pre-line pointer-events-none`}
          >
            {definition}
          </span>,
          document.body
        )}
    </span>
  );
}

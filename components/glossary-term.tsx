"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GLOSSARY } from "@/lib/glossary";

interface GlossaryTermProps {
  /**
   * The exact key from GLOSSARY (e.g. "WER", "MOS").
   * If the key is not found the children / term text renders as-is.
   */
  term: string;
  /** Optional override for the displayed text. Defaults to `term`. */
  children?: React.ReactNode;
  /** If true, suppress the dotted underline decoration */
  noUnderline?: boolean;
}

/**
 * Wraps a technical term with an accessible tooltip that shows on hover (300 ms
 * delay) and on keyboard focus.  Disappears on Escape.  The tooltip stays
 * visible when the user moves the mouse into it for comfortable reading.
 */
export function GlossaryTerm({ term, children, noUnderline = false }: GlossaryTermProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId              = useId();
  const showTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const def = GLOSSARY[term];

  // Escape key hides any open tooltip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setVisible(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!def) return <>{children ?? term}</>;

  function scheduleShow() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => setVisible(true), 300);
  }

  function scheduleHide(delay = 120) {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), delay);
  }

  const triggerProps = {
    onMouseEnter: scheduleShow,
    onMouseLeave: () => scheduleHide(),
    onFocus:      scheduleShow,
    onBlur:       () => scheduleHide(),
  };

  return (
    <span className="relative inline-block">
      {/* The term trigger — use <abbr> for semantic correctness */}
      <abbr
        title={def.short}            // native tooltip fallback
        aria-describedby={visible ? tooltipId : undefined}
        tabIndex={0}
        {...triggerProps}
        style={{
          textDecoration: noUnderline ? "none" : "underline dotted",
          textDecorationColor: "rgba(0,212,232,0.5)",
          textUnderlineOffset: "3px",
          cursor: "help",
          fontStyle: "normal",
          outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setVisible((v) => !v);
          }
        }}
      >
        {children ?? term}
      </abbr>

      {/* Tooltip */}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-auto"
          style={{ minWidth: 220, maxWidth: 288 }}
          // Keep visible while user reads inside the tooltip
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
          onMouseLeave={() => scheduleHide(200)}
        >
          <span
            className="block rounded-xl px-3.5 py-2.5 text-xs shadow-2xl"
            style={{
              background: "#1a1a2e",
              color: "#f1f5f9",
              border: "1px solid rgba(0,212,232,0.25)",
              lineHeight: 1.55,
            }}
          >
            <span className="block font-semibold mb-1" style={{ color: "#00d4e8" }}>
              {term} — {def.short}
            </span>
            <span style={{ color: "rgba(241,245,249,0.8)" }}>{def.full}</span>
          </span>
          {/* Arrow */}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 block"
            style={{
              width: 0, height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #1a1a2e",
              marginTop: -1,
            }}
          />
        </span>
      )}
    </span>
  );
}

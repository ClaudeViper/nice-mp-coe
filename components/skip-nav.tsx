"use client";

/**
 * Skip Navigation — the very first focusable element in the DOM.
 * Visible only on keyboard focus so it doesn't affect visual layout.
 * Allows keyboard users to jump past the sidebar/topbar directly to
 * the main content area.
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="skip-nav"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
        zIndex: 9999,
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.left   = "1rem";
        el.style.top    = "1rem";
        el.style.width  = "auto";
        el.style.height = "auto";
        el.style.overflow = "visible";
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.left   = "-9999px";
        el.style.top    = "auto";
        el.style.width  = "1px";
        el.style.height = "1px";
        el.style.overflow = "hidden";
      }}
    >
      Skip to main content
    </a>
  );
}

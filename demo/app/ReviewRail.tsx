import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Review-only tool rail (user, 13/11): a strip at the right edge of the window, outside the 1600x900 stage
// (#review-rail in index.html). Each screen mounts only its own tools; buttons stack from the bottom up with the
// tuner (demo/shared/tuner.js) lowest, and the open panel sits on top of the stack (flex `order`: panel 1, screen
// buttons 2, tuner 3). One panel open at a time: opening one sends OPEN_EVENT, the others close.
export const OPEN_EVENT = "aoe-review-open";

export function ReviewRailItem({ label, title, hotkey, children }: {
  /** Text on the rail button. */
  label: string;
  /** Accessible name of the panel. */
  title: string;
  /** Alt+<hotkey> toggles the panel. */
  hotkey?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(() => hotkey === "m" && new URLSearchParams(location.search).get("mock") === "open");

  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
  }, [open, id]);
  useEffect(() => {
    const onOther = (e: Event) => (e as CustomEvent).detail !== id && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (hotkey && e.altKey && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener(OPEN_EVENT, onOther);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOther);
      window.removeEventListener("keydown", onKey);
    };
  }, [id, hotkey]);

  const rail = document.getElementById("review-rail");
  if (!rail) return null;
  return createPortal(
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        title={hotkey ? `${title} (Alt+${hotkey.toUpperCase()})` : title}
        onClick={() => setOpen((v) => !v)}
        className={
          "order-2 whitespace-nowrap border px-2.5 py-0.5 font-body text-xs font-semibold leading-4 text-white " +
          (open ? "border-tone-focus bg-black/85 text-tone-focus" : "border-white/30 bg-black/85 hover:bg-black")
        }
      >
        ⚙ {label}
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={title}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="order-1 min-h-0 w-[330px] shrink overflow-auto border border-white/20 bg-black/90 px-3 py-2.5 font-body text-sm text-white shadow-[0_6px_24px_#000a]"
        >
          {children}
        </div>
      )}
    </>,
    rail,
  );
}

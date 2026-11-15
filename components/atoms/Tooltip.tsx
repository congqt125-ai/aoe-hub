import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Kbd } from "./Kbd";

export interface TooltipProps {
  /** Text tooltip, or rich content (title + description). Never put actions inside. */
  content: ReactNode;
  title?: string;
  shortcut?: string[];
  placement?: "top" | "bottom";
  className?: string;
  /** The trigger: one focusable element. */
  children: ReactElement<{ "aria-describedby"?: string }>;
}

const DELAY_MS = 400;

/** Shows after 400ms hover, immediately on keyboard focus; Esc hides it. */
export function Tooltip({ content, title, shortcut, placement = "top", className, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  const trigger = isValidElement(children) ? cloneElement(children, { "aria-describedby": open ? id : undefined }) : children;
  return (
    <span
      className={cx("relative inline-flex", className)}
      onMouseEnter={() => show(DELAY_MS)}
      onMouseLeave={hide}
      onFocus={(e) => e.target.matches(":focus-visible") && show(0)}
      onBlur={hide}
      onMouseDown={hide}
    >
      {trigger}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cx(
            "pointer-events-none absolute left-1/2 z-tooltip w-max max-w-[260px] -translate-x-1/2 px-2 py-1",
            "bg-black/85 bevel-flat tone-screen font-body text-sm text-white text-shadow-none",
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {title && <span className="block font-heading font-semibold">{title}</span>}
          <span className={cx("block", title && "text-white/80")}>{content}</span>
          {shortcut && (
            <span className="mt-1 flex gap-1">
              {shortcut.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

import { useEffect, useId, useRef, type FormEventHandler, type ReactNode, type RefObject } from "react";
import { cx } from "../lib/cx";
import type { DialogTheme } from "../lib/theme";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Surface } from "../atoms/Surface";

export type DialogSize = "sm" | "md" | "lg";
const WIDTH: Record<DialogSize, string> = { sm: "w-[min(360px,100%)]", md: "w-[min(480px,100%)]", lg: "w-[min(720px,100%)]" };

export interface DialogProps {
  title: ReactNode;
  /** Short line under the title. */
  description?: ReactNode;
  children: ReactNode;
  /** Button row, right aligned: secondary ("Huỷ") first, primary last. */
  actions?: ReactNode;
  size?: DialogSize;
  /** modal: overlay + focus trap + Esc; inline: part of the page (login screen). */
  variant?: "modal" | "inline";
  open?: boolean;
  /** Close button / Esc / overlay click = cancel. Omit to hide the close button. */
  onClose?: () => void;
  /** Render the body as a <form> (Enter submits). */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  /** Dialog theme (texture + bevel + control sprites); default = current data-dialog-theme. */
  dialogTheme?: DialogTheme;
  /** Element to focus when opened (default: first focusable). */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Game dialog: textured Surface + raised 3px bevel, centered Spectral SC title, theme close sprite, button row.
 * Modal variant locks focus inside, Esc / close = cancel, focus returns to the opener.
 */
export function Dialog({
  title, description, children, actions, size = "md", variant = "modal", open = true, onClose, onSubmit, dialogTheme, initialFocus, className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const box = useRef<HTMLElement>(null);
  const modal = variant === "modal";

  useEffect(() => {
    if (!open || !modal) return;
    const opener = document.activeElement as HTMLElement | null;
    const first = initialFocus?.current ?? box.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? box.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== "Tab" || !box.current) return;
      const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, modal, onClose, initialFocus]);

  if (!open) return null;

  const body = (
    <>
      {onClose && (
        // Positioned by a wrapper: IconButton carries `relative`, which beats `absolute` in the generated CSS
        // (the button used to fall back to the top-left corner). Plain bevel frame like the other buttons.
        <span className="absolute right-2.5 top-2.5">
          <IconButton size={24} label="Đóng" tooltip={false} onClick={onClose}>
            <Icon name="close" size={16} />
          </IconButton>
        </span>
      )}
      <h2 id={titleId} className="m-0 px-8 text-center font-heading text-2xl font-semibold leading-tight">
        {title}
      </h2>
      {description && (
        <p id={descId} className="m-0 mt-1 text-center font-body text-md">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
      {actions && <div className="mt-5 flex justify-end gap-2.5">{actions}</div>}
    </>
  );

  const surface = (
    <Surface
      as={onSubmit ? "form" : "section"}
      ref={box}
      dialogTheme={dialogTheme}
      role={modal ? "dialog" : undefined}
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      tabIndex={-1}
      noValidate={onSubmit ? true : undefined}
      onSubmit={onSubmit}
      className={cx("relative bevel-raised px-6 pb-6 pt-5 outline-none", WIDTH[size], className)}
    >
      {body}
    </Surface>
  );

  if (!modal) return surface;
  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {surface}
    </div>
  );
}

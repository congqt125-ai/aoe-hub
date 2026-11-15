import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/cx";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";

export type ToastKind = "success" | "info" | "warning" | "error";

export interface ToastData {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const STYLE: Record<ToastKind, { icon: IconName; stripe: string; text: string }> = {
  success: { icon: "success", stripe: "before:bg-success", text: "text-success-on-dark" },
  info: { icon: "info", stripe: "before:bg-info", text: "text-info-on-dark" },
  warning: { icon: "warning", stripe: "before:bg-warning", text: "text-warning-on-dark" },
  error: { icon: "error", stripe: "before:bg-danger", text: "text-danger-on-dark" },
};

const AUTO_HIDE_MS = 5000;

export interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
  className?: string;
}

/** Dark surface + raised bevel + 4px colored stripe. Hides after 5s (paused on hover); errors stay until closed. */
export function Toast({ toast, onClose, className }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const left = useRef(AUTO_HIDE_MS);
  const started = useRef(0);
  const s = STYLE[toast.kind];

  useEffect(() => {
    if (toast.kind === "error" || paused) return;
    started.current = Date.now();
    const t = window.setTimeout(() => onClose(toast.id), left.current);
    return () => {
      window.clearTimeout(t);
      left.current -= Date.now() - started.current;
    };
  }, [paused, toast.id, toast.kind, onClose]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cx(
        "tone-screen relative flex w-[340px] items-start gap-2.5 bg-black/90 bevel-raised-2 py-2.5 pl-4 pr-2 text-shadow-game",
        "before:absolute before:bottom-[2px] before:left-[2px] before:top-[2px] before:w-1",
        s.stripe,
        className,
      )}
    >
      <Icon name={s.icon} size={20} className={cx("mt-0.5", s.text)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading text-md font-semibold text-tone-state">{toast.title}</span>
        {toast.description && <span className="font-body text-sm text-tone-text/85">{toast.description}</span>}
        {toast.action && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-1 self-start"
            onClick={() => {
              toast.action?.onClick();
              onClose(toast.id);
            }}
          >
            {toast.action.label}
          </Button>
        )}
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => onClose(toast.id)}
        className="p-1 text-tone-text/80 hover:text-tone-focus focus-visible:outline-game-out"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

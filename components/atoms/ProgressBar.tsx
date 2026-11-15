import { cx } from "../lib/cx";

export interface ProgressBarProps {
  /** 0-100; undefined = indeterminate. */
  value?: number;
  label: string;
  /** Show the label text above the bar (otherwise only for screen readers). */
  showLabel?: boolean;
  /** health: color follows the level (green -> yellow -> red) like the game health bar. */
  variant?: "default" | "health";
  className?: string;
}

function healthColor(v: number): string {
  if (v > 60) return "bg-success";
  if (v > 30) return "bg-warning";
  return "bg-danger";
}

/** Sunken track + fill; indeterminate shows moving stripes (static with reduced motion). */
export function ProgressBar({ value, label, showLabel = true, variant = "default", className }: ProgressBarProps) {
  const determinate = value !== undefined;
  const v = determinate ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex justify-between font-body text-sm text-tone-text">
          <span>{label}</span>
          {determinate && <span className="tabular">{Math.round(v)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuenow={determinate ? Math.round(v) : undefined}
        className="relative h-3.5 overflow-hidden bg-black/70 bevel-sunken-2"
      >
        {determinate ? (
          <div
            className={cx("absolute inset-y-[2px] left-[2px] shadow-[inset_0_1px_0_rgb(255_255_255/.35),inset_0_-1px_0_rgb(0_0_0/.35)]", variant === "health" ? healthColor(v) : "bg-tone-focus/80")}
            style={{ width: `calc((100% - 4px) * ${v / 100})` }}
          />
        ) : (
          <div className="absolute inset-[2px] animate-stripes bg-[length:24px_100%] bg-[linear-gradient(135deg,rgb(var(--t-focus-rgb)/.45)_25%,transparent_25%,transparent_50%,rgb(var(--t-focus-rgb)/.45)_50%,rgb(var(--t-focus-rgb)/.45)_75%,transparent_75%)] motion-reduce:animate-none" />
        )}
      </div>
    </div>
  );
}

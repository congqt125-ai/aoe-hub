import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon } from "../atoms/Icon";

export interface StatBlockProps {
  label: string;
  value: ReactNode;
  /** Change vs. previous period, e.g. +12 or -3; sign picks arrow and color. */
  delta?: number;
  /** Format of the delta, e.g. (d) => `${d}%`. */
  formatDelta?: (d: number) => string;
  icon?: ReactNode;
  className?: string;
}

/** Label + big tabular number + change (▲ success / ▼ danger) + optional stat / resource icon. */
export function StatBlock({ label, value, delta, formatDelta = (d) => String(Math.abs(d)), icon, className }: StatBlockProps) {
  return (
    <div className={cx("flex min-w-[120px] flex-col gap-0.5 bg-black/55 bevel-sunken-2 px-3 py-2 text-shadow-game", className)}>
      <span className="flex items-center gap-1.5 font-heading text-sm text-tone-text/70">
        {icon}
        {label}
      </span>
      <span className="font-body text-2xl font-bold leading-none tabular text-tone-state">{value}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={cx("flex items-center gap-0.5 font-body text-sm tabular", delta > 0 ? "text-success-on-dark" : "text-danger-on-dark")}>
          <Icon name={delta > 0 ? "arrow-up" : "arrow-down"} size={12} label={delta > 0 ? "Tăng" : "Giảm"} />
          {formatDelta(delta)}
        </span>
      )}
    </div>
  );
}

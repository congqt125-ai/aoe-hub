import { cx } from "../lib/cx";

export interface PingIndicatorProps {
  /** Round-trip in ms; null = disconnected. */
  ms: number | null;
  /** Show the number next to the bars. */
  showValue?: boolean;
  className?: string;
}

/** Bars and color by latency: <80 = 4, <150 = 3 (success), <250 = 2 (warning), else 1 (danger), lost = 0. */
export function pingLevel(ms: number | null): { bars: number; color: string; text: string } {
  if (ms === null) return { bars: 0, color: "bg-status-offline", text: "Mất kết nối" };
  if (ms < 80) return { bars: 4, color: "bg-success", text: `${ms} ms` };
  if (ms < 150) return { bars: 3, color: "bg-success", text: `${ms} ms` };
  if (ms < 250) return { bars: 2, color: "bg-warning", text: `${ms} ms` };
  return { bars: 1, color: "bg-danger", text: `${ms} ms` };
}

const HEIGHTS = ["h-1", "h-[7px]", "h-2.5", "h-3"];

export function PingIndicator({ ms, showValue = false, className }: PingIndicatorProps) {
  const { bars, color, text } = pingLevel(ms);
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)} title={text}>
      <span role="img" aria-label={`Ping: ${text}`} className="relative inline-flex h-3 items-end gap-0.5">
        {HEIGHTS.map((h, i) => (
          <i key={h} className={cx("w-[3px] shadow-[1px_1px_0_#000]", h, i < bars ? color : "bg-status-offline/40")} />
        ))}
        {ms === null && <span className="absolute -right-1 -top-1.5 font-body text-xs font-bold text-danger-on-dark">×</span>}
      </span>
      {showValue && <span className="font-body text-sm tabular text-tone-text">{text}</span>}
    </span>
  );
}

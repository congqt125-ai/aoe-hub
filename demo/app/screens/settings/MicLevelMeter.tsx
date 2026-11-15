import { cx } from "../../../../components";

export interface MicLevelMeterProps {
  /** Current input level in dB (-60..0). */
  levelDb: number;
  /** Threshold in dB (-60..0) from the sensitivity slider. */
  thresholdDb: number;
  disabled?: boolean;
  className?: string;
}

const MIN_DB = -60;
const MAX_DB = 0;

function toPercent(db: number): number {
  const clamped = Math.min(MAX_DB, Math.max(MIN_DB, db));
  return ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * 100;
}

/** Mic level meter with a threshold marker; turns green when input exceeds threshold. */
export function MicLevelMeter({ levelDb, thresholdDb, disabled, className }: MicLevelMeterProps) {
  const levelPct = toPercent(levelDb);
  const thresholdPct = toPercent(thresholdDb);
  const active = !disabled && levelDb >= thresholdDb;

  return (
    <div className={cx("flex flex-col gap-1", disabled && "opacity-50", className)}>
      <div
        role="meter"
        aria-label="Mức micro hiện tại"
        aria-valuemin={MIN_DB}
        aria-valuemax={MAX_DB}
        aria-valuenow={Math.round(levelDb)}
        className="relative h-3 w-full overflow-hidden bg-black/70 bevel-sunken-1"
      >
        <div
          className={cx(
            "h-full transition-[width,background-color] duration-fast ease-step",
            active ? "bg-success" : "bg-tone-focus/45",
          )}
          style={{ width: `${levelPct}%` }}
        />
        <span
          aria-hidden
          title={`Ngưỡng: ${thresholdDb} dB`}
          className="absolute bottom-0 top-0 w-0.5 bg-tone-state shadow-[1px_0_0_rgb(0_0_0)]"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
      <div className="flex justify-between font-body text-xs text-tone-text/60">
        <span>−60 dB</span>
        <span>{active ? "Đang thu âm" : "Im lặng"}</span>
        <span>0 dB</span>
      </div>
    </div>
  );
}

import { assetUrl } from "../lib/assets";
import { cx } from "../lib/cx";

export interface SpinnerProps {
  size?: 16 | 24 | 32;
  /** Accessible text; omit when the parent already announces the busy state. */
  label?: string;
  className?: string;
}

/** Game hourglass (cursor/busy.png) flipping 180deg every 600ms; still with prefers-reduced-motion. */
export function Spinner({ size = 16, label, className }: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("inline-block shrink-0 bg-contain bg-center bg-no-repeat animate-flip motion-reduce:animate-none", className)}
      style={{ width: Math.round((size * 27) / 40), height: size, backgroundImage: `url("${assetUrl("cursor/busy.png")}")` }}
    />
  );
}

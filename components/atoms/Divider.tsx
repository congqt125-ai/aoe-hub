import { cx } from "../lib/cx";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** Optional centered label (horizontal only). */
  label?: string;
  className?: string;
}

/** Etched (engraved) line, 2px. */
export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return <span role="separator" aria-orientation="vertical" className={cx("inline-block w-[2px] self-stretch bevel-etched", className)} />;
  }
  if (!label) return <hr className={cx("m-0 h-[2px] border-0 bevel-etched", className)} />;
  return (
    <div role="separator" className={cx("flex items-center gap-3", className)}>
      <span className="h-[2px] flex-1 bevel-etched" />
      <span className="font-heading text-sm text-tone-text/80">{label}</span>
      <span className="h-[2px] flex-1 bevel-etched" />
    </div>
  );
}

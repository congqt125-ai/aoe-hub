import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Grows with content between these line counts. */
  minRows?: number;
  maxRows?: number;
  wrapperClassName?: string;
}

const LINE_PX = 20;
// Focus: well gets darker + 1px light inner line (no dashed yellow ring, per user); error keeps the red line.
const FOCUS = "focus-within:bg-black/85";
const FOCUS_LINE = "focus-within:after:border focus-within:after:border-white/35";

/** Like Input; grows 2-8 lines by default and counts characters when maxLength is set (chat: 500). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, minRows = 2, maxRows = 8, maxLength, className, wrapperClassName, disabled, ...rest },
  ref,
) {
  const length = typeof rest.value === "string" ? rest.value.length : undefined;
  return (
    <div
      className={cx(
        "relative flex flex-col bg-black/70 bevel-sunken",
        "after:pointer-events-none after:absolute after:inset-[3px]",
        FOCUS,
        invalid ? "after:border after:border-danger" : FOCUS_LINE,
        disabled && "opacity-50",
        wrapperClassName,
      )}
    >
      <textarea
        ref={ref}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cx(
          "resize-none bg-transparent px-2.5 py-1.5 font-body text-md leading-5 text-tone-state outline-none text-shadow-none",
          "[field-sizing:content] placeholder:text-tone-text/50",
          className,
        )}
        style={{ minHeight: minRows * LINE_PX + 12, maxHeight: maxRows * LINE_PX + 12 }}
        {...rest}
      />
      {maxLength !== undefined && length !== undefined && (
        <span aria-hidden className={cx("self-end px-2 pb-1 font-body text-xs tabular", length >= maxLength ? "text-warning-on-dark" : "text-tone-text/60")}>
          {length}/{maxLength}
        </span>
      )}
    </div>
  );
});

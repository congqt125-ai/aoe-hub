import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon } from "./Icon";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  type?: "text" | "password" | "search" | "number" | "email";
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Search: called by the clear button and Esc. */
  onClear?: () => void;
  /** Extra element on the right inside the field (e.g. a Spinner while searching). */
  trailing?: ReactNode;
  wrapperClassName?: string;
}

const HEIGHT = { sm: "h-6 text-sm", md: "h-8 text-md", lg: "h-10 text-lg" } as const;
// Focus: well gets darker + 1px light inner line (no dashed yellow ring, per user); error keeps the red line.
const FOCUS = "focus-within:bg-black/85";
const FOCUS_LINE = "focus-within:after:border focus-within:after:border-white/35";

/** Text field: sunken bevel on a dark well; password has show / hide, search has an icon and a clear button. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = "text", size = "md", invalid, onClear, trailing, className, wrapperClassName, disabled, readOnly, onKeyDown, ...rest },
  ref,
) {
  const [reveal, setReveal] = useState(false);
  const isSearch = type === "search";
  const hasValue = rest.value !== undefined ? String(rest.value).length > 0 : false;
  return (
    <div
      className={cx(
        "relative flex items-center bg-black/70 bevel-sunken text-tone-state",
        "after:pointer-events-none after:absolute after:inset-[3px]",
        FOCUS,
        invalid ? "after:border after:border-danger" : FOCUS_LINE,
        disabled && "opacity-50",
        HEIGHT[size],
        wrapperClassName,
      )}
    >
      {isSearch && <Icon name="search" size={16} className="ml-2.5 text-tone-text/70" />}
      <input
        ref={ref}
        type={type === "password" && reveal ? "text" : type === "search" ? "text" : type}
        role={isSearch ? "searchbox" : undefined}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onKeyDown={(e) => {
          if (isSearch && e.key === "Escape" && onClear) onClear();
          onKeyDown?.(e);
        }}
        className={cx(
          "h-full min-w-0 flex-1 bg-transparent px-2.5 font-body text-[inherit] text-tone-state outline-none text-shadow-none",
          "placeholder:text-tone-text/50 disabled:cursor-not-allowed tabular-nums",
          className,
        )}
        {...rest}
      />
      {trailing}
      {isSearch && hasValue && onClear && !disabled && (
        <button type="button" aria-label="Xoá nội dung tìm" onClick={onClear} className="mr-1.5 inline-flex p-1 text-tone-text/80 hover:text-tone-focus focus-visible:outline-game-out">
          <Icon name="close" size={12} />
        </button>
      )}
      {type === "password" && (
        <button
          type="button"
          aria-pressed={reveal}
          aria-label={reveal ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onClick={() => setReveal((r) => !r)}
          disabled={disabled}
          className="mr-1 inline-flex h-[calc(100%-8px)] items-center px-2 font-body text-sm text-tone-text hover:text-tone-focus focus-visible:outline-game-out"
        >
          {reveal ? "Ẩn" : "Hiện"}
        </button>
      )}
    </div>
  );
});

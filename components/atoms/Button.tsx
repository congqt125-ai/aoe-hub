import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE: Record<ButtonSize, string> = {
  sm: "h-6 px-2.5 text-sm gap-1.5",
  md: "h-8 px-4 text-md gap-2",
  lg: "h-10 px-5 text-lg gap-2",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "surface-dialog",
  secondary: "bg-black/55",
  danger: "bg-black/55 !text-danger-on-dark enabled:hover:!text-tone-focus disabled:!text-danger-on-dark/50",
  ghost: "bg-transparent enabled:hover:bevel-flat enabled:active:bevel-sunken-1",
};

// Frame by size: sm / md use the 2px bevel (the 3px one, with its panel-sized drop shadow in kiểu B, looked
// heavier than the text fields next to them — user 12/11); lg keeps 3px.
const BEVEL: Record<ButtonSize, string> = {
  sm: "bevel-raised-2 enabled:active:bevel-sunken-2",
  md: "bevel-raised-2 enabled:active:bevel-sunken-2",
  lg: "bevel-raised enabled:active:bevel-sunken",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Busy: hourglass replaces the label (width kept), clicks are blocked. */
  loading?: boolean;
  icon?: ReactNode;
}

/**
 * Hub button: Surface + raised Bevel; pressed flips to sunken and shifts the content 1px (like the game).
 * At most one `primary` per area.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, icon, type = "button", className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "group relative inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none",
        "font-heading font-semibold text-tone-text text-shadow-game",
        "enabled:hover:text-tone-focus transition-colors duration-fast ease-step",
        "focus-visible:outline-none focus-visible:outline-game",
        "disabled:text-tone-text/50 disabled:text-shadow-none",
        loading && "cursor-game-busy",
        SIZE[size],
        VARIANT[variant],
        variant !== "ghost" && BEVEL[size],
        className,
      )}
      {...rest}
    >
      <span className={cx("inline-flex items-center gap-[inherit] group-enabled:group-active:translate-x-px group-enabled:group-active:translate-y-px", loading && "invisible")}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size === "lg" ? 24 : 16} />
        </span>
      )}
    </button>
  );
});

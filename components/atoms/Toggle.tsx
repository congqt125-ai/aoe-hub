import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
}

/** Switch: sunken track, raised textured knob. Takes effect immediately (no Save button). */
export function Toggle({ checked, onChange, label, disabled, className, ...rest }: ToggleProps) {
  return (
    <label className={cx("inline-flex items-center gap-2.5 font-body text-md text-tone-text", disabled && "opacity-50", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative h-6 w-11 shrink-0 bevel-sunken-2 transition-colors duration-fast ease-step focus-visible:outline-game-out",
          checked ? "bg-success/60" : "bg-black/60",
        )}
        {...rest}
      >
        <span
          aria-hidden
          className={cx(
            "absolute top-[3px] h-[18px] w-[18px] surface-dialog bevel-raised-2 transition-[left] duration-fast ease-step",
            checked ? "left-[23px]" : "left-[3px]",
          )}
        />
      </button>
      {label}
    </label>
  );
}

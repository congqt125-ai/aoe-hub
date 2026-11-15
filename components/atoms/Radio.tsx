import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> {
  label: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  className?: string;
}

/**
 * Radio on the game `blank` control sprite + a dot in `text` color.
 * Native radios in one group: arrow keys move the choice.
 */
export function RadioGroup<T extends string>({ label, options, value, onChange, orientation = "vertical", disabled, className }: RadioGroupProps<T>) {
  const name = useId();
  return (
    <fieldset role="radiogroup" disabled={disabled} className={cx("m-0 border-0 p-0", disabled && "opacity-50", className)}>
      <legend className="mb-1.5 p-0 font-heading text-sm font-semibold text-tone-text">{label}</legend>
      <div className={cx("flex gap-x-4 gap-y-1.5", orientation === "vertical" ? "flex-col" : "flex-wrap")}>
        {options.map((o) => (
          <label key={o.value} className={cx("group inline-flex items-center gap-2 font-body text-md text-tone-text", o.disabled && "pointer-events-none opacity-50")}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cx(
                "relative h-[22px] w-[22px] shrink-0 rounded-full bg-[length:100%_100%]",
                "bg-[image:var(--t-ctl-blank-normal)] group-active:bg-[image:var(--t-ctl-blank-pressed)]",
                "peer-focus-visible:outline-game-out",
                "after:absolute after:inset-[7px] after:rounded-full after:bg-tone-state after:shadow-[1px_1px_0_#000] after:opacity-0 peer-checked:after:opacity-100",
              )}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

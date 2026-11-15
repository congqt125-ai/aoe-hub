import { useId, type InputHTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Text of the value label, e.g. (v) => `${v}%`. */
  format?: (value: number) => string;
}

// The thumb is a pseudo element: arbitrary variants carry the raised bevel onto it.
const THUMB =
  "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:bg-tone-bevel-2 [&::-webkit-slider-thumb]:bevel-raised-2 " +
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 " +
  "[&::-moz-range-thumb]:bg-tone-bevel-2 [&::-moz-range-thumb]:bevel-raised-2";

/** Range: sunken track, raised knob. Arrows +-step, PageUp / PageDown +-10 steps. */
export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, format = String, className, disabled, ...rest }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cx("flex flex-col gap-1", disabled && "opacity-50", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-heading text-sm font-semibold text-tone-text">
          {label}
        </label>
        <output htmlFor={id} className="font-body text-sm tabular text-tone-state">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key !== "PageUp" && e.key !== "PageDown") return;
          e.preventDefault();
          const next = value + (e.key === "PageUp" ? 10 : -10) * step;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className={cx("h-2.5 w-full appearance-none bevel-sunken-2 outline-none focus-visible:outline-game-out", THUMB)}
        style={{ background: `linear-gradient(to right, rgb(var(--t-focus-rgb) / .55) ${pct}%, rgb(0 0 0 / .6) ${pct}%)` }}
        {...rest}
      />
    </div>
  );
}

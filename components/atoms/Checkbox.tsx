import { forwardRef, useEffect, useImperativeHandle, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { CONTROL_SETS, type ControlSet } from "../lib/assets";
import { cx } from "../lib/cx";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  indeterminate?: boolean;
  /** Box size in px, frame included (game art is 39px); 32 = a md field / dropdown. */
  size?: 20 | 22 | 26 | 32 | 39;
  /** Where the label sits; "left" puts the box after the text. */
  labelPosition?: "left" | "right";
  /**
   * sprite: the theme's game art (4 frames). drawn: the shared control sprites (CONTROL_SETS, like the
   * dropdown button), zoomed so the check mark is big enough to read, in the field frame — for the hub screen
   * themes, whose own sprite (scr2) is a flat orange square with a tiny mark (user 12/11).
   */
  variant?: "sprite" | "drawn";
  /** Sprite set of the drawn variant (default scr2, warm amber). */
  controlSet?: ControlSet;
}

/**
 * Game checkbox. The whole label is clickable; label on the right by default (`labelPosition="left"` puts it
 * first).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, size = 26, labelPosition = "right", variant = "sprite", controlSet = "scr2", className, disabled, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const drawn = variant === "drawn";
  return (
    <label className={cx("group inline-flex items-center gap-2 font-body text-md text-tone-text", disabled && "pointer-events-none opacity-50", className)}>
      {labelPosition === "left" && label}
      <input ref={inner} type="checkbox" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          ...(drawn
            ? {
                ["--cb-off" as string]: `url("${CONTROL_SETS[controlSet].checkboxOff}")`,
                ["--cb-on" as string]: `url("${CONTROL_SETS[controlSet].checkboxOn}")`,
                ["--cb-on-pressed" as string]: `url("${CONTROL_SETS[controlSet].checkboxOnPressed}")`,
                backgroundSize: CONTROL_SETS[controlSet].zoom.checkbox,
              }
            : null),
        }}
        className={cx(
          "relative shrink-0",
          drawn
            ? cx(
                // The field's own 3px frame (like a dropdown, whose button sits inside the field frame); the
                // sprite face fills the content box inside it, so zoom % is relative to the face (user 12/11).
                "p-[3px] bg-center bg-no-repeat [background-origin:content-box] [background-clip:content-box] bevel-sunken group-hover:brightness-110",
                "bg-[image:var(--cb-off)] peer-checked:bg-[image:var(--cb-on)] group-active:peer-checked:bg-[image:var(--cb-on-pressed)]",
              )
            : indeterminate
              ? "bg-[length:100%_100%] bg-[image:var(--t-ctl-blank-normal)] group-active:bg-[image:var(--t-ctl-blank-pressed)]"
              : cx(
                  "bg-[length:100%_100%]",
                  "bg-[image:var(--t-ctl-checkbox-off-normal)] group-active:bg-[image:var(--t-ctl-checkbox-off-pressed)]",
                  "peer-checked:bg-[image:var(--t-ctl-checkbox-on-normal)] group-active:peer-checked:bg-[image:var(--t-ctl-checkbox-on-pressed)]",
                ),
          "peer-focus-visible:outline-game-out",
        )}
      >
        {indeterminate && <span className="absolute left-1/4 right-1/4 top-1/2 h-0.5 -translate-y-1/2 bg-tone-state shadow-[1px_1px_0_#000]" />}
      </span>
      {labelPosition === "right" && label}
    </label>
  );
});

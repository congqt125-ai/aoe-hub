import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { sheet } from "../lib/assets";
import { cx } from "../lib/cx";
import type { Faction } from "../lib/theme";
import { Tooltip } from "./Tooltip";

export type ControlSprite = "close" | "arrow-up" | "arrow-down" | "arrow-down-alt" | "blank" | "blank-alt";

// Literal class names so Tailwind sees them: normal frame, pressed frame on :active.
const CONTROL: Record<ControlSprite, string> = {
  close: "bg-[image:var(--t-ctl-close-normal)] enabled:active:bg-[image:var(--t-ctl-close-pressed)]",
  "arrow-up": "bg-[image:var(--t-ctl-arrow-up-normal)] enabled:active:bg-[image:var(--t-ctl-arrow-up-pressed)]",
  "arrow-down": "bg-[image:var(--t-ctl-arrow-down-normal)] enabled:active:bg-[image:var(--t-ctl-arrow-down-pressed)]",
  "arrow-down-alt": "bg-[image:var(--t-ctl-arrow-down-alt-normal)] enabled:active:bg-[image:var(--t-ctl-arrow-down-alt-pressed)]",
  blank: "bg-[image:var(--t-ctl-blank-normal)] enabled:active:bg-[image:var(--t-ctl-blank-pressed)]",
  "blank-alt": "bg-[image:var(--t-ctl-blank-alt-normal)] enabled:active:bg-[image:var(--t-ctl-blank-alt-pressed)]",
};

const SIZE = { 24: "h-6 w-6", 32: "h-8 w-8", 40: "h-10 w-10" } as const;

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  /** Required: icon-only buttons are announced by this label and show it as a tooltip. */
  label: string;
  size?: 24 | 32 | 40;
  /** Tooltip placement; `false` hides the tooltip (e.g. when a visible label sits next to the button). */
  tooltip?: "top" | "bottom" | false;
};

export type IconButtonProps = Base &
  (
    | { variant: "control"; sprite: ControlSprite; children?: never }
    | { variant: "hud"; faction: Faction; selected?: boolean; children: ReactNode }
    | { variant?: "plain"; children: ReactNode }
  );

/** Square icon button: game control sprite, faction HUD button, or plain bevel. Always labelled. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  const { label, size = 32, tooltip = "top", className, type = "button", ...rest } = props;
  let skin = "";
  let style: CSSProperties | undefined;
  let content: ReactNode = null;
  const domProps: Record<string, unknown> = { ...rest };
  delete domProps.variant;
  delete domProps.sprite;
  delete domProps.faction;
  delete domProps.selected;
  delete domProps.children;

  if (props.variant === "control") {
    skin = cx("bg-[length:100%_100%] pixelated", CONTROL[props.sprite]);
  } else if (props.variant === "hud") {
    // HUD button background: 2 frames (normal, pressed) of hud/<style>-button-bg-sheet.png.
    const { url, data } = sheet(`hud/${props.faction}-button-bg`);
    const [normal, pressed] = data.frames;
    const f = props.selected ? pressed : normal;
    const scale = size / f.height;
    style = {
      backgroundImage: `url("${url}")`,
      backgroundSize: `${data.sheet_width * scale}px ${data.sheet_height * scale}px`,
      backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
      ["--pressed-x" as string]: `-${pressed.x * scale}px`,
    };
    // Selected: pressed frame (barely differs in the art) + a focus-color ring so the state is visible.
    skin = cx(
      "bg-no-repeat enabled:active:[background-position-x:var(--pressed-x)]",
      props.selected ? "text-tone-state outline outline-2 outline-offset-1 outline-tone-focus" : "",
    );
    content = props.children;
  } else {
    skin = "bg-black/55 bevel-raised-2 enabled:active:bevel-sunken-2";
    content = props.children;
  }

  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={props.variant === "hud" ? props.selected ?? false : undefined}
      className={cx(
        "group relative inline-flex shrink-0 items-center justify-center text-tone-text",
        "enabled:hover:text-tone-focus focus-visible:outline-none focus-visible:outline-game-out",
        "disabled:opacity-50",
        SIZE[size],
        skin,
        className,
      )}
      style={style}
      {...domProps}
    >
      {content && <span className="inline-flex group-enabled:group-active:translate-x-px group-enabled:group-active:translate-y-px">{content}</span>}
    </button>
  );
  return tooltip ? <Tooltip content={label} placement={tooltip}>{button}</Tooltip> : button;
});

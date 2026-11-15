import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "../lib/cx";

export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** Row height: sm 28 (menus), md 40, lg 52. */
  size?: "sm" | "md" | "lg";
}

const HEIGHT = { sm: "min-h-7 py-0.5", md: "min-h-10 py-1", lg: "min-h-[52px] py-1.5" } as const;

/**
 * Game list row: hover = `focus` text, selected = light band (bevel[0] 25%) + `state` text.
 * Give it role="option" / "row" / "menuitem" from the parent list; keyboard moves are handled by the list.
 */
export const ListRow = forwardRef<HTMLDivElement, ListRowProps>(function ListRow(
  { leading, trailing, selected, disabled, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-selected={rest.role === "option" ? Boolean(selected) : undefined}
      aria-disabled={disabled || undefined}
      className={cx(
        "group relative flex items-center gap-2.5 px-2.5 font-body text-md text-shadow-game outline-none",
        "focus-visible:outline-game-out focus-visible:-outline-offset-2",
        HEIGHT[size],
        disabled
          ? "text-tone-text/40"
          : selected
            ? "bg-tone-bevel-0/40 bevel-raised-1 text-tone-state before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-tone-focus"
            : "text-tone-text hover:bg-white/5 hover:text-tone-focus",
        className,
      )}
      {...rest}
    >
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col">{children}</span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </div>
  );
});

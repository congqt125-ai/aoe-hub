import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";

/** Keyboard key, e.g. <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>. */
export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cx(
        "inline-block min-w-[18px] px-1.5 bg-black/60 bevel-raised-1 font-body text-xs leading-[18px] text-center text-tone-text text-shadow-none",
        className,
      )}
      {...rest}
    />
  );
}

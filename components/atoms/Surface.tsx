import type { CSSProperties, ElementType, FormEventHandler, HTMLAttributes, Ref } from "react";
import { cx } from "../lib/cx";
import { TEXTURES, type DialogTheme, type Texture } from "../lib/theme";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Tiled game texture; `none` = flat average color of the active tone. Unset = current dialog theme. */
  texture?: Texture | "none";
  /** Explicit dialog theme (overrides `texture`); also switches bevel colors and control sprites. */
  dialogTheme?: DialogTheme;
  /** Dark overlay 0-100; defaults to the theme's shade_amount. */
  shade?: number;
  ref?: Ref<HTMLElement>;
  /** Passed through when rendered as a <form>. */
  noValidate?: boolean;
  onSubmit?: FormEventHandler<HTMLElement>;
}

/** `Surface`: face of panels, dialogs and cards. Text on it always carries the game text shadow. */
export function Surface({ as: Tag = "div", texture, dialogTheme, shade, className, style, ...rest }: SurfaceProps) {
  const theme = dialogTheme ?? (texture && texture !== "none" ? TEXTURES[texture] : undefined);
  const vars = shade === undefined ? undefined : ({ "--dlg-shade": shade / 100 } as CSSProperties);
  return (
    <Tag
      data-dialog-theme={theme}
      className={cx(
        "tone-dialog text-tone-text text-shadow-game",
        texture === "none" ? "bg-tone-surface" : "surface-dialog",
        className,
      )}
      style={{ ...vars, ...style }}
      {...rest}
    />
  );
}

import type { ElementType, HTMLAttributes } from "react";
import { cx } from "../lib/cx";

export type PlayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TextTone =
  | "default" | "muted" | "focus" | "state"
  | "success" | "warning" | "danger" | "info"
  | `player-${PlayerNumber}`;

// Colored text uses the on-dark shades (contrast >= 4.5 on dark wells), see ux-guidelines §4.
export const TEXT_TONE: Record<TextTone, string> = {
  default: "text-tone-text",
  muted: "text-tone-text/70",
  focus: "text-tone-focus",
  state: "text-tone-state",
  success: "text-success-on-dark",
  warning: "text-warning-on-dark",
  danger: "text-danger-on-dark",
  info: "text-info-on-dark",
  "player-1": "text-player-1-on-dark",
  "player-2": "text-player-2-on-dark",
  "player-3": "text-player-3-on-dark",
  "player-4": "text-player-4-on-dark",
  "player-5": "text-player-5-on-dark",
  "player-6": "text-player-6-on-dark",
  "player-7": "text-player-7-on-dark",
  "player-8": "text-player-8-on-dark",
};

export type TextVariant = "body" | "caption" | "micro" | "numeric";

const VARIANT: Record<TextVariant, string> = {
  body: "font-body text-md",
  caption: "font-body text-sm",
  micro: "font-body text-xs",
  numeric: "font-body text-md tabular",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  /** Cut overflow with an ellipsis; pass `title` to show the full text. */
  truncate?: boolean;
}

export function Text({ as: Tag = "span", variant = "body", tone = "default", truncate, className, ...rest }: TextProps) {
  return <Tag className={cx(VARIANT[variant], TEXT_TONE[tone], truncate && "truncate", className)} {...rest} />;
}

const HEADING = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl", 4: "text-lg" } as const;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  /** Visual size when it differs from the document level. */
  size?: 1 | 2 | 3 | 4;
  tone?: TextTone;
}

/** Spectral SC is already small caps: never upper-case the text by hand. */
export function Heading({ level = 2, size, tone = "default", className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cx("m-0 font-heading font-semibold leading-tight", HEADING[size ?? level], TEXT_TONE[tone], className)} {...rest} />;
}

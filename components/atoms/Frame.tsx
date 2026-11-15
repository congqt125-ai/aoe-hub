import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { factions } from "../../tokens/design-tokens.json";
import { cx } from "../lib/cx";
import type { Faction } from "../lib/theme";

export type BevelVariant = "raised" | "sunken" | "etched" | "flat" | "none";
export type BevelWidth = 1 | 2 | 3;
export type Tone = "screen" | "dialog" | `faction:${Faction}`;

const BEVEL: Record<"raised" | "sunken", Record<BevelWidth, string>> = {
  raised: { 1: "bevel-raised-1", 2: "bevel-raised-2", 3: "bevel-raised" },
  sunken: { 1: "bevel-sunken-1", 2: "bevel-sunken-2", 3: "bevel-sunken" },
};

/** Tailwind class of a bevel (the engine-drawn border of every object). */
export function bevelClass(variant: BevelVariant, width: BevelWidth = 3): string {
  if (variant === "raised" || variant === "sunken") return BEVEL[variant][width];
  return `bevel-${variant}`;
}

/** Class + style that make bevel / tone-* colors read from a theme family or a faction. */
export function toneProps(tone?: Tone): { className?: string; style?: CSSProperties } {
  if (!tone) return {};
  if (tone === "screen") return { className: "tone-screen" };
  if (tone === "dialog") return { className: "tone-dialog" };
  const f = factions[tone.slice("faction:".length) as Faction];
  // Faction HUDs only give 3 shades: light / surface / dark.
  const b = [f.surfaceLight, f.surfaceLight, f.surface, f.surface, f.surfaceDark, f.surfaceDark];
  return { style: Object.fromEntries(b.map((c, i) => [`--b${i}`, c])) as CSSProperties };
}

export interface FrameProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: BevelVariant;
  width?: BevelWidth;
  tone?: Tone;
}

/** `Bevel` / `Frame`: box with the game's 6-color bevel border (box-shadow inset, square corners). */
export function Frame({ as: Tag = "div", variant = "raised", width = 3, tone, className, style, ...rest }: FrameProps) {
  const t = toneProps(tone);
  return <Tag className={cx(bevelClass(variant, width), t.className, className)} style={{ ...t.style, ...style }} {...rest} />;
}

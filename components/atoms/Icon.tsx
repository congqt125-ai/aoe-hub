import type { CSSProperties } from "react";
import { assetUrl, sheet } from "../lib/assets";
import { cx } from "../lib/cx";
import type { Faction } from "../lib/theme";

// System icons (self-designed): 24x24 grid, 1.5px stroke, currentColor so they follow text color / hover.
const PATHS = {
  home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  chat: "M4 5h16v11H9l-5 4V5Z",
  send: "M4 12 20 4l-4 16-4-7-8-1ZM12 13l8-9",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5 10 17 19 7",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-up": "M6 15l6-6 6 6",
  "chevron-left": "M15 6l-6 6 6 6",
  "chevron-right": "M9 6l6 6-6 6",
  filter: "M4 5h16l-6 7.5V19l-4 1v-7.5L4 5Z",
  lock: "M6 11h12v9H6v-9ZM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z",
  sword: "M14.5 3.5H20.5V9.5L9 21 3 15 14.5 3.5ZM6 12l6 6M3 21l3-3",
  swords: "M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5L21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2",
  pen: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5ZM14.5 5.5l4 4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "eye-off": "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
  warning: "M12 3 22 20H2L12 3ZM12 10v4M12 17v.5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6M12 7.5V8",
  error: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 9l6 6M15 9l-6 6",
  success: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.5l3 3 5-6",
  trophy: "M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6",
  logout: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  refresh: "M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  play: "M7 4l13 8-13 8V4Z",
  pause: "M7 5h3v14H7zM14 5h3v14h-3z",
  map: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  star: "M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z",
  volume: "M4 9h4l5-4v14l-5-4H4V9ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z",
  "user-plus": "M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21a7 7 0 0 1 12.5-4.3M19 14v6M16 17h6",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  "arrow-up": "M12 19V5M6 11l6-6 6 6",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8",
  ai: "M6 7h12v12H6V7ZM12 3v4M9 12h.01M15 12h.01M9.5 16h5M3 12h3M18 12h3",
} as const;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps {
  name: IconName;
  size?: 12 | 16 | 20 | 24 | 32;
  /** Meaningful icons need a label; decorative ones are hidden from screen readers. */
  label?: string;
  className?: string;
}

/** System icon (settings, bell, search...). */
export function Icon({ name, size = 16, label, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={size <= 16 ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("inline-block shrink-0 [filter:drop-shadow(1px_1px_0_rgb(0_0_0/.8))]", className)}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export type GameIconSet = "unit" | "tech" | "stat" | "resource-sheet" | "digit" | `building:${Faction}`;

const SHEET: Record<string, string> = {
  unit: "icon/units",
  tech: "icon/techs",
  stat: "icon/stats-small",
  "resource-sheet": "icon/resources",
  digit: "icon/digits",
};

export interface GameIconProps {
  set: GameIconSet;
  frame: number;
  /** Rendered size in px; game icons are 50px, only scaled down (never above 100%). */
  size?: 16 | 20 | 24 | 32 | 50;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** One frame of a game sprite sheet (units, techs, buildings per faction, stats). */
export function GameIcon({ set, frame, size = 32, label, className, style }: GameIconProps) {
  const name = set.startsWith("building:") ? `icon/${set.slice(9)}-buildings` : SHEET[set];
  const { url, data } = sheet(name);
  const f = data.frames[frame] ?? data.frames[0];
  const scale = Math.min(1, size / Math.max(f.width, f.height));
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("inline-block shrink-0 bg-no-repeat", className)}
      style={{
        width: Math.round(f.width * scale),
        height: Math.round(f.height * scale),
        backgroundImage: `url("${url}")`,
        backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
        backgroundSize: `${data.sheet_width * scale}px ${data.sheet_height * scale}px`,
        ...style,
      }}
    />
  );
}

export type Resource = "wood" | "food" | "gold" | "stone";
export const RESOURCE_LABELS: Record<Resource, string> = { wood: "Gỗ", food: "Thức ăn", gold: "Vàng", stone: "Đá" };

/** Resource icon (icon/res-*.png, 34x30 game art). */
export function ResourceIcon({ kind, size = 20, label, className }: { kind: Resource; size?: 16 | 20 | 24 | 30; label?: string; className?: string }) {
  return (
    <img
      src={assetUrl(`icon/res-${kind}.png`)}
      alt={label ?? ""}
      height={size}
      width={Math.round((size * 34) / 30)}
      className={cx("inline-block shrink-0", className)}
      draggable={false}
    />
  );
}

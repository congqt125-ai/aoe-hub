import { cx } from "../lib/cx";
import type { Faction } from "../lib/theme";
import { GameIcon } from "./Icon";
import { StatusDot, type PresenceStatus } from "./StatusDot";
import type { PlayerNumber } from "./Text";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/** 2xl 112: room seat cards (avatar nearly as tall as the card). */
const PX: Record<AvatarSize, number> = { xs: 20, sm: 24, md: 32, lg: 48, xl: 80, "2xl": 112 };
const DOT: Record<AvatarSize, 10 | 12 | 16> = { xs: 10, sm: 10, md: 10, lg: 12, xl: 16, "2xl": 16 };

const PLAYER_RING: Record<PlayerNumber, string> = {
  1: "after:border-player-1", 2: "after:border-player-2", 3: "after:border-player-3", 4: "after:border-player-4",
  5: "after:border-player-5", 6: "after:border-player-6", 7: "after:border-player-7", 8: "after:border-player-8",
};

export type AvatarSource =
  | { kind: "image"; src: string }
  | { kind: "initials" }
  | { kind: "unit"; frame: number }
  | { kind: "civ"; faction: Faction; frame?: number };

export interface AvatarProps {
  name: string;
  source?: AvatarSource;
  size?: AvatarSize;
  /** Inner 1px ring in the player's color. */
  player?: PlayerNumber;
  /** Status dot bottom-right (shown from md up). */
  status?: PresenceStatus;
  className?: string;
}

function initials(name: string): string {
  // Letters / digits only, so "Máy (Khó)" -> "MK" and "lan_hylap" -> "LH".
  const parts = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}

export function Avatar({ name, source = { kind: "initials" }, size = "md", player, status, className }: AvatarProps) {
  const px = PX[size];
  const inner = px - 4;
  let face;
  if (source.kind === "image") face = <img src={source.src} alt="" className="h-full w-full object-cover" draggable={false} />;
  else if (source.kind === "unit") face = <GameIcon set="unit" frame={source.frame} size={Math.min(50, inner) as 16} />;
  else if (source.kind === "civ") face = <GameIcon set={`building:${source.faction}`} frame={source.frame ?? 0} size={Math.min(50, inner) as 16} />;
  else
    face = (
      <span className="font-heading font-semibold text-tone-state" style={{ fontSize: Math.max(10, Math.round(px * 0.42)) }}>
        {initials(name)}
      </span>
    );

  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible bg-black/60 bevel-raised-2",
        "after:pointer-events-none after:absolute after:inset-[2px]",
        player && cx("after:border", PLAYER_RING[player]),
        className,
      )}
      style={{ width: px, height: px }}
    >
      <span aria-hidden className="flex h-[calc(100%-4px)] w-[calc(100%-4px)] items-center justify-center overflow-hidden">
        {face}
      </span>
      {status && px >= 32 && <StatusDot status={status} size={DOT[size]} className="absolute -bottom-0.5 -right-0.5" />}
    </span>
  );
}

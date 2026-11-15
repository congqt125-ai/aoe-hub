import { GameIcon, cx, type PlayerNumber } from "../../../../components";
import type { ClanEmblem } from "../../clanMock";

const COLOR_BORDER: Record<PlayerNumber, string> = {
  1: "border-player-1",
  2: "border-player-2",
  3: "border-player-3",
  4: "border-player-4",
  5: "border-player-5",
  6: "border-player-6",
  7: "border-player-7",
  8: "border-player-8",
};

const COLOR_BAR: Record<PlayerNumber, string> = {
  1: "bg-player-1",
  2: "bg-player-2",
  3: "bg-player-3",
  4: "bg-player-4",
  5: "bg-player-5",
  6: "bg-player-6",
  7: "bg-player-7",
  8: "bg-player-8",
};

/** Clan emblem badge: building icon from faction sheet + player-token color border & flag bar. */
export function ClanEmblemBadge({
  emblem,
  size = "md",
  className,
}: {
  emblem: ClanEmblem;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "lg" ? "h-20 w-20" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  const iconSize: 20 | 24 | 50 = size === "lg" ? 50 : size === "md" ? 24 : 20;

  return (
    <div
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden border-2 bg-black/70 bevel-sunken-1",
        COLOR_BORDER[emblem.color],
        box,
        className,
      )}
    >
      <GameIcon set={`building:${emblem.faction}`} frame={emblem.frame} size={iconSize} />
      <span aria-hidden className={cx("absolute inset-x-0 bottom-0 h-1", COLOR_BAR[emblem.color])} />
    </div>
  );
}


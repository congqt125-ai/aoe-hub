import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";
import type { PlayerNumber } from "./Text";

export type RoomStatus = "waiting" | "playing" | "full" | "locked";

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  waiting: "Đang chờ",
  playing: "Đang chơi",
  full: "Đầy",
  locked: "Khoá",
};

const STATUS: Record<RoomStatus, string> = {
  waiting: "bg-success text-success-on",
  playing: "bg-warning text-warning-on",
  full: "bg-status-offline text-black",
  locked: "bg-black/70 text-tone-text bevel-flat",
};

const TEAM: Record<PlayerNumber, string> = {
  1: "bg-player-1", 2: "bg-player-2", 3: "bg-player-3", 4: "bg-player-4",
  5: "bg-player-5", 6: "bg-player-6", 7: "bg-player-7", 8: "bg-player-8",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  (
    | { variant: "count"; count: number; max?: number; label?: string }
    | { variant: "status"; status: RoomStatus }
    | { variant: "rank"; children: string }
    | { variant: "team"; player: PlayerNumber; children: string }
  );

const BASE = "inline-flex h-[18px] shrink-0 items-center px-1.5 font-heading text-xs font-semibold leading-none text-shadow-none";

/** Count (notifications), room status, rank or team tag. Meaning is always in text, never color alone. */
export function Badge(props: BadgeProps) {
  const { className, ...rest } = props;
  const dom: Record<string, unknown> = { ...rest };
  for (const k of ["variant", "count", "max", "label", "status", "player"]) delete dom[k];

  if (props.variant === "count") {
    const max = props.max ?? 99;
    if (props.count <= 0) return null;
    const text = props.count > max ? `${max}+` : String(props.count);
    return (
      <span aria-label={props.label ?? `${props.count} mới`} className={cx(BASE, "min-w-[18px] justify-center bg-danger px-1 text-danger-on tabular", className)} {...dom}>
        {text}
      </span>
    );
  }
  if (props.variant === "status") {
    return (
      <span className={cx(BASE, STATUS[props.status], className)} {...dom}>
        {ROOM_STATUS_LABEL[props.status]}
      </span>
    );
  }
  if (props.variant === "team") {
    return (
      <span className={cx(BASE, "bg-black/70 text-tone-text text-shadow-game gap-1", className)} {...dom}>
        <span aria-hidden className={cx("h-2.5 w-2.5 shadow-[0_0_0_1px_#000]", TEAM[props.player])} />
        {props.children}
      </span>
    );
  }
  return <span className={cx(BASE, "bg-black/60 text-tone-focus bevel-raised-1", className)} {...dom} />;
}

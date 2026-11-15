import { cx } from "../lib/cx";
import { Icon } from "./Icon";

export type PresenceStatus = "online" | "away" | "busy" | "in-game" | "offline";

export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: "Trực tuyến",
  away: "Vắng mặt",
  busy: "Bận",
  "in-game": "Đang chơi",
  offline: "Ngoại tuyến",
};

const COLOR: Record<PresenceStatus, string> = {
  online: "bg-status-online",
  away: "bg-status-away",
  busy: "bg-status-busy",
  "in-game": "bg-status-in-game",
  offline: "bg-status-offline",
};

export interface StatusDotProps {
  status: PresenceStatus;
  size?: 8 | 10 | 12 | 16;
  /** Set false when the status text is already visible next to the dot. */
  labelled?: boolean;
  className?: string;
}

/** Presence dot with a 1px black ring; `in-game` shows a small sword from 12px. */
export function StatusDot({ status, size = 10, labelled = true, className }: StatusDotProps) {
  return (
    <span
      role={labelled ? "img" : undefined}
      aria-label={labelled ? PRESENCE_LABEL[status] : undefined}
      aria-hidden={labelled ? undefined : true}
      title={labelled ? PRESENCE_LABEL[status] : undefined}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full shadow-[0_0_0_1px_#000] text-black", COLOR[status], className)}
      style={{ width: size, height: size }}
    >
      {status === "in-game" && size >= 12 && <Icon name="sword" size={12} className="!h-[70%] !w-[70%] ![filter:none]" />}
    </span>
  );
}

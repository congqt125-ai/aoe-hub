import { cx } from "../lib/cx";
import { assetUrl } from "../lib/assets";
import type { Player } from "../lib/types";
import { Avatar } from "../atoms/Avatar";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { PingIndicator } from "../atoms/PingIndicator";
import { PRESENCE_LABEL, StatusDot } from "../atoms/StatusDot";
import { TEXT_TONE } from "../atoms/Text";
import { DropdownMenu, type MenuEntry } from "./Menu";

export interface PlayerChipProps {
  player: Player;
  /** Tint the name with the player color (inside rooms / matches). */
  colored?: boolean;
  showPing?: boolean;
  /** Second line: activity or presence text. */
  showActivity?: boolean;
  /** Small pennant in the player color (hud/pennant-<N>.png, tools/recolor_player_sprites.py). */
  showPennant?: boolean;
  /** Actions in a "..." menu (Nhắn tin, Mời vào phòng, Xem hồ sơ, Kết bạn...). */
  actions?: MenuEntry[];
  compact?: boolean;
  /** Avatar size override (default: xs when compact, else sm); md 32 = TopBar avatar. */
  avatarSize?: "xs" | "sm" | "md";
  className?: string;
}

/** Avatar + name + status (+ ping, pennant, action menu). */
export function PlayerChip({ player, colored, showPing, showActivity, showPennant, actions, compact, avatarSize, className }: PlayerChipProps) {
  const blocked = player.relation === "blocked";
  return (
    <span className={cx("group inline-flex min-w-0 items-center gap-2", blocked && "opacity-60", className)}>
      <Avatar name={player.name} source={player.avatar} size={avatarSize ?? (compact ? "xs" : "sm")} player={colored ? player.color : undefined} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex min-w-0 items-center gap-1.5">
          <StatusDot status={player.status} size={8} />
          <span
            className={cx("truncate font-body text-md", colored && player.color ? TEXT_TONE[`player-${player.color}`] : "text-tone-text")}
            title={player.name}
          >
            {player.name}
          </span>
          {player.relation === "friend" && <Icon name="star" size={12} label="Bạn bè" className="text-tone-focus" />}
          {blocked && <Icon name="ban" size={12} label="Đã chặn" className="text-danger-on-dark" />}
          {showPennant && player.color && (
            <img src={assetUrl(`hud/pennant-${player.color}.png`)} alt="" className="h-4 w-auto" draggable={false} />
          )}
        </span>
        {showActivity && (
          <span className="truncate font-body text-xs text-tone-text/70">{player.activity ?? PRESENCE_LABEL[player.status]}</span>
        )}
      </span>
      {showPing && player.ping !== undefined && <PingIndicator ms={player.ping} />}
      {actions && (
        <DropdownMenu
          label={`Hành động với ${player.name}`}
          items={actions}
          align="end"
          trigger={(p) => (
            <IconButton label={`Hành động với ${player.name}`} size={24} tooltip={false} className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100" {...p}>
              <Icon name="more" size={16} />
            </IconButton>
          )}
        />
      )}
    </span>
  );
}

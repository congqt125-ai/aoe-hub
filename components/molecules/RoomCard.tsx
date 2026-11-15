import { assetUrl } from "../lib/assets";
import { cx } from "../lib/cx";
import type { Room } from "../lib/types";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { PingIndicator } from "../atoms/PingIndicator";
import { PlayerChip } from "./PlayerChip";

export interface RoomCardProps {
  room: Room;
  selected?: boolean;
  onJoin?: (room: Room) => void;
  onSelect?: (room: Room) => void;
  className?: string;
}

/** Room in a grid: name, host, map thumbnail, mode, seats, ping, status, lock. Full rooms only offer "Xem". */
export function RoomCard({ room, selected, onJoin, onSelect, className }: RoomCardProps) {
  const full = room.players >= room.maxPlayers || room.status === "full";
  const playing = room.status === "playing";
  const action = full || playing ? "Xem" : "Vào";
  return (
    <article
      aria-label={`Phòng ${room.name}`}
      onClick={() => onSelect?.(room)}
      onDoubleClick={() => onJoin?.(room)}
      className={cx(
        "group relative flex w-72 flex-col gap-2 p-3 text-tone-text text-shadow-game",
        selected ? "bg-black/70 bevel-sunken" : "bg-black/55 bevel-raised hover:bg-black/65",
        className,
      )}
    >
      <header className="flex items-start gap-2">
        <h3 className={cx("m-0 flex-1 truncate font-heading text-lg font-semibold", selected ? "text-tone-state" : "group-hover:text-tone-focus")} title={room.name}>
          {room.name}
        </h3>
        {room.hasPassword && <Icon name="lock" size={16} label="Có mật khẩu" className="mt-1 text-tone-focus" />}
        <Badge variant="status" status={full && room.status === "waiting" ? "full" : room.status} />
      </header>
      <div className="flex gap-3">
        <div
          className="flex h-16 w-24 shrink-0 items-end bg-cover bg-center bevel-sunken-2 p-1"
          style={{ backgroundImage: `url("${assetUrl("minimap/minimap-bg-sm.png")}")` }}
        >
          <span className="bg-black/70 px-1 font-body text-xs">{room.map}</span>
        </div>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2 font-body text-sm">
          <dt className="text-tone-text/70">Chế độ</dt>
          <dd className="m-0 truncate">{room.mode}</dd>
          <dt className="text-tone-text/70">Tốc độ</dt>
          <dd className="m-0">{room.speed}</dd>
          <dt className="text-tone-text/70">Thời đại</dt>
          <dd className="m-0 truncate">{room.startAge}</dd>
        </dl>
      </div>
      <footer className="flex items-center gap-3">
        <PlayerChip player={room.host} compact className="min-w-0 flex-1" />
        <span className="flex items-center gap-1 font-body text-sm tabular" aria-label={`${room.players} trên ${room.maxPlayers} người`}>
          <Icon name="users" size={16} />
          {room.players}/{room.maxPlayers}
        </span>
        <PingIndicator ms={room.ping} />
        {onJoin && (
          <Button
            size="sm"
            variant={action === "Vào" ? "primary" : "secondary"}
            onClick={(e) => {
              e.stopPropagation();
              onJoin(room);
            }}
            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
          >
            {action}
          </Button>
        )}
      </footer>
    </article>
  );
}

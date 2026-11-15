import { useMemo, useState } from "react";
import {
  Avatar, Button, EmptyState, PingIndicator, type Player,
} from "../../../../components";
import type { LobbyRoom } from "../../lobbyMock";
import type { EnterMode } from "../../roomMock";
import { CreateRoomDialog, type CreateRoomInput } from "../CreateRoomDialog";
import { LINE, PanelTitle } from "../panel";

export interface SuggestedRoomsProps {
  me: Player;
  rooms: LobbyRoom[];
  friendIds: Set<string>;
  maxCount: number;
  onGoLobby: () => void;
  onEnterRoom: (room: LobbyRoom, mode: EnterMode) => void;
  onCreateRoom: (input: CreateRoomInput) => LobbyRoom;
}

const CATEGORY_LABEL: Record<LobbyRoom["category"], string> = {
  random: "Random",
  cungr: "Cung R",
  clan: "Clan",
};

/** §3.5 Suggested rooms from shared lobby data: open seats + unlocked + friends inside + lowest ping. */
export function SuggestedRooms({
  me,
  rooms,
  friendIds,
  maxCount,
  onGoLobby,
  onEnterRoom,
  onCreateRoom,
}: SuggestedRoomsProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const suggested = useMemo(() => {
    if (maxCount <= 0) return [];
    const sorted = [...rooms].sort((a, b) => {
      const aOpen = a.status === "waiting" && a.players < a.maxPlayers ? 0 : 1;
      const bOpen = b.status === "waiting" && b.players < b.maxPlayers ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;

      const aUnlocked = !a.hasPassword ? 0 : 1;
      const bUnlocked = !b.hasPassword ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;

      const aFriend = friendIds.has(a.host.id) ? 0 : 1;
      const bFriend = friendIds.has(b.host.id) ? 0 : 1;
      if (aFriend !== bFriend) return aFriend - bFriend;

      return (a.ping ?? 999) - (b.ping ?? 999);
    });
    return sorted.slice(0, maxCount);
  }, [rooms, friendIds, maxCount]);

  return (
    <section
      aria-label="Phòng gợi ý"
      className="flex min-h-0 flex-col overflow-hidden bg-black/55 bevel-raised-2"
    >
      <PanelTitle
        trailing={
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" onClick={onGoLobby}>
              Vào Sảnh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              Tạo phòng
            </Button>
          </div>
        }
      >
        Phòng gợi ý
      </PanelTitle>
      <div className={`h-px shrink-0 ${LINE}`} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {suggested.length === 0 ? (
          <div className="flex h-full items-center justify-center p-3">
            <EmptyState
              title="Chưa có phòng nào đang mở"
              description="Tạo phòng mới để rủ bạn bè vào trận ngay."
              action={{ label: "Tạo phòng", onClick: () => setCreateOpen(true) }}
            />
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {suggested.map((room) => {
              const playing = room.status === "playing";
              const hostIsFriend = friendIds.has(room.host.id);
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-2.5 px-3 py-2 hover:bg-white/5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-heading text-sm font-semibold text-tone-state">
                        {room.name}
                      </span>
                      {hostIsFriend && (
                        <Avatar name={room.host.name} source={room.host.avatar} player={room.host.color} size="xs" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-body text-xs text-tone-text/75">
                      <span>{CATEGORY_LABEL[room.category]}</span>
                      <span>·</span>
                      <span className="tabular">
                        {room.players}/{room.maxPlayers}
                      </span>
                      <span>·</span>
                      <PingIndicator ms={room.ping} showValue />
                    </div>
                  </div>

                  <Button
                    variant={playing ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => onEnterRoom(room, playing ? "watch" : "join")}
                  >
                    {playing ? "Vào xem" : "Vào"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateRoomDialog
          defaultName={`Phòng của ${me.name}`}
          defaultCategory="random"
          onClose={() => setCreateOpen(false)}
          onCreate={(input) => {
            const room = onCreateRoom(input);
            setCreateOpen(false);
            onEnterRoom(room, "create");
          }}
        />
      )}
    </section>
  );
}

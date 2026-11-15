import { useMemo } from "react";
import {
  Avatar, Button, EmptyState, PRESENCE_LABEL, StatusDot, type Player,
} from "../../../../components";
import { LINE, PanelTitle } from "../panel";

export interface FriendsOnlineProps {
  friends: Player[];
  onOpenProfile: (playerId: string) => void;
  onOpenAllFriends: () => void;
  onInvite: (friend: Player) => void;
  onWatch: (friend: Player) => void;
}

/** §3.6 Compact online friends rail: in-game & online/away only, offline count at the bottom. */
export function FriendsOnline({
  friends,
  onOpenProfile,
  onOpenAllFriends,
  onInvite,
  onWatch,
}: FriendsOnlineProps) {
  const { inGame, available, offlineCount } = useMemo(() => {
    const playing: Player[] = [];
    const online: Player[] = [];
    let offline = 0;

    for (const f of friends) {
      if (f.status === "offline") offline += 1;
      else if (f.status === "in-game") playing.push(f);
      else online.push(f);
    }

    return { inGame: playing, available: online, offlineCount: offline };
  }, [friends]);

  const onlineTotal = inGame.length + available.length;

  const renderGroup = (title: string, items: Player[]) => {
    if (items.length === 0) return null;
    return (
      <div className="flex flex-col">
        <div className="bg-black/25 px-3 py-1 font-heading text-xs font-semibold uppercase tracking-wide text-tone-text/70">
          {title} ({items.length})
        </div>
        <div className="divide-y divide-white/10">
          {items.map((f) => {
            const playing = f.status === "in-game";
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar name={f.name} source={f.avatar} player={f.color} size="sm" />
                    <StatusDot
                      status={f.status}
                      size={10}
                      labelled={false}
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(f.id)}
                      className="truncate text-left font-body text-sm font-semibold text-tone-state hover:text-tone-focus focus-visible:outline-game-out"
                    >
                      {f.name}
                    </button>
                    <span className="truncate font-body text-xs text-tone-text/70">
                      {f.activity ?? PRESENCE_LABEL[f.status]}
                    </span>
                  </div>
                </div>

                {playing ? (
                  <Button variant="secondary" size="sm" onClick={() => onWatch(f)}>
                    Vào xem
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onInvite(f)}>
                    Mời
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="Bạn bè online"
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black/55 bevel-raised-2"
    >
      <PanelTitle>Bạn bè online ({onlineTotal})</PanelTitle>
      <div className={`h-px shrink-0 ${LINE}`} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {onlineTotal === 0 ? (
          <div className="flex h-full items-center justify-center p-3">
            <EmptyState
              title="Chưa có bạn nào online"
              description="Khi bạn bè đăng nhập hoặc vào trận, danh sách sẽ hiện ở đây."
            />
          </div>
        ) : (
          <>
            {renderGroup("Đang chơi", inGame)}
            {renderGroup("Trực tuyến", available)}
            {offlineCount > 0 && (
              <div className="px-3 py-2 font-body text-xs text-tone-text/55">
                + {offlineCount} ngoại tuyến
              </div>
            )}
          </>
        )}
      </div>

      <div className={`h-px shrink-0 ${LINE}`} />
      <div className="flex h-9 shrink-0 items-center justify-end bg-black/20 px-3">
        <button
          type="button"
          onClick={onOpenAllFriends}
          className="font-body text-sm font-semibold text-tone-focus hover:underline focus-visible:outline-game-out"
        >
          Tất cả bạn bè →
        </button>
      </div>
    </section>
  );
}

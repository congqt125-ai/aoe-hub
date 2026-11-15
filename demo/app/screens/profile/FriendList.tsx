import { useMemo, useState } from "react";
import {
  Avatar, Button, Dialog, DropdownMenu, EmptyState, Icon,
  ListRow, PingIndicator, PRESENCE_LABEL, SearchBar, StatusDot,
  type MenuEntry, type Player, type PresenceStatus,
} from "../../../../components";

const STATUS_GROUPS: { statuses: PresenceStatus[]; key: string; label: string }[] = [
  { statuses: ["in-game"], key: "in-game", label: "Đang chơi" },
  { statuses: ["online"], key: "online", label: "Trực tuyến" },
  { statuses: ["away", "busy"], key: "away", label: "Vắng" },
  { statuses: ["offline"], key: "offline", label: "Ngoại tuyến" },
];

export interface FriendListProps {
  friends: Player[];
  requests?: Player[];
  isMe: boolean;
  mutualIds?: Set<string>;
  sentRequestIds?: Set<string>;
  myFriendIds?: Set<string>;
  onOpenProfile: (playerId: string) => void;
  onAcceptRequest?: (player: Player) => void;
  onDeclineRequest?: (player: Player) => void;
  onRemoveFriend?: (player: Player) => void;
  onMessage?: (player: Player) => void;
  onInvite?: (player: Player) => void;
  onSendFriendRequest?: (player: Player) => void;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

/**
 * Reusable friend list component (T7 §3.7, designed to be reused by T6).
 * - Self view: incoming requests, SearchBar, grouped by presence status, full action menu + unfriend dialog.
 * - Other view: mutual friends sorted to top with "Bạn chung" tag; view profile & add friend only.
 */
export function FriendList({
  friends,
  requests = [],
  isMe,
  mutualIds,
  sentRequestIds,
  myFriendIds,
  onOpenProfile,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onMessage,
  onInvite,
  onSendFriendRequest,
  emptyActionLabel = "Tìm người chơi ở Sảnh",
  onEmptyAction,
}: FriendListProps) {
  const [query, setQuery] = useState("");
  const [unfriendTarget, setUnfriendTarget] = useState<Player | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFriends = useMemo(() => {
    const base = normalizedQuery
      ? friends.filter((f) => f.name.toLowerCase().includes(normalizedQuery))
      : friends;
    if (isMe) return base;
    // Other profile: sort mutual friends first
    return [...base].sort((a, b) => {
      const am = mutualIds?.has(a.id) ? 0 : 1;
      const bm = mutualIds?.has(b.id) ? 0 : 1;
      return am - bm;
    });
  }, [friends, normalizedQuery, isMe, mutualIds]);

  const grouped = useMemo(() => {
    if (!isMe) return [];
    return STATUS_GROUPS.map((g) => ({
      ...g,
      items: filteredFriends.filter((f) => g.statuses.includes(f.status)),
    })).filter((g) => g.items.length > 0);
  }, [filteredFriends, isMe]);

  const renderFriendRow = (f: Player) => {
    const isMutual = !isMe && Boolean(mutualIds?.has(f.id));
    const isMyFriend = Boolean(myFriendIds?.has(f.id));
    const isSent = Boolean(sentRequestIds?.has(f.id));
    const subtitle =
      f.activity ?? (f.status === "in-game" ? "Đang trong trận" : PRESENCE_LABEL[f.status]);

    const menuItems: MenuEntry[] = [
      {
        id: "profile",
        label: "Xem hồ sơ",
        icon: "user",
        onSelect: () => onOpenProfile(f.id),
      },
      {
        id: "message",
        label: "Nhắn tin",
        icon: "chat",
        onSelect: () => onMessage?.(f),
      },
      {
        id: "invite",
        label: "Mời vào phòng",
        icon: "plus",
        disabled: f.status === "offline",
        onSelect: () => onInvite?.(f),
      },
      { kind: "divider", id: "div" },
      {
        id: "unfriend",
        label: "Huỷ kết bạn",
        icon: "close",
        danger: true,
        onSelect: () => setUnfriendTarget(f),
      },
    ];

    return (
      <ListRow
        key={f.id}
        size="lg"
        className="bg-black/30 bevel-sunken-1"
        leading={<Avatar size="sm" name={f.name} source={f.avatar} status={f.status} />}
        trailing={
          isMe ? (
            <div className="flex items-center gap-2">
              {f.status !== "offline" && f.ping !== undefined && (
                <PingIndicator ms={f.ping} showValue />
              )}
              <Button size="sm" variant="secondary" onClick={() => onOpenProfile(f.id)}>
                Xem hồ sơ
              </Button>
              <DropdownMenu
                align="end"
                label={`Hành động với ${f.name}`}
                items={menuItems}
                trigger={(triggerProps) => (
                    <Button
                    {...triggerProps}
                    size="sm"
                    variant="secondary"
                    icon={<Icon name="more" size={16} />}
                    aria-label={`Thêm hành động với ${f.name}`}
                  />
                )}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => onOpenProfile(f.id)}>
                Xem hồ sơ
              </Button>
              {isMyFriend ? (
                <span className="px-2 text-xs font-semibold text-success-on-dark">Bạn bè</span>
              ) : isSent ? (
                <Button size="sm" variant="secondary" disabled>
                  Đã gửi lời mời
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => onSendFriendRequest?.(f)}>
                  Kết bạn
                </Button>
              )}
            </div>
          )
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot status={f.status} size={8} />
          <button
            type="button"
            onClick={() => onOpenProfile(f.id)}
            className="truncate text-left font-heading text-sm font-bold text-tone-focus hover:underline focus-visible:outline-game-out"
          >
            {f.name}
          </button>
          {f.rank && <span className="text-xs text-tone-text/65">{f.rank}</span>}
          {isMutual && (
            <span className="rounded-sm bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-tone-state bevel-sunken-1">
              Bạn chung
            </span>
          )}
        </div>
        <div className="truncate text-xs text-tone-text/70">{subtitle}</div>
      </ListRow>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Incoming friend requests (self only) */}
      {isMe && requests.length > 0 && (
        <section className="flex flex-col gap-2 bg-black/40 p-3 bevel-sunken-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-tone-focus">
              Lời mời kết bạn ({requests.length})
            </h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {requests.map((req) => (
              <ListRow
                key={req.id}
                size="md"
                className="bg-black/35 bevel-sunken-1"
                leading={<Avatar size="sm" name={req.name} source={req.avatar} status={req.status} />}
                trailing={
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" onClick={() => onAcceptRequest?.(req)}>
                      Đồng ý
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => onDeclineRequest?.(req)}>
                      Từ chối
                    </Button>
                  </div>
                }
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(req.id)}
                    className="truncate font-heading text-sm font-bold text-tone-text hover:text-tone-focus"
                  >
                    {req.name}
                  </button>
                  {req.rank && <span className="text-xs text-tone-text/65">{req.rank}</span>}
                </div>
                <div className="text-xs text-tone-text/65">Muốn kết bạn với bạn</div>
              </ListRow>
            ))}
          </div>
        </section>
      )}

      {/* SearchBar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="w-full sm:w-72">
          <SearchBar
            label="Tìm bạn bè"
            placeholder="Tìm theo tên người chơi…"
            onSearch={(q) => setQuery(q)}
          />
        </div>
        <span className="text-xs tabular text-tone-text/65">
          {filteredFriends.length} bạn bè
        </span>
      </div>

      {/* Empty or list */}
      {friends.length === 0 ? (
        <div className="bg-black/35 bevel-sunken-1">
          <EmptyState
            title="Chưa có bạn bè"
            description="Tìm người chơi ở Sảnh để kết bạn và rủ chơi cùng."
            art={{ set: "building:greek", frame: 4 }}
            action={onEmptyAction ? { label: emptyActionLabel, onClick: onEmptyAction } : undefined}
          />
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="bg-black/35 bevel-sunken-1">
          <EmptyState
            title="Không tìm thấy bạn bè"
            description={`Không có ai khớp với “${query}”.`}
            art={{ set: "building:greek", frame: 4 }}
          />
        </div>
      ) : isMe ? (
        <div className="flex flex-col gap-4">
          {grouped.map((g) => (
            <section key={g.key} className="flex flex-col gap-1.5">
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-tone-state">
                {g.label} ({g.items.length})
              </h3>
              <div className="flex flex-col gap-1.5">{g.items.map(renderFriendRow)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">{filteredFriends.map(renderFriendRow)}</div>
      )}

      {/* Unfriend confirm Dialog */}
      {unfriendTarget && (
        <Dialog
          title="Huỷ kết bạn"
          size="sm"
          onClose={() => setUnfriendTarget(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setUnfriendTarget(null)}>
                Giữ lại
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onRemoveFriend?.(unfriendTarget);
                  setUnfriendTarget(null);
                }}
              >
                Huỷ kết bạn
              </Button>
            </>
          }
        >
          <p className="text-sm text-tone-text/90">
            Bạn có chắc muốn huỷ kết bạn với <strong className="text-tone-focus">{unfriendTarget.name}</strong>?
          </p>
        </Dialog>
      )}
    </div>
  );
}

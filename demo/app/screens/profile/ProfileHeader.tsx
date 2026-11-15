import { useEffect, useRef, useState } from "react";
import {
  Avatar, Button, Dialog, GameIcon, Icon, IconButton, Menu, PRESENCE_LABEL,
  StatusDot, Tooltip, cx, type PlayerNumber,
} from "../../../../components";
import { civLabel, civStyle } from "../../civs";
import { bgAssetUrl, type ItemRarity, type ProfileData } from "../../profileMock";

const FRAME_RING: Record<ItemRarity, string> = {
  common: "ring-2 ring-tone-text/45",
  rare: "ring-2 ring-info",
  epic: "ring-2 ring-tone-state",
  legendary: "ring-2 ring-tone-focus shadow-[0_0_12px_rgb(var(--t-focus-rgb)/0.45)]",
};

const PLAYER_SWATCH: Record<PlayerNumber, { bg: string; label: string }> = {
  1: { bg: "bg-player-1", label: "Xanh dương" },
  2: { bg: "bg-player-2", label: "Đỏ" },
  3: { bg: "bg-player-3", label: "Vàng" },
  4: { bg: "bg-player-4", label: "Nâu" },
  5: { bg: "bg-player-5", label: "Cam" },
  6: { bg: "bg-player-6", label: "Xanh lá" },
  7: { bg: "bg-player-7", label: "Xám" },
  8: { bg: "bg-player-8", label: "Ngọc" },
};

export function ProfileHeader({
  profile,
  isMe,
  friendStatus,
  isBlocked,
  onEdit,
  onFriendRequest,
  onMessage,
  onInvite,
  onBlockConfirm,
  onReport,
}: {
  profile: ProfileData;
  isMe: boolean;
  friendStatus: "none" | "sent" | "friend";
  isBlocked: boolean;
  onEdit: () => void;
  onFriendRequest: () => void;
  onMessage: () => void;
  onInvite: () => void;
  onBlockConfirm: () => void;
  onReport: () => void;
}) {
  const { player: p } = profile;
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [moreOpen]);

  const bgUrl = bgAssetUrl(profile.bannerBg);
  const favStyle = civStyle(profile.favouriteCiv) ?? "greek";
  const favLabel = civLabel(profile.favouriteCiv);
  const colorNum = p.color ?? 1;
  const swatch = PLAYER_SWATCH[colorNum];

  const pinnedAchievements = profile.pinnedIds
    .map((id) => profile.unlockedAchievements.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .slice(0, 3);

  const delta = profile.stats.eloWeekDelta;
  const friendLabel =
    friendStatus === "friend"
      ? "Đã là bạn bè"
      : friendStatus === "sent"
        ? "Đã gửi lời mời"
        : "Kết bạn";

  return (
    <header className="relative flex h-[200px] shrink-0 items-center justify-between gap-6 overflow-hidden bg-black/55 px-6 bevel-raised">
      {/* Equipped profile background with dark readability scrim */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"
      />

      {/* Left: Avatar + frame + identity + meta line */}
      <div className="relative z-10 flex min-w-0 items-center gap-5">
        <div className={cx("shrink-0 p-0.5 bg-black/60", FRAME_RING[profile.frameRarity])}>
          <Avatar name={p.name} source={p.avatar} size="2xl" player={p.color} />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 text-shadow-game">
          {/* Name + Clan tag */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 truncate font-heading text-2xl font-bold text-tone-state">
              {p.name}
            </h1>
            {profile.clan && (
              <button
                type="button"
                onClick={() => { location.hash = `#/clan/${encodeURIComponent(profile.clan!.tag)}`; }}
                className="cursor-pointer bg-black/70 px-2 py-0.5 font-heading text-sm font-semibold text-tone-focus bevel-sunken-1 transition-colors hover:bg-black/90 hover:text-tone-state focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tone-focus"
              >
                [{profile.clan.tag}]
              </button>
            )}
            {isBlocked && (
              <span className="bg-danger/30 px-2 py-0.5 font-body text-xs font-semibold text-danger-on-dark">
                Đã chặn
              </span>
            )}
          </div>

          {/* Active title */}
          <div className="font-body text-sm font-semibold text-tone-focus">
            {profile.title}
          </div>

          {/* Secondary line: status · rank + elo + delta · fav civ · color flag · joined */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm text-tone-text">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status={p.status} size={10} />
              <span>{p.activity ?? PRESENCE_LABEL[p.status]}</span>
            </span>

            <span aria-hidden className="text-tone-text/40">·</span>

            <span className="inline-flex items-center gap-1 tabular">
              <span className="font-semibold text-tone-state">{p.rank ?? "Chưa xếp hạng"}</span>
              <span>{profile.stats.elo}</span>
              {delta !== 0 && (
                <span className={delta > 0 ? "text-success-on-dark" : "text-danger-on-dark"}>
                  {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                </span>
              )}
            </span>

            <span aria-hidden className="text-tone-text/40">·</span>

            <span className="inline-flex items-center gap-1.5">
              <GameIcon set={`building:${favStyle}`} frame={0} size={16} />
              <span>{favLabel}</span>
            </span>

            <span aria-hidden className="text-tone-text/40">·</span>

            <Tooltip content={`Cờ màu người chơi: ${swatch.label} (#${colorNum})`}>
              <span className="inline-flex items-center gap-1.5">
                <span className={cx("inline-block h-3 w-3 border border-black/60", swatch.bg)} />
                <span className="text-xs text-tone-text/80">{swatch.label}</span>
              </span>
            </Tooltip>

            <span aria-hidden className="text-tone-text/40">·</span>

            <span className="text-tone-text/80">Tham gia {profile.joinedAt}</span>
          </div>
        </div>
      </div>

      {/* Right: Pinned achievements + trophies + action buttons */}
      <div className="relative z-10 flex shrink-0 flex-col items-end gap-3">
        {/* Pinned achievements & tournament trophies */}
        <div className="flex items-center gap-3">
          {pinnedAchievements.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/55 px-2.5 py-1.5 bevel-sunken-1">
              {pinnedAchievements.map((ach) => (
                <Tooltip key={ach.id} content={ach.name}>
                  <span className="inline-flex items-center justify-center p-0.5">
                    <GameIcon set={ach.iconSet} frame={ach.frame} size={24} />
                  </span>
                </Tooltip>
              ))}
            </div>
          )}

          <Tooltip content={`Cúp vô địch giải đấu: ${profile.trophies}`}>
            <div className="flex items-center gap-1 bg-black/55 px-2.5 py-1.5 font-heading text-md font-bold tabular text-tone-focus bevel-sunken-1">
              <Icon name="trophy" size={16} />
              <span>×{profile.trophies}</span>
            </div>
          </Tooltip>
        </div>

        {/* Action buttons */}
        {isMe ? (
          <Button variant="primary" onClick={onEdit}>
            Sửa hồ sơ
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Icon name={friendStatus === "none" ? "user-plus" : "check"} size={16} />}
              disabled={friendStatus !== "none" || isBlocked}
              onClick={onFriendRequest}
            >
              {friendLabel}
            </Button>
            <Button icon={<Icon name="chat" size={16} />} disabled={isBlocked} onClick={onMessage}>
              Nhắn tin
            </Button>
            <Button disabled={isBlocked} onClick={onInvite}>
              Mời vào phòng
            </Button>

            <div ref={moreRef} className="relative">
              <IconButton
                label="Thêm tuỳ chọn"
                size={32}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <Icon name="more" size={16} />
              </IconButton>

              {moreOpen && (
                <div className="absolute right-0 top-full z-dropdown mt-1 w-44 bg-black shadow-[0_6px_16px_rgb(0_0_0/0.65)]">
                  <Menu
                    label={`Tuỳ chọn cho ${p.name}`}
                    onClose={() => setMoreOpen(false)}
                    items={[
                      {
                        id: "block",
                        label: isBlocked ? "Đã chặn" : "Chặn người chơi",
                        icon: "ban",
                        danger: true,
                        disabled: isBlocked,
                        onSelect: () => {
                          setMoreOpen(false);
                          setConfirmBlock(true);
                        },
                      },
                      {
                        id: "report",
                        label: "Báo cáo",
                        icon: "warning",
                        onSelect: () => {
                          setMoreOpen(false);
                          onReport();
                        },
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm block Dialog */}
      {confirmBlock && (
        <Dialog
          title={`Chặn ${p.name}?`}
          size="sm"
          onClose={() => setConfirmBlock(false)}
          actions={
            <>
              <Button onClick={() => setConfirmBlock(false)}>Huỷ</Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmBlock(false);
                  onBlockConfirm();
                }}
              >
                Chặn
              </Button>
            </>
          }
        >
          <div className="bg-black/60 p-3 font-body text-sm text-tone-text bevel-sunken">
            Bạn sẽ không nhận được tin nhắn hay lời mời vào phòng từ <strong>{p.name}</strong> nữa.
          </div>
        </Dialog>
      )}
    </header>
  );
}


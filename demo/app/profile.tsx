// Player profile (click a player anywhere in the hub): first a small context menu at the click — Thông tin,
// Lịch sử đấu, "@" mention in the screen's chat, Kết bạn — then, for info / history, the centered modal.
// Screens register where a mention goes with useMentionTarget().
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Avatar, Button, Dialog, Icon, Menu, PingIndicator, PRESENCE_LABEL, StatusDot, TabPanel, Tabs, type MenuEntry, type Player,
} from "../../components";
import { mockProfile } from "./profileMock";

interface MentionTarget {
  /** Where the mention goes, e.g. "chat tổng". */
  label: string;
  insert: (text: string) => void;
}

interface ProfileApi {
  /** Opens the player menu next to `anchor` (or at `point` if given); `extra` items go last. */
  open: (player: Player, anchor: HTMLElement, extra?: MenuEntry[], point?: { x: number; y: number }) => void;
  /** Same context menu with other items (e.g. an empty room seat: sit / close / open). */
  openMenu: (anchor: HTMLElement, label: string, items: MenuEntry[]) => void;
  setMentionTarget: (t: MentionTarget | null) => void;
}

const ProfileContext = createContext<ProfileApi | null>(null);

export function useProfile(): ProfileApi {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile() must be used inside <ProfileProvider>");
  return ctx;
}

/** A screen's chat that receives "@name " from the profile menu / modal while the screen is shown. */
export function useMentionTarget(label: string, insert: (text: string) => void) {
  const { setMentionTarget } = useProfile();
  const fn = useRef(insert);
  fn.current = insert;
  useEffect(() => {
    setMentionTarget({ label, insert: (t) => fn.current(t) });
    return () => setMentionTarget(null);
  }, [label, setMentionTarget]);
}

type Tab = "info" | "history";
const MENU_W = 240;
const MENU_H = 160;

export function ProfileProvider({ me, children }: { me: Player; children: ReactNode }) {
  const [menu, setMenu] = useState<{ x: number; y: number; label: string } & ({ player: Player; extra: MenuEntry[] } | { items: MenuEntry[] }) | null>(null);
  const [dialog, setDialog] = useState<{ player: Player; tab: Tab } | null>(null);
  const [mention, setMention] = useState<MentionTarget | null>(null);
  /** Friend requests sent in this session (mock). */
  const [sent, setSent] = useState<Set<string>>(() => new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const place = useCallback((anchor: HTMLElement, point?: { x: number; y: number }) => {
    // Coordinates inside the fixed 1600x900 stage (#root has a transform, so it is the containing block of
    // position:fixed); the menu stays inside it, above the anchor/pointer when there is no room below.
    const stage = (document.getElementById("root") ?? document.body).getBoundingClientRect();
    if (point) {
      const x = Math.min(Math.max(point.x - stage.left, 4), stage.width - MENU_W - 4);
      const rawY = point.y - stage.top;
      const y = rawY + MENU_H > stage.height ? Math.max(rawY - MENU_H, 4) : Math.max(rawY, 4);
      opener.current = anchor;
      return { x, y };
    }
    const r = anchor.getBoundingClientRect();
    const x = Math.min(Math.max(r.left - stage.left, 4), stage.width - MENU_W - 4);
    const below = r.bottom - stage.top + 4;
    const y = below + MENU_H > stage.height ? Math.max(r.top - stage.top - MENU_H - 4, 4) : below;
    opener.current = anchor;
    return { x, y };
  }, []);
  const open = useCallback(
    (player: Player, anchor: HTMLElement, extra: MenuEntry[] = [], point?: { x: number; y: number }) =>
      setMenu({ ...place(anchor, point), label: `Người chơi ${player.name}`, player, extra }),
    [place],
  );
  const openMenu = useCallback(
    (anchor: HTMLElement, label: string, items: MenuEntry[]) => setMenu({ ...place(anchor), label, items }),
    [place],
  );
  const api = useMemo<ProfileApi>(() => ({ open, openMenu, setMentionTarget: setMention }), [open, openMenu]);
  const closeMenu = useCallback((refocus = true) => {
    setMenu(null);
    if (refocus) opener.current?.focus();
  }, []);

  // A click outside, scrolling or resizing closes the menu.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) closeMenu(false);
    };
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) closeMenu(false);
    };
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menu, closeMenu]);

  const friendLabel = (p: Player) => (p.relation === "friend" ? "Đã là bạn bè" : sent.has(p.id) ? "Đã gửi lời mời" : "Kết bạn");
  const canRequest = (p: Player) => p.relation !== "friend" && !sent.has(p.id);
  const request = (p: Player) => setSent((s) => new Set(s).add(p.id));
  const showDialog = (player: Player, tab: Tab) => {
    closeMenu(false);
    setDialog({ player, tab });
  };

  const items = (p: Player): MenuEntry[] => {
    const base: MenuEntry[] = [
      { id: "info", label: "Thông tin", icon: "user", onSelect: () => showDialog(p, "info") },
      { id: "history", label: "Lịch sử đấu", icon: "trophy", onSelect: () => showDialog(p, "history") },
    ];
    if (p.id === me.id) return base;
    return [
      ...base,
      { id: "sep", kind: "divider" },
      {
        id: "mention",
        label: mention ? `Nhắc tên tại ${mention.label} (@)` : "Nhắc tên (@)",
        icon: "chat",
        disabled: !mention,
        onSelect: () => {
          closeMenu(false);
          mention?.insert(`@${p.name} `);
        },
      },
      {
        id: "friend",
        label: friendLabel(p),
        icon: canRequest(p) ? "user-plus" : "check",
        disabled: !canRequest(p),
        onSelect: () => {
          request(p);
          closeMenu();
        },
      },
    ];
  };

  return (
    <ProfileContext.Provider value={api}>
      {children}
      {menu && (
        <div ref={menuRef} className="fixed z-dropdown bg-black shadow-[0_6px_16px_rgb(0_0_0/0.6)]" style={{ left: menu.x, top: menu.y, width: MENU_W }}>
          <Menu
            label={menu.label}
            // Wrap the extra / custom items so picking one also closes the menu.
            items={("player" in menu ? [...items(menu.player), ...menu.extra] : menu.items).map((it) =>
              it.kind === "divider" || "player" in menu && !menu.extra.includes(it)
                ? it
                : { ...it, onSelect: () => (closeMenu(false), it.onSelect()) },
            )}
            onClose={() => closeMenu()}
            className="w-full"
          />
        </div>
      )}
      {dialog && (
        <ProfileDialog
          player={dialog.player}
          tab={dialog.tab}
          onTab={(tab) => setDialog({ ...dialog, tab })}
          isMe={dialog.player.id === me.id}
          friendLabel={friendLabel(dialog.player)}
          canRequest={canRequest(dialog.player)}
          onRequest={() => request(dialog.player)}
          onClose={() => setDialog(null)}
        />
      )}
    </ProfileContext.Provider>
  );
}

const HISTORY_COLS = "grid-cols-[64px_1fr_1fr_72px_48px]";

function ProfileDialog({ player: p, tab, onTab, isMe, friendLabel, canRequest, onRequest, onClose }: {
  player: Player;
  tab: Tab;
  onTab: (t: Tab) => void;
  isMe: boolean;
  friendLabel: string;
  canRequest: boolean;
  onRequest: () => void;
  onClose: () => void;
}) {
  const data = useMemo(() => mockProfile(p), [p]);
  const idBase = "profile";
  return (
    <Dialog
      title="Hồ sơ người chơi"
      size="md"
      onClose={onClose}
      actions={
        <>
          <Button
            icon={<Icon name="user" size={16} />}
            onClick={() => {
              location.hash = isMe ? "#/profile" : `#/profile/${encodeURIComponent(p.id)}`;
              onClose();
            }}
          >
            Xem hồ sơ đầy đủ
          </Button>
          {isMe ? (
            <Button onClick={onClose}>Đóng</Button>
          ) : (
            <Button variant="primary" icon={<Icon name={canRequest ? "user-plus" : "check"} size={16} />} disabled={!canRequest} onClick={onRequest}>
              {friendLabel}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={p.name} source={p.avatar} size="xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-heading text-2xl font-semibold text-tone-state" title={p.name}>{p.name}</span>
              {isMe && <span className="shrink-0 font-body text-sm text-tone-text/70">(bạn)</span>}
            </span>
            <span className="flex items-center gap-2 font-body text-md">
              <StatusDot status={p.status} size={10} /> {p.activity ?? PRESENCE_LABEL[p.status]}
              {p.ping !== undefined && <PingIndicator ms={p.ping} showValue />}
            </span>
          </div>
        </div>

        <Tabs
          label="Hồ sơ"
          idBase={idBase}
          value={tab}
          onChange={onTab}
          items={[
            { value: "info", label: "Thông tin" },
            { value: "history", label: "Lịch sử đấu" },
          ]}
        />
        {/* Fixed height: switching tabs never resizes the dialog. */}
        <div className="h-[262px]">
          {tab === "info" ? (
            <TabPanel idBase={idBase} value="info" className="flex flex-col gap-3">
              <dl className="m-0 grid grid-cols-3 gap-2 font-body">
                {[
                  ["Số trận", String(data.matches)],
                  ["Tỉ lệ thắng", `${data.winRate}%`],
                  ["Điểm", String(data.elo)],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col items-center bg-black/40 py-2 bevel-sunken-2">
                    <dt className="text-sm text-tone-text/70">{k}</dt>
                    <dd className="m-0 font-heading text-xl font-semibold tabular text-tone-state">{v}</dd>
                  </div>
                ))}
              </dl>
              <dl className="m-0 grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 bg-black/40 px-3 py-2 font-body text-md bevel-sunken-2">
                <dt className="text-tone-text/70">Hạng</dt>
                <dd className="m-0 text-tone-state">{p.rank ?? "Chưa xếp hạng"}</dd>
                <dt className="text-tone-text/70">Thể loại hay chơi</dt>
                <dd className="m-0 text-tone-state">{data.favourite}</dd>
                <dt className="text-tone-text/70">Thắng / thua</dt>
                <dd className="m-0 tabular text-tone-state">{data.wins} / {data.matches - data.wins}</dd>
                <dt className="text-tone-text/70">Quan hệ</dt>
                <dd className="m-0 text-tone-state">{isMe ? "Bạn" : canRequest ? "Chưa kết bạn" : friendLabel}</dd>
              </dl>
            </TabPanel>
          ) : (
            <TabPanel idBase={idBase} value="history">
              <div role="table" aria-label="Lịch sử đấu" className="bg-black/65 font-body text-sm bevel-sunken-2">
                <div role="row" className={`grid ${HISTORY_COLS} gap-2 px-3 py-1.5 text-xs font-bold uppercase text-tone-text/60`}>
                  <span role="columnheader">Kết quả</span>
                  <span role="columnheader">Thể loại</span>
                  <span role="columnheader">Loại map</span>
                  <span role="columnheader" className="text-right">Thời gian</span>
                  <span role="columnheader" className="text-right">Điểm</span>
                </div>
                {data.history.map((m, i) => (
                  <div key={i} role="row" title={m.ago} className={`grid ${HISTORY_COLS} gap-2 border-t border-white/10 px-3 py-1.5 text-tone-text`}>
                    <span role="cell" className={m.win ? "font-bold text-success-on-dark" : "font-bold text-danger-on-dark"}>{m.win ? "Thắng" : "Thua"}</span>
                    <span role="cell" className="truncate">{m.gameType}</span>
                    <span role="cell" className="truncate">{m.map}</span>
                    <span role="cell" className="text-right tabular">{m.minutes} ph</span>
                    <span role="cell" className={`text-right tabular ${m.elo > 0 ? "text-success-on-dark" : "text-danger-on-dark"}`}>{m.elo > 0 ? `+${m.elo}` : m.elo}</span>
                  </div>
                ))}
              </div>
            </TabPanel>
          )}
        </div>
      </div>
    </Dialog>
  );
}

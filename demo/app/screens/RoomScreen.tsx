import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import {
  Avatar, Button, Checkbox, Dialog, GameIcon, Icon, PingIndicator, PlayerChip, SearchBar, Select, StatusDot,
  type MenuEntry, type Player,
} from "../../../components";
import { CIVS, civLabel, civStyle, type CivChoice } from "../civs";
import { MockCheck, MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import { useMentionTarget, useProfile } from "../profile";
import { buildProfileData } from "../profileMock";
import { playTauntFromText } from "../taunts";
import {
  GAME_TYPES, MAP_TYPES, PLAYER_SEATS, SPECTATOR_SEATS, defaultCiv, isModeratorSeat,
  type RoomMockConfig, type RoomRole, type RoomSession, type RoomSettings, type Seat,
} from "../roomMock";
import { ChatBox, LINE, PanelFooter, PanelTitle } from "./panel";

const CATEGORY_LABEL = { random: "Random", cungr: "Cung R", clan: "Clan Rooms" } as const;

export interface RoomScreenMock {
  config: RoomMockConfig;
  /** How the user entered (for "Đặt lại"). */
  initial: RoomMockConfig;
  onConfig: (cfg: RoomMockConfig) => void;
  onModerator: (on: boolean) => void;
}

/** A seat: one of the 8 player seats or one of the 6 spectator seats. */
type SlotRef = { kind: "player" | "spec"; i: number };
const slotKey = (r: SlotRef) => `${r.kind}-${r.i}`;
const sameSlot = (a: SlotRef, b: SlotRef) => a.kind === b.kind && a.i === b.i;

type MyPlace = { kind: "player"; index: number } | { kind: "spectator"; index: number } | null;

function findMe(s: RoomSession, me: Player): MyPlace {
  const p = s.seats.findIndex((x) => x?.player.id === me.id);
  if (p >= 0) return { kind: "player", index: p };
  const w = s.spectators.findIndex((x) => x?.id === me.id);
  return w >= 0 ? { kind: "spectator", index: w } : null;
}

const CIV_OPTIONS: { value: CivChoice; label: string; icon: ReactNode }[] = [
  { value: "random", label: civLabel("random"), icon: <Icon name="refresh" size={16} /> },
  ...CIVS.map((c) => ({ value: c.id as CivChoice, label: c.label, icon: <GameIcon set={`building:${c.style}`} frame={0} size={16} /> })),
];

/**
 * T4 — Phòng chơi, opened by "Tạo phòng", "Vào" or "Vào xem" in the lobby.
 * Players 1–4 on the left, room chat in the middle, players 5–8 on the right; below, 6 spectator seats
 * ([QTV] 4 regular [QTV]); at the bottom the navigation buttons.
 * Clicking a seat card opens its context menu (profile / kick for a player; sit / close / open for an empty
 * seat). The host drags people between player seats and the 4 regular spectator seats, and picks civs.
 */
export function RoomScreen({ session, me, moderator, onChange, onLeave, onLaunch, mock }: {
  session: RoomSession;
  me: Player;
  /** The viewer is a moderator (QTV): may take the 2 outer spectator seats. */
  moderator: boolean;
  onChange: (next: RoomSession) => void;
  onLeave: () => void;
  /** The countdown ended: the app launches the game (LaunchBar). */
  onLaunch: (detail: string) => void;
  /** Review-only fake-data panel: edits the config the session is built from. */
  mock: RoomScreenMock;
}) {
  const { room, seats, spectators } = session;
  const [notice, setNotice] = useState<string | null>(null);
  const profile = useProfile();
  const [mention, setMention] = useState<{ text: string; id: number } | null>(null);
  useMentionTarget("chat phòng", (text) => setMention({ text, id: Date.now() }));
  const place = findMe(session, me);
  const mySeat = place?.kind === "player" ? seats[place.index] : null;
  const isHost = place?.kind === "player" && place.index === 0;
  const playing = room.status === "playing";

  const filled = seats.filter((s): s is Seat => s !== null);
  // The host (seat 1) starts the match and is never counted as "not ready".
  const notReady = seats.slice(1).filter((s) => s && !s.ready).length;
  const startBlock = filled.length < 2 ? "Cần ít nhất 2 người chơi." : notReady > 0 ? `${notReady} người chưa sẵn sàng.` : null;

  // Start: when "Bỏ qua sảnh chờ game" is on, 5s countdown (Huỷ stops it), then launch;
  // when off, launch directly. TODO(backend): send startNow / skip-lobby flag to backend.
  const [count, setCount] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [positionsLocked, setPositionsLocked] = useState(false);
  const [kicked, setKicked] = useState(false);
  const launchMatch = () => {
    const mapLabel = MAP_TYPES.find((m) => m.value === session.settings.map)?.label ?? session.settings.map;
    const typeLabel = GAME_TYPES.find((g) => g.value === session.settings.gameType)?.label ?? session.settings.gameType;
    onChange(say({ ...session, room: { ...room, status: "playing" } }, "Trận đấu bắt đầu!"));
    onLaunch(`Phòng #${room.code} · ${mapLabel} · ${typeLabel}${session.settings.startNow ? " · Bỏ qua sảnh chờ game" : ""}`);
  };
  useEffect(() => {
    if (count === null) return;
    if (count <= 0) {
      setCount(null);
      launchMatch();
      return;
    }
    const timer = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastChatId = useRef<string | undefined>(session.chat[session.chat.length - 1]?.id);
  useEffect(() => {
    const latest = session.chat[session.chat.length - 1];
    if (!latest || latest.id === lastChatId.current) return;
    lastChatId.current = latest.id;
    if (latest.kind === "user") playTauntFromText(latest.text);
  }, [session.chat]);
  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      setCount(null);
      onChange(say({ ...session, room: { ...room, status: "playing" } }, "Trận đấu bắt đầu!"));
      onLaunch(room.name);
      return;
    }
    const t = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  const system = (text: string) => ({ id: `sys-${Date.now()}-${Math.random()}`, kind: "system" as const, text, at: new Date().toISOString() });
  const say = (s: RoomSession, text: string): RoomSession => ({ ...s, chat: [...s.chat, system(text)] });

  // ---- Seats

  const occupant = (r: SlotRef): Player | null => (r.kind === "player" ? seats[r.i]?.player ?? null : spectators[r.i]);
  const isClosed = (r: SlotRef) => (r.kind === "player" ? session.closedSeats[r.i] : session.closedSpectators[r.i]);
  const seatName = (r: SlotRef) => (r.kind === "player" ? `ghế ${r.i + 1}` : isModeratorSeat(r.i) ? "ghế QTV" : "ghế khán giả");
  /** Host seat (1) and QTV seats are fixed: never dragged into / out of by the host, never closed. */
  const fixed = (r: SlotRef) => (r.kind === "player" ? r.i === 0 : isModeratorSeat(r.i));

  /** Put `p` at `r` (null = empty it). Keeps ready / civ when a player stays a player. */
  const put = (s: RoomSession, r: SlotRef, p: Player | null, from?: Seat | null): RoomSession => {
    if (r.kind === "player") {
      const next = [...s.seats];
      next[r.i] = p ? { player: p, ready: from?.ready ?? false, civ: from?.civ ?? defaultCiv(s.settings.gameType) } : null;
      return { ...s, seats: next };
    }
    const next = [...s.spectators];
    next[r.i] = p;
    return { ...s, spectators: next };
  };

  const without = (s: RoomSession, id: string): RoomSession => ({
    ...s,
    seats: s.seats.map((x) => (x?.player.id === id ? null : x)),
    spectators: s.spectators.map((x) => (x?.id === id ? null : x)),
  });

  // Me (not the host) taking a free seat. Locking positions prevents regular players from moving freely,
  // while QTV (moderators) and host seat management remain unlocked.
  const canSit = (r: SlotRef) =>
    (!positionsLocked || moderator) &&
    place !== null && !isHost && !occupant(r) && !isClosed(r) &&
    (r.kind === "player" ? !playing : (!isModeratorSeat(r.i) || moderator) && !(playing && place.kind === "player"));
  const sitAt = (r: SlotRef) => {
    let next = put(without(session, me.id), r, me);
    if (place?.kind !== (r.kind === "player" ? "player" : "spectator")) next = say(next, r.kind === "player" ? `${me.name} vào chơi.` : `${me.name} chuyển sang xem.`);
    onChange(next);
  };

  // Host: drag & drop between player seats and the 4 regular spectator seats (swap when occupied).
  const canDrag = (r: SlotRef) => isHost && occupant(r) !== null && !fixed(r);
  const canDrop = (from: SlotRef, to: SlotRef) =>
    isHost && !sameSlot(from, to) && !fixed(to) && !isClosed(to) &&
    // A running match: nobody moves between players and spectators.
    !(playing && from.kind !== to.kind);
  const move = (from: SlotRef, to: SlotRef) => {
    const p = occupant(from);
    const q = occupant(to);
    if (!p) return;
    const pSeat = from.kind === "player" ? seats[from.i] : null;
    const qSeat = to.kind === "player" ? seats[to.i] : null;
    let next = put(put(session, to, p, pSeat), from, q, qSeat);
    next = say(next, q ? `Chủ phòng đổi chỗ ${p.name} và ${q.name}.` : `Chủ phòng chuyển ${p.name} sang ${seatName(to)}.`);
    onChange(next);
  };

  const kick = (r: SlotRef) => {
    const p = occupant(r);
    if (p) onChange(say(put(session, r, null), `${p.name} đã bị chủ phòng mời ra khỏi phòng.`));
  };
  const setClosed = (r: SlotRef, closed: boolean) => {
    const key = r.kind === "player" ? "closedSeats" : "closedSpectators";
    const list = [...session[key]];
    list[r.i] = closed;
    onChange(say({ ...session, [key]: list }, `Chủ phòng ${closed ? "đóng" : "mở"} ${seatName(r)}${r.kind === "player" ? "" : ` ${r.i}`}.`));
  };

  const openCardMenu = (r: SlotRef, anchor: HTMLElement, point?: { x: number; y: number }) => {
    const p = occupant(r);
    if (p) {
      const extra: MenuEntry[] =
        isHost && p.id !== me.id
          ? [{ id: "sep-host", kind: "divider" }, { id: "kick", label: "Kích khỏi phòng", icon: "ban", danger: true, onSelect: () => kick(r) }]
          : [];
      profile.open(p, anchor, extra, point);
      return;
    }
    // Empty seat: one tap, no menu (user 13/11) — the host closes / opens it, anyone else sits down.
    if (isHost && !fixed(r)) setClosed(r, !isClosed(r));
    else if (canSit(r)) sitAt(r);
  };

  // Drag state (host only).
  const [drag, setDrag] = useState<SlotRef | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const cardProps = (r: SlotRef): HTMLAttributes<HTMLDivElement> & { draggable?: boolean; "data-drop"?: string } => {
    const key = slotKey(r);
    const dragOK = canDrag(r);
    const dropOK = drag !== null && canDrop(drag, r);
    return {
      role: "button",
      tabIndex: 0,
      onClick: (e: MouseEvent<HTMLDivElement>) => openCardMenu(r, e.currentTarget, { x: e.clientX, y: e.clientY }),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCardMenu(r, e.currentTarget);
        }
      },
      draggable: dragOK || undefined,
      onDragStart: dragOK
        ? (e: DragEvent<HTMLDivElement>) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", key);
            setDrag(r);
          }
        : undefined,
      onDragEnd: () => {
        setDrag(null);
        setOver(null);
      },
      onDragOver: dropOK
        ? (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (over !== key) setOver(key);
          }
        : undefined,
      onDragLeave: () => over === key && setOver(null),
      onDrop: dropOK
        ? (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (drag) move(drag, r);
            setDrag(null);
            setOver(null);
          }
        : undefined,
      "data-drop": drag && sameSlot(drag, r) ? "source" : over === key ? "over" : dropOK ? "can" : undefined,
    };
  };

  // ---- Settings (host edits, each change announced; others read-only)

  const setSetting = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K], text: string) =>
    onChange(say({ ...session, settings: { ...session.settings, [key]: value } }, `Chủ phòng đổi ${text}.`));
  const setGameType = (v: RoomSettings["gameType"]) => {
    // The game type sets everyone's civ back to its default (Random → random, Cung R Shang → Shang).
    const civ = defaultCiv(v);
    onChange(
      say(
        { ...session, settings: { ...session.settings, gameType: v }, seats: seats.map((s) => (s ? { ...s, civ } : s)) },
        `Chủ phòng đổi thể loại: ${GAME_TYPES.find((g) => g.value === v)?.label} — đế chế của mọi người về ${civLabel(civ)}.`,
      ),
    );
  };
  const setCiv = (i: number, civ: CivChoice) => onChange({ ...session, seats: seats.map((s, k) => (k === i && s ? { ...s, civ } : s)) });

  const column = (from: number) => (
    <section aria-label={`Người chơi ${from + 1}–${from + 4}`} className="flex min-h-0 w-[340px] shrink-0 flex-col bg-black/55 bevel-raised">
      <PanelTitle>Người chơi {from + 1}–{from + 4}</PanelTitle>
      <div className={`h-px shrink-0 ${LINE}`} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        {seats.slice(from, from + 4).map((s, k) => {
          const i = from + k;
          const r: SlotRef = { kind: "player", i };
          return (
            <PlayerSeat
              key={i}
              index={i}
              seat={s}
              closed={session.closedSeats[i]}
              isMe={s?.player.id === me.id}
              isHost={i === 0}
              hint={!s ? (canSit(r) ? "Bấm để ngồi vào đây" : isHost && i !== 0 ? (session.closedSeats[i] ? "Bấm để mở ghế" : "Bấm để đóng ghế") : null) : null}
              canEditCiv={isHost && !playing}
              onCiv={(civ) => setCiv(i, civ)}
              card={cardProps(r)}
            />
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="tone-screen flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-h-0 flex-1 gap-2">
        {column(0)}

        {/* Middle: room info + room chat */}
        <section aria-label={`Phòng ${room.name}`} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black/55 bevel-raised">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 bg-black/20 px-3 text-shadow-game">
            <h2 className="m-0 min-w-0 flex-1 truncate font-heading text-lg font-semibold text-tone-state" title={room.name}>
              {room.name}
            </h2>
            <div
              aria-label={`Tỉ số ${playing ? "2 - 1" : "0 - 0"}`}
              className="flex shrink-0 items-center gap-2 bg-black/55 px-3.5 py-1 font-heading text-2xl font-bold leading-none tabular text-tone-focus bevel-sunken-1"
            >
              <span>{playing ? 2 : 0}</span>
              <span className="text-tone-text/60">-</span>
              <span>{playing ? 1 : 0}</span>
            </div>
            <span className="flex flex-1 items-center justify-end gap-2 font-body text-sm text-tone-text/80">
              <span className="bg-black/40 px-1.5 py-0.5 font-heading font-semibold tabular text-tone-state bevel-sunken-1">#{room.code}</span>
              <span>{CATEGORY_LABEL[room.category]}</span>
              {room.hasPassword && <Icon name="lock" size={16} label="Có mật khẩu" className="text-tone-focus" />}
              {playing && <span className="text-warning-on-dark">Đang chơi</span>}
            </span>
          </header>
          <div className={`h-px shrink-0 ${LINE}`} />
          <div aria-label="Cài đặt phòng" role="group" className="flex h-12 shrink-0 items-center gap-4 bg-black/20 px-3 font-body text-sm text-tone-text/80 text-shadow-game">
            <div className="flex items-center gap-2">
              <span aria-hidden>Loại map</span>
              <Select
                className="w-48"
                aria-label="Loại map"
                controlSet="scr2"
                disabled={!isHost || playing}
                options={MAP_TYPES}
                value={session.settings.map}
                onChange={(v) => setSetting("map", v, `loại map: ${MAP_TYPES.find((m) => m.value === v)?.label}`)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>Thể loại</span>
              <Select
                className="w-44"
                aria-label="Thể loại"
                controlSet="scr2"
                disabled={!isHost || playing}
                options={GAME_TYPES}
                value={session.settings.gameType}
                onChange={setGameType}
              />
            </div>
            <Checkbox
              // Same as the dropdowns beside it: 32px with the field frame, 26px face like their button.
              // Read-only for non-hosts or while a match is running.
              size={32}
              labelPosition="left"
              variant="drawn"
              controlSet="scr2"
              label="Bỏ qua sảnh chờ game"
              disabled={!isHost || playing}
              checked={session.settings.startNow}
              onChange={(e) => setSetting("startNow", e.target.checked, e.target.checked ? "bật bỏ qua sảnh chờ game" : "tắt bỏ qua sảnh chờ game")}
            />
            {playing ? (
              <span className="ml-auto text-xs text-warning-on-dark">Đang chơi — đã khoá cài đặt</span>
            ) : !isHost ? (
              <span className="ml-auto text-xs text-tone-text/60">Chỉ chủ phòng đổi được</span>
            ) : null}
          </div>
          <div className={`h-px shrink-0 ${LINE}`} />
          <ChatBox
            title="Chat phòng"
            showTitle={false}
            messages={session.chat}
            onSend={(text) => {
              playTauntFromText(text);
              onChange({ ...session, chat: [...session.chat, { id: `me-${Date.now()}`, kind: "own", author: me, text, at: new Date().toISOString() }] });
            }}
            onAuthorClick={profile.open}
            insert={mention}
          />
        </section>

        {column(4)}
      </div>

      {/* Spectators: [QTV] 4 regular [QTV] (QTV seats only visible to moderators) */}
      <section aria-label="Khán giả" className="flex shrink-0 gap-2 bg-black/55 p-2 bevel-raised">
        {spectators.map((p, i) => {
          if (isModeratorSeat(i) && !moderator) return null;
          return (
            <SpectatorSeat
              key={i}
              player={p}
              closed={session.closedSpectators[i]}
              isMe={p?.id === me.id}
              moderatorSeat={isModeratorSeat(i)}
              card={cardProps({ kind: "spec", i })}
            />
          );
        })}
      </section>

      {/* Navigation */}
      <nav aria-label="Điều hướng phòng" className="flex shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised">
        <PanelFooter>
          <span role="status" className="min-w-0 flex-1 truncate px-2">
            {notice ??
              (place?.kind === "spectator"
                ? `Bạn đang xem${playing ? " trận đấu" : ""} · ${filled.length}/8 người chơi`
                : isHost
                  ? `Bạn là chủ phòng · ${filled.length}/8 người chơi${startBlock ? ` · ${startBlock}` : " · Mọi người đã sẵn sàng"} · kéo thả để xếp chỗ`
                  : `${filled.length}/8 người chơi${notReady ? ` · ${notReady} chưa sẵn sàng` : ""}`)}
          </span>
          <Button icon={<Icon name="user-plus" size={16} />} onClick={() => setInviteOpen(true)}>
            Mời bạn
          </Button>
          {isHost && (
            <Button
              variant={positionsLocked ? "primary" : "secondary"}
              aria-pressed={positionsLocked}
              icon={<Icon name="lock" size={16} />}
              disabled={playing}
              onClick={() => {
                const next = !positionsLocked;
                setPositionsLocked(next);
                onChange(say(session, next ? "Chủ phòng đã khoá vị trí." : "Chủ phòng đã mở khoá vị trí."));
              }}
            >
              {positionsLocked ? "Đã khoá vị trí" : "Khoá vị trí"}
            </Button>
          )}
          {isHost && (
            <Button
              variant="primary"
              className="min-w-[132px]"
              disabled={Boolean(startBlock) || playing || count !== null}
              title={playing ? "Trận đấu đang diễn ra" : startBlock ?? undefined}
              onClick={() => {
                setNotice(null);
                if (session.settings.startNow) {
                  setCount(5);
                } else {
                  launchMatch();
                }
              }}
            >
              {playing ? "Đang chơi" : "Bắt đầu"}
            </Button>
          )}
          {mySeat && !isHost && (
            <Button
              variant="primary"
              className="min-w-[132px]"
              disabled={playing}
              onClick={() => {
                const next = seats.map((s) => (s?.player.id === me.id ? { ...s, ready: !s.ready } : s));
                onChange({ ...session, seats: next });
              }}
            >
              {mySeat.ready ? "Huỷ sẵn sàng" : "Sẵn sàng"}
            </Button>
          )}
          <Button icon={<Icon name="logout" size={16} />} onClick={() => setConfirmLeave(true)}>Rời phòng</Button>
        </PanelFooter>
      </nav>

      {count !== null && (
        <div className="fixed inset-0 z-modal flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[1px]" role="alertdialog" aria-modal="true" aria-label="Đếm ngược bắt đầu trận">
          <p className="m-0 font-heading text-2xl font-semibold text-tone-state text-shadow-game">Trận đấu bắt đầu sau</p>
          <span
            key={count}
            aria-live="assertive"
            className="font-heading text-[180px] font-bold leading-[1.25] text-tone-focus tabular [text-shadow:4px_4px_0_#000] motion-safe:animate-[countdown_1s_cubic-bezier(0.22,1,0.36,1)]"
          >
            {count}
          </span>
          <Button autoFocus onClick={() => setCount(null)}>Huỷ</Button>
        </div>
      )}

      {kicked && (
        <Dialog
          title="Bạn đã bị mời ra khỏi phòng"
          size="sm"
          description={`Chủ phòng đã mời bạn ra khỏi phòng #${room.code} (${room.name}).`}
          onClose={onLeave}
          actions={
            <Button variant="primary" onClick={onLeave}>
              Về sảnh đấu
            </Button>
          }
        >
          <span />
        </Dialog>
      )}

      {confirmLeave && (
        <Dialog
          title="Rời phòng?"
          size="sm"
          description={isHost ? `Bạn là chủ phòng #${room.code}. Rời đi thì quyền chủ phòng chuyển cho người khác.` : `Bạn sẽ rời phòng #${room.code}.`}
          onClose={() => setConfirmLeave(false)}
          actions={
            <>
              <Button onClick={() => setConfirmLeave(false)}>Ở lại</Button>
              <Button variant="danger" icon={<Icon name="logout" size={16} />} onClick={onLeave}>Rời phòng</Button>
            </>
          }
        >
          <span />
        </Dialog>
      )}

      {inviteOpen && (
        <InviteFriendsDialog
          me={me}
          roomCode={room.code}
          roomName={room.name}
          occupiedIds={new Set([
            ...seats.flatMap((s) => (s ? [s.player.id] : [])),
            ...spectators.flatMap((p) => (p ? [p.id] : [])),
          ])}
          onInvite={(friend) => {
            setNotice(`Đã gửi lời mời vào phòng #${room.code} tới ${friend.name}.`);
            onChange(say(session, `Đã mời ${friend.name} vào phòng.`));
          }}
          onCopyCode={() => setNotice(`Đã sao chép mã phòng #${room.code}.`)}
          onClose={() => setInviteOpen(false)}
        />
      )}

      <RoomMockPanel {...mock} moderator={moderator} onKicked={() => setKicked(true)} />
    </div>
  );
}

const ROLES: { value: RoomRole; label: string }[] = [
  { value: "host", label: "Chủ phòng" },
  { value: "player", label: "Người chơi" },
  { value: "spectator", label: "Khán giả" },
];

/** "⚙ Dữ liệu giả" for the room: rebuilds the session from these numbers. */
function RoomMockPanel({
  config,
  initial,
  onConfig,
  onModerator,
  moderator,
  onKicked,
}: RoomScreenMock & {
  moderator: boolean;
  onKicked: () => void;
}) {
  const set = (patch: Partial<RoomMockConfig>) => onConfig({ ...config, ...patch });
  const num = (k: "players" | "spectators" | "readyPercent" | "chatCount", label: string, min: number, max: number, unit = "") => (
    <MockSlider label={label} value={config[k]} min={min} max={max} unit={unit} changed={config[k] !== initial[k]} onChange={(v) => set({ [k]: v })} />
  );
  return (
    <MockShell
      title="Điều khiển dữ liệu giả — Phòng"
      actions={[{ label: "Giả lập bị kích", onClick: onKicked }]}
      onReset={() => onConfig(initial)}
    >
      <MockGroup>Bạn là</MockGroup>
      <MockChoice label="Vai của bạn" options={ROLES} value={config.role} onChange={(role) => set({ role, players: Math.max(config.players, role === "player" ? 2 : 1), spectators: role === "spectator" ? Math.max(config.spectators, 1) : config.spectators })} />
      <div className="mt-1.5">
        <MockCheck label="Là QTV (+2 ghế khán giả)" checked={moderator} onChange={onModerator} />
      </div>
      <MockGroup>Số lượng</MockGroup>
      {num("players", "Người chơi", 1, PLAYER_SEATS)}
      {num("spectators", "Khán giả", 0, SPECTATOR_SEATS)}
      {num("readyPercent", "Đã sẵn sàng", 0, 100, "%")}
      {num("chatCount", "Tin chat có sẵn", 0, 30)}
      <MockGroup>Trận đấu</MockGroup>
      <MockCheck label="Đang chơi (khoá ghế người chơi)" checked={config.playing} onChange={(playing) => set({ playing })} />
    </MockShell>
  );
}

// Card frame + drag feedback: "can" = valid drop target while dragging, "over" = under the pointer,
// "source" = the card being dragged.
const CARD =
  "relative outline-none focus-visible:outline-game-out focus-visible:-outline-offset-2 " +
  "data-[drop=can]:outline data-[drop=can]:outline-1 data-[drop=can]:-outline-offset-2 data-[drop=can]:outline-dashed data-[drop=can]:outline-tone-focus/60 " +
  "data-[drop=over]:outline data-[drop=over]:outline-2 data-[drop=over]:-outline-offset-2 data-[drop=over]:outline-tone-focus data-[drop=over]:bg-tone-bevel-0/25 " +
  "data-[drop=source]:opacity-40 [&[draggable=true]]:cursor-grab " +
  // A card whose civ dropdown is open (focus inside) sits above the cards after it, so its list isn't covered.
  "focus-within:z-20";

/** Stops clicks / keys / drags inside a control from reaching the card (menu, drag). */
const isolate = {
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onDragStart: (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  },
};

function PlayerSeat({ index, seat, closed, isMe, isHost, hint, canEditCiv, onCiv, card }: {
  index: number;
  seat: Seat | null;
  closed: boolean;
  isMe: boolean;
  isHost: boolean;
  hint: string | null;
  canEditCiv: boolean;
  onCiv: (civ: CivChoice) => void;
  card: HTMLAttributes<HTMLDivElement>;
}) {
  if (!seat) {
    return (
      <div
        {...card}
        aria-label={`Ghế ${index + 1} ${closed ? "đã đóng" : "trống"}`}
        className={`${CARD} flex min-h-0 flex-1 items-center gap-3 px-3 text-left bevel-sunken-1 ${
          closed ? "bg-black/60 text-tone-text/40" : "bg-black/30 text-tone-text/60 hover:bg-black/20 hover:text-tone-focus"
        }`}
      >
        {closed && <Icon name="lock" size={20} />}
        <span className="flex flex-col">
          <span className="font-body text-md italic">{closed ? "Ghế đã đóng" : "Ghế trống"}</span>
          {hint && <span className="font-body text-xs">{hint}</span>}
        </span>
      </div>
    );
  }
  const p = seat.player;
  const style = civStyle(seat.civ);
  return (
    <div
      {...card}
      aria-label={`Ghế ${index + 1}: ${p.name}`}
      className={`${CARD} player-card ${seat.ready ? "is-ready" : ""} flex min-h-0 flex-1 items-center gap-3 px-3 text-left hover:brightness-110`}
    >
      <Avatar name={p.name} source={p.avatar} size="2xl" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 self-center pb-6">
        <span className="flex min-w-0 items-center gap-1.5">
          {isHost && <Icon name="crown" size={16} label="Chủ phòng" className="shrink-0 text-tone-focus" />}
          <StatusDot status={p.status} size={8} />
          <span className={`truncate font-body text-lg ${isMe ? "text-tone-focus" : "text-tone-state"}`} title={p.name}>{p.name}</span>
        </span>
        <span className="flex items-center gap-2 font-body text-sm text-tone-text/70">
          {p.rank ?? "Chưa xếp hạng"}
          <PingIndicator ms={p.ping ?? null} />
        </span>
      </span>

      {/* Top-right: host badge or unready chip (ready state uses the green left border). */}
      {(isHost || !seat.ready) && (
        <span
          className={`absolute right-2 top-2 px-1.5 py-0.5 font-heading text-xs font-semibold ${
            isHost ? "bg-black/50 text-tone-focus" : "bg-black/50 text-tone-text/70 bevel-sunken-1"
          }`}
        >
          {isHost ? "Chủ phòng" : "Chưa sẵn sàng"}
        </span>
      )}

      {/* Bottom-right: civilization — a dropdown for the host, a tag for everyone else. */}
      <span className="absolute bottom-2 right-2" {...isolate}>
        {canEditCiv ? (
          <Select<CivChoice>
            size="sm"
            className="w-[150px]"
            controlSet="scr2"
            aria-label={`Đế chế của ${p.name}`}
            options={CIV_OPTIONS}
            value={seat.civ}
            onChange={onCiv}
          />
        ) : (
          <span className="flex h-6 items-center gap-1.5 bg-black/50 px-2 font-body text-sm text-tone-state bevel-sunken-1" title={`Đế chế: ${civLabel(seat.civ)}`}>
            {style ? <GameIcon set={`building:${style}`} frame={0} size={16} /> : <Icon name="refresh" size={12} />}
            {civLabel(seat.civ)}
          </span>
        )}
      </span>
    </div>
  );
}

function SpectatorSeat({ player, closed, isMe, moderatorSeat, card }: {
  player: Player | null;
  closed: boolean;
  isMe: boolean;
  moderatorSeat: boolean;
  card: HTMLAttributes<HTMLDivElement>;
}) {
  // QTV seats sit on the marble texture of the theme store (dlg6_1), like the "Vào xem" button.
  const base = moderatorSeat ? "surface-dialog" : closed ? "bg-black/60" : player ? "bg-black/40" : "bg-black/30";
  const label = moderatorSeat ? (
    <span className="flex items-center gap-1 font-heading text-xs font-semibold uppercase text-tone-state">
      <Icon name="shield" size={12} /> Ghế QTV
    </span>
  ) : (
    <span className="font-heading text-xs font-semibold uppercase text-tone-text/60">Khán giả</span>
  );
  const body = player ? (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={player.name} source={player.avatar} size="md" />
      <span className={`truncate font-body text-md ${isMe ? "text-tone-focus" : "text-tone-state"}`} title={player.name}>{player.name}</span>
    </span>
  ) : closed ? (
    <span className="flex items-center gap-1.5 font-body text-md italic text-tone-text/40"><Icon name="lock" size={16} /> Đã đóng</span>
  ) : (
    <span className="font-body text-md italic text-tone-text/60">Trống</span>
  );
  // Marble is light: a heavier shade keeps the seat text readable.
  const shade = moderatorSeat ? ({ "--dlg-shade": 0.6 } as CSSProperties) : undefined;
  return (
    <div
      {...card}
      aria-label={player ? `${moderatorSeat ? "Ghế QTV" : "Khán giả"}: ${player.name}` : `${moderatorSeat ? "Ghế QTV" : "Ghế khán giả"} ${closed ? "đã đóng" : "trống"}`}
      data-dialog-theme={moderatorSeat ? "dlg6_1" : undefined}
      style={shade}
      className={`${CARD} flex h-[68px] min-w-0 flex-1 flex-col justify-center gap-1 px-3 text-left text-shadow-game hover:brightness-110 ${base} ${
        isMe ? "bevel-raised-2" : "bevel-sunken-1"
      }`}
    >
      {label}
      {body}
    </div>
  );
}

function InviteFriendsDialog({
  me,
  roomCode,
  roomName,
  occupiedIds,
  onInvite,
  onCopyCode,
  onClose,
}: {
  me: Player;
  roomCode: string;
  roomName: string;
  occupiedIds: Set<string>;
  onInvite: (friend: Player) => void;
  onCopyCode: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(() => new Set());

  const friends = useMemo(() => {
    const list = buildProfileData(me).friends;
    const q = query.trim().toLowerCase();
    return list
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => Number(a.status === "offline") - Number(b.status === "offline"));
  }, [me, query]);

  return (
    <Dialog
      size="md"
      title="Mời bạn vào phòng"
      description={`Phòng #${roomCode} · ${roomName}`}
      onClose={onClose}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard?.writeText(`#${roomCode}`).catch(() => {});
              onCopyCode();
            }}
          >
            Sao chép mã #{roomCode}
          </Button>
          <Button variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <SearchBar
          label="Tìm bạn bè"
          placeholder="Tìm theo tên bạn bè…"
          size="md"
          onSearch={setQuery}
        />
        <ul className="m-0 flex max-h-72 list-none flex-col divide-y divide-white/10 overflow-y-auto bg-black/45 p-0 bevel-sunken-1">
          {friends.length === 0 && (
            <li className="px-3 py-4 text-center font-body text-sm text-tone-text/60">
              Không tìm thấy bạn bè phù hợp.
            </li>
          )}
          {friends.map((f) => {
            const inRoom = occupiedIds.has(f.id);
            const offline = f.status === "offline";
            const invited = invitedIds.has(f.id);
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <PlayerChip player={f} showActivity avatarSize="md" className="min-w-0 flex-1" />
                <Button
                  size="sm"
                  variant={invited || inRoom || offline ? "secondary" : "primary"}
                  disabled={invited || inRoom || offline}
                  onClick={() => {
                    setInvitedIds((prev) => new Set(prev).add(f.id));
                    onInvite(f);
                  }}
                >
                  {inRoom ? "Trong phòng" : offline ? "Ngoại tuyến" : invited ? "Đã mời" : "Mời"}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}

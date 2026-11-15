import { useMemo, useState } from "react";
import {
  Badge, Button, Checkbox, Dialog, EmptyState, FormField, Icon, IconButton, Input, ListRow, PingIndicator, PlayerChip, SearchBar, Spinner,
  type Player,
} from "../../../components";
import { MockPanel } from "../MockPanel";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { getPlayerClan } from "../clanMock";
import { useMentionTarget, useProfile } from "../profile";
import { ChatBox, LINE, PanelFooter, PanelTitle } from "./panel";
import { spectatorLimit, type LobbyCategory, type LobbyMock, type LobbyRoom } from "../lobbyMock";
import type { EnterMode } from "../roomMock";

const CATEGORIES: { id: LobbyCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "random", label: "RANDOM" },
  { id: "cungr", label: "CUNG R" },
  { id: "clan", label: "CLAN ROOMS" },
];

const CATEGORY_LABEL: Record<Exclude<LobbyCategory, "all">, string> = { random: "Random", cungr: "Cung R", clan: "Clan Rooms" };

// Room table columns: code · name (+ lock) · host · category · seats · ping · action.
const COLS = "grid-cols-[64px_minmax(0,1fr)_160px_110px_56px_48px_96px]";

type RoomAction = { label: "Vào" | "Vào xem" | "Đầy"; enabled: boolean; title?: string };

/**
 * In a match or full of players → watch ("Vào xem"), until the spectator seats are also taken (4,
 * moderators 6) → "Đầy" (disabled); otherwise join ("Vào").
 */
function roomAction(r: LobbyRoom, moderator: boolean): RoomAction {
  const playersFull = r.players >= r.maxPlayers || r.status === "full";
  if (r.status === "playing" || playersFull) {
    const limit = spectatorLimit(moderator);
    const free = r.spectators < limit;
    if (free) {
      return { label: "Vào xem", enabled: true, title: `Khán giả: ${r.spectators}/${limit}` };
    }
    return { label: "Đầy", enabled: false, title: `Đã đủ khán giả: ${r.spectators}/${limit}` };
  }
  return { label: "Vào", enabled: true };
}

// Header controls next to the search field wear the field's own thin frame (no raised molding, no drop
// shadow) so the three line up (user 12/11).
const FIELD_FRAME = "![box-shadow:var(--bv-sunken)]";

// Running matches: the data cells are dimmed, the action button keeps full strength.
const DIM = "opacity-60 group-hover:opacity-90";

/**
 * T3 — Sảnh (simplified first pass). No icon SideNav: a text category list on the left, joined to the
 * room list by a line; on the right online players above, the lobby chat below.
 */
export function LobbyScreen({ me, mock, onEnterRoom }: {
  me: Player;
  /** Lobby mock data, owned by the app so rooms created here survive leaving the lobby. */
  mock: LobbyMock;
  onEnterRoom: (room: LobbyRoom, mode: EnterMode) => void;
}) {
  const { config, setConfig } = mock;
  const [category, setCategory] = useState<LobbyCategory>("all");
  const [creating, setCreating] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<{ room: LobbyRoom; mode: EnterMode } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const profile = useProfile();
  // "@name" from a profile goes into the lobby chat.
  const [mention, setMention] = useState<{ text: string; id: number } | null>(null);
  useMentionTarget("chat tổng", (text) => setMention({ text, id: Date.now() }));

  const counts = useMemo(() => {
    const c: Record<LobbyCategory, number> = { all: mock.rooms.length, random: 0, cungr: 0, clan: 0 };
    mock.rooms.forEach((r) => (c[r.category] += 1));
    return c;
  }, [mock.rooms]);
  const [query, setQuery] = useState("");
  const [myClanOnly, setMyClanOnly] = useState(false);
  const myClan = useMemo(() => getPlayerClan(me), [me]);
  const q = query.trim().toLowerCase().replace(/^#/, "");
  // Waiting rooms first, rooms in a match last (dimmed in the list); order is otherwise kept.
  const rooms = mock.rooms
    .filter(
      (r) =>
        (category === "all" || r.category === category) &&
        (!myClanOnly || category !== "clan" || !myClan || getPlayerClan(r.host)?.tag === myClan.tag) &&
        (!q || r.code.includes(q) || r.name.toLowerCase().includes(q) || r.host.name.toLowerCase().includes(q)),
    )
    .sort((a, b) => Number(a.status === "playing") - Number(b.status === "playing"));

  return (
    <div className="tone-screen flex h-full min-h-0 gap-2">
      {/* Left (categories) | line | body (room list) */}
      <section aria-label="Sảnh" className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-black/55 bevel-raised">
        <nav aria-label="Loại phòng" className="flex w-[200px] shrink-0 flex-col">
          <PanelTitle>Sảnh</PanelTitle>
          <div className={`h-px shrink-0 ${LINE}`} />
          <div role="listbox" aria-label="Loại phòng" className="flex min-h-0 flex-1 flex-col py-1">
            {CATEGORIES.map((c) => (
              <ListRow
                key={c.id}
                role="option"
                tabIndex={0}
                size="lg"
                selected={category === c.id}
                onClick={() => setCategory(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCategory(c.id);
                  }
                }}
                trailing={<span className={`tabular text-sm ${category === c.id ? "text-tone-focus" : "text-tone-text/70"}`}>{config.listState === "normal" ? counts[c.id] : "–"}</span>}
                className="font-heading text-md font-semibold uppercase tracking-wide"
              >
                {c.label}
              </ListRow>
            ))}
          </div>
          <PanelFooter />
        </nav>

        <div aria-hidden className={`w-px shrink-0 ${LINE}`} />

        <div className="flex min-w-0 flex-1 flex-col">
          <PanelTitle
            trailing={
              <>
                {category === "clan" && myClan && (
                  <Checkbox
                    checked={myClanOnly}
                    onChange={(e) => setMyClanOnly(e.target.checked)}
                    label="Phòng của clan tôi"
                    className="mr-2"
                  />
                )}
                <span className="mr-1 font-body text-sm text-tone-text/70">{config.listState === "normal" ? `${rooms.length} phòng${syncedAt ? ` · vừa đồng bộ ${syncedAt}` : ""}` : ""}</span>
                <SearchBar label="Tìm phòng" placeholder="Tìm tên, mã #, chủ phòng…" size="md" onSearch={setQuery} className="w-64" />
                <Button size="md" variant="primary" className={FIELD_FRAME} icon={<Icon name="plus" size={16} />} onClick={() => setCreating(true)}>
                  Tạo phòng
                </Button>
                <IconButton
                  label={syncing ? "Đang đồng bộ…" : "Đồng bộ danh sách phòng"}
                  tooltip="bottom"
                  className={FIELD_FRAME}
                  aria-busy={syncing || undefined}
                  onClick={() => {
                    // Background sync: the list on screen stays; only the button shows it is working.
                    if (syncing) return;
                    setSyncing(true);
                    mock.sync().then(() => {
                      setSyncing(false);
                      setSyncedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
                      if (config.listState === "error") setConfig({ listState: "normal" });
                    });
                  }}
                >
                  {syncing ? <Spinner size={16} /> : <Icon name="refresh" size={16} />}
                </IconButton>
              </>
            }
          >
            Danh sách phòng
          </PanelTitle>
          <div className={`h-px ${LINE}`} />
          <div role="row" className={`grid ${COLS} gap-3 py-1.5 pl-3 pr-7 font-body text-xs font-bold uppercase text-tone-text/70`}>
            <span role="columnheader">Mã phòng</span>
            <span role="columnheader">Tên phòng</span>
            <span role="columnheader">Chủ phòng</span>
            <span role="columnheader" className="text-center">Thể loại</span>
            <span role="columnheader" className="text-center">Người</span>
            <span role="columnheader" className="text-center">Ping</span>
            <span role="columnheader" className="text-center">Thao tác</span>
          </div>
          <div className={`h-px shrink-0 ${LINE}`} />
          <div role="grid" aria-label="Danh sách phòng" aria-busy={config.listState === "loading"} className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <RoomList
              state={config.listState}
              rooms={rooms}
              moderator={config.moderator}
              onAction={(r, a) => {
                const mode: EnterMode = a.label === "Vào xem" ? "watch" : "join";
                if (r.hasPassword && r.host.id !== me.id) {
                  setPendingJoin({ room: r, mode });
                } else {
                  onEnterRoom(r, mode);
                }
              }}
              onRetry={() => setConfig({ listState: "normal" })}
            />
          </div>
          <PanelFooter>
            <span className="px-1">Nhấp đúp vào phòng để vào hoặc xem.</span>
          </PanelFooter>
        </div>
      </section>

      {/* Right: online players over lobby chat (2 separate panels) */}
      <aside aria-label="Người chơi và chat" className="flex min-h-0 w-[360px] shrink-0 flex-col gap-2">
        {/* Online list gets 2 parts of the height, the chat 3. */}
        <section aria-label="Người chơi đang online" className="flex min-h-0 flex-[2] flex-col overflow-hidden bg-black/55 bevel-raised">
          <PanelTitle trailing={<Badge variant="count" count={mock.online.length} max={999} label="người online" />}>Đang online</PanelTitle>
          <div className={`h-px ${LINE}`} />
          <ul className="m-0 min-h-0 flex-1 list-none divide-y divide-white/10 overflow-y-auto p-0">
            {mock.online.length === 0 && <li className="px-3 py-4 font-body text-md text-tone-text/70">Chưa có ai online.</li>}
            {mock.online.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-label={`Hồ sơ ${p.name}`}
                  onClick={(e) => profile.open(p, e.currentTarget)}
                  className="flex w-full px-3 py-1.5 text-left hover:bg-white/5 focus-visible:outline-game-out focus-visible:-outline-offset-2"
                >
                  <PlayerChip player={p} showActivity avatarSize="md" />
                </button>
              </li>
            ))}
          </ul>
        </section>
        <ChatBox
          title="Chat tổng"
          className="flex-[3] overflow-hidden bg-black/55 bevel-raised"
          messages={mock.chat}
          error={config.chatState === "error"}
          onSend={mock.send}
          onAuthorClick={profile.open}
          insert={mention}
        />
      </aside>

      {pendingJoin && (
        <RoomPasswordDialog
          room={pendingJoin.room}
          mode={pendingJoin.mode}
          onClose={() => setPendingJoin(null)}
          onSubmit={() => {
            const target = pendingJoin;
            setPendingJoin(null);
            onEnterRoom(target.room, target.mode);
          }}
        />
      )}

      {creating && (
        <CreateRoomDialog
          defaultName={`Phòng của ${me.name}`}
          defaultCategory={category === "all" ? "random" : category}
          onClose={() => setCreating(false)}
          onCreate={(input) => {
            const room = mock.createRoom(input);
            setCreating(false);
            onEnterRoom(room, "create");
          }}
        />
      )}

      <MockPanel
        title="Điều khiển dữ liệu giả — Sảnh"
        config={config}
        onChange={setConfig}
        onReset={mock.reset}
        actions={[{ label: "+ 1 tin chat", onClick: mock.addIncoming }]}
      />
    </div>
  );
}

function RoomList({ state, rooms, moderator, onAction, onRetry }: {
  state: "normal" | "loading" | "empty" | "error";
  rooms: LobbyRoom[];
  moderator: boolean;
  onAction: (room: LobbyRoom, action: RoomAction) => void;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <div className="flex flex-col gap-1 p-3">
        <span className="mb-1 flex items-center gap-2 font-body text-md text-tone-text/80">
          <Spinner size={24} label="Đang tải danh sách phòng" /> Đang tải danh sách phòng…
        </span>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-9 bg-white/5" />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <EmptyState
        title="Không tải được danh sách phòng"
        description="Kiểm tra kết nối rồi thử lại."
        art={{ set: "building:greek", frame: 4 }}
        action={{ label: "Thử lại", onClick: onRetry }}
      />
    );
  }
  if (state === "empty" || rooms.length === 0) {
    return <EmptyState title="Chưa có phòng nào" description="Loại phòng này đang trống." art={{ set: "building:greek", frame: 4 }} />;
  }
  return (
    <>
      {rooms.map((r) => {
        const action = roomAction(r, moderator);
        const dim = r.status === "playing" ? DIM : "";
        return (
          <div
            key={r.id}
            role="row"
            tabIndex={0}
            onDoubleClick={() => {
              if (action.enabled) onAction(r, action);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (action.enabled) onAction(r, action);
              }
            }}
            className={`group grid ${COLS} items-center gap-3 border-b border-tone-bevel-0/20 px-3 py-1.5 font-body text-md text-tone-text text-shadow-game outline-none hover:bg-white/5 hover:text-tone-focus focus-visible:outline-game-out focus-visible:-outline-offset-2 ${
              action.enabled ? "cursor-pointer" : ""
            }`}
          >
            <span role="gridcell" className={`tabular text-tone-text/80 ${dim}`}>#{r.code}</span>
            <span role="gridcell" className={`flex min-w-0 items-center gap-1.5 ${dim}`}>
              <span className="truncate" title={r.name}>{r.name}</span>
              {r.hasPassword && <Icon name="lock" size={16} label="Có mật khẩu" className="shrink-0 text-tone-focus" />}
            </span>
            <span role="gridcell" className={`truncate ${dim}`}>{r.host.name}</span>
            <span role="gridcell" className={`truncate text-center ${dim}`}>{CATEGORY_LABEL[r.category]}</span>
            <span role="gridcell" className={`tabular text-center ${dim}`}>{r.players}/{r.maxPlayers}</span>
            <span role="gridcell" className={`flex justify-center ${dim}`}><PingIndicator ms={r.ping} /></span>
            <span role="gridcell" className="flex justify-center">
              <Button
                size="sm"
                // "Vào xem" sits on the marble texture of the theme store (dlg6_1): cool grey, apart from the
                // warm wood of "Vào"; when spectator seats are also full, the action becomes "Đầy" (disabled).
                variant={action.label === "Đầy" ? "secondary" : "primary"}
                data-dialog-theme={action.label === "Vào xem" ? "dlg6_1" : undefined}
                disabled={!action.enabled}
                title={action.title}
                className="w-20 disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(r, action);
                }}
              >
                {action.label}
              </Button>
            </span>
          </div>
        );
      })}
    </>
  );
}

function RoomPasswordDialog({
  room,
  mode,
  onClose,
  onSubmit,
}: {
  room: LobbyRoom;
  mode: EnterMode;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <Dialog
      size="sm"
      title="Nhập mật khẩu phòng"
      description={`#${room.code} · ${room.name}`}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (!password.trim()) {
          setError("Nhập mật khẩu phòng.");
          return;
        }
        if (room.password !== undefined && password !== room.password) {
          setError("Mật khẩu không đúng.");
          return;
        }
        onSubmit();
      }}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary">
            {mode === "watch" ? "Vào xem" : "Vào phòng"}
          </Button>
        </>
      }
    >
      <FormField
        label="Mật khẩu"
        error={error}
        hint={room.password === "123456" ? "Mật khẩu mẫu (demo): 123456" : undefined}
        required
      >
        <Input
          type="password"
          autoFocus
          autoComplete="off"
          placeholder="Nhập mật khẩu…"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(undefined);
          }}
        />
      </FormField>
    </Dialog>
  );
}

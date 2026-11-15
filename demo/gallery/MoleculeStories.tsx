import { useState } from "react";
import {
  Button, ChatMessage, DropdownMenu, EmptyState, FormField, Icon, IconButton, Input, ListRow, Menu, Pagination,
  PlayerChip, PlayerSlot, ResourceIcon, RoomCard, SearchBar, Select, StatBlock, TabPanel, Tabs, Textarea, Toast,
  type MenuEntry, type SlotData, type ToastData,
} from "../../components";
import { Story, type Backdrop } from "./Story";
import { messages, players, rooms, slots as initialSlots } from "../shared/mock";


const playerActions: MenuEntry[] = [
  { id: "msg", label: "Nhắn tin", icon: "chat", onSelect: () => {} },
  { id: "invite", label: "Mời vào phòng", icon: "user-plus", onSelect: () => {} },
  { id: "profile", label: "Xem hồ sơ", icon: "user", onSelect: () => {} },
  { id: "d1", kind: "divider" },
  { id: "block", label: "Chặn", icon: "ban", danger: true, onSelect: () => {} },
];

const toasts: ToastData[] = [
  { id: "t1", kind: "success", title: "Đã lưu cài đặt" },
  { id: "t2", kind: "info", title: "Minh Babylon mời bạn vào phòng", description: "4v4 Đồng cỏ — vào là chơi", action: { label: "Vào ngay", onClick: () => {} } },
  { id: "t3", kind: "warning", title: "Ping cao", description: "Máy chủ Châu Á đang 320 ms." },
  { id: "t4", kind: "error", title: "Không vào được phòng", description: "Phòng đã đầy. Lỗi không tự ẩn." },
];

export function MoleculeStories({ backdrop }: { backdrop: Backdrop }) {
  const s = { backdrop };
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [tab, setTab] = useState<"all" | "online" | "invites">("all");
  const [seg, setSeg] = useState<"1v1" | "2v2" | "4v4">("2v2");
  const [settingsTab, setSettingsTab] = useState<"account" | "audio" | "network">("audio");
  const [row, setRow] = useState(1);
  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [shown, setShown] = useState(toasts.map((t) => t.id));
  const [page, setPage] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("r1");

  return (
    <>
      <Story title="FormField" source="Phái sinh — nhãn + ô + gợi ý + lỗi" {...s}>
        <form className="flex w-72 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setTouched(true); }} noValidate>
          <FormField label="Tên hiển thị" required hint="3–16 ký tự, không dấu cách." error={touched && name.trim().length < 3 ? "Tên phải có ít nhất 3 ký tự." : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="vd: lan_hylap" />
          </FormField>
          <FormField label="Khu vực" hint="Chọn máy chủ gần bạn nhất.">
            <Select value="asia" onChange={() => {}} options={[{ value: "asia", label: "Châu Á" }, { value: "eu", label: "Châu Âu" }]} />
          </FormField>
          <Button type="submit" variant="primary" className="self-end">Lưu</Button>
        </form>
        <div className="flex w-72 flex-col gap-3">
          <FormField label="Giới thiệu" hint="Hiện trên hồ sơ của bạn.">
            <Textarea defaultValue="Thích chơi Hy Lạp, đánh đội." />
          </FormField>
          <FormField label="Email" disabled hint="Liên hệ hỗ trợ để đổi email.">
            <Input defaultValue="lan@example.com" />
          </FormField>
        </div>
      </Story>

      <Story title="SearchBar" source="Phái sinh — debounce 250 ms, Esc xoá" {...s}>
        <div className="flex w-96 flex-col gap-2">
          <SearchBar
            label="Tìm phòng hoặc người chơi"
            searching={searching}
            scopes={[{ value: "rooms", label: "Phòng" }, { value: "players", label: "Người chơi" }]}
            onSearch={(q, scope) => {
              setLastQuery(`${scope}: "${q}"`);
              setSearching(true);
              setTimeout(() => setSearching(false), 700);
            }}
          />
          <span className="font-body text-xs text-tone-text/70">Lần tìm cuối: {lastQuery || "—"}</span>
        </div>
      </Story>

      <Story title="Tabs" source="Phái sinh — tab chọn = lõm, chữ state; mũi tên chuyển tab" {...s}>
        <div className="flex w-96 flex-col gap-0">
          <Tabs
            label="Bạn bè"
            idBase="friends"
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: "Tất cả" },
              { value: "online", label: "Online" },
              { value: "invites", label: "Lời mời", count: 2 },
            ]}
          />
          <TabPanel idBase="friends" value={tab} className="bg-black/50 bevel-sunken-2 p-3 font-body text-sm">
            Nội dung tab: {tab}
          </TabPanel>
        </div>
        <Tabs label="Chế độ" variant="segmented" value={seg} onChange={setSeg} items={[{ value: "1v1", label: "1v1" }, { value: "2v2", label: "2v2" }, { value: "4v4", label: "4v4", disabled: true }]} />
        <Tabs
          label="Nhóm cài đặt"
          variant="vertical"
          size="md"
          value={settingsTab}
          onChange={setSettingsTab}
          className="w-40"
          items={[
            { value: "account", label: "Tài khoản", icon: <Icon name="user" /> },
            { value: "audio", label: "Âm thanh", icon: <Icon name="volume" /> },
            { value: "network", label: "Mạng", icon: <Icon name="globe" /> },
          ]}
        />
      </Story>

      <Story title="ListRow / Menu / DropdownMenu" source="Game (kiểu danh sách) + Phái sinh" {...s}>
        <div role="listbox" aria-label="Bản đồ" className="w-72 bg-black/60 bevel-sunken-2 p-[3px]">
          {["Đồng cỏ", "Sông ngòi", "Đảo lớn", "Sa mạc (khoá)"].map((m, i) => (
            <ListRow
              key={m}
              role="option"
              tabIndex={i === row ? 0 : -1}
              selected={i === row}
              disabled={i === 3}
              onClick={() => i !== 3 && setRow(i)}
              leading={<ResourceIcon kind={(["food", "wood", "stone", "gold"] as const)[i]} size={20} />}
              trailing={<span className="font-body text-xs tabular text-tone-text/70">{[4, 6, 8, 2][i]} người</span>}
            >
              <span className="truncate">{m}</span>
              <span className="font-body text-xs text-tone-text/60">Bản đồ ngẫu nhiên</span>
            </ListRow>
          ))}
        </div>
        <Menu
          label="Hành động"
          autoFocus={false}
          items={[
            { id: "a", label: "Mời bạn bè", icon: "user-plus", shortcut: ["I"], onSelect: () => {} },
            { id: "b", label: "Sao chép mã phòng", icon: "more", shortcut: ["Ctrl", "C"], onSelect: () => {} },
            { id: "c", label: "Đã khoá", icon: "lock", disabled: true, onSelect: () => {} },
            { id: "d", kind: "divider" },
            { id: "e", label: "Rời phòng", icon: "logout", danger: true, onSelect: () => {} },
          ]}
        />
        <DropdownMenu
          label="Tài khoản"
          items={playerActions}
          trigger={(p) => (
            <Button {...p} icon={<Icon name="chevron-down" />}>
              Mở menu
            </Button>
          )}
        />
      </Story>

      <Story title="PlayerChip" source="Tự thiết kế — avatar + tên + trạng thái + ping + cờ" {...s}>
        <div className="flex flex-col gap-3 bg-black/50 p-3">
          <PlayerChip player={players.me} showActivity showPing />
          <PlayerChip player={players.minh} showActivity colored showPennant actions={playerActions} />
          <PlayerChip player={players.thu} showActivity colored showPennant actions={playerActions} />
          <PlayerChip player={players.long} showPing colored showPennant />
          <PlayerChip player={players.spam} showActivity />
          <PlayerChip player={players.hoang} compact />
        </div>
      </Story>

      <Story title="ChatMessage" source="Tự thiết kế — user / own / system / whisper; đang gửi, lỗi, được nhắc" {...s}>
        <div className="w-[420px] bg-black/60 py-2">
          {messages.map((m, i) => (
            <ChatMessage key={m.id} message={m} grouped={i > 0 && messages[i - 1].author?.id === m.author?.id && m.kind !== "system"} onRetry={() => {}} />
          ))}
        </div>
      </Story>

      <Story title="RoomCard" source="Tự thiết kế — rê chuột hiện nút Vào / Xem" {...s}>
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} selected={r.id === selectedRoom} onSelect={(x) => setSelectedRoom(x.id)} onJoin={() => {}} />
        ))}
      </Story>

      <Story title="PlayerSlot" source="Phái sinh — màn multiplayer của game; bạn là ô 2, chủ phòng là ô 1" {...s}>
        <div className="flex w-full max-w-[860px] flex-col gap-1">
          {slots.map((sl) => (
            <PlayerSlot
              key={sl.index}
              slot={sl}
              isMe={sl.player?.id === "me"}
              viewerIsHost={false}
              takenColors={slots.filter((o) => o.state === "player" || o.state === "ai").map((o) => o.color)}
              onChange={(patch) => setSlots((all) => all.map((o) => (o.index === sl.index ? { ...o, ...patch } : o)))}
            />
          ))}
          <span className="mt-2 font-body text-xs text-tone-text/70">Góc nhìn chủ phòng (có nút mời ra, thêm AI):</span>
          {slots.slice(1, 5).map((sl) => (
            <PlayerSlot key={sl.index} slot={sl} viewerIsHost onKick={() => {}} onOpenSlot={() => {}} />
          ))}
        </div>
      </Story>

      <Story title="StatBlock" source="Tự thiết kế" {...s}>
        <StatBlock label="Số trận" value="1 284" delta={12} />
        <StatBlock label="Tỉ lệ thắng" value="57%" delta={-3} formatDelta={(d) => `${Math.abs(d)}%`} />
        <StatBlock label="Điểm" value="1 650" icon={<Icon name="trophy" size={12} />} />
        <StatBlock label="Vàng" value="2 400" icon={<ResourceIcon kind="gold" size={16} />} delta={300} />
      </Story>

      <Story title="Toast" source="Tự thiết kế — tự ẩn 5 s (dừng khi rê chuột), lỗi không tự ẩn" {...s}>
        <div className="flex flex-col gap-2">
          {toasts.filter((t) => shown.includes(t.id)).map((t) => (
            <Toast key={t.id} toast={{ ...t }} onClose={(id) => setShown((x) => x.filter((y) => y !== id))} />
          ))}
          <Button size="sm" onClick={() => setShown(toasts.map((t) => t.id))}>Hiện lại</Button>
        </div>
      </Story>

      <Story title="EmptyState / Pagination" source="Tự thiết kế + Phái sinh (sprite mũi tên)" {...s}>
        <div className="w-80 bg-black/50">
          <EmptyState
            title="Chưa có phòng nào"
            description="Tạo phòng mới rồi mời bạn bè vào chơi."
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Tạo phòng", icon: <Icon name="plus" />, onClick: () => {} }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Pagination variant="pages" page={page} pageCount={9} onPage={setPage} />
          <Pagination
            variant="load-more"
            hasMore
            loading={loadingMore}
            onLoadMore={() => {
              setLoadingMore(true);
              setTimeout(() => setLoadingMore(false), 1000);
            }}
          />
          <Pagination variant="infinite" hasMore loading onLoadMore={() => {}} />
          <IconButton label="Trợ giúp" tooltip="bottom"><Icon name="info" size={20} /></IconButton>
        </div>
      </Story>
    </>
  );
}

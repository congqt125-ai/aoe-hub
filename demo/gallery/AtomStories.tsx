import { useState } from "react";
import {
  Avatar, Badge, Button, Checkbox, Divider, FACTIONS, Frame, GameIcon, Heading, ICON_NAMES, Icon, IconButton, Input, Kbd,
  PingIndicator, ProgressBar, RadioGroup, ResourceIcon, Select, Slider, Spinner, StatusDot, Surface, Text, Textarea,
  Toggle, Tooltip, type BevelVariant, type PresenceStatus, type Texture,
} from "../../components";
import { Story, type Backdrop } from "./Story";


const label = "font-body text-xs text-tone-text/70";

export function AtomStories({ backdrop }: { backdrop: Backdrop }) {
  const [text, setText] = useState("lan_hylap");
  const [search, setSearch] = useState("đế chế");
  const [chat, setChat] = useState("Ai vào phòng 4v4 không?");
  const [checks, setChecks] = useState({ a: true, b: false });
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [toggle, setToggle] = useState(true);
  const [civ, setCiv] = useState<string | undefined>("greek");
  const [volume, setVolume] = useState(70);
  const [loading, setLoading] = useState(false);
  const s = { backdrop };

  return (
    <>
      <Story title="Bevel / Frame" source="Phái sinh — viền engine, 6 màu" {...s}>
        {(["raised", "sunken", "etched", "flat"] as BevelVariant[]).map((v) => (
          <div key={v} className="flex flex-col items-center gap-1">
            <Frame variant={v} className="h-16 w-24 bg-black/30" />
            <span className={label}>{v}</span>
          </div>
        ))}
        {([1, 2] as const).map((w) => (
          <div key={w} className="flex flex-col items-center gap-1">
            <Frame width={w} className="h-16 w-24 bg-black/30" />
            <span className={label}>raised {w}px</span>
          </div>
        ))}
        {FACTIONS.map((f) => (
          <div key={f} className="flex flex-col items-center gap-1">
            <Frame tone={`faction:${f}`} className="h-16 w-24 bg-black/30" />
            <span className={label}>{f}</span>
          </div>
        ))}
      </Story>

      <Story title="Surface" source="Game — texture hộp thoại + lớp phủ shade" {...s}>
        {(["sandstone", "marble", "brick", "wood", "darkstone", "sand", "none"] as (Texture | "none")[]).map((t) => (
          <Surface key={t} texture={t} className="flex h-20 w-32 items-end bevel-raised p-2 font-heading text-sm">
            {t}
          </Surface>
        ))}
      </Story>

      <Story title="Button" source="Phái sinh — Surface + Bevel; nhấn = lõm + dịch 1px" {...s}>
        <div className="flex flex-col gap-3">
          {(["primary", "secondary", "ghost", "danger"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-3">
              <span className={`${label} w-20`}>{v}</span>
              <Button variant={v} size="sm">Nhỏ</Button>
              <Button variant={v}>Vào phòng</Button>
              <Button variant={v} size="lg">Sẵn sàng</Button>
              <Button variant={v} disabled>Đã khoá</Button>
              <Button variant={v} icon={<Icon name="plus" />}>Tạo phòng</Button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className={`${label} w-20`}>loading</span>
            <Button variant="primary" loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>
              Bấm để tải
            </Button>
            <Button variant="primary" size="lg" loading>Đăng nhập</Button>
          </div>
        </div>
      </Story>

      <Story title="IconButton" source="Game (sprite control theo theme, nền HUD theo phe) + Phái sinh" {...s}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={`${label} w-16`}>control</span>
            {(["close", "arrow-up", "arrow-down", "arrow-down-alt", "blank"] as const).map((sp) => (
              <IconButton key={sp} variant="control" sprite={sp} label={sp} />
            ))}
            <IconButton variant="control" sprite="close" label="Đóng (lớn)" size={40} />
            <IconButton variant="control" sprite="close" label="Đóng (khoá)" disabled />
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-16`}>hud</span>
            {FACTIONS.map((f, i) => (
              <IconButton key={f} variant="hud" faction={f} label={`Nút HUD ${f}`} size={40} selected={i === 1}>
                <Icon name={(["home", "users", "sword", "trophy", "settings"] as const)[i]} size={20} />
              </IconButton>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`${label} w-16`}>plain</span>
            <IconButton label="Cài đặt" size={24}><Icon name="settings" size={16} /></IconButton>
            <IconButton label="Thông báo"><Icon name="bell" size={20} /></IconButton>
            <IconButton label="Tìm kiếm" size={40}><Icon name="search" size={24} /></IconButton>
            <IconButton label="Không dùng được" disabled><Icon name="lock" size={20} /></IconButton>
          </div>
        </div>
      </Story>

      <Story title="Text / Heading" source="Spectral SC (tiêu đề) + Arimo (đoạn văn)" {...s}>
        <div className="flex flex-col gap-1">
          <Heading level={1}>Đế chế — Sảnh chờ</Heading>
          <Heading level={2}>Phòng của Lan Hy Lạp</Heading>
          <Heading level={3}>Cài đặt trận</Heading>
          <Heading level={4}>Người chơi đã sẵn sàng</Heading>
          <Text>Body 14 — Vào sảnh để tìm phòng và chơi cùng bạn bè.</Text>
          <Text variant="caption" tone="muted">Caption 12 — cập nhật 2 phút trước</Text>
          <Text variant="micro" tone="muted">Micro 11 — phiên bản 0.1</Text>
          <Text variant="numeric">Numeric: 1 234 · 42 ms · 00:15:07</Text>
        </div>
        <div className="flex flex-col gap-1 bg-black/70 p-3">
          {(["default", "muted", "focus", "state", "success", "warning", "danger", "info"] as const).map((t) => (
            <Text key={t} tone={t}>{t}</Text>
          ))}
        </div>
        <div className="flex flex-col gap-1 bg-black/70 p-3">
          {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((n) => (
            <Text key={n} tone={`player-${n}`}>Người chơi {n}</Text>
          ))}
        </div>
      </Story>

      <Story title="Icon" source="Game (tài nguyên, lính, công nghệ, công trình) + Tự thiết kế (hệ thống)" {...s}>
        <div className="flex max-w-xl flex-wrap gap-3">
          {ICON_NAMES.map((n) => (
            <Tooltip key={n} content={n}>
              <span tabIndex={0} className="inline-flex"><Icon name={n} size={20} label={n} /></span>
            </Tooltip>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {(["wood", "food", "gold", "stone"] as const).map((r) => <ResourceIcon key={r} kind={r} size={24} label={r} />)}
          </div>
          <div className="flex items-end gap-2">
            {[0, 5, 10, 20].map((f) => <GameIcon key={f} set="unit" frame={f} size={50} />)}
            {[0, 3].map((f) => <GameIcon key={f} set="tech" frame={f} size={32} />)}
          </div>
          <div className="flex items-end gap-2">
            {FACTIONS.map((f) => <GameIcon key={f} set={`building:${f}`} frame={0} size={32} label={f} />)}
            {[0, 1, 2].map((f) => <GameIcon key={f} set="stat" frame={f} size={24} />)}
          </div>
        </div>
      </Story>

      <Story title="Input / Textarea" source="Phái sinh — bevel lõm + nền tối" {...s}>
        <div className="flex w-72 flex-col gap-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tên đăng nhập" aria-label="text" />
          <Input type="password" defaultValue="matkhau" aria-label="password" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Tìm phòng, người chơi…" aria-label="search" />
          <Input type="search" value="đang tìm" onChange={() => {}} trailing={<Spinner className="mr-2" />} aria-label="searching" />
        </div>
        <div className="flex w-72 flex-col gap-3">
          <Input invalid defaultValue="sai@" aria-label="error" />
          <Input disabled defaultValue="Không sửa được" aria-label="disabled" />
          <Input readOnly defaultValue="Chỉ đọc" aria-label="readonly" />
          <Input size="sm" placeholder="Cỡ nhỏ" aria-label="small" />
        </div>
        <div className="w-80">
          <Textarea value={chat} onChange={(e) => setChat(e.target.value)} maxLength={500} aria-label="Tin nhắn" />
        </div>
      </Story>

      <Story title="Checkbox / Radio / Toggle" source="Checkbox: Game (sprite theo theme, không viền); Radio/Toggle: Phái sinh" {...s}>
        <div className="flex flex-col gap-2">
          <Checkbox label="Ẩn phòng đầy" checked={checks.a} onChange={(e) => setChecks({ ...checks, a: e.target.checked })} />
          <Checkbox label="Ẩn phòng có mật khẩu" checked={checks.b} onChange={(e) => setChecks({ ...checks, b: e.target.checked })} />
          <Checkbox label="Chọn một phần" indeterminate />
          <Checkbox label="Bị khoá" disabled defaultChecked />
        </div>
        <RadioGroup
          label="Tốc độ game"
          value={speed}
          onChange={setSpeed}
          options={[
            { value: "slow", label: "Chậm" },
            { value: "normal", label: "Bình thường" },
            { value: "fast", label: "Nhanh" },
          ]}
        />
        <div className="flex flex-col gap-2">
          <Toggle checked={toggle} onChange={setToggle} label="Âm thanh khi có lời mời" />
          <Toggle checked={!toggle} onChange={(v) => setToggle(!v)} label="Chế độ ẩn danh" />
          <Toggle checked disabled onChange={() => {}} label="Bị khoá" />
        </div>
      </Story>

      <Story title="Select / Slider" source="Phái sinh + Game (sprite mũi tên)" {...s}>
        <div className="flex w-60 flex-col gap-3">
          <Select
            aria-label="Phe"
            value={civ}
            onChange={setCiv}
            options={FACTIONS.map((f) => ({ value: f, label: f, icon: <GameIcon set={`building:${f}`} frame={0} size={16} /> }))}
          />
          <Select aria-label="Bản đồ" value={undefined} onChange={() => {}} placeholder="Chọn bản đồ…" options={[{ value: "a", label: "Đồng cỏ" }, { value: "b", label: "Sông ngòi" }, { value: "c", label: "Đảo", disabled: true }]} />
          <Select aria-label="lỗi" invalid value={undefined} onChange={() => {}} options={[{ value: "a", label: "A" }]} />
          <Select aria-label="khoá" disabled value="a" onChange={() => {}} options={[{ value: "a", label: "Không đổi được" }]} />
        </div>
        <div className="flex w-64 flex-col gap-4">
          <Slider label="Âm lượng" value={volume} onChange={setVolume} format={(v) => `${v}%`} />
          <Slider label="Bị khoá" value={30} onChange={() => {}} disabled />
        </div>
      </Story>

      <Story title="Badge / StatusDot / PingIndicator" source="Tự thiết kế" {...s}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="count" count={3} />
            <Badge variant="count" count={128} />
            <Badge variant="status" status="waiting" />
            <Badge variant="status" status="playing" />
            <Badge variant="status" status="full" />
            <Badge variant="status" status="locked" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="rank">Vàng II</Badge>
            {([1, 2, 3, 4] as const).map((p) => <Badge key={p} variant="team" player={p}>{`Đội ${p}`}</Badge>)}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 bg-black/60 p-3">
          {(["online", "away", "busy", "in-game", "offline"] as PresenceStatus[]).map((st) => (
            <span key={st} className="flex items-center gap-2 font-body text-sm">
              <StatusDot status={st} size={12} labelled={false} />
              {st}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 bg-black/60 p-3">
          {[42, 120, 210, 400, null].map((ms) => <PingIndicator key={String(ms)} ms={ms} showValue />)}
        </div>
      </Story>

      <Story title="Avatar" source="Tự thiết kế + màu người chơi" {...s}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((sz, i) => (
          <div key={sz} className="flex flex-col items-center gap-1">
            <Avatar name="Lan Hy Lạp" size={sz} status={(["online", "away", "busy", "in-game", "offline"] as const)[i]} player={((i % 8) + 1) as 1} />
            <span className={label}>{sz}</span>
          </div>
        ))}
        <Avatar name="Cung thủ" size="lg" source={{ kind: "unit", frame: 3 }} player={2} status="in-game" />
        <Avatar name="Babylon" size="lg" source={{ kind: "civ", faction: "babylonian" }} player={3} />
      </Story>

      <Story title="ProgressBar / Spinner" source="Phái sinh + Game (đồng hồ cát)" {...s}>
        <div className="flex w-72 flex-col gap-3">
          <ProgressBar label="Đang tải bản cập nhật" value={42} />
          <ProgressBar label="Đang kết nối" />
          <ProgressBar label="Máu" value={80} variant="health" />
          <ProgressBar label="Máu" value={45} variant="health" />
          <ProgressBar label="Máu" value={15} variant="health" />
        </div>
        <div className="flex items-end gap-4">
          <Spinner size={16} />
          <Spinner size={24} />
          <Spinner size={32} label="Đang tải" />
        </div>
      </Story>

      <Story title="Divider / Tooltip / Kbd / Cursor" source="Phái sinh + Game (con trỏ)" {...s}>
        <div className="flex w-72 flex-col gap-3">
          <Divider />
          <Divider label="hoặc" />
          <div className="flex h-8 items-center gap-3">
            <span>Trái</span>
            <Divider orientation="vertical" />
            <span>Phải</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Tooltip content="Tạo phòng mới cho tối đa 8 người">
            <Button>Rê chuột (400 ms)</Button>
          </Tooltip>
          <Tooltip title="Tìm kiếm" content="Tìm phòng hoặc người chơi" shortcut={["Ctrl", "K"]} placement="bottom">
            <Button variant="ghost">Tooltip có phím tắt</Button>
          </Tooltip>
          <span className="font-body text-sm">
            Mở tìm kiếm: <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> · Trợ giúp: <Kbd>?</Kbd>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 font-body text-sm">
          {["default", "pointer", "busy", "action", "crosshair"].map((c) => (
            <span key={c} className={`bg-black/50 px-3 py-2 ${c === "default" ? "" : `cursor-game-${c}`}`}>
              {c}
            </span>
          ))}
        </div>
      </Story>
    </>
  );
}

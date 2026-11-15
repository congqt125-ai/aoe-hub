import type { ReactNode } from "react";
import { ReviewRailItem } from "./ReviewRail";
import { DEFAULT_CONFIG, type ListState, type LobbyMockConfig } from "./lobbyMock";

// ---- Shared parts of the review-only "⚙ Dữ liệu giả" panels (one per screen). Alt+M toggles the open one.

/** "⚙ Dữ liệu giả" button on the review rail (window edge) + its panel. */
export function MockShell({ title, children, actions, onReset }: {
  title: string;
  children: ReactNode;
  /** One-shot buttons (e.g. "+ 1 tin chat"). */
  actions?: { label: string; onClick: () => void }[];
  onReset: () => void;
}) {
  return (
    <ReviewRailItem label="Dữ liệu giả" title={title} hotkey="m">
      {children}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {actions?.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className="border border-white/30 bg-white/10 px-2 py-0.5">
            {a.label}
          </button>
        ))}
        <button type="button" onClick={onReset} className="border border-white/30 bg-white/10 px-2 py-0.5">
          Đặt lại
        </button>
      </div>
    </ReviewRailItem>
  );
}

export function MockGroup({ children }: { children: ReactNode }) {
  return <h4 className="mb-1 mt-3 font-heading text-xs font-semibold uppercase tracking-wide text-tone-focus first:mt-0">{children}</h4>;
}

/** Range row; the label turns yellow when the value differs from its default. */
export function MockSlider({ label, value, min, max, step = 1, unit = "", changed, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; changed: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid grid-cols-[110px_1fr_44px] items-center gap-1.5 py-0.5">
      <span className={changed ? "text-tone-focus" : undefined}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output className="text-right tabular">{value}{unit}</output>
    </label>
  );
}

export function MockChoice<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`border px-2 py-0.5 ${value === o.value ? "border-tone-focus bg-white/25 text-tone-focus" : "border-white/30 bg-white/10"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MockCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ---- Lobby (T3)

const LIST_STATES: { value: ListState; label: string }[] = [
  { value: "normal", label: "Bình thường" },
  { value: "loading", label: "Đang tải" },
  { value: "empty", label: "Rỗng" },
  { value: "error", label: "Lỗi" },
];

export function MockPanel({ title, config, onChange, onReset, actions }: {
  title: string;
  config: LobbyMockConfig;
  onChange: (patch: Partial<LobbyMockConfig>) => void;
  onReset: () => void;
  actions?: { label: string; onClick: () => void }[];
}) {
  const num = (k: keyof LobbyMockConfig, label: string, min: number, max: number, unit = "") => (
    <MockSlider label={label} value={config[k] as number} min={min} max={max} unit={unit} changed={config[k] !== DEFAULT_CONFIG[k]} onChange={(v) => onChange({ [k]: v })} />
  );
  return (
    <MockShell title={title} onReset={onReset} actions={actions}>
      <MockGroup>Số lượng</MockGroup>
      {num("roomCount", "Phòng", 0, 60)}
      {num("onlineCount", "Đang online", 0, 80)}
      {num("chatCount", "Tin chat có sẵn", 0, 80)}
      <MockGroup>Tỉ lệ phòng</MockGroup>
      {num("busyPercent", "Đang chơi / đầy", 0, 100, "%")}
      {num("lockedPercent", "Có mật khẩu", 0, 100, "%")}
      <MockGroup>Thời gian thực</MockGroup>
      {num("autoChatSec", "Tin chat mới mỗi", 0, 20, "s")}
      <MockGroup>Trạng thái danh sách phòng</MockGroup>
      <MockChoice label="Trạng thái danh sách phòng" options={LIST_STATES} value={config.listState} onChange={(v) => onChange({ listState: v })} />
      <MockGroup>Người dùng</MockGroup>
      <MockCheck label="Là QTV (+2 chỗ xem trận)" checked={config.moderator} onChange={(v) => onChange({ moderator: v })} />
      <MockGroup>Khung chat</MockGroup>
      <MockCheck label="Mất kết nối kênh chat" checked={config.chatState === "error"} onChange={(v) => onChange({ chatState: v ? "error" : "normal" })} />
    </MockShell>
  );
}

import { cx } from "../lib/cx";
import { FACTIONS, FACTION_LABELS, type Faction } from "../lib/theme";
import type { SlotData } from "../lib/types";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { GameIcon, Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Select } from "../atoms/Select";
import type { PlayerNumber } from "../atoms/Text";
import { PlayerChip } from "./PlayerChip";

const SWATCH: Record<PlayerNumber, string> = {
  1: "bg-player-1", 2: "bg-player-2", 3: "bg-player-3", 4: "bg-player-4",
  5: "bg-player-5", 6: "bg-player-6", 7: "bg-player-7", 8: "bg-player-8",
};
const COLOR_NAMES: Record<PlayerNumber, string> = { 1: "Xanh dương", 2: "Đỏ", 3: "Vàng", 4: "Nâu", 5: "Cam", 6: "Xanh lá", 7: "Xám", 8: "Lục lam" };

export interface PlayerSlotProps {
  slot: SlotData;
  /** The viewer owns this slot (can change faction / color / team / ready). */
  isMe?: boolean;
  /** The viewer is the room host (can kick, open / close slots, add AI). */
  viewerIsHost?: boolean;
  /** Colors already taken by other slots (locked in the color select). */
  takenColors?: PlayerNumber[];
  onChange?: (patch: Partial<SlotData>) => void;
  onKick?: () => void;
  onOpenSlot?: () => void;
  className?: string;
}

/** One seat in the room lobby, like the game's multiplayer setup screen. */
export function PlayerSlot({ slot, isMe, viewerIsHost, takenColors = [], onChange, onKick, onOpenSlot, className }: PlayerSlotProps) {
  const n = String(slot.index + 1);
  const editable = isMe || (viewerIsHost && slot.state === "ai");

  if (slot.state === "open" || slot.state === "closed") {
    return (
      <div className={cx("flex h-11 items-center gap-3 bg-black/35 bevel-sunken-1 px-3 text-tone-text/70", className)}>
        <span className="w-4 font-heading text-sm tabular">{n}</span>
        <span className="flex-1 font-body text-md italic">{slot.state === "open" ? "Mở" : "Đóng"}</span>
        {viewerIsHost && slot.state === "open" && (
          <Button size="sm" variant="ghost" onClick={onOpenSlot} icon={<Icon name="user-plus" size={16} />}>
            Mời / thêm AI
          </Button>
        )}
      </div>
    );
  }

  const factionOptions = [
    { value: "random", label: "Ngẫu nhiên", icon: <Icon name="refresh" size={16} /> },
    ...FACTIONS.map((f) => ({ value: f, label: FACTION_LABELS[f], icon: <GameIcon set={`building:${f}`} frame={0} size={16} /> })),
  ];
  const colorOptions = ([1, 2, 3, 4, 5, 6, 7, 8] as PlayerNumber[]).map((c) => ({
    value: String(c),
    label: COLOR_NAMES[c],
    disabled: c !== slot.color && takenColors.includes(c),
    icon: <span className={cx("h-3 w-3 shadow-[0_0_0_1px_#000]", SWATCH[c])} />,
  }));
  const teamOptions = [{ value: "0", label: "–" }, ...[1, 2, 3, 4].map((t) => ({ value: String(t), label: `Đội ${t}` }))];

  return (
    <div
      className={cx(
        "relative flex h-11 items-center gap-2.5 px-3",
        isMe ? "bg-black/60 bevel-raised-2" : "bg-black/45 bevel-sunken-1",
        slot.ready && "after:pointer-events-none after:absolute after:inset-[2px] after:border after:border-success",
        slot.disconnected && "opacity-60",
        className,
      )}
    >
      <span className="w-4 font-heading text-sm tabular text-tone-text/80">{n}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        {slot.isHost && <Icon name="crown" size={16} label="Chủ phòng" className="text-tone-focus" />}
        {slot.state === "ai" && <Icon name="ai" size={16} label="Máy" className="text-tone-text/80" />}
        {slot.player && <PlayerChip player={{ ...slot.player, color: slot.color }} colored compact showPing={slot.state === "player"} />}
        {slot.disconnected && <span className="font-body text-xs text-warning-on-dark">mất kết nối</span>}
      </span>
      <Select
        aria-label={`Phe của người chơi ${n}`}
        size="sm"
        className="w-36"
        disabled={!editable}
        value={slot.faction ?? "random"}
        options={factionOptions}
        onChange={(v) => onChange?.({ faction: v as Faction | "random" })}
      />
      <Select
        aria-label={`Màu của người chơi ${n}`}
        size="sm"
        className="w-32"
        disabled={!editable}
        value={String(slot.color)}
        options={colorOptions}
        onChange={(v) => onChange?.({ color: Number(v) as PlayerNumber })}
      />
      <Select
        aria-label={`Đội của người chơi ${n}`}
        size="sm"
        className="w-20"
        disabled={!editable}
        value={String(slot.team ?? 0)}
        options={teamOptions}
        onChange={(v) => onChange?.({ team: Number(v) || undefined })}
      />
      <Checkbox
        size={20}
        aria-label={`Người chơi ${n} sẵn sàng`}
        checked={Boolean(slot.ready)}
        disabled={!isMe}
        onChange={(e) => onChange?.({ ready: e.target.checked })}
        className={cx(!isMe && "!opacity-100")}
      />
      <span className="w-6">
        {viewerIsHost && !slot.isHost && (
          <IconButton variant="control" sprite="close" size={24} label={`Mời người chơi ${n} ra khỏi phòng`} onClick={onKick} />
        )}
      </span>
    </div>
  );
}

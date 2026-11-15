import { useMemo, useState } from "react";
import {
  Button, Dialog, FormField, GameIcon, Input, RadioGroup, Select, Textarea, cx,
  type Faction, type Player, type PlayerNumber,
} from "../../../../components";
import {
  CLAN_MAX_DEPUTIES, FACTION_CHOICES, RANK_TIERS, RECRUIT_LABEL,
  type Clan, type ClanEmblem, type ClanMember, type RankTier, type RecruitMode,
} from "../../clanMock";
import { ClanEmblemBadge } from "./ClanEmblemBadge";

const BIO_MAX = 200;
const FRAMES = [0, 1, 2, 3, 4, 5];
const COLORS: { num: PlayerNumber; bg: string; label: string }[] = [
  { num: 1, bg: "bg-player-1", label: "Xanh dương" },
  { num: 2, bg: "bg-player-2", label: "Đỏ" },
  { num: 3, bg: "bg-player-3", label: "Vàng" },
  { num: 4, bg: "bg-player-4", label: "Nâu" },
  { num: 5, bg: "bg-player-5", label: "Cam" },
  { num: 6, bg: "bg-player-6", label: "Xanh lá" },
  { num: 7, bg: "bg-player-7", label: "Xám" },
  { num: 8, bg: "bg-player-8", label: "Ngọc" },
];

const RANK_OPTIONS: { value: "none" | RankTier; label: string }[] = [
  { value: "none", label: "Không yêu cầu" },
  ...RANK_TIERS.map((r) => ({ value: r, label: `${r} trở lên` })),
];

const RECRUIT_OPTIONS: { value: RecruitMode; label: string }[] = [
  { value: "open", label: `${RECRUIT_LABEL.open} (bấm là vào)` },
  { value: "approval", label: `${RECRUIT_LABEL.approval} (Trưởng/Phó duyệt)` },
  { value: "closed", label: `${RECRUIT_LABEL.closed} (chỉ qua lời mời)` },
];

export interface UpdateClanInput {
  name: string;
  emblem: ClanEmblem;
  bio: string;
  recruit: RecruitMode;
  minRank?: RankTier;
}

/** T11 §3.3 — Tab Quản lý Clan (chỉ Trưởng clan). */
export function ClanManageTab({
  clan,
  me,
  existingClans,
  onSaveInfo,
  onTransferLeadership,
  onDisband,
}: {
  clan: Clan;
  me: Player;
  existingClans: Clan[];
  onSaveInfo: (input: UpdateClanInput) => void;
  onTransferLeadership: (nextLeader: ClanMember) => void;
  onDisband: () => void;
}) {
  const [name, setName] = useState(clan.name);
  const [faction, setFaction] = useState<Faction>(clan.emblem.faction);
  const [frame, setFrame] = useState(clan.emblem.frame);
  const [color, setColor] = useState<PlayerNumber>(clan.emblem.color);
  const [bio, setBio] = useState(clan.bio);
  const [recruit, setRecruit] = useState<RecruitMode>(clan.recruit);
  const [minRank, setMinRank] = useState<"none" | RankTier>(clan.minRank ?? "none");
  const [nameError, setNameError] = useState<string | undefined>();

  const candidates = useMemo(() => {
    const others = clan.members.filter((m) => m.player.id !== me.id);
    return [...others].sort((a, b) => {
      if (a.role === "Phó" && b.role !== "Phó") return -1;
      if (a.role !== "Phó" && b.role === "Phó") return 1;
      return b.contribution - a.contribution;
    });
  }, [clan.members, me.id]);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(candidates[0]?.player.id ?? "");
  const [transferOpen, setTransferOpen] = useState(false);
  const [disbandOpen, setDisbandOpen] = useState(false);
  const [disbandConfirmText, setDisbandConfirmText] = useState("");

  const selectedTarget = candidates.find((c) => c.player.id === selectedTargetId) ?? candidates[0];
  const deputyCount = clan.members.filter((m) => m.role === "Phó").length;
  const willBecomeMember = selectedTarget?.role !== "Phó" && deputyCount >= CLAN_MAX_DEPUTIES;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 24) {
      setNameError("Tên clan phải từ 3–24 ký tự");
      return;
    }
    if (
      existingClans.some(
        (c) => c.tag !== clan.tag && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setNameError("Tên clan đã tồn tại");
      return;
    }
    setNameError(undefined);
    onSaveInfo({
      name: trimmed,
      emblem: { faction, frame, color },
      bio: bio.trim().slice(0, BIO_MAX),
      recruit,
      minRank: minRank === "none" ? undefined : minRank,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Edit clan info */}
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 bg-black/35 p-4 bevel-sunken-1 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
            Thông tin clan
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
            <FormField label="Tên clan" error={nameError} required>
              <Input
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Thẻ clan" hint="Thẻ clan không đổi sau khi tạo">
              <Input value={clan.tag} disabled readOnly />
            </FormField>
          </div>

          <FormField label={`Giới thiệu (${bio.length}/${BIO_MAX})`}>
            <Textarea
              value={bio}
              rows={2}
              maxLength={BIO_MAX}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RadioGroup
              label="Cách nhận người"
              options={RECRUIT_OPTIONS}
              value={recruit}
              onChange={setRecruit}
            />
            <FormField label="Hạng tối thiểu">
              <Select
                aria-label="Hạng tối thiểu"
                value={minRank}
                onChange={(v) => setMinRank(v as "none" | RankTier)}
                options={RANK_OPTIONS}
              />
            </FormField>
          </div>

          <div>
            <Button type="submit" variant="primary">
              Lưu thay đổi
            </Button>
          </div>
        </div>

        {/* Emblem editor */}
        <div className="flex flex-col gap-3 bg-black/35 p-3 bevel-sunken-1">
          <div className="flex items-center gap-3">
            <ClanEmblemBadge emblem={{ faction, frame, color }} size="lg" />
            <div className="min-w-0">
              <div className="font-heading text-md font-bold text-tone-focus">[{clan.tag}]</div>
              <div className="truncate text-sm text-tone-text">{name.trim() || clan.name}</div>
            </div>
          </div>

          <FormField label="Kiến trúc">
            <Select
              aria-label="Kiến trúc biểu tượng"
              value={faction}
              onChange={(v) => setFaction(v as Faction)}
              options={FACTION_CHOICES}
            />
          </FormField>

          <div>
            <div className="mb-1 text-xs font-semibold text-tone-text/80">Công trình</div>
            <div className="grid grid-cols-6 gap-1">
              {FRAMES.map((fr) => (
                <button
                  key={fr}
                  type="button"
                  aria-label={`Biểu tượng ${fr + 1}`}
                  aria-pressed={frame === fr}
                  onClick={() => setFrame(fr)}
                  className={cx(
                    "flex h-9 items-center justify-center bg-black/50 transition-colors focus-visible:outline-game-out",
                    frame === fr ? "ring-2 ring-tone-focus bevel-sunken-1" : "bevel-raised-1 hover:bg-black/70",
                  )}
                >
                  <GameIcon set={`building:${faction}`} frame={fr} size={24} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-tone-text/80">Màu cờ clan</div>
            <div className="grid grid-cols-8 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.num}
                  type="button"
                  title={c.label}
                  aria-label={`Màu ${c.label}`}
                  aria-pressed={color === c.num}
                  onClick={() => setColor(c.num)}
                  className={cx(
                    "h-6 w-full border border-black/70 focus-visible:outline-game-out",
                    c.bg,
                    color === c.num && "ring-2 ring-tone-focus ring-offset-1 ring-offset-black",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Transfer leadership */}
      <section className="flex flex-col gap-3 bg-black/35 p-4 bevel-sunken-1">
        <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
          Chuyển quyền Trưởng clan
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-tone-text/70">
            Clan chỉ có mình bạn — chưa có thành viên khác để chuyển quyền.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72">
              <FormField label="Chọn người nhận quyền">
                <Select
                  aria-label="Chọn thành viên nhận quyền Trưởng clan"
                  value={selectedTarget?.player.id ?? ""}
                  onChange={setSelectedTargetId}
                  options={candidates.map((c) => ({
                    value: c.player.id,
                    label: `${c.player.name} (${c.role})`,
                  }))}
                />
              </FormField>
            </div>
            <Button
              variant="secondary"
              disabled={!selectedTarget}
              onClick={() => setTransferOpen(true)}
            >
              Chuyển quyền
            </Button>
          </div>
        )}
      </section>

      {/* Danger zone: Disband clan */}
      <section className="flex flex-wrap items-center justify-between gap-3 border border-danger/40 bg-black/45 p-4 bevel-sunken-1">
        <div>
          <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-danger-on-dark">
            Giải tán clan
          </h2>
          <p className="mt-1 text-xs text-tone-text/75">
            Xóa vĩnh viễn clan [{clan.tag}] {clan.name} và đưa toàn bộ thành viên về trạng thái chưa có clan.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            setDisbandConfirmText("");
            setDisbandOpen(true);
          }}
        >
          Giải tán clan
        </Button>
      </section>

      {transferOpen && selectedTarget && (
        <Dialog
          title="Xác nhận chuyển quyền Trưởng clan"
          size="sm"
          onClose={() => setTransferOpen(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setTransferOpen(false)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setTransferOpen(false);
                  onTransferLeadership(selectedTarget);
                }}
              >
                Xác nhận chuyển
              </Button>
            </>
          }
        >
          <p className="text-sm text-tone-text/90">
            Chuyển quyền Trưởng clan cho <strong className="text-tone-focus">{selectedTarget.player.name}</strong>?{" "}
            {willBecomeMember
              ? `Vì clan đã đủ ${CLAN_MAX_DEPUTIES} Phó, bạn sẽ trở thành Thành viên và mất quyền quản lý.`
              : "Bạn sẽ trở thành Phó và mất tab Quản lý."}
          </p>
        </Dialog>
      )}

      {disbandOpen && (
        <Dialog
          title="Giải tán clan"
          size="sm"
          onClose={() => setDisbandOpen(false)}
          onSubmit={(e) => {
            e.preventDefault();
            if (disbandConfirmText.trim() !== clan.name) return;
            setDisbandOpen(false);
            onDisband();
          }}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setDisbandOpen(false)}>
                Huỷ
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={disbandConfirmText.trim() !== clan.name}
              >
                Giải tán
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-tone-text/90">
              Nhập chính xác tên clan <strong className="text-tone-focus">{clan.name}</strong> để xác nhận giải tán:
            </p>
            <Input
              value={disbandConfirmText}
              placeholder={clan.name}
              onChange={(e) => setDisbandConfirmText(e.target.value)}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}


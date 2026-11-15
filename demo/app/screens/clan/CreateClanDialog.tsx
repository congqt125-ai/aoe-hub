import { useRef, useState } from "react";
import {
  Button, Dialog, FormField, GameIcon, Input, RadioGroup, Select, Textarea, cx,
  type Faction, type PlayerNumber,
} from "../../../../components";
import {
  FACTION_CHOICES, RANK_TIERS, RECRUIT_LABEL,
  type Clan, type ClanEmblem, type RankTier, type RecruitMode,
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

export interface CreateClanInput {
  name: string;
  tag: string;
  emblem: ClanEmblem;
  bio: string;
  recruit: RecruitMode;
  minRank?: RankTier;
}

/** T11 §3.2 — Hộp thoại tạo clan mới (miễn phí, kiểm tra trùng tên & thẻ). */
export function CreateClanDialog({
  existingClans,
  onCreate,
  onClose,
}: {
  existingClans: Clan[];
  onCreate: (input: CreateClanInput) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [faction, setFaction] = useState<Faction>("greek");
  const [frame, setFrame] = useState(0);
  const [color, setColor] = useState<PlayerNumber>(1);
  const [bio, setBio] = useState("");
  const [recruit, setRecruit] = useState<RecruitMode>("approval");
  const [minRank, setMinRank] = useState<"none" | RankTier>("none");
  const [touched, setTouched] = useState<{ name?: boolean; tag?: boolean }>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  const validateName = (v: string): string | undefined => {
    const trimmed = v.trim();
    if (!trimmed) return "Vui lòng nhập tên clan";
    if (trimmed.length < 3 || trimmed.length > 24) return "Tên clan phải từ 3–24 ký tự";
    if (existingClans.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return "Tên clan đã tồn tại";
    }
    return undefined;
  };

  const validateTag = (v: string): string | undefined => {
    const clean = v.trim().toUpperCase();
    if (!clean) return "Vui lòng nhập thẻ clan";
    if (!/^[A-Z0-9]{2,4}$/.test(clean)) return "Thẻ gồm 2–4 ký tự A–Z hoặc 0–9";
    if (existingClans.some((c) => c.tag.toUpperCase() === clean)) {
      return "Thẻ đã được dùng";
    }
    return undefined;
  };

  const nameError = touched.name ? validateName(name) : undefined;
  const tagError = touched.tag ? validateTag(tag) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = validateName(name);
    const tErr = validateTag(tag);
    setTouched({ name: true, tag: true });
    if (nErr) {
      nameRef.current?.focus();
      return;
    }
    if (tErr) {
      tagRef.current?.focus();
      return;
    }
    onCreate({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      emblem: { faction, frame, color },
      bio: bio.trim().slice(0, BIO_MAX),
      recruit,
      minRank: minRank === "none" ? undefined : minRank,
    });
  };

  return (
    <Dialog
      title="Tạo clan mới"
      size="lg"
      onClose={onClose}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary">
            Tạo clan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
            <FormField label="Tên clan" error={nameError} required>
              <Input
                ref={nameRef}
                value={name}
                maxLength={24}
                placeholder="VD: Đại Việt Bang"
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              />
            </FormField>

            <FormField label="Thẻ (2–4 ký tự)" error={tagError} required>
              <Input
                ref={tagRef}
                value={tag}
                maxLength={4}
                placeholder="DVB"
                onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                onBlur={() => setTouched((t) => ({ ...t, tag: true }))}
              />
            </FormField>
          </div>

          <FormField label={`Giới thiệu (${bio.length}/${BIO_MAX})`}>
            <Textarea
              value={bio}
              rows={2}
              maxLength={BIO_MAX}
              placeholder="Mô tả ngắn về tiêu chí và lịch sinh hoạt của clan…"
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
        </div>

        {/* Emblem builder & live preview */}
        <div className="flex flex-col gap-3 bg-black/35 p-3 bevel-sunken-1">
          <div className="flex items-center gap-3">
            <ClanEmblemBadge emblem={{ faction, frame, color }} size="lg" />
            <div className="min-w-0">
              <div className="font-heading text-md font-bold text-tone-focus">
                [{tag || "THẺ"}]
              </div>
              <div className="truncate text-sm text-tone-text">
                {name.trim() || "Tên clan của bạn"}
              </div>
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
      </div>
    </Dialog>
  );
}


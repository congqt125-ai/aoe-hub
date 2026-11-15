import { useId, useRef, useState } from "react";
import {
  Button, Dialog, FormField, Input, Select, TabPanel, Tabs, Textarea,
} from "../../../components";
import { GAME_TYPES, type GameType } from "../roomMock";
import {
  DEFAULT_RULES_TEMPLATE, TEAM_MAX_MEMBERS, toDatetimeLocal, type Tournament,
} from "../tournamentMock";

type SetupTab = "info" | "format" | "schedule" | "rules";

export interface TournamentSetupData {
  name: string;
  gameType: GameType;
  prize: string;
  maxTeams: 8 | 16;
  minPerTeam: number;
  boRegular: 1 | 3;
  boFinals: 3 | 5;
  drawAt: string;
  startAt: string;
  roundGapDays: number;
  rules: string;
}

const TAB_ITEMS: { value: SetupTab; label: string }[] = [
  { value: "info", label: "Thông tin" },
  { value: "format", label: "Thể thức" },
  { value: "schedule", label: "Lịch" },
  { value: "rules", label: "Luật" },
];

const MAX_TEAMS_OPTIONS: (8 | 16)[] = [8, 16];

const MIN_MEMBER_OPTIONS = [
  { value: "1", label: "1 người" },
  { value: "2", label: "2 người" },
  { value: "3", label: "3 người" },
  { value: "4", label: "4 người" },
];

const BO_REGULAR_OPTIONS = [
  { value: "1", label: "Bo1 (1 ván)" },
  { value: "3", label: "Bo3 (chạm 2)" },
];

const BO_FINALS_OPTIONS = [
  { value: "3", label: "Bo3 (chạm 2)" },
  { value: "5", label: "Bo5 (chạm 3)" },
];

const GAP_OPTIONS = [
  { value: "1", label: "1 ngày" },
  { value: "2", label: "2 ngày" },
  { value: "3", label: "3 ngày" },
  { value: "7", label: "7 ngày" },
];

function defaultDates() {
  const now = Date.now();
  return {
    draw: toDatetimeLocal(new Date(now + 28 * 3600_000).toISOString()),
    start: toDatetimeLocal(new Date(now + 52 * 3600_000).toISOString()),
  };
}

/**
 * QTV dialog to create or edit a tournament.
 * Vertical tabs: Thông tin · Thể thức · Lịch · Luật.
 */
export function TournamentSetupDialog({
  editing,
  onSave,
  onClose,
}: {
  /** Undefined when creating a new tournament; existing tournament when editing. */
  editing?: Tournament;
  onSave: (data: TournamentSetupData, mode: "draft" | "publish") => void;
  onClose: () => void;
}) {
  const idBase = useId();
  const initialDates = defaultDates();
  const [tab, setTab] = useState<SetupTab>("info");
  const [name, setName] = useState(editing?.name ?? "");
  const [gameType, setGameType] = useState<GameType>(editing?.gameType ?? "cungr-shang");
  const [prize, setPrize] = useState(editing?.prize ?? "500k");
  const [maxTeams, setMaxTeams] = useState<8 | 16>(editing?.maxTeams ?? 8);
  const [minPerTeam, setMinPerTeam] = useState(String(editing?.minPerTeam ?? 4));
  const [boRegular, setBoRegular] = useState<1 | 3>(editing?.boRegular ?? 1);
  const [boFinals, setBoFinals] = useState<3 | 5>(editing?.boFinals ?? 3);
  const [drawAt, setDrawAt] = useState(editing ? toDatetimeLocal(editing.drawAt) : initialDates.draw);
  const [startAt, setStartAt] = useState(editing ? toDatetimeLocal(editing.startAt) : initialDates.start);
  const [roundGapDays, setRoundGapDays] = useState(String(editing?.roundGapDays ?? 1));
  const [rules, setRules] = useState(editing?.rules ?? DEFAULT_RULES_TEMPLATE);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const drawRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const rulesRef = useRef<HTMLTextAreaElement>(null);

  const trimmedName = name.trim();
  const nameError = !trimmedName ? "Nhập tên giải đấu." : undefined;

  // Cannot shrink maxTeams if teams after the new cap already have members.
  const maxTeamsError =
    editing && maxTeams < editing.maxTeams && editing.teams.slice(maxTeams).some((t) => t.members.length > 0)
      ? `Không thể giảm xuống ${maxTeams} đội vì có đội phía sau đã có thành viên.`
      : undefined;

  const drawMs = new Date(drawAt.replace(" ", "T")).getTime();
  const startMs = new Date(startAt.replace(" ", "T")).getTime();
  const drawError = !drawAt.trim() || Number.isNaN(drawMs) ? "Nhập ngày xếp đội (YYYY-MM-DD HH:mm)." : undefined;
  const startError =
    !startAt.trim() || Number.isNaN(startMs)
      ? "Nhập ngày vòng 1 bắt đầu (YYYY-MM-DD HH:mm)."
      : !Number.isNaN(drawMs) && startMs < drawMs
        ? "Vòng 1 phải bắt đầu sau hoặc cùng ngày xếp đội."
        : undefined;

  const rulesError = !rules.trim() ? "Nhập luật giải hoặc bấm Chèn mẫu luật." : undefined;

  const showError = (field: string, msg?: string) => (submitted || touched[field] ? msg : undefined);

  const buildPayload = (): TournamentSetupData => ({
    name: trimmedName,
    gameType,
    prize: prize.trim() || "Giao hữu",
    maxTeams,
    minPerTeam: Number(minPerTeam),
    boRegular,
    boFinals,
    drawAt: new Date(drawAt.replace(" ", "T")).toISOString(),
    startAt: new Date(startAt.replace(" ", "T")).toISOString(),
    roundGapDays: Number(roundGapDays),
    rules: rules.trim(),
  });

  const handleAction = (mode: "draft" | "publish") => {
    setSubmitted(true);
    if (mode === "draft") {
      if (nameError) {
        setTab("info");
        window.setTimeout(() => nameRef.current?.focus(), 0);
        return;
      }
      if (maxTeamsError) {
        setTab("format");
        return;
      }
      onSave(
        {
          ...buildPayload(),
          drawAt: Number.isNaN(drawMs) ? new Date(initialDates.draw).toISOString() : new Date(drawAt).toISOString(),
          startAt: Number.isNaN(startMs) ? new Date(initialDates.start).toISOString() : new Date(startAt).toISOString(),
        },
        "draft",
      );
      return;
    }

    if (nameError) {
      setTab("info");
      window.setTimeout(() => nameRef.current?.focus(), 0);
      return;
    }
    if (maxTeamsError) {
      setTab("format");
      return;
    }
    if (drawError) {
      setTab("schedule");
      window.setTimeout(() => drawRef.current?.focus(), 0);
      return;
    }
    if (startError) {
      setTab("schedule");
      window.setTimeout(() => startRef.current?.focus(), 0);
      return;
    }
    if (rulesError) {
      setTab("rules");
      window.setTimeout(() => rulesRef.current?.focus(), 0);
      return;
    }
    onSave(buildPayload(), "publish");
  };

  const isPublishedEdit = editing && editing.phase !== "draft";

  return (
    <Dialog
      title={editing ? "Sửa giải đấu" : "Tạo giải đấu"}
      size="lg"
      onClose={onClose}
      initialFocus={nameRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleAction("publish");
      }}
      actions={
        <>
          <Button onClick={onClose}>Huỷ</Button>
          {!isPublishedEdit && (
            <Button onClick={() => handleAction("draft")}>Lưu nháp</Button>
          )}
          <Button type="submit" variant="primary">
            {isPublishedEdit ? "Lưu thay đổi" : "Công bố giải"}
          </Button>
        </>
      }
    >
      <div className="grid min-h-[300px] grid-cols-[160px_minmax(0,1fr)] gap-4">
        <Tabs
          label="Nhóm thiết lập giải"
          variant="vertical"
          size="md"
          idBase={idBase}
          items={TAB_ITEMS}
          value={tab}
          onChange={setTab}
        />

        <div className="min-w-0 bg-black/55 p-4 bevel-sunken">
          {tab === "info" && (
          <TabPanel value="info" idBase={idBase}>
            <div className="flex flex-col gap-3">
              <FormField label="Tên giải" required error={showError("name", nameError)} hint="Tối đa 60 ký tự.">
                <Input
                  ref={nameRef}
                  value={name}
                  maxLength={60}
                  placeholder="vd: Cúp Mùa Thu 2026"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  invalid={Boolean(showError("name", nameError))}
                />
              </FormField>

              <FormField label="Thể loại">
                <Select
                  aria-label="Thể loại"
                  options={GAME_TYPES}
                  value={gameType}
                  onChange={setGameType}
                />
              </FormField>

              <FormField label="Giải thưởng" hint="Để trống nếu là giải giao hữu.">
                <Input
                  value={prize}
                  maxLength={40}
                  placeholder="vd: 500k hoặc Cúp + Danh hiệu"
                  onChange={(e) => setPrize(e.target.value)}
                />
              </FormField>
            </div>
          </TabPanel>
          )}

          {tab === "format" && (
          <TabPanel value="format" idBase={idBase}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between font-body text-sm text-tone-text">
                <span>Thể thức thi đấu</span>
                <span className="font-semibold text-tone-state">Loại trực tiếp (cố định)</span>
              </div>

              <FormField label="Số đội tối đa" error={maxTeamsError}>
                <div className="flex gap-2">
                  {MAX_TEAMS_OPTIONS.map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={maxTeams === n ? "primary" : "secondary"}
                      onClick={() => setMaxTeams(n)}
                    >
                      {n} đội
                    </Button>
                  ))}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Người mỗi đội (tối đa)">
                  <div className="flex h-8 items-center bg-black/40 px-2.5 font-body text-sm text-tone-text/80 bevel-sunken-1">
                    Tối đa {TEAM_MAX_MEMBERS} người
                  </div>
                </FormField>

                <FormField label="Tối thiểu để vào nhánh">
                  <Select
                    aria-label="Số người tối thiểu để vào nhánh"
                    options={MIN_MEMBER_OPTIONS}
                    value={minPerTeam}
                    onChange={setMinPerTeam}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vòng thường">
                  <Select
                    aria-label="Số ván vòng thường"
                    options={BO_REGULAR_OPTIONS}
                    value={String(boRegular)}
                    onChange={(v) => setBoRegular(Number(v) as 1 | 3)}
                  />
                </FormField>

                <FormField label="Bán kết / Chung kết">
                  <Select
                    aria-label="Số ván Bán kết và Chung kết"
                    options={BO_FINALS_OPTIONS}
                    value={String(boFinals)}
                    onChange={(v) => setBoFinals(Number(v) as 3 | 5)}
                  />
                </FormField>
              </div>
            </div>
          </TabPanel>
          )}

          {tab === "schedule" && (
          <TabPanel value="schedule" idBase={idBase}>
            <div className="flex flex-col gap-3">
              <FormField
                label="Ngày xếp đội (khoá đăng ký)"
                required
                error={showError("drawAt", drawError)}
                hint="Tới giờ này sẽ khoá đổi đội và bốc thăm nhánh."
              >
                <input
                  ref={drawRef}
                  type="datetime-local"
                  value={drawAt}
                  onChange={(e) => setDrawAt(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, drawAt: true }))}
                  aria-invalid={Boolean(showError("drawAt", drawError))}
                  className={`h-8 w-full bg-black/60 px-2.5 font-body text-md text-tone-text bevel-sunken focus-visible:outline-none focus-visible:outline-game ${
                    showError("drawAt", drawError) ? "ring-1 ring-danger" : ""
                  }`}
                />
              </FormField>

              <FormField
                label="Vòng 1 bắt đầu"
                required
                error={showError("startAt", startError)}
              >
                <input
                  ref={startRef}
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, startAt: true }))}
                  aria-invalid={Boolean(showError("startAt", startError))}
                  className={`h-8 w-full bg-black/60 px-2.5 font-body text-md text-tone-text bevel-sunken focus-visible:outline-none focus-visible:outline-game ${
                    showError("startAt", startError) ? "ring-1 ring-danger" : ""
                  }`}
                />
              </FormField>

              <FormField label="Mỗi vòng cách nhau">
                <Select
                  aria-label="Khoảng cách giữa các vòng"
                  options={GAP_OPTIONS}
                  value={roundGapDays}
                  onChange={setRoundGapDays}
                />
              </FormField>
            </div>
          </TabPanel>
          )}

          {tab === "rules" && (
          <TabPanel value="rules" idBase={idBase}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-semibold text-tone-state">Nội dung luật giải</span>
                <Button
                  size="sm"
                  onClick={() => setRules(DEFAULT_RULES_TEMPLATE)}
                >
                  Chèn mẫu luật
                </Button>
              </div>
              <FormField label="Luật giải" required error={showError("rules", rulesError)}>
                <Textarea
                  ref={rulesRef}
                  minRows={7}
                  maxRows={9}
                  value={rules}
                  placeholder="Nhập điều lệ, bản đồ, quy định điểm danh & xử thua..."
                  onChange={(e) => setRules(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, rules: true }))}
                  invalid={Boolean(showError("rules", rulesError))}
                />
              </FormField>
            </div>
          </TabPanel>
          )}
        </div>
      </div>
    </Dialog>
  );
}

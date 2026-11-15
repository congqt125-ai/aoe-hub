import { useMemo, useState } from "react";
import {
  Avatar, Button, Checkbox, Dialog, FormField, Icon, Input, RadioGroup, Select, Tooltip, cx,
} from "../../../components";
import {
  MAP_TYPE_LABEL, canEditMatchResult, formatDateTimeShort, teamDisplayName,
  type MatchGame, type Team, type Tournament, type TournamentMatch,
} from "../tournamentMock";

type ForfeitReason = "Bỏ cuộc" | "Trễ giờ" | "Khác";
const FORFEIT_REASONS: { value: ForfeitReason; label: string }[] = [
  { value: "Bỏ cuộc", label: "Bỏ cuộc" },
  { value: "Trễ giờ", label: "Trễ giờ" },
  { value: "Khác", label: "Khác" },
];

export function MatchResultDialog({
  tournament,
  match,
  moderator,
  onSave,
  onMarkLive,
  onWatch,
  onClose,
}: {
  tournament: Tournament;
  match: TournamentMatch;
  moderator: boolean;
  onSave: (payload: { games: MatchGame[]; forfeit?: { winner: "A" | "B"; reason: string }; note?: string }) => void;
  onMarkLive: () => void;
  onWatch: () => void;
  onClose: () => void;
}) {
  const teamA = tournament.teams.find((t) => t.id === match.teamAId);
  const teamB = tournament.teams.find((t) => t.id === match.teamBId);
  const nameA = teamA ? teamDisplayName(teamA) : match.fromMatchA ? `Thắng trận #${match.fromMatchA}` : "Chưa xác định";
  const nameB = teamB ? teamDisplayName(teamB) : match.status === "bye" ? "Miễn đấu" : match.fromMatchB ? `Thắng trận #${match.fromMatchB}` : "Chưa xác định";

  const editable = moderator && canEditMatchResult(tournament, match);
  const neededWins = Math.ceil(match.bestOf / 2);

  // Per-game winner state for BoN (length = bestOf, undefined = not played yet)
  const [gameWinners, setGameWinners] = useState<Array<"A" | "B" | undefined>>(() =>
    Array.from({ length: match.bestOf }, (_, i) => match.games[i]?.winner),
  );
  const [isForfeit, setIsForfeit] = useState(!!match.forfeit);
  const [forfeitWinner, setForfeitWinner] = useState<"A" | "B">(match.forfeit?.winner ?? "A");
  const [forfeitReason, setForfeitReason] = useState<ForfeitReason>(
    (FORFEIT_REASONS.some((r) => r.value === match.forfeit?.reason) ? match.forfeit?.reason : "Bỏ cuộc") as ForfeitReason,
  );
  const [note, setNote] = useState(match.note ?? "");

  const { scoreA, scoreB } = useMemo(() => {
    if (isForfeit) {
      return {
        scoreA: forfeitWinner === "A" ? neededWins : 0,
        scoreB: forfeitWinner === "B" ? neededWins : 0,
      };
    }
    let a = 0;
    let b = 0;
    for (const w of gameWinners) {
      if (w === "A") a += 1;
      else if (w === "B") b += 1;
    }
    return { scoreA: a, scoreB: b };
  }, [isForfeit, forfeitWinner, neededWins, gameWinners]);

  const hasValidWinner = isForfeit || scoreA >= neededWins || scoreB >= neededWins;
  const saveDisabledReason = !hasValidWinner
    ? `Bo${match.bestOf} cần một đội thắng đủ ${neededWins} ván (hoặc chọn Xử thắng).`
    : undefined;

  const mapLabel = MAP_TYPE_LABEL[tournament.mapType ?? "ally"];

  const handleSave = () => {
    if (!hasValidWinner) return;
    if (isForfeit) {
      onSave({
        games: [],
        forfeit: { winner: forfeitWinner, reason: forfeitReason },
        note,
      });
    } else {
      const games: MatchGame[] = gameWinners
        .filter((w): w is "A" | "B" => w === "A" || w === "B")
        .map((winner) => ({ winner }));
      onSave({ games, note });
    }
  };

  return (
    <Dialog
      title={`Trận #${match.number} · ${match.round}`}
      description={`Thể thức Bo${match.bestOf} · ${mapLabel} · ${formatDateTimeShort(match.scheduledAt)}`}
      size="lg"
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Đóng</Button>
          {match.status === "live" && !moderator && (
            <Button variant="primary" icon={<Icon name="eye" size={16} />} onClick={onWatch}>
              Vào xem
            </Button>
          )}
          {editable && match.status === "upcoming" && (
            <Button variant="secondary" onClick={onMarkLive}>
              ● Đang đấu
            </Button>
          )}
          {editable && (
            saveDisabledReason ? (
              <Tooltip content={saveDisabledReason}>
                <span>
                  <Button variant="primary" disabled>
                    Lưu kết quả
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button variant="primary" onClick={handleSave}>
                Lưu kết quả
              </Button>
            )
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3 bg-black/60 p-4 text-tone-text bevel-sunken">
        {/* Two teams + Scoreboard */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-white/15 pb-3">
          <TeamRosterColumn team={teamA} fallback={nameA} align="left" isWinner={match.winnerId === teamA?.id} />

          <div className="flex flex-col items-center justify-center px-2 pt-2">
            <div className="font-heading text-2xl font-bold tabular text-tone-state">
              {editable || match.status === "done" || match.status === "forfeit" || match.status === "live"
                ? `${scoreA} – ${scoreB}`
                : "VS"}
            </div>
            <span className="mt-1 font-body text-xs text-tone-text/65">Bo{match.bestOf}</span>
          </div>

          <TeamRosterColumn team={teamB} fallback={nameB} align="right" isWinner={match.winnerId === teamB?.id} />
        </div>

        {/* Locked edit notice for QTV */}
        {moderator && !editable && match.status !== "bye" && teamA && teamB && (
          <p className="m-0 bg-black/40 px-3 py-1.5 font-body text-xs text-warning-on-dark">
            {tournament.phase === "finished"
              ? "Giải đấu đã kết thúc — chỉ đọc."
              : "Không thể sửa kết quả vì trận vòng sau đã có kết quả."}
          </p>
        )}

        {/* Result entry / display */}
        {match.status === "bye" ? (
          <p className="m-0 font-body text-sm text-tone-text/80">
            {nameA} được miễn đấu vòng 1 và tự động tiến vào vòng sau.
          </p>
        ) : editable ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Checkbox
                label="Xử thắng (bỏ cuộc / trễ giờ)"
                checked={isForfeit}
                onChange={(e) => setIsForfeit(e.target.checked)}
              />
            </div>

            {isForfeit ? (
              <div className="grid grid-cols-2 gap-3 bg-black/40 p-3 bevel-sunken-1">
                <RadioGroup
                  label="Đội được xử thắng"
                  value={forfeitWinner}
                  onChange={setForfeitWinner}
                  options={[
                    { value: "A", label: nameA },
                    { value: "B", label: nameB },
                  ]}
                />
                <FormField label="Lý do">
                  <Select
                    aria-label="Lý do xử thắng"
                    options={FORFEIT_REASONS}
                    value={forfeitReason}
                    onChange={setForfeitReason}
                  />
                </FormField>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="font-heading text-xs font-semibold uppercase tracking-wide text-tone-text/70">
                  Kết quả từng ván ({mapLabel})
                </div>
                {Array.from({ length: match.bestOf }, (_, idx) => {
                  const w = gameWinners[idx];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 bg-black/40 px-3 py-1.5 bevel-sunken-1"
                    >
                      <span className="font-body text-sm font-semibold text-tone-state">
                        Ván {idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <RadioGroup
                          label={`Ván ${idx + 1}`}
                          orientation="horizontal"
                          value={w ?? ""}
                          onChange={(val) =>
                            setGameWinners((prev) =>
                              prev.map((v, i) => (i === idx ? (val as "A" | "B") : v)),
                            )
                          }
                          options={[
                            { value: "A", label: nameA },
                            { value: "B", label: nameB },
                          ]}
                          className="[&>legend]:sr-only"
                        />
                        {w && (
                          <button
                            type="button"
                            onClick={() =>
                              setGameWinners((prev) => prev.map((v, i) => (i === idx ? undefined : v)))
                            }
                            className="font-body text-xs text-tone-text/60 hover:text-tone-focus"
                          >
                            Xoá
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <FormField label="Ghi chú trận đấu">
              <Input
                value={note}
                maxLength={120}
                placeholder="Tuỳ chọn — hiện trong Lịch sử đấu"
                onChange={(e) => setNote(e.target.value)}
              />
            </FormField>
          </div>
        ) : (
          /* Read-only view for players */
          <div className="flex flex-col gap-2">
            {match.forfeit ? (
              <p className="m-0 font-body text-sm text-warning-on-dark">
                Xử thắng cho <strong>{match.forfeit.winner === "A" ? nameA : nameB}</strong> — Lý do:{" "}
                {match.forfeit.reason}
              </p>
            ) : match.games.length > 0 ? (
              <div className="flex flex-col gap-1">
                {match.games.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-black/40 px-3 py-1.5 font-body text-sm"
                  >
                    <span className="text-tone-text/75">
                      Ván {idx + 1} · {mapLabel}
                    </span>
                    <span className="font-semibold text-tone-focus">
                      Thắng: {g.winner === "A" ? nameA : nameB}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 font-body text-sm text-tone-text/70">
                {match.status === "live"
                  ? "Trận đấu đang diễn ra."
                  : "Chưa có kết quả ván đấu."}
              </p>
            )}
            {match.note && (
              <p className="m-0 font-body text-xs text-tone-text/75">Ghi chú: {match.note}</p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function TeamRosterColumn({
  team,
  fallback,
  align,
  isWinner,
}: {
  team?: Team;
  fallback: string;
  align: "left" | "right";
  isWinner: boolean;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", align === "right" && "items-end text-right")}>
      <div className="flex items-center gap-1.5">
        {isWinner && <Icon name="trophy" size={16} className="text-tone-focus" />}
        <span
          className={cx(
            "font-heading text-base font-semibold",
            isWinner ? "text-tone-focus" : "text-tone-state",
          )}
        >
          {fallback}
        </span>
      </div>
      {team && team.members.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {team.members.map((m, i) => (
            <li
              key={m.id}
              className={cx(
                "flex items-center gap-1.5 font-body text-xs text-tone-text/85",
                align === "right" && "flex-row-reverse",
              )}
            >
              <Avatar name={m.name} source={m.avatar} size="xs" />
              <span>{m.name}</span>
              {i === 0 && <Icon name="crown" size={12} className="text-tone-focus" />}
            </li>
          ))}
        </ul>
      ) : (
        <span className="font-body text-xs text-tone-text/50">Chưa có danh sách</span>
      )}
    </div>
  );
}

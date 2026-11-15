import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Icon, ProgressBar, cx } from "../../../../components";
import {
  formatCountdown,
  formatDateTimeShort,
  GAME_TYPE_LABEL,
  MAP_TYPE_LABEL,
  PHASE_LABEL,
  type Tournament,
  type TournamentPhase,
} from "../../tournamentMock";
import { LINE, PanelTitle } from "../panel";

export interface TournamentStripProps {
  tournaments: Tournament[];
  onOpenTournaments: () => void;
}

const PHASE_ORDER: Record<TournamentPhase, number> = {
  registration: 0,
  playing: 1,
  drawing: 2,
  draft: 3,
  finished: 4,
};

const PHASE_BADGE: Record<TournamentPhase, string> = {
  registration: "bg-success text-success-on",
  playing: "bg-warning text-warning-on",
  drawing: "bg-info text-info-on",
  draft: "bg-black/60 text-tone-text",
  finished: "bg-status-offline text-black",
};

const COSMETIC_REWARDS = [
  "Danh hiệu Quán quân",
  "Khung Sa thạch",
  "Khung Đá đen",
  "Huy hiệu Mùa 3",
];

/** §3.3 Horizontal strip of up to 4 tournament cards sorted by active phase. */
export function TournamentStrip({ tournaments, onOpenTournaments }: TournamentStripProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    return [...tournaments]
      .sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase])
      .slice(0, 4);
  }, [tournaments]);

  return (
    <section
      aria-label="Giải đấu"
      className="flex h-[170px] shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised-2"
    >
      <PanelTitle
        trailing={
          <Button variant="secondary" size="sm" onClick={onOpenTournaments}>
            Xem tất cả →
          </Button>
        }
      >
        Giải đấu
      </PanelTitle>
      <div className={`h-px shrink-0 ${LINE}`} />

      {visible.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4">
          <EmptyState
            title="Chưa có giải đấu nào sắp diễn ra"
            description="Quay lại sau hoặc theo dõi thông báo từ ban tổ chức."
          />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-2.5 p-2.5">
          {visible.map((t, idx) => {
            const pct = Math.round((t.teams.length / t.maxTeams) * 100);
            const formatText = t.mapType
              ? `${GAME_TYPE_LABEL[t.gameType]} · ${MAP_TYPE_LABEL[t.mapType]}`
              : GAME_TYPE_LABEL[t.gameType];
            const timeLabel =
              t.phase === "registration" || t.phase === "drawing"
                ? `Còn ${formatCountdown(t.startAt, nowMs)}`
                : formatDateTimeShort(t.startAt);
            const rewardLabel = COSMETIC_REWARDS[idx % COSMETIC_REWARDS.length];

            return (
              <button
                key={t.id}
                type="button"
                onClick={onOpenTournaments}
                className="flex min-w-0 flex-col justify-between bg-black/40 p-2.5 text-left bevel-raised-1 transition-colors duration-fast hover:bg-black/60 focus-visible:outline-game-out"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-heading text-sm font-semibold text-tone-state">
                    {t.name}
                  </span>
                  <span
                    className={cx(
                      "inline-flex h-[18px] shrink-0 items-center px-1.5 font-heading text-xs font-semibold leading-none text-shadow-none",
                      PHASE_BADGE[t.phase],
                    )}
                  >
                    {PHASE_LABEL[t.phase]}
                  </span>
                </div>

                <div className="truncate font-body text-xs text-tone-text/75">{formatText}</div>

                <div className="flex items-center gap-2">
                  <ProgressBar
                    value={pct}
                    showLabel={false}
                    label={`Số đội ${t.teams.length}/${t.maxTeams}`}
                    className="flex-1"
                  />
                  <span className="shrink-0 font-body text-xs tabular text-tone-state">
                    {t.teams.length}/{t.maxTeams}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 font-body text-xs text-tone-text/70">
                  <span className="truncate tabular">{timeLabel}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 truncate text-tone-focus">
                    <Icon name="trophy" size={12} />
                    {rewardLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}


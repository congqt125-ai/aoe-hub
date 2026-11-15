import { useMemo } from "react";
import { Avatar, Button, Icon } from "../../../../components";
import {
  formatDateTimeShort,
  roundTitle,
  teamDisplayName,
  type Team,
  type Tournament,
  type TournamentMatch,
} from "../../tournamentMock";
import { LINE, PanelTitle } from "../panel";

export interface LiveAndChampionProps {
  tournaments: Tournament[];
  onGoTournament: () => void;
  onOpenProfile: (playerId: string) => void;
}

interface LiveMatchItem {
  tournament: Tournament;
  match: TournamentMatch;
  roundLabel: string;
  teamAName: string;
  teamBName: string;
}

/** §3.7 Live tournament matches (1–2) and most recent tournament champion; each hides when empty. */
export function LiveAndChampion({
  tournaments,
  onGoTournament,
  onOpenProfile,
}: LiveAndChampionProps) {
  const liveMatches = useMemo<LiveMatchItem[]>(() => {
    const items: LiveMatchItem[] = [];
    for (const t of tournaments) {
      const totalRounds = Math.round(Math.log2(t.maxTeams));
      for (const m of t.matches) {
        if (m.status !== "live") continue;
        const teamA = t.teams.find((tm) => tm.id === m.teamAId);
        const teamB = t.teams.find((tm) => tm.id === m.teamBId);
        items.push({
          tournament: t,
          match: m,
          roundLabel: roundTitle(m.roundIndex, totalRounds),
          teamAName: teamA ? teamDisplayName(teamA) : "Đội A",
          teamBName: teamB ? teamDisplayName(teamB) : "Đội B",
        });
        if (items.length >= 2) return items;
      }
    }
    return items;
  }, [tournaments]);

  const champion = useMemo<{
    tournament: Tournament;
    team: Team;
    dateLabel: string;
  } | null>(() => {
    const finished = tournaments.find((t) => t.phase === "finished");
    if (!finished) return null;
    const finalMatch = [...finished.matches]
      .sort((a, b) => b.roundIndex - a.roundIndex)
      .find((m) => m.winnerId);
    const winningTeam =
      finished.teams.find((tm) => tm.id === finalMatch?.winnerId) ?? finished.teams[0];
    if (!winningTeam) return null;
    return {
      tournament: finished,
      team: winningTeam,
      dateLabel: formatDateTimeShort(finalMatch?.completedAt ?? finished.startAt),
    };
  }, [tournaments]);

  return (
    <>
      {liveMatches.length > 0 && (
        <section
          aria-label="Đang đấu trực tiếp"
          className="flex shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised-2"
        >
          <PanelTitle>Đang đấu trực tiếp</PanelTitle>
          <div className={`h-px shrink-0 ${LINE}`} />
          <div className="divide-y divide-white/10">
            {liveMatches.map(({ tournament, match, roundLabel, teamAName, teamBName }) => (
              <div
                key={`${tournament.id}-${match.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-body text-xs text-tone-text/70">
                    {roundLabel} · {tournament.name}
                  </span>
                  <span className="truncate font-heading text-sm font-semibold text-tone-state">
                    {teamAName}{" "}
                    <span className="tabular text-tone-focus">
                      {match.scoreA}–{match.scoreB}
                    </span>{" "}
                    {teamBName}
                  </span>
                </div>
                <Button variant="secondary" size="sm" onClick={onGoTournament}>
                  Vào xem
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {champion && (
        <section
          aria-label="Vô địch gần nhất"
          className="flex shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised-2"
        >
          <PanelTitle
            trailing={<Icon name="trophy" size={16} className="text-tone-focus" />}
          >
            Vô địch gần nhất
          </PanelTitle>
          <div className={`h-px shrink-0 ${LINE}`} />
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-heading text-sm font-semibold text-tone-focus">
                {teamDisplayName(champion.team)}
              </span>
              <span className="truncate font-body text-xs text-tone-text/75">
                {champion.tournament.name} · {champion.dateLabel}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {champion.team.members.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  title={m.name}
                  onClick={() => onOpenProfile(m.id)}
                  className="rounded-full focus-visible:outline-game-out"
                >
                  <Avatar name={m.name} source={m.avatar} player={m.color} size="xs" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

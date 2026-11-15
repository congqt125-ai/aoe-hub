import { useMemo, useState } from "react";
import { Button, EmptyState, Icon, cx } from "../../../components";
import {
  canEditBracketSlot, formatDateTimeShort, matchRoomOccupancy, teamNameById,
  type BracketSlotRef, type MatchStatus, type Team, type Tournament, type TournamentMatch,
} from "../tournamentMock";

const STATUS_TEXT: Record<MatchStatus, string> = {
  upcoming: "Sắp đấu",
  live: "● Đang đấu",
  done: "Xong",
  forfeit: "Xử thắng",
  bye: "Miễn đấu",
};

export function Bracket({
  tournament,
  myTeamId,
  moderator = false,
  onSelectMatch,
  onEnterRoom,
  onSwapTeams,
}: {
  tournament: Tournament;
  myTeamId?: string | null;
  moderator?: boolean;
  onSelectMatch: (match: TournamentMatch) => void;
  onEnterRoom?: (match: TournamentMatch, mode: "join" | "watch") => void;
  onSwapTeams?: (from: BracketSlotRef, to: BracketSlotRef) => void;
}) {
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<(BracketSlotRef & { roundIndex: number; canEditSource: boolean }) | null>(null);
  const [dropTarget, setDropTarget] = useState<BracketSlotRef | null>(null);

  const rounds = useMemo(() => {
    const map = new Map<number, TournamentMatch[]>();
    for (const m of tournament.matches) {
      const list = map.get(m.roundIndex) ?? [];
      list.push(m);
      map.set(m.roundIndex, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([roundIndex, list]) => ({
        roundIndex,
        title: list[0]?.round ?? `Vòng ${roundIndex + 1}`,
        matches: list.sort((a, b) => a.slot - b.slot),
      }));
  }, [tournament.matches]);

  if (rounds.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Chưa có sơ đồ đấu"
          description="Sơ đồ nhánh loại trực tiếp sẽ được tạo khi QTV chốt đội & bốc thăm."
          art={{ set: "building:greek", frame: 4 }}
        />
      </div>
    );
  }

  const totalRounds = rounds.length;
  const round0Count = rounds[0]?.matches.length ?? 1;
  // Minimum height scales with round 1 match count so 16/32 teams have clean spacing.
  const minTrackHeight = Math.max(360, round0Count * 104);
  const canDragDrop = moderator && tournament.phase !== "finished" && !!onSwapTeams;

  const handleDropSlot = (target: BracketSlotRef) => {
    if (dragSource && onSwapTeams && !(dragSource.matchId === target.matchId && dragSource.side === target.side)) {
      onSwapTeams(dragSource, target);
    }
    setDragSource(null);
    setDropTarget(null);
  };

  return (
    <div className="overflow-x-auto pb-2">
      {canDragDrop && (
        <div className="mb-2 flex items-center gap-1.5 font-body text-xs text-tone-text/75">
          <Icon name="info" size={12} className="shrink-0 text-tone-focus" />
          <span>QTV: Kéo thả đội giữa các cặp chưa đấu để sắp xếp lại sơ đồ. Trận đã đấu không thể sửa.</span>
        </div>
      )}
      <div
        className="flex min-w-max gap-0"
        style={{ minHeight: `${minTrackHeight}px` }}
      >
        {rounds.map((col, colIdx) => {
          const isLastRound = colIdx === totalRounds - 1;
          return (
            <div key={col.roundIndex} className="flex w-[240px] shrink-0 flex-col">
              {/* Round column header */}
              <div className="mb-2 border-b border-white/15 bg-black/35 px-3 py-1.5 text-center font-heading text-xs font-semibold uppercase tracking-wide text-tone-state">
                {col.title}
              </div>

              {/* Matches evenly spaced so each next-round match sits centered between its 2 feeders */}
              <div className="flex flex-1 flex-col">
                {col.matches.map((match) => {
                  const isTopOfPair = match.slot % 2 === 0;
                  const canEditMatch = canDragDrop && canEditBracketSlot(tournament, match);
                  return (
                    <div
                      key={match.id}
                      className="relative flex flex-1 items-center px-3 py-1.5"
                    >
                      {/* Incoming connector from previous round */}
                      {colIdx > 0 && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-1/2 w-3 border-t border-white/25"
                        />
                      )}

                      <MatchCard
                        match={match}
                        tournament={tournament}
                        teams={tournament.teams}
                        myTeamId={myTeamId}
                        hoveredTeamId={hoveredTeamId}
                        onHoverTeam={setHoveredTeamId}
                        canDragDrop={canDragDrop}
                        canEdit={canEditMatch}
                        dragSource={dragSource}
                        dropTarget={dropTarget}
                        onDragStartSlot={(slot) =>
                          setDragSource({ ...slot, roundIndex: match.roundIndex, canEditSource: canEditMatch })
                        }
                        onDragOverSlot={setDropTarget}
                        onDragLeaveSlot={(slot) =>
                          setDropTarget((prev) =>
                            prev && prev.matchId === slot.matchId && prev.side === slot.side ? null : prev,
                          )
                        }
                        onDropSlot={handleDropSlot}
                        onDragEndSlot={() => {
                          setDragSource(null);
                          setDropTarget(null);
                        }}
                        onEnterRoom={onEnterRoom}
                        onClick={() => onSelectMatch(match)}
                      />

                      {/* Outgoing connector to next round */}
                      {!isLastRound && (
                        <span
                          aria-hidden
                          className={cx(
                            "pointer-events-none absolute right-0 w-3 border-r border-white/25",
                            isTopOfPair
                              ? "top-1/2 bottom-0 border-t"
                              : "top-0 h-1/2 border-b",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  tournament,
  teams,
  myTeamId,
  hoveredTeamId,
  onHoverTeam,
  canDragDrop,
  canEdit,
  dragSource,
  dropTarget,
  onDragStartSlot,
  onDragOverSlot,
  onDragLeaveSlot,
  onDropSlot,
  onDragEndSlot,
  onEnterRoom,
  onClick,
}: {
  match: TournamentMatch;
  tournament: Tournament;
  teams: Team[];
  myTeamId?: string | null;
  hoveredTeamId: string | null;
  onHoverTeam: (id: string | null) => void;
  canDragDrop: boolean;
  canEdit: boolean;
  dragSource: (BracketSlotRef & { roundIndex: number; canEditSource: boolean }) | null;
  dropTarget: BracketSlotRef | null;
  onDragStartSlot: (slot: BracketSlotRef) => void;
  onDragOverSlot: (slot: BracketSlotRef) => void;
  onDragLeaveSlot: (slot: BracketSlotRef) => void;
  onDropSlot: (slot: BracketSlotRef) => void;
  onDragEndSlot: () => void;
  onEnterRoom?: (match: TournamentMatch, mode: "join" | "watch") => void;
  onClick: () => void;
}) {
  const nameA = teamNameById(teams, match.teamAId);
  const nameB = teamNameById(teams, match.teamBId);
  const isFinished = match.status === "done" || match.status === "forfeit";
  const isLive = match.status === "live";
  const isBye = match.status === "bye";

  const hasMyTeam =
    !!myTeamId && (match.teamAId === myTeamId || match.teamBId === myTeamId);
  const hasHoveredTeam =
    !!hoveredTeamId &&
    (match.teamAId === hoveredTeamId || match.teamBId === hoveredTeamId);

  const aWon = isFinished && match.winnerId === match.teamAId;
  const bWon = isFinished && match.winnerId === match.teamBId;
  const aLost = isFinished && !!match.teamAId && match.winnerId !== match.teamAId;
  const bLost = isFinished && !!match.teamBId && match.winnerId !== match.teamBId;

  const placeholderA = match.fromMatchA
    ? `Chờ đội thắng trận ${match.fromMatchA}`
    : "Chưa xác định";
  const placeholderB = isBye
    ? "Miễn đấu"
    : match.fromMatchB
      ? `Chờ đội thắng trận ${match.fromMatchB}`
      : "Chưa xác định";

  const renderTeamRow = (
    side: "A" | "B",
    teamId: string | undefined,
    name: string | undefined,
    placeholder: string,
    score: number,
    won: boolean,
    lost: boolean,
  ) => {
    const canDrag = canDragDrop && !!teamId;
    const isDraggingThis =
      dragSource?.matchId === match.id && dragSource?.side === side;
    const isSameRound = dragSource?.roundIndex === match.roundIndex;
    const canDropHere =
      canEdit &&
      !!dragSource &&
      !(dragSource.matchId === match.id && dragSource.side === side) &&
      (!isSameRound || dragSource.canEditSource);
    const isDropTarget =
      canDropHere &&
      dropTarget?.matchId === match.id &&
      dropTarget?.side === side;

    return (
      <div
        draggable={canDrag}
        onDragStart={(e) => {
          if (!canDrag) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", `${match.id}:${side}`);
          onDragStartSlot({ matchId: match.id, side });
        }}
        onDragOver={(e) => {
          if (!canDropHere) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onDragOverSlot({ matchId: match.id, side });
        }}
        onDragLeave={() => {
          if (isDropTarget) onDragLeaveSlot({ matchId: match.id, side });
        }}
        onDrop={(e) => {
          if (!canDropHere) return;
          e.preventDefault();
          e.stopPropagation();
          onDropSlot({ matchId: match.id, side });
        }}
        onDragEnd={onDragEndSlot}
        onMouseEnter={() => teamId && onHoverTeam(teamId)}
        onMouseLeave={() => onHoverTeam(null)}
        className={cx(
          "group/slot flex h-7 items-center justify-between gap-1.5 px-2 font-body text-sm transition-colors",
          lost && "opacity-45",
          hoveredTeamId && teamId === hoveredTeamId && "bg-white/10",
          canDrag && "cursor-grab active:cursor-grabbing",
          isDraggingThis && "opacity-40",
          isDropTarget && "bg-tone-focus/20 ring-1 ring-inset ring-tone-focus",
        )}
      >
        <span
          className={cx(
            "min-w-0 flex-1 truncate",
            won
              ? "font-bold text-tone-focus"
              : name
                ? teamId === myTeamId
                  ? "font-semibold text-tone-focus"
                  : "text-tone-state"
                : "text-xs italic text-tone-text/45",
          )}
        >
          {name ?? placeholder}
        </span>
        {canDrag && (
          <span
            aria-hidden
            className="shrink-0 text-[10px] leading-none text-tone-text/35 group-hover/slot:text-tone-focus"
          >
            ⋮⋮
          </span>
        )}
        {(isFinished || isLive) && (
          <span
            className={cx(
              "shrink-0 tabular font-heading text-sm font-bold",
              won ? "text-tone-focus" : "text-tone-text/80",
            )}
          >
            {score}
          </span>
        )}
      </div>
    );
  };

  const canPlayRoom = hasMyTeam && (isLive || match.status === "upcoming") && !!match.teamAId && !!match.teamBId;
  const canWatchRoom = !hasMyTeam && isLive;
  const occ = matchRoomOccupancy(tournament, match);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cx(
        "group/card relative flex w-full cursor-pointer flex-col bg-black/65 text-left bevel-raised-1 transition-all duration-100",
        "hover:bg-black/45 focus-visible:outline-none focus-visible:outline-game",
        hasMyTeam && "ring-1 ring-tone-focus",
        hasHoveredTeam && !hasMyTeam && "ring-1 ring-tone-state/70 brightness-110",
        isBye && "opacity-75",
      )}
    >
      {/* Top meta row: match number + BoN + time + status */}
      <div className="flex items-center justify-between gap-1.5 border-b border-white/10 bg-black/35 px-2 py-0.5 font-body text-xs">
        <span className="truncate tabular text-tone-text/60">
          #{match.number} · Bo{match.bestOf} · {formatDateTimeShort(match.scheduledAt)}
        </span>
        <span
          className={cx(
            "font-semibold",
            isLive
              ? "text-success-on-dark"
              : match.status === "forfeit"
                ? "text-warning-on-dark"
                : isFinished
                  ? "text-tone-state"
                  : "text-tone-text/65",
          )}
        >
          {STATUS_TEXT[match.status]}
        </span>
      </div>

      {renderTeamRow("A", match.teamAId, nameA, placeholderA, match.scoreA, aWon, aLost)}
      <div className="h-px bg-white/10" />
      {renderTeamRow("B", match.teamBId, nameB, placeholderB, match.scoreB, bWon, bLost)}

      {onEnterRoom && !dragSource && (canPlayRoom || canWatchRoom) && (
        <div
          className={cx(
            "pointer-events-none absolute bottom-1.5 right-1.5 top-[22px] flex items-center transition-opacity",
            isLive
              ? "opacity-100"
              : "opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100",
          )}
        >
          <Button
            size="sm"
            variant={canPlayRoom ? "primary" : "secondary"}
            className="pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onEnterRoom(match, canPlayRoom ? "join" : "watch");
            }}
          >
            {canPlayRoom ? `Vào phòng (${occ.players}/${occ.maxPlayers})` : "Vào xem"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Champion & Runner-up banner shown above Bracket when phase === "finished". */
export function TournamentPodiumBanner({ tournament }: { tournament: Tournament }) {
  const finalMatch = tournament.matches.reduce<TournamentMatch | undefined>(
    (best, m) => (!best || m.roundIndex > best.roundIndex ? m : best),
    undefined,
  );
  if (!finalMatch || !finalMatch.winnerId) return null;

  const champion = tournament.teams.find((t) => t.id === finalMatch.winnerId);
  const runnerUpId =
    finalMatch.teamAId === finalMatch.winnerId ? finalMatch.teamBId : finalMatch.teamAId;
  const runnerUp = tournament.teams.find((t) => t.id === runnerUpId);
  if (!champion) return null;

  return (
    <section
      aria-label="Kết quả chung cuộc"
      className="mb-4 flex items-center justify-between gap-4 bg-black/55 p-4 bevel-raised ring-1 ring-tone-focus"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-black/50 text-tone-focus bevel-sunken">
          <Icon name="trophy" size={24} />
        </div>
        <div>
          <div className="font-heading text-xs font-semibold uppercase tracking-wide text-tone-focus">
            Vô địch {tournament.name}
          </div>
          <div className="font-heading text-xl font-bold text-tone-state">
            {champion.customName?.trim() || `Đội ${champion.number}`}
          </div>
          <div className="font-body text-xs text-tone-text/80">
            Thành viên: {champion.members.map((m) => m.name).join(" · ")}
          </div>
        </div>
      </div>

      {runnerUp && (
        <div className="shrink-0 border-l border-white/15 pl-4 text-right">
          <div className="font-heading text-xs font-semibold uppercase tracking-wide text-tone-text/65">
            Á quân (Hạng 2)
          </div>
          <div className="font-heading text-md font-semibold text-tone-state">
            {runnerUp.customName?.trim() || `Đội ${runnerUp.number}`}
          </div>
          <div className="font-body text-xs text-tone-text/70">
            Tỉ số Chung kết: {finalMatch.scoreA}–{finalMatch.scoreB}
          </div>
        </div>
      )}
    </section>
  );
}


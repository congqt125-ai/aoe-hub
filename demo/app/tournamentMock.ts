// Mock data and state helpers for T5 (Giải đấu). Not part of the component library.
import type { ChatMessageData, Player } from "../../components";
import { makePlayers, pick, rng, type LobbyRoom } from "./lobbyMock";
import { GAME_TYPES, MAP_TYPES, type GameType, type MapType } from "./roomMock";

export type TournamentPhase = "draft" | "registration" | "drawing" | "playing" | "finished";
export type MatchStatus = "upcoming" | "live" | "done" | "forfeit" | "bye";

export interface Team {
  id: string;
  /** 1-based slot number; fallback name is "Đội <number>". */
  number: number;
  customName?: string;
  /** Ordered by join time; index 0 is the captain. Max 4. */
  members: Player[];
  eliminated?: { reason: string; round?: string };
}

export interface MatchGame {
  winner: "A" | "B";
  note?: string;
}

export interface TournamentMatch {
  id: string;
  /** 1-based bracket match number for "Chờ đội thắng trận X". */
  number: number;
  /** 0-based round index. */
  roundIndex: number;
  round: string;
  /** 0-based slot inside the round. */
  slot: number;
  teamAId?: string;
  teamBId?: string;
  fromMatchA?: number;
  fromMatchB?: number;
  bestOf: 1 | 3 | 5;
  games: MatchGame[];
  scoreA: number;
  scoreB: number;
  winnerId?: string;
  forfeit?: { winner: "A" | "B"; reason: string };
  note?: string;
  status: MatchStatus;
  scheduledAt: string;
  completedAt?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  mapType?: MapType;
  prize: string;
  phase: TournamentPhase;
  maxTeams: 8 | 16;
  minPerTeam: number;
  boRegular: 1 | 3;
  boFinals: 3 | 5;
  /** ISO datetime string for team lock & bracket draw. */
  drawAt: string;
  /** ISO datetime string for round 1 start. */
  startAt: string;
  roundGapDays: number;
  rules: string;
  teams: Team[];
  matches: TournamentMatch[];
  chat: ChatMessageData[];
}

export const TEAM_MAX_MEMBERS = 4;

export const PHASE_LABEL: Record<TournamentPhase, string> = {
  draft: "Nháp",
  registration: "Đang đăng ký",
  drawing: "Ngày xếp đội",
  playing: "Đang đấu",
  finished: "Đã kết thúc",
};

export const GAME_TYPE_LABEL: Record<GameType, string> = Object.fromEntries(
  GAME_TYPES.map((g) => [g.value, g.label]),
) as Record<GameType, string>;

export const MAP_TYPE_LABEL: Record<MapType, string> = Object.fromEntries(
  MAP_TYPES.map((m) => [m.value, m.label]),
) as Record<MapType, string>;

export const DEFAULT_RULES_TEMPLATE = `1. Thể thức & bản đồ
- Thi đấu loại trực tiếp theo nhánh đã bốc thăm.
- Đúng thể loại đã công bố (Random hoặc Cung R Shang), bản đồ đồng minh mặc định.
- Không sử dụng bug game, cheat hoặc phần mềm can thiệp.

2. Điểm danh & xử thua
- Có mặt tại phòng đấu trước giờ thi đấu 10 phút.
- Trễ quá 15 phút kể từ giờ hẹn sẽ bị xử thua ván/trận (tuỳ QTV xác nhận).
- Đội thiếu người dưới mức tối thiểu khi chốt đội sẽ không được vào nhánh.

3. Khiếu nại
- Mọi tranh chấp gửi kèm ảnh chụp màn hình cho QTV trong kênh chat giải.`;

export function teamDisplayName(team: Pick<Team, "number" | "customName">): string {
  const custom = team.customName?.trim();
  return custom ? custom : `Đội ${team.number}`;
}

export function teamNameById(teams: Team[], id?: string): string | undefined {
  if (!id) return undefined;
  const found = teams.find((t) => t.id === id);
  return found ? teamDisplayName(found) : undefined;
}

export function resizeTeams(existing: Team[], maxTeams: 8 | 16): Team[] {
  return Array.from({ length: maxTeams }, (_, i) => {
    const prev = existing[i];
    return prev ?? { id: `t-${i + 1}`, number: i + 1, members: [] };
  });
}

export function formatDateTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatCountdown(targetIso: string, nowMs: number): string {
  const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - nowMs) / 1000));
  if (diff === 0) return "Đã tới giờ";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return days > 0 ? `${days} ngày ${clock}` : clock;
}

export function roundTitle(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIndex;
  if (fromEnd === 0) return "Chung kết";
  if (fromEnd === 1) return "Bán kết";
  if (fromEnd === 2) return "Tứ kết";
  if (fromEnd === 3) return "Vòng 1/8";
  if (fromEnd === 4) return "Vòng 1/16";
  return `Vòng ${roundIndex + 1}`;
}

// ---- Bracket draw & match progression (§3.5 - §3.7)

export function drawTournamentBracket(
  tournament: Tournament,
  seed = Date.now(),
): { tournament: Tournament; eliminatedCount: number; byeCount: number; eligibleCount: number } {
  const r = rng(seed);
  let eliminatedCount = 0;

  const updatedTeams: Team[] = tournament.teams.map((tm) => {
    if (tm.members.length > 0 && tm.members.length < tournament.minPerTeam) {
      eliminatedCount += 1;
      return { ...tm, eliminated: { reason: "Không đủ người" } };
    }
    return { ...tm, eliminated: undefined };
  });

  const eligible = updatedTeams.filter((tm) => tm.members.length >= tournament.minPerTeam);
  // Fisher-Yates shuffle
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Round up to nearest power of 2 (min 2)
  let bracketSize = 2;
  while (bracketSize < shuffled.length) bracketSize *= 2;
  const totalRounds = Math.log2(bracketSize);
  const round0Count = bracketSize / 2;

  // Spread teams across round 0 matches so at most 1 team is missing per match (bye)
  const slotA: (string | undefined)[] = Array(round0Count).fill(undefined);
  const slotB: (string | undefined)[] = Array(round0Count).fill(undefined);
  for (let i = 0; i < shuffled.length; i++) {
    if (i < round0Count) slotA[i] = shuffled[i].id;
    else slotB[i - round0Count] = shuffled[i].id;
  }

  const startMs = new Date(tournament.startAt).getTime() || Date.now();
  const gapMs = Math.max(1, tournament.roundGapDays) * 86400_000;
  const matches: TournamentMatch[] = [];
  let matchNum = 1;
  let byeCount = 0;

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const count = bracketSize / 2 ** (roundIdx + 1);
    const isFinalOrSemi = totalRounds - 1 - roundIdx <= 1;
    const bestOf = isFinalOrSemi ? tournament.boFinals : tournament.boRegular;
    const roundName = roundTitle(roundIdx, totalRounds);

    for (let slot = 0; slot < count; slot++) {
      const scheduledAt = new Date(startMs + roundIdx * gapMs + slot * 1800_000).toISOString();
      if (roundIdx === 0) {
        const teamAId = slotA[slot];
        const teamBId = slotB[slot];
        const isBye = !!teamAId && !teamBId;
        if (isBye) byeCount += 1;
        matches.push({
          id: `m-${tournament.id}-${matchNum}`,
          number: matchNum,
          roundIndex: 0,
          round: roundName,
          slot,
          teamAId,
          teamBId,
          bestOf,
          games: [],
          scoreA: 0,
          scoreB: 0,
          winnerId: isBye ? teamAId : undefined,
          status: isBye ? "bye" : "upcoming",
          scheduledAt,
        });
      } else {
        const prevA = matches.find((m) => m.roundIndex === roundIdx - 1 && m.slot === slot * 2);
        const prevB = matches.find((m) => m.roundIndex === roundIdx - 1 && m.slot === slot * 2 + 1);
        matches.push({
          id: `m-${tournament.id}-${matchNum}`,
          number: matchNum,
          roundIndex: roundIdx,
          round: roundName,
          slot,
          teamAId: prevA?.status === "bye" ? prevA.winnerId : undefined,
          teamBId: prevB?.status === "bye" ? prevB.winnerId : undefined,
          fromMatchA: prevA?.number,
          fromMatchB: prevB?.number,
          bestOf,
          games: [],
          scoreA: 0,
          scoreB: 0,
          status: "upcoming",
          scheduledAt,
        });
      }
      matchNum += 1;
    }
  }

  return {
    tournament: { ...tournament, teams: updatedTeams, matches },
    eliminatedCount,
    byeCount,
    eligibleCount: eligible.length,
  };
}

export function canEditMatchResult(tournament: Tournament, match: TournamentMatch): boolean {
  if (tournament.phase === "finished") return false;
  if (match.status === "bye" || !match.teamAId || !match.teamBId) return false;
  const next = tournament.matches.find(
    (m) => m.roundIndex === match.roundIndex + 1 && m.slot === Math.floor(match.slot / 2),
  );
  if (next && (next.status === "done" || next.status === "forfeit")) return false;
  return true;
}

export interface BracketSlotRef {
  matchId: string;
  side: "A" | "B";
}

/** Whether QTV can drag/drop teams in this match card (blocked for completed matches). */
export function canEditBracketSlot(tournament: Tournament, match: TournamentMatch): boolean {
  if (tournament.phase === "finished") return false;
  if (match.status === "done" || match.status === "forfeit") return false;
  const next = tournament.matches.find(
    (m) => m.roundIndex === match.roundIndex + 1 && m.slot === Math.floor(match.slot / 2),
  );
  if (next && (next.status === "done" || next.status === "forfeit")) return false;
  return true;
}

/**
 * Move/assign a team slot in the bracket:
 * - Same round: swap the two slots (both matches must be editable).
 * - Different round: copy/assign `from` team into `to` slot without removing it from `from`
 *   (only `to` match must be editable, so e.g. dragging a team from a finished match to the next round works).
 */
export function swapBracketTeams(
  tournament: Tournament,
  from: BracketSlotRef,
  to: BracketSlotRef,
): Tournament {
  if (from.matchId === to.matchId && from.side === to.side) return tournament;
  const srcMatch = tournament.matches.find((m) => m.id === from.matchId);
  const dstMatch = tournament.matches.find((m) => m.id === to.matchId);
  if (!srcMatch || !dstMatch) return tournament;

  const sameRound = srcMatch.roundIndex === dstMatch.roundIndex;
  if (!canEditBracketSlot(tournament, dstMatch)) return tournament;
  if (sameRound && !canEditBracketSlot(tournament, srcMatch)) return tournament;

  const srcTeamId = from.side === "A" ? srcMatch.teamAId : srcMatch.teamBId;
  const dstTeamId = to.side === "A" ? dstMatch.teamAId : dstMatch.teamBId;
  if (sameRound && !srcTeamId && !dstTeamId) return tournament;
  if (!sameRound && !srcTeamId) return tournament;

  let matches = tournament.matches.map((m) => {
    let next = m;
    if (sameRound && m.id === from.matchId) {
      next = from.side === "A" ? { ...next, teamAId: dstTeamId } : { ...next, teamBId: dstTeamId };
    }
    if (next.id === to.matchId) {
      next = to.side === "A" ? { ...next, teamAId: srcTeamId } : { ...next, teamBId: srcTeamId };
    }
    return next;
  });

  const affectedIds = new Set(sameRound ? [from.matchId, to.matchId] : [to.matchId]);
  const round1Updates = new Map<string, string | undefined>();

  matches = matches.map((m) => {
    if (!affectedIds.has(m.id) || m.roundIndex !== 0) return m;
    const hasA = !!m.teamAId;
    const hasB = !!m.teamBId;
    const isSingle = hasA !== hasB;
    const singleId = m.teamAId ?? m.teamBId;
    const nextMatch = matches.find(
      (nm) => nm.roundIndex === 1 && nm.slot === Math.floor(m.slot / 2),
    );
    if (nextMatch && nextMatch.status !== "done" && nextMatch.status !== "forfeit") {
      round1Updates.set(`${nextMatch.id}:${m.slot % 2 === 0 ? "A" : "B"}`, isSingle ? singleId : undefined);
    }
    if (isSingle) {
      return { ...m, status: "bye", winnerId: singleId };
    }
    if (m.status === "bye") {
      return { ...m, status: "upcoming", winnerId: undefined };
    }
    return m;
  });

  if (round1Updates.size > 0) {
    matches = matches.map((m) => {
      if (m.roundIndex !== 1) return m;
      let updated = m;
      if (round1Updates.has(`${m.id}:A`)) updated = { ...updated, teamAId: round1Updates.get(`${m.id}:A`) };
      if (round1Updates.has(`${m.id}:B`)) updated = { ...updated, teamBId: round1Updates.get(`${m.id}:B`) };
      return updated;
    });
  }

  return { ...tournament, matches };
}

export function applyMatchResult(
  tournament: Tournament,
  matchId: string,
  payload: { games: MatchGame[]; forfeit?: { winner: "A" | "B"; reason: string }; note?: string },
): Tournament {
  const target = tournament.matches.find((m) => m.id === matchId);
  if (!target || !target.teamAId || !target.teamBId) return tournament;

  let scoreA = 0;
  let scoreB = 0;
  let winnerSide: "A" | "B";

  if (payload.forfeit) {
    winnerSide = payload.forfeit.winner;
    const needed = Math.ceil(target.bestOf / 2);
    scoreA = winnerSide === "A" ? needed : 0;
    scoreB = winnerSide === "B" ? needed : 0;
  } else {
    for (const g of payload.games) {
      if (g.winner === "A") scoreA += 1;
      else scoreB += 1;
    }
    winnerSide = scoreA >= scoreB ? "A" : "B";
  }

  const winnerId = winnerSide === "A" ? target.teamAId : target.teamBId;
  const loserId = winnerSide === "A" ? target.teamBId : target.teamAId;
  const status: MatchStatus = payload.forfeit ? "forfeit" : "done";

  const nextSlot = Math.floor(target.slot / 2);
  const isSideAInNext = target.slot % 2 === 0;
  const maxRound = Math.max(...tournament.matches.map((m) => m.roundIndex));

  const matches = tournament.matches.map((m) => {
    if (m.id === matchId) {
      return {
        ...m,
        games: payload.games,
        scoreA,
        scoreB,
        winnerId,
        forfeit: payload.forfeit,
        note: payload.note?.trim() || undefined,
        status,
        completedAt: new Date().toISOString(),
      };
    }
    if (m.roundIndex === target.roundIndex + 1 && m.slot === nextSlot) {
      return isSideAInNext ? { ...m, teamAId: winnerId } : { ...m, teamBId: winnerId };
    }
    return m;
  });

  // Update eliminated status on teams (clear old loser if result was edited)
  const teams = tournament.teams.map((tm) => {
    if (tm.id === loserId) {
      return { ...tm, eliminated: { reason: "Thua trận", round: target.round } };
    }
    if (tm.id === winnerId && tm.eliminated?.round === target.round) {
      return { ...tm, eliminated: undefined };
    }
    return tm;
  });

  const nextPhase: TournamentPhase =
    target.roundIndex === maxRound ? "finished" : tournament.phase;

  return { ...tournament, teams, matches, phase: nextPhase };
}

/** Populate mock results on a drawn bracket (used by MockPanel & initial playing/finished tournaments). */
export function populateMockMatches(
  tournament: Tournament,
  doneRatio: number,
  hasLive: boolean,
  seed = 777,
): Tournament {
  const r = rng(seed);
  const drawn = drawTournamentBracket(tournament, seed).tournament;
  let current = { ...drawn, phase: tournament.phase };

  const playable = () =>
    current.matches.filter(
      (m) => m.status === "upcoming" && !!m.teamAId && !!m.teamBId,
    );

  const totalNonBye = Math.max(1, current.matches.filter((m) => m.status !== "bye").length);
  const targetDone = Math.round((doneRatio / 100) * totalNonBye);

  let doneCount = 0;
  while (doneCount < targetDone) {
    const ready = playable();
    if (ready.length === 0) break;
    const m = ready[0];
    const needed = Math.ceil(m.bestOf / 2);
    const winnerA = r() < 0.55;
    const loserWins = Math.floor(r() * needed);
    const games: MatchGame[] = [];
    for (let i = 0; i < needed; i++) games.push({ winner: winnerA ? "A" : "B" });
    for (let i = 0; i < loserWins; i++) games.unshift({ winner: winnerA ? "B" : "A" });

    current = applyMatchResult(current, m.id, { games });
    doneCount += 1;
  }

  if (hasLive && current.phase === "playing") {
    const ready = playable();
    if (ready.length > 0) {
      const liveId = ready[0].id;
      current = {
        ...current,
        matches: current.matches.map((m) =>
          m.id === liveId ? { ...m, status: "live", scoreA: 0, scoreB: 0 } : m,
        ),
      };
    }
  }

  return current;
}

const TEAM_NAMES = [
  "Đội Sói", "Đội Ưng", "Đội Hổ", "Đội Báo", "Đội Rồng", "Lạc Hồng", "Thăng Long", "Bạch Đằng",
  "Đông Đô", "Lam Sơn", "Cửu Long", "Trường Sơn", "Hồng Lạc", "Đại Việt", "Phù Đổng", "Tây Sơn",
];

const TOURNAMENT_CHAT_LINES = [
  "Đội mình còn thiếu 1 slot, ai đánh Cung R vào nhé!",
  "Tối thứ 7 mấy giờ chốt danh sách vậy QTV?",
  "Đội Sói đủ 4 người rồi, hẹn gặp ở vòng 1.",
  "Luật giải này đánh Bo1 vòng ngoài, Bán kết Bo3.",
  "Ai chưa có đội vào Đội 5 đi, đang cần thêm người.",
];

function makeTeams(
  seed: number,
  maxTeams: 8 | 16,
  fillPercent: number,
  pool: Player[],
): Team[] {
  const r = rng(seed);
  let cursor = 0;
  const nextPlayer = (): Player => {
    const base = pool[cursor % pool.length];
    const lap = Math.floor(cursor / pool.length);
    cursor += 1;
    return lap === 0 ? base : { ...base, id: `${base.id}-t${lap}`, name: `${base.name} ${lap + 1}` };
  };

  return Array.from({ length: maxTeams }, (_, i): Team => {
    const roll = r();
    let count = 0;
    if (fillPercent > 0) {
      if (i === 0) count = Math.min(TEAM_MAX_MEMBERS, Math.max(2, Math.round((fillPercent / 100) * TEAM_MAX_MEMBERS)));
      else if (i === 2) count = 0; // Keep an empty slot card visible for "Vào – làm đội trưởng".
      else if (i === 3 && fillPercent >= 40) count = TEAM_MAX_MEMBERS; // Full team example.
      else if (roll * 100 < fillPercent + 20) count = 1 + Math.floor(r() * TEAM_MAX_MEMBERS);
    }
    const members = Array.from({ length: count }, nextPlayer);
    const customName = count > 0 && i < TEAM_NAMES.length && r() < 0.7 ? TEAM_NAMES[i] : undefined;
    return {
      id: `team-${seed}-${i + 1}`,
      number: i + 1,
      customName,
      members,
    };
  });
}

function makeFullTeams(seed: number, count: number, pool: Player[]): Team[] {
  let cursor = 0;
  const nextPlayer = (): Player => {
    const base = pool[cursor % pool.length];
    const lap = Math.floor(cursor / pool.length);
    cursor += 1;
    return lap === 0 ? base : { ...base, id: `${base.id}-f${seed}-${lap}`, name: `${base.name} ${lap + 1}` };
  };

  return Array.from({ length: count }, (_, i): Team => ({
    id: `team-${seed}-${i + 1}`,
    number: i + 1,
    customName: TEAM_NAMES[i] ?? `Đội ${i + 1}`,
    members: Array.from({ length: TEAM_MAX_MEMBERS }, nextPlayer),
  }));
}

function makeTournamentChat(seed: number, pool: Player[]): ChatMessageData[] {
  const r = rng(seed + 99);
  const now = Date.now();
  return Array.from({ length: 5 }, (_, i): ChatMessageData => ({
    id: `tc-${seed}-${i}`,
    kind: "user",
    author: pick(r, pool),
    text: TOURNAMENT_CHAT_LINES[i % TOURNAMENT_CHAT_LINES.length],
    at: new Date(now - (5 - i) * 90_000).toISOString(),
  }));
}

function withMyTeam(tournament: Tournament, me?: Player): Tournament {
  if (!me) return tournament;
  if (tournament.teams.some((tm) => tm.members.some((m) => m.id === me.id))) return tournament;

  let targetTeamId: string | undefined;
  if (tournament.phase === "finished") {
    const finalMatch = tournament.matches.reduce<TournamentMatch | undefined>(
      (best, m) => (!best || m.roundIndex > best.roundIndex ? m : best),
      undefined,
    );
    targetTeamId = finalMatch?.winnerId;
  } else {
    const liveOrNext =
      tournament.matches.find((m) => m.status === "live" && m.teamAId && m.teamBId) ??
      tournament.matches.find((m) => m.status === "upcoming" && m.teamAId && m.teamBId);
    targetTeamId = liveOrNext?.teamAId;
  }
  if (!targetTeamId) return tournament;

  return {
    ...tournament,
    teams: tournament.teams.map((tm) =>
      tm.id === targetTeamId && tm.members.length > 0
        ? { ...tm, members: [me, ...tm.members.slice(1)] }
        : tm,
    ),
  };
}

export function matchRoomOccupancy(
  tournament: Tournament,
  match: TournamentMatch,
): { players: number; maxPlayers: number } {
  const maxPlayers = TEAM_MAX_MEMBERS * 2;
  if (match.status === "live") {
    return { players: maxPlayers, maxPlayers };
  }
  const players = Math.max(1, Math.min(maxPlayers - 1, ((match.number * 3 + tournament.teams.length) % (maxPlayers - 1)) + 1));
  return { players, maxPlayers };
}

export function buildTournamentMatchRoom(tournament: Tournament, match: TournamentMatch): LobbyRoom {
  const teamA = tournament.teams.find((t) => t.id === match.teamAId);
  const teamB = tournament.teams.find((t) => t.id === match.teamBId);
  const occ = matchRoomOccupancy(tournament, match);
  return {
    id: `tour-room-${tournament.id}-${match.id}`,
    name: `${tournament.name} · ${match.round} #${match.number}`,
    host: teamA?.members[0] ?? teamB?.members[0] ?? { id: "qtv", name: "QTV", status: "online" },
    mode: `${GAME_TYPE_LABEL[tournament.gameType]} ${TEAM_MAX_MEMBERS}v${TEAM_MAX_MEMBERS}`,
    map: MAP_TYPE_LABEL[tournament.mapType ?? "ally"],
    players: occ.players,
    maxPlayers: occ.maxPlayers,
    status: match.status === "live" ? "playing" : "waiting",
    category: tournament.gameType === "cungr-shang" ? "cungr" : "random",
    code: String(7000 + match.number),
    spectators: match.status === "live" ? 2 : 0,
    speed: "2.0x",
    startAge: "Đời 1",
    ping: 38,
    hasPassword: false,
  };
}

export function createInitialTournaments(
  baseTimeMs = Date.now(),
  options?: { maxTeams?: 8 | 16; fillPercent?: number; me?: Player },
): Tournament[] {
  const pool = makePlayers(36);
  const maxTeams = options?.maxTeams ?? 8;
  const fillPercent = options?.fillPercent ?? 55;
  const isoIn = (hours: number) => new Date(baseTimeMs + hours * 3600_000).toISOString();

  const clanWarBase: Tournament = {
    id: "clan-war",
    name: "Clan War",
    gameType: "random",
    mapType: "ally",
    prize: "1.000k",
    phase: "playing",
    maxTeams: 8,
    minPerTeam: 4,
    boRegular: 1,
    boFinals: 3,
    drawAt: isoIn(-48),
    startAt: isoIn(-24),
    roundGapDays: 1,
    rules: DEFAULT_RULES_TEMPLATE,
    teams: makeTeams(303, 8, 90, pool),
    matches: [],
    chat: makeTournamentChat(303, pool),
  };

  const daiChien16Base: Tournament = {
    id: "dai-chien-16",
    name: "Đại Chiến 16 Đội",
    gameType: "random",
    mapType: "ally",
    prize: "2.000k",
    phase: "playing",
    maxTeams: 16,
    minPerTeam: 4,
    boRegular: 1,
    boFinals: 3,
    drawAt: isoIn(-36),
    startAt: isoIn(-12),
    roundGapDays: 1,
    rules: DEFAULT_RULES_TEMPLATE,
    teams: makeFullTeams(606, 16, pool),
    matches: [],
    chat: makeTournamentChat(606, pool),
  };

  const cupHeBase: Tournament = {
    id: "cup-he",
    name: "Cúp Hè",
    gameType: "cungr-shang",
    mapType: "light",
    prize: "500k",
    phase: "finished",
    maxTeams: 8,
    minPerTeam: 4,
    boRegular: 1,
    boFinals: 3,
    drawAt: isoIn(-240),
    startAt: isoIn(-216),
    roundGapDays: 1,
    rules: DEFAULT_RULES_TEMPLATE,
    teams: makeTeams(404, 8, 100, pool),
    matches: [],
    chat: makeTournamentChat(404, pool),
  };

  return [
    {
      id: "cup-mua-thu",
      name: "Cúp Mùa Thu",
      gameType: "cungr-shang",
      mapType: "ally",
      prize: "500k",
      phase: "registration",
      maxTeams,
      minPerTeam: 4,
      boRegular: 1,
      boFinals: 3,
      drawAt: isoIn(28.2),
      startAt: isoIn(52.2),
      roundGapDays: 1,
      rules: DEFAULT_RULES_TEMPLATE,
      teams: makeTeams(101, maxTeams, fillPercent, pool),
      matches: [],
      chat: makeTournamentChat(101, pool),
    },
    {
      id: "giao-huu-t7",
      name: "Giao hữu T7",
      gameType: "random",
      mapType: "dark",
      prize: "200k",
      phase: "registration",
      maxTeams: 8,
      minPerTeam: 3,
      boRegular: 1,
      boFinals: 3,
      drawAt: isoIn(76),
      startAt: isoIn(100),
      roundGapDays: 1,
      rules: DEFAULT_RULES_TEMPLATE,
      teams: makeTeams(202, 8, 50, pool),
      matches: [],
      chat: makeTournamentChat(202, pool),
    },
    withMyTeam(populateMockMatches(clanWarBase, 55, true, 303), options?.me),
    withMyTeam(populateMockMatches(daiChien16Base, 45, true, 606), options?.me),
    withMyTeam(populateMockMatches(cupHeBase, 100, false, 404), options?.me),
    {
      id: "giai-mua-dong",
      name: "Giải Mùa Đông",
      gameType: "random",
      mapType: "ally",
      prize: "300k",
      phase: "draft",
      maxTeams: 8,
      minPerTeam: 4,
      boRegular: 1,
      boFinals: 3,
      drawAt: isoIn(120),
      startAt: isoIn(144),
      roundGapDays: 1,
      rules: DEFAULT_RULES_TEMPLATE,
      teams: makeTeams(505, 8, 0, pool),
      matches: [],
      chat: [],
    },
  ];
}

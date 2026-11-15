// T5 Giải đấu: single elimination, teams of up to 4, moderator (QTV) runs everything.
// Bracket draw, auto-advance and dropping short teams happen on the server.
import type { GameType, IsoDateTime, MapType, MatchId, PlayerId, PlayerSummary, RoomId, TeamId, TournamentId } from "./common";

export type TournamentPhase = "draft" | "registration" | "drawing" | "playing" | "finished";
export type TournamentMatchStatus = "upcoming" | "live" | "done" | "forfeit" | "bye";
export type ForfeitReason = "forfeit" | "late" | "other";

export interface TeamDto {
  id: TeamId;
  /** 1-based card number; fallback display name is "Đội <number>". */
  number: number;
  customName?: string;
  /** Join order; [0] is the captain. Max 4. */
  members: PlayerSummary[];
  /** Clan tag when every member is in the same clan (clan achievements). */
  clanTag?: string;
  eliminated?: { reason: "not-enough-members" | "lost"; roundIndex?: number };
}

export interface MatchGameDto {
  winner: "A" | "B";
  note?: string;
}

export interface TournamentMatchDto {
  id: MatchId;
  /** 1-based bracket number ("Chờ đội thắng trận X"). */
  number: number;
  roundIndex: number;
  /** 0-based position inside the round. */
  slot: number;
  teamAId?: TeamId;
  teamBId?: TeamId;
  /** Bracket numbers feeding team A / B. */
  fromMatchA?: number;
  fromMatchB?: number;
  bestOf: 1 | 3 | 5;
  games: MatchGameDto[];
  scoreA: number;
  scoreB: number;
  winnerId?: TeamId;
  forfeit?: { winner: "A" | "B"; reason: ForfeitReason; note?: string };
  note?: string;
  status: TournamentMatchStatus;
  scheduledAt: IsoDateTime;
  completedAt?: IsoDateTime;
  /** Room of a live match ("Vào xem"). */
  liveRoom?: { roomId: RoomId; players: number; spectators: number };
}

export interface TournamentSettingsDto {
  name: string;
  gameType: GameType;
  mapType?: MapType;
  prize?: string;
  maxTeams: 8 | 16;
  /** Minimum members for a team to enter the bracket (1–4). */
  minPerTeam: 1 | 2 | 3 | 4;
  boRegular: 1 | 3;
  /** Semi-finals and final. */
  boFinals: 3 | 5;
  drawAt: IsoDateTime;
  startAt: IsoDateTime;
  /** Days between rounds (setup dialog offers 1 / 2 / 3 / 7). */
  roundGapDays: number;
  rules: string;
}

/** List row (left column, home cards). */
export interface TournamentSummary {
  id: TournamentId;
  name: string;
  phase: TournamentPhase;
  gameType: GameType;
  prize?: string;
  /** Teams with at least one member / maxTeams. */
  teamsFilled: number;
  maxTeams: 8 | 16;
  drawAt: IsoDateTime;
  startAt: IsoDateTime;
  /** Finished: champion team name for "Vô địch gần nhất". */
  champion?: { teamId: TeamId; name: string; members: PlayerSummary[] };
}

export interface TournamentDto extends TournamentSettingsDto {
  id: TournamentId;
  phase: TournamentPhase;
  teams: TeamDto[];
  matches: TournamentMatchDto[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface TournamentQueries {
  /** Drafts are returned only to moderators. */
  "tournament.list": { payload: { phase?: TournamentPhase }; result: TournamentSummary[] };
  "tournament.get": { payload: { tournamentId: TournamentId }; result: TournamentDto };
  /** Home: featured (registering / live / latest champion). */
  "tournament.featured": { payload: Record<string, never>; result: { registering: TournamentSummary[]; live: { tournament: TournamentSummary; match: TournamentMatchDto }[]; latestChampion?: TournamentSummary } };
}

export interface TournamentCommands {
  // Player
  /** Registration phase. Join a team, or switch from my current team (captain rights pass to the next member). */
  "tournament.joinTeam": { payload: { tournamentId: TournamentId; teamId: TeamId }; result: Record<string, never> };
  /** Registration phase. */
  "tournament.leaveTeam": { payload: { tournamentId: TournamentId }; result: Record<string, never> };
  /** Captain of the team, or moderator. Empty name = back to "Đội <number>". */
  "tournament.renameTeam": { payload: { tournamentId: TournamentId; teamId: TeamId; name: string }; result: Record<string, never> };
  /** Playing phase: opens / creates the room of a live match (watch, or play for the two teams). */
  "tournament.enterMatchRoom": { payload: { tournamentId: TournamentId; matchId: MatchId }; result: { roomId: RoomId } };
  // Moderator
  /** Create (no id) or edit. New tournaments start as draft. */
  "tournament.save": { payload: { tournamentId?: TournamentId; settings: TournamentSettingsDto }; result: { tournamentId: TournamentId } };
  "tournament.publish": { payload: { tournamentId: TournamentId }; result: Record<string, never> };
  "tournament.kickMember": { payload: { tournamentId: TournamentId; teamId: TeamId; playerId: PlayerId }; result: Record<string, never> };
  "tournament.setCaptain": { payload: { tournamentId: TournamentId; teamId: TeamId; playerId: PlayerId }; result: Record<string, never> };
  /** Lock teams, drop short teams, draw a bracket preview (phase → drawing). */
  "tournament.lockAndDraw": { payload: { tournamentId: TournamentId }; result: Record<string, never> };
  "tournament.redraw": { payload: { tournamentId: TournamentId }; result: Record<string, never> };
  /** Phase → playing. */
  "tournament.publishBracket": { payload: { tournamentId: TournamentId }; result: Record<string, never> };
  /**
   * Drag & drop in the bracket. Same round: swap the two slots. Different round: put the `from` team into the
   * `to` slot (the `from` slot keeps it). Only editable matches (not done, next round not done).
   */
  "tournament.swapBracketTeams": {
    payload: { tournamentId: TournamentId; from: { matchId: MatchId; side: "A" | "B" }; to: { matchId: MatchId; side: "A" | "B" } };
    result: Record<string, never>;
  };
  "tournament.setMatchLive": { payload: { tournamentId: TournamentId; matchId: MatchId; live: boolean }; result: Record<string, never> };
  /** Either games (enough wins for BoN) or forfeit. Allowed while the next-round match has no result. */
  "tournament.setMatchResult": {
    payload: {
      tournamentId: TournamentId;
      matchId: MatchId;
      games: MatchGameDto[];
      forfeit?: { winner: "A" | "B"; reason: ForfeitReason; note?: string };
      note?: string;
    };
    result: Record<string, never>;
  };
}

export interface TournamentEvents {
  "tournament.snapshot": { topic: `tournament:${TournamentId}`; payload: TournamentDto };
  /** List rows (topic "tournaments" — anyone on the tournament or home screen). */
  "tournament.upserted": { topic: "tournaments"; payload: TournamentSummary };
  "tournament.phase.changed": { topic: `tournament:${TournamentId}`; payload: { phase: TournamentPhase } };
  "tournament.settings.changed": { topic: `tournament:${TournamentId}`; payload: TournamentSettingsDto };
  "tournament.team.updated": { topic: `tournament:${TournamentId}`; payload: TeamDto };
  /** Also on topic "tournaments" while live, for the home screen block. */
  "tournament.match.updated": { topic: string; payload: TournamentMatchDto & { tournamentId: TournamentId } };
}

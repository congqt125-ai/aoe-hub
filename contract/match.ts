// T9 Kết quả trận + match history rows used by the profile.
import type { CivId, GameType, IsoDateTime, MapType, MatchId, PlayerColor, PlayerId, PlayerSummary, RoomId } from "./common";

export interface MatchPlayerResult {
  player: PlayerSummary;
  civ: CivId;
  color: PlayerColor;
  team: number;
  won: boolean;
  /** In-game score sheet; absent when the game did not report it. */
  score?: number;
  units?: number;
  buildings?: number;
  resources?: number;
  /** Rating change of this match. */
  eloDelta: number;
}

export interface MatchResultDto {
  id: MatchId;
  roomId?: RoomId;
  gameType: GameType;
  mapType: MapType;
  startedAt: IsoDateTime;
  durationSec: number;
  players: MatchPlayerResult[];
  /** "Về phòng" is offered only while the room still exists. */
  roomStillOpen: boolean;
  /** Set when the match belongs to a tournament. */
  tournament?: { id: string; matchId: string };
}

/** One row of the profile "Lịch sử đấu" table, seen from `playerId`. */
export interface MatchHistoryRow {
  id: MatchId;
  won: boolean;
  gameType: GameType;
  mapType: MapType;
  civ: CivId;
  teammates: { id: PlayerId; name: string; civ: CivId; color: PlayerColor }[];
  opponents: { id: PlayerId; name: string; civ: CivId; color: PlayerColor }[];
  durationSec: number;
  playedAt: IsoDateTime;
  eloDelta: number;
}

/**
 * Who reports the result is still open (docs/contract/inventory.md §4.2). Draft: the desktop shell reads the
 * game's end screen and every player's client reports; the server accepts when reports agree.
 */
export interface MatchReportInput {
  matchId: MatchId;
  players: { playerId: PlayerId; won: boolean; score?: number; units?: number; buildings?: number; resources?: number }[];
  durationSec: number;
}

export interface MatchQueries {
  "match.get": { payload: { matchId: MatchId }; result: MatchResultDto };
}

export interface MatchCommands {
  "match.report": { payload: MatchReportInput; result: Record<string, never> };
}

export interface MatchEvents {
  "match.result": { topic: "me"; payload: MatchResultDto };
}

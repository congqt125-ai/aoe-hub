// T3 Sảnh: room list. Room session itself (seats, settings, countdown) is in room.ts.
import type { ClanTag, GameType, IsoDateTime, MapType, PageQuery, PlayerSummary, RoomId } from "./common";

export type RoomCategory = "random" | "cungr" | "clan";

/**
 * Lobby list status. The old RoomStatus "locked" is a display state (= hasPassword) and is derived by the
 * client; ping to the host is measured by the client too.
 */
export type RoomListStatus = "waiting" | "full" | "playing";

export interface RoomSummary {
  id: RoomId;
  /** 4-digit number shown as #1234; join by code. */
  code: string;
  name: string;
  category: RoomCategory;
  /** Set when category = "clan". */
  clanTag?: ClanTag;
  host: PlayerSummary;
  mapType: MapType;
  gameType: GameType;
  players: number;
  maxPlayers: number;
  spectators: number;
  status: RoomListStatus;
  /** The password itself is never sent. */
  hasPassword: boolean;
  /** Relay region / address hint the client pings to fill the ping column. */
  pingTarget?: string;
  createdAt: IsoDateTime;
}

export interface RoomListQuery extends PageQuery {
  category?: RoomCategory;
  /** Name or host name. */
  q?: string;
  hideFull?: boolean;
  hideLocked?: boolean;
  /** Only rooms of my clan ("Phòng của clan tôi"). */
  myClanOnly?: boolean;
  sort?: "newest" | "players" | "name";
}

export interface LobbyQueries {
  "lobby.listRooms": { payload: RoomListQuery; result: { items: RoomSummary[]; nextCursor?: string } };
  "lobby.findByCode": { payload: { code: string }; result: RoomSummary };
  /** Home screen "Phòng gợi ý". */
  "lobby.suggestedRooms": { payload: { limit?: number }; result: RoomSummary[] };
}

export interface LobbyEvents {
  /** New room or any listed field changed (players, status…). Topic "lobby". */
  "lobby.room.upserted": { topic: "lobby"; payload: RoomSummary };
  "lobby.room.removed": { topic: "lobby"; payload: { roomId: RoomId } };
}

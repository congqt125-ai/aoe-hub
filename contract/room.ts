// T4 Phòng chơi: seats, spectators, settings, ready, countdown, launch. The server owns this state; the
// client renders room.snapshot then applies room.patch.
import type { ChatMessageDto } from "./chat";
import type { CivChoice, GameType, IsoDateTime, MapType, PlayerColor, PlayerId, PlayerSummary, RoomId } from "./common";
import type { RoomCategory, RoomSummary } from "./lobby";

export interface RoomSettingsDto {
  mapType: MapType;
  gameType: GameType;
  /** "Vào game ngay": when the countdown ends the game launches for everyone by itself. */
  startNow: boolean;
}

export interface SeatDto {
  player: PlayerSummary;
  ready: boolean;
  /** Chosen by the host; defaults follow the game type (random → "random", cungr-shang → "shang"). */
  civ: CivChoice;
  /** Set by the server when the match launches. */
  color?: PlayerColor;
  disconnected?: boolean;
}

/** Seat address. Player seats 0–7 (0 = host). Spectator seats 0–5 (0 and 5 are moderator-only). */
export type SlotRef = { kind: "player"; index: number } | { kind: "spectator"; index: number };

export interface RoomCountdown {
  endsAt: IsoDateTime;
}

export interface RoomStateDto {
  room: RoomSummary;
  settings: RoomSettingsDto;
  /** Length 8; null = empty. */
  seats: (SeatDto | null)[];
  /** Length 6; null = empty. */
  spectators: (PlayerSummary | null)[];
  closedSeats: boolean[];
  closedSpectators: boolean[];
  /** "Khoá vị trí": regular players cannot move; host and moderators still can. */
  positionsLocked: boolean;
  countdown?: RoomCountdown;
  /** Last messages of the room channel (newest last). */
  chat: ChatMessageDto[];
}

/** What the desktop shell needs to start the game (DesktopBridge, step 5). Exact fields depend on the relay. */
export interface LaunchInfo {
  matchId: string;
  roomId: RoomId;
  relay: { host: string; port: number; token: string };
  mapType: MapType;
  gameType: GameType;
  /** Skip the in-game lobby (startNow). */
  skipGameLobby: boolean;
  /** Every seat's final civ (random resolved) and color. */
  players: { playerId: PlayerId; civ: CivChoice; color: PlayerColor; team?: number }[];
  /** Present when I watch instead of play. */
  spectator?: boolean;
}

export interface RoomQueries {
  "room.get": { payload: { roomId: RoomId }; result: RoomStateDto };
}

export interface RoomCommands {
  "room.create": {
    payload: { name: string; password?: string; category: RoomCategory };
    result: { roomId: RoomId; code: string };
  };
  /** Takes a player seat (first free in fill order). */
  "room.join": { payload: { roomId: RoomId; password?: string }; result: RoomStateDto };
  /** Takes a spectator seat; moderators get a moderator seat first. */
  "room.watch": { payload: { roomId: RoomId; password?: string }; result: RoomStateDto };
  "room.leave": { payload: { roomId: RoomId }; result: Record<string, never> };
  /** Me moving to a free seat (player ↔ spectator allowed while waiting). */
  "room.sit": { payload: { roomId: RoomId; slot: SlotRef }; result: Record<string, never> };
  "room.setReady": { payload: { roomId: RoomId; ready: boolean }; result: Record<string, never> };
  "room.invite": { payload: { roomId: RoomId; playerIds: PlayerId[] }; result: Record<string, never> };
  "room.respondInvite": { payload: { inviteId: string; accept: boolean }; result: { state?: RoomStateDto } };
  /** After the result dialog: back into the same room if it still exists. */
  "room.returnToRoom": { payload: { roomId: RoomId }; result: RoomStateDto };
  // Host only
  "room.updateSettings": { payload: { roomId: RoomId; settings: Partial<RoomSettingsDto> }; result: Record<string, never> };
  "room.setCiv": { payload: { roomId: RoomId; seat: number; civ: CivChoice }; result: Record<string, never> };
  /** Drag & drop; swaps when the target is taken. */
  "room.moveSlot": { payload: { roomId: RoomId; from: SlotRef; to: SlotRef }; result: Record<string, never> };
  "room.setSlotClosed": { payload: { roomId: RoomId; slot: SlotRef; closed: boolean }; result: Record<string, never> };
  "room.kick": { payload: { roomId: RoomId; playerId: PlayerId }; result: Record<string, never> };
  "room.setPositionsLocked": { payload: { roomId: RoomId; locked: boolean }; result: Record<string, never> };
  "room.start": { payload: { roomId: RoomId }; result: RoomCountdown };
  "room.cancelCountdown": { payload: { roomId: RoomId }; result: Record<string, never> };
}

/** Partial state change: every present field replaces the old value (seats are replaced per index). */
export interface RoomPatch {
  room?: Partial<RoomSummary>;
  settings?: RoomSettingsDto;
  seats?: { index: number; seat: SeatDto | null }[];
  spectators?: { index: number; player: PlayerSummary | null }[];
  closedSeats?: boolean[];
  closedSpectators?: boolean[];
  positionsLocked?: boolean;
  /** null = countdown cancelled. */
  countdown?: RoomCountdown | null;
}

export interface RoomInviteDto {
  id: string;
  room: RoomSummary;
  from: PlayerSummary;
  at: IsoDateTime;
}

export interface RoomEvents {
  "room.snapshot": { topic: `room:${RoomId}`; payload: RoomStateDto };
  "room.patch": { topic: `room:${RoomId}`; payload: RoomPatch };
  /** Countdown ended: everyone in the room gets their own launch info on topic "me". */
  "room.launch": { topic: "me"; payload: LaunchInfo };
  "room.kicked": { topic: "me"; payload: { roomId: RoomId; by: PlayerSummary } };
  "room.closed": { topic: `room:${RoomId}`; payload: { roomId: RoomId; reason: "host-left" | "empty" | "expired" } };
  "room.invite.received": { topic: "me"; payload: RoomInviteDto };
}

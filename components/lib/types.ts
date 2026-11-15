// Domain shapes shared by hub components. The hub's data layer maps server payloads to these.
import type { PresenceStatus } from "../atoms/StatusDot";
import type { PlayerNumber } from "../atoms/Text";
import type { AvatarSource } from "../atoms/Avatar";
import type { RoomStatus } from "../atoms/Badge";
import type { Faction } from "./theme";

export interface Player {
  id: string;
  name: string;
  status: PresenceStatus;
  /** Player color 1-8 when inside a room / match. */
  color?: PlayerNumber;
  avatar?: AvatarSource;
  ping?: number | null;
  rank?: string;
  /** e.g. "Đang chơi: Đồng cỏ 2v2" */
  activity?: string;
  relation?: "friend" | "blocked" | "none";
}

export interface Room {
  id: string;
  name: string;
  host: Player;
  map: string;
  mode: string;
  speed: string;
  startAge: string;
  players: number;
  maxPlayers: number;
  ping: number | null;
  status: RoomStatus;
  hasPassword: boolean;
}

export type ChatKind = "user" | "own" | "system" | "whisper";

export interface ChatMessageData {
  id: string;
  kind: ChatKind;
  author?: Player;
  text: string;
  /** ISO time */
  at: string;
  sending?: boolean;
  failed?: boolean;
  mentionsMe?: boolean;
}

export type SlotState = "open" | "closed" | "player" | "ai";

export interface SlotData {
  index: number;
  state: SlotState;
  player?: Player;
  faction?: Faction | "random";
  color: PlayerNumber;
  team?: number;
  ready?: boolean;
  isHost?: boolean;
  disconnected?: boolean;
}

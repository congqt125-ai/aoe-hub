// Chat for every channel: lobby, room, tournament, clan, direct messages.
import type { ClanTag, IsoDateTime, MessageId, PlayerId, PlayerSummary, RoomId, SystemText, TournamentId } from "./common";

export type ChatChannel =
  | { kind: "lobby" }
  | { kind: "room"; roomId: RoomId }
  | { kind: "tournament"; tournamentId: TournamentId }
  | { kind: "clan"; tag: ClanTag }
  /** Direct messages with one player (whisper in the lobby uses this too). */
  | { kind: "dm"; playerId: PlayerId };

/**
 * One message. The client derives what the old ChatMessageData had on top: kind "own" (author is me),
 * mentionsMe (text contains @myName), sending / failed (local send state).
 */
export type ChatMessageDto =
  | { id: MessageId; kind: "user"; author: PlayerSummary; text: string; at: IsoDateTime }
  | { id: MessageId; kind: "whisper"; author: PlayerSummary; to: PlayerSummary; text: string; at: IsoDateTime }
  | { id: MessageId; kind: "system"; system: SystemText; at: IsoDateTime };

export interface DmThreadSummary {
  with: PlayerSummary;
  last?: ChatMessageDto;
  unread: number;
}

export interface ChatQueries {
  /** Newest last. `before` pages back in time. Default 50. */
  "chat.history": {
    payload: { channel: ChatChannel; before?: MessageId; limit?: number };
    result: { items: ChatMessageDto[]; hasMore: boolean };
  };
  "chat.dmThreads": { payload: Record<string, never>; result: DmThreadSummary[] };
}

export interface ChatCommands {
  /** Result is the stored message (replace the local "sending" bubble by clientId). */
  "chat.send": { payload: { channel: ChatChannel; text: string; clientId: string }; result: ChatMessageDto };
  "chat.typing": { payload: { channel: Extract<ChatChannel, { kind: "dm" }> }; result: Record<string, never> };
  "chat.markRead": { payload: { channel: ChatChannel; upTo: MessageId }; result: Record<string, never> };
}

export interface ChatEvents {
  /** Topic follows the channel: lobby, room:<id>, tournament:<id>, clan:<tag>, dm:<otherPlayerId>. */
  "chat.message": { topic: string; payload: { channel: ChatChannel; message: ChatMessageDto; clientId?: string } };
  "chat.typing": { topic: `dm:${PlayerId}`; payload: { from: PlayerId } };
}

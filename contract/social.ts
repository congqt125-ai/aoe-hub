// T6 Bạn bè: friends, requests, blocks, presence.
import type { IsoDateTime, PlayerActivity, PlayerId, PlayerSummary, PresenceStatus } from "./common";

export type Relation = "friend" | "blocked" | "none" | "request-sent" | "request-received";

export interface FriendRequestDto {
  id: string;
  from: PlayerSummary;
  to: PlayerSummary;
  at: IsoDateTime;
}

export interface FriendsDto {
  friends: PlayerSummary[];
  incoming: FriendRequestDto[];
  outgoing: FriendRequestDto[];
  blocked: PlayerSummary[];
}

export interface SocialQueries {
  "social.friends": { payload: Record<string, never>; result: FriendsDto };
  /** Player search (add friend, clan invite, room invite). */
  "social.searchPlayers": { payload: { q: string; limit?: number }; result: PlayerSummary[] };
  /** Online players in the lobby. */
  "social.online": { payload: { cursor?: string; limit?: number }; result: { items: PlayerSummary[]; nextCursor?: string; total: number } };
}

export interface SocialCommands {
  "social.sendRequest": { payload: { playerId: PlayerId }; result: FriendRequestDto };
  "social.respondRequest": { payload: { requestId: string; accept: boolean }; result: Record<string, never> };
  "social.cancelRequest": { payload: { requestId: string }; result: Record<string, never> };
  "social.removeFriend": { payload: { playerId: PlayerId }; result: Record<string, never> };
  "social.block": { payload: { playerId: PlayerId }; result: Record<string, never> };
  "social.unblock": { payload: { playerId: PlayerId }; result: Record<string, never> };
  /** My own status (Bận / Vắng); "in-game" and "offline" are set by the server. */
  "presence.set": { payload: { status: Extract<PresenceStatus, "online" | "away" | "busy"> }; result: Record<string, never> };
}

export interface SocialEvents {
  /** Friends' presence, and anyone in a room / lobby list I am subscribed to. */
  "presence.changed": { topic: "presence"; payload: { playerId: PlayerId; status: PresenceStatus; activity?: PlayerActivity } };
  "social.request.received": { topic: "me"; payload: FriendRequestDto };
  "social.request.resolved": { topic: "me"; payload: { requestId: string; accepted: boolean } };
  "social.friend.added": { topic: "me"; payload: PlayerSummary };
  "social.friend.removed": { topic: "me"; payload: { playerId: PlayerId } };
}

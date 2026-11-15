// Registry of every query, command and realtime event, and the HubClient interface screens talk to.
// HTTP:  POST <apiBase>/v1/call/<name>  body = payload        → result | ApiError
// WS:    { t: "cmd", id, name, payload }                       → { t: "ack", id, result | error }
// Event: { t: "evt", seq, name, topic, payload }
import type { AuthCommands, AuthEvents, AuthQueries } from "./auth";
import type { ChatCommands, ChatEvents, ChatQueries } from "./chat";
import type { ClanCommands, ClanEvents, ClanQueries } from "./clan";
import type { HomeQueries, SystemEvents, SystemQueries } from "./home";
import type { LobbyEvents, LobbyQueries } from "./lobby";
import type { MatchCommands, MatchEvents, MatchQueries } from "./match";
import type { PlayerCommands, PlayerEvents, PlayerQueries } from "./player";
import type { RoomCommands, RoomEvents, RoomQueries } from "./room";
import type { SocialCommands, SocialEvents, SocialQueries } from "./social";
import type { TournamentCommands, TournamentEvents, TournamentQueries } from "./tournament";

/** Side-effect free: safe to retry, cache, prefetch. */
export interface Queries
  extends AuthQueries, ChatQueries, ClanQueries, HomeQueries, SystemQueries, LobbyQueries, MatchQueries,
    PlayerQueries, RoomQueries, SocialQueries, TournamentQueries {}

/** Change state: send with a requestId (X-Request-Id) so a retry is not applied twice. */
export interface Commands
  extends AuthCommands, ChatCommands, ClanCommands, MatchCommands, PlayerCommands, RoomCommands, SocialCommands,
    TournamentCommands {}

export interface Events
  extends AuthEvents, ChatEvents, ClanEvents, SystemEvents, LobbyEvents, MatchEvents, PlayerEvents, RoomEvents,
    SocialEvents, TournamentEvents {}

export type QueryName = keyof Queries;
export type CommandName = keyof Commands;
export type CallName = QueryName | CommandName;
export type EventName = keyof Events;

type Calls = Queries & Commands;
export type PayloadOf<N extends CallName> = Calls[N]["payload"];
export type ResultOf<N extends CallName> = Calls[N]["result"];
export type EventPayload<E extends EventName> = Events[E]["payload"];
export type EventTopic<E extends EventName> = Events[E]["topic"];

/**
 * Topics a client subscribes to. "me" and "presence" are joined automatically after connect; the rest when a
 * screen opens and dropped when it closes.
 */
export type Topic =
  | "me"
  | "presence"
  | "lobby"
  | "tournaments"
  | `room:${string}`
  | `tournament:${string}`
  | `clan:${string}`
  | `dm:${string}`;

export type ConnectionState = "connecting" | "online" | "reconnecting" | "offline";

export interface CallOptions {
  /** Defaults to a new UUID for commands. Reuse it to retry the same command safely. */
  requestId?: string;
  signal?: AbortSignal;
}

/**
 * The only door between screens and the backend. MockHubClient (demo/app) and HttpHubClient implement it;
 * screens get one from React context and never know which.
 */
export interface HubClient {
  /** Rejects with ApiError. */
  call<N extends CallName>(name: N, payload: PayloadOf<N>, options?: CallOptions): Promise<ResultOf<N>>;
  /** Join topics (ref-counted: two screens on the same topic share one subscription). Returns the release. */
  subscribe(topics: Topic[]): () => void;
  /** Listen to one event name across subscribed topics. Returns the unsubscribe. */
  on<E extends EventName>(name: E, handler: (payload: EventPayload<E>, meta: { topic: string; seq: number }) => void): () => void;
  readonly connection: ConnectionState;
  onConnectionChange(handler: (state: ConnectionState) => void): () => void;
  /** Server time estimate (ms) from the last pong; use for countdowns. */
  serverNow(): number;
}

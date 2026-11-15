// Wire frames of the WebSocket connection (docs/contract/conventions.md §6).
import type { CallName, EventName, EventPayload, PayloadOf, ResultOf, Topic } from "./api";
import type { ApiError } from "./errors";

export type ClientFrame =
  | { [N in CallName]: { t: "cmd"; id: string; name: N; payload: PayloadOf<N> } }[CallName]
  /** `since`: last seq seen per topic, after a reconnect. */
  | { t: "sub"; topics: Topic[]; since?: Record<string, number> }
  | { t: "unsub"; topics: Topic[] }
  | { t: "ping"; at: number };

export type ServerFrame =
  | { [N in CallName]: { t: "ack"; id: string; name?: N; result: ResultOf<N> } }[CallName]
  | { t: "ack"; id: string; error: ApiError }
  | { [E in EventName]: { t: "evt"; seq: number; name: E; topic: string; payload: EventPayload<E> } }[EventName]
  /** `serverNow`: server clock (ms) when the pong was sent. */
  | { t: "pong"; at: number; serverNow: number };

/** WebSocket close codes used by the server. */
export const WS_CLOSE = {
  /** Access token expired / invalid: refresh, then reconnect. */
  unauthorized: 4401,
  /** Signed in on another device (also sends auth.sessionEnded first). */
  replaced: 4409,
  /** Client version below minClientVersion. */
  outdated: 4426,
  maintenance: 4503,
} as const;

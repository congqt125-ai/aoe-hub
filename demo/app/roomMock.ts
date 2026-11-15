// Mock room session for T4 (Phòng chơi): who sits where, room settings and room chat. Every way into a room
// (create / join / watch / re-enter own room) becomes a RoomMockConfig, which the room's "Dữ liệu giả" panel
// then edits directly.
import type { ChatMessageData, Player } from "../../components";
import type { CivChoice } from "./civs";
import { CHAT_LINES, MODERATOR_EXTRA_SPECTATORS, SPECTATOR_LIMIT, makePlayers, pick, rng, type LobbyRoom } from "./lobbyMock";

/** 8 player seats: 1–4 in the left column, 5–8 in the right column. */
export const PLAYER_SEATS = 8;
/** 6 spectator seats: [QTV] [4 regular] [QTV] — the outer two are moderator-only. */
export const SPECTATOR_SEATS = SPECTATOR_LIMIT + MODERATOR_EXTRA_SPECTATORS;
export const isModeratorSeat = (i: number) => i === 0 || i === SPECTATOR_SEATS - 1;
const REGULAR_SEATS = [1, 2, 3, 4];
const QTV_SEATS = [0, SPECTATOR_SEATS - 1];
/** Player seats fill alternately left / right, like teams filling up (seat 1 = host). */
const FILL_ORDER = [4, 1, 5, 2, 6, 3, 7];

export type EnterMode = "create" | "join" | "watch";

// ---- Room settings (the host edits them, everyone sees them)

export type MapType = "ally" | "dark" | "light";
export const MAP_TYPES: { value: MapType; label: string }[] = [
  { value: "ally", label: "Map đồng minh" },
  { value: "dark", label: "Map đen" },
  { value: "light", label: "Map sáng" },
];
export type GameType = "random" | "cungr-shang";
export const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "cungr-shang", label: "Cung R Shang" },
];

export interface RoomSettings {
  map: MapType;
  gameType: GameType;
  /**
   * "Vào game ngay": when the 5 s countdown ends the game launches for everyone by itself (no one has to press
   * anything). On by default.
   */
  startNow: boolean;
}

/** Civilization every seat starts with for a game type: Random → random, Cung R Shang → Shang. */
export const defaultCiv = (gameType: GameType): CivChoice => (gameType === "cungr-shang" ? "shang" : "random");

export const defaultSettings = (room: LobbyRoom): RoomSettings => ({
  map: "ally",
  gameType: room.category === "cungr" ? "cungr-shang" : "random",
  // On by default when a room opens (user 12/11).
  startNow: true,
});

// ---- Session

export interface Seat {
  player: Player;
  ready: boolean;
  /** Chosen by the host (defaults follow the game type). */
  civ: CivChoice;
}

export interface RoomSession {
  room: LobbyRoom;
  settings: RoomSettings;
  /** Index 0 is the host. null = empty seat. */
  seats: (Seat | null)[];
  spectators: (Player | null)[];
  /** Seats the host closed (empty, nobody can sit). QTV spectator seats are never closed. */
  closedSeats: boolean[];
  closedSpectators: boolean[];
  chat: ChatMessageData[];
}

export type RoomRole = "host" | "player" | "spectator";

export interface RoomMockConfig {
  /** Players seated, host and me included (1–8). */
  players: number;
  /** Spectators, me included when watching (0–6). */
  spectators: number;
  /** % of the other players already ready. */
  readyPercent: number;
  role: RoomRole;
  /** The match is running: nobody can take a player seat, "Sẵn sàng" is locked. */
  playing: boolean;
  /** Sample chat lines already in the room. */
  chatCount: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** How the user entered → mock config. Re-entering a room the user hosts opens it as its host again. */
export function enterConfig(room: LobbyRoom, me: Player, mode: EnterMode): RoomMockConfig {
  const playing = room.status === "playing";
  if (mode === "create" || room.host.id === me.id) {
    return { players: 1, spectators: 0, readyPercent: 0, role: "host", playing: false, chatCount: 0 };
  }
  if (mode === "join") {
    return { players: clamp(room.players + 1, 2, PLAYER_SEATS), spectators: 0, readyPercent: 60, role: "player", playing, chatCount: 2 };
  }
  return { players: clamp(room.players, 1, PLAYER_SEATS), spectators: clamp(room.spectators + 1, 1, SPECTATOR_SEATS), readyPercent: 100, role: "spectator", playing, chatCount: 2 };
}

const at = (secAgo: number) => new Date(Date.now() - secAgo * 1000).toISOString();
const sys = (id: string, text: string, secAgo = 0): ChatMessageData => ({ id, kind: "system", text, at: at(secAgo) });

/**
 * Seats from the config. Players: host in seat 1, then FILL_ORDER (me first when I'm a player).
 * Spectators: regular seats first, then the QTV seats. Watching as a moderator, I take the first free seat
 * (a QTV seat once the regular ones are full); otherwise I always get a regular seat.
 */
export function makeRoomSession(room: LobbyRoom, me: Player, cfg: RoomMockConfig, settings: RoomSettings, moderator: boolean): RoomSession {
  const r = rng(Number(room.code));
  const status = cfg.playing ? "playing" : room.status === "playing" ? "waiting" : room.status;
  const seats: (Seat | null)[] = Array(PLAYER_SEATS).fill(null);
  const spectators: (Player | null)[] = Array(SPECTATOR_SEATS).fill(null);

  const hostIsMe = cfg.role === "host";
  const pool = makePlayers(PLAYER_SEATS + SPECTATOR_SEATS + 3).filter((p) => p.name !== me.name);
  const host = hostIsMe ? me : room.host.id === me.id || room.host.name === me.name ? pool[0] : room.host;
  const others = pool.filter((p) => p.name !== host.name);

  const civ = defaultCiv(settings.gameType);
  seats[0] = { player: host, ready: true, civ };
  const ready = (k: number) => cfg.playing || ((k * 37 + Number(room.code)) % 100) < cfg.readyPercent;
  let next = 0;
  for (let k = 0; k < clamp(cfg.players, 1, PLAYER_SEATS) - 1; k++) {
    const player = cfg.role === "player" && k === 0 ? me : others[next++];
    seats[FILL_ORDER[k]] = { player, ready: player === me ? false : ready(k), civ };
  }

  const watching = cfg.role === "spectator";
  const count = clamp(cfg.spectators, watching ? 1 : 0, SPECTATOR_SEATS);
  const guests = others.slice(next, next + count - (watching ? 1 : 0));
  if (watching && moderator) {
    // Moderator: sit in a QTV seat first; other spectators fill regular seats first.
    const guestOrder = [...REGULAR_SEATS, ...QTV_SEATS.slice(1)];
    spectators[QTV_SEATS[0]] = me;
    guests.forEach((p, i) => (spectators[guestOrder[i]] = p));
  } else if (watching && !moderator) {
    // Not a moderator: me in the first regular seat, the others fill the rest.
    const order = [...REGULAR_SEATS, ...QTV_SEATS];
    spectators[order[0]] = me;
    guests.forEach((p, i) => (spectators[order[i + 1]] = p));
  } else {
    const order = [...REGULAR_SEATS, ...QTV_SEATS];
    guests.forEach((p, i) => (spectators[order[i]] = p));
  }

  // Chat: who hosts, sample lines from the people in the room, then me arriving.
  const people = [...seats, ...spectators.map((p) => (p ? { player: p, ready: false } : null))]
    .filter((s): s is Seat => s !== null && s.player !== me)
    .map((s) => s.player);
  const chat: ChatMessageData[] = [hostIsMe ? sys("s-open", `Phòng #${room.code} đã được tạo. Mời bạn bè bằng mã phòng.`, 600) : sys("s-host", `${host.name} là chủ phòng.`, 600)];
  for (let i = 0; i < cfg.chatCount && people.length; i++) {
    chat.push({ id: `c${i}`, kind: "user", author: pick(r, people), text: pick(r, CHAT_LINES), at: at(500 - i * 15) });
  }
  if (!hostIsMe) chat.push(sys("s-me", watching ? `${me.name} đang xem${cfg.playing ? " trận" : ""}.` : `${me.name} đã vào phòng.`));

  return {
    room: { ...room, status },
    settings,
    seats,
    spectators,
    closedSeats: Array(PLAYER_SEATS).fill(false),
    closedSpectators: Array(SPECTATOR_SEATS).fill(false),
    chat,
  };
}

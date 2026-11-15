// Fake data for the Sảnh screen + the config that the "Dữ liệu giả" panel edits. Not part of the component library.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessageData, Player, Room } from "../../components";
import type { PresenceStatus } from "../../components";
import { players as basePlayers } from "../shared/mock";

export type LobbyCategory = "all" | "random" | "cungr" | "clan";
/** `code`: 4-digit room number shown as #1234 (join by code); `spectators`: people watching a running match. */
export type LobbyRoom = Room & { category: Exclude<LobbyCategory, "all">; code: string; spectators: number; password?: string };

/** Watch seats per running match; moderators (QTV) get 2 extra. */
export const SPECTATOR_LIMIT = 4;
export const MODERATOR_EXTRA_SPECTATORS = 2;
export const spectatorLimit = (moderator: boolean) => SPECTATOR_LIMIT + (moderator ? MODERATOR_EXTRA_SPECTATORS : 0);
export type ListState = "normal" | "loading" | "empty" | "error";

export interface LobbyMockConfig {
  roomCount: number;
  onlineCount: number;
  /** % of rooms already playing / full (the rest are waiting). */
  busyPercent: number;
  /** % of rooms with a password. */
  lockedPercent: number;
  chatCount: number;
  /** New chat line every N seconds; 0 = off. */
  autoChatSec: number;
  listState: ListState;
  chatState: "normal" | "error";
  /** The signed-in user is a moderator (QTV): +2 spectator seats. */
  moderator: boolean;
}

export const DEFAULT_CONFIG: LobbyMockConfig = {
  roomCount: 14,
  onlineCount: 18,
  busyPercent: 35,
  lockedPercent: 15,
  chatCount: 12,
  autoChatSec: 0,
  listState: "normal",
  chatState: "normal",
  moderator: false,
};

const STORAGE_KEY = "aoe-lobby-mock";

function loadConfig(): LobbyMockConfig {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Seeded random: same config → same data, so reviewing a screen is repeatable.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
export const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

const NAMES = ["Minh Babylon", "thu.ai_cap", "Hoàng La Mã", "Long Á Đông", "Lan Hy Lạp", "Bảo Ba Tư", "Hùng Yamato", "Khoa Shang", "Vy Phoenicia", "Tuấn Assyria", "Nam Minoa", "Đạt Choson", "Trang Sumer", "Phúc Palmyra", "Quân Carthage", "Hà Macedon"];
const STATUSES: PresenceStatus[] = ["online", "online", "online", "in-game", "away", "busy"];
const MAPS = ["Đồng cỏ", "Sông ngòi", "Đảo lớn", "Cao nguyên", "Sa mạc", "Rừng rậm"];
const MODES = ["Ngẫu nhiên", "Chinh phục", "Kỳ quan", "Săn vua"];
const SPEEDS = ["Chậm", "Bình thường", "Nhanh"];
const AGES = ["Thời Đồ đá", "Thời Công cụ", "Thời Đồng"];
const CATEGORIES: LobbyRoom["category"][] = ["random", "cungr", "clan"];
const ROOM_NAMES = ["Vào là chơi", "Luyện tập 1v1", "Tuyển quân", "Newbie welcome", "Không rush 15p", "Giao hữu", "Đấu xếp hạng", "Chơi vui thôi", "4v4 Đồng cỏ", "2v2 Sông ngòi"];
export const CHAT_LINES = ["Ai vào phòng 4v4 không? Còn 3 chỗ.", "Cho mình 1 chỗ nhé", "GG mọi người", "Tối nay có kèo xếp hạng không?", "Map Đảo lớn ai chơi?", "Vào clan mình đi", "Luật: không rush trước phút 15", "Mới chơi, xin chỉ giáo ạ", "Server hôm nay mượt ghê", "Phòng mình còn 1 slot!"];

export function makePlayers(count: number): Player[] {
  const r = rng(7);
  return Array.from({ length: count }, (_, i): Player => {
    const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : "");
    const status = pick(r, STATUSES);
    return {
      id: `p${i}`,
      name,
      status,
      ping: Math.round(30 + r() * 250),
      rank: pick(r, ["Đồng", "Bạc II", "Vàng I", "Vàng II", "Bạch kim"]),
      relation: i % 5 === 1 ? "friend" : "none",
      activity: status === "in-game" ? `Đang chơi: ${pick(r, MAPS)}` : undefined,
    };
  });
}

export function makeRooms(c: LobbyMockConfig): LobbyRoom[] {
  const r = rng(11);
  const host = makePlayers(Math.max(c.roomCount, 1));
  return Array.from({ length: c.roomCount }, (_, i): LobbyRoom => {
    const maxPlayers = pick(r, [2, 4, 6, 8]);
    const busy = r() * 100 < c.busyPercent;
    // Busy rooms: half are in a match (any seat count), half are full and still waiting.
    const playing = busy && r() < 0.5;
    const players = busy && !playing ? maxPlayers : playing ? 1 + Math.floor(r() * maxPlayers) : 1 + Math.floor(r() * Math.max(maxPlayers - 1, 1));
    const full = players >= maxPlayers;
    const hasPassword = r() * 100 < c.lockedPercent;
    return {
      id: `r${i}`,
      // 7919 is coprime with 9000 → distinct 4-digit codes for up to 9000 rooms, stable per index.
      code: String(1000 + ((i * 7919 + 1237) % 9000)),
      // 0-6 watchers on running matches (spread over the 4-seat and 6-seat moderator limits); own sequence so
      // the other fields stay as they were.
      spectators: playing ? (i * 37 + 11) % 7 : 0,
      name: `${pick(r, ROOM_NAMES)} #${i + 1}`,
      host: host[i],
      map: pick(r, MAPS),
      mode: pick(r, MODES),
      speed: pick(r, SPEEDS),
      startAge: pick(r, AGES),
      players,
      maxPlayers,
      ping: Math.round(30 + r() * 260),
      status: playing ? "playing" : full ? "full" : "waiting",
      hasPassword,
      password: hasPassword ? "123456" : undefined,
      category: CATEGORIES[i % CATEGORIES.length],
    };
  });
}

const stamp = (secAgo: number) => new Date(Date.now() - secAgo * 1000).toISOString();

export function makeChat(count: number, online: Player[]): ChatMessageData[] {
  const r = rng(23);
  return Array.from({ length: count }, (_, i): ChatMessageData => ({
    id: `c${i}`,
    kind: "user",
    author: online[Math.floor(r() * online.length)] ?? basePlayers.minh,
    text: pick(r, CHAT_LINES),
    at: stamp((count - i) * 40),
  }));
}

/** Config + derived fake data of the lobby. Config persists in localStorage; chat sends are local only. */
export type LobbyMock = ReturnType<typeof useLobbyMock>;

export function useLobbyMock(me: Player) {
  const [config, setConfigState] = useState<LobbyMockConfig>(loadConfig);
  const setConfig = useCallback((patch: Partial<LobbyMockConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);
  // Rooms the user created in this session: kept apart from the generated ones (which regenerate on config
  // changes) and listed first.
  const [created, setCreated] = useState<LobbyRoom[]>([]);
  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setCreated([]);
  }, [setConfig]);

  // Background sync (mock): each sync nudges the seat count of some waiting rooms, like fresh server data.
  const [syncTick, setSyncTick] = useState(0);
  const base = useMemo(() => makeRooms(config), [config.roomCount, config.busyPercent, config.lockedPercent]); // eslint-disable-line react-hooks/exhaustive-deps
  const generated = useMemo(
    () =>
      syncTick === 0
        ? base
        : base.map((room, i) => {
            if (room.status !== "waiting" || (i + syncTick) % 3 !== 0) return room;
            const players = Math.max(1, Math.min(room.maxPlayers - 1, room.players + (((i + syncTick) % 2) ? 1 : -1)));
            return { ...room, players };
          }),
    [base, syncTick],
  );
  /** Resolves after a short delay with the fresh list applied; the current list stays on screen meanwhile. */
  const sync = useCallback(() => new Promise<void>((done) => window.setTimeout(() => {
    setSyncTick((t) => t + 1);
    done();
  }, 900)), []);
  const rooms = useMemo(() => [...created, ...generated], [created, generated]);

  /** New room hosted by `me`: 1/8 players, waiting; returns it so the screen can select it. */
  const createRoom = useCallback(
    (input: { name: string; password: string; category: LobbyRoom["category"] }): LobbyRoom => {
      const taken = new Set([...created, ...generated].map((r) => r.code));
      let code = String(1000 + ((Date.now() * 7) % 9000));
      while (taken.has(code)) code = String(1000 + ((Number(code) - 1000 + 1) % 9000));
      const room: LobbyRoom = {
        id: `new-${code}`,
        code,
        name: input.name,
        host: me,
        map: "Ngẫu nhiên",
        mode: "Ngẫu nhiên",
        speed: "Bình thường",
        startAge: "Thời Đồ đá",
        players: 1,
        maxPlayers: 8,
        ping: me.ping ?? 42,
        status: "waiting",
        hasPassword: input.password.length > 0,
        password: input.password || undefined,
        category: input.category,
        spectators: 0,
      };
      setCreated((prev) => [room, ...prev]);
      return room;
    },
    [created, generated, me],
  );
  const online = useMemo(() => makePlayers(config.onlineCount), [config.onlineCount]);

  const [chat, setChat] = useState<ChatMessageData[]>(() => makeChat(config.chatCount, online));
  useEffect(() => setChat(makeChat(config.chatCount, online)), [config.chatCount, online]);

  const seq = useRef(0);
  const addIncoming = useCallback(() => {
    const r = rng(1000 + seq.current++);
    const author = online[Math.floor(r() * online.length)] ?? basePlayers.minh;
    setChat((prev) => [...prev, { id: `in${seq.current}`, kind: "user", author, text: pick(r, CHAT_LINES), at: new Date().toISOString() }]);
  }, [online]);
  useEffect(() => {
    if (!config.autoChatSec) return;
    const t = window.setInterval(addIncoming, config.autoChatSec * 1000);
    return () => window.clearInterval(t);
  }, [config.autoChatSec, addIncoming]);

  const send = useCallback(
    (text: string) => setChat((prev) => [...prev, { id: `me${prev.length}-${Date.now()}`, kind: "own", author: me, text, at: new Date().toISOString() }]),
    [me],
  );

  return { config, setConfig, reset, rooms, online, chat, send, addIncoming, createRoom, sync };
}

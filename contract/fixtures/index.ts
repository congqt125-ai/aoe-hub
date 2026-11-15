// Sample payloads for every main DTO. `satisfies` makes `npm run typecheck` fail when a fixture drifts from
// the contract. Backend devs can use them as example responses; MockHubClient can seed from them.
import type {
  ApiError,
  ChatMessageDto,
  ClanDto,
  HealthDto,
  HomeFeedDto,
  LaunchInfo,
  MatchResultDto,
  PlayerSummary,
  ProfileDto,
  ResultOf,
  RoomPatch,
  RoomStateDto,
  RoomSummary,
  ServerFrame,
  ClientFrame,
  SessionDto,
  TournamentDto,
} from "..";

const T0 = "2026-11-14T13:00:00.000Z";

export const playerMinh = {
  id: "pl_minh",
  name: "Minh Babylon",
  avatar: { kind: "civ", faction: "babylonian", frame: 2 },
  status: "online",
  rank: { tier: "gold", division: 2, points: 1420 },
  clanTag: "RONG",
} satisfies PlayerSummary;

export const playerLan = {
  id: "pl_lan",
  name: "Lan Hy Lạp",
  avatar: { kind: "initials" },
  status: "in-game",
  rank: { tier: "silver", division: 1, points: 1180 },
  activity: { kind: "in-game", roomId: "rm_1", mapType: "dark", gameType: "random" },
} satisfies PlayerSummary;

export const session = {
  me: playerMinh,
  email: "minh@example.com",
  roles: [],
  serverNow: T0,
} satisfies SessionDto;

export const health = {
  status: "ok",
  serverNow: T0,
  minClientVersion: "1.0.30",
  latestClientVersion: "1.0.40",
} satisfies HealthDto;

export const roomSummary = {
  id: "rm_1",
  code: "4821",
  name: "Vào là chơi #1",
  category: "random",
  host: playerMinh,
  mapType: "ally",
  gameType: "random",
  players: 3,
  maxPlayers: 8,
  spectators: 0,
  status: "waiting",
  hasPassword: false,
  createdAt: T0,
} satisfies RoomSummary;

export const lobbyPage = {
  items: [roomSummary, { ...roomSummary, id: "rm_2", code: "1237", name: "Cung R 4v4", category: "cungr", gameType: "cungr-shang", hasPassword: true }],
  nextCursor: "c_2",
} satisfies ResultOf<"lobby.listRooms">;

export const chatUser = {
  id: "msg_1",
  kind: "user",
  author: playerLan,
  text: "Ai vào phòng 4v4 không? Còn 3 chỗ.",
  at: T0,
} satisfies ChatMessageDto;

export const chatSystem = {
  id: "msg_2",
  kind: "system",
  system: { code: "room.seat.swapped", params: { a: "pl_minh", b: "pl_lan" }, refs: [playerMinh, playerLan] },
  at: T0,
} satisfies ChatMessageDto;

export const roomState = {
  room: roomSummary,
  settings: { mapType: "ally", gameType: "random", startNow: true },
  seats: [
    { player: playerMinh, ready: true, civ: "random" },
    null,
    null,
    null,
    { player: playerLan, ready: false, civ: "random" },
    null,
    null,
    null,
  ],
  spectators: [null, null, null, null, null, null],
  closedSeats: [false, false, false, false, false, false, false, false],
  closedSpectators: [false, false, false, false, false, false],
  positionsLocked: false,
  chat: [chatSystem, chatUser],
} satisfies RoomStateDto;

export const roomPatchReady = {
  seats: [{ index: 4, seat: { player: playerLan, ready: true, civ: "random" } }],
} satisfies RoomPatch;

export const roomPatchCountdown = {
  countdown: { endsAt: "2026-11-14T13:00:05.000Z" },
} satisfies RoomPatch;

export const launchInfo = {
  matchId: "mt_1",
  roomId: "rm_1",
  relay: { host: "relay.example.com", port: 2300, token: "r_tok" },
  mapType: "ally",
  gameType: "random",
  skipGameLobby: true,
  players: [
    { playerId: "pl_minh", civ: "yamato", color: 1 },
    { playerId: "pl_lan", civ: "greek", color: 2 },
  ],
} satisfies LaunchInfo;

export const matchResult = {
  id: "mt_1",
  roomId: "rm_1",
  gameType: "random",
  mapType: "ally",
  startedAt: T0,
  durationSec: 1930,
  players: [
    { player: playerMinh, civ: "yamato", color: 1, team: 1, won: true, score: 3120, units: 84, buildings: 31, resources: 12400, eloDelta: 18 },
    { player: playerLan, civ: "greek", color: 2, team: 2, won: false, score: 1990, units: 51, buildings: 19, resources: 8200, eloDelta: -18 },
  ],
  roomStillOpen: true,
} satisfies MatchResultDto;

export const tournament = {
  id: "tn_1",
  name: "Cúp Hy Lạp mùa 3",
  gameType: "random",
  mapType: "ally",
  prize: "500.000đ",
  maxTeams: 8,
  minPerTeam: 4,
  boRegular: 1,
  boFinals: 3,
  drawAt: "2026-11-20T12:00:00.000Z",
  startAt: "2026-11-21T12:00:00.000Z",
  roundGapDays: 1,
  rules: "1. Thể thức & bản đồ\n…",
  phase: "playing",
  teams: [
    { id: "tm_1", number: 1, customName: "Rồng Lửa", members: [playerMinh] },
    { id: "tm_2", number: 2, members: [playerLan] },
  ],
  matches: [
    {
      id: "tmt_1",
      number: 1,
      roundIndex: 0,
      slot: 0,
      teamAId: "tm_1",
      teamBId: "tm_2",
      bestOf: 1,
      games: [{ winner: "A" }],
      scoreA: 1,
      scoreB: 0,
      winnerId: "tm_1",
      status: "done",
      scheduledAt: "2026-11-21T12:00:00.000Z",
      completedAt: "2026-11-21T12:40:00.000Z",
    },
  ],
  createdAt: T0,
  updatedAt: T0,
} satisfies TournamentDto;

export const clan = {
  id: "cl_1",
  tag: "RONG",
  name: "Rồng Phương Đông",
  emblem: { faction: "asian", frame: 3, color: 2 },
  recruit: "approval",
  minRank: "silver",
  memberCount: 1,
  points: 2350,
  rankPosition: 4,
  bio: "Clan chơi vui, tối nào cũng có kèo.",
  foundedAt: "2026-09-01T00:00:00.000Z",
  members: [{ player: playerMinh, role: "leader", joinedAt: "2026-09-01T00:00:00.000Z", contribution: 1200 }],
  announcements: [{ id: "an_1", text: "Tối thứ 7 tập trung đấu giải.", author: playerMinh, at: T0, pinned: true }],
  activity: [{ id: "ac_1", text: { code: "clan.founded" }, at: "2026-09-01T00:00:00.000Z" }],
  pointsHistory: [1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 2250, 2300, 2350],
  tournaments: [],
  requests: [],
  invitesSent: [],
} satisfies ClanDto;

export const profile = {
  player: playerMinh,
  joinedAt: "2025-03-10T00:00:00.000Z",
  bio: "Chơi Babylon, thích map đảo.",
  equipped: { title: "it_title_1" },
  trophies: 2,
  favouriteCiv: "babylonian",
  clan: { tag: "RONG", name: "Rồng Phương Đông", role: "leader", joinedAt: "2026-09-01T00:00:00.000Z", memberCount: 1 },
  seasons: [{ name: "Mùa 3", peakRank: { tier: "gold", division: 1, points: 1500 }, current: true }],
  stats: { matches: 240, wins: 132, winRate: 55, elo: 1420, eloWeekDelta: 24, streak: 3, hoursPlayed: 180 },
  elo30d: Array.from({ length: 30 }, (_, i) => 1380 + i),
  recent: [{ won: true, gameType: "random", playedAt: T0, eloDelta: 18 }],
  topCivs: [{ civ: "babylonian", matches: 80, winRate: 60 }],
  byGameType: [{ gameType: "random", matches: 200, winRate: 54 }],
  playmates: [{ player: playerLan, sharedMatches: 31 }],
  pinnedAchievements: ["ach_first_win"],
  tournaments: [{ id: "tn_1", name: "Cúp Hy Lạp mùa 3", teamName: "Rồng Lửa", captain: true, result: { kind: "in-progress" } }],
  friendCount: 12,
  mutualFriendIds: [],
} satisfies ProfileDto;

export const homeFeed = {
  slides: [
    {
      id: "slide-software",
      kind: "software",
      title: "SuperAoE Hub 1.0.40 — Voice chat & Trạm TURN",
      description: "Nói chuyện trực tiếp trong phòng đấu không qua máy chủ.",
      background: { assetKey: "bg/village-sunset" },
      product: "software",
      version: "1.0.40",
    },
  ],
  changelog: [
    {
      product: "software",
      version: "1.0.40",
      date: "2026-11-12T00:00:00.000Z",
      tags: ["new"],
      highlights: ["Voice chat trong phòng"],
      details: [{ tag: "new", items: ["Voice chat trong phòng", "Trạm trung chuyển TURN"] }],
    },
  ],
} satisfies HomeFeedDto;

export const errorFull = {
  code: "ROOM_FULL",
  message: "room rm_1 is full",
  details: { maxPlayers: 8 },
  requestId: "req_1",
} satisfies ApiError;

export const errorFields = {
  code: "VALIDATION_FAILED",
  details: { fields: { tag: "CLAN_TAG_TAKEN", name: "FIELD_TOO_SHORT" } },
} satisfies ApiError;

// ---- Wire frames

export const frameCmd = {
  t: "cmd",
  id: "req_2",
  name: "room.setReady",
  payload: { roomId: "rm_1", ready: true },
} satisfies ClientFrame;

export const frameSub = {
  t: "sub",
  topics: ["room:rm_1", "lobby"],
  since: { "room:rm_1": 1042 },
} satisfies ClientFrame;

export const frameEvt = {
  t: "evt",
  seq: 1043,
  name: "room.patch",
  topic: "room:rm_1",
  payload: roomPatchReady,
} satisfies ServerFrame;

export const frameAckError = { t: "ack", id: "req_2", error: errorFull } satisfies ServerFrame;

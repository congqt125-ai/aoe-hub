// Shared primitives of the hub ⇄ backend contract. Standalone on purpose: nothing here imports from
// components/ or tokens/, so a TypeScript backend can copy this folder as-is.
// Conventions: docs/contract/conventions.md.

// ---- Primitives

/** Opaque server id. Suggested prefixes: pl_ rm_ tn_ tm_ mt_ cl_ msg_. */
export type Id = string;
export type PlayerId = Id;
export type RoomId = Id;
export type TournamentId = Id;
export type TeamId = Id;
export type MatchId = Id;
export type MessageId = Id;
/** Clan tag, 2–4 chars A–Z0–9, upper case. Second key next to the clan id; never changes. */
export type ClanTag = string;

/** ISO 8601 UTC with milliseconds: "2026-11-14T13:05:00.000Z". */
export type IsoDateTime = string;

/**
 * Image reference: either an absolute URL served by the backend or a key of an image shipped with the client
 * (e.g. "bg/village-dusk", resolved by the client to a bundled asset).
 */
export type ImageRef = { url: string } | { assetKey: string };

// ---- Paging

export interface PageQuery {
  cursor?: string;
  /** Default 20, max 100. */
  limit?: number;
}

export interface Page<T> {
  items: T[];
  /** Absent = no more items. */
  nextCursor?: string;
}

// ---- Game enums (values match what the client already uses)

export type PresenceStatus = "online" | "away" | "busy" | "in-game" | "offline";

/** Architecture set (building icons, avatar art). Same keys as tokens/design-tokens.json `factions`. */
export type Faction = "egyptian" | "greek" | "babylonian" | "asian" | "roman";
export const FACTIONS: readonly Faction[] = ["egyptian", "greek", "babylonian", "asian", "roman"];

/** The 16 civilizations of Age of Empires + Rise of Rome. */
export type CivId =
  | "assyrian" | "babylonian" | "choson" | "egyptian" | "greek" | "hittite" | "minoan" | "persian"
  | "phoenician" | "shang" | "sumerian" | "yamato" | "carthaginian" | "macedonian" | "palmyran" | "roman";
export type CivChoice = CivId | "random";

/** Player color 1–8 (in-game color order). */
export type PlayerColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type MapType = "ally" | "dark" | "light";
export type GameType = "random" | "cungr-shang";

export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
/** Lowest → highest; used for "minimum rank" checks. */
export const RANK_TIERS: readonly RankTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];

export interface Rank {
  tier: RankTier;
  /** 1 = highest division inside the tier ("Vàng I"). Absent when the tier has no divisions. */
  division?: 1 | 2 | 3;
  /** Rating points (Elo). */
  points: number;
}

// ---- People

export type AvatarDto =
  | { kind: "image"; url: string }
  | { kind: "initials" }
  | { kind: "unit"; frame: number }
  | { kind: "civ"; faction: Faction; frame?: number };

/** A player as shown in lists, chat, seats, teams. Context data (ping, relation, color) lives elsewhere. */
export interface PlayerSummary {
  id: PlayerId;
  name: string;
  avatar?: AvatarDto;
  status: PresenceStatus;
  rank?: Rank;
  /** Clan tag shown as [TAG] next to the name. */
  clanTag?: ClanTag;
  activity?: PlayerActivity;
}

/** What the player is doing; the client writes the sentence ("Đang chơi: Map đen · Random"). */
export type PlayerActivity =
  | { kind: "in-room"; roomId: RoomId; roomName: string }
  | { kind: "in-game"; roomId?: RoomId; mapType: MapType; gameType: GameType }
  | { kind: "watching"; roomId: RoomId };

// ---- Server-made text

/**
 * A sentence the server wants shown (chat system line, clan activity, notification). The client owns the
 * wording: it picks the Vietnamese template by `code` and fills `params` (player ids → names via `refs`).
 */
export interface SystemText {
  code: string;
  params?: Record<string, string | number>;
  /** Players mentioned in params, so the client can show names without another lookup. */
  refs?: PlayerSummary[];
}

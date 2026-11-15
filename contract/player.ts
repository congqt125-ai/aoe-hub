// T7 Hồ sơ: profile header + overview, match history, achievements, inventory, static catalog.
// The old mock built everything in one ProfileData; here it is split by tab so each tab loads on demand.
import type { AvatarDto, CivId, ClanTag, Faction, GameType, Id, ImageRef, IsoDateTime, PageQuery, PlayerId, PlayerSummary, Rank } from "./common";
import type { ClanRole } from "./clan";
import type { MatchHistoryRow } from "./match";
import type { Relation } from "./social";

export type ItemRarity = "common" | "rare" | "epic" | "legendary";
export type ItemCategory = "avatar" | "frame" | "title" | "bg" | "chatIcon";
export type AchievementGroup = "battle" | "civ" | "tournament" | "community" | "season";

// ---- Static catalog (cache by version)

export interface AchievementDef {
  id: Id;
  group: AchievementGroup;
  name: string;
  description: string;
  /** Icon sheet: "tech" | "unit" | "building:<faction>". */
  iconSet: "tech" | "unit" | `building:${Faction}`;
  frame: number;
  goal: number;
  reward?: string;
}

export interface ItemDef {
  id: Id;
  category: ItemCategory;
  name: string;
  rarity: ItemRarity;
  /** How to get it (shown when not owned). */
  source: string;
  /** Category-specific look: avatar art, title text, background image key, chat icon name. */
  look:
    | { kind: "avatar"; avatar: AvatarDto }
    | { kind: "frame"; rarity: ItemRarity }
    | { kind: "title"; text: string }
    | { kind: "bg"; image: ImageRef }
    | { kind: "chatIcon"; icon: string };
}

/**
 * Names and descriptions of catalog entries are Vietnamese content authored on the server (like news), not
 * UI strings — that is the one place the server sends display text.
 */
export interface CatalogDto {
  version: string;
  achievements: AchievementDef[];
  items: ItemDef[];
}

// ---- Profile

export interface ProfileStats {
  matches: number;
  wins: number;
  /** 0–100. */
  winRate: number;
  elo: number;
  eloWeekDelta: number;
  /** Positive = win streak, negative = loss streak. */
  streak: number;
  hoursPlayed: number;
}

export interface ProfileDto {
  player: PlayerSummary;
  /** Mine to this player; absent when viewing myself. */
  relation?: Relation;
  joinedAt: IsoDateTime;
  bio: string;
  /** Equipped items (catalog ids). */
  equipped: Partial<Record<ItemCategory, Id>>;
  trophies: number;
  favouriteCiv?: CivId;
  clan?: { tag: ClanTag; name: string; role: ClanRole; joinedAt: IsoDateTime; memberCount: number };
  seasons: { name: string; finalRank?: Rank; peakRank: Rank; current?: boolean }[];
  stats: ProfileStats;
  /** Daily Elo, oldest first (30 values). */
  elo30d: number[];
  recent: { won: boolean; gameType: GameType; playedAt: IsoDateTime; eloDelta: number }[];
  topCivs: { civ: CivId; matches: number; winRate: number }[];
  byGameType: { gameType: GameType; matches: number; winRate: number }[];
  playmates: { player: PlayerSummary; sharedMatches: number }[];
  /** Up to 3 pinned achievements (ids). */
  pinnedAchievements: Id[];
  tournaments: {
    id: Id;
    name: string;
    finishedAt?: IsoDateTime;
    teamName: string;
    captain: boolean;
    result: { kind: "champion" } | { kind: "runner-up" } | { kind: "eliminated"; roundIndex: number; totalRounds: number } | { kind: "in-progress" };
  }[];
  /** Friends list tab: count + mutual ids; the list itself comes from profile.friends. */
  friendCount: number;
  mutualFriendIds: PlayerId[];
}

export interface AchievementProgress {
  id: Id;
  progress: number;
  achievedAt?: IsoDateTime;
  /** % of players who have it. */
  rarityPercent: number;
}

export interface InventoryDto {
  owned: { itemId: Id; acquiredAt: IsoDateTime }[];
  equipped: Partial<Record<ItemCategory, Id>>;
}

export interface PlayerQueries {
  "catalog.get": { payload: { knownVersion?: string }; result: CatalogDto | { unchanged: true } };
  "profile.get": { payload: { playerId: PlayerId }; result: ProfileDto };
  "profile.matches": {
    payload: PageQuery & { playerId: PlayerId; gameType?: GameType; won?: boolean };
    result: { items: MatchHistoryRow[]; nextCursor?: string };
  };
  "profile.achievements": { payload: { playerId: PlayerId }; result: AchievementProgress[] };
  "profile.friends": { payload: { playerId: PlayerId }; result: PlayerSummary[] };
  /** Mine only. */
  "inventory.get": { payload: Record<string, never>; result: InventoryDto };
}

export interface PlayerCommands {
  "profile.update": { payload: { bio?: string }; result: Record<string, never> };
  "profile.pinAchievements": { payload: { ids: Id[] }; result: Record<string, never> };
  "inventory.equip": { payload: { category: ItemCategory; itemId: Id | null }; result: Record<string, never> };
}

export interface PlayerEvents {
  /** My own profile changed from another device, or a new achievement / item. */
  "profile.updated": { topic: "me"; payload: { equipped?: InventoryDto["equipped"]; pinnedAchievements?: Id[]; bio?: string } };
  "achievement.unlocked": { topic: "me"; payload: AchievementProgress };
}

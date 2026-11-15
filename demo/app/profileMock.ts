// Shared seeded profile data for T7 (Hồ sơ) and the quick-profile dialog in profile.tsx.
import type { AvatarSource, Faction, IconName, Player, PlayerNumber } from "../../components";
import { players as basePlayers } from "../shared/mock";
import { CIVS, type CivId } from "./civs";
import { getPlayerClan } from "./clanMock";
import { makePlayers } from "./lobbyMock";
import { GAME_TYPES, MAP_TYPES, type GameType, type MapType } from "./roomMock";
import { createInitialTournaments, teamDisplayName } from "./tournamentMock";

export type ProfileTab = "overview" | "history" | "achievements" | "inventory" | "friends";
export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export const PROFILE_TABS: { value: ProfileTab; label: string; selfOnly?: boolean }[] = [
  { value: "overview", label: "Tổng quan" },
  { value: "history", label: "Lịch sử đấu" },
  { value: "achievements", label: "Thành tựu" },
  { value: "inventory", label: "Kho đồ", selfOnly: true },
  { value: "friends", label: "Bạn bè" },
];

const BG_URLS = import.meta.glob<string>("../../assets/hub/bg/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

export function bgAssetUrl(filename: string): string | undefined {
  return BG_URLS[`../../assets/hub/bg/${filename}`];
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface QuickMatchRow {
  win: boolean;
  gameType: string;
  map: string;
  minutes: number;
  ago: string;
  elo: number;
}

/** Deterministic summary shared between ProfileDialog and ProfileScreen so numbers always match. */
export function mockProfile(p: Player) {
  const h = hashString(p.name);
  const matches = 40 + (h % 360);
  const winRate = 35 + ((h >>> 8) % 36);
  const elo = 900 + ((h >>> 4) % 900);
  const agoLabel = (i: number) => (i === 0 ? "1 giờ trước" : i < 3 ? `${i * 3} giờ trước` : `${i - 1} ngày trước`);
  const history: QuickMatchRow[] = Array.from({ length: 6 }, (_, i) => {
    const x = hashString(`${p.name}#${i}`);
    const win = x % 100 < winRate;
    return {
      win,
      gameType: GAME_TYPES[x % GAME_TYPES.length].label,
      map: MAP_TYPES[(x >>> 3) % MAP_TYPES.length].label,
      minutes: 12 + ((x >>> 6) % 40),
      ago: agoLabel(i),
      elo: (win ? 1 : -1) * (8 + ((x >>> 9) % 14)),
    };
  });
  const wins = Math.round((matches * winRate) / 100);
  const favourite = GAME_TYPES[(h >>> 12) % GAME_TYPES.length].label;
  return { matches, winRate, elo, history, wins, favourite };
}

export type AchievementGroup = "battle" | "civ" | "tournament" | "community" | "season";

export const ACHIEVEMENT_GROUP_LABELS: Record<AchievementGroup, string> = {
  battle: "Chiến trận",
  civ: "Đế chế",
  tournament: "Giải đấu",
  community: "Cộng đồng",
  season: "Mùa giải",
};

export interface ProfileAchievementRef {
  id: string;
  name: string;
  description: string;
  iconSet: "tech" | "unit" | `building:${Faction}`;
  frame: number;
}

export interface ProfileAchievement extends ProfileAchievementRef {
  group: AchievementGroup;
  progress: number;
  goal: number;
  achievedAt?: string;
  rarityPercent: number;
  reward?: string;
}

export interface MatchPlayer {
  id: string;
  name: string;
  avatar?: AvatarSource;
  civId: CivId;
  color: PlayerNumber;
}

export interface MatchRow {
  id: string;
  win: boolean;
  gameType: GameType;
  gameTypeLabel: string;
  mapType: MapType;
  mapTypeLabel: string;
  civId: CivId;
  teammates: MatchPlayer[];
  opponents: MatchPlayer[];
  durationMin: number;
  daysAgo: number;
  dateLabel: string;
  eloDelta: number;
}

export interface ProfileTournamentRow {
  id: string;
  name: string;
  dateLabel: string;
  teamName: string;
  role: "Đội trưởng" | "Thành viên";
  result: string;
  isChampion?: boolean;
}

export interface ProfileClan {
  tag: string;
  name: string;
  role: "Trưởng clan" | "Phó" | "Thành viên";
  joinedAt: string;
  members: number;
}

export interface ProfileSeason {
  name: string;
  finalRank: string;
  peakRank: string;
  current?: boolean;
}

export type ItemCategory = "avatar" | "frame" | "title" | "bg" | "chatIcon";

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  avatar: "Avatar",
  frame: "Khung avatar",
  title: "Danh hiệu",
  bg: "Nền hồ sơ",
  chatIcon: "Biểu tượng chat",
};

export interface InventoryItem {
  id: string;
  category: ItemCategory;
  name: string;
  rarity: ItemRarity;
  owned: boolean;
  source: string;
  avatarSource?: AvatarSource;
  titleText?: string;
  bgFile?: string;
  chatIconName?: IconName;
}

export interface ProfileMockOptions {
  matchesCount?: number;
  winRate?: number;
  achievementPercent?: number;
  inventoryPercent?: number;
  hasClan?: boolean;
  friendsCount?: number;
  requestsCount?: number;
}

export interface ProfileData {
  player: Player;
  joinedAt: string;
  bio: string;
  title: string;
  bannerBg: string;
  frameRarity: ItemRarity;
  trophies: number;
  favouriteCiv: CivId;
  clan?: ProfileClan;
  seasons: ProfileSeason[];
  stats: {
    matches: number;
    winRate: number;
    elo: number;
    eloWeekDelta: number;
    streak: number;
    hours: number;
  };
  elo30d: number[];
  recent10: { win: boolean; gameType: string; date: string; eloDelta: number }[];
  topCivs: { civId: CivId; matches: number; winRate: number }[];
  modeStats: { label: string; matches: number; winRate: number }[];
  playmates: { player: Player; sharedMatches: number }[];
  matches: MatchRow[];
  tournaments: ProfileTournamentRow[];
  achievements: ProfileAchievement[];
  unlockedAchievements: ProfileAchievementRef[];
  pinnedIds: string[];
  inventory: InventoryItem[];
  equipped: Record<ItemCategory, string>;
  friends: Player[];
  friendRequests: Player[];
  mutualFriendIds: string[];
}

const TITLES = [
  "« Bá chủ Hy Lạp »",
  "« Thần cung R Shang »",
  "« Chiến tướng AoE »",
  "« Kỳ phùng địch thủ »",
  "« Người giữ thành »",
];

const BIOS = [
  "Chơi Hy Lạp, thích map đảo và đánh đời 4.",
  "Chuyên Cung R Shang 4v4, online mỗi tối từ 20h.",
  "Đánh Random vui vẻ, không toxic.",
  "",
];

interface AchievementTemplate {
  id: string;
  group: AchievementGroup;
  name: string;
  description: string;
  iconSet: "tech" | "unit" | `building:${Faction}`;
  frame: number;
  goal: number;
  rarityPercent: number;
  reward?: string;
}

const BATTLE_TEMPLATES: AchievementTemplate[] = [
  { id: "ach-win-10", group: "battle", name: "Tân binh xuất trận", description: "Thắng 10 trận đấu bất kỳ", iconSet: "tech", frame: 0, goal: 10, rarityPercent: 68.4 },
  { id: "ach-win-50", group: "battle", name: "Chiến binh dạn dày", description: "Thắng 50 trận đấu bất kỳ", iconSet: "tech", frame: 1, goal: 50, rarityPercent: 42.1 },
  { id: "ach-win-100", group: "battle", name: "Bách chiến bách thắng", description: "Thắng 100 trận xếp hạng", iconSet: "tech", frame: 2, goal: 100, rarityPercent: 26.5, reward: "Khung Hiếm « Ánh thép »" },
  { id: "ach-win-500", group: "battle", name: "Kỳ phùng địch thủ", description: "Thắng 500 trận đấu", iconSet: "tech", frame: 3, goal: 500, rarityPercent: 8.2 },
  { id: "ach-win-1000", group: "battle", name: "Huyền thoại chiến trường", description: "Thắng 1.000 trận đấu", iconSet: "tech", frame: 4, goal: 1000, rarityPercent: 2.1, reward: "Danh hiệu « Chiến tướng AoE »" },
  { id: "ach-streak-3", group: "battle", name: "Khí thế hừng hực", description: "Thắng liên tiếp 3 trận", iconSet: "unit", frame: 2, goal: 3, rarityPercent: 54.0 },
  { id: "ach-streak-5", group: "battle", name: "Chuỗi bất bại", description: "Thắng liên tiếp 5 trận", iconSet: "unit", frame: 4, goal: 5, rarityPercent: 29.8 },
  { id: "ach-streak-10", group: "battle", name: "Bất khả chiến bại", description: "Thắng liên tiếp 10 trận", iconSet: "unit", frame: 5, goal: 10, rarityPercent: 6.4, reward: "Biểu tượng chat « Lửa chiến »" },
  { id: "ach-hours-100", group: "battle", name: "Trăm giờ sa trường", description: "Đạt 100 giờ chơi thực chiến", iconSet: "tech", frame: 5, goal: 100, rarityPercent: 31.2 },
  { id: "ach-hours-500", group: "battle", name: "Lão làng đế chế", description: "Đạt 500 giờ chơi thực chiến", iconSet: "tech", frame: 7, goal: 500, rarityPercent: 7.5 },
  { id: "ach-fast-win", group: "battle", name: "Đánh nhanh thắng gọn", description: "Thắng 5 trận dưới 15 phút", iconSet: "unit", frame: 6, goal: 5, rarityPercent: 22.0 },
  { id: "ach-giant-slayer", group: "battle", name: "Hạ gục cao thủ", description: "Thắng 10 trận trước đối thủ hơn 150 điểm", iconSet: "unit", frame: 7, goal: 10, rarityPercent: 14.3 },
  { id: "ach-random-20", group: "battle", name: "Vua Random", description: "Thắng 20 trận thể loại Random", iconSet: "tech", frame: 8, goal: 20, rarityPercent: 35.6 },
  { id: "ach-shang-20", group: "battle", name: "Cung thủ Shang", description: "Thắng 20 trận thể loại Cung R Shang", iconSet: "unit", frame: 8, goal: 20, rarityPercent: 33.1, reward: "Danh hiệu « Thần cung R Shang »" },
];

const CIV_TEMPLATES: AchievementTemplate[] = CIVS.map((civ, idx) => ({
  id: idx === 0 ? "ach-greek-50" : `ach-civ-${civ.id}`,
  group: "civ",
  name: `Tinh thông ${civ.label}`,
  description: `Thắng 50 trận với đế chế ${civ.label}`,
  iconSet: `building:${civ.style}`,
  frame: idx % 6,
  goal: 50,
  rarityPercent: Number((10.5 + ((idx * 37) % 180) / 10).toFixed(1)),
  reward: idx === 0 ? "Danh hiệu « Bá chủ Hy Lạp »" : idx === 3 ? "Avatar Hoàng đế" : undefined,
}));

const TOURNAMENT_TEMPLATES: AchievementTemplate[] = [
  { id: "ach-tour-join-1", group: "tournament", name: "Lần đầu dự giải", description: "Tham gia 1 giải đấu chính thức", iconSet: "tech", frame: 9, goal: 1, rarityPercent: 38.4 },
  { id: "ach-tour-join-5", group: "tournament", name: "Gương mặt quen thuộc", description: "Tham gia 5 giải đấu chính thức", iconSet: "tech", frame: 11, goal: 5, rarityPercent: 16.2 },
  { id: "ach-tour-join-10", group: "tournament", name: "Nghiện giải đấu", description: "Tham gia 10 giải đấu chính thức", iconSet: "tech", frame: 12, goal: 10, rarityPercent: 5.9 },
  { id: "ach-tour-qf", group: "tournament", name: "Top 8 xuất sắc", description: "Lọt vào vòng Tứ kết 1 giải đấu", iconSet: "unit", frame: 9, goal: 1, rarityPercent: 24.7 },
  { id: "ach-tour-sf", group: "tournament", name: "Bán kết vinh quang", description: "Lọt vào vòng Bán kết 1 giải đấu", iconSet: "unit", frame: 10, goal: 1, rarityPercent: 14.8 },
  { id: "ach-tour-final", group: "tournament", name: "Góp mặt chung kết", description: "Vào tới trận Chung kết giải đấu", iconSet: "unit", frame: 11, goal: 1, rarityPercent: 7.9, reward: "Khung Sử thi « Hoàng kim »" },
  { id: "ach-tour-runner", group: "tournament", name: "Á quân kiên cường", description: "Giành ngôi Á quân giải đấu", iconSet: "tech", frame: 13, goal: 1, rarityPercent: 5.4 },
  { id: "ach-tour-champ", group: "tournament", name: "Nhà vô địch", description: "Vô địch 1 giải đấu chính thức", iconSet: "tech", frame: 10, goal: 1, rarityPercent: 3.2, reward: "Nền « Đền hoàng hôn »" },
  { id: "ach-tour-champ-3", group: "tournament", name: "Triều đại bất diệt", description: "Vô địch 3 giải đấu chính thức", iconSet: "tech", frame: 14, goal: 3, rarityPercent: 0.9, reward: "Khung Huyền thoại « Đế vương »" },
  { id: "ach-tour-captain", group: "tournament", name: "Thủ lĩnh tài ba", description: "Làm đội trưởng thắng ít nhất 3 trận giải", iconSet: "unit", frame: 13, goal: 3, rarityPercent: 11.6 },
];

const COMMUNITY_TEMPLATES: AchievementTemplate[] = [
  { id: "ach-friends-5", group: "community", name: "Bạn mới bốn phương", description: "Có 5 người bạn trong danh sách", iconSet: "unit", frame: 0, goal: 5, rarityPercent: 61.5 },
  { id: "ach-friends-10", group: "community", name: "Chiến hữu bốn phương", description: "Kết bạn với 10 người chơi", iconSet: "unit", frame: 12, goal: 10, rarityPercent: 44.2 },
  { id: "ach-friends-25", group: "community", name: "Giao hảo rộng khắp", description: "Kết bạn với 25 người chơi", iconSet: "unit", frame: 14, goal: 25, rarityPercent: 18.7 },
  { id: "ach-mate-10", group: "community", name: "Đôi bạn cùng tiến", description: "Chơi 10 trận cùng bạn bè", iconSet: "tech", frame: 15, goal: 10, rarityPercent: 49.0 },
  { id: "ach-mate-50", group: "community", name: "Đồng đội ăn ý", description: "Chơi 50 trận cùng bạn bè", iconSet: "tech", frame: 16, goal: 50, rarityPercent: 21.4, reward: "Biểu tượng chat « Bắt tay »" },
  { id: "ach-mate-100", group: "community", name: "Bộ tứ siêu đẳng", description: "Chơi 100 trận cùng bạn bè", iconSet: "tech", frame: 17, goal: 100, rarityPercent: 9.8 },
  { id: "ach-host-10", group: "community", name: "Chủ phòng nhiệt tình", description: "Làm chủ phòng 10 trận đấu", iconSet: "building:greek", frame: 0, goal: 10, rarityPercent: 46.3 },
  { id: "ach-host-50", group: "community", name: "Quản gia sảnh đấu", description: "Làm chủ phòng 50 trận đấu", iconSet: "building:roman", frame: 0, goal: 50, rarityPercent: 19.5 },
  { id: "ach-host-100", group: "community", name: "Ông chủ phòng máy", description: "Làm chủ phòng 100 trận đấu", iconSet: "building:egyptian", frame: 0, goal: 100, rarityPercent: 7.1 },
  { id: "ach-clan-join", group: "community", name: "Thành viên bang hội", description: "Gia nhập một Clan chính thức", iconSet: "building:asian", frame: 0, goal: 1, rarityPercent: 52.8 },
];

const SEASON_TEMPLATES: AchievementTemplate[] = [
  { id: "ach-s1-done", group: "season", name: "Chứng nhân Mùa 1", description: "Hoàn thành ít nhất 10 trận ở Mùa 1", iconSet: "tech", frame: 18, goal: 10, rarityPercent: 41.0 },
  { id: "ach-s2-done", group: "season", name: "Chứng nhân Mùa 2", description: "Hoàn thành ít nhất 10 trận ở Mùa 2", iconSet: "tech", frame: 19, goal: 10, rarityPercent: 48.6 },
  { id: "ach-s3-done", group: "season", name: "Chinh chiến Mùa 3", description: "Hoàn thành ít nhất 10 trận ở Mùa 3", iconSet: "tech", frame: 20, goal: 10, rarityPercent: 56.2 },
  { id: "ach-rank-silver", group: "season", name: "Ánh bạc mùa giải", description: "Đạt hạng Bạc trở lên trong một mùa", iconSet: "unit", frame: 15, goal: 1, rarityPercent: 63.4 },
  { id: "ach-rank-gold", group: "season", name: "Vinh quang hạng Vàng", description: "Đạt hạng Vàng trở lên trong một mùa", iconSet: "unit", frame: 16, goal: 1, rarityPercent: 36.8, reward: "Khung Hiếm « Vàng ròng »" },
  { id: "ach-rank-plat", group: "season", name: "Bạch kim sáng chói", description: "Đạt hạng Bạch kim trở lên trong một mùa", iconSet: "unit", frame: 17, goal: 1, rarityPercent: 15.2 },
  { id: "ach-rank-dia", group: "season", name: "Kim cương bất hoại", description: "Đạt hạng Kim cương trở lên trong một mùa", iconSet: "unit", frame: 18, goal: 1, rarityPercent: 4.6, reward: "Danh hiệu « Người giữ thành »" },
  { id: "ach-rank-leg", group: "season", name: "Đỉnh cao Huyền thoại", description: "Đạt hạng Huyền thoại trong một mùa", iconSet: "unit", frame: 19, goal: 1, rarityPercent: 1.2, reward: "Nền « Ngôi đền hoàng hôn »" },
  { id: "ach-season-30", group: "season", name: "Chăm chỉ xếp hạng", description: "Chơi 30 trận xếp hạng trong cùng một mùa", iconSet: "tech", frame: 21, goal: 30, rarityPercent: 28.9 },
  { id: "ach-season-top", group: "season", name: "Giữ vững phong độ", description: "Kết thúc 2 mùa liên tiếp từ hạng Vàng trở lên", iconSet: "tech", frame: 22, goal: 2, rarityPercent: 12.7 },
];

export const ACHIEVEMENT_CATALOG: AchievementTemplate[] = [
  ...BATTLE_TEMPLATES,
  ...CIV_TEMPLATES,
  ...TOURNAMENT_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
  ...SEASON_TEMPLATES,
];

const PAST_TOURNAMENT_NAMES = [
  "Cúp Mùa Thu Hà Nội 2025",
  "Giải AoE Tứ Hùng Mở Rộng",
  "Đấu Trường Shang Cổ Điển #4",
  "Cúp Bang Hội Liên Tỉnh",
  "Giải Mùa Xuân Đế Chế 2026",
];

type ItemTemplate = Omit<InventoryItem, "owned">;

export const INVENTORY_CATALOG: ItemTemplate[] = [
  // Avatars (10)
  { id: "av-greek", category: "avatar", name: "Chiến binh Hy Lạp", rarity: "common", source: "Mặc định tân thủ", avatarSource: { kind: "civ", faction: "greek", frame: 0 } },
  { id: "av-roman", category: "avatar", name: "Quân đoàn La Mã", rarity: "common", source: "Mặc định tân thủ", avatarSource: { kind: "civ", faction: "roman", frame: 0 } },
  { id: "av-egypt", category: "avatar", name: "Pharaoh Ai Cập", rarity: "common", source: "Thành tựu: Thắng 10 trận", avatarSource: { kind: "civ", faction: "egyptian", frame: 0 } },
  { id: "av-babylon", category: "avatar", name: "Thủ thành Babylon", rarity: "rare", source: "Thành tựu: Thắng 50 trận", avatarSource: { kind: "civ", faction: "babylonian", frame: 0 } },
  { id: "av-asian", category: "avatar", name: "Kỵ cung Á Đông", rarity: "rare", source: "Mùa 1: hạng Bạc", avatarSource: { kind: "civ", faction: "asian", frame: 0 } },
  { id: "av-u2", category: "avatar", name: "Kiếm sĩ Hoplite", rarity: "rare", source: "Sự kiện Mùa Thu", avatarSource: { kind: "unit", frame: 2 } },
  { id: "av-u5", category: "avatar", name: "Cung thủ Trường Cung", rarity: "epic", source: "Thành tựu: Chuỗi 10 trận thắng", avatarSource: { kind: "unit", frame: 5 } },
  { id: "av-u9", category: "avatar", name: "Tượng chiến Ba Tư", rarity: "epic", source: "Giải đấu: Vào Bán kết", avatarSource: { kind: "unit", frame: 9 } },
  { id: "av-u12", category: "avatar", name: "Thiết kỵ Cataphract", rarity: "legendary", source: "Giải đấu: Vô địch", avatarSource: { kind: "unit", frame: 12 } },
  { id: "av-u16", category: "avatar", name: "Hoàng đế Tối cao", rarity: "legendary", source: "Mùa 2: hạng Huyền thoại", avatarSource: { kind: "unit", frame: 16 } },

  // Frames (10)
  { id: "fr-wood", category: "frame", name: "Khung Gỗ mộc", rarity: "common", source: "Mặc định tân thủ" },
  { id: "fr-oak", category: "frame", name: "Khung Sồi cổ", rarity: "common", source: "Thành tựu: Có 5 bạn bè" },
  { id: "fr-sand", category: "frame", name: "Khung Sa thạch", rarity: "rare", source: "Mùa 2: hạng Vàng" },
  { id: "fr-steel", category: "frame", name: "Khung Ánh thép", rarity: "rare", source: "Thành tựu: Thắng 100 trận" },
  { id: "fr-bronze", category: "frame", name: "Khung Đồng thau", rarity: "rare", source: "Sự kiện Tết" },
  { id: "fr-marble", category: "frame", name: "Khung Cẩm thạch", rarity: "epic", source: "Mùa 2: hạng Bạch kim" },
  { id: "fr-gold", category: "frame", name: "Khung Hoàng kim", rarity: "epic", source: "Giải đấu: Vào Chung kết" },
  { id: "fr-obsidian", category: "frame", name: "Khung Đá đen", rarity: "legendary", source: "Mùa 3: hạng Kim cương" },
  { id: "fr-emperor", category: "frame", name: "Khung Đế vương", rarity: "legendary", source: "Giải đấu: Vô địch 3 lần" },
  { id: "fr-myth", category: "frame", name: "Khung Thần thoại", rarity: "legendary", source: "Sự kiện Kỷ niệm 1 năm" },

  // Titles (10)
  { id: "tl-recruit", category: "title", name: "Tân binh Đế Chế", rarity: "common", source: "Mặc định tân thủ", titleText: "« Tân binh Đế Chế »" },
  { id: "tl-greek", category: "title", name: "Bá chủ Hy Lạp", rarity: "rare", source: "Thành tựu: Thắng 50 trận Hy Lạp", titleText: "« Bá chủ Hy Lạp »" },
  { id: "tl-shang", category: "title", name: "Thần cung R Shang", rarity: "rare", source: "Thành tựu: Thắng 20 trận Shang", titleText: "« Thần cung R Shang »" },
  { id: "tl-rival", category: "title", name: "Kỳ phùng địch thủ", rarity: "rare", source: "Thành tựu: Thắng 500 trận", titleText: "« Kỳ phùng địch thủ »" },
  { id: "tl-keeper", category: "title", name: "Người giữ thành", rarity: "epic", source: "Mùa 2: hạng Kim cương", titleText: "« Người giữ thành »" },
  { id: "tl-general", category: "title", name: "Chiến tướng AoE", rarity: "epic", source: "Thành tựu: Thắng 1.000 trận", titleText: "« Chiến tướng AoE »" },
  { id: "tl-tet", category: "title", name: "Khai xuân đại thắng", rarity: "epic", source: "Sự kiện Tết", titleText: "« Khai xuân đại thắng »" },
  { id: "tl-champ", category: "title", name: "Nhà vô địch", rarity: "legendary", source: "Giải đấu: Vô địch", titleText: "« Nhà vô địch »" },
  { id: "tl-dynasty", category: "title", name: "Vua không ngai", rarity: "legendary", source: "Giải đấu: Vô địch 3 lần", titleText: "« Vua không ngai »" },
  { id: "tl-legend", category: "title", name: "Huyền thoại sống", rarity: "legendary", source: "Mùa 3: hạng Huyền thoại", titleText: "« Huyền thoại sống »" },

  // Profile backgrounds (8, using real files in assets/hub/bg/)
  { id: "bg-village-dusk", category: "bg", name: "Làng quê hoàng hôn", rarity: "common", source: "Mặc định tân thủ", bgFile: "village-dusk.webp" },
  { id: "bg-village-sunset", category: "bg", name: "Làng cổ chiều tà", rarity: "rare", source: "Thành tựu: Chơi 100 giờ", bgFile: "village-sunset.webp" },
  { id: "bg-temple-dusk", category: "bg", name: "Ngôi đền chạng vạng", rarity: "rare", source: "Mùa 1: hạng Vàng", bgFile: "temple-dusk.webp" },
  { id: "bg-temple-sunset", category: "bg", name: "Đền thờ hoàng hôn", rarity: "epic", source: "Giải đấu: Vô địch", bgFile: "temple-sunset.webp" },
  { id: "bg-temple-logo", category: "bg", name: "Thánh địa Đế Chế", rarity: "epic", source: "Sự kiện Kỷ niệm 1 năm", bgFile: "temple-sunset-logo.webp" },
  { id: "bg-village-hd", category: "bg", name: "Toàn cảnh làng cổ", rarity: "epic", source: "Thành tựu: Làm chủ phòng 50 lần", bgFile: "village-dusk-1920.webp" },
  { id: "bg-temple-hd", category: "bg", name: "Đại điện cổ đại", rarity: "legendary", source: "Mùa 2: hạng Huyền thoại", bgFile: "temple-dusk-1920.webp" },
  { id: "bg-village-golden", category: "bg", name: "Mùa gặt vàng", rarity: "legendary", source: "Sự kiện Tết", bgFile: "village-sunset.webp" },

  // Chat icons (10)
  { id: "ci-star", category: "chatIcon", name: "Ngôi sao", rarity: "common", source: "Mặc định tân thủ", chatIconName: "star" },
  { id: "ci-sword", category: "chatIcon", name: "Kiếm chéo", rarity: "common", source: "Thành tựu: Thắng 10 trận", chatIconName: "sword" },
  { id: "ci-users", category: "chatIcon", name: "Bắt tay chiến hữu", rarity: "rare", source: "Thành tựu: 50 trận cùng bạn", chatIconName: "users" },
  { id: "ci-map", category: "chatIcon", name: "La bàn thám hiểm", rarity: "rare", source: "Sự kiện Mùa Thu", chatIconName: "map" },
  { id: "ci-globe", category: "chatIcon", name: "Địa cầu cổ", rarity: "rare", source: "Mùa 1: hạng Bạch kim", chatIconName: "globe" },
  { id: "ci-clock", category: "chatIcon", name: "Đồng hồ cát", rarity: "epic", source: "Thành tựu: Chơi 500 giờ", chatIconName: "clock" },
  { id: "ci-trophy", category: "chatIcon", name: "Cúp vàng", rarity: "epic", source: "Giải đấu: Á quân", chatIconName: "trophy" },
  { id: "ci-crown", category: "chatIcon", name: "Vương miện", rarity: "legendary", source: "Giải đấu: Vô địch", chatIconName: "crown" },
  { id: "ci-sun", category: "chatIcon", name: "Thái dương", rarity: "legendary", source: "Mùa 2: hạng Huyền thoại", chatIconName: "star" },
  { id: "ci-flame", category: "chatIcon", name: "Ngọn lửa chiến", rarity: "legendary", source: "Thành tựu: Chuỗi 10 trận thắng", chatIconName: "trophy" },
];

export const MOCK_SAMPLE_PLAYERS: Player[] = [
  basePlayers.minh,
  basePlayers.thu,
  basePlayers.hoang,
  basePlayers.long,
];

/** Build complete deterministic ProfileData for a player (matching quick dialog summary). */
export function buildProfileData(p: Player, opts?: ProfileMockOptions): ProfileData {
  const h = hashString(p.name);
  const base = mockProfile(p);
  const matchCount = opts?.matchesCount ?? base.matches;
  const winRate = opts?.winRate ?? base.winRate;
  const isNewPlayer = matchCount === 0;

  const favCiv = CIVS[(h >>> 3) % CIVS.length].id;
  const rarities: ItemRarity[] = ["common", "rare", "epic", "legendary"];
  const frameRarity = rarities[(h >>> 7) % rarities.length];
  const trophies = isNewPlayer ? 0 : (h >>> 11) % 4;
  const eloWeekDelta = isNewPlayer ? 0 : ((h >>> 5) % 45) - 18;
  const streak = isNewPlayer ? 0 : (h >>> 9) % 7;
  const hours = Math.round(matchCount * 0.55);

  const mockClan = getPlayerClan(p);
  const hasClan = opts?.hasClan ?? Boolean(mockClan);
  const resolvedClan: ProfileClan | undefined = hasClan
    ? mockClan ?? {
        tag: "ABC",
        name: "Á Đông Bang",
        role: "Thành viên",
        joinedAt: `0${1 + (h % 8)}/2025`,
        members: 38,
      }
    : undefined;

  // 30-day Elo curve ending at current elo
  const elo30d: number[] = [];
  if (isNewPlayer) {
    elo30d.push(base.elo);
  } else {
    let cur = base.elo - eloWeekDelta * 2;
    for (let i = 0; i < 30; i++) {
      const step = ((hashString(`${p.name}-d-${i}`) % 25) - 11);
      cur = Math.max(700, cur + step);
      elo30d.push(cur);
    }
    elo30d[29] = base.elo;
  }

  const recent10 = isNewPlayer
    ? []
    : Array.from({ length: Math.min(10, matchCount) }, (_, i) => {
        const x = hashString(`${p.name}-r-${i}`);
        const win = x % 100 < winRate;
        const d = new Date(Date.now() - i * 86400_000);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return {
          win,
          gameType: GAME_TYPES[x % GAME_TYPES.length].label,
          date: `${dd}/${mm}`,
          eloDelta: (win ? 1 : -1) * (9 + ((x >>> 4) % 12)),
        };
      });

  // Top 5 civilizations
  const topCivs = isNewPlayer
    ? []
    : Array.from({ length: 5 }, (_, i) => {
        const x = hashString(`${p.name}-civ-${i}`);
        const civ = CIVS[((h % CIVS.length) + i * 3) % CIVS.length];
        return {
          civId: civ.id,
          matches: Math.max(1, Math.round(matchCount * (0.28 - i * 0.045))),
          winRate: Math.min(85, Math.max(20, winRate + ((x % 18) - 8))),
        };
      });

  const randomMatches = Math.round(matchCount * 0.6);
  const shangMatches = matchCount - randomMatches;
  const allyMatches = Math.round(matchCount * 0.52);
  const darkMatches = Math.round(matchCount * 0.28);
  const lightMatches = Math.max(0, matchCount - allyMatches - darkMatches);

  const modeStats = isNewPlayer
    ? []
    : [
        { label: "Random", matches: randomMatches, winRate: Math.min(90, winRate + 2) },
        { label: "Cung R Shang", matches: shangMatches, winRate: Math.max(15, winRate - 3) },
        { label: "Map đồng minh", matches: allyMatches, winRate },
        { label: "Map đen", matches: darkMatches, winRate: Math.max(15, winRate - 4) },
        { label: "Map sáng", matches: lightMatches, winRate: Math.min(90, winRate + 4) },
      ];

  const pool = [...Object.values(basePlayers), ...makePlayers(24)].filter((x) => x.id !== p.id);
  const playmates = isNewPlayer
    ? []
    : Array.from({ length: 5 }, (_, i) => ({
        player: pool[(h + i * 3) % pool.length],
        sharedMatches: 28 - i * 4 + (h % 5),
      }));

  // Match rows (up to 65)
  const historyRowsCount = isNewPlayer ? 0 : Math.min(65, matchCount);
  const matches: MatchRow[] = Array.from({ length: historyRowsCount }, (_, i) => {
    const x = hashString(`${p.name}-match-${i}`);
    const win = x % 100 < winRate;
    const gt = GAME_TYPES[x % GAME_TYPES.length];
    const mt = MAP_TYPES[(x >>> 3) % MAP_TYPES.length];
    const civ = CIVS[(x >>> 5) % CIVS.length];
    const teamSize = (x >>> 7) % 3 === 0 ? 1 : (x >>> 7) % 3 === 1 ? 2 : 4;
    const daysAgo = Math.floor(i * 0.85);
    const d = new Date(Date.now() - daysAgo * 86400_000);
    const dateLabel = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const selfColor = (1 + (x % 4)) as PlayerNumber;

    const teammates: MatchPlayer[] = [
      { id: p.id, name: p.name, avatar: p.avatar, civId: civ.id, color: selfColor },
      ...Array.from({ length: teamSize - 1 }, (_, k) => {
        const mate = pool[(x + k * 5) % pool.length];
        return {
          id: mate.id,
          name: mate.name,
          avatar: mate.avatar,
          civId: CIVS[(x + k * 7) % CIVS.length].id,
          color: (((selfColor + k) % 8) + 1) as PlayerNumber,
        };
      }),
    ];

    const opponents: MatchPlayer[] = Array.from({ length: teamSize }, (_, k) => {
      const opp = pool[(x + 11 + k * 3) % pool.length];
      return {
        id: opp.id,
        name: opp.name,
        avatar: opp.avatar,
        civId: CIVS[(x + 3 + k * 5) % CIVS.length].id,
        color: (((selfColor + 4 + k) % 8) + 1) as PlayerNumber,
      };
    });

    return {
      id: `m-${p.id}-${i}`,
      win,
      gameType: gt.value,
      gameTypeLabel: gt.label,
      mapType: mt.value,
      mapTypeLabel: mt.label,
      civId: civ.id,
      teammates,
      opponents,
      durationMin: 14 + ((x >>> 9) % 42),
      daysAgo,
      dateLabel,
      eloDelta: (win ? 1 : -1) * (8 + ((x >>> 11) % 14)),
    };
  });

  // Tournaments: pull from tournamentMock.ts if player is in a team, plus seeded past tournaments
  const tournaments: ProfileTournamentRow[] = [];
  const activeTours = createInitialTournaments();
  for (const t of activeTours) {
    const team = t.teams.find((tm) => tm.members.some((m) => m.id === p.id || m.name === p.name));
    if (!team) continue;
    const role: "Đội trưởng" | "Thành viên" =
      team.members[0]?.id === p.id || team.members[0]?.name === p.name ? "Đội trưởng" : "Thành viên";
    const d = new Date(t.startAt);
    const dateLabel = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    let result = "Đang đấu";
    let isChampion = false;
    if (t.phase === "finished") {
      const finalMatch = t.matches[t.matches.length - 1];
      if (finalMatch?.winnerId === team.id) {
        result = "Vô địch";
        isChampion = true;
      } else if (finalMatch && (finalMatch.teamAId === team.id || finalMatch.teamBId === team.id)) {
        result = "Á quân";
      } else if (team.eliminated?.round) {
        result = `Bị loại ở ${team.eliminated.round}`;
      } else {
        result = "Đã kết thúc";
      }
    } else if (team.eliminated?.round) {
      result = `Bị loại ở ${team.eliminated.round}`;
    } else if (t.phase === "registration" || t.phase === "drawing") {
      result = "Đang chuẩn bị";
    }
    tournaments.push({
      id: t.id,
      name: t.name,
      dateLabel,
      teamName: teamDisplayName(team),
      role,
      result,
      isChampion,
    });
  }

  if (isNewPlayer) {
    tournaments.length = 0;
  } else {
    const pastCount = 2 + (h % 3);
    for (let i = 0; i < pastCount; i++) {
      const x = hashString(`${p.name}-tour-${i}`);
      const results = [
        { label: "Vô địch", champ: true },
        { label: "Á quân", champ: false },
        { label: "Bị loại ở Bán kết", champ: false },
        { label: "Bị loại ở Tứ kết", champ: false },
      ];
      const res = results[(x >>> 4) % results.length];
      tournaments.push({
        id: `past-${i}-${x}`,
        name: PAST_TOURNAMENT_NAMES[(h + i) % PAST_TOURNAMENT_NAMES.length],
        dateLabel: `${String(10 + ((x % 18))).padStart(2, "0")}/0${1 + (i % 8)}/2025`,
        teamName: resolvedClan ? `${resolvedClan.tag} Team` : `Đội ${1 + (x % 8)}`,
        role: x % 3 === 0 ? "Đội trưởng" : "Thành viên",
        result: res.label,
        isChampion: res.champ,
      });
    }
  }

  // 60 achievements
  const achTargetPct = opts?.achievementPercent ?? (isNewPlayer ? 5 : 38 + (h % 28));
  const achTargetCount = Math.round((ACHIEVEMENT_CATALOG.length * achTargetPct) / 100);
  const achRanked = ACHIEVEMENT_CATALOG.map((tpl, i) => ({
    tpl,
    i,
    score: hashString(`${p.name}-ach-${tpl.id}`) % 1000,
  })).sort((a, b) => a.score - b.score);
  const unlockedSet = new Set(achRanked.slice(0, achTargetCount).map((x) => x.tpl.id));

  const achievements: ProfileAchievement[] = ACHIEVEMENT_CATALOG.map((tpl, i) => {
    const x = hashString(`${p.name}-ach-${tpl.id}`);
    const unlocked = unlockedSet.has(tpl.id);
    const progress = unlocked ? tpl.goal : Math.max(0, Math.min(tpl.goal - 1, Math.floor(((x >>> 5) % 95) * tpl.goal / 100)));
    const day = 1 + ((x + i) % 27);
    const month = 1 + ((x >>> 3) % 10);
    return {
      ...tpl,
      progress,
      achievedAt: unlocked ? `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/2025` : undefined,
    };
  });

  const unlockedAchievements: ProfileAchievementRef[] = achievements
    .filter((a) => Boolean(a.achievedAt))
    .map(({ id, name, description, iconSet, frame }) => ({ id, name, description, iconSet, frame }));
  const pinnedIds = unlockedAchievements.slice(0, Math.min(3, unlockedAchievements.length)).map((a) => a.id);

  // Inventory (decorative items across 5 categories; starters always owned)
  const invTargetPct = opts?.inventoryPercent ?? (isNewPlayer ? 15 : 48 + (h % 26));
  const invTargetCount = Math.round((INVENTORY_CATALOG.length * invTargetPct) / 100);
  const starterIds = new Set(
    INVENTORY_CATALOG.filter((it) => it.source === "Mặc định tân thủ").map((it) => it.id),
  );
  const nonStarters = INVENTORY_CATALOG.filter((it) => !starterIds.has(it.id))
    .map((it) => ({ id: it.id, score: hashString(`${p.name}-inv-${it.id}`) % 1000 }))
    .sort((a, b) => a.score - b.score);
  const extraNeeded = Math.max(0, invTargetCount - starterIds.size);
  const ownedSet = new Set([...starterIds, ...nonStarters.slice(0, extraNeeded).map((x) => x.id)]);
  const inventory: InventoryItem[] = INVENTORY_CATALOG.map((it) => ({
    ...it,
    owned: ownedSet.has(it.id),
  }));

  const firstOwned = (cat: ItemCategory) =>
    inventory.find((it) => it.category === cat && it.owned)?.id ??
    inventory.find((it) => it.category === cat)!.id;

  const equipped: Record<ItemCategory, string> = {
    avatar: firstOwned("avatar"),
    frame: firstOwned("frame"),
    title: firstOwned("title"),
    bg: firstOwned("bg"),
    chatIcon: firstOwned("chatIcon"),
  };

  // Friends & incoming requests
  const defaultFriendsCount = 8 + (h % 7);
  const friendsCount = Math.min(pool.length, opts?.friendsCount ?? defaultFriendsCount);
  const rotatedPool = pool.map((_, idx) => pool[(idx + (h % pool.length)) % pool.length]);
  const friends = rotatedPool.slice(0, friendsCount);
  const mutualFriendIds = pool.slice(0, 4).map((x) => x.id);

  const reqPool = pool.filter((x) => !friends.some((f) => f.id === x.id));
  const requestsCount = Math.min(reqPool.length, opts?.requestsCount ?? (h % 3));
  const friendRequests = reqPool.slice(0, requestsCount);

  return {
    player: p,
    joinedAt: `0${1 + (h % 9)}/2025`,
    bio: BIOS[h % BIOS.length],
    title: TITLES[h % TITLES.length],
    bannerBg: "village-dusk.webp",
    frameRarity,
    trophies,
    favouriteCiv: favCiv,
    clan: resolvedClan,
    seasons: [
      { name: "Mùa 3 (hiện tại)", finalRank: p.rank ?? "Vàng II", peakRank: "Bạch kim I", current: true },
      { name: "Mùa 2", finalRank: "Vàng I", peakRank: "Vàng I" },
      { name: "Mùa 1", finalRank: "Bạc III", peakRank: "Vàng III" },
    ],
    stats: {
      matches: matchCount,
      winRate,
      elo: base.elo,
      eloWeekDelta,
      streak,
      hours,
    },
    elo30d,
    recent10,
    topCivs,
    modeStats,
    playmates,
    matches,
    tournaments,
    achievements,
    unlockedAchievements,
    pinnedIds,
    inventory,
    equipped,
    friends,
    friendRequests,
    mutualFriendIds,
  };
}

/** Resolve `#/profile/<playerId>` to a known player, or null if not found. */
export function resolveProfilePlayer(playerId: string | undefined, me: Player): Player | null {
  if (!playerId || playerId === me.id) return me;
  const known = [...Object.values(basePlayers), ...makePlayers(36)];
  return known.find((p) => p.id === playerId) ?? null;
}

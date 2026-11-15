// Mock data and domain rules for T11 (Clan).
import type { Faction, Player, PlayerNumber } from "../../components";
import { players as basePlayers } from "../shared/mock";
import { makePlayers } from "./lobbyMock";
import { hashString } from "./profileMock";

export type ClanRole = "Trưởng clan" | "Phó" | "Thành viên";
export type RecruitMode = "open" | "approval" | "closed";
export type ClanTab = "overview" | "members" | "requests" | "achievements" | "manage";

export const CLAN_MAX_MEMBERS = 50;
export const CLAN_MAX_DEPUTIES = 3;

export const RECRUIT_LABEL: Record<RecruitMode, string> = {
  open: "Mở",
  approval: "Duyệt đơn",
  closed: "Đóng",
};

export const RANK_TIERS = ["Đồng", "Bạc", "Vàng", "Bạch kim", "Kim cương"] as const;
export type RankTier = (typeof RANK_TIERS)[number];

export const FACTION_CHOICES: { value: Faction; label: string }[] = [
  { value: "greek", label: "Hy Lạp" },
  { value: "egyptian", label: "Ai Cập" },
  { value: "babylonian", label: "Babylon" },
  { value: "asian", label: "Á Đông" },
  { value: "roman", label: "La Mã" },
];

export interface ClanEmblem {
  faction: Faction;
  frame: number;
  color: PlayerNumber;
}

export interface ClanMember {
  player: Player;
  role: ClanRole;
  joinedAt: string;
  contribution: number;
  lastOnline: string;
}

export interface Announcement {
  id: string;
  text: string;
  authorName: string;
  at: string;
  pinned?: boolean;
}

export interface ClanActivity {
  id: string;
  text: string;
  at: string;
  chatSystem?: boolean;
}

export interface JoinRequest {
  id: string;
  player: Player;
  message: string;
  at: string;
}

export interface ClanInvite {
  id: string;
  clanTag: string;
  clanName: string;
  emblem: ClanEmblem;
  inviterName: string;
  at: string;
}

export interface ClanSentInvite {
  id: string;
  player: Player;
  inviterName: string;
  at: string;
}

export interface Clan {
  tag: string;
  name: string;
  emblem: ClanEmblem;
  bio: string;
  recruit: RecruitMode;
  minRank?: RankTier;
  points: number;
  rankPosition: number;
  foundedAt: string;
  members: ClanMember[];
  announcements: Announcement[];
  activity: ClanActivity[];
  requests: JoinRequest[];
  invitesSent: ClanSentInvite[];
  pointsHistory: number[];
}

export function extractRankTier(rank?: string): RankTier | null {
  if (!rank) return null;
  for (const tier of RANK_TIERS) {
    if (rank.toLowerCase().includes(tier.toLowerCase())) return tier;
  }
  return null;
}

export function meetsMinRank(playerRank: string | undefined, minRank?: RankTier): boolean {
  if (!minRank) return true;
  const playerTier = extractRankTier(playerRank);
  if (!playerTier) return false;
  return RANK_TIERS.indexOf(playerTier) >= RANK_TIERS.indexOf(minRank);
}

export function canJoinOrApply(
  clan: Clan,
  playerRank?: string,
): { allowed: boolean; reason?: string } {
  if (clan.recruit === "closed") {
    return { allowed: false, reason: "Clan không nhận người" };
  }
  if (clan.members.length >= CLAN_MAX_MEMBERS) {
    return { allowed: false, reason: "Clan đã đủ 50 thành viên" };
  }
  if (clan.minRank && !meetsMinRank(playerRank, clan.minRank)) {
    return { allowed: false, reason: `Cần hạng ${clan.minRank} trở lên` };
  }
  return { allowed: true };
}

interface SeedClanSpec {
  tag: string;
  name: string;
  faction: Faction;
  frame: number;
  color: PlayerNumber;
  memberCount: number;
  recruit: RecruitMode;
  minRank?: RankTier;
  points: number;
  rankPosition: number;
  foundedAt: string;
  bio: string;
}

const SEED_CLANS: SeedClanSpec[] = [
  {
    tag: "ABC",
    name: "Á Đông Bang",
    faction: "asian",
    frame: 0,
    color: 2,
    memberCount: 38,
    recruit: "approval",
    minRank: "Bạc",
    points: 12450,
    rankPosition: 7,
    foundedAt: "02/2024",
    bio: "Bang hội giao lưu AoE mỗi tối, chuyên Random và Cung R Shang 4v4.",
  },
  {
    tag: "HND",
    name: "Hà Nội Đế Chế",
    faction: "greek",
    frame: 1,
    color: 1,
    memberCount: 46,
    recruit: "approval",
    minRank: "Vàng",
    points: 15820,
    rankPosition: 3,
    foundedAt: "11/2023",
    bio: "Quy tụ anh em Hà Nội đam mê Đế Chế cổ điển, sinh hoạt cuối tuần.",
  },
  {
    tag: "SGP",
    name: "Sài Gòn Phố",
    faction: "roman",
    frame: 0,
    color: 5,
    memberCount: 27,
    recruit: "open",
    points: 9840,
    rankPosition: 14,
    foundedAt: "05/2024",
    bio: "Vui là chính, mở cửa đón tất cả anh em miền Nam và toàn quốc.",
  },
  {
    tag: "VNL",
    name: "Việt Nam Legends",
    faction: "babylonian",
    frame: 2,
    color: 3,
    memberCount: 50,
    recruit: "approval",
    minRank: "Bạch kim",
    points: 19200,
    rankPosition: 1,
    foundedAt: "08/2023",
    bio: "Clan top đầu bảng xếp hạng, thường xuyên tham gia các giải lớn.",
  },
  {
    tag: "SHG",
    name: "Thần Cung Shang",
    faction: "asian",
    frame: 3,
    color: 4,
    memberCount: 34,
    recruit: "open",
    minRank: "Vàng",
    points: 11200,
    rankPosition: 9,
    foundedAt: "01/2025",
    bio: "Luyện kèo Cung R Shang 2v2 / 4v4 chuẩn mực.",
  },
  {
    tag: "KGH",
    name: "Kinh Thành Cổ",
    faction: "egyptian",
    frame: 1,
    color: 8,
    memberCount: 19,
    recruit: "closed",
    points: 8150,
    rankPosition: 22,
    foundedAt: "03/2025",
    bio: "Nhóm bạn lâu năm, hiện chỉ nhận qua lời mời nội bộ.",
  },
  {
    tag: "DNX",
    name: "Đà Nẵng Xanh",
    faction: "greek",
    frame: 2,
    color: 6,
    memberCount: 24,
    recruit: "open",
    points: 7620,
    rankPosition: 27,
    foundedAt: "04/2025",
    bio: "Anh em miền Trung giao lưu hằng đêm từ 20h30.",
  },
  {
    tag: "BKT",
    name: "Bách Khoa Team",
    faction: "roman",
    frame: 2,
    color: 7,
    memberCount: 41,
    recruit: "approval",
    minRank: "Kim cương",
    points: 14900,
    rankPosition: 4,
    foundedAt: "09/2024",
    bio: "Tuyển cao thủ đánh giải, yêu cầu Kim cương trở lên.",
  },
  {
    tag: "TAN",
    name: "Tân Binh Hội",
    faction: "babylonian",
    frame: 0,
    color: 1,
    memberCount: 15,
    recruit: "open",
    points: 4210,
    rankPosition: 45,
    foundedAt: "07/2025",
    bio: "Chào mừng người mới tập chơi AoE, hướng dẫn tận tình.",
  },
  {
    tag: "RLM",
    name: "Rồng Lửa Miền Tây",
    faction: "egyptian",
    frame: 3,
    color: 2,
    memberCount: 31,
    recruit: "approval",
    minRank: "Đồng",
    points: 9120,
    rankPosition: 18,
    foundedAt: "06/2024",
    bio: "Đánh giải phong trào, tinh thần đồng đội.",
  },
];

function makeMemberPool(excludeId?: string): Player[] {
  const pool = [...Object.values(basePlayers), ...makePlayers(56)];
  return pool.filter((p) => p.id !== excludeId);
}

export function createInitialClans(me: Player): Clan[] {
  const pool = makeMemberPool(me.id);

  return SEED_CLANS.map((spec, idx) => {
    const h = hashString(spec.tag);
    const members: ClanMember[] = Array.from({ length: spec.memberCount }, (_, i) => {
      const p = pool[(h + i * 3) % pool.length];
      const uniquePlayer: Player =
        i < pool.length
          ? p
          : {
              ...p,
              id: `${spec.tag.toLowerCase()}-m-${i}`,
              name: `${p.name} #${i + 1}`,
            };
      const role: ClanRole =
        i === 0 ? "Trưởng clan" : i <= 2 && spec.memberCount >= 10 ? "Phó" : "Thành viên";
      const lastOnline =
        uniquePlayer.status === "online" || uniquePlayer.status === "in-game"
          ? "Đang online"
          : `${1 + ((h + i) % 12)} giờ trước`;
      return {
        player: uniquePlayer,
        role,
        joinedAt: `0${1 + ((h + i) % 9)}/2025`,
        contribution: Math.max(20, 950 - i * 18 + ((h + i) % 40)),
        lastOnline,
      };
    });

    const leaderName = members[0]?.player.name ?? "Trưởng clan";
    const pointsHistory = Array.from({ length: 12 }, (_, w) =>
      Math.max(1000, spec.points - (11 - w) * 180 + ((hashString(`${spec.tag}-w-${w}`) % 260) - 100)),
    );
    pointsHistory[11] = spec.points;

    return {
      tag: spec.tag,
      name: spec.name,
      emblem: { faction: spec.faction, frame: spec.frame, color: spec.color },
      bio: spec.bio,
      recruit: spec.recruit,
      minRank: spec.minRank,
      points: spec.points,
      rankPosition: spec.rankPosition,
      foundedAt: spec.foundedAt,
      members,
      announcements: [
        {
          id: `${spec.tag}-ann-1`,
          text: `Chào mừng đến với [${spec.tag}] ${spec.name}! Tập trung 20h mỗi tối.`,
          authorName: leaderName,
          at: "2 giờ trước",
          pinned: true,
        },
      ],
      activity: [
        {
          id: `${spec.tag}-act-1`,
          text: `${members[1]?.player.name ?? "Thành viên"} đã gia nhập clan`,
          at: "Hôm nay",
        },
        {
          id: `${spec.tag}-act-2`,
          text: `Đội ${spec.tag} Team vào bán kết Cúp Mùa Thu`,
          at: "Hôm qua",
        },
      ],
      requests:
        spec.recruit === "approval" && idx < 4
          ? [
              {
                id: `${spec.tag}-req-1`,
                player: pool[(h + 41) % pool.length],
                message: "Mình đánh Random & Shang mỗi tối, xin vào giao lưu cùng anh em!",
                at: "30 phút trước",
              },
            ]
          : [],
      invitesSent: [],
      pointsHistory,
    };
  });
}

export function createInitialClanInvites(clans: Clan[]): ClanInvite[] {
  const picks = [clans[2], clans[4]].filter(Boolean);
  return picks.map((c, idx) => ({
    id: `inv-${c.tag}-${idx}`,
    clanTag: c.tag,
    clanName: c.name,
    emblem: c.emblem,
    inviterName: c.members[0]?.player.name ?? "Trưởng clan",
    at: idx === 0 ? "15 phút trước" : "2 giờ trước",
  }));
}

export function findClanByTag(clans: Clan[], tag?: string): Clan | undefined {
  if (!tag) return undefined;
  const upper = tag.trim().toUpperCase();
  return clans.find((c) => c.tag.toUpperCase() === upper);
}

/** Deterministic clan membership for a player (shared with ProfileScreen & LobbyScreen). */
export function getPlayerClan(
  p: Player,
): { tag: string; name: string; role: ClanRole; joinedAt: string; members: number } | undefined {
  const h = hashString(p.name);
  if (h % 5 === 0) return undefined;
  const spec = SEED_CLANS[h % SEED_CLANS.length];
  const roles: ClanRole[] = ["Trưởng clan", "Phó", "Thành viên"];
  return {
    tag: spec.tag,
    name: spec.name,
    role: roles[(h >>> 2) % roles.length],
    joinedAt: `0${1 + (h % 8)}/2025`,
    members: spec.memberCount,
  };
}


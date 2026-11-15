// T11 Clan. One clan per player; leader (1) · deputy (≤ 3) · member; ≤ 50 members.
import type { ClanTag, Faction, Id, IsoDateTime, PageQuery, PlayerColor, PlayerId, PlayerSummary, RankTier, SystemText } from "./common";

export type ClanRole = "leader" | "deputy" | "member";
export type RecruitMode = "open" | "approval" | "closed";

export interface ClanEmblemDto {
  faction: Faction;
  /** Building frame inside the faction's icon set. */
  frame: number;
  color: PlayerColor;
}

/** Finder row and guest header. */
export interface ClanSummary {
  id: Id;
  tag: ClanTag;
  name: string;
  emblem: ClanEmblemDto;
  recruit: RecruitMode;
  minRank?: RankTier;
  memberCount: number;
  points: number;
  rankPosition: number;
}

export interface ClanMemberDto {
  player: PlayerSummary;
  role: ClanRole;
  joinedAt: IsoDateTime;
  contribution: number;
  /** Absent while online. */
  lastOnlineAt?: IsoDateTime;
}

export interface AnnouncementDto {
  id: Id;
  text: string;
  author: PlayerSummary;
  at: IsoDateTime;
  editedAt?: IsoDateTime;
  pinned: boolean;
}

export interface ClanActivityDto {
  id: Id;
  text: SystemText;
  at: IsoDateTime;
}

export interface JoinRequestDto {
  id: Id;
  player: PlayerSummary;
  message: string;
  at: IsoDateTime;
}

export interface ClanInviteDto {
  id: Id;
  clan: ClanSummary;
  inviter: PlayerSummary;
  at: IsoDateTime;
}

export interface ClanSentInviteDto {
  id: Id;
  player: PlayerSummary;
  inviter: PlayerSummary;
  at: IsoDateTime;
}

export interface ClanTournamentResultDto {
  tournamentId: Id;
  tournamentName: string;
  teamName: string;
  /** "champion" | "runner-up" | eliminated in round N. */
  result: { kind: "champion" } | { kind: "runner-up" } | { kind: "eliminated"; roundIndex: number; totalRounds: number };
  finishedAt: IsoDateTime;
}

export interface ClanDto extends ClanSummary {
  bio: string;
  foundedAt: IsoDateTime;
  members: ClanMemberDto[];
  announcements: AnnouncementDto[];
  activity: ClanActivityDto[];
  /** Weekly clan points, oldest first (12 weeks). */
  pointsHistory: number[];
  tournaments: ClanTournamentResultDto[];
  /** Leader / deputy only; absent for others. */
  requests?: JoinRequestDto[];
  invitesSent?: ClanSentInviteDto[];
}

/** My relation to a clan, for the action button (Vào clan / Xin vào / Huỷ đơn / locked). */
export interface MyClanStatus {
  /** My clan, if any. */
  clan?: ClanSummary & { role: ClanRole };
  /** Pending applications by clan id. */
  pendingApplications: { clanId: Id; requestId: Id }[];
  invites: ClanInviteDto[];
}

export interface ClanEditable {
  name: string;
  emblem: ClanEmblemDto;
  bio: string;
  recruit: RecruitMode;
  minRank?: RankTier;
}

export interface ClanQueries {
  "clan.search": { payload: PageQuery & { q?: string; recruit?: RecruitMode; minRank?: RankTier }; result: { items: ClanSummary[]; nextCursor?: string } };
  "clan.get": { payload: { tag: ClanTag }; result: ClanDto };
  "clan.mine": { payload: Record<string, never>; result: MyClanStatus };
}

export interface ClanCommands {
  "clan.create": { payload: ClanEditable & { tag: ClanTag }; result: { tag: ClanTag } };
  /** Leader. Tag cannot change. */
  "clan.update": { payload: { tag: ClanTag; changes: Partial<ClanEditable> }; result: Record<string, never> };
  /** Recruit "open" and eligible. */
  "clan.join": { payload: { tag: ClanTag }; result: Record<string, never> };
  /** Recruit "approval"; one pending application per clan. */
  "clan.apply": { payload: { tag: ClanTag; message: string }; result: { requestId: Id } };
  "clan.cancelApplication": { payload: { requestId: Id }; result: Record<string, never> };
  /** Leader / deputy. */
  "clan.respondApplication": { payload: { requestId: Id; accept: boolean }; result: Record<string, never> };
  /** Any member. */
  "clan.invite": { payload: { tag: ClanTag; playerId: PlayerId }; result: { inviteId: Id } };
  "clan.cancelInvite": { payload: { inviteId: Id }; result: Record<string, never> };
  "clan.respondInvite": { payload: { inviteId: Id; accept: boolean }; result: Record<string, never> };
  /** Leader: member ↔ deputy. */
  "clan.setRole": { payload: { tag: ClanTag; playerId: PlayerId; role: Exclude<ClanRole, "leader"> }; result: Record<string, never> };
  /** Leader kicks anyone; deputy kicks members only. */
  "clan.kick": { payload: { tag: ClanTag; playerId: PlayerId }; result: Record<string, never> };
  /** Leader may leave only as the last member (= disband). */
  "clan.leave": { payload: { tag: ClanTag }; result: Record<string, never> };
  /** Old leader becomes deputy, or member when deputies are full. */
  "clan.transferLeadership": { payload: { tag: ClanTag; playerId: PlayerId }; result: Record<string, never> };
  /** `confirmName` must equal the clan name. */
  "clan.disband": { payload: { tag: ClanTag; confirmName: string }; result: Record<string, never> };
  // Leader / deputy
  "clan.postAnnouncement": { payload: { tag: ClanTag; text: string }; result: AnnouncementDto };
  "clan.editAnnouncement": { payload: { tag: ClanTag; announcementId: Id; text: string }; result: Record<string, never> };
  "clan.deleteAnnouncement": { payload: { tag: ClanTag; announcementId: Id }; result: Record<string, never> };
  "clan.pinAnnouncement": { payload: { tag: ClanTag; announcementId: Id; pinned: boolean }; result: Record<string, never> };
}

export interface ClanEvents {
  "clan.updated": { topic: `clan:${ClanTag}`; payload: ClanSummary & Partial<Pick<ClanDto, "bio">> };
  /** Join, leave, kick, role change; `member` absent = removed. */
  "clan.member.changed": { topic: `clan:${ClanTag}`; payload: { playerId: PlayerId; member?: ClanMemberDto } };
  "clan.announcement.changed": { topic: `clan:${ClanTag}`; payload: { announcementId: Id; announcement?: AnnouncementDto } };
  "clan.activity": { topic: `clan:${ClanTag}`; payload: ClanActivityDto };
  /** Leader / deputy only. `request` absent = resolved / cancelled. */
  "clan.application.changed": { topic: `clan:${ClanTag}`; payload: { requestId: Id; request?: JoinRequestDto } };
  "clan.invite.received": { topic: "me"; payload: ClanInviteDto };
  /** My membership changed (accepted, kicked, disbanded) → reload clan.mine. */
  "clan.membership.changed": { topic: "me"; payload: { clan?: ClanSummary & { role: ClanRole }; reason: "joined" | "left" | "kicked" | "disbanded" | "role-changed" } };
}

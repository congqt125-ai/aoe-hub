import { useEffect, useId, useMemo, useState } from "react";
import {
  Button, Dialog, EmptyState, FormField, Spinner, TabPanel, Tabs, Textarea, Toast,
  type ChatMessageData, type Player, type ToastData,
} from "../../../components";
import {
  CLAN_MAX_DEPUTIES, CLAN_MAX_MEMBERS, createInitialClanInvites, createInitialClans,
  findClanByTag, type Announcement, type Clan, type ClanInvite, type ClanMember,
  type ClanRole, type ClanTab, type JoinRequest, type RecruitMode,
} from "../clanMock";
import { MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import { useClanRoute } from "../routes";
import { ClanAchievementsTab } from "./clan/ClanAchievementsTab";
import { ClanFinder } from "./clan/ClanFinder";
import { ClanHeader } from "./clan/ClanHeader";
import { ClanManageTab, type UpdateClanInput } from "./clan/ClanManageTab";
import { ClanMembersTab } from "./clan/ClanMembersTab";
import { ClanOverviewTab } from "./clan/ClanOverviewTab";
import { ClanRequestsTab } from "./clan/ClanRequestsTab";
import { CreateClanDialog, type CreateClanInput } from "./clan/CreateClanDialog";
import { InviteDialog } from "./clan/InviteDialog";

const MSG_MAX = 140;

type MockRoleChoice = "none" | "member" | "deputy" | "leader";
type MockLoadState = "ready" | "loading" | "error";

interface ClanMockConfig {
  role: MockRoleChoice;
  memberCount: number;
  deputyCount: number;
  requestCount: number;
  inviteCount: number;
  recruit: RecruitMode;
  announcementCount: number;
  loadState: MockLoadState;
}

const DEFAULT_CLAN_MOCK: ClanMockConfig = {
  role: "none",
  memberCount: 12,
  deputyCount: 2,
  requestCount: 3,
  inviteCount: 2,
  recruit: "approval",
  announcementCount: 2,
  loadState: "ready",
};

const ROLE_MAP: Record<Exclude<MockRoleChoice, "none">, ClanRole> = {
  member: "Thành viên",
  deputy: "Phó",
  leader: "Trưởng clan",
};

function makeMockPlayer(index: number): Player {
  return {
    id: `mock-clan-p-${index}`,
    name: `ChiếnTướng${index}`,
    rank: String(1200 + ((index * 73) % 700)),
    status: index % 3 === 0 ? "offline" : "online",
  };
}

function resizeMembers(members: ClanMember[], count: number, meId: string): ClanMember[] {
  const clamped = Math.max(1, Math.min(CLAN_MAX_MEMBERS, count));
  if (members.length === clamped) return members;
  if (members.length > clamped) {
    const keep = members.filter((m) => m.player.id === meId || m.role === "Trưởng clan");
    const rest = members.filter((m) => m.player.id !== meId && m.role !== "Trưởng clan");
    return [...keep, ...rest].slice(0, clamped);
  }
  const next = [...members];
  for (let i = next.length + 1; next.length < clamped; i++) {
    next.push({
      player: makeMockPlayer(i),
      role: "Thành viên",
      joinedAt: "01/2026",
      contribution: 20 + ((i * 17) % 180),
      lastOnline: i % 3 === 0 ? "2 giờ trước" : "Đang online",
    });
  }
  return next;
}

function applyDeputyCount(members: ClanMember[], deputyCount: number, meId: string): ClanMember[] {
  const clamped = Math.max(0, Math.min(CLAN_MAX_DEPUTIES, deputyCount));
  let assigned = 0;
  return members.map((m) => {
    if (m.role === "Trưởng clan") return m;
    if (m.player.id === meId && m.role === "Phó" && assigned < clamped) {
      assigned += 1;
      return m;
    }
    return { ...m, role: "Thành viên" as ClanRole };
  }).map((m) => {
    if (m.role === "Trưởng clan" || m.role === "Phó") return m;
    if (assigned < clamped) {
      assigned += 1;
      return { ...m, role: "Phó" as ClanRole };
    }
    return m;
  });
}

function resizeRequests(requests: JoinRequest[], count: number): JoinRequest[] {
  const clamped = Math.max(0, Math.min(20, count));
  if (requests.length >= clamped) return requests.slice(0, clamped);
  const next = [...requests];
  for (let i = next.length + 1; next.length < clamped; i++) {
    next.push({
      id: `mock-req-${i}`,
      player: makeMockPlayer(100 + i),
      message: "Xin gia nhập clan để đánh team buổi tối.",
      at: `${i * 5} phút trước`,
    });
  }
  return next;
}

function resizeAnnouncements(list: Announcement[], count: number, authorName: string): Announcement[] {
  const clamped = Math.max(0, Math.min(6, count));
  if (list.length >= clamped) return list.slice(0, clamped);
  const next = [...list];
  for (let i = next.length + 1; next.length < clamped; i++) {
    next.push({
      id: `mock-ann-${i}`,
      text: `Thông báo nội bộ #${i}: Lịch tập trung phòng clan lúc 20:00 tối nay.`,
      authorName,
      at: "Hôm nay",
      pinned: i <= 3,
    });
  }
  return next;
}

/**
 * T11 — Trang Clan (§3.1–§3.4: Tìm clan, Tạo clan, Trang clan 5 tab & Chế độ khách).
 */
export function ClanScreen({ me }: { me: Player }) {
  const idBase = useId();
  const { tag, tab: rawTab, setTab, goClan } = useClanRoute();

  const [clans, setClans] = useState<Clan[]>(() => createInitialClans(me));
  const [invites, setInvites] = useState<ClanInvite[]>(() => createInitialClanInvites(clans));
  const [myClanTag, setMyClanTag] = useState<string | null>(null);
  const [appliedTags, setAppliedTags] = useState<Set<string>>(() => new Set());
  const [chatByTag, setChatByTag] = useState<Record<string, ChatMessageData[]>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [guestApplyClan, setGuestApplyClan] = useState<Clan | null>(null);
  const [guestApplyMsg, setGuestApplyMsg] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);
  const [mockCfg, setMockCfg] = useState<ClanMockConfig>(DEFAULT_CLAN_MOCK);

  const activeMockTag = myClanTag ?? clans[0]?.tag;

  const patchActiveClan = (fn: (c: Clan) => Clan) => {
    if (!activeMockTag) return;
    setClans((prev) => prev.map((c) => (c.tag === activeMockTag ? fn(c) : c)));
  };

  const handleMockRole = (nextRole: MockRoleChoice) => {
    setMockCfg((prev) => ({ ...prev, role: nextRole }));
    if (nextRole === "none") {
      setClans((prev) =>
        prev.map((c) =>
          c.tag === myClanTag
            ? { ...c, members: c.members.filter((m) => m.player.id !== me.id) }
            : c,
        ),
      );
      setMyClanTag(null);
      goClan();
      return;
    }
    const targetTag = myClanTag ?? clans[0]?.tag;
    if (!targetTag) return;
    const roleLabel = ROLE_MAP[nextRole];
    setClans((prev) =>
      prev.map((c) => {
        if (c.tag !== targetTag) return c;
        let members = c.members.filter((m) => m.player.id !== me.id);
        if (roleLabel === "Trưởng clan") {
          members = members.map((m) =>
            m.role === "Trưởng clan" ? { ...m, role: "Phó" as ClanRole } : m,
          );
        }
        const meEntry: ClanMember = {
          player: me,
          role: roleLabel,
          joinedAt: "01/2026",
          contribution: 120,
          lastOnline: "Đang online",
        };
        return { ...c, members: [meEntry, ...members] };
      }),
    );
    setMyClanTag(targetTag);
    goClan();
  };

  const handleMockInvites = (count: number) => {
    const clamped = Math.max(0, Math.min(3, count));
    setMockCfg((prev) => ({ ...prev, inviteCount: clamped }));
    setInvites((prev) => {
      if (prev.length >= clamped) return prev.slice(0, clamped);
      const pool = createInitialClanInvites(clans);
      const next = [...prev];
      for (let i = 0; next.length < clamped; i++) {
        const src = pool[i % Math.max(1, pool.length)];
        next.push({
          id: `mock-inv-${next.length + 1}`,
          clanTag: src?.clanTag ?? clans[0]?.tag ?? "AOEVN",
          clanName: src?.clanName ?? clans[0]?.name ?? "Đại Việt",
          emblem: src?.emblem ?? clans[0]?.emblem ?? { faction: "asian", frame: 0, color: 1 },
          inviterName: src?.inviterName ?? "ChimSe",
          at: "Vừa xong",
        });
      }
      return next;
    });
  };

  const handleResetMock = () => {
    const fresh = createInitialClans(me);
    setClans(fresh);
    setInvites(createInitialClanInvites(fresh));
    setMyClanTag(null);
    setAppliedTags(new Set());
    setChatByTag({});
    setMockCfg(DEFAULT_CLAN_MOCK);
    goClan();
  };

  const mockPanel = (
    <MockShell title="Dữ liệu giả — Clan" onReset={handleResetMock}>
      <MockGroup>Vai của bạn</MockGroup>
      <MockChoice
        label="Vai của bạn"
        value={mockCfg.role}
        options={[
          { value: "none", label: "Chưa có clan" },
          { value: "member", label: "Thành viên" },
          { value: "deputy", label: "Phó" },
          { value: "leader", label: "Trưởng clan" },
        ]}
        onChange={handleMockRole}
      />

      <MockGroup>Quy mô &amp; đơn từ</MockGroup>
      <MockSlider
        label="Số thành viên"
        min={1}
        max={50}
        value={mockCfg.memberCount}
        changed={mockCfg.memberCount !== DEFAULT_CLAN_MOCK.memberCount}
        onChange={(v) => {
          setMockCfg((prev) => ({ ...prev, memberCount: v }));
          patchActiveClan((c) => ({ ...c, members: resizeMembers(c.members, v, me.id) }));
        }}
      />
      <MockSlider
        label="Số Phó"
        min={0}
        max={3}
        value={mockCfg.deputyCount}
        changed={mockCfg.deputyCount !== DEFAULT_CLAN_MOCK.deputyCount}
        onChange={(v) => {
          setMockCfg((prev) => ({ ...prev, deputyCount: v }));
          patchActiveClan((c) => ({ ...c, members: applyDeputyCount(c.members, v, me.id) }));
        }}
      />
      <MockSlider
        label="Đơn đang chờ"
        min={0}
        max={20}
        value={mockCfg.requestCount}
        changed={mockCfg.requestCount !== DEFAULT_CLAN_MOCK.requestCount}
        onChange={(v) => {
          setMockCfg((prev) => ({ ...prev, requestCount: v }));
          patchActiveClan((c) => ({ ...c, requests: resizeRequests(c.requests, v) }));
        }}
      />
      <MockSlider
        label="Lời mời nhận"
        min={0}
        max={3}
        value={mockCfg.inviteCount}
        changed={mockCfg.inviteCount !== DEFAULT_CLAN_MOCK.inviteCount}
        onChange={handleMockInvites}
      />

      <MockGroup>Cách nhận người</MockGroup>
      <MockChoice
        label="Cách nhận người"
        value={mockCfg.recruit}
        options={[
          { value: "open", label: "Mở" },
          { value: "approval", label: "Duyệt đơn" },
          { value: "closed", label: "Đóng" },
        ]}
        onChange={(v) => {
          setMockCfg((prev) => ({ ...prev, recruit: v }));
          patchActiveClan((c) => ({ ...c, recruit: v }));
        }}
      />

      <MockGroup>Thông báo</MockGroup>
      <MockSlider
        label="Số thông báo"
        min={0}
        max={6}
        value={mockCfg.announcementCount}
        changed={mockCfg.announcementCount !== DEFAULT_CLAN_MOCK.announcementCount}
        onChange={(v) => {
          setMockCfg((prev) => ({ ...prev, announcementCount: v }));
          patchActiveClan((c) => ({ ...c, announcements: resizeAnnouncements(c.announcements, v, me.name) }));
        }}
      />

      <MockGroup>Trạng thái tải trang</MockGroup>
      <MockChoice
        label="Trạng thái tải trang"
        value={mockCfg.loadState}
        options={[
          { value: "ready", label: "Bình thường" },
          { value: "loading", label: "Đang tải" },
          { value: "error", label: "Lỗi tải" },
        ]}
        onChange={(v) => setMockCfg((prev) => ({ ...prev, loadState: v }))}
      />
    </MockShell>
  );

  useEffect(() => {
    setCreateOpen(false);
    setInviteOpen(false);
    setGuestApplyClan(null);
  }, [tag, myClanTag]);

  const targetClan = useMemo(() => {
    if (tag) return findClanByTag(clans, tag) ?? null;
    if (myClanTag) return findClanByTag(clans, myClanTag) ?? null;
    return undefined;
  }, [clans, tag, myClanTag]);

  const pushSystemChat = (clanTag: string, text: string) => {
    const msg: ChatMessageData = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: "system",
      text,
      at: new Date().toISOString(),
    };
    setChatByTag((prev) => ({
      ...prev,
      [clanTag]: [...(prev[clanTag] ?? []), msg],
    }));
  };

  const updateClan = (clanTag: string, fn: (c: Clan) => Clan) => {
    setClans((prev) => prev.map((c) => (c.tag === clanTag ? fn(c) : c)));
  };

  const addActivity = (clanTag: string, text: string, chatSystem = false) => {
    updateClan(clanTag, (c) => ({
      ...c,
      activity: [
        { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, at: "Vừa xong", chatSystem },
        ...c.activity,
      ],
    }));
    if (chatSystem) pushSystemChat(clanTag, text);
  };

  const joinClanAsMember = (clanTag: string, inviter?: string) => {
    const actText = inviter
      ? `${me.name} đã gia nhập clan theo lời mời của ${inviter}`
      : `${me.name} đã gia nhập clan`;
    updateClan(clanTag, (c) => {
      if (c.members.some((m) => m.player.id === me.id) || c.members.length >= CLAN_MAX_MEMBERS) return c;
      return {
        ...c,
        members: [
          ...c.members,
          { player: me, role: "Thành viên", joinedAt: "Hôm nay", contribution: 0, lastOnline: "Đang online" },
        ],
        activity: [{ id: `act-${Date.now()}`, text: actText, at: "Vừa xong", chatSystem: true }, ...c.activity],
      };
    });
    pushSystemChat(clanTag, actText);
    setMyClanTag(clanTag);
    setAppliedTags(new Set());
    goClan();
  };

  const handleCreateClan = (input: CreateClanInput) => {
    const now = new Date();
    const foundedAt = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const newClan: Clan = {
      tag: input.tag,
      name: input.name,
      emblem: input.emblem,
      bio: input.bio || "Clan mới thành lập.",
      recruit: input.recruit,
      minRank: input.minRank,
      points: 1000,
      rankPosition: clans.length + 1,
      foundedAt,
      members: [{ player: me, role: "Trưởng clan", joinedAt: foundedAt, contribution: 100, lastOnline: "Đang online" }],
      announcements: [],
      activity: [{ id: `act-create-${Date.now()}`, text: "Clan được thành lập", at: "Vừa xong", chatSystem: true }],
      requests: [],
      invitesSent: [],
      pointsHistory: Array.from({ length: 12 }, () => 1000),
    };
    setClans((prev) => [newClan, ...prev]);
    pushSystemChat(newClan.tag, "Clan được thành lập");
    setMyClanTag(newClan.tag);
    setAppliedTags(new Set());
    setCreateOpen(false);
    goClan();
    setToast({ id: `created-${newClan.tag}`, kind: "success", title: `Đã tạo clan [${newClan.tag}] ${newClan.name}`, description: "Bạn là Trưởng clan." });
  };

  if (mockCfg.loadState === "loading") {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <Spinner size={32} label="Đang tải dữ liệu clan…" />
        {mockPanel}
      </div>
    );
  }

  if (mockCfg.loadState === "error") {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <div className="w-[min(460px,100%)] bg-black/60 bevel-raised-2">
          <EmptyState
            title="Không thể tải dữ liệu clan"
            description="Kết nối máy chủ clan tạm thời gián đoạn. Vui lòng thử lại."
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Thử lại", onClick: () => setMockCfg((prev) => ({ ...prev, loadState: "ready" })) }}
          />
        </div>
        {mockPanel}
      </div>
    );
  }

  // Unknown tag (#/clan/<BAD>)
  if (tag && targetClan === null) {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <div className="w-[min(460px,100%)] bg-black/60 bevel-raised-2">
          <EmptyState
            title="Không tìm thấy clan"
            description={`Không có clan nào mang thẻ “[${tag}]”.`}
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Về Tìm clan", onClick: () => goClan() }}
          />
        </div>
        {mockPanel}
      </div>
    );
  }

  // Viewing a clan (own clan or guest mode)
  if (targetClan) {
    const myMember = targetClan.members.find((m) => m.player.id === me.id);
    const myRole: ClanRole | undefined = targetClan.tag === myClanTag ? myMember?.role : undefined;
    const isLeader = myRole === "Trưởng clan";
    const isOfficer = myRole === "Trưởng clan" || myRole === "Phó";

    const tabItems: { value: ClanTab; label: string; count?: number }[] = [
      { value: "overview", label: "Tổng quan" },
      { value: "members", label: `Thành viên (${targetClan.members.length})` },
      ...(isOfficer ? [{ value: "requests" as const, label: "Đơn xin vào", count: targetClan.requests.length }] : []),
      { value: "achievements", label: "Thành tích" },
      ...(isLeader ? [{ value: "manage" as const, label: "Quản lý" }] : []),
    ];

    const activeTab: ClanTab = tabItems.some((t) => t.value === rawTab) ? (rawTab as ClanTab) : "overview";
    const clanChat = chatByTag[targetClan.tag] ?? [
      {
        id: `welcome-${targetClan.tag}`,
        kind: "system" as const,
        text: `Chào mừng đến với kênh chat clan [${targetClan.tag}].`,
        at: new Date().toISOString(),
      },
    ];

    return (
      <div className="tone-screen flex h-full min-h-0 flex-col gap-2">
        <ClanHeader
          clan={targetClan}
          me={me}
          myRole={myRole}
          hasAnyClan={Boolean(myClanTag && myClanTag !== targetClan.tag)}
          isApplied={appliedTags.has(targetClan.tag)}
          onOpenInvite={() => setInviteOpen(true)}
          onOpenManage={() => setTab("manage")}
          onLeaveClan={() => {
            if (isLeader && targetClan.members.length === 1) {
              setClans((prev) => prev.filter((c) => c.tag !== targetClan.tag));
              setToast({ id: "disband-leave", kind: "warning", title: `Đã giải tán clan [${targetClan.tag}]` });
            } else {
              updateClan(targetClan.tag, (c) => ({
                ...c,
                members: c.members.filter((m) => m.player.id !== me.id),
              }));
              addActivity(targetClan.tag, `${me.name} đã rời clan`, true);
              setToast({ id: "left-clan", kind: "info", title: `Bạn đã rời clan [${targetClan.tag}]` });
            }
            setMyClanTag(null);
            goClan();
          }}
          onJoinOpenClan={() => {
            joinClanAsMember(targetClan.tag);
            setToast({ id: `join-${targetClan.tag}`, kind: "success", title: `Đã vào clan [${targetClan.tag}] ${targetClan.name}` });
          }}
          onApplyClan={() => {
            setGuestApplyMsg("");
            setGuestApplyClan(targetClan);
          }}
          onCancelApplication={() => {
            setAppliedTags((prev) => {
              const next = new Set(prev);
              next.delete(targetClan.tag);
              return next;
            });
            setToast({ id: `cancel-${targetClan.tag}`, kind: "info", title: `Đã huỷ đơn vào [${targetClan.tag}]` });
          }}
        />

        <section aria-label="Nội dung clan" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black/55 bevel-raised">
          <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-black/25 px-4 py-2">
            <Tabs
              label="Mục clan"
              idBase={idBase}
              items={tabItems}
              value={activeTab}
              onChange={(next) => setTab(next)}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeTab === "overview" && (
              <TabPanel idBase={idBase} value="overview">
                <ClanOverviewTab
                  clan={targetClan}
                  myRole={myRole}
                  chatMessages={clanChat}
                  onSendChat={(text) => {
                    const msg: ChatMessageData = {
                      id: `chat-${Date.now()}`,
                      kind: "own",
                      author: me,
                      text,
                      at: new Date().toISOString(),
                    };
                    setChatByTag((prev) => ({
                      ...prev,
                      [targetClan.tag]: [...(prev[targetClan.tag] ?? clanChat), msg],
                    }));
                  }}
                  onSaveAnnouncement={(text, editId) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      announcements: editId
                        ? c.announcements.map((a) => (a.id === editId ? { ...a, text, at: "Vừa sửa" } : a))
                        : [{ id: `ann-${Date.now()}`, text, authorName: me.name, at: "Vừa xong" }, ...c.announcements],
                    }));
                    addActivity(targetClan.tag, editId ? `${me.name} đã sửa một thông báo` : `${me.name} đã đăng thông báo mới`);
                  }}
                  onDeleteAnnouncement={(id) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      announcements: c.announcements.filter((a) => a.id !== id),
                    }));
                    addActivity(targetClan.tag, `${me.name} đã xoá một thông báo`);
                  }}
                  onTogglePinAnnouncement={(id) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      announcements: c.announcements.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)),
                    }));
                  }}
                />
              </TabPanel>
            )}

            {activeTab === "members" && (
              <TabPanel idBase={idBase} value="members">
                <ClanMembersTab
                  clan={targetClan}
                  me={me}
                  myRole={myRole}
                  onPromoteDeputy={(member) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      members: c.members.map((m) => (m.player.id === member.player.id ? { ...m, role: "Phó" } : m)),
                    }));
                    addActivity(targetClan.tag, `${member.player.name} được thăng chức Phó clan`, true);
                    setToast({ id: `prom-${member.player.id}`, kind: "success", title: `Đã thăng ${member.player.name} làm Phó` });
                  }}
                  onDemoteMember={(member) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      members: c.members.map((m) => (m.player.id === member.player.id ? { ...m, role: "Thành viên" } : m)),
                    }));
                    addActivity(targetClan.tag, `${member.player.name} được giáng xuống Thành viên`, true);
                    setToast({ id: `dem-${member.player.id}`, kind: "info", title: `Đã giáng ${member.player.name} xuống Thành viên` });
                  }}
                  onKickMember={(member) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      members: c.members.filter((m) => m.player.id !== member.player.id),
                    }));
                    addActivity(targetClan.tag, `${member.player.name} đã bị kích khỏi clan`, true);
                    setToast({ id: `kick-${member.player.id}`, kind: "warning", title: `Đã kích ${member.player.name} khỏi clan` });
                  }}
                />
              </TabPanel>
            )}

            {activeTab === "requests" && isOfficer && (
              <TabPanel idBase={idBase} value="requests">
                <ClanRequestsTab
                  clan={targetClan}
                  onApprove={(req) => {
                    updateClan(targetClan.tag, (c) => {
                      if (c.members.length >= CLAN_MAX_MEMBERS) return c;
                      return {
                        ...c,
                        requests: c.requests.filter((r) => r.id !== req.id),
                        members: [
                          ...c.members,
                          { player: req.player, role: "Thành viên", joinedAt: "Hôm nay", contribution: 0, lastOnline: "Vừa xong" },
                        ],
                      };
                    });
                    addActivity(targetClan.tag, `${req.player.name} đã được duyệt vào clan`, true);
                    setToast({ id: `app-${req.id}`, kind: "success", title: `Đã duyệt ${req.player.name} vào clan` });
                  }}
                  onReject={(req) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      requests: c.requests.filter((r) => r.id !== req.id),
                    }));
                    setToast({ id: `rej-${req.id}`, kind: "info", title: `Đã từ chối đơn của ${req.player.name}` });
                  }}
                  onCancelSentInvite={(inv) => {
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      invitesSent: c.invitesSent.filter((x) => x.id !== inv.id),
                    }));
                    setToast({ id: `cinv-${inv.id}`, kind: "info", title: `Đã huỷ lời mời tới ${inv.player.name}` });
                  }}
                />
              </TabPanel>
            )}

            {activeTab === "achievements" && (
              <TabPanel idBase={idBase} value="achievements">
                <ClanAchievementsTab clan={targetClan} />
              </TabPanel>
            )}

            {activeTab === "manage" && isLeader && (
              <TabPanel idBase={idBase} value="manage">
                <ClanManageTab
                  clan={targetClan}
                  me={me}
                  existingClans={clans}
                  onSaveInfo={(input: UpdateClanInput) => {
                    updateClan(targetClan.tag, (c) => ({ ...c, ...input }));
                    addActivity(targetClan.tag, `${me.name} đã cập nhật thông tin clan`);
                    setToast({ id: "clan-saved", kind: "success", title: "Đã lưu thông tin clan" });
                  }}
                  onTransferLeadership={(nextLeader) => {
                    const deputyCount = targetClan.members.filter((m) => m.role === "Phó").length;
                    const myNextRole: ClanRole =
                      nextLeader.role !== "Phó" && deputyCount >= CLAN_MAX_DEPUTIES ? "Thành viên" : "Phó";
                    updateClan(targetClan.tag, (c) => ({
                      ...c,
                      members: c.members.map((m) => {
                        if (m.player.id === nextLeader.player.id) return { ...m, role: "Trưởng clan" };
                        if (m.player.id === me.id) return { ...m, role: myNextRole };
                        return m;
                      }),
                    }));
                    addActivity(targetClan.tag, `${me.name} đã chuyển quyền Trưởng clan cho ${nextLeader.player.name}`, true);
                    setTab("overview");
                    setToast({ id: "transfer", kind: "success", title: `Đã chuyển quyền Trưởng clan cho ${nextLeader.player.name}` });
                  }}
                  onDisband={() => {
                    const disbandedName = targetClan.name;
                    setClans((prev) => prev.filter((c) => c.tag !== targetClan.tag));
                    setMyClanTag(null);
                    goClan();
                    setToast({ id: "disband", kind: "warning", title: `Đã giải tán clan ${disbandedName}` });
                  }}
                />
              </TabPanel>
            )}
          </div>
        </section>

        {inviteOpen && (
          <InviteDialog
            clan={targetClan}
            allClans={clans}
            onInvite={(player) => {
              updateClan(targetClan.tag, (c) => ({
                ...c,
                invitesSent: [
                  { id: `sent-${Date.now()}`, player, inviterName: me.name, at: "Vừa xong" },
                  ...c.invitesSent,
                ],
              }));
              setToast({ id: `inv-${player.id}`, kind: "success", title: `Đã gửi lời mời tới ${player.name}` });
            }}
            onClose={() => setInviteOpen(false)}
          />
        )}

        {guestApplyClan && (
          <Dialog
            title={`Xin vào [${guestApplyClan.tag}] ${guestApplyClan.name}`}
            size="sm"
            onClose={() => setGuestApplyClan(null)}
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedTags((prev) => new Set(prev).add(guestApplyClan.tag));
              setToast({ id: `apply-${guestApplyClan.tag}`, kind: "success", title: "Đã gửi đơn xin vào clan" });
              setGuestApplyClan(null);
            }}
            actions={
              <>
                <Button type="button" variant="secondary" onClick={() => setGuestApplyClan(null)}>Huỷ</Button>
                <Button type="submit" variant="primary">Gửi đơn</Button>
              </>
            }
          >
            <FormField label={`Lời nhắn (${guestApplyMsg.length}/${MSG_MAX})`}>
              <Textarea
                value={guestApplyMsg}
                rows={3}
                maxLength={MSG_MAX}
                onChange={(e) => setGuestApplyMsg(e.target.value.slice(0, MSG_MAX))}
              />
            </FormField>
          </Dialog>
        )}

        {toast && (
          <div className="pointer-events-none fixed bottom-16 right-6 z-50">
            <Toast toast={toast} onClose={() => setToast(null)} />
          </div>
        )}
        {mockPanel}
      </div>
    );
  }

  // No clan yet -> ClanFinder (§3.2)
  return (
    <>
      <ClanFinder
        me={me}
        clans={clans}
        invites={invites}
        appliedTags={appliedTags}
        onOpenClan={(clanTag) => goClan(clanTag)}
        onJoinOpenClan={(clan) => {
          joinClanAsMember(clan.tag);
          setToast({ id: `joined-${clan.tag}`, kind: "success", title: `Đã vào clan [${clan.tag}] ${clan.name}` });
        }}
        onApplyClan={(clan) => {
          setAppliedTags((prev) => new Set(prev).add(clan.tag));
          setToast({
            id: `applied-${clan.tag}`,
            kind: "success",
            title: "Đã gửi đơn xin vào clan",
            description: `Đơn vào [${clan.tag}] ${clan.name} đang chờ Trưởng/Phó duyệt.`,
          });
        }}
        onCancelApplication={(clan) => {
          setAppliedTags((prev) => {
            const next = new Set(prev);
            next.delete(clan.tag);
            return next;
          });
          setToast({ id: `cancel-${clan.tag}`, kind: "info", title: `Đã huỷ đơn vào [${clan.tag}]` });
        }}
        onAcceptInvite={(inv) => {
          setInvites((prev) => prev.filter((x) => x.id !== inv.id));
          joinClanAsMember(inv.clanTag, inv.inviterName);
          setToast({
            id: `accept-inv-${inv.clanTag}`,
            kind: "success",
            title: `Đã gia nhập [${inv.clanTag}] ${inv.clanName}`,
            description: "Bạn là Thành viên mới của clan.",
          });
        }}
        onDeclineInvite={(inv) => {
          setInvites((prev) => prev.filter((x) => x.id !== inv.id));
          setToast({ id: `decline-inv-${inv.id}`, kind: "info", title: `Đã từ chối lời mời từ [${inv.clanTag}]` });
        }}
        onOpenCreate={() => setCreateOpen(true)}
      />

      {createOpen && (
        <CreateClanDialog existingClans={clans} onCreate={handleCreateClan} onClose={() => setCreateOpen(false)} />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-16 right-6 z-50">
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}
      {mockPanel}
    </>
  );
}

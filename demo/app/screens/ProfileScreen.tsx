import { useEffect, useId, useMemo, useState } from "react";
import {
  EmptyState, Spinner, TabPanel, Tabs, Toast, type Player, type ToastData,
} from "../../../components";
import type { CivId } from "../civs";
import { MockCheck, MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import {
  buildProfileData, MOCK_SAMPLE_PLAYERS, PROFILE_TABS, resolveProfilePlayer,
  type ItemCategory, type ProfileData, type ProfileMockOptions, type ProfileTab,
} from "../profileMock";
import { useProfileRoute } from "../routes";
import { AchievementsTab } from "./profile/AchievementsTab";
import { EditProfileDialog } from "./profile/EditProfileDialog";
import { FriendList } from "./profile/FriendList";
import { HistoryTab } from "./profile/HistoryTab";
import { InventoryTab } from "./profile/InventoryTab";
import { OverviewTab } from "./profile/OverviewTab";
import { ProfileHeader } from "./profile/ProfileHeader";

type LoadState = "ready" | "loading" | "error";

/**
 * T7 — Trang Hồ sơ (§3.1–§4).
 * Fixed 1600x900 shell without SideNav: ProfileHeader on top, Tabs + vertically scrollable body below.
 */
export function ProfileScreen({ me }: { me: Player }) {
  const idBase = useId();
  const { playerId, tab: rawTab, setTab, goProfile } = useProfileRoute();

  const target = useMemo(() => resolveProfilePlayer(playerId, me), [playerId, me]);

  // Session overrides per player id (edit profile, equip items, friend actions, block)
  const [edits, setEdits] = useState<Record<string, { bio: string; favouriteCiv: CivId; pinnedIds: string[] }>>({});
  const [equippedOverrides, setEquippedOverrides] = useState<Record<string, Partial<Record<ItemCategory, string>>>>({});
  const [addedFriends, setAddedFriends] = useState<Record<string, Player[]>>({});
  const [removedFriendIds, setRemovedFriendIds] = useState<Record<string, Set<string>>>({});
  const [handledRequestIds, setHandledRequestIds] = useState<Record<string, Set<string>>>({});
  const [sentRequests, setSentRequests] = useState<Set<string>>(() => new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());
  const [editingOpen, setEditingOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // §4 Mock panel state
  const [mockOpts, setMockOpts] = useState<ProfileMockOptions>({});
  const [loadState, setLoadState] = useState<LoadState>("ready");

  // Close edit dialog when switching profile target
  useEffect(() => {
    setEditingOpen(false);
  }, [target?.id]);

  const effectiveTarget = target ?? me;
  const isMe = effectiveTarget.id === me.id;
  const visibleTabs = PROFILE_TABS.filter((t) => isMe || !t.selfOnly);
  const activeTab: ProfileTab = visibleTabs.some((t) => t.value === rawTab)
    ? (rawTab as ProfileTab)
    : "overview";

  const myBaseFriends = useMemo(() => buildProfileData(me, mockOpts).friends, [me, mockOpts]);
  const myFriendIds = useMemo(() => {
    const removed = removedFriendIds[me.id];
    const added = addedFriends[me.id] ?? [];
    const list = [...myBaseFriends.filter((f) => !removed?.has(f.id)), ...added];
    return new Set(list.map((f) => f.id));
  }, [myBaseFriends, removedFriendIds, addedFriends, me.id]);

  const profileData: ProfileData = useMemo(() => {
    const base = buildProfileData(effectiveTarget, mockOpts);
    const patch = edits[effectiveTarget.id];
    const eqPatch = equippedOverrides[effectiveTarget.id];
    const nextEquipped = eqPatch ? { ...base.equipped, ...eqPatch } : base.equipped;

    const findItem = (id: string) => base.inventory.find((it) => it.id === id);
    const eqAvatar = findItem(nextEquipped.avatar);
    const eqFrame = findItem(nextEquipped.frame);
    const eqTitle = findItem(nextEquipped.title);
    const eqBg = findItem(nextEquipped.bg);

    const removed = removedFriendIds[effectiveTarget.id];
    const added = addedFriends[effectiveTarget.id] ?? [];
    const handled = handledRequestIds[effectiveTarget.id];

    const friends = [
      ...base.friends.filter((f) => !removed?.has(f.id)),
      ...added.filter((a) => !base.friends.some((f) => f.id === a.id)),
    ];
    const friendRequests = base.friendRequests.filter((r) => !handled?.has(r.id));

    return {
      ...base,
      ...(patch ?? {}),
      player: {
        ...base.player,
        avatar: eqAvatar?.avatarSource ?? base.player.avatar,
      },
      frameRarity: eqFrame?.rarity ?? base.frameRarity,
      title: eqTitle?.titleText ?? base.title,
      bannerBg: eqBg?.bgFile ?? base.bannerBg,
      equipped: nextEquipped,
      friends,
      friendRequests,
    };
  }, [effectiveTarget, mockOpts, edits, equippedOverrides, removedFriendIds, addedFriends, handledRequestIds]);

  if (!target) {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <div className="w-[min(460px,100%)] bg-black/60 bevel-raised-2">
          <EmptyState
            title="Không tìm thấy người chơi"
            description={`Không có dữ liệu hồ sơ cho mã “${playerId}”.`}
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Về hồ sơ của tôi", onClick: () => goProfile() }}
          />
        </div>
      </div>
    );
  }

  const mockShell = (
    <MockShell
      title="Dữ liệu giả — Hồ sơ"
      onReset={() => {
        setMockOpts({});
        setLoadState("ready");
        setEdits({});
        setEquippedOverrides({});
        setAddedFriends({});
        setRemovedFriendIds({});
        setHandledRequestIds({});
        setSentRequests(new Set());
        setBlockedIds(new Set());
        goProfile();
      }}
    >
      <MockGroup>Người chơi đang xem</MockGroup>
      <MockChoice
        label="Xem hồ sơ"
        value={isMe ? "me" : target.id}
        options={[
          { value: "me", label: `Của mình (${me.name})` },
          ...MOCK_SAMPLE_PLAYERS.filter((p) => p.id !== me.id).map((p) => ({
            value: p.id,
            label: p.name,
          })),
        ]}
        onChange={(v) => goProfile(v === "me" ? undefined : v, activeTab)}
      />

      <MockGroup>Số liệu & thống kê</MockGroup>
      <MockSlider
        label="Số trận (0 = mới)"
        min={0}
        max={2000}
        step={10}
        changed={mockOpts.matchesCount !== undefined}
        value={mockOpts.matchesCount ?? profileData.stats.matches}
        onChange={(v) => setMockOpts((o) => ({ ...o, matchesCount: v }))}
      />
      <MockSlider
        label="Tỉ lệ thắng"
        min={0}
        max={100}
        unit="%"
        changed={mockOpts.winRate !== undefined}
        value={mockOpts.winRate ?? profileData.stats.winRate}
        onChange={(v) => setMockOpts((o) => ({ ...o, winRate: v }))}
      />
      <MockSlider
        label="Thành tựu đạt"
        min={0}
        max={100}
        unit="%"
        changed={mockOpts.achievementPercent !== undefined}
        value={
          mockOpts.achievementPercent ??
          Math.round((profileData.unlockedAchievements.length / Math.max(1, profileData.achievements.length)) * 100)
        }
        onChange={(v) => setMockOpts((o) => ({ ...o, achievementPercent: v }))}
      />
      <MockSlider
        label="Độ đầy kho đồ"
        min={0}
        max={100}
        unit="%"
        changed={mockOpts.inventoryPercent !== undefined}
        value={
          mockOpts.inventoryPercent ??
          Math.round((profileData.inventory.filter((x) => x.owned).length / Math.max(1, profileData.inventory.length)) * 100)
        }
        onChange={(v) => setMockOpts((o) => ({ ...o, inventoryPercent: v }))}
      />
      <MockCheck
        label="Có Clan"
        checked={mockOpts.hasClan ?? Boolean(profileData.clan)}
        onChange={(v) => setMockOpts((o) => ({ ...o, hasClan: v }))}
      />

      <MockGroup>Bạn bè & trạng thái</MockGroup>
      <MockSlider
        label="Số bạn bè"
        min={0}
        max={24}
        changed={mockOpts.friendsCount !== undefined}
        value={mockOpts.friendsCount ?? profileData.friends.length}
        onChange={(v) => setMockOpts((o) => ({ ...o, friendsCount: v }))}
      />
      <MockSlider
        label="Lời mời kết bạn"
        min={0}
        max={6}
        changed={mockOpts.requestsCount !== undefined}
        value={mockOpts.requestsCount ?? profileData.friendRequests.length}
        onChange={(v) => setMockOpts((o) => ({ ...o, requestsCount: v }))}
      />
      <MockChoice
        label="Trạng thái tải trang"
        value={loadState}
        options={[
          { value: "ready", label: "Bình thường" },
          { value: "loading", label: "Đang tải" },
          { value: "error", label: "Lỗi tải" },
        ]}
        onChange={setLoadState}
      />
    </MockShell>
  );

  if (loadState === "loading") {
    return (
      <div className="tone-screen flex h-full flex-col items-center justify-center gap-3">
        <Spinner size={32} label="Đang tải hồ sơ" />
        <span className="text-sm text-tone-text/80">Đang tải dữ liệu hồ sơ…</span>
        {mockShell}
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <div className="w-[min(460px,100%)] bg-black/60 bevel-raised-2">
          <EmptyState
            title="Không thể tải hồ sơ"
            description="Kết nối máy chủ bị gián đoạn. Vui lòng thử lại."
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Thử lại", onClick: () => setLoadState("ready") }}
          />
        </div>
        {mockShell}
      </div>
    );
  }

  const friendStatus: "none" | "sent" | "friend" =
    target.relation === "friend" ? "friend" : sentRequests.has(target.id) ? "sent" : "none";
  const isBlocked = target.relation === "blocked" || blockedIds.has(target.id);

  return (
    <div className="tone-screen flex h-full min-h-0 flex-col gap-2">
      <ProfileHeader
        profile={profileData}
        isMe={isMe}
        friendStatus={friendStatus}
        isBlocked={isBlocked}
        onEdit={() => setEditingOpen(true)}
        onFriendRequest={() => {
          setSentRequests((s) => new Set(s).add(target.id));
          setToast({
            id: `friend-${target.id}`,
            kind: "success",
            title: "Đã gửi lời mời kết bạn",
            description: `Đã gửi lời mời tới ${target.name}.`,
          });
        }}
        onMessage={() =>
          setToast({
            id: "msg-t6",
            kind: "info",
            title: "Tin nhắn riêng làm ở T6",
            description: "Tính năng nhắn tin trực tiếp sẽ được nối ở mục Bạn bè & tin nhắn.",
          })
        }
        onInvite={() =>
          setToast({
            id: `invite-${target.id}`,
            kind: "success",
            title: "Đã gửi lời mời vào phòng",
            description: `Đã mời ${target.name} vào phòng chơi (giả lập).`,
          })
        }
        onBlockConfirm={() => {
          setBlockedIds((s) => new Set(s).add(target.id));
          setToast({
            id: `block-${target.id}`,
            kind: "warning",
            title: `Đã chặn ${target.name}`,
          });
        }}
        onReport={() =>
          setToast({
            id: `report-${target.id}`,
            kind: "info",
            title: "Đã gửi báo cáo",
            description: `Cảm ơn bạn — báo cáo về ${target.name} đã được ghi nhận.`,
          })
        }
      />

      {/* Tabs + scrollable content area */}
      <section aria-label="Nội dung hồ sơ" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black/55 bevel-raised">
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 bg-black/25 px-4 py-2">
          <Tabs
            label="Mục hồ sơ"
            idBase={idBase}
            items={visibleTabs.map(({ value, label }) => ({ value, label }))}
            value={activeTab}
            onChange={(next) => setTab(next)}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {activeTab === "overview" && (
            <TabPanel idBase={idBase} value="overview">
              <OverviewTab
                profile={profileData}
                onOpenPlayer={(id) => goProfile(id === me.id ? undefined : id)}
              />
            </TabPanel>
          )}

          {activeTab === "history" && (
            <TabPanel idBase={idBase} value="history">
              <HistoryTab profile={profileData} />
            </TabPanel>
          )}

          {activeTab === "achievements" && (
            <TabPanel idBase={idBase} value="achievements">
              <AchievementsTab
                profile={profileData}
                isMe={isMe}
                onTogglePin={(achId) => {
                  const current = profileData.pinnedIds;
                  const exists = current.includes(achId);
                  if (!exists && current.length >= 3) return;
                  const nextPinned = exists
                    ? current.filter((x) => x !== achId)
                    : [...current, achId];
                  setEdits((prev) => ({
                    ...prev,
                    [target.id]: {
                      bio: prev[target.id]?.bio ?? profileData.bio,
                      favouriteCiv: prev[target.id]?.favouriteCiv ?? profileData.favouriteCiv,
                      pinnedIds: nextPinned,
                    },
                  }));
                }}
              />
            </TabPanel>
          )}

          {activeTab === "inventory" && isMe && (
            <TabPanel idBase={idBase} value="inventory">
              <InventoryTab
                profile={profileData}
                onEquip={(item) => {
                  setEquippedOverrides((prev) => ({
                    ...prev,
                    [target.id]: {
                      ...(prev[target.id] ?? {}),
                      [item.category]: item.id,
                    },
                  }));
                  setToast({
                    id: `equip-${item.id}`,
                    kind: "success",
                    title: "Đã trang bị",
                    description: item.name,
                  });
                }}
              />
            </TabPanel>
          )}

          {activeTab === "friends" && (
            <TabPanel idBase={idBase} value="friends">
              <FriendList
                friends={profileData.friends}
                requests={isMe ? profileData.friendRequests : []}
                isMe={isMe}
                mutualIds={new Set(profileData.friends.filter((f) => myFriendIds.has(f.id)).map((f) => f.id))}
                myFriendIds={myFriendIds}
                sentRequestIds={sentRequests}
                onOpenProfile={(id) => goProfile(id === me.id ? undefined : id)}
                onEmptyAction={() => {
                  location.hash = "#/lobby";
                }}
                onAcceptRequest={(req) => {
                  setHandledRequestIds((prev) => {
                    const next = new Set(prev[target.id] ?? []);
                    next.add(req.id);
                    return { ...prev, [target.id]: next };
                  });
                  setAddedFriends((prev) => ({
                    ...prev,
                    [target.id]: [...(prev[target.id] ?? []), req],
                  }));
                  setToast({
                    id: `accept-${req.id}`,
                    kind: "success",
                    title: `Đã kết bạn với ${req.name}`,
                  });
                }}
                onDeclineRequest={(req) => {
                  setHandledRequestIds((prev) => {
                    const next = new Set(prev[target.id] ?? []);
                    next.add(req.id);
                    return { ...prev, [target.id]: next };
                  });
                  setToast({
                    id: `decline-${req.id}`,
                    kind: "info",
                    title: `Đã từ chối lời mời của ${req.name}`,
                  });
                }}
                onRemoveFriend={(fr) => {
                  setRemovedFriendIds((prev) => {
                    const next = new Set(prev[target.id] ?? []);
                    next.add(fr.id);
                    return { ...prev, [target.id]: next };
                  });
                  setToast({
                    id: `remove-${fr.id}`,
                    kind: "warning",
                    title: `Đã huỷ kết bạn với ${fr.name}`,
                  });
                }}
                onMessage={(fr) =>
                  setToast({
                    id: `msg-${fr.id}`,
                    kind: "info",
                    title: "Tin nhắn riêng làm ở T6",
                    description: `Mở chat với ${fr.name} sẽ nối ở Bạn bè & tin nhắn.`,
                  })
                }
                onInvite={(fr) =>
                  setToast({
                    id: `inv-${fr.id}`,
                    kind: "success",
                    title: "Đã gửi lời mời vào phòng",
                    description: `Đã mời ${fr.name} vào phòng chơi (giả lập).`,
                  })
                }
                onSendFriendRequest={(fr) => {
                  setSentRequests((s) => new Set(s).add(fr.id));
                  setToast({
                    id: `req-${fr.id}`,
                    kind: "success",
                    title: "Đã gửi lời mời kết bạn",
                    description: `Đã gửi lời mời tới ${fr.name}.`,
                  });
                }}
              />
            </TabPanel>
          )}
        </div>
      </section>

      {editingOpen && isMe && (
        <EditProfileDialog
          profile={profileData}
          onSave={(patch) => {
            setEdits((prev) => ({ ...prev, [target.id]: patch }));
            setEditingOpen(false);
            setToast({
              id: "profile-saved",
              kind: "success",
              title: "Đã cập nhật hồ sơ",
            });
          }}
          onClose={() => setEditingOpen(false)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-16 right-6 z-50">
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}

      {mockShell}
    </div>
  );
}

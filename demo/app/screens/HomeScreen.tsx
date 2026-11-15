import { useCallback, useMemo, useState } from "react";
import {
  EmptyState, Spinner, Toast, type Player, type ToastData,
} from "../../../components";
import {
  clearSeenVersions,
  DEFAULT_HOME_MOCK,
  HERO_STATIC_SLIDES,
  loadSeenVersions,
  saveSeenVersions,
  type ChangelogProduct,
  type HeroSlide,
  type HomeLoadState,
  type HomeMockConfig,
  type HomeTournamentScenario,
} from "../homeMock";
import type { LobbyRoom, useLobbyMock } from "../lobbyMock";
import { MockCheck, MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import { buildProfileData } from "../profileMock";
import type { EnterMode } from "../roomMock";
import type { RouteId } from "../routes";
import { createInitialTournaments, type Tournament } from "../tournamentMock";
import { FriendsOnline } from "./home/FriendsOnline";
import { HeroCarousel } from "./home/HeroCarousel";
import { LiveAndChampion } from "./home/LiveAndChampion";
import { SuggestedRooms } from "./home/SuggestedRooms";
import { TournamentStrip } from "./home/TournamentStrip";
import { WhatsNew } from "./home/WhatsNew";

export interface HomeScreenProps {
  me: Player;
  lobby: ReturnType<typeof useLobbyMock>;
  onEnterRoom: (room: LobbyRoom, mode: EnterMode) => void;
  onNavigate: (route: RouteId) => void;
}

const TOURNAMENT_SCENARIOS: { value: HomeTournamentScenario; label: string }[] = [
  { value: "normal", label: "Bình thường" },
  { value: "empty", label: "Không có giải" },
  { value: "live", label: "Có trận đang đấu" },
  { value: "champion", label: "Có nhà vô địch" },
];

const LOAD_STATES: { value: HomeLoadState; label: string }[] = [
  { value: "ready", label: "Bình thường" },
  { value: "loading", label: "Đang tải" },
  { value: "error", label: "Lỗi" },
];

/**
 * T2 — Trang chủ (§1–§4).
 * Fixed 1600x900 promotional hub without page scroll: left column (~1180px), right column (380px).
 */
export function HomeScreen({ me, lobby, onEnterRoom, onNavigate }: HomeScreenProps) {
  const [mockConfig, setMockState] = useState<HomeMockConfig>(DEFAULT_HOME_MOCK);
  const [seenVersions, setSeenVersions] = useState<Set<string>>(() => loadSeenVersions());
  const [toast, setToast] = useState<ToastData | null>(null);
  const [changelogReq, setChangelogReq] = useState<{
    product: ChangelogProduct;
    version?: string;
    id: number;
  } | null>(null);

  const setMock = (patch: Partial<HomeMockConfig>) =>
    setMockState((prev) => ({ ...prev, ...patch }));

  const baseTournaments = useMemo(() => createInitialTournaments(), []);
  const tournaments = useMemo<Tournament[]>(() => {
    if (mockConfig.tournamentScenario === "empty") return [];
    if (mockConfig.tournamentScenario === "live") {
      return baseTournaments.map((t, idx) => {
        if (idx !== 0) return t;
        const hasLive = t.matches.some((m) => m.status === "live");
        if (hasLive) return t;
        const firstMatch = t.matches[0];
        if (!firstMatch) return t;
        return {
          ...t,
          phase: "playing",
          matches: t.matches.map((m, mi) =>
            mi === 0
              ? {
                  ...m,
                  status: "live",
                  teamAId: m.teamAId ?? t.teams[0]?.id,
                  teamBId: m.teamBId ?? t.teams[1]?.id,
                  scoreA: 1,
                  scoreB: 0,
                }
              : m,
          ),
        };
      });
    }
    if (mockConfig.tournamentScenario === "champion") {
      return baseTournaments.map((t, idx) => {
        if (idx !== baseTournaments.length - 1) return t;
        const champ = t.teams[0];
        if (!champ) return t;
        return {
          ...t,
          phase: "finished",
          matches: t.matches.map((m, mi) =>
            mi === t.matches.length - 1 ? { ...m, winnerId: champ.id, status: "done" } : m,
          ),
        };
      });
    }
    return baseTournaments;
  }, [baseTournaments, mockConfig.tournamentScenario]);

  const slides = useMemo<HeroSlide[]>(() => {
    const tourSlide: HeroSlide = {
      id: "slide-tournament",
      kind: "tournament",
      badge: "Giải đấu",
      title: tournaments[0]?.name ?? "Giải đấu SuperAoE",
      description: "Đăng ký tham gia giải đấu chính thức trên SuperAoE Hub.",
      bgImage: HERO_STATIC_SLIDES[0].bgImage,
    };
    const pool =
      mockConfig.includeTournamentSlide && tournaments.length > 0
        ? [tourSlide, ...HERO_STATIC_SLIDES]
        : HERO_STATIC_SLIDES;
    return pool.slice(0, mockConfig.slideCount);
  }, [mockConfig.includeTournamentSlide, mockConfig.slideCount, tournaments]);

  const baseFriends = useMemo(() => buildProfileData(me).friends, [me]);
  const friends = useMemo<Player[]>(() => {
    const onlinePool = baseFriends.filter((f) => f.status !== "offline");
    const offlinePool = baseFriends.filter((f) => f.status === "offline");
    const targetOnline = mockConfig.onlineFriendsCount;

    const adjustedOnline: Player[] = [];
    for (let i = 0; i < targetOnline; i++) {
      const src = onlinePool[i % Math.max(1, onlinePool.length)] ?? baseFriends[i % baseFriends.length];
      if (!src) break;
      adjustedOnline.push(
        i < onlinePool.length
          ? src
          : {
              ...src,
              id: `${src.id}-extra-${i}`,
              name: `${src.name} ${i + 1}`,
              status: i % 3 === 0 ? "in-game" : "online",
              activity: i % 3 === 0 ? "Đang chơi: Random 2v2" : undefined,
            },
      );
    }
    return [...adjustedOnline, ...offlinePool];
  }, [baseFriends, mockConfig.onlineFriendsCount]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const handleMarkSeen = useCallback((keys: string[]) => {
    setSeenVersions((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const k of keys) {
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      }
      if (changed) saveSeenVersions(next);
      return changed ? next : prev;
    });
  }, []);

  const openProfile = (playerId: string) => {
    location.hash = `#/profile/${encodeURIComponent(playerId)}`;
  };

  const mockShell = (
    <MockShell
      title="Dữ liệu giả — Trang chủ"
      onReset={() => {
        setMockState(DEFAULT_HOME_MOCK);
        clearSeenVersions();
        setSeenVersions(new Set());
      }}
    >
      <MockGroup>Banner</MockGroup>
      <MockSlider
        label="Số slide"
        min={1}
        max={5}
        value={mockConfig.slideCount}
        changed={mockConfig.slideCount !== DEFAULT_HOME_MOCK.slideCount}
        onChange={(slideCount) => setMock({ slideCount })}
      />
      <MockCheck
        label="Có slide giải đấu"
        checked={mockConfig.includeTournamentSlide}
        onChange={(includeTournamentSlide) => setMock({ includeTournamentSlide })}
      />

      <MockGroup>Giải đấu</MockGroup>
      <MockChoice<HomeTournamentScenario>
        label="Kịch bản giải đấu"
        value={mockConfig.tournamentScenario}
        options={TOURNAMENT_SCENARIOS}
        onChange={(tournamentScenario) => setMock({ tournamentScenario })}
      />

      <MockGroup>Phòng & Bạn bè</MockGroup>
      <MockSlider
        label="Phòng gợi ý"
        min={0}
        max={4}
        value={mockConfig.suggestedRoomCount}
        changed={mockConfig.suggestedRoomCount !== DEFAULT_HOME_MOCK.suggestedRoomCount}
        onChange={(suggestedRoomCount) => setMock({ suggestedRoomCount })}
      />
      <MockSlider
        label="Bạn online"
        min={0}
        max={20}
        value={mockConfig.onlineFriendsCount}
        changed={mockConfig.onlineFriendsCount !== DEFAULT_HOME_MOCK.onlineFriendsCount}
        onChange={(onlineFriendsCount) => setMock({ onlineFriendsCount })}
      />

      <MockGroup>Có gì mới</MockGroup>
      <MockCheck
        label="Có phiên bản chưa xem"
        checked={mockConfig.hasUnseenChangelog}
        onChange={(hasUnseenChangelog) => setMock({ hasUnseenChangelog })}
      />

      <MockGroup>Trạng thái trang</MockGroup>
      <MockChoice<HomeLoadState>
        label="Trạng thái tải trang"
        value={mockConfig.loadState}
        options={LOAD_STATES}
        onChange={(loadState) => setMock({ loadState })}
      />
    </MockShell>
  );

  if (mockConfig.loadState === "loading") {
    return (
      <div className="tone-screen flex h-full min-h-0 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div className="flex h-[280px] shrink-0 items-center justify-center bg-black/55 bevel-raised-2">
            <Spinner size={24} label="Đang tải banner" />
          </div>
          <div className="flex h-[170px] shrink-0 items-center justify-center bg-black/55 bevel-raised-2">
            <Spinner size={24} label="Đang tải giải đấu" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
            <div className="flex items-center justify-center bg-black/55 bevel-raised-2">
              <Spinner size={24} label="Đang tải phòng gợi ý" />
            </div>
            <div className="flex items-center justify-center bg-black/55 bevel-raised-2">
              <Spinner size={24} label="Đang tải cập nhật" />
            </div>
          </div>
        </div>
        <div className="flex w-[380px] shrink-0 items-center justify-center bg-black/55 bevel-raised-2">
          <Spinner size={24} label="Đang tải bạn bè" />
        </div>
        {mockShell}
      </div>
    );
  }

  if (mockConfig.loadState === "error") {
    return (
      <div className="tone-screen flex h-full items-center justify-center">
        <div className="w-[min(460px,100%)] bg-black/60 bevel-raised-2">
          <EmptyState
            title="Không thể tải Trang chủ"
            description="Kết nối máy chủ bị gián đoạn. Vui lòng thử lại."
            art={{ set: "building:greek", frame: 4 }}
            action={{ label: "Thử lại", onClick: () => setMock({ loadState: "ready" }) }}
          />
        </div>
        {mockShell}
      </div>
    );
  }

  return (
    <div className="tone-screen flex h-full min-h-0 gap-3">
      {/* Left column (~1180px): Hero → Tournaments → Suggested rooms | What's new */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <HeroCarousel
          slides={slides}
          tournaments={tournaments}
          onGoTournament={() => onNavigate("tournament")}
          onOpenChangelog={(product, version) =>
            setChangelogReq({ product, version, id: Date.now() })
          }
          onEventToast={(title, description) =>
            setToast({ id: `event-${Date.now()}`, kind: "info", title, description })
          }
        />

        <TournamentStrip
          tournaments={tournaments}
          onOpenTournaments={() => onNavigate("tournament")}
        />

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <SuggestedRooms
            me={me}
            rooms={lobby.rooms}
            friendIds={friendIds}
            maxCount={mockConfig.suggestedRoomCount}
            onGoLobby={() => onNavigate("lobby")}
            onEnterRoom={onEnterRoom}
            onCreateRoom={(input) => lobby.createRoom(input)}
          />

          <WhatsNew
            seenVersions={seenVersions}
            hasUnseenOverride={mockConfig.hasUnseenChangelog}
            onMarkSeen={handleMarkSeen}
            dialogRequest={changelogReq}
          />
        </div>
      </div>

      {/* Right column (380px): Friends online → Live matches → Latest champion */}
      <aside className="flex min-h-0 w-[380px] shrink-0 flex-col gap-3">
        <FriendsOnline
          friends={friends}
          onOpenProfile={openProfile}
          onOpenAllFriends={() => {
            location.hash = "#/profile?tab=friends";
          }}
          onInvite={(f) =>
            setToast({
              id: `invite-${f.id}`,
              kind: "success",
              title: "Đã gửi lời mời",
              description: `Đã mời ${f.name} vào phòng chơi (giả lập).`,
            })
          }
          onWatch={(f) => {
            const room = lobby.rooms.find((r) => r.host.id === f.id && r.status === "playing");
            if (room) {
              onEnterRoom(room, "watch");
            } else {
              setToast({
                id: `watch-${f.id}`,
                kind: "info",
                title: `Đang theo dõi ${f.name}`,
                description: f.activity ?? "Trận đấu hiện không có phòng công khai trong Sảnh.",
              });
            }
          }}
        />

        <LiveAndChampion
          tournaments={tournaments}
          onGoTournament={() => onNavigate("tournament")}
          onOpenProfile={openProfile}
        />
      </aside>

      {mockShell}

      {toast && (
        <div className="fixed bottom-10 right-4 z-toast">
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

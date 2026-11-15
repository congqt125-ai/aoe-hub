import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Avatar, Button, Dialog, EmptyState, GameIcon, Icon, Pagination, Select,
  TabPanel, Tabs, Tooltip, cx, type PlayerNumber,
} from "../../../../components";
import { civLabel, civStyle } from "../../civs";
import type { MatchPlayer, MatchRow, ProfileData } from "../../profileMock";
import { GAME_TYPES, type GameType } from "../../roomMock";

type SubTab = "matches" | "tournaments";
type ResultFilter = "all" | "win" | "loss";
type TimeFilter = "all" | "7" | "30";

const PAGE_SIZE = 20;

const PLAYER_SWATCH: Record<PlayerNumber, string> = {
  1: "bg-player-1",
  2: "bg-player-2",
  3: "bg-player-3",
  4: "bg-player-4",
  5: "bg-player-5",
  6: "bg-player-6",
  7: "bg-player-7",
  8: "bg-player-8",
};

const GAME_TYPE_OPTIONS: { value: "all" | GameType; label: string }[] = [
  { value: "all", label: "Tất cả thể loại" },
  ...GAME_TYPES.map((g) => ({ value: g.value, label: g.label })),
];

const RESULT_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "Tất cả kết quả" },
  { value: "win", label: "Thắng" },
  { value: "loss", label: "Thua" },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Mọi thời gian" },
  { value: "7", label: "7 ngày gần đây" },
  { value: "30", label: "30 ngày gần đây" },
];

function AvatarStack({ players }: { players: MatchPlayer[] }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {players.map((p, idx) => (
        <Tooltip key={`${p.id}-${idx}`} content={`${p.name} (${civLabel(p.civId)})`}>
          <span className="inline-flex rounded-full ring-1 ring-black/80">
            <Avatar size="xs" name={p.name} source={p.avatar} />
          </span>
        </Tooltip>
      ))}
    </div>
  );
}

/** T7 §3.4 — Tab Lịch sử đấu (Trận đấu & Giải đấu). */
export function HistoryTab({ profile }: { profile: ProfileData }) {
  const idBase = useId();
  const [subTab, setSubTab] = useState<SubTab>("matches");
  const [gameType, setGameType] = useState<"all" | GameType>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);
  const loadTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
    };
  }, []);

  // Reset pagination when profile or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelectedMatch(null);
  }, [profile.player.id, gameType, resultFilter, timeFilter]);

  const filteredMatches = useMemo(() => {
    return profile.matches.filter((m) => {
      if (gameType !== "all" && m.gameType !== gameType) return false;
      if (resultFilter === "win" && !m.win) return false;
      if (resultFilter === "loss" && m.win) return false;
      if (timeFilter === "7" && m.daysAgo > 7) return false;
      if (timeFilter === "30" && m.daysAgo > 30) return false;
      return true;
    });
  }, [profile.matches, gameType, resultFilter, timeFilter]);

  const visibleMatches = filteredMatches.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMatches.length;

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadTimerRef.current = window.setTimeout(() => {
      setVisibleCount((c) => c + PAGE_SIZE);
      setLoadingMore(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="segmented"
          label="Loại lịch sử đấu"
          idBase={idBase}
          items={[
            { value: "matches", label: `Trận đấu (${profile.matches.length})` },
            { value: "tournaments", label: `Giải đấu (${profile.tournaments.length})` },
          ]}
          value={subTab}
          onChange={setSubTab}
        />

        {subTab === "matches" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                aria-label="Lọc thể loại"
                value={gameType}
                onChange={(v) => setGameType(v as "all" | GameType)}
                options={GAME_TYPE_OPTIONS}
              />
            </div>
            <div className="w-40">
              <Select
                aria-label="Lọc kết quả"
                value={resultFilter}
                onChange={(v) => setResultFilter(v as ResultFilter)}
                options={RESULT_OPTIONS}
              />
            </div>
            <div className="w-44">
              <Select
                aria-label="Lọc thời gian"
                value={timeFilter}
                onChange={(v) => setTimeFilter(v as TimeFilter)}
                options={TIME_OPTIONS}
              />
            </div>
          </div>
        )}
      </div>

      {subTab === "matches" && (
        <TabPanel idBase={idBase} value="matches">
          {filteredMatches.length === 0 ? (
            <div className="bg-black/35 bevel-sunken-1">
              <EmptyState
                title="Chưa có trận nào"
                description="Không có trận đấu nào khớp với bộ lọc hiện tại."
                art={{ set: "building:greek", frame: 4 }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto bg-black/35 bevel-sunken-1">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/15 bg-black/35 text-xs uppercase tracking-wider text-tone-text/65">
                      <th className="px-3 py-2.5 font-semibold">Kết quả</th>
                      <th className="px-3 py-2.5 font-semibold">Thể loại</th>
                      <th className="px-3 py-2.5 font-semibold">Loại map</th>
                      <th className="px-3 py-2.5 font-semibold">Đế chế</th>
                      <th className="px-3 py-2.5 font-semibold">Đồng đội / Đối thủ</th>
                      <th className="px-3 py-2.5 font-semibold">Thời lượng</th>
                      <th className="px-3 py-2.5 font-semibold">Ngày</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Điểm ±</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {visibleMatches.map((m) => (
                      <tr
                        key={m.id}
                        tabIndex={0}
                        onClick={() => setSelectedMatch(m)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedMatch(m);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        <td className="px-3 py-2 font-semibold">
                          <span className={m.win ? "text-success-on-dark" : "text-danger-on-dark"}>
                            {m.win ? "Thắng" : "Thua"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-tone-text">{m.gameTypeLabel}</td>
                        <td className="px-3 py-2 text-tone-text/85">{m.mapTypeLabel}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2 text-tone-text">
                            <GameIcon set={`building:${civStyle(m.civId) ?? "greek"}`} frame={0} size={20} />
                            <span>{civLabel(m.civId)}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <AvatarStack players={m.teammates} />
                            <span className="text-xs text-tone-text/50">vs</span>
                            <AvatarStack players={m.opponents} />
                          </div>
                        </td>
                        <td className="px-3 py-2 tabular text-tone-text/85">{m.durationMin}p</td>
                        <td className="px-3 py-2 tabular text-tone-text/75">{m.dateLabel}</td>
                        <td
                          className={cx(
                            "px-3 py-2 text-right font-semibold tabular",
                            m.eloDelta >= 0 ? "text-success-on-dark" : "text-danger-on-dark",
                          )}
                        >
                          {m.eloDelta >= 0 ? `+${m.eloDelta}` : m.eloDelta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                variant="load-more"
                hasMore={hasMore}
                loading={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          )}
        </TabPanel>
      )}

      {subTab === "tournaments" && (
        <TabPanel idBase={idBase} value="tournaments">
          {profile.tournaments.length === 0 ? (
            <div className="bg-black/35 bevel-sunken-1">
              <EmptyState
                title="Chưa tham gia giải nào"
                description="Người chơi này chưa ghi nhận giải đấu nào."
                art={{ set: "building:greek", frame: 4 }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto bg-black/35 bevel-sunken-1">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 bg-black/35 text-xs uppercase tracking-wider text-tone-text/65">
                    <th className="px-3 py-2.5 font-semibold">Tên giải</th>
                    <th className="px-3 py-2.5 font-semibold">Ngày</th>
                    <th className="px-3 py-2.5 font-semibold">Đội</th>
                    <th className="px-3 py-2.5 font-semibold">Vai trò</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Thành tích</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {profile.tournaments.map((t) => (
                    <tr
                      key={t.id}
                      tabIndex={0}
                      onClick={() => {
                        location.hash = "#/tournament";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          location.hash = "#/tournament";
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      <td className="px-3 py-2.5 font-semibold text-tone-focus">{t.name}</td>
                      <td className="px-3 py-2.5 tabular text-tone-text/75">{t.dateLabel}</td>
                      <td className="px-3 py-2.5 text-tone-text">{t.teamName}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cx(
                            "inline-block px-2 py-0.5 text-xs bevel-sunken-1",
                            t.role === "Đội trưởng"
                              ? "bg-black/55 font-semibold text-tone-focus"
                              : "bg-black/35 text-tone-text/80",
                          )}
                        >
                          {t.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        <span className={cx("inline-flex items-center gap-1.5", t.isChampion ? "text-tone-focus" : "text-tone-text")}>
                          {t.isChampion && <Icon name="trophy" size={16} />}
                          <span>{t.result}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabPanel>
      )}

      {selectedMatch && (
        <Dialog
          title={`Chi tiết trận đấu — ${selectedMatch.win ? "Thắng" : "Thua"}`}
          size="md"
          onClose={() => setSelectedMatch(null)}
          actions={<Button variant="secondary" onClick={() => setSelectedMatch(null)}>Đóng</Button>}
        >
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-black/35 px-3 py-2 bevel-sunken-1">
              <div className="flex flex-wrap items-center gap-3 text-tone-text/90">
                <span>{selectedMatch.gameTypeLabel}</span>
                <span aria-hidden className="text-tone-text/40">·</span>
                <span>{selectedMatch.mapTypeLabel}</span>
                <span aria-hidden className="text-tone-text/40">·</span>
                <span className="tabular">{selectedMatch.durationMin} phút</span>
                <span aria-hidden className="text-tone-text/40">·</span>
                <span className="tabular text-tone-text/75">{selectedMatch.dateLabel}</span>
              </div>
              <span
                className={cx(
                  "font-heading text-md font-bold tabular",
                  selectedMatch.eloDelta >= 0 ? "text-success-on-dark" : "text-danger-on-dark",
                )}
              >
                {selectedMatch.eloDelta >= 0 ? `+${selectedMatch.eloDelta}` : selectedMatch.eloDelta} điểm
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: selectedMatch.win ? "Phe ta (Thắng)" : "Phe ta (Thua)", players: selectedMatch.teammates, win: selectedMatch.win },
                { label: selectedMatch.win ? "Phe địch (Thua)" : "Phe địch (Thắng)", players: selectedMatch.opponents, win: !selectedMatch.win },
              ].map((side) => (
                <div key={side.label} className="flex flex-col gap-2 bg-black/35 p-3 bevel-sunken-1">
                  <div className={cx("text-xs font-semibold uppercase tracking-wider", side.win ? "text-success-on-dark" : "text-danger-on-dark")}>
                    {side.label}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {side.players.map((pl, idx) => (
                      <div key={`${pl.id}-${idx}`} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={cx("inline-block h-3 w-3 shrink-0 border border-black/60", PLAYER_SWATCH[pl.color])} />
                          <span className="truncate text-tone-text">{pl.name}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-tone-text/80">
                          <GameIcon set={`building:${civStyle(pl.civId) ?? "greek"}`} frame={0} size={16} />
                          <span>{civLabel(pl.civId)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

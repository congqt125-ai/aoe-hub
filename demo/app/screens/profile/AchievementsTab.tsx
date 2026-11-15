import { useId, useMemo, useState } from "react";
import {
  EmptyState, GameIcon, Icon, ProgressBar, Select, Tabs, Tooltip, cx,
} from "../../../../components";
import {
  ACHIEVEMENT_GROUP_LABELS, type AchievementGroup, type ProfileAchievement, type ProfileData,
} from "../../profileMock";

type StatusFilter = "all" | "unlocked" | "locked";
type GroupFilter = "all" | AchievementGroup;

const GROUP_ORDER: AchievementGroup[] = ["battle", "civ", "tournament", "community", "season"];
const MAX_PINNED = 3;

const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
  { value: "all", label: "Tất cả nhóm" },
  ...GROUP_ORDER.map((g) => ({ value: g, label: ACHIEVEMENT_GROUP_LABELS[g] })),
];

function AchievementCard({
  ach,
  isMe,
  isPinned,
  canPinMore,
  onTogglePin,
}: {
  ach: ProfileAchievement;
  isMe: boolean;
  isPinned: boolean;
  canPinMore: boolean;
  onTogglePin: (id: string) => void;
}) {
  const unlocked = Boolean(ach.achievedAt);
  const pct = Math.min(100, Math.round((ach.progress / Math.max(1, ach.goal)) * 100));
  const pinDisabled = !isPinned && !canPinMore;

  const pinButton = (
    <button
      type="button"
      disabled={pinDisabled}
      aria-label={isPinned ? `Bỏ ghim ${ach.name}` : `Ghim ${ach.name}`}
      aria-pressed={isPinned}
      onClick={() => onTogglePin(ach.id)}
      className={cx(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center transition-colors focus-visible:outline-game-out",
        isPinned
          ? "bg-black/60 text-tone-focus bevel-sunken-1"
          : pinDisabled
            ? "pointer-events-none cursor-not-allowed text-tone-text/30"
            : "bg-black/40 text-tone-text/60 bevel-raised-1 hover:text-tone-focus",
      )}
    >
      <Icon name="star" size={16} />
    </button>
  );

  return (
    <div
      className={cx(
        "flex items-start gap-3 p-3 bevel-sunken-1",
        unlocked ? "bg-black/45" : "bg-black/25",
      )}
    >
      <div
        className={cx(
          "flex h-12 w-12 shrink-0 items-center justify-center bg-black/60 p-1 bevel-sunken-1",
          !unlocked && "grayscale opacity-45",
        )}
      >
        <GameIcon set={ach.iconSet} frame={ach.frame} size={32} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={cx("truncate font-heading text-sm font-bold", unlocked ? "text-tone-focus" : "text-tone-text/75")}>
              {ach.name}
            </div>
            <div className="text-xs text-tone-text/60">{ach.rarityPercent}% người chơi có</div>
          </div>

          {isMe && unlocked && (
            pinDisabled ? (
              <Tooltip content="Đã ghim đủ 3 — bỏ ghim một cái trước">
                <span tabIndex={0} className="inline-flex cursor-not-allowed">
                  {pinButton}
                </span>
              </Tooltip>
            ) : (
              <Tooltip content={isPinned ? "Bỏ ghim khỏi đầu trang" : "Ghim lên đầu trang"}>
                {pinButton}
              </Tooltip>
            )
          )}
        </div>

        <p className="text-xs text-tone-text/80">{ach.description}</p>

        {unlocked ? (
          <div className="text-xs font-medium text-success-on-dark">Đạt ngày {ach.achievedAt}</div>
        ) : (
          <div className="mt-0.5 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <ProgressBar value={pct} label={ach.name} variant="default" />
            </div>
            <span className="shrink-0 text-xs tabular text-tone-text/70">
              {ach.progress}/{ach.goal}
            </span>
          </div>
        )}

        {ach.reward && (
          <div className="text-xs text-tone-state">Thưởng: {ach.reward}</div>
        )}
      </div>
    </div>
  );
}

/** T7 §3.5 — Tab Thành tựu (60 huy hiệu theo 5 nhóm, lọc & ghim tối đa 3). */
export function AchievementsTab({
  profile,
  isMe,
  onTogglePin,
}: {
  profile: ProfileData;
  isMe: boolean;
  onTogglePin: (id: string) => void;
}) {
  const idBase = useId();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  const unlockedCount = useMemo(
    () => profile.achievements.filter((a) => Boolean(a.achievedAt)).length,
    [profile.achievements],
  );

  const grouped = useMemo(() => {
    const groupsToShow = groupFilter === "all" ? GROUP_ORDER : [groupFilter];
    return groupsToShow
      .map((g) => {
        const items = profile.achievements.filter((a) => {
          if (a.group !== g) return false;
          if (statusFilter === "unlocked" && !a.achievedAt) return false;
          if (statusFilter === "locked" && a.achievedAt) return false;
          return true;
        });
        return { group: g, label: ACHIEVEMENT_GROUP_LABELS[g], items };
      })
      .filter((sec) => sec.items.length > 0);
  }, [profile.achievements, statusFilter, groupFilter]);

  const canPinMore = profile.pinnedIds.length < MAX_PINNED;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/35 px-3 py-2.5 bevel-sunken-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-heading text-md font-bold tabular text-tone-focus">
            Đã đạt {unlockedCount}/{profile.achievements.length}
          </span>
          {isMe && (
            <span className="text-xs text-tone-text/70">
              Đã ghim {profile.pinnedIds.length}/{MAX_PINNED} lên đầu trang
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            variant="segmented"
            label="Lọc trạng thái thành tựu"
            idBase={idBase}
            items={[
              { value: "all", label: "Tất cả" },
              { value: "unlocked", label: "Đã đạt" },
              { value: "locked", label: "Chưa đạt" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="w-40">
            <Select
              aria-label="Lọc nhóm thành tựu"
              value={groupFilter}
              onChange={(v) => setGroupFilter(v as GroupFilter)}
              options={GROUP_OPTIONS}
            />
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-black/35 bevel-sunken-1">
          <EmptyState
            title="Không có thành tựu nào"
            description="Thử đổi bộ lọc trạng thái hoặc nhóm để xem thêm."
            art={{ set: "building:greek", frame: 4 }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map((sec) => (
            <section key={sec.group} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
                  {sec.label}
                </h3>
                <span className="text-xs tabular text-tone-text/65">{sec.items.length} huy hiệu</span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sec.items.map((ach) => (
                  <AchievementCard
                    key={ach.id}
                    ach={ach}
                    isMe={isMe}
                    isPinned={profile.pinnedIds.includes(ach.id)}
                    canPinMore={canPinMore}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

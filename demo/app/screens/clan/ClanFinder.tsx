import { useMemo, useState } from "react";
import {
  Button, Dialog, EmptyState, FormField, Icon, ListRow, SearchBar, Select,
  Textarea, Tooltip, cx, type Player,
} from "../../../../components";
import {
  canJoinOrApply, CLAN_MAX_MEMBERS, RANK_TIERS, RECRUIT_LABEL,
  type Clan, type ClanInvite, type RankTier, type RecruitMode,
} from "../../clanMock";
import { ClanEmblemBadge } from "./ClanEmblemBadge";

type RecruitFilter = "all" | RecruitMode;
type RankFilter = "all" | "none" | RankTier;

const MSG_MAX = 140;

const RECRUIT_FILTER_OPTIONS: { value: RecruitFilter; label: string }[] = [
  { value: "all", label: "Tất cả cách nhận" },
  { value: "open", label: RECRUIT_LABEL.open },
  { value: "approval", label: RECRUIT_LABEL.approval },
  { value: "closed", label: RECRUIT_LABEL.closed },
];

const RANK_FILTER_OPTIONS: { value: RankFilter; label: string }[] = [
  { value: "all", label: "Tất cả hạng" },
  { value: "none", label: "Không yêu cầu" },
  ...RANK_TIERS.map((r) => ({ value: r, label: `${r} trở lên` })),
];

/** T11 §3.2 — Màn Tìm clan (khi người chơi chưa thuộc clan nào). */
export function ClanFinder({
  me,
  clans,
  invites,
  appliedTags,
  onOpenClan,
  onJoinOpenClan,
  onApplyClan,
  onCancelApplication,
  onAcceptInvite,
  onDeclineInvite,
  onOpenCreate,
}: {
  me: Player;
  clans: Clan[];
  invites: ClanInvite[];
  appliedTags: Set<string>;
  onOpenClan: (tag: string) => void;
  onJoinOpenClan: (clan: Clan) => void;
  onApplyClan: (clan: Clan, message: string) => void;
  onCancelApplication: (clan: Clan) => void;
  onAcceptInvite: (invite: ClanInvite) => void;
  onDeclineInvite: (invite: ClanInvite) => void;
  onOpenCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [recruitFilter, setRecruitFilter] = useState<RecruitFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [applyTarget, setApplyTarget] = useState<Clan | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return clans.filter((c) => {
      if (normalized) {
        const hit =
          c.name.toLowerCase().includes(normalized) ||
          c.tag.toLowerCase().includes(normalized);
        if (!hit) return false;
      }
      if (recruitFilter !== "all" && c.recruit !== recruitFilter) return false;
      if (rankFilter === "none" && c.minRank) return false;
      if (rankFilter !== "all" && rankFilter !== "none" && c.minRank !== rankFilter) {
        return false;
      }
      return true;
    });
  }, [clans, normalized, recruitFilter, rankFilter]);

  const clearFilters = () => {
    setQuery("");
    setRecruitFilter("all");
    setRankFilter("all");
  };

  return (
    <div className="tone-screen flex h-full min-h-0 flex-col gap-3">
      {/* Top toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-black/55 px-4 py-3 bevel-raised">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64">
            <SearchBar
              label="Tìm clan"
              placeholder="Tìm tên hoặc thẻ clan…"
              onSearch={(q) => setQuery(q)}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Lọc cách nhận người"
              value={recruitFilter}
              onChange={(v) => setRecruitFilter(v as RecruitFilter)}
              options={RECRUIT_FILTER_OPTIONS}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Lọc hạng tối thiểu"
              value={rankFilter}
              onChange={(v) => setRankFilter(v as RankFilter)}
              options={RANK_FILTER_OPTIONS}
            />
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Icon name="plus" size={16} />}
          onClick={onOpenCreate}
        >
          Tạo clan
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-black/55 p-4 bevel-raised">
        {/* Incoming clan invites (hidden when empty) */}
        {invites.length > 0 && (
          <section className="flex flex-col gap-2 bg-black/40 p-3 bevel-sunken-1">
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-tone-focus">
              Lời mời vào clan ({invites.length})
            </h2>
            <div className="flex flex-col gap-1.5">
              {invites.map((inv) => (
                <ListRow
                  key={inv.id}
                  size="md"
                  className="bg-black/35 bevel-sunken-1"
                  leading={<ClanEmblemBadge emblem={inv.emblem} size="sm" />}
                  trailing={
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onDeclineInvite(inv)}>
                        Từ chối
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => onAcceptInvite(inv)}>
                        Đồng ý
                      </Button>
                    </div>
                  }
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenClan(inv.clanTag)}
                      className="font-heading text-sm font-bold text-tone-focus hover:underline"
                    >
                      [{inv.clanTag}] {inv.clanName}
                    </button>
                    <span className="text-xs text-tone-text/65">· {inv.at}</span>
                  </div>
                  <div className="text-xs text-tone-text/75">
                    Người mời: {inv.inviterName}
                  </div>
                </ListRow>
              ))}
            </div>
          </section>
        )}

        {/* Clan table */}
        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center bg-black/35 bevel-sunken-1">
            <EmptyState
              title="Không tìm thấy clan phù hợp"
              description="Không có clan nào khớp với từ khóa hoặc bộ lọc hiện tại."
              art={{ set: "building:greek", frame: 4 }}
              action={{ label: "Xoá lọc", onClick: clearFilters }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto bg-black/35 bevel-sunken-1">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-black/40 text-xs uppercase tracking-wider text-tone-text/65">
                  <th className="px-3 py-2.5 font-semibold">Biểu tượng</th>
                  <th className="px-3 py-2.5 font-semibold">Thẻ</th>
                  <th className="px-3 py-2.5 font-semibold">Tên clan</th>
                  <th className="px-3 py-2.5 font-semibold">Thành viên</th>
                  <th className="px-3 py-2.5 font-semibold">Hạng tối thiểu</th>
                  <th className="px-3 py-2.5 font-semibold">Cách nhận người</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((c) => {
                  const check = canJoinOrApply(c, me.rank);
                  const isApplied = appliedTags.has(c.tag);
                  const isFull = c.members.length >= CLAN_MAX_MEMBERS;

                  let actionNode: React.ReactNode;
                  if (isApplied) {
                    actionNode = (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs font-semibold text-success-on-dark">Đã gửi đơn</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelApplication(c);
                          }}
                        >
                          Huỷ đơn
                        </Button>
                      </div>
                    );
                  } else if (!check.allowed) {
                    actionNode = (
                      <Tooltip content={check.reason ?? "Không thể tham gia"}>
                        <span
                          tabIndex={0}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex cursor-not-allowed"
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled
                            className="pointer-events-none"
                          >
                            {c.recruit === "open" ? "Vào clan" : c.recruit === "closed" ? "Đóng" : "Xin vào"}
                          </Button>
                        </span>
                      </Tooltip>
                    );
                  } else if (c.recruit === "open") {
                    actionNode = (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinOpenClan(c);
                        }}
                      >
                        Vào clan
                      </Button>
                    );
                  } else {
                    actionNode = (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setApplyMessage("");
                          setApplyTarget(c);
                        }}
                      >
                        Xin vào
                      </Button>
                    );
                  }

                  return (
                    <tr
                      key={c.tag}
                      tabIndex={0}
                      onClick={() => onOpenClan(c.tag)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenClan(c.tag);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      <td className="px-3 py-2">
                        <ClanEmblemBadge emblem={c.emblem} size="sm" />
                      </td>
                      <td className="px-3 py-2 font-heading font-bold text-tone-focus">
                        [{c.tag}]
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-tone-text">{c.name}</div>
                        <div className="max-w-md truncate text-xs text-tone-text/65">{c.bio}</div>
                      </td>
                      <td
                        className={cx(
                          "px-3 py-2 tabular font-semibold",
                          isFull ? "text-danger-on-dark" : "text-tone-text",
                        )}
                      >
                        {c.members.length}/{CLAN_MAX_MEMBERS}
                      </td>
                      <td className="px-3 py-2 text-tone-text/85">
                        {c.minRank ? `${c.minRank} trở lên` : "Không yêu cầu"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cx(
                            "inline-block px-2 py-0.5 text-xs bevel-sunken-1",
                            c.recruit === "open"
                              ? "bg-black/45 text-success-on-dark"
                              : c.recruit === "approval"
                                ? "bg-black/45 text-tone-focus"
                                : "bg-black/35 text-tone-text/65",
                          )}
                        >
                          {RECRUIT_LABEL[c.recruit]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">{actionNode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply dialog (message <= 140 chars) */}
      {applyTarget && (
        <Dialog
          title={`Xin vào [${applyTarget.tag}] ${applyTarget.name}`}
          size="sm"
          onClose={() => setApplyTarget(null)}
          onSubmit={(e) => {
            e.preventDefault();
            onApplyClan(applyTarget, applyMessage.trim());
            setApplyTarget(null);
          }}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setApplyTarget(null)}>
                Huỷ
              </Button>
              <Button type="submit" variant="primary">
                Gửi đơn
              </Button>
            </>
          }
        >
          <FormField label={`Lời nhắn gửi Trưởng/Phó (${applyMessage.length}/${MSG_MAX})`}>
            <Textarea
              value={applyMessage}
              rows={3}
              maxLength={MSG_MAX}
              placeholder="Giới thiệu ngắn về bạn hoặc khung giờ hay chơi…"
              onChange={(e) => setApplyMessage(e.target.value.slice(0, MSG_MAX))}
            />
          </FormField>
        </Dialog>
      )}
    </div>
  );
}


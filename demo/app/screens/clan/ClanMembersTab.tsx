import { useMemo, useState } from "react";
import {
  Avatar, Button, Dialog, Icon, SearchBar, Select, StatusDot, cx,
  type MenuEntry, type Player,
} from "../../../../components";
import {
  CLAN_MAX_DEPUTIES, type Clan, type ClanMember, type ClanRole,
} from "../../clanMock";
import { useProfile } from "../../profile";

type RoleFilter = "all" | ClanRole;
type SortKey = "role" | "name" | "contribution" | "joinedAt";

const ROLE_ORDER: Record<ClanRole, number> = {
  "Trưởng clan": 0,
  "Phó": 1,
  "Thành viên": 2,
};

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "Trưởng clan", label: "Trưởng clan" },
  { value: "Phó", label: "Phó" },
  { value: "Thành viên", label: "Thành viên" },
];

/** T11 §3.3 & §3.4 — Tab Thành viên Clan (sắp xếp, lọc vai, menu hành động theo quyền). */
export function ClanMembersTab({
  clan,
  me,
  myRole,
  onPromoteDeputy,
  onDemoteMember,
  onKickMember,
}: {
  clan: Clan;
  me: Player;
  myRole?: ClanRole;
  onPromoteDeputy: (member: ClanMember) => void;
  onDemoteMember: (member: ClanMember) => void;
  onKickMember: (member: ClanMember) => void;
}) {
  const profile = useProfile();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("role");
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    kind: "demote" | "kick";
    member: ClanMember;
  } | null>(null);

  const deputyCount = clan.members.filter((m) => m.role === "Phó").length;
  const q = query.trim().toLowerCase();

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc((a) => !a);
    } else {
      setSortBy(key);
      setSortAsc(key !== "contribution");
    }
  };

  const rows = useMemo(() => {
    const filtered = clan.members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (q && !m.player.name.toLowerCase().includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "role") {
        cmp = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
        if (cmp === 0) cmp = b.contribution - a.contribution;
      } else if (sortBy === "name") {
        cmp = a.player.name.localeCompare(b.player.name, "vi");
      } else if (sortBy === "contribution") {
        cmp = a.contribution - b.contribution;
      } else {
        cmp = a.joinedAt.localeCompare(b.joinedAt);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [clan.members, roleFilter, q, sortBy, sortAsc]);

  const buildExtraMenu = (m: ClanMember): MenuEntry[] => {
    if (!myRole || m.player.id === me.id) return [];
    const entries: MenuEntry[] = [];

    if (myRole === "Trưởng clan") {
      if (m.role === "Thành viên") {
        const deputyFull = deputyCount >= CLAN_MAX_DEPUTIES;
        entries.push({
          id: "promote",
          label: deputyFull ? `Thăng Phó (đủ ${CLAN_MAX_DEPUTIES} Phó)` : "Thăng Phó",
          icon: "crown",
          disabled: deputyFull,
          onSelect: () => onPromoteDeputy(m),
        });
      } else if (m.role === "Phó") {
        entries.push({
          id: "demote",
          label: "Giáng xuống Thành viên",
          icon: "minus",
          onSelect: () => setConfirmAction({ kind: "demote", member: m }),
        });
      }
      if (m.role !== "Trưởng clan") {
        entries.push({
          id: "kick",
          label: "Kích khỏi clan",
          icon: "close",
          danger: true,
          onSelect: () => setConfirmAction({ kind: "kick", member: m }),
        });
      }
    } else if (myRole === "Phó" && m.role === "Thành viên") {
      entries.push({
        id: "kick",
        label: "Kích khỏi clan",
        icon: "close",
        danger: true,
        onSelect: () => setConfirmAction({ kind: "kick", member: m }),
      });
    }

    return entries;
  };

  const sortIndicator = (key: SortKey) =>
    sortBy === key ? (sortAsc ? " ▲" : " ▼") : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64">
            <SearchBar
              label="Tìm thành viên"
              placeholder="Tìm tên thành viên…"
              onSearch={setQuery}
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Lọc theo vai"
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as RoleFilter)}
              options={ROLE_OPTIONS}
            />
          </div>
        </div>
        <span className="text-xs tabular text-tone-text/70">
          Hiển thị {rows.length}/{clan.members.length} thành viên
        </span>
      </div>

      <div className="overflow-x-auto bg-black/35 bevel-sunken-1">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 bg-black/40 text-xs uppercase tracking-wider text-tone-text/65">
              <th className="px-3 py-2.5">
                <button type="button" onClick={() => toggleSort("name")} className="font-semibold hover:text-tone-focus">
                  Thành viên{sortIndicator("name")}
                </button>
              </th>
              <th className="px-3 py-2.5">
                <button type="button" onClick={() => toggleSort("role")} className="font-semibold hover:text-tone-focus">
                  Vai trò{sortIndicator("role")}
                </button>
              </th>
              <th className="px-3 py-2.5 font-semibold">Hạng</th>
              <th className="px-3 py-2.5 text-right">
                <button type="button" onClick={() => toggleSort("contribution")} className="font-semibold hover:text-tone-focus">
                  Đóng góp{sortIndicator("contribution")}
                </button>
              </th>
              <th className="px-3 py-2.5">
                <button type="button" onClick={() => toggleSort("joinedAt")} className="font-semibold hover:text-tone-focus">
                  Ngày vào{sortIndicator("joinedAt")}
                </button>
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">Hoạt động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((m) => (
              <tr
                key={m.player.id}
                tabIndex={0}
                onClick={(e) => profile.open(m.player, e.currentTarget, buildExtraMenu(m))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    profile.open(m.player, e.currentTarget, buildExtraMenu(m));
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="xs" name={m.player.name} source={m.player.avatar} />
                    <StatusDot status={m.player.status} size={8} />
                    <span className="font-semibold text-tone-focus">{m.player.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs bevel-sunken-1",
                      m.role === "Trưởng clan"
                        ? "bg-black/60 font-bold text-tone-focus"
                        : m.role === "Phó"
                          ? "bg-black/45 font-semibold text-tone-state"
                          : "bg-black/30 text-tone-text/80",
                    )}
                  >
                    {m.role === "Trưởng clan" && <Icon name="crown" size={12} />}
                    <span>{m.role}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-tone-text/85">{m.player.rank ?? "—"}</td>
                <td className="px-3 py-2 text-right font-semibold tabular text-tone-text">
                  {m.contribution.toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-2 tabular text-tone-text/75">{m.joinedAt}</td>
                <td className="px-3 py-2 text-right text-xs text-tone-text/75">
                  <span className={m.lastOnline === "Đang online" ? "text-success-on-dark font-semibold" : undefined}>
                    {m.lastOnline}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmAction && (
        <Dialog
          title={confirmAction.kind === "kick" ? "Kích thành viên" : "Giáng chức"}
          size="sm"
          onClose={() => setConfirmAction(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirmAction.kind === "kick") onKickMember(confirmAction.member);
                  else onDemoteMember(confirmAction.member);
                  setConfirmAction(null);
                }}
              >
                Xác nhận
              </Button>
            </>
          }
        >
          <p className="text-sm text-tone-text/90">
            {confirmAction.kind === "kick"
              ? `Bạn có chắc muốn kích ${confirmAction.member.player.name} khỏi clan [${clan.tag}]?`
              : `Giáng ${confirmAction.member.player.name} từ Phó xuống Thành viên?`}
          </p>
        </Dialog>
      )}
    </div>
  );
}


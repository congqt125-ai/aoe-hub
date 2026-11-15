import { useEffect, useId, useMemo, useState } from "react";
import {
  Badge, Button, Checkbox, Dialog, EmptyState, Icon, ListRow, Select, Spinner, TabPanel, Tabs, Toast,
  type ChatMessageData, type IconName, type Player, type ToastData,
} from "../../../components";
import { MockCheck, MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import type { LobbyRoom } from "../lobbyMock";
import { useMentionTarget, useProfile } from "../profile";
import type { EnterMode } from "../roomMock";
import {
  applyMatchResult, buildTournamentMatchRoom, createInitialTournaments, drawTournamentBracket, formatCountdown,
  formatDateTimeShort, GAME_TYPE_LABEL, matchRoomOccupancy, PHASE_LABEL, populateMockMatches, resizeTeams,
  swapBracketTeams, TEAM_MAX_MEMBERS, teamDisplayName, teamNameById,
  type BracketSlotRef, type MatchGame, type Team, type Tournament, type TournamentMatch, type TournamentPhase,
} from "../tournamentMock";
import { Bracket, TournamentPodiumBanner } from "./Bracket";
import { MatchResultDialog } from "./MatchResultDialog";
import { ChatBox, LINE, PanelTitle } from "./panel";
import { TeamCard } from "./TeamCard";
import { TournamentSetupDialog, type TournamentSetupData } from "./TournamentSetupDialog";

type CenterTab = "teams" | "rules" | "bracket" | "history";

const PHASE_ORDER: TournamentPhase[] = ["draft", "registration", "drawing", "playing", "finished"];

const PHASE_ICON: Record<TournamentPhase, { name: IconName; className: string }> = {
  draft: { name: "eye-off", className: "text-warning-on-dark" },
  registration: { name: "pen", className: "text-tone-focus" },
  drawing: { name: "refresh", className: "text-tone-focus" },
  playing: { name: "swords", className: "text-danger-on-dark" },
  finished: { name: "check", className: "text-success-on-dark" },
};

const MOCK_PHASE_OPTIONS: { value: TournamentPhase; label: string }[] = [
  { value: "draft", label: "Nháp" },
  { value: "registration", label: "Đăng ký" },
  { value: "drawing", label: "Xếp đội" },
  { value: "playing", label: "Thi đấu" },
  { value: "finished", label: "Kết thúc" },
];

const ROLE_OPTIONS: { value: "player" | "qtv"; label: string }[] = [
  { value: "player", label: "Người chơi" },
  { value: "qtv", label: "QTV" },
];

const MAX_TEAMS_CHOICES: { value: "8" | "16"; label: string }[] = [
  { value: "8", label: "8 đội" },
  { value: "16", label: "16 đội" },
];

function sysMsg(text: string): ChatMessageData {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: "system",
    text,
    at: new Date().toISOString(),
  };
}

function PhaseStepper({ phase, drawAt }: { phase: TournamentPhase; drawAt: string }) {
  const steps: { id: TournamentPhase; label: string; sub?: string }[] = [
    ...(phase === "draft" ? [{ id: "draft" as const, label: "Nháp" }] : []),
    { id: "registration", label: "Đăng ký" },
    { id: "drawing", label: "Xếp đội", sub: formatDateTimeShort(drawAt) },
    { id: "playing", label: "Thi đấu" },
    { id: "finished", label: "Kết thúc" },
  ];
  const order: TournamentPhase[] = ["draft", "registration", "drawing", "playing", "finished"];
  const currentIdx = order.indexOf(phase);

  return (
    <nav aria-label="Tiến trình giải đấu" className="flex items-center gap-2 bg-black/30 px-3 py-1.5">
      {steps.map((step, i) => {
        const stepIdx = order.indexOf(step.id);
        const done = stepIdx < currentIdx;
        const active = stepIdx === currentIdx;
        return (
          <div key={step.id} className="flex min-w-0 items-center gap-2">
            {i > 0 && <div className={`h-px w-6 shrink-0 ${done ? "bg-success" : "bg-white/20"}`} />}
            <div className="flex items-center gap-1.5 font-body text-xs">
              {done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/20 text-success-on-dark">
                  <Icon name="check" size={12} />
                </span>
              ) : active ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-tone-focus/20 text-tone-focus">
                  ●
                </span>
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-tone-text/45">
                  ○
                </span>
              )}
              <span className={active ? "font-bold text-tone-focus" : done ? "text-tone-state" : "text-tone-text/50"}>
                {step.label}
              </span>
              {step.sub && (
                <span className="text-tone-text/60">({step.sub})</span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * T5 — Giải đấu (§3.1–3.7).
 * Bố cục 3 cột: trái danh sách giải · giữa pha + đội / sơ đồ / lịch sử / luật · phải đội/trận của bạn + chat giải.
 */
export function TournamentScreen({
  me,
  moderator,
  onModerator,
  onEnterRoom,
}: {
  me: Player;
  moderator: boolean;
  onModerator: (on: boolean) => void;
  onEnterRoom?: (room: LobbyRoom, mode: EnterMode) => void;
}) {
  const profile = useProfile();
  const idBase = useId();

  const [fillPercent, setFillPercent] = useState(55);
  const [mockDonePercent, setMockDonePercent] = useState(50);
  const [mockHasLive, setMockHasLive] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>(() => createInitialTournaments(Date.now(), { me }));
  const [selectedId, setSelectedId] = useState<string>("cup-mua-thu");
  const [tab, setTab] = useState<CenterTab>("teams");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [setupOpen, setSetupOpen] = useState<"create" | "edit" | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState<Team | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [historyRoundFilter, setHistoryRoundFilter] = useState<string>("all");
  const [historyOnlyMine, setHistoryOnlyMine] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const [mention, setMention] = useState<{ text: string; id: number } | null>(null);
  useMentionTarget("chat giải", (text) => setMention({ text, id: Date.now() }));

  // Live 1s countdown ticker for registration phase.
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleTournaments = useMemo(
    () => tournaments.filter((t) => moderator || t.phase !== "draft"),
    [tournaments, moderator],
  );

  const selected = useMemo(
    () => visibleTournaments.find((t) => t.id === selectedId) ?? visibleTournaments[0],
    [visibleTournaments, selectedId],
  );

  // Prioritize selecting the rightmost tab when opening a tournament or switching phases.
  const isPostDraw = selected
    ? selected.phase === "drawing" || selected.phase === "playing" || selected.phase === "finished"
    : false;
  useEffect(() => {
    if (!selected) return;
    setTab(isPostDraw ? "bracket" : "teams");
  }, [selected?.id, isPostDraw]);

  const updateSelected = (updater: (t: Tournament) => Tournament) => {
    if (!selected) return;
    setTournaments((prev) => prev.map((t) => (t.id === selected.id ? updater(t) : t)));
  };

  const myTeam = useMemo(
    () => selected?.teams.find((tm) => tm.members.some((m) => m.id === me.id)) ?? null,
    [selected, me.id],
  );

  // ---- Team membership actions

  const leaveCurrentTeam = (t: Tournament): { next: Tournament; leftTeamName?: string } => {
    const oldTeam = t.teams.find((tm) => tm.members.some((m) => m.id === me.id));
    if (!oldTeam) return { next: t };

    const wasCaptain = oldTeam.members[0]?.id === me.id;
    const oldName = teamDisplayName(oldTeam);
    const remaining = oldTeam.members.filter((m) => m.id !== me.id);
    const notes: ChatMessageData[] = [];

    if (remaining.length === 0) {
      notes.push(sysMsg(`${me.name} đã rời ${oldName}. Đội trống và đặt lại tên Đội ${oldTeam.number}.`));
    } else if (wasCaptain) {
      notes.push(sysMsg(`${me.name} đã rời ${oldName}. Quyền đội trưởng chuyển cho ${remaining[0].name}.`));
    } else {
      notes.push(sysMsg(`${me.name} đã rời ${oldName}.`));
    }

    const teams = t.teams.map((tm) => {
      if (tm.id !== oldTeam.id) return tm;
      return {
        ...tm,
        customName: remaining.length === 0 ? undefined : tm.customName,
        members: remaining,
      };
    });

    return {
      next: { ...t, teams, chat: [...t.chat, ...notes] },
      leftTeamName: oldName,
    };
  };

  const joinTeam = (target: Team) => {
    updateSelected((t) => {
      if (t.phase !== "registration") return t;
      const { next } = leaveCurrentTeam(t);
      const freshTarget = next.teams.find((tm) => tm.id === target.id);
      if (!freshTarget || freshTarget.members.length >= TEAM_MAX_MEMBERS) return next;

      const becomesCaptain = freshTarget.members.length === 0;
      const targetName = teamDisplayName(freshTarget);
      const note = becomesCaptain
        ? sysMsg(`${me.name} đã vào ${targetName} và trở thành đội trưởng.`)
        : sysMsg(`${me.name} đã tham gia ${targetName}.`);

      return {
        ...next,
        teams: next.teams.map((tm) =>
          tm.id === target.id ? { ...tm, members: [...tm.members, me] } : tm,
        ),
        chat: [...next.chat, note],
      };
    });
  };

  const handleJoinOrSwitch = (target: Team) => {
    if (!selected || selected.phase !== "registration") return;
    if (myTeam && myTeam.id !== target.id) {
      setConfirmSwitch(target);
      return;
    }
    joinTeam(target);
  };

  const handleLeave = (tournamentId = selected?.id) => {
    if (!tournamentId) return;
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournamentId ? leaveCurrentTeam(t).next : t)),
    );
  };

  const handleRenameTeam = (teamId: string, nextName: string) => {
    updateSelected((t) => {
      const target = t.teams.find((tm) => tm.id === teamId);
      if (!target) return t;
      const prevName = teamDisplayName(target);
      return {
        ...t,
        teams: t.teams.map((tm) => (tm.id === teamId ? { ...tm, customName: nextName } : tm)),
        chat: [...t.chat, sysMsg(`${prevName} đổi tên thành "${nextName}".`)],
      };
    });
  };

  const handleKickMember = (teamId: string, member: Player) => {
    updateSelected((t) => {
      const target = t.teams.find((tm) => tm.id === teamId);
      if (!target) return t;
      const wasCaptain = target.members[0]?.id === member.id;
      const remaining = target.members.filter((m) => m.id !== member.id);
      const tName = teamDisplayName(target);
      const notes = [sysMsg(`QTV đã mời ${member.name} ra khỏi ${tName}.`)];
      if (wasCaptain && remaining.length > 0) {
        notes.push(sysMsg(`Quyền đội trưởng ${tName} chuyển cho ${remaining[0].name}.`));
      }
      return {
        ...t,
        teams: t.teams.map((tm) =>
          tm.id === teamId
            ? { ...tm, customName: remaining.length === 0 ? undefined : tm.customName, members: remaining }
            : tm,
        ),
        chat: [...t.chat, ...notes],
      };
    });
  };

  const handlePromoteCaptain = (teamId: string, member: Player) => {
    updateSelected((t) => {
      const target = t.teams.find((tm) => tm.id === teamId);
      if (!target) return t;
      const reordered = [member, ...target.members.filter((m) => m.id !== member.id)];
      return {
        ...t,
        teams: t.teams.map((tm) => (tm.id === teamId ? { ...tm, members: reordered } : tm)),
        chat: [...t.chat, sysMsg(`QTV đã đặt ${member.name} làm đội trưởng ${teamDisplayName(target)}.`)],
      };
    });
  };

  // ---- QTV Setup Dialog save

  const handleSaveTournament = (data: TournamentSetupData, mode: "draft" | "publish") => {
    if (setupOpen === "create") {
      const newId = `tour-${Date.now()}`;
      const phase: TournamentPhase = mode === "draft" ? "draft" : "registration";
      const created: Tournament = {
        id: newId,
        name: data.name,
        gameType: data.gameType,
        prize: data.prize,
        phase,
        maxTeams: data.maxTeams,
        minPerTeam: data.minPerTeam,
        boRegular: data.boRegular,
        boFinals: data.boFinals,
        drawAt: data.drawAt,
        startAt: data.startAt,
        roundGapDays: data.roundGapDays,
        rules: data.rules,
        teams: resizeTeams([], data.maxTeams),
        matches: [],
        chat: [sysMsg(phase === "draft" ? `QTV tạo bản nháp "${data.name}".` : `Giải đấu "${data.name}" đã chính thức mở đăng ký!`)],
      };
      setTournaments((prev) => [created, ...prev]);
      setSelectedId(newId);
      setSetupOpen(null);
      return;
    }

    if (setupOpen === "edit" && selected) {
      updateSelected((t) => {
        const nextPhase: TournamentPhase =
          t.phase === "draft" && mode === "publish" ? "registration" : t.phase;
        const scheduleOrRulesChanged = t.drawAt !== data.drawAt || t.rules !== data.rules || t.startAt !== data.startAt;
        const notes: ChatMessageData[] = [];
        if (t.phase === "draft" && nextPhase === "registration") {
          notes.push(sysMsg(`Giải đấu "${data.name}" đã được công bố và mở đăng ký!`));
        } else if (scheduleOrRulesChanged) {
          notes.push(sysMsg("QTV đã cập nhật lịch / luật giải đấu."));
        }
        return {
          ...t,
          name: data.name,
          gameType: data.gameType,
          prize: data.prize,
          phase: nextPhase,
          maxTeams: data.maxTeams,
          minPerTeam: data.minPerTeam,
          boRegular: data.boRegular,
          boFinals: data.boFinals,
          drawAt: data.drawAt,
          startAt: data.startAt,
          roundGapDays: data.roundGapDays,
          rules: data.rules,
          teams: resizeTeams(t.teams, data.maxTeams),
          chat: [...t.chat, ...notes],
        };
      });
      setSetupOpen(null);
    }
  };

  // ---- Draw & Match actions (§3.5 - §3.7)

  const handleLockAndDraw = () => {
    updateSelected((t) => {
      const res = drawTournamentBracket(t, Date.now());
      if (res.eligibleCount < 2) {
        setToast({
          id: "draw-err",
          kind: "warning",
          title: "Chưa đủ đội để lập sơ đồ",
          description: `Cần ít nhất 2 đội có từ ${t.minPerTeam} thành viên trở lên (hiện có ${res.eligibleCount} đội).`,
        });
        return t;
      }
      const note = `QTV đã chốt đội & bốc thăm nhánh: ${res.eligibleCount} đội vào nhánh${
        res.eliminatedCount > 0 ? `, ${res.eliminatedCount} đội bị loại vì thiếu người` : ""
      }${res.byeCount > 0 ? `, ${res.byeCount} suất miễn vòng 1` : ""}.`;
      return {
        ...res.tournament,
        phase: "drawing",
        chat: [...res.tournament.chat, sysMsg(note)],
      };
    });
    setTab("bracket");
  };

  const handleRedraw = () => {
    updateSelected((t) => {
      const res = drawTournamentBracket(t, Date.now() + Math.floor(Math.random() * 10000));
      return {
        ...res.tournament,
        chat: [...res.tournament.chat, sysMsg("QTV đã bốc thăm lại sơ đồ nhánh.")],
      };
    });
  };

  const handlePublishBracket = () => {
    updateSelected((t) => ({
      ...t,
      phase: "playing",
      chat: [...t.chat, sysMsg("QTV đã công bố sơ đồ đấu! Giải đấu chính thức bắt đầu.")],
    }));
    setTab("bracket");
  };

  const handleSaveMatchResult = (
    match: TournamentMatch,
    payload: { games: MatchGame[]; forfeit?: { winner: "A" | "B"; reason: string }; note?: string },
  ) => {
    updateSelected((t) => {
      const next = applyMatchResult(t, match.id, payload);
      const updated = next.matches.find((m) => m.id === match.id);
      const nameA = teamNameById(next.teams, match.teamAId) ?? "Đội A";
      const nameB = teamNameById(next.teams, match.teamBId) ?? "Đội B";
      const winName = teamNameById(next.teams, updated?.winnerId) ?? "";
      const msg = updated?.forfeit
        ? `Trận #${match.number} (${match.round}): Xử thắng cho ${winName} (${updated.forfeit.reason}).`
        : `Kết quả Trận #${match.number} (${match.round}): ${nameA} ${updated?.scoreA ?? 0}–${updated?.scoreB ?? 0} ${nameB}. ${winName} đi tiếp!`;
      const extra: ChatMessageData[] = [sysMsg(msg)];
      if (next.phase === "finished" && t.phase !== "finished") {
        extra.push(sysMsg(`Chúc mừng ${winName} đã vô địch giải đấu "${t.name}"!`));
      }
      return { ...next, chat: [...next.chat, ...extra] };
    });
    setActiveMatchId(null);
  };

  const handleMarkMatchLive = (match: TournamentMatch) => {
    updateSelected((t) => {
      const nameA = teamNameById(t.teams, match.teamAId) ?? "Đội A";
      const nameB = teamNameById(t.teams, match.teamBId) ?? "Đội B";
      return {
        ...t,
        matches: t.matches.map((m) => (m.id === match.id ? { ...m, status: "live" } : m)),
        chat: [...t.chat, sysMsg(`Trận #${match.number} (${nameA} vs ${nameB}) đang diễn ra!`)],
      };
    });
  };

  const handleSwapBracketTeams = (from: BracketSlotRef, to: BracketSlotRef) => {
    updateSelected((t) => {
      const next = swapBracketTeams(t, from, to);
      if (next === t) return t;
      return {
        ...next,
        chat: [...next.chat, sysMsg("QTV đã điều chỉnh vị trí đội trong sơ đồ đấu.")],
      };
    });
  };

  const handleEnterMatchRoom = (tournament: Tournament, match: TournamentMatch, mode: EnterMode) => {
    const room = buildTournamentMatchRoom(tournament, match);
    if (onEnterRoom) {
      onEnterRoom(room, mode);
      return;
    }
    setToast({
      id: `room-${match.id}`,
      kind: "info",
      title: mode === "watch" ? "Chế độ xem trận" : "Vào phòng đấu",
      description: `Đang mở phòng #${room.code} (${room.name}).`,
    });
  };

  const myActiveMatches = useMemo(() => {
    const list: { tournament: Tournament; team: Team; match: TournamentMatch }[] = [];
    for (const t of visibleTournaments) {
      if (t.phase !== "playing" && t.phase !== "drawing") continue;
      const tm = t.teams.find((team) => team.members.some((m) => m.id === me.id));
      if (!tm) continue;
      for (const m of t.matches) {
        if ((m.status === "live" || m.status === "upcoming") && (m.teamAId === tm.id || m.teamBId === tm.id)) {
          list.push({ tournament: t, team: tm, match: m });
        }
      }
    }
    return list.sort((a, b) => {
      if (a.match.status === "live" && b.match.status !== "live") return -1;
      if (b.match.status === "live" && a.match.status !== "live") return 1;
      return new Date(a.match.scheduledAt).getTime() - new Date(b.match.scheduledAt).getTime();
    });
  }, [visibleTournaments, me.id]);

  const myTeamsAcrossTournaments = useMemo(() => {
    const list: { tournament: Tournament; team: Team }[] = [];
    for (const t of visibleTournaments) {
      const tm = t.teams.find((team) => team.members.some((m) => m.id === me.id));
      if (tm) list.push({ tournament: t, team: tm });
    }
    return list;
  }, [visibleTournaments, me.id]);

  if (!selected) return null;

  const activeMatch = activeMatchId
    ? selected.matches.find((m) => m.id === activeMatchId) ?? null
    : null;

  const roundFilterOptions = [
    { value: "all", label: "Tất cả các vòng" },
    ...Array.from(new Set(selected.matches.map((m) => m.round))).map((r) => ({ value: r, label: r })),
  ];

  const historyMatches = selected.matches
    .filter((m) => m.status === "done" || m.status === "forfeit")
    .filter((m) => historyRoundFilter === "all" || m.round === historyRoundFilter)
    .filter((m) => !historyOnlyMine || (!!myTeam && (m.teamAId === myTeam.id || m.teamBId === myTeam.id)))
    .sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tb - ta || b.number - a.number;
    });

  const canEditSelected = moderator && (selected.phase === "draft" || selected.phase === "registration");
  const teamsLocked = selected.phase !== "registration";
  const tabItems = isPostDraw
    ? [
        { value: "rules" as const, label: "Luật" },
        { value: "teams" as const, label: "Đội" },
        { value: "history" as const, label: "Lịch sử đấu" },
        { value: "bracket" as const, label: "Sơ đồ đấu" },
      ]
    : [
        { value: "rules" as const, label: "Luật" },
        { value: "teams" as const, label: "Đội" },
      ];

  const myTeamMockState: "none" | "member" | "captain" = !myTeam
    ? "none"
    : myTeam.members[0]?.id === me.id
      ? "captain"
      : "member";

  const applyMyTeamPreset = (preset: "none" | "member" | "captain") => {
    updateSelected((t) => {
      const { next } = leaveCurrentTeam(t);
      if (preset === "none") return next;
      const first = next.teams[0];
      if (!first) return next;
      const withoutMe = first.members.filter((m) => m.id !== me.id).slice(0, TEAM_MAX_MEMBERS - 1);
      const members = preset === "captain" ? [me, ...withoutMe] : [...withoutMe, me];
      return {
        ...next,
        teams: next.teams.map((tm, idx) => (idx === 0 ? { ...tm, members } : tm)),
      };
    });
  };

  return (
    <div className="tone-screen flex h-full min-h-0 gap-2">
      {/* Left column (240px): Tournament list grouped by phase */}
      <aside aria-label="Danh sách giải đấu" className="flex w-[240px] shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised">
        <PanelTitle
          trailing={
            moderator ? (
              <Button size="sm" variant="primary" onClick={() => setSetupOpen("create")}>
                + Tạo
              </Button>
            ) : undefined
          }
        >
          Giải đấu
        </PanelTitle>
        <div className={`h-px shrink-0 ${LINE}`} />

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {PHASE_ORDER.flatMap((phase) => visibleTournaments.filter((t) => t.phase === phase)).map((t) => {
            const activeCount = t.teams.filter((tm) => tm.members.length > 0).length;
            const statusIcon = PHASE_ICON[t.phase];
            return (
              <ListRow
                key={t.id}
                role="button"
                tabIndex={0}
                selected={t.id === selected.id}
                onClick={() => setSelectedId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(t.id);
                  }
                }}
                trailing={
                  <span className="flex items-center" title={PHASE_LABEL[t.phase]}>
                    <Icon
                      name={statusIcon.name}
                      size={16}
                      label={PHASE_LABEL[t.phase]}
                      className={statusIcon.className}
                    />
                  </span>
                }
                className="px-3 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-semibold text-tone-state">{t.name}</div>
                  <div className="truncate font-body text-xs text-tone-text/70">
                    {GAME_TYPE_LABEL[t.gameType]} · {activeCount}/{t.maxTeams} đội
                  </div>
                </div>
              </ListRow>
            );
          })}
        </div>
      </aside>

      {/* Center column: Header, PhaseStepper, Tabs, Teams / Rules */}
      <section aria-label={selected.name} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black/55 bevel-raised">
        {/* Header band */}
        <header className="flex shrink-0 items-center justify-between gap-3 bg-black/25 px-3 py-2 text-shadow-game">
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon name="trophy" size={20} className="shrink-0 text-tone-focus" />
            <h1 className="m-0 truncate font-heading text-lg font-semibold text-tone-state">{selected.name}</h1>
            <Badge variant="rank">{GAME_TYPE_LABEL[selected.gameType]}</Badge>
            <span className="flex items-center gap-1 font-body text-sm font-semibold text-tone-focus">
              {selected.prize}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {selected.phase === "registration" ? (
              <span className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 font-body text-xs text-tone-text bevel-sunken-1">
                <Icon name="clock" size={12} className="text-tone-focus" />
                <span>Xếp đội sau {formatCountdown(selected.drawAt, nowMs)}</span>
              </span>
            ) : (
              <span
                className={`inline-flex h-[18px] shrink-0 items-center px-1.5 font-heading text-xs font-semibold leading-none ${
                  selected.phase === "playing"
                    ? "bg-success text-success-on"
                    : selected.phase === "draft"
                      ? "bg-warning text-warning-on"
                      : "bg-black/70 text-tone-text bevel-flat"
                }`}
              >
                {PHASE_LABEL[selected.phase]}
              </span>
            )}

            {canEditSelected && (
              <Button size="sm" onClick={() => setSetupOpen("edit")}>
                Sửa giải
              </Button>
            )}
            {moderator && selected.phase === "registration" && (
              <Button size="sm" variant="primary" onClick={handleLockAndDraw}>
                Chốt đội & lập sơ đồ
              </Button>
            )}
            {moderator && selected.phase === "drawing" && (
              <>
                <Button size="sm" onClick={handleRedraw}>
                  Bốc lại
                </Button>
                <Button size="sm" variant="primary" onClick={handlePublishBracket}>
                  Công bố sơ đồ
                </Button>
              </>
            )}
            {moderator && selected.phase === "draft" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  updateSelected((t) => ({
                    ...t,
                    phase: "registration",
                    chat: [...t.chat, sysMsg(`Giải đấu "${t.name}" đã được công bố và mở đăng ký!`)],
                  }))
                }
              >
                Công bố
              </Button>
            )}
          </div>
        </header>
        <div className={`h-px shrink-0 ${LINE}`} />

        {/* 3.1 PhaseStepper */}
        <PhaseStepper phase={selected.phase} drawAt={selected.drawAt} />
        <div className={`h-px shrink-0 ${LINE}`} />

        {/* Tabs + current user team bar */}
        <div className="flex shrink-0 items-center justify-between gap-2 bg-black/20 px-3 py-1.5">
          <Tabs
            label="Nội dung giải đấu"
            idBase={idBase}
            items={tabItems}
            value={tab}
            onChange={setTab}
          />

          <div className="flex items-center gap-2 font-body text-xs text-tone-text/80">
            {selected.phase === "registration" ? (
              myTeam ? (
                <>
                  <span>
                    Bạn: <strong className="text-tone-focus">{teamDisplayName(myTeam)}</strong>
                  </span>
                  <Button size="sm" onClick={() => handleLeave()}>
                    Rời đội
                  </Button>
                </>
              ) : (
                <span className="text-tone-text/70">Bạn chưa vào đội nào — bấm một đội để tham gia</span>
              )
            ) : (
              <span className="text-tone-text/70">
                {selected.phase === "draft" ? "Bản nháp — chỉ QTV nhìn thấy" : "Đội đã khoá sau ngày xếp đội"}
              </span>
            )}
          </div>
        </div>
        <div className={`h-px shrink-0 ${LINE}`} />

        {/* Tab body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "teams" && (
          <TabPanel value="teams" idBase={idBase} className="p-2.5">
            <div className="grid grid-cols-4 gap-2.5">
              {selected.teams.map((team) => {
                const takenNames = new Set(
                  selected.teams
                    .filter((other) => other.id !== team.id)
                    .map((other) => teamDisplayName(other).toLowerCase()),
                );
                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    me={me}
                    myTeamId={myTeam?.id ?? null}
                    locked={teamsLocked}
                    moderator={moderator}
                    takenNames={takenNames}
                    onJoinOrSwitch={handleJoinOrSwitch}
                    onRename={handleRenameTeam}
                    onKickMember={handleKickMember}
                    onPromoteCaptain={handlePromoteCaptain}
                  />
                );
              })}
            </div>
          </TabPanel>
          )}

          {tab === "rules" && (
          <TabPanel value="rules" idBase={idBase} className="p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
              <div className="bg-black/45 p-4 bevel-sunken">
                <h2 className="m-0 mb-2 font-heading text-base font-semibold text-tone-state">
                  Điều lệ & Luật giải đấu
                </h2>
                <p className="m-0 whitespace-pre-wrap font-body text-sm leading-relaxed text-tone-text">
                  {selected.rules}
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-black/45 p-4 bevel-sunken">
                <h2 className="m-0 mb-1 font-heading text-base font-semibold text-tone-state">
                  Tóm tắt thể thức
                </h2>
                <dl className="m-0 flex flex-col gap-2 font-body text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Thể thức</dt>
                    <dd className="m-0 font-semibold text-tone-state">Loại trực tiếp</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Thể loại</dt>
                    <dd className="m-0 font-semibold text-tone-state">{GAME_TYPE_LABEL[selected.gameType]}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Số đội tối đa</dt>
                    <dd className="m-0 tabular text-tone-state">{selected.maxTeams} đội</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Thành viên / đội</dt>
                    <dd className="m-0 tabular text-tone-state">{selected.minPerTeam}–{TEAM_MAX_MEMBERS} người</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Vòng thường</dt>
                    <dd className="m-0 font-semibold text-tone-state">Bo{selected.boRegular}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Bán kết / Chung kết</dt>
                    <dd className="m-0 font-semibold text-tone-state">Bo{selected.boFinals}</dd>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Ngày xếp đội</dt>
                    <dd className="m-0 tabular text-tone-focus">{formatDateTimeShort(selected.drawAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Vòng 1 bắt đầu</dt>
                    <dd className="m-0 tabular text-tone-state">{formatDateTimeShort(selected.startAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-tone-text/70">Khoảng cách vòng</dt>
                    <dd className="m-0 text-tone-state">{selected.roundGapDays} ngày</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabPanel>
          )}

          {tab === "bracket" && (
          <TabPanel value="bracket" idBase={idBase} className="p-4">
            {selected.phase === "drawing" && !moderator ? (
              <div className="flex h-72 flex-col items-center justify-center gap-3 bg-black/35 bevel-sunken-1">
                <Spinner size={24} />
                <p className="m-0 font-body text-md text-tone-text">Đang lập sơ đồ…</p>
              </div>
            ) : (
              <>
                {selected.phase === "finished" && <TournamentPodiumBanner tournament={selected} />}
                <Bracket
                  tournament={selected}
                  myTeamId={myTeam?.id}
                  moderator={moderator}
                  onSelectMatch={(m) => setActiveMatchId(m.id)}
                  onEnterRoom={(m, mode) => handleEnterMatchRoom(selected, m, mode)}
                  onSwapTeams={handleSwapBracketTeams}
                />
              </>
            )}
          </TabPanel>
          )}

          {tab === "history" && (
          <TabPanel value="history" idBase={idBase} className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-44">
                  <Select
                    aria-label="Lọc theo vòng"
                    size="sm"
                    options={roundFilterOptions}
                    value={historyRoundFilter}
                    onChange={setHistoryRoundFilter}
                  />
                </div>
                <Checkbox
                  label="Chỉ trận của tôi"
                  checked={historyOnlyMine}
                  onChange={(e) => setHistoryOnlyMine(e.target.checked)}
                />
              </div>
              <span className="font-body text-xs text-tone-text/70">
                {historyMatches.length} trận đã kết thúc
              </span>
            </div>

            {historyMatches.length === 0 ? (
              <EmptyState
                title="Chưa có trận nào kết thúc"
                description={
                  historyOnlyMine || historyRoundFilter !== "all"
                    ? "Không có trận nào khớp bộ lọc hiện tại."
                    : "Các trận sau khi nhập kết quả sẽ hiển thị tại đây."
                }
                art={{ set: "building:greek", frame: 4 }}
              />
            ) : (
              <div className="overflow-x-auto bg-black/45 bevel-sunken-1">
                <table className="w-full border-collapse text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-white/15 bg-black/35 font-heading text-xs uppercase text-tone-text/75">
                      <th className="px-3 py-2">Thời gian</th>
                      <th className="px-3 py-2">Vòng</th>
                      <th className="px-3 py-2 text-right">Đội A</th>
                      <th className="px-3 py-2 text-center">Tỉ số</th>
                      <th className="px-3 py-2">Đội B</th>
                      <th className="px-3 py-2">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyMatches.map((m) => {
                      const nameA = teamNameById(selected.teams, m.teamAId) ?? "Đội A";
                      const nameB = teamNameById(selected.teams, m.teamBId) ?? "Đội B";
                      const aWon = m.winnerId === m.teamAId;
                      const bWon = m.winnerId === m.teamBId;
                      const noteText = m.forfeit
                        ? `Xử thắng (${m.forfeit.reason})${m.note ? ` · ${m.note}` : ""}`
                        : m.note ?? "—";
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setActiveMatchId(m.id)}
                          className="cursor-pointer border-b border-white/10 hover:bg-white/5"
                        >
                          <td className="px-3 py-2 text-xs tabular text-tone-text/70">
                            {formatDateTimeShort(m.completedAt ?? m.scheduledAt)}
                          </td>
                          <td className="px-3 py-2 text-xs text-tone-state">{m.round}</td>
                          <td className={`px-3 py-2 text-right ${aWon ? "font-bold text-tone-focus" : "text-tone-text/70"}`}>
                            {nameA}
                          </td>
                          <td className="px-3 py-2 text-center font-heading font-bold tabular text-tone-state">
                            {m.scoreA} – {m.scoreB}
                          </td>
                          <td className={`px-3 py-2 ${bWon ? "font-bold text-tone-focus" : "text-tone-text/70"}`}>
                            {nameB}
                          </td>
                          <td className="px-3 py-2 text-xs text-tone-text/75">{noteText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabPanel>
          )}
        </div>
      </section>

      {/* Right column (360px): Your team / match + Tournament Chat */}
      <aside aria-label="Thông tin đội và chat giải" className="flex w-[360px] shrink-0 flex-col overflow-hidden bg-black/55 bevel-raised">
        <PanelTitle>{isPostDraw ? "Trận của bạn" : "Đội của bạn"}</PanelTitle>
        <div className={`h-px shrink-0 ${LINE}`} />

        <div className="shrink-0 bg-black/25 font-body text-sm">
          {isPostDraw ? (
            myActiveMatches.length > 0 ? (
              <div className="max-h-[240px] divide-y divide-white/10 overflow-y-auto">
                {myActiveMatches.map(({ tournament: t, team: tm, match: m }) => {
                  const opponentName =
                    teamNameById(t.teams, m.teamAId === tm.id ? m.teamBId : m.teamAId) ??
                    "Chờ kết quả vòng trước";
                  const occ = matchRoomOccupancy(t, m);
                  const canEnter = !!m.teamAId && !!m.teamBId;
                  return (
                    <div
                      key={`${t.id}-${m.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedId(t.id);
                        setActiveMatchId(m.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(t.id);
                          setActiveMatchId(m.id);
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:outline-game"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate font-heading text-xs font-semibold text-tone-focus">
                          <span className="truncate">
                            {t.name} · {m.round} · Trận #{m.number}
                          </span>
                          {m.status === "live" && (
                            <span className="shrink-0 font-body text-[11px] font-semibold text-success-on-dark">
                              ●
                            </span>
                          )}
                        </div>
                        <div className="truncate font-body text-xs text-tone-state">
                          Đối thủ: <strong>{opponentName}</strong>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!canEnter}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnterMatchRoom(t, m, "join");
                        }}
                      >
                        Vào phòng ({occ.players}/{occ.maxPlayers})
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : myTeam ? (
              <div className="flex flex-col gap-1 px-3 py-2.5">
                <span className="font-heading text-sm font-semibold text-tone-state">
                  {teamDisplayName(myTeam)}
                </span>
                <span className={`text-xs ${selected.phase === "finished" && !myTeam.eliminated ? "font-semibold text-tone-focus" : "text-tone-text/70"}`}>
                  {myTeam.eliminated
                    ? myTeam.eliminated.round
                      ? `Đã dừng bước ở ${myTeam.eliminated.round}.`
                      : myTeam.eliminated.reason
                    : selected.phase === "finished"
                      ? "Đã vô địch giải đấu!"
                      : "Chưa có lịch trận kế tiếp."}
                </span>
              </div>
            ) : (
              <p className="m-0 px-3 py-2.5 text-xs text-tone-text/70">
                Bạn không có trận đấu nào đang diễn ra hoặc sắp tới.
              </p>
            )
          ) : myTeamsAcrossTournaments.length > 0 ? (
            <div className="max-h-[240px] divide-y divide-white/10 overflow-y-auto">
              {myTeamsAcrossTournaments.map(({ tournament: t, team: tm }) => {
                const isCaptain = tm.members[0]?.id === me.id;
                const missing = Math.max(0, t.minPerTeam - tm.members.length);
                return (
                  <div
                    key={`${t.id}-${tm.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(t.id);
                      }
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:outline-game"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {isCaptain && (
                          <Icon name="crown" size={12} className="shrink-0 text-tone-focus" label="Đội trưởng" />
                        )}
                        <span className="truncate font-heading text-xs font-semibold text-tone-focus">
                          {t.name} · {teamDisplayName(tm)}
                        </span>
                      </div>
                      <div className="truncate font-body text-xs text-tone-text/75">
                        {tm.members.length}/{TEAM_MAX_MEMBERS} người ·{" "}
                        {tm.eliminated
                          ? tm.eliminated.round
                            ? `Dừng bước ở ${tm.eliminated.round}`
                            : tm.eliminated.reason
                          : t.phase === "finished"
                            ? "Đã vô địch!"
                            : missing > 0
                              ? `Thiếu ${missing} người`
                              : "Đủ điều kiện"}
                      </div>
                    </div>
                    {t.phase === "registration" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeave(t.id);
                        }}
                      >
                        Rời đội
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="m-0 px-3 py-2.5 text-xs text-tone-text/70">
              {selected.phase === "registration"
                ? "Bạn chưa tham gia đội nào. Chọn một thẻ đội ở giữa màn hình để vào hoặc tạo đội."
                : "Bạn không thuộc đội nào trong các giải đấu."}
            </p>
          )}
        </div>

        <div className={`h-px shrink-0 ${LINE}`} />

        <ChatBox
          title={`Chat giải · ${selected.name}`}
          messages={selected.chat}
          insert={mention}
          onAuthorClick={(author, anchor) => profile.open(author, anchor)}
          onSend={(text) =>
            updateSelected((t) => ({
              ...t,
              chat: [
                ...t.chat,
                { id: `me-${Date.now()}`, kind: "own", author: me, text, at: new Date().toISOString() },
              ],
            }))
          }
          className="min-h-0 flex-1"
        />
      </aside>

      {/* Switch team confirmation Dialog */}
      {confirmSwitch && myTeam && (
        <Dialog
          title={`Chuyển sang ${teamDisplayName(confirmSwitch)}?`}
          size="sm"
          onClose={() => setConfirmSwitch(null)}
          actions={
            <>
              <Button onClick={() => setConfirmSwitch(null)}>Huỷ</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const target = confirmSwitch;
                  setConfirmSwitch(null);
                  joinTeam(target);
                }}
              >
                Chuyển đội
              </Button>
            </>
          }
        >
          <p className="m-0 font-body text-sm text-tone-text">
            Bạn đang ở <strong>{teamDisplayName(myTeam)}</strong>. Chuyển sang{" "}
            <strong>{teamDisplayName(confirmSwitch)}</strong> sẽ tự động rời đội hiện tại.
            {myTeam.members[0]?.id === me.id && myTeam.members.length > 1 && (
              <> Quyền đội trưởng sẽ chuyển cho <strong>{myTeam.members[1].name}</strong>.</>
            )}
          </p>
        </Dialog>
      )}

      {/* QTV Create / Edit Tournament Dialog */}
      {setupOpen && (
        <TournamentSetupDialog
          editing={setupOpen === "edit" ? selected : undefined}
          onSave={handleSaveTournament}
          onClose={() => setSetupOpen(null)}
        />
      )}

      {/* Match detail / QTV result entry Dialog */}
      {activeMatch && (
        <MatchResultDialog
          tournament={selected}
          match={activeMatch}
          moderator={moderator}
          onSave={(payload) => handleSaveMatchResult(activeMatch, payload)}
          onMarkLive={() => handleMarkMatchLive(activeMatch)}
          onWatch={() => {
            setActiveMatchId(null);
            handleEnterMatchRoom(selected, activeMatch, "watch");
          }}
          onClose={() => setActiveMatchId(null)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-16 right-6 z-50">
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Review-only Mock Data panel */}
      <MockShell
        title="Dữ liệu giả — Giải đấu"
        onReset={() => {
          setFillPercent(55);
          setMockDonePercent(50);
          setMockHasLive(true);
          setTournaments(createInitialTournaments(Date.now(), { me }));
          setSelectedId("cup-mua-thu");
          setTab("teams");
        }}
      >
        <MockGroup>Pha giải đang chọn</MockGroup>
        <MockChoice
          label="Pha giải đấu"
          options={MOCK_PHASE_OPTIONS}
          value={selected.phase}
          onChange={(phase) =>
            updateSelected((t) => {
              if (phase === "draft" || phase === "registration") {
                return {
                  ...t,
                  phase,
                  teams: t.teams.map((tm) => ({ ...tm, eliminated: undefined })),
                  matches: [],
                };
              }
              if (phase === "drawing") {
                return { ...drawTournamentBracket(t, 777).tournament, phase: "drawing" };
              }
              if (phase === "playing") {
                return populateMockMatches({ ...t, phase: "playing" }, mockDonePercent, mockHasLive, 777);
              }
              return populateMockMatches({ ...t, phase: "finished" }, 100, false, 777);
            })
          }
        />

        <MockGroup>Vai trò</MockGroup>
        <MockChoice
          label="Vai trò"
          options={ROLE_OPTIONS}
          value={moderator ? "qtv" : "player"}
          onChange={(r) => onModerator(r === "qtv")}
        />

        <MockGroup>Đội của bạn (giải hiện tại)</MockGroup>
        <MockChoice
          label="Trạng thái đội"
          options={[
            { value: "none", label: "Chưa vào" },
            { value: "member", label: "Thành viên" },
            { value: "captain", label: "Đội trưởng" },
          ]}
          value={myTeamMockState}
          onChange={applyMyTeamPreset}
        />

        <MockGroup>Quy mô & lấp đầy</MockGroup>
        <MockChoice
          label="Số đội tối đa"
          options={MAX_TEAMS_CHOICES}
          value={String(selected.maxTeams) as "8" | "16"}
          onChange={(v) => {
            const nextMax = Number(v) as 8 | 16;
            updateSelected((t) => ({ ...t, maxTeams: nextMax, teams: resizeTeams(t.teams, nextMax) }));
          }}
        />
        <MockSlider
          label="Lấp đầy đội"
          value={fillPercent}
          min={0}
          max={100}
          step={5}
          unit="%"
          changed={fillPercent !== 55}
          onChange={(pct) => {
            setFillPercent(pct);
            setTournaments(createInitialTournaments(Date.now(), { maxTeams: selected.maxTeams, fillPercent: pct, me }));
          }}
        />
        <MockGroup>Sơ đồ & Trận đấu</MockGroup>
        <MockSlider
          label="Trận đã xong"
          value={mockDonePercent}
          min={0}
          max={100}
          step={10}
          unit="%"
          changed={mockDonePercent !== 50}
          onChange={(pct) => {
            setMockDonePercent(pct);
            if (selected.phase === "playing") {
              updateSelected((t) => populateMockMatches(t, pct, mockHasLive, 777));
            }
          }}
        />
        <MockCheck
          label="Có trận đang đấu"
          checked={mockHasLive}
          onChange={(on) => {
            setMockHasLive(on);
            if (selected.phase === "playing") {
              updateSelected((t) => populateMockMatches(t, mockDonePercent, on, 777));
            }
          }}
        />
      </MockShell>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Checkbox, Divider, GameIcon, Icon, Surface, cx } from "../../components";
import { CIVS, type CivInfo } from "../app/civs";
import type { Backdrop } from "./Story";

type MatchFormatId = "1v1" | "2v2" | "3v3" | "4v4";
type RollMode = "balanced" | "score" | "tiered" | "tierScore" | "pure";

const FORMATS: { id: MatchFormatId; label: string; teamA: number; teamB: number }[] = [
  { id: "1v1", label: "1 vs 1", teamA: 1, teamB: 1 },
  { id: "2v2", label: "2 vs 2", teamA: 2, teamB: 2 },
  { id: "3v3", label: "3 vs 3", teamA: 3, teamB: 3 },
  { id: "4v4", label: "4 vs 4", teamA: 4, teamB: 4 },
];

const ROLL_MODES: { id: RollMode; label: string; hint: string }[] = [
  { id: "balanced", label: "Cân kèo (Điểm + Lợi thế)", hint: "1v1 ≤5đ; 2v2 ≤10đ (ép đời, gỗ ≤1); 3v3 ≤10đ (ép đời, gỗ, chủ lực ≤1); 4v4 ≤10đ (ép đời, gỗ ≤1, chủ lực = nhau)." },
  { id: "score", label: "Bốc theo điểm (≤10đ)", hint: "Tổng điểm 2 đội chênh nhau tối đa 10 điểm, không ràng buộc tag lợi thế." },
  { id: "tiered", label: "Bốc theo Tier", hint: "Chia 4 nhóm điểm (Tier S 90–100, Tier A 80–85, Tier B 70–75, Tier C 65); mỗi cặp vị trí bốc cùng 1 tier." },
  { id: "tierScore", label: "Tier + Điểm (≤10đ)", hint: "Mỗi cặp vị trí bốc cùng 1 Tier, đồng thời tổng điểm 2 đội chênh tối đa 10 điểm." },
  { id: "pure", label: "Ngẫu nhiên thuần", hint: "Quay tự do hoàn toàn từ 16 quân." },
];

const BALANCE_TAGS = ["ép đời", "có cung", "quân gỗ", "mạnh đời 3", "chủ lực"] as const;

const TIERS: { name: string; civs: CivInfo[] }[] = [
  { name: "Tier S (90–100)", civs: CIVS.filter((c) => c.score >= 90) },
  { name: "Tier A (80–85)", civs: CIVS.filter((c) => c.score >= 80 && c.score <= 85) },
  { name: "Tier B (70–75)", civs: CIVS.filter((c) => c.score >= 70 && c.score <= 75) },
  { name: "Tier C (65)", civs: CIVS.filter((c) => c.score < 70) },
];

interface RollResult {
  id: string;
  format: MatchFormatId;
  mode: RollMode;
  teamA: CivInfo[];
  teamB: CivInfo[];
  at: string;
}

function pickRandomCiv(pool: CivInfo[]): CivInfo {
  return pool[Math.floor(Math.random() * pool.length)];
}

function drawTeam(count: number, pool: CivInfo[], uniqueInTeam: boolean): CivInfo[] {
  const available = [...pool];
  const picked: CivInfo[] = [];
  for (let i = 0; i < count; i++) {
    const source = uniqueInTeam && available.length > 0 ? available : pool;
    const civ = pickRandomCiv(source);
    picked.push(civ);
    if (uniqueInTeam) {
      const idx = available.findIndex((c) => c.id === civ.id);
      if (idx >= 0) available.splice(idx, 1);
    }
  }
  return picked;
}

function teamStats(team: CivInfo[]) {
  const total = team.reduce((sum, c) => sum + c.score, 0);
  const avg = team.length > 0 ? total / team.length : 0;
  const countAdv = (adv: string) => team.filter((c) => c.advantages.includes(adv)).length;
  const lowTierCount = team.filter((c) => c.score <= 65).length;
  return {
    total,
    avg,
    fastCastle: countAdv("ép đời"),
    archers: countAdv("có cung"),
    wood: countAdv("quân gỗ"),
    strong3: countAdv("mạnh đời 3"),
    carry: countAdv("chủ lực"),
    lowTierCount,
  };
}

function tagDiffBreakdown(teamA: CivInfo[], teamB: CivInfo[]) {
  let totalDiff = 0;
  let maxPerTagDiff = 0;
  let coreDiff = 0;
  for (const tag of BALANCE_TAGS) {
    const cA = teamA.filter((c) => c.advantages.includes(tag)).length;
    const cB = teamB.filter((c) => c.advantages.includes(tag)).length;
    const d = Math.abs(cA - cB);
    totalDiff += d;
    if (d > maxPerTagDiff) maxPerTagDiff = d;
    if (tag === "có cung" || tag === "chủ lực") coreDiff += d;
  }
  return { totalDiff, maxPerTagDiff, coreDiff };
}

function tagDiffCount(teamA: CivInfo[], teamB: CivInfo[]): number {
  return tagDiffBreakdown(teamA, teamB).totalDiff;
}

function countTeamOverlap(teamA: CivInfo[], teamB: CivInfo[]): number {
  const idsA = new Set(teamA.map((c) => c.id));
  return teamB.filter((c) => idsA.has(c.id)).length;
}

const MAX_SCORE_DIFF: Record<MatchFormatId, number> = {
  "1v1": 5,
  "2v2": 10,
  "3v3": 10,
  "4v4": 10,
};

function evaluateBalancedPenalty(formatId: MatchFormatId, teamA: CivInfo[], teamB: CivInfo[]): number {
  const sA = teamStats(teamA);
  const sB = teamStats(teamB);
  const overlap = countTeamOverlap(teamA, teamB);
  let penalty = overlap * 300;

  const maxScoreDiff = MAX_SCORE_DIFF[formatId];
  const scoreDiff = Math.abs(sA.total - sB.total);
  if (scoreDiff > maxScoreDiff) penalty += (scoreDiff - maxScoreDiff) * 20;
  penalty += scoreDiff;

  if (formatId === "1v1") {
    return penalty;
  }

  const fastDiff = Math.abs(sA.fastCastle - sB.fastCastle);
  const woodDiff = Math.abs(sA.wood - sB.wood);
  const carryDiff = Math.abs(sA.carry - sB.carry);

  if (fastDiff > 1) penalty += (fastDiff - 1) * 150;
  if (woodDiff > 1) penalty += (woodDiff - 1) * 150;
  if (formatId === "3v3" && carryDiff > 1) {
    penalty += (carryDiff - 1) * 150;
  } else if (formatId === "4v4" && carryDiff > 0) {
    penalty += carryDiff * 200;
  }

  return penalty;
}

function isAcceptableBalancedMatch(formatId: MatchFormatId, teamA: CivInfo[], teamB: CivInfo[]): boolean {
  if (countTeamOverlap(teamA, teamB) > 0) return false;
  const sA = teamStats(teamA);
  const sB = teamStats(teamB);
  const scoreDiff = Math.abs(sA.total - sB.total);

  if (scoreDiff > MAX_SCORE_DIFF[formatId]) return false;
  if (formatId === "1v1") return true;

  const fastDiff = Math.abs(sA.fastCastle - sB.fastCastle);
  const woodDiff = Math.abs(sA.wood - sB.wood);
  if (fastDiff > 1 || woodDiff > 1) return false;

  const carryDiff = Math.abs(sA.carry - sB.carry);
  if (formatId === "3v3" && carryDiff > 1) return false;
  if (formatId === "4v4" && carryDiff !== 0) return false;

  return true;
}

function rollTieredMatch(
  formatId: MatchFormatId,
  options: { uniqueInTeam: boolean; uniqueAcrossMatch: boolean },
): { teamA: CivInfo[]; teamB: CivInfo[] } {
  const fmt = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const usedA = new Set<string>();
  const usedAll = new Set<string>();

  const pickFromTier = (tierCivs: CivInfo[], exclude: Set<string>): CivInfo => {
    const filtered = tierCivs.filter((c) => !exclude.has(c.id));
    const source = filtered.length > 0 ? filtered : tierCivs;
    return pickRandomCiv(source);
  };

  const teamA: CivInfo[] = [];
  const teamB: CivInfo[] = [];
  // Shuffle tier order so 1v1 / 2v2 / 3v3 pick varied tiers.
  const shuffledTiers = [...TIERS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < fmt.teamA; i++) {
    const tier = shuffledTiers[i % shuffledTiers.length];
    const civA = pickFromTier(tier.civs, options.uniqueInTeam ? usedA : new Set());
    usedA.add(civA.id);
    usedAll.add(civA.id);
    teamA.push(civA);

    const exB = new Set<string>();
    if (options.uniqueInTeam) teamB.forEach((b) => exB.add(b.id));
    if (options.uniqueAcrossMatch) usedAll.forEach((id) => exB.add(id));
    const civB = pickFromTier(tier.civs, exB);
    usedAll.add(civB.id);
    teamB.push(civB);
  }

  return { teamA, teamB };
}

function rollMatch(
  formatId: MatchFormatId,
  mode: RollMode,
  options: { uniqueInTeam: boolean; uniqueAcrossMatch: boolean },
): { teamA: CivInfo[]; teamB: CivInfo[] } {
  if (mode === "tiered") {
    return rollTieredMatch(formatId, options);
  }

  if (mode === "tierScore") {
    let best: { teamA: CivInfo[]; teamB: CivInfo[]; penalty: number } | null = null;
    for (let i = 0; i < 3000; i++) {
      const { teamA, teamB } = rollTieredMatch(formatId, options);
      const scoreDiff = Math.abs(teamStats(teamA).total - teamStats(teamB).total);
      const overlap = countTeamOverlap(teamA, teamB);
      const penalty = (options.uniqueAcrossMatch ? overlap * 300 : 0) + scoreDiff;
      if (!best || penalty < best.penalty) {
        best = { teamA, teamB, penalty };
      }
      if ((!options.uniqueAcrossMatch || overlap === 0) && scoreDiff <= 10) break;
    }
    return { teamA: best!.teamA, teamB: best!.teamB };
  }

  const fmt = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const attempts = mode === "balanced" || mode === "score" ? 3000 : 1;
  let best: { teamA: CivInfo[]; teamB: CivInfo[]; penalty: number } | null = null;

  for (let i = 0; i < attempts; i++) {
    const teamA = drawTeam(fmt.teamA, CIVS, options.uniqueInTeam);
    const poolB = options.uniqueAcrossMatch
      ? CIVS.filter((c) => !teamA.some((a) => a.id === c.id))
      : CIVS;
    const teamB = drawTeam(fmt.teamB, poolB.length >= fmt.teamB ? poolB : CIVS, options.uniqueInTeam);

    let penalty = 0;
    let accepted = mode === "pure";
    if (mode === "balanced") {
      penalty = evaluateBalancedPenalty(formatId, teamA, teamB);
      accepted = isAcceptableBalancedMatch(formatId, teamA, teamB);
    } else if (mode === "score") {
      const scoreDiff = Math.abs(teamStats(teamA).total - teamStats(teamB).total);
      const overlap = countTeamOverlap(teamA, teamB);
      penalty = overlap * 300 + (scoreDiff > 10 ? (scoreDiff - 10) * 20 + scoreDiff : scoreDiff);
      accepted = (!options.uniqueAcrossMatch || overlap === 0) && scoreDiff <= 10;
    }

    if (!best || penalty < best.penalty) {
      best = { teamA, teamB, penalty };
    }
    if (accepted) break;
  }

  return { teamA: best!.teamA, teamB: best!.teamB };
}

function scoreTone(score: number): string {
  if (score >= 90) return "text-tone-focus";
  if (score >= 85) return "text-success-on-dark";
  if (score >= 70) return "text-tone-state";
  return "text-tone-text/70";
}

function TeamPanel({
  title,
  team,
  rolling,
}: {
  title: string;
  team: CivInfo[];
  rolling: boolean;
}) {
  const stats = teamStats(team);

  return (
    <div className="flex flex-col bg-black/55 bevel-raised-1">
      <div className="flex items-center justify-between gap-2 bg-black/35 px-3 py-2 text-shadow-game">
        <h4 className="m-0 font-heading text-base font-semibold text-tone-focus">{title}</h4>
        <div className="flex items-center gap-2 font-body text-xs text-tone-text/80">
          <span>
            Tổng: <strong className="tabular text-tone-state">{stats.total}</strong>
          </span>
          <span>·</span>
          <span>
            TB: <strong className="tabular text-tone-focus">{stats.avg.toFixed(1)}</strong>
          </span>
        </div>
      </div>

      {/* Advantage summary bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 bg-black/25 px-3 py-1 font-body text-[11px] text-tone-text/75">
        <span>Ép đời: <strong className="text-tone-state">{stats.fastCastle}</strong></span>
        <span>Có cung: <strong className="text-tone-state">{stats.archers}</strong></span>
        <span>Quân gỗ: <strong className="text-tone-state">{stats.wood}</strong></span>
        <span>Mạnh đời 3: <strong className="text-tone-state">{stats.strong3}</strong></span>
        <span>Chủ lực: <strong className="text-tone-state">{stats.carry}</strong></span>
      </div>
      <Divider />

      <ul className="m-0 flex list-none flex-col divide-y divide-white/10 p-0">
        {team.map((civ, idx) => (
          <li
            key={`${title}-${idx}`}
            className={cx(
              "flex items-center gap-3 px-3 py-2.5 transition-opacity",
              rolling && "opacity-70",
            )}
          >
            <span className="w-5 shrink-0 font-heading text-xs font-semibold tabular text-tone-text/55">
              #{idx + 1}
            </span>
            <GameIcon set={`building:${civ.style}`} frame={0} size={32} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-heading text-base font-semibold text-tone-state">
                  {civ.name}
                </span>
                <span className={cx("font-heading text-sm font-bold tabular", scoreTone(civ.score))}>
                  {civ.score}đ
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {civ.advantages.length > 0 ? (
                  civ.advantages.map((adv) => (
                    <Badge key={adv} variant="rank">
                      {adv}
                    </Badge>
                  ))
                ) : (
                  <span className="font-body text-xs italic text-tone-text/45">Không có lợi thế nổi bật</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CivRollerDemo({ backdrop }: { backdrop: Backdrop }) {
  const [format, setFormat] = useState<MatchFormatId>("4v4");
  const [mode, setMode] = useState<RollMode>("balanced");
  const [uniqueInTeam, setUniqueInTeam] = useState(true);
  const [uniqueAcrossMatch, setUniqueAcrossMatch] = useState(true);
  const [rolling, setRolling] = useState(false);

  const [current, setCurrent] = useState<{ teamA: CivInfo[]; teamB: CivInfo[] }>(() =>
    rollMatch("4v4", "balanced", { uniqueInTeam: true, uniqueAcrossMatch: true }),
  );
  const [history, setHistory] = useState<RollResult[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const triggerRoll = (fmt: MatchFormatId = format, nextMode: RollMode = mode) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRolling(true);
    let ticks = 0;
    timerRef.current = window.setInterval(() => {
      ticks += 1;
      const sample = rollMatch(fmt, nextMode, { uniqueInTeam, uniqueAcrossMatch });
      setCurrent(sample);
      if (ticks >= 6) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRolling(false);
        const now = new Date();
        const at = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        setHistory((prev) => [
          { id: `${Date.now()}-${Math.random()}`, format: fmt, mode: nextMode, ...sample, at },
          ...prev.slice(0, 9),
        ]);
      }
    }, 55);
  };

  const handleSelectFormat = (fmt: MatchFormatId) => {
    setFormat(fmt);
    triggerRoll(fmt, mode);
  };

  const handleSelectMode = (nextMode: RollMode) => {
    setMode(nextMode);
    triggerRoll(format, nextMode);
  };

  const statsA = teamStats(current.teamA);
  const statsB = teamStats(current.teamB);
  const avgDiff = Math.abs(statsA.avg - statsB.avg);
  const totalDiff = Math.abs(statsA.total - statsB.total);
  const tagDiff = tagDiffCount(current.teamA, current.teamB);

  const balanceVerdict =
    avgDiff <= 3
      ? "Rất cân kèo"
      : avgDiff <= 10
        ? "Khá cân"
        : statsA.avg > statsB.avg
          ? `Đội 1 nhỉnh hơn (+${avgDiff.toFixed(1)} TB)`
          : `Đội 2 nhỉnh hơn (+${avgDiff.toFixed(1)} TB)`;

  const activeModeInfo = ROLL_MODES.find((m) => m.id === mode);
  const wrapperClass =
    backdrop === "dialog" ? "bevel-raised p-5" : "bg-black/45 p-5 text-tone-text text-shadow-game";

  const content = (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 bg-black/35 p-3 bevel-sunken-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-xs font-semibold uppercase tracking-wide text-tone-text/75">
              Thể thức:
            </span>
            {FORMATS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={format === f.id ? "primary" : "secondary"}
                onClick={() => handleSelectFormat(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              label="Không trùng trong đội"
              checked={uniqueInTeam}
              onChange={(e) => setUniqueInTeam(e.target.checked)}
            />
            <Checkbox
              label="Không trùng cả 2 đội"
              checked={uniqueAcrossMatch}
              onChange={(e) => setUniqueAcrossMatch(e.target.checked)}
            />
          </div>

          <Button
            size="md"
            variant="primary"
            icon={<Icon name="refresh" size={16} />}
            loading={rolling}
            onClick={() => triggerRoll()}
          >
            Quay quân
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-xs font-semibold uppercase tracking-wide text-tone-text/75">
              Cơ chế:
            </span>
            {ROLL_MODES.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={mode === m.id ? "primary" : "secondary"}
                onClick={() => handleSelectMode(m.id)}
              >
                {m.label}
              </Button>
            ))}
          </div>
          {activeModeInfo && (
            <span className="font-body text-xs text-tone-text/70">{activeModeInfo.hint}</span>
          )}
        </div>
      </div>

      {/* Matchup comparison bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-black/45 px-4 py-2 font-body text-sm bevel-sunken-1">
        <span>
          Thể thức:{" "}
          <strong className="font-heading text-tone-focus">
            {FORMATS.find((f) => f.id === format)?.label}
          </strong>
          {" · "}
          <span className="text-xs text-tone-text/75">{activeModeInfo?.label}</span>
        </span>
        <span>
          Chênh tổng: <strong className="tabular text-tone-state">{totalDiff}đ</strong> · Chênh TB:{" "}
          <strong className="tabular text-tone-state">{avgDiff.toFixed(1)}đ</strong> · Tag lợi thế:{" "}
          <strong className={tagDiff === 0 ? "text-success-on-dark" : "text-warning-on-dark"}>
            {tagDiff === 0 ? "Bằng nhau" : `Lệch ${tagDiff}`}
          </strong>
        </span>
        <span className={cx("font-semibold", avgDiff <= 10 ? "text-success-on-dark" : "text-warning-on-dark")}>
          {balanceVerdict}
        </span>
      </div>

      {/* Team 1 vs Team 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamPanel title={`Đội 1 (${current.teamA.length} người)`} team={current.teamA} rolling={rolling} />
        <TeamPanel title={`Đội 2 (${current.teamB.length} người)`} team={current.teamB} rolling={rolling} />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-text/80">
              Lịch sử quay gần đây
            </h4>
            <Button size="sm" variant="ghost" onClick={() => setHistory([])}>
              Xoá lịch sử
            </Button>
          </div>
          <div className="divide-y divide-white/10 bg-black/40 bevel-sunken-1">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 font-body text-xs"
              >
                <span className="shrink-0 tabular text-tone-text/60">
                  {h.at} · <strong className="text-tone-focus">{FORMATS.find((f) => f.id === h.format)?.label}</strong>
                </span>
                <span className="min-w-0 flex-1 truncate text-tone-state">
                  {h.teamA.map((c) => c.name).join(", ")} <span className="text-tone-text/50">vs</span>{" "}
                  {h.teamB.map((c) => c.name).join(", ")}
                </span>
                <span className="shrink-0 tabular text-tone-text/75">
                  {teamStats(h.teamA).total}đ – {teamStats(h.teamB).total}đ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Civ Tier Table */}
      <div className="flex flex-col gap-2">
        <h4 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-text/80">
          Bảng điểm & lợi thế quân ({CIVS.length} quân)
        </h4>
        <div className="overflow-x-auto bg-black/45 bevel-sunken-1">
          <table className="w-full border-collapse text-left font-body text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-black/35 font-heading text-xs uppercase text-tone-text/75">
                <th className="px-3 py-2">Điểm</th>
                <th className="px-3 py-2">Quân</th>
                <th className="px-3 py-2">Lợi thế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {CIVS.map((civ) => (
                <tr key={civ.id} className="hover:bg-white/5">
                  <td className={cx("px-3 py-1.5 font-heading font-bold tabular", scoreTone(civ.score))}>
                    {civ.score}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <GameIcon set={`building:${civ.style}`} frame={0} size={20} />
                      <span className="font-semibold text-tone-state">{civ.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {civ.advantages.length > 0 ? (
                        civ.advantages.map((adv) => (
                          <Badge key={adv} variant="rank">
                            {adv}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-tone-text/45">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <section className="flex flex-col gap-2" aria-label="Quay quân ngẫu nhiên">
      <h3 className="m-0 flex items-baseline gap-2 font-heading text-lg font-semibold text-screen-state text-shadow-game">
        Quay quân AoE
        <span className="font-body text-xs font-normal text-screen-text/70">
          1 vs 1 · 1 vs 2 · 3 vs 3 · 4 vs 4
        </span>
      </h3>
      {backdrop === "dialog" ? (
        <Surface className={wrapperClass}>{content}</Surface>
      ) : (
        <div className={wrapperClass}>{content}</div>
      )}
    </section>
  );
}

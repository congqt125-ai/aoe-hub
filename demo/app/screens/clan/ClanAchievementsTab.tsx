import { useMemo } from "react";
import { EmptyState, Icon, StatBlock } from "../../../../components";
import type { Clan } from "../../clanMock";
import { hashString } from "../../profileMock";
import { createInitialTournaments, teamDisplayName } from "../../tournamentMock";

interface ClanTournamentRecord {
  id: string;
  name: string;
  teamName: string;
  dateLabel: string;
  result: string;
  isChampion?: boolean;
}

function PointsSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 360;
  const h = 72;
  const pad = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-20 w-full text-tone-focus"
      role="img"
      aria-label={`Biểu đồ điểm clan 12 tuần: thấp nhất ${min}, cao nhất ${max}`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

/** T11 §3.3 & §3.4 — Tab Thành tích Clan (lấy từ giải đấu, không có clan war). */
export function ClanAchievementsTab({ clan }: { clan: Clan }) {
  const tournaments = useMemo<ClanTournamentRecord[]>(() => {
    const rows: ClanTournamentRecord[] = [];
    const active = createInitialTournaments();
    const tagUpper = clan.tag.toUpperCase();

    for (const t of active) {
      const matched = t.teams.find((tm) =>
        teamDisplayName(tm).toUpperCase().includes(tagUpper),
      );
      if (!matched) continue;
      const d = new Date(t.startAt);
      const dateLabel = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      let result = "Đang đấu";
      let isChampion = false;
      if (t.phase === "finished") {
        const finalMatch = t.matches[t.matches.length - 1];
        if (finalMatch?.winnerId === matched.id) {
          result = "Vô địch";
          isChampion = true;
        } else if (
          finalMatch &&
          (finalMatch.teamAId === matched.id || finalMatch.teamBId === matched.id)
        ) {
          result = "Á quân";
        } else if (matched.eliminated?.round) {
          result = `Bị loại ở ${matched.eliminated.round}`;
        } else {
          result = "Đã kết thúc";
        }
      } else if (matched.eliminated?.round) {
        result = `Bị loại ở ${matched.eliminated.round}`;
      }
      rows.push({
        id: t.id,
        name: t.name,
        teamName: teamDisplayName(matched),
        dateLabel,
        result,
        isChampion,
      });
    }

    // Seeded past tournaments with teams carrying the clan tag
    const h = hashString(clan.tag);
    const pastNames = [
      "Cúp Mùa Thu Hà Nội 2025",
      "Giải AoE Tứ Hùng Mở Rộng",
      "Cúp Bang Hội Liên Tỉnh",
      "Đấu Trường Shang Cổ Điển #4",
    ];
    const results = [
      { label: "Vô địch", champ: true },
      { label: "Á quân", champ: false },
      { label: "Bị loại ở Bán kết", champ: false },
      { label: "Bị loại ở Tứ kết", champ: false },
    ];
    const count = 2 + (h % 3);
    for (let i = 0; i < count; i++) {
      const x = hashString(`${clan.tag}-t-${i}`);
      const res = results[(x >>> 3) % results.length];
      rows.push({
        id: `${clan.tag}-past-${i}`,
        name: pastNames[(h + i) % pastNames.length],
        teamName: `${clan.tag} Team ${i + 1}`,
        dateLabel: `${String(10 + (x % 15)).padStart(2, "0")}/0${2 + i}/2025`,
        result: res.label,
        isChampion: res.champ,
      });
    }

    return rows;
  }, [clan.tag]);

  const trophies = tournaments.filter((t) => t.isChampion).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBlock
          label="Điểm clan"
          value={clan.points.toLocaleString("vi-VN")}
          icon={<Icon name="trophy" size={16} />}
        />
        <StatBlock
          label="Số cúp vô địch"
          value={trophies}
          icon={<Icon name="crown" size={16} />}
        />
        <StatBlock
          label="Giải đã tham gia"
          value={tournaments.length}
          icon={<Icon name="shield" size={16} />}
        />
      </div>

      <section className="flex flex-col gap-2 bg-black/35 p-4 bevel-sunken-1">
        <div className="flex items-center justify-between">
          <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
            Điểm clan 12 tuần gần đây
          </h2>
          <span className="text-xs tabular text-tone-text/65">
            Hiện tại: {clan.points.toLocaleString("vi-VN")}
          </span>
        </div>
        <PointsSparkline points={clan.pointsHistory} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
          Giải đấu có đội mang thẻ [{clan.tag}]
        </h2>

        {tournaments.length === 0 ? (
          <div className="bg-black/35 bevel-sunken-1">
            <EmptyState
              title="Chưa tham gia giải nào"
              description="Clan chưa ghi nhận đội nào tham dự giải đấu."
              art={{ set: "building:greek", frame: 4 }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto bg-black/35 bevel-sunken-1">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 bg-black/40 text-xs uppercase tracking-wider text-tone-text/65">
                  <th className="px-3 py-2.5 font-semibold">Tên giải</th>
                  <th className="px-3 py-2.5 font-semibold">Đội</th>
                  <th className="px-3 py-2.5 font-semibold">Ngày</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Thành tích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {tournaments.map((t) => (
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
                    <td className="px-3 py-2.5 text-tone-text">{t.teamName}</td>
                    <td className="px-3 py-2.5 tabular text-tone-text/75">{t.dateLabel}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">
                      <span
                        className={
                          t.isChampion
                            ? "inline-flex items-center gap-1.5 text-tone-focus"
                            : "text-tone-text"
                        }
                      >
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
      </section>
    </div>
  );
}


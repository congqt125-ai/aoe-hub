import {
  Avatar, GameIcon, ProgressBar, StatBlock, Tooltip, cx,
} from "../../../../components";
import { civLabel, civStyle } from "../../civs";
import type { ProfileData } from "../../profileMock";

export function OverviewTab({
  profile,
  onOpenPlayer,
}: {
  profile: ProfileData;
  onOpenPlayer: (playerId: string) => void;
}) {
  const { stats } = profile;

  return (
    <div className="flex min-h-0 gap-3">
      {/* Left wide column */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {/* StatBlock row */}
        <div className="grid grid-cols-5 gap-2.5">
          <StatBlock label="Số trận" value={stats.matches} />
          <StatBlock label="Tỉ lệ thắng" value={`${stats.winRate}%`} />
          <StatBlock
            label="Điểm"
            value={stats.elo}
            delta={stats.eloWeekDelta}
            formatDelta={(d) => `${Math.abs(d)} tuần`}
          />
          <StatBlock label="Chuỗi thắng" value={stats.streak} />
          <StatBlock label="Giờ chơi" value={`${stats.hours} h`} />
        </div>

        {/* 30-day Elo sparkline + Last 10 matches */}
        <div className="grid grid-cols-2 gap-3">
          <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
            <div className="flex items-center justify-between">
              <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
                Điểm 30 ngày
              </h2>
              {profile.elo30d.length > 0 && (
                <span className="font-body text-xs tabular text-tone-text/75">
                  Thấp {Math.min(...profile.elo30d)} – Cao {Math.max(...profile.elo30d)}
                </span>
              )}
            </div>
            <EloSparkline values={profile.elo30d} />
          </section>

          <section className="flex flex-col justify-between gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
            <div className="flex items-center justify-between">
              <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
                10 trận gần nhất
              </h2>
              <span className="font-body text-xs text-tone-text/70">
                {profile.recent10.filter((m) => m.win).length}T –{" "}
                {profile.recent10.filter((m) => !m.win).length}B
              </span>
            </div>
            <div className="flex items-center gap-2 py-0.5">
              {profile.recent10.map((m, i) => (
                <Tooltip
                  key={i}
                  content={`${m.win ? "Thắng" : "Thua"} · ${m.gameType} · ${m.date} · ${
                    m.eloDelta > 0 ? `+${m.eloDelta}` : m.eloDelta
                  }`}
                >
                  <span
                    tabIndex={0}
                    aria-label={`${m.win ? "Thắng" : "Thua"} ${m.gameType} ${m.date}`}
                    className={cx(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border border-black/60 font-body text-xs font-bold focus-visible:outline-none focus-visible:outline-game",
                      m.win ? "bg-success text-success-on" : "bg-danger text-danger-on",
                    )}
                  >
                    {m.win ? "T" : "B"}
                  </span>
                </Tooltip>
              ))}
            </div>
            <span className="font-body text-xs text-tone-text/60">
              Rê chuột vào từng trận để xem thể loại, ngày và biến động điểm.
            </span>
          </section>
        </div>

        {/* Top 5 civilizations + Game modes / map types */}
        <div className="grid grid-cols-2 gap-3">
          <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
            <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
              Đế chế hay dùng
            </h2>
            <div className="flex flex-col gap-1.5">
              {profile.topCivs.map((c) => {
                const style = civStyle(c.civId) ?? "greek";
                const name = civLabel(c.civId);
                return (
                  <div key={c.civId} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="inline-flex items-center gap-2 text-tone-state">
                        <GameIcon set={`building:${style}`} frame={0} size={16} />
                        <span>{name}</span>
                      </span>
                      <span className="tabular text-xs text-tone-text/80">
                        {c.matches} trận · <strong className="text-tone-focus">{c.winRate}%</strong>
                      </span>
                    </div>
                    <ProgressBar
                      value={c.winRate}
                      label={`Tỉ lệ thắng ${name}`}
                      showLabel={false}
                      className="[&>div]:h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
            <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
              Thể loại &amp; Loại map
            </h2>
            <div className="flex flex-col divide-y divide-white/10">
              {profile.modeStats.map((m) => (
                <div key={m.label} className="flex items-center justify-between py-1.5 font-body text-sm first:pt-0 last:pb-0">
                  <span className="text-tone-state">{m.label}</span>
                  <span className="tabular text-xs text-tone-text/80">
                    {m.matches} trận ·{" "}
                    <strong className={m.winRate >= 50 ? "text-success-on-dark" : "text-tone-text"}>
                      {m.winRate}% thắng
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Top 5 playmates */}
        <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
            Hay chơi cùng
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {profile.playmates.map(({ player, sharedMatches }) => (
              <button
                key={player.id}
                type="button"
                onClick={() => onOpenPlayer(player.id)}
                className="flex items-center gap-2 bg-black/50 px-2 py-1.5 text-left bevel-raised-1 hover:bg-black/35 focus-visible:outline-none focus-visible:outline-game"
              >
                <Avatar name={player.name} source={player.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-semibold text-tone-state">
                    {player.name}
                  </div>
                  <div className="font-body text-xs tabular text-tone-text/70">
                    {sharedMatches} trận chung
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Right narrow column (~360px): Bio, Clan, Season ranks */}
      <aside className="flex w-[360px] shrink-0 flex-col gap-2.5">
        <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
            Giới thiệu
          </h2>
          {profile.bio ? (
            <p className="m-0 whitespace-pre-wrap font-body text-sm leading-snug text-tone-text">
              {profile.bio}
            </p>
          ) : (
            <p className="m-0 font-body text-sm italic text-tone-text/50">
              Chưa có giới thiệu.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
            Clan
          </h2>
          {profile.clan ? (
            <button
              type="button"
              onClick={() => { location.hash = `#/clan/${encodeURIComponent(profile.clan!.tag)}`; }}
              className="flex w-full cursor-pointer flex-col gap-1 text-left font-body text-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tone-focus"
            >
              <div className="flex items-center gap-2">
                <span className="bg-black/60 px-2 py-0.5 font-heading text-xs font-semibold text-tone-focus bevel-sunken-1">
                  [{profile.clan.tag}]
                </span>
                <span className="font-semibold text-tone-state">{profile.clan.name}</span>
              </div>
              <div className="flex justify-between text-xs text-tone-text/80">
                <span>Vai trò: <strong className="text-tone-state">{profile.clan.role}</strong></span>
                <span className="tabular">{profile.clan.members} thành viên</span>
              </div>
              <div className="text-xs text-tone-text/65">
                Gia nhập: {profile.clan.joinedAt}
              </div>
            </button>
          ) : (
            <p className="m-0 font-body text-sm italic text-tone-text/50">
              Chưa tham gia clan.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-1.5 bg-black/40 px-3 py-2.5 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-semibold uppercase tracking-wide text-tone-state">
            Hạng theo mùa
          </h2>
          <div className="flex flex-col divide-y divide-white/10">
            {profile.seasons.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-2 py-1.5 font-body text-sm first:pt-0 last:pb-0">
                <div>
                  <div className={s.current ? "font-semibold text-tone-focus" : "text-tone-state"}>
                    {s.name}
                  </div>
                  <div className="text-xs text-tone-text/65">
                    Cao nhất: {s.peakRank}
                  </div>
                </div>
                <span className="bg-black/55 px-2 py-0.5 font-heading text-xs font-semibold text-tone-state bevel-sunken-1">
                  {s.finalRank}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function EloSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-11 font-body text-xs text-tone-text/50">Chưa đủ dữ liệu</div>;
  }
  const w = 320;
  const h = 44;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-11 w-full text-tone-focus"
      role="img"
      aria-label={`Biểu đồ điểm 30 ngày, từ ${min} đến ${max}`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}


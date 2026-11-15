import { useEffect, useMemo, useState } from "react";
import { Button, GameIcon, Icon, IconButton, cx } from "../../../../components";
import type { ChangelogProduct, HeroSlide } from "../../homeMock";
import {
  formatCountdown,
  GAME_TYPE_LABEL,
  PHASE_LABEL,
  type Tournament,
} from "../../tournamentMock";

export interface HeroCarouselProps {
  slides: HeroSlide[];
  tournaments: Tournament[];
  onGoTournament: () => void;
  onOpenChangelog: (product: ChangelogProduct, version?: string) => void;
  onEventToast: (title: string, description: string) => void;
}

const AUTO_ADVANCE_MS = 7000;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** §3.2 Rotating hero banner: 7s auto-advance, pauses on hover/focus, respects reduced motion. */
export function HeroCarousel({
  slides,
  tournaments,
  onGoTournament,
  onOpenChangelog,
  onEventToast,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const reducedMotion = useReducedMotion();

  const safeIndex = slides.length > 0 ? index % slides.length : 0;
  const current = slides[safeIndex];

  // Live 1s countdown tick for tournament slides
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-advance every 7s unless paused, single slide, or reduced-motion
  useEffect(() => {
    if (paused || slides.length <= 1 || reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, slides.length, reducedMotion]);

  const featuredTournament = useMemo(() => {
    return (
      tournaments.find((t) => t.phase === "registration") ??
      tournaments.find((t) => t.phase === "playing") ??
      tournaments[0]
    );
  }, [tournaments]);

  if (!current) return null;

  const isTournament = current.kind === "tournament" && featuredTournament;
  const goPrev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section
      aria-label="Banner nổi bật"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (slides.length <= 1) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
      }}
      className="relative flex h-[280px] shrink-0 flex-col justify-between overflow-hidden bg-black/75 p-6 bevel-raised-2 focus-visible:outline-game-out"
    >
      {/* Background image + dark scrim */}
      <img
        key={current.id}
        src={current.bgImage}
        alt=""
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55",
          !reducedMotion && "transition-opacity duration-slow ease-step",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35"
      />

      {/* Top badge + decorative building art */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <span className="inline-flex h-6 items-center gap-1.5 bg-black/75 px-2.5 font-heading text-xs font-semibold uppercase tracking-wide text-tone-focus bevel-flat">
          <Icon name={current.kind === "tournament" ? "trophy" : "star"} size={12} />
          {current.badge}
        </span>

        <GameIcon set="building:greek" frame={4} size={50} className="opacity-85 drop-shadow" />
      </div>

      {/* Main copy */}
      <div className="relative z-10 flex max-w-[740px] flex-col gap-1.5">
        <h2 className="m-0 font-heading text-2xl font-bold text-tone-state text-shadow-game">
          {isTournament ? featuredTournament.name : current.title}
        </h2>

        {isTournament ? (
          <p className="m-0 font-body text-md text-tone-text/90">
            {PHASE_LABEL[featuredTournament.phase]} · còn{" "}
            <strong className="tabular text-tone-focus">
              {formatCountdown(featuredTournament.startAt, nowMs)}
            </strong>{" "}
            · {featuredTournament.teams.length}/{featuredTournament.maxTeams} đội ·{" "}
            {GAME_TYPE_LABEL[featuredTournament.gameType]}
          </p>
        ) : (
          <p className="m-0 line-clamp-2 font-body text-md text-tone-text/90">
            {current.description}
          </p>
        )}
      </div>

      {/* Actions + carousel controls */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {isTournament ? (
            featuredTournament.phase === "registration" ? (
              <>
                <Button variant="primary" onClick={onGoTournament}>
                  Đăng ký
                </Button>
                <Button variant="secondary" onClick={onGoTournament}>
                  Xem giải
                </Button>
              </>
            ) : featuredTournament.phase === "playing" || featuredTournament.phase === "drawing" ? (
              <Button variant="primary" onClick={onGoTournament}>
                Vào xem
              </Button>
            ) : (
              <Button variant="secondary" onClick={onGoTournament}>
                Xem giải
              </Button>
            )
          ) : current.kind === "software" || current.kind === "coregame" ? (
            <Button
              variant="primary"
              onClick={() => onOpenChangelog(current.product ?? "software", current.version)}
            >
              Xem có gì mới
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() =>
                onEventToast(
                  current.title,
                  "Hoàn thành 5 trận phòng Clan trong tuần lễ để nhận thưởng Kho đồ.",
                )
              }
            >
              Xem chi tiết
            </Button>
          )}
        </div>

        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-1">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slide ${idx + 1}: ${s.badge}`}
                  aria-current={idx === safeIndex ? "true" : undefined}
                  onClick={() => setIndex(idx)}
                  className={cx(
                    "h-2.5 rounded-full transition-all duration-fast focus-visible:outline-game-out",
                    idx === safeIndex ? "w-5 bg-tone-focus" : "w-2.5 bg-white/35 hover:bg-white/60",
                  )}
                />
              ))}
            </div>
            <IconButton size={24} label="Slide trước" onClick={goPrev}>
              <Icon name="chevron-left" size={16} />
            </IconButton>
            <IconButton size={24} label="Slide tiếp theo" onClick={goNext}>
              <Icon name="chevron-right" size={16} />
            </IconButton>
          </div>
        )}
      </div>
    </section>
  );
}


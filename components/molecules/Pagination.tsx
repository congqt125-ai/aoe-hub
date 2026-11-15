import { useEffect, useRef } from "react";
import { cx } from "../lib/cx";
import { Button } from "../atoms/Button";
import { IconButton } from "../atoms/IconButton";
import { Spinner } from "../atoms/Spinner";

export type PaginationProps =
  | { variant: "pages"; page: number; pageCount: number; onPage: (page: number) => void; className?: string }
  | { variant: "load-more" | "infinite"; hasMore: boolean; loading: boolean; onLoadMore: () => void; className?: string };

/** Page numbers with the game's arrow sprites, a "Tải thêm" button, or auto-load when the end scrolls into view. */
export function Pagination(props: PaginationProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const infinite = props.variant === "infinite";
  const canLoad = props.variant !== "pages" && props.hasMore && !props.loading;
  const load = props.variant !== "pages" ? props.onLoadMore : undefined;

  useEffect(() => {
    if (!infinite || !canLoad || !sentinel.current || !load) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), { rootMargin: "120px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [infinite, canLoad, load]);

  if (props.variant === "pages") {
    const { page, pageCount, onPage } = props;
    const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
    return (
      <nav aria-label="Phân trang" className={cx("flex items-center gap-1", props.className)}>
        <IconButton variant="control" sprite="arrow-up" size={24} label="Trang trước" className="-rotate-90" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-tone-text/60">…</span>}
            <button
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPage(p)}
              className={cx(
                "h-6 min-w-6 px-1.5 font-body text-sm tabular text-shadow-game focus-visible:outline-game-out",
                p === page
                  ? "bg-black/35 bevel-raised-2 text-tone-state ring-1 ring-inset ring-tone-focus"
                  : "bg-black/55 bevel-flat text-tone-text/75 hover:bg-black/45 hover:text-tone-focus",
              )}
            >
              {p}
            </button>
          </span>
        ))}
        <IconButton variant="control" sprite="arrow-up" size={24} label="Trang sau" className="rotate-90" disabled={page >= pageCount} onClick={() => onPage(page + 1)} />
      </nav>
    );
  }

  if (!props.hasMore && !props.loading) return null;
  return (
    <div ref={sentinel} className={cx("flex justify-center py-2", props.className)}>
      {props.variant === "load-more" ? (
        <Button variant="secondary" loading={props.loading} disabled={!props.hasMore} onClick={props.onLoadMore}>
          Tải thêm
        </Button>
      ) : (
        props.loading && <Spinner size={24} label="Đang tải thêm" />
      )}
    </div>
  );
}

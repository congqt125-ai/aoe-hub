import { useEffect } from "react";
import { cx } from "../lib/cx";
import type { Faction } from "../lib/theme";
import { Badge } from "../atoms/Badge";
import { Icon, type IconName } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Kbd } from "../atoms/Kbd";

export interface SideNavItem {
  id: string;
  label: string;
  icon: IconName;
  count?: number;
}

export interface SideNavProps {
  items: SideNavItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  /** HUD button style of this faction (hud/<faction>-button-bg-sheet.png). */
  faction?: Faction;
  /** Show labels next to the buttons. */
  expanded?: boolean;
  className?: string;
}

/** Left rail of faction HUD buttons + labels; selected = pressed frame + `state` text. Alt+1…Alt+9 jump to items. */
// Roman HUD buttons are the darkest, so the white icons read best on them.
export function SideNav({ items, activeId, onSelect, faction = "roman", expanded = false, className }: SideNavProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= items.length) {
        e.preventDefault();
        onSelect(items[n - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, onSelect]);

  return (
    <nav aria-label="Điều hướng nhanh" className={cx("tone-screen flex flex-col gap-1.5 bg-black/60 bevel-raised-2 p-2", expanded ? "w-48" : "w-[72px] items-center", className)}>
      {items.map((it, i) => {
        const active = it.id === activeId;
        return (
          <div key={it.id} className={cx("group/item relative flex items-center gap-2", expanded && "w-full")}>
            <IconButton
              variant="hud"
              faction={faction}
              selected={active}
              size={40}
              label={`${it.label} (Alt+${i + 1})`}
              tooltip={expanded ? false : "bottom"}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(it.id)}
            >
              <Icon name={it.icon} size={20} />
            </IconButton>
            {it.count !== undefined && <Badge variant="count" count={it.count} className="pointer-events-none absolute -top-1 left-7" />}
            {expanded && (
              <span className={cx("flex flex-1 items-center justify-between font-heading text-md font-semibold text-shadow-game", active ? "text-tone-state" : "text-tone-text")}>
                {it.label}
                <Kbd className="opacity-70">{`Alt ${i + 1}`}</Kbd>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

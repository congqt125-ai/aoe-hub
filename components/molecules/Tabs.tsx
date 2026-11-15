import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Badge } from "../atoms/Badge";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  label: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** top: tabs above a panel; segmented: joined buttons for filters; vertical: settings groups. */
  variant?: "top" | "segmented" | "vertical";
  size?: "sm" | "md";
  /** id prefix of the panels (`${idBase}-panel-${value}`) for aria-controls; render <TabPanel> with the same base. */
  idBase?: string;
  className?: string;
}

/** Tabs as small bevel buttons: selected one is raised with `state` text and focus ring; unselected ones sit flat. Arrow keys move, Home / End jump. */
export function Tabs<T extends string>({ label, items, value, onChange, variant = "top", size = "sm", idBase, className }: TabsProps<T>) {
  const auto = useId();
  const base = idBase ?? auto;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const vertical = variant === "vertical";
  const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const pos = enabled.indexOf(i);
    let target: number | undefined;
    if (e.key === prev) target = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === next) target = enabled[(pos + 1) % enabled.length];
    else if (e.key === "Home") target = enabled[0];
    else if (e.key === "End") target = enabled[enabled.length - 1];
    if (target === undefined) return;
    e.preventDefault();
    refs.current[target]?.focus();
    onChange(items[target].value);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={cx("flex", vertical ? "flex-col gap-1" : variant === "segmented" ? "gap-0" : "gap-1", className)}
    >
      {items.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.value}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${t.value}`}
            tabIndex={selected ? 0 : -1}
            disabled={t.disabled}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "group relative inline-flex items-center gap-1.5 whitespace-nowrap font-heading font-semibold text-shadow-game",
              "focus-visible:outline-none focus-visible:outline-game disabled:opacity-50",
              size === "sm" ? "h-7 px-3 text-sm" : "h-8 px-4 text-md",
              vertical && "justify-start",
              selected
                ? "bg-black/35 bevel-raised text-tone-state ring-1 ring-inset ring-tone-focus"
                : "bg-black/55 bevel-flat text-tone-text/75 enabled:hover:bg-black/45 enabled:hover:text-tone-focus",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && <Badge variant="count" count={t.count} />}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, value, children, className }: { idBase: string; value: string; children: ReactNode; className?: string }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${value}`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0} className={cx("focus-visible:outline-game-out", className)}>
      {children}
    </div>
  );
}

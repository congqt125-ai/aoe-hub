import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon, type IconName } from "../atoms/Icon";
import { Kbd } from "../atoms/Kbd";

export type MenuEntry =
  | { kind?: "item"; id: string; label: string; icon?: IconName; shortcut?: string[]; danger?: boolean; disabled?: boolean; onSelect: () => void }
  | { kind: "divider"; id: string };

export interface MenuProps {
  label: string;
  items: MenuEntry[];
  onClose?: () => void;
  className?: string;
  /** Focus the first item when mounted (menus opened from a button). */
  autoFocus?: boolean;
}

/** Action list: dark surface + raised bevel, rows like ListRow sm. Arrows / Home / End move, Enter picks, Esc closes. */
export function Menu({ label, items, onClose, className, autoFocus = true }: MenuProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionable = items.map((it, i) => (it.kind !== "divider" && !it.disabled ? i : -1)).filter((i) => i >= 0);

  useEffect(() => {
    if (autoFocus) refs.current[actionable[0]]?.focus();
    // Mount only: focus the first item once.
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    const current = refs.current.findIndex((el) => el === document.activeElement);
    const pos = actionable.indexOf(current);
    let target: number | undefined;
    if (e.key === "ArrowDown") target = actionable[(pos + 1) % actionable.length];
    else if (e.key === "ArrowUp") target = actionable[(pos - 1 + actionable.length) % actionable.length];
    else if (e.key === "Home") target = actionable[0];
    else if (e.key === "End") target = actionable[actionable.length - 1];
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      onClose?.();
      return;
    }
    if (target === undefined) return;
    e.preventDefault();
    refs.current[target]?.focus();
  };

  return (
    <div role="menu" aria-label={label} onKeyDown={onKeyDown} className={cx("tone-screen min-w-[200px] bg-black/90 bevel-raised-2 p-[3px]", className)}>
      {items.map((it, i) =>
        it.kind === "divider" ? (
          <div key={it.id} role="separator" className="mx-1 my-1 h-[2px] bevel-etched" />
        ) : (
          <button
            key={it.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={it.disabled}
            onClick={() => {
              it.onSelect();
              onClose?.();
            }}
            className={cx(
              "flex h-7 w-full items-center gap-2 px-2 text-left font-body text-md text-shadow-game outline-none",
              "focus:bg-tone-bevel-0/25 focus:text-tone-focus hover:bg-tone-bevel-0/25 hover:text-tone-focus disabled:text-tone-text/40",
              it.danger ? "text-danger-on-dark" : "text-tone-text",
            )}
          >
            <span className="flex w-4 shrink-0 justify-center">{it.icon && <Icon name={it.icon} size={16} />}</span>
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut && (
              <span className="flex gap-0.5">
                {it.shortcut.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

export interface DropdownMenuProps extends Omit<MenuProps, "onClose" | "autoFocus"> {
  /** Trigger renderer: spread the props onto a Button / IconButton. */
  trigger: (props: { "aria-haspopup": "menu"; "aria-expanded": boolean; "aria-controls": string; onClick: () => void; onKeyDown: (e: KeyboardEvent) => void }) => ReactElement;
  align?: "start" | "end";
  /** Custom panel instead of a Menu (e.g. NotificationCenter). */
  panel?: (close: () => void) => ReactNode;
}

/** Button + Menu: opens on click / Enter / ArrowDown, Esc closes and returns focus to the trigger. */
export function DropdownMenu({ trigger, align = "start", panel, ...menu }: DropdownMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    root.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  };

  return (
    <div ref={root} className="relative inline-flex">
      {trigger({
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
        onClick: () => setOpen((o) => !o),
        onKeyDown: (e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        },
      })}
      {open && (
        <div
          id={id}
          className={cx("absolute top-full z-dropdown mt-1", align === "end" ? "right-0" : "left-0")}
          onKeyDown={(e) => e.key === "Escape" && close()}
        >
          {panel ? panel(close) : <Menu {...menu} onClose={close} />}
        </div>
      )}
    </div>
  );
}

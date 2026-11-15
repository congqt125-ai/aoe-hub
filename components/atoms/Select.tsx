import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { CONTROL_SETS, type ControlSet } from "../lib/assets";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Optional leading visual (icon, color swatch). */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  size?: "sm" | "md";
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Sprite set of the dropdown button (default scr2, warm amber). */
  controlSet?: ControlSet;
}

const HEIGHT = { sm: "h-6 text-sm", md: "h-8 text-md" } as const;

/**
 * Combobox (select-only) with the theme's arrow-down-alt sprite.
 * Keys: arrows / Home / End move, Enter / Space pick, Esc closes, typing jumps to the first matching option.
 */
export function Select<T extends string>({ options, value, onChange, placeholder = "Chọn…", disabled, invalid, size = "md", id, className, controlSet = "scr2", ...aria }: SelectProps<T>) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Open the list upward when there is no room below (inside the app stage, else the window). */
  const [up, setUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const openList = () => {
    const r = rootRef.current?.getBoundingClientRect();
    const bottom = document.getElementById("root")?.getBoundingClientRect().bottom ?? window.innerHeight;
    const listH = Math.min(256, options.length * 28 + 8);
    setUp(Boolean(r && r.bottom + listH + 4 > bottom && r.top - listH - 4 > 0));
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };
  const move = (delta: number) => {
    const pos = enabled.indexOf(active);
    setActive(enabled[Math.min(enabled.length - 1, Math.max(0, pos + delta))] ?? -1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) (open ? setActive(hit) : pick(hit));
      return;
    }
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else move(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (open) {
          e.preventDefault();
          setActive(e.key === "Home" ? enabled[0] : enabled[enabled.length - 1]);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) pick(active);
        else openList();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        {...aria}
        className={cx(
          "group relative flex w-full items-center gap-2 bg-black/70 bevel-sunken pl-2.5 pr-0 text-left font-body text-tone-state text-shadow-none",
          "focus-visible:outline-none focus-visible:outline-game-out disabled:opacity-50",
          "after:pointer-events-none after:absolute after:inset-[3px]",
          invalid && "after:border after:border-danger",
          HEIGHT[size],
        )}
      >
        {selected?.icon}
        <span className={cx("min-w-0 flex-1 truncate", !selected && "text-tone-text/50")}>{selected?.label ?? placeholder}</span>
        <span
          aria-hidden
          className={cx(
            // Inside the field's own frame (3px each side), with no frame of its own: the field's border runs
            // around text and button alike, a 1px divider in the frame color between them (user 12/11).
            // Face = the arrow sprite of `controlSet`, zoomed so its small arrow reads.
            "my-[3px] mr-[3px] aspect-square h-[calc(100%-6px)] shrink-0 border-l border-tone-bevel-0 bg-center bg-no-repeat",
            "bg-[image:var(--sel-arrow)] group-enabled:group-active:bg-[image:var(--sel-arrow-pressed)] group-enabled:group-hover:brightness-110",
          )}
          style={{
            ["--sel-arrow" as string]: `url("${CONTROL_SETS[controlSet].arrowDown}")`,
            ["--sel-arrow-pressed" as string]: `url("${CONTROL_SETS[controlSet].arrowDownPressed}")`,
            backgroundSize: CONTROL_SETS[controlSet].zoom.arrow,
          }}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cx(
            // Solid: the list often opens over other cards / text, which must not show through.
            "absolute left-0 right-0 z-dropdown max-h-64 overflow-y-auto bg-black bevel-raised-2 p-[3px] text-shadow-game",
            up ? "bottom-full mb-0.5" : "top-full mt-0.5",
          )}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              // preventDefault: inside a <label>, the click would otherwise be forwarded to the combobox
              // button and reopen the list right after picking.
              onClick={(e) => {
                e.preventDefault();
                pick(i);
              }}
              className={cx(
                "flex h-7 items-center gap-2 px-2 font-body text-md",
                o.disabled ? "text-tone-text/40" : i === active ? "bg-tone-bevel-0/25 text-tone-focus" : "text-tone-text",
                o.value === value && "font-bold",
              )}
            >
              {o.icon}
              <span className="truncate">{o.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

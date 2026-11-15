import { useState, type KeyboardEvent } from "react";
import { Kbd, cx } from "../../../../components";

export interface KeyCaptureInputProps {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

const MODIFIERS = new Set(["Control", "Alt", "Shift", "Meta"]);

function formatKeyEvent(e: KeyboardEvent<HTMLButtonElement>): string | null {
  if (MODIFIERS.has(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  else if (/^f([1-9]|1[0-2])$/i.test(key)) key = key.toUpperCase();

  parts.push(key);
  return parts.join("+");
}

/** Button-like hotkey capture field: click to listen, Esc cancels, Backspace clears if allowed. */
export function KeyCaptureInput({
  id,
  value,
  onChange,
  invalid,
  allowClear = false,
  placeholder = "Chưa đặt",
  "aria-label": ariaLabel,
  className,
}: KeyCaptureInputProps) {
  const [capturing, setCapturing] = useState(false);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!capturing) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setCapturing(true);
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      setCapturing(false);
      return;
    }

    if (allowClear && (e.key === "Backspace" || e.key === "Delete") && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      onChange("");
      setCapturing(false);
      return;
    }

    const combo = formatKeyEvent(e);
    if (!combo) return;
    onChange(combo);
    setCapturing(false);
  };

  return (
    <button
      id={id}
      type="button"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      onClick={() => setCapturing((c) => !c)}
      onBlur={() => setCapturing(false)}
      onKeyDown={onKeyDown}
      className={cx(
        "relative inline-flex h-8 min-w-[160px] items-center justify-center px-3 font-body text-md",
        "bg-black/70 bevel-sunken text-shadow-none focus-visible:outline-none focus-visible:outline-game-out",
        "after:pointer-events-none after:absolute after:inset-[3px]",
        capturing
          ? "bg-black/85 text-tone-focus after:border after:border-tone-focus/70"
          : invalid
            ? "text-tone-state after:border after:border-danger"
            : "text-tone-state",
        className,
      )}
    >
      {capturing ? (
        <span className="animate-pulse font-semibold">Bấm phím…</span>
      ) : value ? (
        <span className="inline-flex items-center gap-1">
          {value.split("+").map((part) => (
            <Kbd key={part}>{part}</Kbd>
          ))}
        </span>
      ) : (
        <span className="text-tone-text/50">{placeholder}</span>
      )}
    </button>
  );
}


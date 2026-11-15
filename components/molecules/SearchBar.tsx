import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/cx";
import { Input } from "../atoms/Input";
import { Select, type SelectOption } from "../atoms/Select";
import { Spinner } from "../atoms/Spinner";

export interface SearchBarProps<S extends string> {
  label: string;
  placeholder?: string;
  /** Called 250ms after typing stops (and immediately on clear). */
  onSearch: (query: string, scope?: S) => void;
  searching?: boolean;
  scopes?: SelectOption<S>[];
  defaultScope?: S;
  size?: "sm" | "md";
  className?: string;
}

const DEBOUNCE_MS = 250;

/** Search input + clear button (Esc clears) + optional scope select; spinner while searching. */
export function SearchBar<S extends string>({ label, placeholder, onSearch, searching, scopes, defaultScope, size = "md", className }: SearchBarProps<S>) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<S | undefined>(defaultScope ?? scopes?.[0]?.value);
  const timer = useRef<number | undefined>(undefined);
  const search = useRef(onSearch);
  search.current = onSearch;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (q: string, s: S | undefined, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => search.current(q, s), delay);
  };

  return (
    <div role="search" className={cx("flex gap-1.5", className)}>
      {scopes && (
        <Select
          aria-label="Phạm vi tìm"
          size={size}
          options={scopes}
          value={scope}
          onChange={(s) => {
            setScope(s);
            schedule(query, s, 0);
          }}
          className="w-32 shrink-0"
        />
      )}
      <Input
        type="search"
        size={size}
        aria-label={label}
        placeholder={placeholder ?? label}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          schedule(e.target.value, scope, DEBOUNCE_MS);
        }}
        onClear={() => {
          setQuery("");
          schedule("", scope, 0);
        }}
        trailing={searching ? <Spinner className="mr-2" label="Đang tìm" /> : undefined}
        wrapperClassName="flex-1"
      />
    </div>
  );
}

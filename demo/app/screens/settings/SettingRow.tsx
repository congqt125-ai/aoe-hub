import type { ReactNode } from "react";
import { cx } from "../../../../components";

export interface SettingGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Section grouping related settings under a heading and muted summary. */
export function SettingGroup({ title, description, children, className }: SettingGroupProps) {
  return (
    <section className={cx("flex flex-col gap-2", className)}>
      <header className="flex flex-col gap-0.5">
        <h3 className="m-0 font-heading text-lg font-semibold text-tone-state">{title}</h3>
        {description && <p className="m-0 font-body text-sm text-tone-text/70">{description}</p>}
      </header>
      <div className="divide-y divide-white/10 bg-black/30 bevel-sunken-1">{children}</div>
    </section>
  );
}

export interface SettingRowProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/** Single setting row: label on the left, control on the right, description or error underneath. */
export function SettingRow({ label, htmlFor, description, error, disabled, children, className }: SettingRowProps) {
  return (
    <div className={cx("flex flex-col gap-1 px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-4">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className={cx("font-body text-md font-semibold text-tone-text", disabled && "opacity-60")}
          >
            {label}
          </label>
        ) : (
          <span className={cx("font-body text-md font-semibold text-tone-text", disabled && "opacity-60")}>
            {label}
          </span>
        )}
        <div className="shrink-0">{children}</div>
      </div>
      {description && (
        <p className={cx("m-0 font-body text-sm text-tone-text/70", disabled && "opacity-60")}>{description}</p>
      )}
      {error && (
        <p role="alert" className="m-0 font-body text-sm font-bold text-danger-on-dark">
          {error}
        </p>
      )}
    </div>
  );
}

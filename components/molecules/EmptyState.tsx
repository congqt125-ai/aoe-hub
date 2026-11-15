import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Button } from "../atoms/Button";
import { GameIcon, type GameIconSet } from "../atoms/Icon";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Large game art (unit / building frame), shown dimmed. */
  art?: { set: GameIconSet; frame: number };
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  className?: string;
}

/** "Chưa có phòng nào — Tạo phòng": game icon + title + description + primary action. */
export function EmptyState({ title, description, art, action, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center gap-2 px-6 py-8 text-center text-shadow-game", className)}>
      {art && <GameIcon set={art.set} frame={art.frame} size={50} className="mb-1 opacity-60" />}
      <p className="m-0 font-heading text-lg font-semibold text-tone-state">{title}</p>
      {description && <p className="m-0 max-w-sm font-body text-md text-tone-text/80">{description}</p>}
      {action && (
        <Button variant="primary" className="mt-2" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

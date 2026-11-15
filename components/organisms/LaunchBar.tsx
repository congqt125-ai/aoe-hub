import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";

export type LaunchState =
  | { kind: "not-installed" }
  | { kind: "updating"; progress: number; speed: string; paused: boolean }
  | { kind: "ready"; version: string }
  | { kind: "launching" }
  | { kind: "running"; detail?: string }
  | { kind: "error"; message: string };

export interface LaunchBarProps {
  state: LaunchState;
  onInstall?: () => void;
  onTogglePause?: () => void;
  onPlay?: () => void;
  onReturn?: () => void;
  onRepair?: () => void;
  className?: string;
}

/** Bottom bar (28px; was 56, halved by the user 12/11): game install / update progress and the main "Chơi" button (only when `onPlay` is given). */
export function LaunchBar({ state, onInstall, onTogglePause, onPlay, onReturn, onRepair, className }: LaunchBarProps) {
  let status: ReactNode;
  let action: ReactNode;
  switch (state.kind) {
    case "not-installed":
      status = <span>Game chưa được cài trên máy này.</span>;
      action = <Button variant="primary" size="sm" icon={<Icon name="arrow-down" size={12} />} onClick={onInstall}>Cài đặt</Button>;
      break;
    case "updating":
      status = (
        <div className="flex w-full max-w-md items-center gap-3">
          {/* 28px bar: the label sits beside the bar, not above it. */}
          <span className="shrink-0">{state.paused ? "Đã tạm dừng cập nhật" : `Đang cập nhật · ${state.speed}`}</span>
          <ProgressBar className="flex-1" showLabel={false} value={state.progress} label={state.paused ? "Đã tạm dừng cập nhật" : `Đang cập nhật · ${state.speed}`} />
          <span className="shrink-0 tabular">{Math.round(state.progress)}%</span>
        </div>
      );
      action = (
        <Button variant="secondary" size="sm" icon={<Icon name={state.paused ? "play" : "pause"} size={12} />} onClick={onTogglePause}>
          {state.paused ? "Tiếp tục" : "Tạm dừng"}
        </Button>
      );
      break;
    case "ready":
      status = <span>Sẵn sàng · phiên bản {state.version}</span>;
      action = onPlay && (
        <Button variant="primary" size="sm" className="cursor-game-action min-w-[120px]" onClick={onPlay}>
          Chơi
        </Button>
      );
      break;
    case "launching":
      status = <span>Đang khởi chạy game…</span>;
      action = <Button variant="primary" size="sm" loading className="min-w-[120px]">Chơi</Button>;
      break;
    case "running":
      status = (
        <span className="flex items-center gap-2 text-success-on-dark">
          <Icon name="sword" size={12} /> Đang chơi{state.detail ? ` · ${state.detail}` : ""}
        </span>
      );
      action = <Button variant="secondary" size="sm" onClick={onReturn}>Về hub</Button>;
      break;
    case "error":
      status = (
        <span className="flex items-center gap-2 text-danger-on-dark">
          <Icon name="error" size={12} /> {state.message}
        </span>
      );
      action = <Button variant="secondary" size="sm" icon={<Icon name="refresh" size={12} />} onClick={onRepair}>Sửa lỗi cài đặt</Button>;
      break;
  }
  return (
    <footer
      aria-label="Khởi chạy game"
      className={cx("tone-screen flex h-7 items-center gap-4 bg-black/75 bevel-bar px-4 font-body text-sm text-tone-text text-shadow-game", className)}
    >
      <span className="shrink-0 font-heading text-md font-semibold text-tone-state">SuperAge of Antiquity</span>
      <div role="status" className="flex min-w-0 flex-1 items-center">
        {status}
      </div>
      {action}
    </footer>
  );
}

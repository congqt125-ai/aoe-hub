import { cx } from "../lib/cx";
import { Icon } from "../atoms/Icon";

export type ConnectionState =
  | { kind: "online" }
  | { kind: "offline"; attempt: number }
  | { kind: "maintenance"; message: string };

export interface ConnectionBannerProps {
  state: ConnectionState;
  onRetry?: () => void;
  className?: string;
}

/**
 * Global banner on top of every screen: lost connection (warning, auto-retry + "Thử ngay") or maintenance (info).
 * Floats over the top edge of the screen (absolute, out of flow) so showing it never shifts the layout;
 * the parent must be `relative` (screen roots fill the fixed 1600x900 stage; gallery wraps it in a `relative` box).
 */
export function ConnectionBanner({ state, onRetry, className }: ConnectionBannerProps) {
  if (state.kind === "online") return null;
  const offline = state.kind === "offline";
  return (
    <div
      role="status"
      className={cx(
        "absolute inset-x-0 top-0 z-toast flex items-center gap-2.5 px-4 py-2 font-body text-md font-bold text-shadow-none",
        offline ? "bg-warning text-warning-on" : "bg-info text-info-on",
        className,
      )}
    >
      <Icon name={offline ? "warning" : "info"} size={16} className="[filter:none]" />
      <span className="flex-1">
        {offline ? `Mất kết nối tới máy chủ — đang kết nối lại… (lần ${state.attempt})` : state.message}
      </span>
      {offline && onRetry && (
        <button type="button" onClick={onRetry} className="bg-black/15 px-2.5 py-0.5 hover:bg-black/25 focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed">
          Thử ngay
        </button>
      )}
    </div>
  );
}

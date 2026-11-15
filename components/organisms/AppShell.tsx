import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface AppShellProps {
  banner?: ReactNode;
  topBar: ReactNode;
  sideNav?: ReactNode;
  /** Right panel (FriendsPanel), 280px. */
  aside?: ReactNode;
  launchBar?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Hub layout on the screen background: banner · TopBar (48) · SideNav (72) | content | aside (280) · LaunchBar (28).
 * Only the content area scrolls. Includes a skip link to the main content.
 */
export function AppShell({ banner, topBar, sideNav, aside, launchBar, children, className }: AppShellProps) {
  return (
    <div className={cx("relative flex h-full flex-col", className)}>
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
        className="absolute -left-[9999px] z-tooltip bg-black px-3 py-1.5 font-body text-md text-tone-state focus:left-4 focus:top-4"
      >
        Bỏ qua tới nội dung
      </a>
      {banner}
      {topBar}
      <div className="flex min-h-0 flex-1 gap-2 p-2">
        {sideNav}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto outline-none">
          {children}
        </main>
        {aside && <aside className="w-[280px] shrink-0 overflow-y-auto">{aside}</aside>}
      </div>
      {launchBar}
    </div>
  );
}

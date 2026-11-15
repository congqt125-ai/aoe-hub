import type { ReactNode } from "react";
import logoSuperAqe from "../../assets/hub/logo-superaqe.png";
import { cx } from "../lib/cx";
import type { Player } from "../lib/types";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { PingIndicator } from "../atoms/PingIndicator";
import { Surface } from "../atoms/Surface";
import { DropdownMenu, type MenuEntry } from "../molecules/Menu";

export interface NavItem {
  id: string;
  /** Text, or a small tag (e.g. the room code chip while inside a room). */
  label: ReactNode;
  href: string;
}

export interface TopBarProps {
  nav: NavItem[];
  activeId?: string;
  user: Player;
  serverPing: number | null;
  notificationCount?: number;
  onNotifications?: () => void;
  accountMenu: MenuEntry[];
  /** Extra controls before the right cluster (e.g. SearchBar). */
  children?: ReactNode;
  className?: string;
}

/** Top bar (48px): wood-textured header with logo, main navigation, search slot, notifications, server ping, account menu. */
export function TopBar({ nav, activeId, user, serverPing, notificationCount = 0, onNotifications, accountMenu, children, className }: TopBarProps) {
  return (
    <Surface as="header" className={cx("flex h-12 items-center gap-4 bevel-bar px-3", className)}>
      <a href="#/home" aria-label="SuperAqE — Trang chủ" className="flex shrink-0 items-center focus-visible:outline-game-out">
        <img
          src={logoSuperAqe}
          alt="SuperAqE"
          draggable={false}
          className="h-8 w-auto object-contain drop-shadow-[1px_1px_0_rgb(0_0_0/.8)]"
        />
      </a>
      <nav aria-label="Điều hướng chính" className="flex h-full items-stretch">
        {nav.map((n) => {
          const active = n.id === activeId;
          return (
            <a
              key={n.id}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex items-center px-3 font-heading text-md font-semibold focus-visible:outline-game-out focus-visible:-outline-offset-4",
                active ? "text-tone-state after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-tone-focus" : "text-tone-text hover:text-tone-focus",
              )}
            >
              {n.label}
            </a>
          );
        })}
      </nav>
      <div className="flex flex-1 justify-end">{children}</div>
      <span className="relative inline-flex">
        <IconButton label={notificationCount ? `Thông báo (${notificationCount} mới)` : "Thông báo"} tooltip="bottom" onClick={onNotifications}>
          <Icon name="bell" size={20} />
        </IconButton>
        {notificationCount > 0 && <Badge variant="count" count={notificationCount} className="pointer-events-none absolute -right-1.5 -top-1" />}
      </span>
      <PingIndicator ms={serverPing} showValue />
      <DropdownMenu
        label="Tài khoản"
        align="end"
        items={accountMenu}
        trigger={(p) => (
          <button type="button" {...p} className="flex items-center gap-2 px-1 text-tone-text hover:text-tone-focus focus-visible:outline-game-out">
            <Avatar name={user.name} source={user.avatar} size="md" />
            <span className="max-w-[140px] truncate font-body text-md">{user.name}</span>
            <Icon name="chevron-down" size={12} />
          </button>
        )}
      />
    </Surface>
  );
}

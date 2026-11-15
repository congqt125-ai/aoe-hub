import { useCallback, useEffect, useState } from "react";
import type { FrameStyle, IconName, ScreenTheme } from "../../components";

export type RouteId = "login" | "home" | "lobby" | "tournament" | "clan" | "friends" | "profile" | "settings" | "room";

export interface RouteDef {
  id: RouteId;
  label: string;
  icon: IconName;
  /** Templates task that builds this screen (PLAN.md "Templates — 11 việc"). */
  task: string;
  screen: ScreenTheme;
  /** Frame style (user, 12/11): login = kiểu A′ ("lit"), every other screen = kiểu B ("modern"). */
  frame: FrameStyle;
  /** Shown in the TopBar main navigation. */
  inTopNav?: boolean;
  /** Shown in the SideNav (Alt+1…). */
  inSideNav?: boolean;
}

export const ROUTES: RouteDef[] = [
  { id: "login", label: "Đăng nhập", icon: "user", task: "T1", screen: "hub-temple", frame: "lit" },
  { id: "home", label: "Trang chủ", icon: "home", task: "T2", screen: "hub-village", frame: "modern", inTopNav: true, inSideNav: true },
  { id: "lobby", label: "Sảnh đấu", icon: "users", task: "T3", screen: "hub-village", frame: "modern", inTopNav: true, inSideNav: true },
  // Giải đấu replaces Xếp trận (user, 13/11).
  { id: "tournament", label: "Giải đấu", icon: "trophy", task: "T5", screen: "hub-village", frame: "modern", inTopNav: true, inSideNav: true },
  { id: "clan", label: "Clan", icon: "shield", task: "T11", screen: "hub-village", frame: "modern", inTopNav: true, inSideNav: true },
  { id: "friends", label: "Bạn bè", icon: "chat", task: "T6", screen: "hub-village", frame: "modern", inSideNav: true },
  { id: "profile", label: "Hồ sơ", icon: "user", task: "T7", screen: "hub-village", frame: "modern", inTopNav: true, inSideNav: true },
  { id: "settings", label: "Cài đặt", icon: "settings", task: "T8", screen: "hub-village", frame: "modern", inTopNav: true },
  { id: "room", label: "Phòng chơi", icon: "map", task: "T4", screen: "hub-village", frame: "modern" },
];

export const routeById = (id: RouteId) => ROUTES.find((r) => r.id === id)!;

function parse(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  return (ROUTES.some((r) => r.id === id) ? id : "home") as RouteId;
}

function parseProfileHash(hash: string): { playerId?: string; tab?: string } {
  const [pathRaw, queryRaw = ""] = hash.replace(/^#\/?/, "").split("?");
  const segments = pathRaw.split("/").filter(Boolean);
  const playerId = segments[0] === "profile" && segments[1] ? decodeURIComponent(segments[1]) : undefined;
  const tab = new URLSearchParams(queryRaw).get("tab") ?? undefined;
  return { playerId, tab };
}

function parseClanHash(hash: string): { tag?: string; tab?: string } {
  const [pathRaw, queryRaw = ""] = hash.replace(/^#\/?/, "").split("?");
  const segments = pathRaw.split("/").filter(Boolean);
  const tag = segments[0] === "clan" && segments[1] ? decodeURIComponent(segments[1]).toUpperCase() : undefined;
  const tab = new URLSearchParams(queryRaw).get("tab") ?? undefined;
  return { tag, tab };
}

/** Tiny hash router: #/login, #/home… (no router library needed for the prototype). */
export function useHashRoute(): [RouteId, (id: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(() => parse(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parse(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = useCallback((id: RouteId) => {
    if (parse(location.hash) === id && location.hash) return;
    location.hash = `#/${id}`;
  }, []);
  return [route, go];
}

/** Read and update `#/profile/<playerId>?tab=<tab>` without a router library. */
export function useProfileRoute() {
  const [state, setState] = useState(() => parseProfileHash(location.hash));
  useEffect(() => {
    const onHash = () => setState(parseProfileHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goProfile = useCallback((playerId?: string, tab?: string) => {
    const base = playerId ? `#/profile/${encodeURIComponent(playerId)}` : "#/profile";
    const next = tab && tab !== "overview" ? `${base}?tab=${encodeURIComponent(tab)}` : base;
    if (location.hash !== next) location.hash = next;
  }, []);

  const setTab = useCallback(
    (tab: string) => {
      goProfile(state.playerId, tab);
    },
    [goProfile, state.playerId],
  );

  return { playerId: state.playerId, tab: state.tab, setTab, goProfile };
}

/** Read and update `#/clan/<TAG>?tab=<tab>` without a router library. */
export function useClanRoute() {
  const [state, setState] = useState(() => parseClanHash(location.hash));
  useEffect(() => {
    const onHash = () => setState(parseClanHash(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goClan = useCallback((tag?: string, tab?: string) => {
    const base = tag ? `#/clan/${encodeURIComponent(tag.toUpperCase())}` : "#/clan";
    const next = tab && tab !== "overview" ? `${base}?tab=${encodeURIComponent(tab)}` : base;
    if (location.hash !== next) location.hash = next;
  }, []);

  const setTab = useCallback(
    (tab: string) => {
      goClan(state.tag, tab);
    },
    [goClan, state.tag],
  );

  return { tag: state.tag, tab: state.tab, setTab, goClan };
}

function parseSettingsTab(hash: string): string | undefined {
  const [, queryRaw = ""] = hash.replace(/^#\/?/, "").split("?");
  return new URLSearchParams(queryRaw).get("tab") ?? undefined;
}

/** Read and update `#/settings?tab=<tab>` without a router library. */
export function useSettingsRoute() {
  const [tab, setState] = useState<string | undefined>(() => parseSettingsTab(location.hash));
  useEffect(() => {
    const onHash = () => setState(parseSettingsTab(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setTab = useCallback((next: string) => {
    const target = `#/settings?tab=${encodeURIComponent(next)}`;
    if (location.hash !== target) location.hash = target;
  }, []);

  return { tab, setTab };
}

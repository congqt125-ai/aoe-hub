import { useCallback, useEffect, useState } from "react";
import {
  AppShell, ConnectionBanner, EmptyState, Icon, LaunchBar, TopBar, useTheme,
  type ConnectionState, type LaunchState, type Player,
} from "../../components";
import { ReviewRailItem } from "./ReviewRail";
import { players } from "../shared/mock";
import { ROUTES, routeById, useHashRoute, type RouteId } from "./routes";
import { useLobbyMock, type LobbyRoom } from "./lobbyMock";
import { defaultSettings, enterConfig, makeRoomSession, type EnterMode, type RoomMockConfig, type RoomSession } from "./roomMock";
import { ProfileProvider } from "./profile";
import { SettingsProvider, useSettings } from "./settingsMock";
import { ClanScreen } from "./screens/ClanScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RoomScreen } from "./screens/RoomScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TournamentScreen } from "./screens/TournamentScreen";

const SESSION_KEY = "aoe-hub-session";
const RETRY_MS = 3000;

function loadSession(): Player | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

/** Prototype app: fake session, hash routes, AppShell around every screen except login. */
export function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

function AppContent() {
  const [route, go] = useHashRoute();
  const theme = useTheme();
  const { exeValid, mockConfig } = useSettings();
  const [user, setUser] = useState<Player | null>(loadSession);
  const [connection, setConnection] = useState<ConnectionState>({ kind: "online" });
  const [launch, setLaunch] = useState<LaunchState>({ kind: "ready", version: "1.0c" });

  // Not signed in → always the login screen; signed in → never stay on login.
  const current: RouteId = !user ? "login" : route === "login" ? "home" : route;
  useEffect(() => {
    if (current !== route) go(current);
  }, [current, route, go]);

  // Screen theme follows the route (login = temple with the logo, hub = village).
  const { setScreen, setFrame } = theme;
  useEffect(() => setScreen(routeById(current).screen), [current, setScreen]);
  // Frame style follows the route too; ?frame=game|lit|modern (review tuner) keeps a fixed style instead.
  useEffect(() => {
    if (!new URLSearchParams(location.search).get("frame")) setFrame(routeById(current).frame);
  }, [current, setFrame]);

  // Lost connection: retry counter ticks until "Thử ngay" (mock reconnect).
  useEffect(() => {
    if (connection.kind !== "offline") return;
    const t = window.setTimeout(() => setConnection({ kind: "offline", attempt: connection.attempt + 1 }), RETRY_MS);
    return () => window.clearTimeout(t);
  }, [connection]);

  const signIn = useCallback((name: string, remember: boolean) => {
    const me: Player = { ...players.me, name };
    setUser(me);
    try {
      if (remember) sessionStorage.setItem(SESSION_KEY, JSON.stringify(me));
    } catch {
      /* private mode: session only lives in memory */
    }
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Lobby data lives here (not in the lobby screen) so rooms created there survive a visit to a room.
  const lobby = useLobbyMock(user ?? players.me);
  // Room: the live session + the mock config it was built from (the room's "Dữ liệu giả" panel edits it;
  // `initial` = how the user entered, for "Đặt lại").
  const [roomState, setRoomState] = useState<{ session: RoomSession; cfg: RoomMockConfig; initial: RoomMockConfig } | null>(null);
  const roomSession = roomState?.session ?? null;
  const setRoomSession = (session: RoomSession) => setRoomState((s) => (s ? { ...s, session } : s));
  const setRoomConfig = (cfg: RoomMockConfig, moderator = lobby.config.moderator) =>
    setRoomState((s) => (s ? { ...s, cfg, session: makeRoomSession(s.session.room, user ?? players.me, cfg, s.session.settings, moderator) } : s));
  const enterRoom = (room: LobbyRoom, mode: EnterMode) => {
    const me = user ?? players.me;
    const cfg = enterConfig(room, me, mode);
    setRoomState({ session: makeRoomSession(room, me, cfg, defaultSettings(room), lobby.config.moderator), cfg, initial: cfg });
    go("room");
  };
  const leaveRoom = () => {
    setRoomState(null);
    go("lobby");
  };
  // #/room without a room (reload, typed URL) → back to the lobby.
  useEffect(() => {
    if (user && current === "room" && !roomSession) go("lobby");
  }, [user, current, roomSession, go]);

  const banner = <ConnectionBanner state={connection} onRetry={() => setConnection({ kind: "online" })} />;

  if (!user) {
    return (
      <LoginScreen
        banner={banner}
        connection={connection}
        onConnectionChange={setConnection}
        onSignedIn={signIn}
      />
    );
  }

  const effectiveLaunch: LaunchState =
    mockConfig.gameRunning && launch.kind === "ready"
      ? { kind: "running", detail: "1.0c" }
      : !exeValid && launch.kind === "ready"
        ? { kind: "error", message: "Không tìm thấy EMPIRESX.EXE — kiểm tra trong Cài đặt" }
        : launch;

  const def = routeById(current);
  return (
    <ProfileProvider me={user}>
    <AppShell
      banner={banner}
      topBar={
        <TopBar
          nav={ROUTES.filter((r) => r.inTopNav).map((r) =>
            // Inside a room the "Sảnh" tab turns into the room-code tag (back to the lobby = "Rời phòng").
            r.id === "lobby" && roomSession
              ? {
                  id: "room",
                  href: "#/room",
                  label: (
                    <span className="flex items-center gap-1.5">
                      Phòng
                      <span className="bg-black/50 px-1.5 py-px font-heading text-sm tabular text-tone-focus bevel-sunken-1">#{roomSession.room.code}</span>
                    </span>
                  ),
                }
              : { id: r.id, label: r.label, href: `#/${r.id}` },
          )}
          activeId={current}
          user={user}
          serverPing={connection.kind === "offline" ? null : 42}
          notificationCount={3}
          accountMenu={[
            { id: "profile", label: "Hồ sơ", icon: "user", onSelect: () => go("profile") },
            { id: "sep", kind: "divider" },
            { id: "logout", label: "Đăng xuất", icon: "logout", danger: true, onSelect: signOut },
          ]}
        />
      }
      launchBar={
        <LaunchBar
          state={effectiveLaunch}
          onReturn={() => setLaunch({ kind: "ready", version: "1.0c" })}
          onRepair={() => (exeValid ? setLaunch({ kind: "ready", version: "1.0c" }) : go("settings"))}
        />
      }
    >
      {current === "home" ? (
        <HomeScreen me={user} lobby={lobby} onEnterRoom={enterRoom} onNavigate={go} />
      ) : current === "lobby" ? (
        <LobbyScreen me={user} mock={lobby} onEnterRoom={enterRoom} />
      ) : current === "room" && roomState ? (
        <RoomScreen
          session={roomState.session}
          me={user}
          moderator={lobby.config.moderator}
          onChange={setRoomSession}
          onLeave={leaveRoom}
          onLaunch={(detail) => {
            setLaunch({ kind: "launching" });
            window.setTimeout(() => setLaunch({ kind: "running", detail }), 1500);
          }}
          mock={{
            config: roomState.cfg,
            initial: roomState.initial,
            onConfig: (cfg) => setRoomConfig(cfg),
            onModerator: (on) => {
              lobby.setConfig({ moderator: on });
              setRoomConfig(roomState.cfg, on);
            },
          }}
        />
      ) : current === "tournament" ? (
        <TournamentScreen
          me={user}
          moderator={lobby.config.moderator}
          onModerator={(on) => lobby.setConfig({ moderator: on })}
          onEnterRoom={enterRoom}
        />
      ) : current === "clan" ? (
        <ClanScreen me={user} />
      ) : current === "profile" ? (
        <ProfileScreen me={user} />
      ) : current === "settings" ? (
        <SettingsScreen />
      ) : (
        <PlaceholderScreen title={def.label} task={def.task} />
      )}
    </AppShell>
    <DevConnectionButton
      offline={connection.kind === "offline"}
      onToggle={() =>
        setConnection((c) => (c.kind === "offline" ? { kind: "online" } : { kind: "offline", attempt: 1 }))
      }
    />
    </ProfileProvider>
  );
}

/** Dev-only card on the right-edge review rail to simulate connection loss outside the UI. */
function DevConnectionButton({ offline, onToggle }: { offline: boolean; onToggle: () => void }) {
  return (
    <ReviewRailItem label="Kết nối" title="Giả lập kết nối">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-white/70">Trạng thái máy chủ</span>
          <span className={offline ? "font-semibold text-danger-on-dark" : "font-semibold text-success-on-dark"}>
            {offline ? "Mất kết nối" : "Đang trực tuyến"}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={
            "w-full border px-2.5 py-1 font-body text-xs font-semibold text-white " +
            (offline ? "border-danger bg-danger/20 text-danger-on-dark" : "border-white/30 bg-white/10 hover:bg-white/20")
          }
        >
          {offline ? "⚡ Kết nối lại" : "⚡ Giả lập mất kết nối"}
        </button>
      </div>
    </ReviewRailItem>
  );
}

/** Screens not built yet: say which Templates task builds them. */
function PlaceholderScreen({ title, task }: { title: string; task: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="tone-screen w-[min(460px,100%)] bg-black/60 bevel-raised-2">
        <EmptyState
          title={title}
          description={`Màn này làm ở việc ${task} (PLAN.md → Templates — 11 việc).`}
          art={{ set: "building:greek", frame: 4 }}
        />
        <p className="m-0 flex items-center justify-center gap-1.5 pb-5 font-body text-sm text-tone-text/70">
          <Icon name="info" size={12} /> Đổi màn bằng thanh trên.
        </p>
      </div>
    </div>
  );
}

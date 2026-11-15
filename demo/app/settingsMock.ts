import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const SETTINGS_STORAGE_KEY = "aoe-hub.settings.v1";

export type ResolutionOption =
  | "800x600"
  | "1024x768"
  | "1280x1024"
  | "1280x720"
  | "1366x768"
  | "1600x900"
  | "1920x1080";

export type DisplayMode = "fullscreen" | "windowed" | "borderless";
export type MicMode = "auto" | "ptt";

export interface Settings {
  game: {
    exePath: string;
    resolution: ResolutionOption;
    displayMode: DisplayMode;
    keepAspect: boolean;
    vsync: boolean;
  };
  network: {
    relayUrl: string;
    turnEnabled: boolean;
  };
  voice: {
    inputDevice: string;
    outputDevice: string;
    volume: number;
    micMode: MicMode;
    sensitivityDb: number;
  };
  hotkeys: {
    pushToTalk: string;
    toggleMic: string;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  game: {
    exePath: "C:\\SuperAoE\\EMPIRESX.EXE",
    resolution: "1600x900",
    displayMode: "borderless",
    keepAspect: true,
    vsync: true,
  },
  network: {
    relayUrl: "https://superaqe.com",
    turnEnabled: false,
  },
  voice: {
    inputDevice: "mic-default",
    outputDevice: "spk-default",
    volume: 100,
    micMode: "auto",
    sensitivityDb: -35,
  },
  hotkeys: {
    pushToTalk: "F9",
    toggleMic: "",
  },
};

export const RESOLUTION_OPTIONS: { value: ResolutionOption; label: string }[] = [
  { value: "800x600", label: "800 × 600" },
  { value: "1024x768", label: "1024 × 768" },
  { value: "1280x1024", label: "1280 × 1024" },
  { value: "1280x720", label: "1280 × 720" },
  { value: "1366x768", label: "1366 × 768" },
  { value: "1600x900", label: "1600 × 900" },
  { value: "1920x1080", label: "1920 × 1080" },
];

export const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string }[] = [
  { value: "fullscreen", label: "Toàn màn hình" },
  { value: "windowed", label: "Cửa sổ" },
  { value: "borderless", label: "Cửa sổ không viền" },
];

export const MOCK_INPUT_DEVICES = [
  { value: "mic-default", label: "Mặc định hệ thống (Realtek Mic)" },
  { value: "mic-headset", label: "Tai nghe HyperX Cloud II" },
  { value: "mic-usb", label: "Micro USB Condenser" },
];

export const MOCK_OUTPUT_DEVICES = [
  { value: "spk-default", label: "Mặc định hệ thống (Loa ngoài)" },
  { value: "spk-headset", label: "Tai nghe HyperX Cloud II" },
  { value: "spk-hdmi", label: "Màn hình HDMI Audio" },
];

export type NetworkScenario = "good" | "slow" | "weak" | "error";
export type TurnScenario = "eligible" | "cgnat" | "low-ram" | "battery";
export type MicScenario = "available" | "no-device" | "blocked";
export type ExePathScenario = "valid" | "invalid";

export interface SettingsMockConfig {
  networkScenario: NetworkScenario;
  turnScenario: TurnScenario;
  turnActivePeers: number;
  micScenario: MicScenario;
  exePathScenario: ExePathScenario;
  gameRunning: boolean;
  simulateSaveError: boolean;
}

export const DEFAULT_SETTINGS_MOCK: SettingsMockConfig = {
  networkScenario: "good",
  turnScenario: "eligible",
  turnActivePeers: 2,
  micScenario: "available",
  exePathScenario: "valid",
  gameRunning: false,
  simulateSaveError: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      game: { ...DEFAULT_SETTINGS.game, ...parsed.game },
      network: { ...DEFAULT_SETTINGS.network, ...parsed.network },
      voice: { ...DEFAULT_SETTINGS.voice, ...parsed.voice },
      hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...parsed.hotkeys },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: Settings, simulateError = false): boolean {
  if (simulateError) return false;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    /* ignore storage errors in restricted environments */
  }
}

export function validateExePath(path: string, scenario: ExePathScenario = "valid"): string | null {
  if (scenario === "invalid") return "Không tìm thấy EMPIRESX.EXE ở đường dẫn này";
  const trimmed = path.trim();
  if (!/empriesx\.exe$/i.test(trimmed) && !/empiresx\.exe$/i.test(trimmed)) {
    return "Không tìm thấy EMPIRESX.EXE ở đường dẫn này";
  }
  return null;
}

export function validateRelayUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return "Địa chỉ máy chủ phải bắt đầu bằng http:// hoặc https:// và hợp lệ.";
  }
  return null;
}

const RESERVED_GAME_KEYS = new Set(["F3", "F4", "F10", "F11"]);

export function validateHotkey(key: string, otherKey: string): string | null {
  if (!key) return null;
  if (RESERVED_GAME_KEYS.has(key)) {
    return "Phím này được game dành riêng (F3, F4, F10, F11).";
  }
  if (/^[A-Z0-9]$/.test(key)) {
    return "Chữ hoặc số đơn lẻ là phím tắt trong game — hãy kèm Ctrl, Alt hoặc Shift.";
  }
  if (/^Alt\+[1-9]$/.test(key)) {
    return "Alt+1…9 dùng để chuyển màn hình trong hub.";
  }
  if (key === "Alt+M") {
    return "Alt+M dùng để mở bảng Dữ liệu giả.";
  }
  if (otherKey && key === otherKey) {
    return "Phím này đã được gán cho hành động khác.";
  }
  return null;
}

export interface NetworkTestResult {
  pingMs: number;
  natType: string;
  upnp: boolean;
  publicIp: string;
  verdict: "Tốt" | "Hơi chậm" | "Yếu";
  badgeVariant: "success" | "warning" | "danger";
  hint: string;
}

export function runNetworkTest(scenario: NetworkScenario): NetworkTestResult | null {
  switch (scenario) {
    case "good":
      return {
        pingMs: 28,
        natType: "Open / Full Cone",
        upnp: true,
        publicIp: "113.161.84.22",
        verdict: "Tốt",
        badgeVariant: "success",
        hint: "Kết nối ổn định, đủ chuẩn làm chủ phòng 8 người.",
      };
    case "slow":
      return {
        pingMs: 124,
        natType: "Restricted NAT",
        upnp: true,
        publicIp: "14.232.19.105",
        verdict: "Hơi chậm",
        badgeVariant: "warning",
        hint: "Nên đóng ứng dụng tải nền hoặc nối dây LAN để giảm trễ.",
      };
    case "weak":
      return {
        pingMs: 286,
        natType: "Symmetric NAT (CGNAT)",
        upnp: false,
        publicIp: "21.45.150.82",
        verdict: "Yếu",
        badgeVariant: "danger",
        hint: "Mạng trễ cao và bị NAT chặn — trận 8 người dễ bị khựng.",
      };
    case "error":
      return null;
  }
}

export interface TurnCondition {
  label: string;
  ok: boolean;
}

export function getTurnStatus(scenario: TurnScenario, activePeers: number): {
  eligible: boolean;
  conditions: TurnCondition[];
  reason?: string;
  activePeers: number;
  bandwidthKbps: number;
} {
  const cpuOk = true;
  const ramOk = scenario !== "low-ram";
  const powerOk = scenario !== "battery";
  const publicOk = scenario !== "cgnat";

  const conditions: TurnCondition[] = [
    { label: "CPU ≥ 4 nhân (8 nhân)", ok: cpuOk },
    { label: ramOk ? "RAM ≥ 4 GB (16 GB)" : "RAM ≥ 4 GB (còn 2,8 GB khả dụng)", ok: ramOk },
    { label: powerOk ? "Đang cắm điện" : "Đang chạy pin (62%)", ok: powerOk },
    {
      label: publicOk
        ? "Nhận được kết nối từ ngoài (UPnP mở cổng)"
        : "Nhận được kết nối từ ngoài (router thấy 21.45.150.82)",
      ok: publicOk,
    },
  ];

  const reason =
    scenario === "cgnat"
      ? "Không làm trạm được: mạng qua NAT của nhà mạng (router thấy 21.45.150.82)."
      : scenario === "low-ram"
        ? "Không làm trạm được: bộ nhớ RAM khả dụng dưới 4 GB."
        : scenario === "battery"
          ? "Không làm trạm được: máy đang chạy pin, chỉ hoạt động khi cắm điện."
          : undefined;

  const eligible = cpuOk && ramOk && powerOk && publicOk;
  return {
    eligible,
    conditions,
    reason,
    activePeers: eligible ? activePeers : 0,
    bandwidthKbps: eligible ? activePeers * 14 : 0,
  };
}

export type SaveIndicator =
  | { kind: "idle" }
  | { kind: "saved" }
  | { kind: "applied-running" }
  | { kind: "error"; message: string };

interface SettingsContextValue {
  settings: Settings;
  saveIndicator: SaveIndicator;
  mockConfig: SettingsMockConfig;
  setMockConfig: (patch: Partial<SettingsMockConfig>) => void;
  resetMockConfig: () => void;
  updateSettings: (
    updater: (prev: Settings) => Settings,
    options?: { liveGameApply?: boolean },
  ) => boolean;
  resetTab: (tab: "game" | "network" | "voice" | "hotkeys") => void;
  exeValid: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [mockConfig, setMockState] = useState<SettingsMockConfig>(DEFAULT_SETTINGS_MOCK);
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicator>({ kind: "idle" });
  const fadeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(fadeTimer.current), []);

  const flashIndicator = useCallback((next: SaveIndicator) => {
    window.clearTimeout(fadeTimer.current);
    setSaveIndicator(next);
    if (next.kind === "saved" || next.kind === "applied-running") {
      fadeTimer.current = window.setTimeout(() => setSaveIndicator({ kind: "idle" }), 1500);
    }
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: Settings) => Settings, options?: { liveGameApply?: boolean }) => {
      const nextState = updater(settings);
      setSettings(nextState);
      const ok = saveSettings(nextState, mockConfig.simulateSaveError);
      if (!ok) {
        flashIndicator({ kind: "error", message: "Không lưu được cài đặt" });
        return false;
      }
      if (options?.liveGameApply && mockConfig.gameRunning) {
        flashIndicator({ kind: "applied-running" });
      } else {
        flashIndicator({ kind: "saved" });
      }
      return true;
    },
    [settings, mockConfig.simulateSaveError, mockConfig.gameRunning, flashIndicator],
  );

  const resetTab = useCallback(
    (tab: "game" | "network" | "voice" | "hotkeys") => {
      updateSettings((prev) => ({
        ...prev,
        [tab]: structuredClone(DEFAULT_SETTINGS[tab]),
      }));
    },
    [updateSettings],
  );

  const setMockConfig = useCallback((patch: Partial<SettingsMockConfig>) => {
    setMockState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetMockConfig = useCallback(() => {
    clearStoredSettings();
    setSettings(structuredClone(DEFAULT_SETTINGS));
    setMockState(DEFAULT_SETTINGS_MOCK);
    setSaveIndicator({ kind: "idle" });
  }, []);

  const exeValid = useMemo(
    () => validateExePath(settings.game.exePath, mockConfig.exePathScenario) === null,
    [settings.game.exePath, mockConfig.exePathScenario],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      saveIndicator,
      mockConfig,
      setMockConfig,
      resetMockConfig,
      updateSettings,
      resetTab,
      exeValid,
    }),
    [settings, saveIndicator, mockConfig, setMockConfig, resetMockConfig, updateSettings, resetTab, exeValid],
  );

  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

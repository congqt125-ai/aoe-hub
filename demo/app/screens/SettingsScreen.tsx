import { useCallback, useEffect, useId, useState } from "react";
import {
  Button, Dialog, Icon, Surface, TabPanel, Tabs, Toast,
  type IconName, type ToastData,
} from "../../../components";
import { MockCheck, MockChoice, MockGroup, MockShell, MockSlider } from "../MockPanel";
import { useSettingsRoute } from "../routes";
import {
  useSettings,
  type ExePathScenario,
  type MicScenario,
  type NetworkScenario,
  type TurnScenario,
} from "../settingsMock";
import { LINE, PanelFooter, PanelTitle } from "./panel";
import { AppearanceTab } from "./settings/AppearanceTab";
import { GameTab } from "./settings/GameTab";
import { HotkeysTab } from "./settings/HotkeysTab";
import { NetworkTab } from "./settings/NetworkTab";
import { VoiceTab } from "./settings/VoiceTab";

export type SettingsTabId = "appearance" | "game" | "network" | "voice" | "hotkeys";

interface SettingsTabDef {
  id: SettingsTabId;
  label: string;
  icon: IconName;
}

const SETTINGS_TABS: SettingsTabDef[] = [
  { id: "appearance", label: "Giao diện", icon: "eye" },
  { id: "game", label: "Game", icon: "sword" },
  { id: "network", label: "Mạng", icon: "globe" },
  { id: "voice", label: "Voice chat", icon: "volume" },
  { id: "hotkeys", label: "Phím tắt", icon: "settings" },
];

function isSettingsTab(value: string | undefined): value is SettingsTabId {
  return SETTINGS_TABS.some((t) => t.id === value);
}

/**
 * T8 — Trang Cài đặt (§1–§4).
 * Fixed 1600x900 shell without SideNav: vertical tabs on the left (~240px), scrollable body + footer on the right.
 */
export function SettingsScreen() {
  const idBase = useId();
  const { tab: rawTab, setTab } = useSettingsRoute();
  const activeTab: SettingsTabId = isSettingsTab(rawTab) ? rawTab : "game";
  const activeDef = SETTINGS_TABS.find((t) => t.id === activeTab)!;

  const { saveIndicator, mockConfig, setMockConfig, resetMockConfig, resetTab } = useSettings();

  const [errorTabs, setErrorTabs] = useState<Set<SettingsTabId>>(() => new Set());
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [panelStyle, setPanelStyle] = useState<"plain" | "wood">("plain");

  const setTabError = useCallback((tabId: SettingsTabId, hasError: boolean) => {
    setErrorTabs((prev) => {
      if (prev.has(tabId) === hasError) return prev;
      const next = new Set(prev);
      if (hasError) next.add(tabId);
      else next.delete(tabId);
      return next;
    });
  }, []);

  const onGameError = useCallback((err: boolean) => setTabError("game", err), [setTabError]);
  const onNetworkError = useCallback((err: boolean) => setTabError("network", err), [setTabError]);
  const onHotkeysError = useCallback((err: boolean) => setTabError("hotkeys", err), [setTabError]);

  useEffect(() => {
    if (saveIndicator.kind === "error") {
      setToast({
        id: "settings-save-error",
        kind: "error",
        title: saveIndicator.message,
        description: "Không thể ghi vào bộ nhớ trình duyệt (localStorage).",
      });
    }
  }, [saveIndicator]);

  const tabItems = SETTINGS_TABS.map((t) => ({
    value: t.id,
    icon: <Icon name={t.icon} size={16} />,
    label: (
      <span className="flex flex-1 items-center justify-between gap-2">
        <span>{t.label}</span>
        {errorTabs.has(t.id) && (
          <span
            aria-label="Có lỗi cần sửa"
            className="inline-block h-2 w-2 rounded-full bg-danger"
          />
        )}
      </span>
    ),
  }));

  const footerText =
    saveIndicator.kind === "saved" ? (
      <span className="text-success-on-dark transition-opacity duration-base">Đã lưu</span>
    ) : saveIndicator.kind === "applied-running" ? (
      <span className="text-success-on-dark transition-opacity duration-base">
        Đã áp dụng cho game đang chạy
      </span>
    ) : (
      <span className="text-tone-text/60">Thay đổi được lưu tự động trên máy này</span>
    );

  const panelBody = (
    <>
      {/* Left navigation rail (~240px) */}
      <aside className="flex w-[240px] shrink-0 flex-col bg-black/20">
        <PanelTitle>Cài đặt</PanelTitle>
        <div className={`h-px shrink-0 ${LINE}`} />
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <Tabs
            label="Nhóm cài đặt"
            variant="vertical"
            size="md"
            idBase={idBase}
            items={tabItems}
            value={activeTab}
            onChange={(next) => setTab(next)}
          />
        </div>
      </aside>

      <div className={`w-px shrink-0 ${LINE}`} />

      {/* Right content column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PanelTitle>{activeDef.label}</PanelTitle>
        <div className={`h-px shrink-0 ${LINE}`} />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto w-full max-w-[880px]">
            <TabPanel idBase={idBase} value={activeTab}>
              {activeTab === "appearance" ? (
                <AppearanceTab />
              ) : activeTab === "game" ? (
                <GameTab onErrorChange={onGameError} />
              ) : activeTab === "network" ? (
                <NetworkTab onErrorChange={onNetworkError} />
              ) : activeTab === "voice" ? (
                <VoiceTab onGoHotkeys={() => setTab("hotkeys")} />
              ) : (
                <HotkeysTab onErrorChange={onHotkeysError} />
              )}
            </TabPanel>
          </div>
        </div>

        {activeTab !== "appearance" && (
          <PanelFooter>
            <span role="status" className="flex-1 px-1">
              {footerText}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
            >
              Khôi phục mặc định
            </Button>
          </PanelFooter>
        )}
      </div>
    </>
  );

  return (
    <div className="tone-screen flex h-full min-h-0 flex-col">
      {panelStyle === "wood" ? (
        <Surface className="flex min-h-0 flex-1 overflow-hidden bevel-raised-2">
          {panelBody}
        </Surface>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-black/55 bevel-raised-2">
          {panelBody}
        </div>
      )}

      <Dialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Khôi phục mặc định"
        description={`Đặt lại toàn bộ tuỳ chọn trong mục “${activeDef.label}” về giá trị ban đầu?`}
        size="sm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmResetOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (activeTab !== "appearance") resetTab(activeTab);
                setConfirmResetOpen(false);
              }}
            >
              Khôi phục
            </Button>
          </>
        }
      >
        <p className="m-0 font-body text-md text-tone-text/85">
          Các mục cài đặt khác không bị ảnh hưởng.
        </p>
      </Dialog>

      <MockShell
        title="Dữ liệu giả — Cài đặt"
        onReset={() => {
          setPanelStyle("plain");
          resetMockConfig();
        }}
      >
        <MockGroup>Giao diện trang</MockGroup>
        <MockChoice<"plain" | "wood">
          label="Kiểu nền panel"
          value={panelStyle}
          options={[
            { value: "plain", label: "Thường (như trang khác)" },
            { value: "wood", label: "Gỗ (Surface)" },
          ]}
          onChange={setPanelStyle}
        />

        <MockGroup>Game</MockGroup>
        <MockChoice<ExePathScenario>
          label="Đường dẫn game"
          value={mockConfig.exePathScenario}
          options={[
            { value: "valid", label: "Hợp lệ" },
            { value: "invalid", label: "Không tìm thấy" },
          ]}
          onChange={(exePathScenario) => setMockConfig({ exePathScenario })}
        />
        <MockCheck
          label="Game đang chạy"
          checked={mockConfig.gameRunning}
          onChange={(gameRunning) => setMockConfig({ gameRunning })}
        />

        <MockGroup>Kiểm tra mạng</MockGroup>
        <MockChoice<NetworkScenario>
          label="Kết quả kiểm tra mạng"
          value={mockConfig.networkScenario}
          options={[
            { value: "good", label: "Tốt" },
            { value: "slow", label: "Hơi chậm" },
            { value: "weak", label: "Yếu" },
            { value: "error", label: "Lỗi" },
          ]}
          onChange={(networkScenario) => setMockConfig({ networkScenario })}
        />

        <MockGroup>Trạm trung chuyển (TURN)</MockGroup>
        <MockChoice<TurnScenario>
          label="Điều kiện máy"
          value={mockConfig.turnScenario}
          options={[
            { value: "eligible", label: "Đủ điều kiện" },
            { value: "cgnat", label: "NAT nhà mạng" },
            { value: "low-ram", label: "RAM thấp" },
            { value: "battery", label: "Chạy pin" },
          ]}
          onChange={(turnScenario) => setMockConfig({ turnScenario })}
        />
        <MockSlider
          label="Người đi qua"
          min={0}
          max={8}
          value={mockConfig.turnActivePeers}
          changed={mockConfig.turnActivePeers !== 2}
          onChange={(turnActivePeers) => setMockConfig({ turnActivePeers })}
        />

        <MockGroup>Voice chat</MockGroup>
        <MockChoice<MicScenario>
          label="Trạng thái mic"
          value={mockConfig.micScenario}
          options={[
            { value: "available", label: "Có mic" },
            { value: "no-device", label: "Không có thiết bị" },
            { value: "blocked", label: "Bị chặn quyền" },
          ]}
          onChange={(micScenario) => setMockConfig({ micScenario })}
        />

        <MockGroup>Lưu trữ</MockGroup>
        <MockCheck
          label="Lưu bị lỗi (localStorage hỏng)"
          checked={mockConfig.simulateSaveError}
          onChange={(simulateSaveError) => setMockConfig({ simulateSaveError })}
        />
      </MockShell>

      {toast && (
        <div className="fixed bottom-10 right-4 z-toast">
          <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useId, useState } from "react";
import {
  Button, Checkbox, Dialog, Icon, Input, Select, Tooltip,
} from "../../../../components";
import {
  DISPLAY_MODE_OPTIONS,
  RESOLUTION_OPTIONS,
  useSettings,
  validateExePath,
  type DisplayMode,
  type ResolutionOption,
} from "../../settingsMock";
import { SettingGroup, SettingRow } from "./SettingRow";

export interface GameTabProps {
  onErrorChange?: (hasError: boolean) => void;
}

const RUNNING_LOCK_REASON = "Đóng game trước khi đổi đường dẫn";
const WINDOWED_ASPECT_REASON = "Không áp dụng ở chế độ Cửa sổ";

/** §3.3 Tab Game — changes apply immediately, even while the game is running. */
export function GameTab({ onErrorChange }: GameTabProps) {
  const idBase = useId();
  const exeId = `${idBase}-exe`;
  const resId = `${idBase}-res`;
  const modeId = `${idBase}-mode`;
  const aspectId = `${idBase}-aspect`;
  const vsyncId = `${idBase}-vsync`;

  const { settings, mockConfig, updateSettings } = useSettings();
  const [exeDraft, setExeDraft] = useState(settings.game.exePath);
  const [exeError, setExeError] = useState<string | null>(() =>
    validateExePath(settings.game.exePath, mockConfig.exePathScenario),
  );
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseInput, setBrowseInput] = useState(settings.game.exePath);

  // Sync draft when settings reset or change externally
  useEffect(() => {
    setExeDraft(settings.game.exePath);
    setExeError(validateExePath(settings.game.exePath, mockConfig.exePathScenario));
  }, [settings.game.exePath, mockConfig.exePathScenario]);

  useEffect(() => {
    onErrorChange?.(exeError !== null);
  }, [exeError, onErrorChange]);

  const commitExePath = (candidate: string) => {
    const err = validateExePath(candidate, mockConfig.exePathScenario);
    setExeError(err);
    if (!err) {
      updateSettings((prev) => ({
        ...prev,
        game: { ...prev.game, exePath: candidate.trim() },
      }));
    }
  };

  const gameRunning = mockConfig.gameRunning;
  const windowed = settings.game.displayMode === "windowed";

  const pathControls = (
    <div className="flex items-center gap-2">
      <Input
        id={exeId}
        wrapperClassName="w-72"
        value={exeDraft}
        disabled={gameRunning}
        invalid={exeError !== null}
        onChange={(e) => {
          setExeDraft(e.target.value);
          if (exeError) {
            setExeError(validateExePath(e.target.value, mockConfig.exePathScenario));
          }
        }}
        onBlur={() => commitExePath(exeDraft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitExePath(exeDraft);
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        disabled={gameRunning}
        onClick={() => {
          setBrowseInput(exeDraft);
          setBrowseOpen(true);
        }}
      >
        Chọn…
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 px-3.5 py-2.5 font-body text-sm text-tone-text/90 bevel-sunken-1">
        <span className="flex items-center gap-2">
          <Icon name="info" size={16} className="text-tone-state" />
          <span>Đổi ngay, kể cả khi game đang chạy.</span>
        </span>
        <span className="text-tone-text/75">
          Phiên bản launcher <strong className="text-tone-state">1.0.40</strong> · phiên bản game{" "}
          <strong className="text-tone-state">1.0c</strong>
        </span>
      </div>

      <SettingGroup
        title="Thư mục & tệp chạy game"
        description="Vị trí tệp thực thi Age of Empires trên máy."
      >
        <SettingRow
          label="Đường dẫn game (EMPIRESX.EXE)"
          htmlFor={exeId}
          disabled={gameRunning}
          error={exeError ?? undefined}
          description={
            exeError === null ? "✓ Tìm thấy game 1.0c" : undefined
          }
        >
          {gameRunning ? (
            <Tooltip content={RUNNING_LOCK_REASON}>{pathControls}</Tooltip>
          ) : (
            pathControls
          )}
        </SettingRow>
      </SettingGroup>

      <SettingGroup
        title="Hiển thị trong game"
        description="Cấu hình khung hình khi vào trận."
      >
        <SettingRow
          label="Độ phân giải"
          htmlFor={resId}
          description="1024 × 768 và 1280 × 1024 dùng giao diện 4:3 (chơi chung bình thường với người dùng độ phân giải khác)."
        >
          <Select<ResolutionOption>
            id={resId}
            className="w-56"
            controlSet="scr2"
            value={settings.game.resolution}
            options={RESOLUTION_OPTIONS}
            onChange={(resolution) =>
              updateSettings(
                (prev) => ({ ...prev, game: { ...prev.game, resolution } }),
                { liveGameApply: true },
              )
            }
          />
        </SettingRow>

        <SettingRow label="Chế độ hiển thị" htmlFor={modeId}>
          <Select<DisplayMode>
            id={modeId}
            className="w-56"
            controlSet="scr2"
            value={settings.game.displayMode}
            options={DISPLAY_MODE_OPTIONS}
            onChange={(displayMode) =>
              updateSettings(
                (prev) => ({ ...prev, game: { ...prev.game, displayMode } }),
                { liveGameApply: true },
              )
            }
          />
        </SettingRow>

        <SettingRow
          label="Giữ đúng tỉ lệ hình"
          htmlFor={aspectId}
          disabled={windowed}
          description="Không kéo giãn hình khi độ phân giải khác tỉ lệ màn hình."
        >
          {windowed ? (
            <Tooltip content={WINDOWED_ASPECT_REASON}>
              <Checkbox
                id={aspectId}
                variant="drawn"
                size={32}
                controlSet="scr2"
                checked={settings.game.keepAspect}
                disabled
                onChange={() => {}}
              />
            </Tooltip>
          ) : (
            <Checkbox
              id={aspectId}
              variant="drawn"
              size={32}
              controlSet="scr2"
              checked={settings.game.keepAspect}
              onChange={(e) =>
                updateSettings(
                  (prev) => ({
                    ...prev,
                    game: { ...prev.game, keepAspect: e.target.checked },
                  }),
                  { liveGameApply: true },
                )
              }
            />
          )}
        </SettingRow>

        <SettingRow
          label="Đồng bộ dọc (VSync)"
          htmlFor={vsyncId}
          description="Chống xé hình."
        >
          <Checkbox
            id={vsyncId}
            variant="drawn"
            size={32}
            controlSet="scr2"
            checked={settings.game.vsync}
            onChange={(e) =>
              updateSettings(
                (prev) => ({
                  ...prev,
                  game: { ...prev.game, vsync: e.target.checked },
                }),
                { liveGameApply: true },
              )
            }
          />
        </SettingRow>
      </SettingGroup>

      <div className="flex flex-col gap-1.5 bg-black/30 px-4 py-3 font-body text-sm text-tone-text/75 bevel-sunken-1">
        <p className="m-0">
          Kích thước bản đồ tự chọn theo số người chơi trong phòng: 1–4 người Large, 5–6 Huge, 7–8 Gigantic; chủ phòng vẫn đổi được trong game.
        </p>
        <p className="m-0 text-tone-text/60">
          Gợi ý: Đổi nhanh độ phân giải bằng nút trong phòng chơi.
        </p>
      </div>

      <Dialog
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        title="Chọn tệp EMPIRESX.EXE"
        description="Mô phỏng hộp thoại chọn tệp trên máy."
        size="sm"
        onSubmit={(e) => {
          e.preventDefault();
          setExeDraft(browseInput);
          commitExePath(browseInput);
          setBrowseOpen(false);
        }}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBrowseOpen(false)}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit">
              Xác nhận
            </Button>
          </>
        }
      >
        <Input
          aria-label="Đường dẫn EMPIRESX.EXE"
          value={browseInput}
          onChange={(e) => setBrowseInput(e.target.value)}
        />
      </Dialog>
    </div>
  );
}


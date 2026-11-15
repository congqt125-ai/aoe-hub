import { useEffect, useId, useState } from "react";
import { Button, Kbd } from "../../../../components";
import {
  DEFAULT_SETTINGS,
  useSettings,
  validateHotkey,
} from "../../settingsMock";
import { KeyCaptureInput } from "./KeyCaptureInput";
import { SettingGroup, SettingRow } from "./SettingRow";

export interface HotkeysTabProps {
  onErrorChange?: (hasError: boolean) => void;
}

const FIXED_HUB_HOTKEYS = [
  { keys: ["Alt", "1…9"], desc: "Chuyển nhanh màn hình trong hub" },
  { keys: ["Esc"], desc: "Đóng hộp thoại hoặc huỷ thao tác" },
  { keys: ["Enter"], desc: "Gửi tin nhắn trong khung chat" },
];

/** §3.6 Tab Phím tắt — voice hotkeys with conflict validation and read-only hub shortcuts. */
export function HotkeysTab({ onErrorChange }: HotkeysTabProps) {
  const idBase = useId();
  const pttId = `${idBase}-ptt`;
  const toggleId = `${idBase}-toggle`;

  const { settings, updateSettings } = useSettings();
  const [pttDraft, setPttDraft] = useState(settings.hotkeys.pushToTalk);
  const [toggleDraft, setToggleDraft] = useState(settings.hotkeys.toggleMic);
  const [pttError, setPttError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    setPttDraft(settings.hotkeys.pushToTalk);
    setToggleDraft(settings.hotkeys.toggleMic);
    setPttError(null);
    setToggleError(null);
  }, [settings.hotkeys.pushToTalk, settings.hotkeys.toggleMic]);

  useEffect(() => {
    onErrorChange?.(pttError !== null || toggleError !== null);
  }, [pttError, toggleError, onErrorChange]);

  const handlePtt = (next: string) => {
    setPttDraft(next);
    const err = validateHotkey(next, settings.hotkeys.toggleMic);
    setPttError(err);
    if (!err) {
      updateSettings((prev) => ({
        ...prev,
        hotkeys: { ...prev.hotkeys, pushToTalk: next },
      }));
    }
  };

  const handleToggle = (next: string) => {
    setToggleDraft(next);
    const err = validateHotkey(next, settings.hotkeys.pushToTalk);
    setToggleError(err);
    if (!err) {
      updateSettings((prev) => ({
        ...prev,
        hotkeys: { ...prev.hotkeys, toggleMic: next },
      }));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SettingGroup
        title="Phím tắt Voice chat"
        description="Khi bạn ở trong phòng, phím này được giữ cho voice chat: game không nhận phím đó nữa (kể cả lúc game toàn màn hình)."
      >
        <SettingRow
          label="Nhấn để nói"
          htmlFor={pttId}
          error={pttError ?? undefined}
          description="Bấm vào ô rồi nhấn phím muốn gán (Esc để huỷ)."
        >
          <div className="flex items-center gap-2">
            <KeyCaptureInput
              id={pttId}
              aria-label="Phím Nhấn để nói"
              value={pttDraft}
              invalid={pttError !== null}
              onChange={handlePtt}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePtt(DEFAULT_SETTINGS.hotkeys.pushToTalk)}
            >
              Mặc định
            </Button>
          </div>
        </SettingRow>

        <SettingRow
          label="Bật / tắt mic"
          htmlFor={toggleId}
          error={toggleError ?? undefined}
          description="Nhấn Backspace hoặc Delete khi đang chờ phím để xoá."
        >
          <KeyCaptureInput
            id={toggleId}
            aria-label="Phím Bật / tắt mic"
            value={toggleDraft}
            invalid={toggleError !== null}
            allowClear
            onChange={handleToggle}
          />
        </SettingRow>
      </SettingGroup>

      <SettingGroup
        title="Phím tắt cố định của hub"
        description="Các phím hệ thống không thể thay đổi hoặc gán trùng."
      >
        <div className="divide-y divide-white/10">
          {FIXED_HUB_HOTKEYS.map((item) => (
            <div
              key={item.desc}
              className="flex items-center justify-between gap-4 px-4 py-2.5 font-body text-sm"
            >
              <span className="text-tone-text/85">{item.desc}</span>
              <span className="inline-flex items-center gap-1">
                {item.keys.map((k, idx) => (
                  <span key={k} className="inline-flex items-center gap-1">
                    {idx > 0 && <span className="text-tone-text/50">+</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </SettingGroup>
    </div>
  );
}


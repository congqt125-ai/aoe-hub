import { useEffect, useId, useRef, useState } from "react";
import {
  Button, EmptyState, Icon, Kbd, RadioGroup, Select, Slider, Tooltip,
} from "../../../../components";
import {
  MOCK_INPUT_DEVICES,
  MOCK_OUTPUT_DEVICES,
  useSettings,
  type MicMode,
} from "../../settingsMock";
import { MicLevelMeter } from "./MicLevelMeter";
import { SettingGroup, SettingRow } from "./SettingRow";

export interface VoiceTabProps {
  onGoHotkeys: () => void;
}

const PTT_SENSITIVITY_REASON = "Chỉ dùng khi chọn chế độ Tự động (theo độ nhạy).";

/** §3.5 Tab Voice chat — audio devices, volume, mic mode, sensitivity meter, and mic test. */
export function VoiceTab({ onGoHotkeys }: VoiceTabProps) {
  const idBase = useId();
  const inId = `${idBase}-in`;
  const outId = `${idBase}-out`;

  const { settings, mockConfig, updateSettings } = useSettings();
  const [testing, setTesting] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [playingBack, setPlayingBack] = useState(false);
  const [levelDb, setLevelDb] = useState(-52);
  const tickRef = useRef<number | undefined>(undefined);
  const stopRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      window.clearInterval(tickRef.current);
      window.clearTimeout(stopRef.current);
    };
  }, []);

  const stopTest = () => {
    window.clearInterval(tickRef.current);
    window.clearTimeout(stopRef.current);
    setTesting(false);
    setLevelDb(-52);
  };

  const startTest = () => {
    stopTest();
    setPlaybackReady(false);
    setPlayingBack(false);
    setTesting(true);
    let step = 0;
    tickRef.current = window.setInterval(() => {
      step += 1;
      // Oscillate between -54 dB and -12 dB to simulate speech
      const wave = -34 + Math.sin(step * 0.9) * 16 + (step % 3) * 2;
      setLevelDb(Math.round(Math.max(-60, Math.min(-2, wave))));
    }, 150);

    stopRef.current = window.setTimeout(() => {
      window.clearInterval(tickRef.current);
      setTesting(false);
      setLevelDb(-52);
      setPlaybackReady(true);
    }, 5000);
  };

  const startPlayback = () => {
    setPlayingBack(true);
    window.clearTimeout(stopRef.current);
    stopRef.current = window.setTimeout(() => setPlayingBack(false), 2500);
  };

  const micUnavailable = mockConfig.micScenario !== "available";
  const isPtt = settings.voice.micMode === "ptt";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5 bg-black/40 px-3.5 py-2.5 font-body text-sm text-tone-text/90 bevel-sunken-1">
        <Icon name="info" size={16} className="mt-0.5 text-tone-state" />
        <span>
          Nói chuyện với những người ngồi ghế trong phòng, nối thẳng máy với máy (không qua máy chủ). Bật mic bằng nút{" "}
          <strong className="text-tone-state">Mic</strong> cạnh ô chat trong phòng; khán giả và người đứng không có voice.
        </span>
      </div>

      <SettingGroup title="Loa & âm lượng" description="Thiết bị phát âm thanh và mức nghe đồng đội.">
        <SettingRow label="Thiết bị ra (loa)" htmlFor={outId}>
          <Select
            id={outId}
            className="w-72"
            controlSet="scr2"
            value={settings.voice.outputDevice}
            options={MOCK_OUTPUT_DEVICES}
            onChange={(outputDevice) =>
              updateSettings((prev) => ({
                ...prev,
                voice: { ...prev.voice, outputDevice },
              }))
            }
          />
        </SettingRow>

        <div className="px-4 py-3">
          <Slider
            label="Âm lượng nghe người khác"
            min={0}
            max={200}
            step={5}
            value={settings.voice.volume}
            format={(v) => `${v}%`}
            onChange={(volume) =>
              updateSettings((prev) => ({
                ...prev,
                voice: { ...prev.voice, volume },
              }))
            }
          />
        </div>
      </SettingGroup>

      <SettingGroup title="Micro" description="Thiết bị thu âm, chế độ kích hoạt và độ nhạy.">
        {micUnavailable ? (
          <div className="p-2">
            <EmptyState
              title={
                mockConfig.micScenario === "blocked"
                  ? "Chưa cấp quyền micro"
                  : "Không tìm thấy micro"
              }
              description={
                mockConfig.micScenario === "blocked"
                  ? "Trình duyệt hoặc hệ thống đang chặn quyền truy cập micro."
                  : "Hãy cắm tai nghe hoặc micro rồi thử lại."
              }
              art={{ set: "building:greek", frame: 4 }}
            />
          </div>
        ) : (
          <>
            <SettingRow label="Thiết bị vào (mic)" htmlFor={inId}>
              <Select
                id={inId}
                className="w-72"
                controlSet="scr2"
                value={settings.voice.inputDevice}
                options={MOCK_INPUT_DEVICES}
                onChange={(inputDevice) =>
                  updateSettings((prev) => ({
                    ...prev,
                    voice: { ...prev.voice, inputDevice },
                  }))
                }
              />
            </SettingRow>

            <div className="px-4 py-3">
              <RadioGroup<MicMode>
                label="Chế độ mic"
                orientation="horizontal"
                value={settings.voice.micMode}
                options={[
                  { value: "auto", label: "Tự động (theo độ nhạy)" },
                  { value: "ptt", label: "Nhấn để nói" },
                ]}
                onChange={(micMode) =>
                  updateSettings((prev) => ({
                    ...prev,
                    voice: { ...prev.voice, micMode },
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5 px-4 py-3">
              {isPtt ? (
                <Tooltip content={PTT_SENSITIVITY_REASON}>
                  <div className="w-full">
                    <Slider
                      label="Độ nhạy mic"
                      min={-60}
                      max={0}
                      step={1}
                      disabled
                      value={settings.voice.sensitivityDb}
                      format={(v) => `${v} dB`}
                      onChange={() => {}}
                    />
                  </div>
                </Tooltip>
              ) : (
                <Slider
                  label="Độ nhạy mic"
                  min={-60}
                  max={0}
                  step={1}
                  value={settings.voice.sensitivityDb}
                  format={(v) => `${v} dB`}
                  onChange={(sensitivityDb) =>
                    updateSettings((prev) => ({
                      ...prev,
                      voice: { ...prev.voice, sensitivityDb },
                    }))
                  }
                />
              )}
              <MicLevelMeter
                levelDb={levelDb}
                thresholdDb={settings.voice.sensitivityDb}
                disabled={isPtt}
              />
            </div>

            <SettingRow label="Phím Nhấn để nói">
              <div className="flex items-center gap-3">
                {settings.hotkeys.pushToTalk ? (
                  <span className="inline-flex items-center gap-1">
                    {settings.hotkeys.pushToTalk.split("+").map((p) => (
                      <Kbd key={p}>{p}</Kbd>
                    ))}
                  </span>
                ) : (
                  <span className="font-body text-sm text-tone-text/60">Chưa đặt</span>
                )}
                <button
                  type="button"
                  onClick={onGoHotkeys}
                  className="font-body text-sm font-semibold text-tone-focus underline hover:brightness-110 focus-visible:outline-game-out"
                >
                  Đổi ở tab Phím tắt
                </button>
              </div>
            </SettingRow>

            <SettingRow
              label="Thử mic"
              description={
                testing
                  ? "Đang thu thử trong 5 giây — hãy nói vào micro…"
                  : playingBack
                    ? "Đang phát lại đoạn thu thử (giả lập)…"
                    : undefined
              }
            >
              <div className="flex items-center gap-2">
                {playbackReady && !testing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={playingBack}
                    onClick={startPlayback}
                  >
                    {playingBack ? "Đang phát…" : "Phát lại"}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={testing ? stopTest : startTest}
                >
                  {testing ? "Dừng" : "Thử mic"}
                </Button>
              </div>
            </SettingRow>
          </>
        )}
      </SettingGroup>
    </div>
  );
}


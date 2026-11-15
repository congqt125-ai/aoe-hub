import { useEffect, useId, useRef, useState } from "react";
import {
  Button, Icon, Input, PingIndicator, Spinner, Toggle,
} from "../../../../components";
import {
  DEFAULT_SETTINGS,
  getTurnStatus,
  runNetworkTest,
  useSettings,
  validateRelayUrl,
  type NetworkTestResult,
} from "../../settingsMock";
import { SettingGroup, SettingRow } from "./SettingRow";

export interface NetworkTabProps {
  onErrorChange?: (hasError: boolean) => void;
}

const TEST_STEPS = ["Đo ping…", "Kiểm tra NAT…", "Thử UPnP…"];

const VERDICT_STYLE = {
  success: "bg-success text-success-on",
  warning: "bg-warning text-warning-on",
  danger: "bg-danger text-danger-on",
} as const;

/** §3.4 Tab Mạng — relay URL, 2s network diagnostic, and TURN relay node settings. */
export function NetworkTab({ onErrorChange }: NetworkTabProps) {
  const idBase = useId();
  const relayId = `${idBase}-relay`;
  const turnId = `${idBase}-turn`;

  const { settings, mockConfig, updateSettings } = useSettings();
  const [relayDraft, setRelayDraft] = useState(settings.network.relayUrl);
  const [relayError, setRelayError] = useState<string | null>(() =>
    validateRelayUrl(settings.network.relayUrl),
  );

  // Network test state
  const [testing, setTesting] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [testResult, setTestResult] = useState<NetworkTestResult | null>(null);
  const [testError, setTestError] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    setRelayDraft(settings.network.relayUrl);
    setRelayError(validateRelayUrl(settings.network.relayUrl));
  }, [settings.network.relayUrl]);

  useEffect(() => {
    onErrorChange?.(relayError !== null);
  }, [relayError, onErrorChange]);

  const commitRelay = (candidate: string) => {
    const err = validateRelayUrl(candidate);
    setRelayError(err);
    if (!err) {
      updateSettings((prev) => ({
        ...prev,
        network: { ...prev.network, relayUrl: candidate.trim() },
      }));
    }
  };

  const startTest = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setTesting(true);
    setTestResult(null);
    setTestError(false);
    setStepIdx(0);

    timersRef.current.push(
      window.setTimeout(() => setStepIdx(1), 650),
      window.setTimeout(() => setStepIdx(2), 1300),
      window.setTimeout(() => {
        setTesting(false);
        const res = runNetworkTest(mockConfig.networkScenario);
        if (!res) setTestError(true);
        else setTestResult(res);
      }, 2000),
    );
  };

  const turn = getTurnStatus(mockConfig.turnScenario, mockConfig.turnActivePeers);

  return (
    <div className="flex flex-col gap-5">
      <SettingGroup
        title="Kết nối"
        description="Trong phòng, huy hiệu trên mỗi ghế cho biết mạng của từng người (Tốt / Hơi chậm / Yếu); trận chơi theo lượt nên một người mạng yếu là cả phòng phải chờ."
      >
        <SettingRow
          label="Địa chỉ máy chủ (relay)"
          htmlFor={relayId}
          error={relayError ?? undefined}
        >
          <div className="flex items-center gap-2">
            <Input
              id={relayId}
              wrapperClassName="w-64"
              value={relayDraft}
              invalid={relayError !== null}
              onChange={(e) => {
                setRelayDraft(e.target.value);
                if (relayError) setRelayError(validateRelayUrl(e.target.value));
              }}
              onBlur={() => commitRelay(relayDraft)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRelay(relayDraft);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const def = DEFAULT_SETTINGS.network.relayUrl;
                setRelayDraft(def);
                commitRelay(def);
              }}
            >
              Mặc định
            </Button>
          </div>
        </SettingRow>

        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-md font-semibold text-tone-text">
                Kiểm tra mạng
              </span>
              <span className="font-body text-sm text-tone-text/70">
                Đo độ trễ tới máy chủ relay, kiểm tra NAT và khả năng mở cổng UPnP.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={testing}
              onClick={startTest}
            >
              {testing ? "Đang kiểm tra…" : "Kiểm tra mạng"}
            </Button>
          </div>

          {testing && (
            <div
              role="status"
              className="flex items-center gap-2.5 bg-black/40 px-3 py-2 font-body text-sm text-tone-text bevel-sunken-1"
            >
              <Spinner size={16} label="Đang kiểm tra mạng" />
              <span>{TEST_STEPS[stepIdx]}</span>
            </div>
          )}

          {testError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 bg-danger/20 px-3 py-2 font-body text-sm text-danger-on-dark bevel-sunken-1"
            >
              <span className="flex items-center gap-2">
                <Icon name="error" size={16} />
                Không thể kết nối tới máy chủ kiểm tra. Vui lòng thử lại.
              </span>
              <Button variant="secondary" size="sm" onClick={startTest}>
                Thử lại
              </Button>
            </div>
          )}

          {testResult && (
            <div className="flex flex-col gap-2.5 bg-black/40 p-3 bevel-sunken-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-tone-text/80">Đánh giá:</span>
                  <span
                    className={`inline-flex h-[18px] items-center px-1.5 font-heading text-xs font-semibold leading-none text-shadow-none ${VERDICT_STYLE[testResult.badgeVariant]}`}
                  >
                    {testResult.verdict}
                  </span>
                </div>
                <PingIndicator ms={testResult.pingMs} showValue />
              </div>

              <div className="grid grid-cols-3 gap-2 font-body text-sm">
                <div className="bg-black/30 px-2.5 py-1.5">
                  <div className="text-tone-text/60">Loại NAT</div>
                  <div className="font-semibold text-tone-state">{testResult.natType}</div>
                </div>
                <div className="bg-black/30 px-2.5 py-1.5">
                  <div className="text-tone-text/60">UPnP</div>
                  <div className="font-semibold text-tone-state">
                    {testResult.upnp ? "Có" : "Không"}
                  </div>
                </div>
                <div className="bg-black/30 px-2.5 py-1.5">
                  <div className="text-tone-text/60">IP công khai</div>
                  <div className="font-semibold tabular text-tone-state">{testResult.publicIp}</div>
                </div>
              </div>

              <p className="m-0 font-body text-sm text-tone-text/85">{testResult.hint}</p>
            </div>
          )}
        </div>
      </SettingGroup>

      <SettingGroup
        title="Trạm trung chuyển (TURN)"
        description="Trận của người khác đi qua máy này thay vì máy chủ ở nước ngoài, mượt hơn cho mọi người."
      >
        <SettingRow
          label="Làm trạm trung chuyển (TURN) khi máy rảnh"
          htmlFor={turnId}
          description={
            settings.network.turnEnabled && !turn.eligible
              ? "Sẽ tự hoạt động khi đủ điều kiện."
              : undefined
          }
        >
          <Toggle
            id={turnId}
            checked={settings.network.turnEnabled}
            onChange={(turnEnabled) =>
              updateSettings((prev) => ({
                ...prev,
                network: { ...prev.network, turnEnabled },
              }))
            }
          />
        </SettingRow>

        <div className="flex flex-col gap-2 px-4 py-3">
          <span className="font-body text-sm font-semibold text-tone-text/85">
            Điều kiện hoạt động
          </span>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 font-body text-sm">
            {turn.conditions.map((c) => (
              <li
                key={c.label}
                className={c.ok ? "flex items-center gap-2 text-success-on-dark" : "flex items-center gap-2 text-danger-on-dark"}
              >
                <Icon name={c.ok ? "check" : "close"} size={12} />
                <span>{c.label}</span>
              </li>
            ))}
          </ul>

          {turn.reason && (
            <p
              role="alert"
              className="m-0 mt-1 flex items-center gap-2 bg-warning/15 px-3 py-1.5 font-body text-sm text-warning-on-dark bevel-sunken-1"
            >
              <Icon name="warning" size={16} />
              <span>{turn.reason}</span>
            </p>
          )}

          {settings.network.turnEnabled && turn.eligible && (
            <p
              role="status"
              className="m-0 mt-1 flex items-center gap-2 bg-success/15 px-3 py-1.5 font-body text-sm text-success-on-dark bevel-sunken-1"
            >
              <Icon name="success" size={16} />
              <span>
                Đang làm trạm: {turn.activePeers} người đang đi qua · {turn.bandwidthKbps} KB/s
              </span>
            </p>
          )}

          <p className="m-0 mt-1 font-body text-xs text-tone-text/60">
            Dữ liệu mã hoá đầu cuối, trạm chỉ thấy IP người nối qua và tốn vài KB/s; không nhận kết nối mới khi bạn đang chơi.
          </p>
        </div>
      </SettingGroup>
    </div>
  );
}

import { useId } from "react";
import { Icon, Select, Tabs, Toggle, Tooltip } from "../../../../components";
import { SettingGroup, SettingRow } from "./SettingRow";

const LOCK_REASON = "Hiện chỉ có 1 giao diện mặc định — các tuỳ chọn sẽ mở khi có thêm theme.";
const NOOP = () => {};

/**
 * §3.2 Tab Giao diện — entirely locked & dimmed until more hub themes exist.
 * Does not call setScreen/setDialog/setGameCursor or persist anything.
 */
export function AppearanceTab() {
  const idBase = useId();
  const screenId = `${idBase}-screen`;
  const dialogId = `${idBase}-dialog`;
  const cursorId = `${idBase}-cursor`;
  const motionId = `${idBase}-motion`;

  return (
    <div className="flex flex-col gap-5">
      <div
        role="status"
        className="flex items-center gap-2.5 bg-black/40 px-3.5 py-2.5 font-body text-sm text-tone-text/90 bevel-sunken-1"
      >
        <Icon name="info" size={16} className="text-tone-state" />
        <span>{LOCK_REASON}</span>
      </div>

      <SettingGroup
        title="Chủ đề & chất liệu"
        description="Giao diện nền màn hình và bề mặt hộp thoại của hub."
      >
        <SettingRow label="Theme màn hình" htmlFor={screenId} disabled>
          <Tooltip content={LOCK_REASON}>
            <Select
              id={screenId}
              className="w-56"
              controlSet="scr2"
              disabled
              value="hub-village"
              options={[{ value: "hub-village", label: "Mặc định (Làng)" }]}
              onChange={NOOP}
            />
          </Tooltip>
        </SettingRow>

        <SettingRow label="Chất liệu hộp thoại" htmlFor={dialogId} disabled>
          <Tooltip content={LOCK_REASON}>
            <Select
              id={dialogId}
              className="w-56"
              controlSet="scr2"
              disabled
              value="default"
              options={[{ value: "default", label: "Mặc định" }]}
              onChange={NOOP}
            />
          </Tooltip>
        </SettingRow>

        <SettingRow label="Dùng con trỏ của game" htmlFor={cursorId} disabled>
          <Tooltip content={LOCK_REASON}>
            <Toggle
              id={cursorId}
              checked
              disabled
              onChange={NOOP}
              aria-label="Dùng con trỏ của game"
            />
          </Tooltip>
        </SettingRow>
      </SettingGroup>

      <SettingGroup
        title="Hiển thị & khả năng tiếp cận"
        description="Cỡ chữ và hiệu ứng chuyển động trong toàn bộ hub."
      >
        <SettingRow label="Cỡ chữ" disabled>
          <Tooltip content={LOCK_REASON}>
            <Tabs
              label="Cỡ chữ"
              variant="segmented"
              value="medium"
              onChange={NOOP}
              items={[
                { value: "medium", label: "Vừa", disabled: true },
                { value: "large", label: "Lớn", disabled: true },
              ]}
            />
          </Tooltip>
        </SettingRow>

        <SettingRow label="Giảm chuyển động" htmlFor={motionId} disabled>
          <Tooltip content={LOCK_REASON}>
            <Toggle
              id={motionId}
              checked={false}
              disabled
              onChange={NOOP}
              aria-label="Giảm chuyển động"
            />
          </Tooltip>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

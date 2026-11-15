import { useState } from "react";
import {
  Button, ConnectionBanner, Dialog, FormField, Input, LaunchBar, SideNav, TopBar,
  type LaunchState,
} from "../../components";
import { players } from "../shared/mock";
import { Story, type Backdrop } from "./Story";


const LAUNCH_STATES: LaunchState[] = [
  { kind: "not-installed" },
  { kind: "updating", progress: 42, speed: "3,2 MB/s", paused: false },
  { kind: "updating", progress: 67, speed: "", paused: true },
  { kind: "ready", version: "1.0c" },
  { kind: "launching" },
  { kind: "running", detail: "Đồng cỏ 2v2" },
  { kind: "error", message: "Thiếu file dữ liệu game (data/graphics.drs)." },
];

const SIDE_ITEMS = [
  { id: "home", label: "Trang chủ", icon: "home" as const },
  { id: "lobby", label: "Sảnh", icon: "users" as const },
  { id: "tournament", label: "Giải đấu", icon: "trophy" as const },
  { id: "friends", label: "Bạn bè", icon: "chat" as const, count: 2 },
  { id: "profile", label: "Hồ sơ", icon: "user" as const },
  { id: "settings", label: "Cài đặt", icon: "settings" as const },
];

export function OrganismStories({ backdrop }: { backdrop: Backdrop }) {
  const s = { backdrop };
  const [modal, setModal] = useState(false);
  const [side, setSide] = useState("lobby");

  return (
    <>
      <Story title="Dialog" source="Game — texture + bevel 3px; modal khoá focus, Esc / nút đóng = Huỷ" {...s}>
        <Dialog
          variant="inline"
          size="sm"
          title="Rời phòng?"
          description="Bạn sẽ mất chỗ trong phòng “4v4 Đồng cỏ”."
          onClose={() => {}}
          actions={
            <>
              <Button>Ở lại</Button>
              <Button variant="danger">Rời phòng</Button>
            </>
          }
        >
          <span className="font-body text-sm">Biến thể inline (đặt trong trang), cỡ sm.</span>
        </Dialog>
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={() => setModal(true)}>
            Mở Dialog modal
          </Button>
          <span className="font-body text-xs text-tone-text/70">Tab vòng trong hộp thoại, Esc đóng, focus trả về nút.</span>
        </div>
        <Dialog
          open={modal}
          title="Nhập mật khẩu phòng"
          description="Phòng “Luyện tập 1v1” có mật khẩu."
          onClose={() => setModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            setModal(false);
          }}
          actions={
            <>
              <Button onClick={() => setModal(false)}>Huỷ</Button>
              <Button variant="primary" type="submit">Vào phòng</Button>
            </>
          }
        >
          <FormField label="Mật khẩu">
            <Input type="password" autoComplete="off" />
          </FormField>
        </Dialog>
      </Story>

      <Story title="ConnectionBanner" source="Tự thiết kế — banner toàn cục" {...s}>
        <div className="flex w-full flex-col gap-2">
          <div className="relative h-9">
            <ConnectionBanner state={{ kind: "offline", attempt: 3 }} onRetry={() => {}} />
          </div>
          <div className="relative h-9">
            <ConnectionBanner state={{ kind: "maintenance", message: "Bảo trì máy chủ lúc 23:00 — dự kiến 30 phút." }} />
          </div>
        </div>
      </Story>

      <Story title="TopBar" source="Game (thanh trong trận) — bản mặc định: nền tối + bevel" {...s}>
        <TopBar
          className="w-full"
          nav={[
            { id: "home", label: "Trang chủ", href: "#" },
            { id: "lobby", label: "Sảnh", href: "#" },
            { id: "tournament", label: "Giải đấu", href: "#" },
            { id: "profile", label: "Hồ sơ", href: "#" },
          ]}
          activeId="lobby"
          user={players.me}
          serverPing={42}
          notificationCount={3}
          accountMenu={[
            { id: "p", label: "Hồ sơ", icon: "user", onSelect: () => {} },
            { id: "l", label: "Đăng xuất", icon: "logout", danger: true, onSelect: () => {} },
          ]}
        />
      </Story>

      <Story title="SideNav" source="Phái sinh — nút HUD theo phe, Alt+1…6" {...s}>
        <SideNav items={SIDE_ITEMS} activeId={side} onSelect={setSide} />
        <SideNav items={SIDE_ITEMS} activeId={side} onSelect={setSide} faction="egyptian" expanded />
      </Story>

      <Story title="LaunchBar" source="Tự thiết kế — chưa cài / cập nhật / sẵn sàng / khởi chạy / đang chơi / lỗi" {...s}>
        <div className="flex w-full flex-col gap-2">
          {LAUNCH_STATES.map((st, i) => (
            <LaunchBar key={i} state={st} onPlay={() => {}} onInstall={() => {}} onTogglePause={() => {}} onReturn={() => {}} onRepair={() => {}} />
          ))}
        </div>
      </Story>
    </>
  );
}

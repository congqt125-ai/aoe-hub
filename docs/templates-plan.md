# Kế hoạch Templates — dựng từng màn hình

Chi tiết cho mục **Templates** của Bước 4 trong [PLAN.md](../PLAN.md). PLAN.md vẫn là nơi đánh dấu tiến độ; file này ghi phạm vi, việc con và tiêu chí "xong" của từng màn.

**Quy tắc làm việc**
- Chỉ làm màn người dùng bảo, mỗi lần một màn. Xong → chụp kiểm tra → người dùng duyệt → mới sang màn khác.
- Organism nào màn cần mà chưa có thì dựng cùng màn đó, đặt trong `components/organisms/`, có story trong gallery (mục Organisms) và đánh dấu ở PLAN.md.
- Bố cục theo [wireframes.md](wireframes.md), component theo [components.md](components.md), kiểm tra theo *Checklist review* của [ux-guidelines.md](ux-guidelines.md).
- Dữ liệu giả dùng chung ở `demo/shared/mock.ts`; không gọi máy chủ thật.
- Chạy: `npm run dev` → `/demo/app/`. Build: `npm run build` (typecheck + build).

**Tiêu chí "xong" chung cho mỗi màn**
1. `npm run build` không lỗi (typecheck + build).
2. Đủ các trạng thái liệt kê, xem được bằng thanh "Xem trạng thái" (chỉ để duyệt).
3. Bàn phím: Tab đi đúng thứ tự, focus ring hiện, Enter / Esc đúng như wireframe; ARIA đúng vai trò.
4. Chụp kiểm tra ở 1366×768 và 1280×1024 (ảnh lưu ở scratchpad, không để trong dự án).
5. Chỉ dùng token / class Tailwind của preset, không mã màu cứng.

---

## T0. Khung app

**Mục tiêu:** trang `demo/app/` chạy được, có chuyển màn và vỏ AppShell để các màn sau gắn vào.

| Việc con | Ghi chú |
|---|---|
| `demo/app/index.html` + `main.tsx`, thêm vào `vite.config.ts` (input) và `tsconfig.json` | nạp `components/styles.css`, `tuner.js` |
| Router hash nhỏ (`useHashRoute`): `#/login`, `#/home`, `#/lobby`, `#/room`, `#/matchmaking`, `#/friends`, `#/profile`, `#/settings` | không thêm thư viện router |
| Phiên đăng nhập giả (`session`): chưa đăng nhập → luôn về `#/login`; có nút Đăng xuất | lưu `sessionStorage` cho tiện duyệt |
| Theme theo màn: `login` → `hub-temple`; còn lại → `hub-village`; hộp thoại `dlg6_3` | qua `useTheme()` |
| Chuyển `demo/gallery/mock.ts` → `demo/shared/mock.ts` (gallery import lại) | dữ liệu dùng chung |
| Organisms vỏ: `AppShell`, `TopBar`, `SideNav`, `LaunchBar`, `ConnectionBanner` | xem dưới |
| Màn chưa làm hiện `EmptyState` "Màn này làm ở T#" | để thấy luồng |

**Organisms dựng ở T0**
- `AppShell`: lưới TopBar (48) / SideNav (72) / nội dung / LaunchBar (56); slot panel phải (FriendsPanel sau); banner toàn cục ở trên cùng; skip link "Bỏ qua tới nội dung".
- `TopBar`: logo chữ "SuperAge" (Spectral SC), điều hướng chính (Trang chủ, Sảnh, Giải đấu, Hồ sơ), slot phải: ping máy chủ, chuông (chỗ cho NotificationCenter sau), menu tài khoản (`Avatar` + `DropdownMenu`: Hồ sơ, Cài đặt, Đăng xuất).
- `SideNav`: `IconButton hud` theo phe + nhãn, mục đang chọn = frame pressed + chữ `state`, `Badge count`, phím Alt+1…6.
- `LaunchBar`: trạng thái chưa cài / cần cập nhật (`ProgressBar` + tốc độ + Tạm dừng) / sẵn sàng (nút **Chơi** lg) / đang chạy / lỗi.
- `ConnectionBanner`: mất kết nối (warning, "Đang kết nối lại… (lần n)" + Thử ngay), bảo trì (info).

**Xong khi:** mở `/demo/app/` → về Đăng nhập; đăng nhập giả → vỏ AppShell với TopBar / SideNav / LaunchBar; bấm điều hướng đổi màn (placeholder), Alt+1…6 chạy; Đăng xuất về Đăng nhập. Organisms mới có story trong gallery.

---

## T1. Đăng nhập / Đăng ký

**Mục tiêu:** màn Đăng nhập React thay bản mẫu `demo/screens/login.html` (wireframes §1). Nền `hub-temple` (logo trong ảnh), hộp thoại `dlg6_3` (đã chốt).

| Việc con | Ghi chú |
|---|---|
| Organism `Dialog` | biến thể `inline` (đặt trong trang, như màn này) và `modal` (lớp phủ, khoá focus, Esc, trả focus); cỡ sm / md / lg; tiêu đề căn giữa, nút đóng sprite control, hàng nút |
| Bố cục | khoảng trống trên cho logo (co lại khi cửa sổ thấp), hộp thoại giữa, chân trang: phiên bản, máy chủ + ping |
| Chế độ **Đăng nhập** | Tên đăng nhập, Mật khẩu (hiện / ẩn), Ghi nhớ, Quên mật khẩu?, nút Đăng ký / Đăng nhập |
| Chế độ **Đăng ký** (cùng hộp thoại, wireframes §1) | Tên đăng nhập, Email, Mật khẩu, Nhập lại mật khẩu, `Checkbox` đồng ý điều khoản, nút Tạo tài khoản; xong → về chế độ Đăng nhập với tên đã điền + `Toast success` |
| Kiểm tra dữ liệu | lỗi hiện khi rời ô hoặc khi gửi; focus về ô lỗi đầu tiên; `aria-invalid` + `aria-describedby` |
| Trạng thái | bình thường · lỗi form ("Sai tên đăng nhập hoặc mật khẩu", giữ tên, xoá mật khẩu) · đang đăng nhập (nút loading, khoá form) · mất kết nối (`ConnectionBanner`, nút Đăng nhập khoá + lý do) |
| Giả lập | `demo` / `demo` → đăng nhập được → `#/home`; khác → lỗi; trễ ~1 s |
| Thanh duyệt | "Xem trạng thái" (Bình thường / Lỗi / Đang đăng nhập / Mất kết nối) ở chân trang |

**Xong khi:** đủ trạng thái trên, Enter gửi form, Tab đúng thứ tự, đăng nhập `demo/demo` vào được Trang chủ (vỏ T0); chụp so với bản mẫu HTML không lệch bố cục.

---

## T2 – T10 (làm sau, khi được bảo)

| # | Màn | Organisms cần | Trạng thái chính |
|---|---|---|---|
| T2 | Trang chủ (§2) | AppShell đầy đủ, NotificationCenter, FriendsPanel (gọn) | tin tức, bạn online, phòng gợi ý, LaunchBar |
| T3 | Sảnh (§3) | RoomBrowser, ChatPanel, FriendsPanel | loading skeleton / rỗng / lỗi / dòng mới loé; Dialog tạo phòng, nhập mật khẩu |
| T4 | Phòng chơi (§4) | RoomLobby, ChatPanel | chờ / đủ sẵn sàng / đếm ngược 5 s / khởi chạy / bị mời ra |
| T5 | Giải đấu (§5, thay Xếp trận 13/11) | TournamentList, PhaseStepper, TournamentSetupDialog, Bracket, MatchHistoryTable | nháp / đăng ký / ngày xếp đội / thi đấu / kết thúc; vai QTV / đã đăng ký / chưa |
| T6 | Bạn bè & tin nhắn (§6) | FriendsPanel mở rộng, ChatPanel | tab, nhóm theo trạng thái, đang gõ, Tin mới ↓, gửi lỗi |
| T7 | Hồ sơ (§7) | ProfileHeader, MatchHistoryTable | của mình / người khác, lọc, tải thêm |
| T8 | Cài đặt (§8) | SettingsForm, ToastStack | lưu tự động / nút Lưu, rời trang chưa lưu |
| T9 | Kết quả trận (§9) | Dialog lg | thắng / thua, về phòng / về sảnh |
| T10 | Nối luồng chính | — | toàn bộ luồng + nhánh xếp trận + nhánh mất kết nối |

# Brief T8 — Trang Cài đặt (giao cho agent dựng)

Tài liệu này đủ để một agent (Gemini) dựng **bản đầu tiên** của trang Cài đặt trong app mẫu `demo/app/`. Đọc hết trước khi sửa code. Cách làm giống T5 / T7 / T11 ([`t7-profile-brief.md`](t7-profile-brief.md), [`t11-clan-brief.md`](t11-clan-brief.md)) — giữ cùng phong cách code với các màn đã có.

**Nguồn tính năng:** danh sách tính năng lấy từ launcher SuperAqE hiện tại (ảnh chụp trang Cài đặt cũ). **Chỉ lấy tính năng, không lấy giao diện:** không làm nền trắng, ô xám bo tròn, thanh trượt xanh, nút Sáng / Tối / Theo máy. Mọi thứ dựng bằng component và token của dự án (theme game, bevel, texture).

## 0. Đọc trước

1. [`CLAUDE.md`](../CLAUDE.md) — quy tắc dự án (bắt buộc). Hay vi phạm:
   - Text trên UI, ghi chú trong PLAN.md: **tiếng Việt Unicode**. Tên file / biến / hàm / CSS class: tiếng Anh.
   - **Không hard-code mã màu** trong component — dùng class Tailwind từ preset (`text-tone-text`, `text-tone-state`, `text-tone-focus`, `bg-black/60`, `bevel-raised-2`, `bevel-sunken-1`, `frame-line`…).
   - Không đụng thư mục game, không sửa `raw/`, `assets/ui/`, `tokens/` (sinh tự động).
   - **Không dùng con trỏ `cursor/pointer.png`** (con trỏ dấu "?").
2. [`PLAN.md`](../PLAN.md) → Bước 4 → mục **T8. Cài đặt**.
3. [`docs/wireframes.md`](wireframes.md) §8 **Cài đặt**.
4. [`docs/ux-guidelines.md`](ux-guidelines.md) — focus, tooltip lý do khi khoá, lỗi từng ô, trạng thái đang tải / lỗi, chuyển động 100/150/200 ms.
5. Code mẫu (viết theo cùng phong cách):
   - [`demo/app/screens/ProfileScreen.tsx`](../demo/app/screens/ProfileScreen.tsx) + `screens/profile/*` — trang có tab, tab giữ trong hash.
   - [`demo/app/screens/panel.tsx`](../demo/app/screens/panel.tsx) — `PanelTitle`, `PanelFooter`, `LINE`.
   - [`demo/app/MockPanel.tsx`](../demo/app/MockPanel.tsx) — `MockShell`, `MockGroup`, `MockSlider`, `MockChoice`, `MockCheck`.
   - [`demo/app/App.tsx`](../demo/app/App.tsx), [`demo/app/routes.ts`](../demo/app/routes.ts) — route `settings` đã có (đang hiện `PlaceholderScreen`); xem `parseProfileHash` để đọc `?tab=`.
   - [`components/lib/theme.tsx`](../components/lib/theme.tsx) — `useTheme()`: `setScreen`, `setDialog`, `setGameCursor`, `setFrame`; `SCREEN_THEMES`, `DIALOG_THEMES`, `TEXTURES`.
6. Component có sẵn (`components/index.ts`, xem ở `npm run dev` → `/demo/`) — **dùng lại**: `Tabs` + `TabPanel` (`variant="vertical"` cho tab trái, `segmented`), `FormField`, `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Slider`, `Button`, `IconButton`, `Kbd`, `Badge`, `StatusDot`, `PingIndicator`, `ProgressBar`, `Spinner`, `Tooltip`, `Dialog`, `Toast`, `EmptyState`, `Divider`, `Surface`, `Icon`. Chỉ tạo component mới khi không có (dự kiến cần: ô bắt phím `KeyCaptureInput`, thanh mức mic `MicLevelMeter` — đặt trong `demo/app/screens/settings/`).

## 1. Kỹ thuật

- Vite 8 + React 19 + TypeScript + Tailwind 3.4. Không thêm thư viện npm.
- Sân khấu cố định **1600×900**; theme `hub-village`, kiểu viền B (`modern`) như các màn khác.
- **Mở từ menu tài khoản** (đã chốt 13/11): lối vào duy nhất là mục "Cài đặt" trong `accountMenu` của `TopBar` (đã có sẵn trong `App.tsx`). Bỏ Cài đặt khỏi SideNav: route `settings` trong `routes.ts` đổi `inSideNav` thành không có (giữ route, giữ hash `#/settings`).
- **Không SideNav**: thêm `current === "settings"` vào điều kiện ẩn `sideNav` trong `App.tsx` (tab dọc của trang đã là điều hướng).
- **Không có tab Tài khoản** (đã chốt 13/11): tên, email, mật khẩu thuộc Hồ sơ (`#/profile`, "Sửa hồ sơ"); Đăng xuất đã có trong menu tài khoản.
- Tab giữ trong hash: `#/settings?tab=game` (id tab tiếng Anh: `appearance`, `game`, `network`, `voice`, `hotkeys`). Mở trang không có `?tab=` hoặc tab sai → **`game`** (tab Giao diện đang khoá, §3.2).
- Chạy: `npm run dev` → `http://localhost:5173/demo/app/#/settings` (đăng nhập `demo` / `demo`). Kiểm tra: `npm run typecheck`, `npm run build`.

## 2. File cần tạo / sửa

| File | Việc |
|---|---|
| `demo/app/screens/SettingsScreen.tsx` | Khung trang: tab dọc trái + vùng nội dung (mới) |
| `demo/app/screens/settings/AppearanceTab.tsx` | Tab Giao diện (mới) |
| `demo/app/screens/settings/GameTab.tsx` | Tab Game (mới) |
| `demo/app/screens/settings/NetworkTab.tsx` | Tab Mạng (mới) |
| `demo/app/screens/settings/VoiceTab.tsx` | Tab Voice chat (mới) |
| `demo/app/screens/settings/HotkeysTab.tsx` | Tab Phím tắt (mới) |
| `demo/app/screens/settings/KeyCaptureInput.tsx` | Ô bắt phím + kiểm tra xung đột (mới) |
| `demo/app/screens/settings/MicLevelMeter.tsx` | Thanh mức mic + vạch ngưỡng (mới) |
| `demo/app/screens/settings/SettingRow.tsx` | Hàng cài đặt dùng chung: nhãn, mô tả, điều khiển, lỗi (mới) |
| `demo/app/settingsMock.ts` | Kiểu, giá trị mặc định, lưu / đọc, kiểm tra hợp lệ, giả lập kiểm tra mạng / mic (mới) |
| `demo/app/App.tsx` | Dùng `SettingsScreen`; ẩn SideNav; áp cài đặt toàn app (§3.7) |
| `demo/app/routes.ts` | Bỏ `inSideNav` của route `settings` |
| `PLAN.md` | Ghi chú tiến độ dưới mục T8 (xem §6) |

Giữ mỗi file dưới ~400 dòng. Comment tiếng Anh, ngắn, giải thích *tại sao* — mật độ như code xung quanh.

## 3. Đặc tả

### 3.1 Bố cục

Trong `AppShell` (TopBar + LaunchBar). Panel lớn giữa màn (texture theo theme hộp thoại):

- **Trái (~240px):** tiêu đề "Cài đặt" + `Tabs variant="vertical"`: **Giao diện · Game · Mạng · Voice chat · Phím tắt** — mỗi mục có `Icon`. Tab có lỗi chưa sửa → chấm `danger` cạnh tên.
- **Phải:** nội dung tab, cuộn dọc bên trong (trang không cuộn). Mỗi tab chia **nhóm** có tiêu đề (heading) + một dòng mô tả mờ; mỗi cài đặt là một `SettingRow`: nhãn trái, điều khiển phải, mô tả / lỗi dưới. Rộng nội dung tối đa ~880px để dòng chữ không quá dài.
- Chân vùng nội dung: trạng thái lưu (xem §3.7) + nút **"Khôi phục mặc định"** của tab đang mở (xác nhận bằng `Dialog`).

### 3.2 Tab Giao diện (khoá toàn bộ — đã chốt 13/11)

Thay cho "Sáng / Tối / Theo máy" của launcher cũ. **Hiện hub chỉ có 1 theme mặc định → cả tab hiện nhưng khoá, mờ (dimmed); không mục nào đổi được.** Tab vẫn có trong danh sách tab dọc để người dùng biết sẽ có.

- Dải thông báo đầu tab (`Icon` `info`): "Hiện chỉ có 1 giao diện mặc định — các tuỳ chọn sẽ mở khi có thêm theme."
- Các mục hiện ở trạng thái `disabled` + mờ, mỗi mục hiện giá trị mặc định đang dùng:
  - **Theme màn hình:** `Select` — "Mặc định (Làng)" (`hub-village`).
  - **Chất liệu hộp thoại:** `Select` — "Mặc định".
  - **Dùng con trỏ của game:** `Toggle` — bật.
  - **Cỡ chữ:** segmented **Vừa · Lớn** — Vừa.
  - **Giảm chuyển động:** `Toggle` — tắt.
- Hover mục nào cũng hiện `Tooltip` lý do như dải thông báo.
- Không gọi `setScreen` / `setDialog` / `setGameCursor`, không thêm `data-font-scale` / `data-reduce-motion`, không lưu gì vào `Settings`. Không có nút "Khôi phục mặc định" ở tab này.

### 3.3 Tab Game (áp dụng ngay — đã chốt 13/11)

Core game do dự án tự làm nên **cấu hình game áp dụng ngay**: không cần mở lại hub, không cần mở lại game. Ghi chú đầu tab: "Đổi ngay, kể cả khi game đang chạy."

- Game đang chạy (`LaunchState` `running`) → đổi độ phân giải / chế độ hiển thị / giữ tỉ lệ / VSync gửi thẳng vào game (giả lập: chỉ báo "Đã áp dụng cho game đang chạy" ở chân trang, không `Toast`). Game chưa chạy → lưu, lần mở game dùng luôn.
- **Đường dẫn game** là ngoại lệ: đổi khi game đang chạy → khoá ô + nút "Chọn…", `Tooltip` lý do "Đóng game trước khi đổi đường dẫn".

- Dòng thông tin (chỉ đọc) đầu tab: **Phiên bản launcher** `1.0.40` · phiên bản game `1.0c`.

- **Đường dẫn game (EMPIRESX.EXE):** `Input` + nút "Chọn…" (giả lập: mở `Dialog` nhập đường dẫn). Trạng thái dưới ô: ✓ "Tìm thấy game 1.0c" / ✗ "Không tìm thấy EMPIRESX.EXE ở đường dẫn này" (giả lập: đường dẫn kết thúc bằng `EMPIRESX.EXE` = hợp lệ). Không hợp lệ → `LaunchBar` không khởi chạy được (dùng trạng thái lỗi sẵn có nếu có, không thì ghi giả định).
- **Độ phân giải:** `Select` — 800 × 600, 1024 × 768, 1280 × 1024, 1280 × 720, 1366 × 768, 1600 × 900, 1920 × 1080. Mô tả: "1024 × 768 và 1280 × 1024 dùng giao diện 4:3 (chơi chung bình thường với người dùng độ phân giải khác)."
- **Chế độ hiển thị:** Toàn màn hình · Cửa sổ · Cửa sổ không viền.
- **Giữ đúng tỉ lệ hình** (không kéo giãn) — `Checkbox`; khoá khi Cửa sổ, tooltip lý do.
- **Đồng bộ dọc (VSync)** — `Checkbox`, mô tả "chống xé hình".
- Dòng thông tin (chỉ đọc): "Kích thước bản đồ tự chọn theo số người chơi trong phòng: 1–4 người Large, 5–6 Huge, 7–8 Gigantic; chủ phòng vẫn đổi được trong game."
- Gợi ý: "Đổi nhanh độ phân giải bằng nút trong phòng chơi" (chỉ chữ, chưa nối T4).

### 3.4 Tab Mạng

**Nhóm Kết nối**
- **Địa chỉ máy chủ (relay):** `Input` URL + nút "Mặc định" (`https://superaqe.com`). Kiểm tra: phải `http(s)://…`; sai → lỗi dưới ô, không lưu.
- **Kiểm tra mạng:** nút → giả lập 2 s (`Spinner` + từng bước "Đo ping… / Kiểm tra NAT… / Thử UPnP…") → bảng kết quả: ping tới máy chủ (`PingIndicator` + ms), loại NAT, UPnP (có / không), IP công khai, **kết luận Tốt / Hơi chậm / Yếu** (`Badge` success / warning / danger) + một câu gợi ý. Lỗi → thông báo + "Thử lại".
- Mô tả: "Trong phòng, huy hiệu trên mỗi ghế cho biết mạng của từng người (Tốt / Hơi chậm / Yếu); trận chơi theo lượt nên một người mạng yếu là cả phòng phải chờ."

**Nhóm Trạm trung chuyển**
- `Toggle` **"Làm trạm trung chuyển (TURN) khi máy rảnh"** — mô tả: trận của người khác đi qua máy này thay vì máy chủ ở nước ngoài, mượt hơn cho mọi người.
- **Điều kiện** (danh sách ✓ / ✗, mỗi dòng một điều kiện): CPU ≥ 4 nhân · RAM ≥ 4 GB · đang cắm điện · nhận được kết nối từ ngoài (IP công khai hoặc router mở cổng UPnP). Không đủ → dòng cảnh báo nêu lý do cụ thể (ví dụ "Không làm trạm được: mạng qua NAT của nhà mạng (router thấy 21.45.150.82)"); toggle vẫn bật được nhưng ghi "Sẽ tự hoạt động khi đủ điều kiện".
- Đang làm trạm → dòng trạng thái: số người đang đi qua, KB/s.
- Ghi chú riêng tư (chữ nhỏ): dữ liệu mã hoá đầu cuối, trạm chỉ thấy IP người nối qua và tốn vài KB/s; không nhận kết nối mới khi bạn đang chơi.

### 3.5 Tab Voice chat

Mô tả đầu tab: "Nói chuyện với những người ngồi ghế trong phòng, nối thẳng máy với máy (không qua máy chủ). Bật mic bằng nút **Mic** cạnh ô chat trong phòng; khán giả và người đứng không có voice."

- **Thiết bị vào (mic)** / **Thiết bị ra (loa)**: `Select` (danh sách giả). Không có mic / bị chặn quyền → `EmptyState` nhỏ thay nhóm mic.
- **Âm lượng nghe người khác:** `Slider` 0–200 %, hiện giá trị.
- **Chế độ mic:** `Radio` **Tự động (theo độ nhạy)** · **Nhấn để nói**.
- **Độ nhạy mic** (chỉ khi Tự động): `Slider` −60 … 0 dB, hiện giá trị; **`MicLevelMeter`** ngay dưới: thanh mức hiện tại + vạch ngưỡng đặt theo slider; mức vượt ngưỡng → thanh đổi màu (đang phát). Chế độ Nhấn để nói → slider khoá, tooltip lý do.
- **Phím Nhấn để nói:** hiện `Kbd` của phím đang đặt + link "Đổi ở tab Phím tắt".
- **Thử mic:** nút → 5 s thanh mức dao động giả, rồi "Phát lại" (giả lập); đang thử → nút thành "Dừng".

### 3.6 Tab Phím tắt

- **Nhấn để nói:** `KeyCaptureInput` (bấm vào → "Bấm phím…", Esc huỷ) + nút "Mặc định" (F9).
- **Bật / tắt mic:** `KeyCaptureInput`, mặc định trống ("Chưa đặt").
- **Kiểm tra xung đột** (lỗi dưới ô, không lưu):
  - Phím game dành riêng: F3 (tạm dừng), F4 (điểm), F10 (menu), F11 (giờ / dân số).
  - Chữ / số đơn lẻ (phím tắt lệnh trong game) → bắt buộc kèm Ctrl, Alt hoặc Shift.
  - Alt+1…9 (chuyển màn hub), Alt+M (bảng dữ liệu giả).
  - Trùng phím đã đặt cho hành động khác.
- Mô tả: "Khi bạn ở trong phòng, phím này được giữ cho voice chat: game không nhận phím đó nữa (kể cả lúc game toàn màn hình)."
- Danh sách **phím tắt cố định của hub** (chỉ đọc, `Kbd`): Alt+1…9 chuyển màn, Esc đóng hộp thoại, Enter gửi chat.

### 3.7 Lưu và áp dụng (đã chốt 13/11)

- **Lưu tự động**, giống launcher cũ ("đổi ngay, lưu trên máy này"): mỗi thay đổi hợp lệ lưu ngay vào `localStorage` (khoá `aoe-hub.settings.v1`, mọi đọc / ghi bọc `try/catch`). Không có nút Lưu, **không cần cảnh báo rời trang**.
- Ô chữ (relay, đường dẫn game) lưu khi rời ô / Enter và chỉ khi hợp lệ; còn lỗi → giữ giá trị cũ đã lưu, tab có chấm đỏ.
- Chỉ báo ở chân trang: "Đã lưu" (mờ dần sau 1,5 s) — **không** bắn `Toast` mỗi lần đổi. Lưu lỗi (bảng Dữ liệu giả) → `Toast` lỗi "Không lưu được cài đặt".
- Áp toàn app (trong `App.tsx`, qua một `SettingsProvider` / hook `useSettings()` đặt trong `settingsMock.ts` hoặc file riêng):
  - Tab Giao diện: **không áp gì** (khoá toàn bộ, §3.2) — giữ nguyên logic theme / con trỏ hiện có trong `App.tsx`.
- Tải lại trang: cài đặt còn nguyên.

## 4. Dữ liệu giả — `settingsMock.ts` + bảng "⚙ Dữ liệu giả"

- Kiểu gợi ý: `Settings { game: { exePath, resolution, displayMode, keepAspect, vsync }, network: { relayUrl, turnEnabled }, voice: { inputDevice, outputDevice, volume, micMode: "auto" | "ptt", sensitivityDb }, hotkeys: { pushToTalk, toggleMic? } }` + `DEFAULT_SETTINGS`, `loadSettings()`, `saveSettings()`, `validateHotkey(key, others)`, `validateRelayUrl()`, `runNetworkTest(scenario)`.
- Bảng Dữ liệu giả (`MockShell` + `MockChoice` / `MockCheck`):
  - Kết quả kiểm tra mạng: Tốt / Hơi chậm / Yếu / Lỗi.
  - Máy làm trạm: đủ điều kiện / NAT nhà mạng / RAM thấp / chạy pin.
  - Đang làm trạm (số người đi qua).
  - Mic: có / không có thiết bị / bị chặn quyền.
  - Đường dẫn game: hợp lệ / không tìm thấy.
  - Game đang chạy (bật / tắt) — để thử áp dụng ngay và khoá ô đường dẫn.
  - Lưu bị lỗi (giả lập `localStorage` hỏng).
  - "Đặt lại" = xoá `aoe-hub.settings.v1` và về mặc định.

## 5. Không tự quyết

Gặp quyết định không có trong brief / wireframe → làm phương án đơn giản nhất và ghi trong PLAN.md là "giả định, chờ người dùng chốt", không mở rộng phạm vi.

**Đã chốt (13/11, người dùng):**
1. Lưu tự động, không có nút Lưu và không cảnh báo rời trang.
2. Mở từ menu tài khoản, không có trong SideNav; **bỏ tab Tài khoản** (đã có Hồ sơ).
3. Tab "Đồ hoạ" của wireframe đổi thành **"Game"** (cấu hình game + đường dẫn game); "Âm thanh" thành **"Voice chat"** (hub chưa có âm thanh riêng ngoài voice).

Không làm: tab Tài khoản (đổi mật khẩu, đăng xuất…), chế độ Sáng / Tối, nối voice chat thật, mở hộp thoại chọn file thật (Electron — bước 5), nút Mic trong phòng (T4), đổi độ phân giải trong phòng (T4).

## 6. Hoàn thành khi

- [x] `npm run typecheck` và `npm run build` không lỗi.
- [x] `/demo/app/#/settings` (đăng nhập `demo`/`demo`): đủ 5 tab, không lỗi console; mở được từ menu tài khoản (TopBar), SideNav không còn mục Cài đặt; `?tab=` giữ đúng tab khi tải lại.
- [x] Tab Giao diện: mọi mục mờ, khoá, có dải thông báo + tooltip lý do; không đổi được gì. Mở `#/settings` → vào tab Game.
- [x] Relay URL sai, phím tắt xung đột (F3, chữ không kèm Ctrl/Alt/Shift, Alt+1, trùng phím) → lỗi dưới ô, không lưu, tab có chấm đỏ.
- [x] Kiểm tra mạng chạy đủ 4 kết quả giả; trạm trung chuyển hiện đúng lý do không đủ điều kiện; thanh mức mic + vạch ngưỡng chạy; Nhấn để nói khoá slider độ nhạy kèm tooltip.
- [x] Tab Game: game đang chạy → đổi cấu hình báo "Đã áp dụng cho game đang chạy", ô đường dẫn khoá kèm lý do.
- [x] "Khôi phục mặc định" có xác nhận, chỉ ảnh hưởng tab đang mở.
- [x] Bàn phím đi được hết trang (Tab / mũi tên trong tab dọc), focus thấy rõ.
- [x] Không mã màu hex trong file `.tsx` mới; không có nút Sáng / Tối hay giao diện kiểu launcher cũ.
- [x] Vừa 1600×900, không vỡ bố cục.
- [x] Cập nhật PLAN.md dưới mục **T8**: dòng "Bản đầu tiên (<ngày>, chờ duyệt — chưa đánh dấu xong)" liệt kê file tạo ra, đã làm, chưa làm, giả định, lỗi tìm thấy. **Không** đổi `- [ ]` của T8 thành `- [x]`.
- [x] Không sửa màn khác ngoài các chỗ nêu ở §2.

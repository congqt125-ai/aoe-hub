# Brief T2 — Trang chủ (giao cho agent dựng)

Tài liệu này đủ để một agent (Gemini) dựng **bản đầu tiên** của Trang chủ trong app mẫu `demo/app/`. Đọc hết trước khi sửa code. Cách làm giống T5 / T7 / T8 / T11 ([`t7-profile-brief.md`](t7-profile-brief.md), [`t8-settings-brief.md`](t8-settings-brief.md)) — giữ cùng phong cách code với các màn đã có.

**Vai trò trang (đã chốt 13/11):** Trang chủ là trang **quảng bá** — giải đấu, cái mới của phần mềm (launcher / hub) và của core game — kèm phòng gợi ý và bạn bè đang online để vào chơi nhanh.

## 0. Đọc trước

1. [`CLAUDE.md`](../CLAUDE.md) — quy tắc dự án (bắt buộc). Hay vi phạm:
   - Text trên UI, ghi chú trong PLAN.md: **tiếng Việt Unicode**. Tên file / biến / hàm / CSS class: tiếng Anh.
   - **Không hard-code mã màu** trong component — dùng class Tailwind từ preset (`text-tone-text`, `text-tone-state`, `text-tone-focus`, `bg-black/60`, `bevel-raised-2`, `bevel-sunken-1`, `frame-line`…).
   - Không đụng thư mục game, không sửa `raw/`, `assets/ui/`, `tokens/` (sinh tự động).
   - **Không dùng con trỏ `cursor/pointer.png`** (con trỏ dấu "?").
2. [`PLAN.md`](../PLAN.md) → Bước 4 → mục **T2. Trang chủ** (các điều đã chốt).
3. [`docs/wireframes.md`](wireframes.md) §2 **Trang chủ** (đã vẽ lại theo brief này).
4. [`docs/ux-guidelines.md`](ux-guidelines.md) — trạng thái rỗng / đang tải / lỗi, focus, chuyển động 100/150/200 ms, giảm chuyển động.
5. Code mẫu (viết theo cùng phong cách):
   - [`demo/app/screens/LobbyScreen.tsx`](../demo/app/screens/LobbyScreen.tsx) — vào phòng (`onEnterRoom(room, "join" | "watch" | "create")`), `CreateRoomDialog`, `RoomCard`.
   - [`demo/app/lobbyMock.ts`](../demo/app/lobbyMock.ts) — `useLobbyMock` (dữ liệu Sảnh sống ở `App.tsx`, dùng chung được).
   - [`demo/app/tournamentMock.ts`](../demo/app/tournamentMock.ts) — `createInitialTournaments`, `PHASE_LABEL`, `formatCountdown`, `teamDisplayName`, `roundTitle`.
   - [`demo/app/screens/profile/FriendList.tsx`](../demo/app/screens/profile/FriendList.tsx) — danh sách bạn (T7), dùng lại bản gọn.
   - [`demo/app/screens/panel.tsx`](../demo/app/screens/panel.tsx) — `PanelTitle`, `PanelFooter`, `LINE`.
   - [`demo/app/MockPanel.tsx`](../demo/app/MockPanel.tsx) — `MockShell`, `MockSlider`, `MockChoice`, `MockCheck`.
   - [`demo/app/App.tsx`](../demo/app/App.tsx), [`demo/app/routes.ts`](../demo/app/routes.ts) — route `home` (đang hiện `PlaceholderScreen`).
6. Component có sẵn (`components/index.ts`, xem ở `npm run dev` → `/demo/`) — **dùng lại**: `RoomCard`, `Avatar`, `Badge`, `StatusDot`, `PingIndicator`, `PlayerChip`, `ListRow`, `Tabs` (`segmented`), `Button`, `IconButton`, `Tooltip`, `Dialog`, `Toast`, `EmptyState`, `Spinner`, `Surface`, `GameIcon`, `Icon`, `Divider`. Chỉ tạo component mới khi không có.

## 1. Kỹ thuật

- Vite 8 + React 19 + TypeScript + Tailwind 3.4. Không thêm thư viện npm.
- Sân khấu cố định **1600×900**; theme `hub-village`, kiểu viền B (`modern`). Trang **không cuộn** — mọi khối vừa vùng giữa TopBar và LaunchBar (~780px cao); khối nào dài thì cuộn bên trong khối.
- Chạy: `npm run dev` → `http://localhost:5173/demo/app/#/home` (đăng nhập `demo` / `demo`). Kiểm tra: `npm run typecheck`, `npm run build`.

### 1.1 Cất SideNav vào kho (đã chốt 13/11)

- App **không hiện SideNav ở màn nào nữa**, kể cả Trang chủ: bỏ prop `sideNav` khỏi `AppShell` trong `App.tsx` (và import `SideNav` nếu không còn dùng).
- **Bỏ luôn phím tắt Alt+1…9** (nằm trong SideNav — người dùng chốt không cần).
- **Giữ nguyên** `components/organisms/SideNav.tsx`, export trong `components/index.ts` và trang demo component — để dùng sau. Giữ trường `inSideNav` trong `routes.ts` (không ảnh hưởng gì khi không render).
- `PlaceholderScreen` trong `App.tsx`: bỏ câu "thanh trái hoặc Alt+1…6" → "Đổi màn bằng thanh trên."

## 2. File cần tạo / sửa

| File | Việc |
|---|---|
| `demo/app/screens/HomeScreen.tsx` | Khung trang, chia khối (mới) |
| `demo/app/screens/home/HeroCarousel.tsx` | Banner lớn xoay vòng (mới) |
| `demo/app/screens/home/TournamentStrip.tsx` | Hàng thẻ giải đấu (mới) |
| `demo/app/screens/home/WhatsNew.tsx` | Có gì mới + hộp thoại changelog (mới) |
| `demo/app/screens/home/SuggestedRooms.tsx` | Phòng gợi ý + Vào Sảnh / Tạo phòng (mới) |
| `demo/app/screens/home/FriendsOnline.tsx` | Bạn bè đang online, bản gọn (mới) |
| `demo/app/screens/home/LiveAndChampion.tsx` | Đang đấu trực tiếp + Vô địch gần nhất (mới) |
| `demo/app/homeMock.ts` | Slide banner, changelog, cấu hình dữ liệu giả (mới) |
| `demo/app/App.tsx` | Dùng `HomeScreen` khi `current === "home"`; cất SideNav (§1.1); truyền `lobby`, `enterRoom`, `go` |
| `PLAN.md` | Ghi chú tiến độ dưới mục T2 (xem §6) |

Giữ mỗi file dưới ~400 dòng. Comment tiếng Anh, ngắn, giải thích *tại sao* — mật độ như code xung quanh.

## 3. Đặc tả

### 3.1 Bố cục

```
┌ TopBar ═════════════════════════════════════════════════════════════════════════════┐
├──────────────────────────────────────────────────────────────┬──────────────────────┤
│ ╔═ BANNER (xoay 7 s) ════════════════════════════════════╗   │ BẠN BÈ ONLINE (7)    │
│ ║ [Giải đấu]  Cúp Hy Lạp mùa 3                           ║   │ ĐANG CHƠI (2)        │
│ ║ Đăng ký còn 2 ngày 04:12:33 · 11/16 đội · 4v4          ║   │ ● Minh  Đồng cỏ 2v2  │
│ ║ [ ĐĂNG KÝ ]  [ Xem giải ]                ● ○ ○ ○  ‹ ›  ║   │ TRỰC TUYẾN (5)       │
│ ╚════════════════════════════════════════════════════════╝   │ ● Lan          [Mời] │
│ GIẢI ĐẤU                                    [Xem tất cả →]   │ …     (cuộn trong)   │
│ ╔Thẻ giải╗ ╔Thẻ giải╗ ╔Thẻ giải╗ ╔Thẻ giải╗                  │──────────────────────│
│ ╚════════╝ ╚════════╝ ╚════════╝ ╚════════╝                  │ ĐANG ĐẤU TRỰC TIẾP   │
│ PHÒNG GỢI Ý  [Vào Sảnh][Tạo phòng] │ CÓ GÌ MỚI [PM|Core game] │ Bán kết · Cúp HL     │
│ ▸ Phòng 1   4/8  Cung R   [Vào]    │ ▸ 1.0.40 · 12/11 [Mới] … │ Đội A 1–0 Đội B [Xem]│
│ ▸ Phòng 2   6/8  Random   [Vào]    │ ▸ 1.0.39 · 05/11 [Sửa] … │──────────────────────│
│ ▸ Phòng 3   2/8  Random   [Vào]    │ ▸ …        [Xem tất cả →]│ VÔ ĐỊCH GẦN NHẤT 🏆  │
├ LaunchBar ═══════════════════════════════════════════════════╧══════════════════════┤
```

- **Cột trái (~1180px):** Banner (~300px) → Giải đấu (~170px) → hàng dưới chia đôi: Phòng gợi ý | Có gì mới.
- **Cột phải (~380px):** Bạn bè online (co giãn, cuộn trong) → Đang đấu trực tiếp → Vô địch gần nhất.
- Kích thước là gợi ý — chỉnh cho vừa 780px, không để trang cuộn.

### 3.2 Banner lớn (`HeroCarousel`)

- 3–5 slide, mỗi slide một **loại** (nhãn `Badge` góc trên): **Giải đấu · Phần mềm mới · Core game mới · Sự kiện**.
- Nền: ảnh trong `assets/hub/bg/` (phủ tối để chữ đọc rõ, class token), có thể thêm `GameIcon` / art building làm điểm nhấn.
- Nội dung: tiêu đề (heading), 1–2 dòng mô tả, nút chính + nút phụ.
  - **Giải đấu:** lấy từ dữ liệu giải (§4) — giai đoạn, đếm ngược (`formatCountdown`, tick mỗi giây), số đội đã đăng ký / tối đa, thể thức. Nút theo giai đoạn: Đang đăng ký → **"Đăng ký"** + "Xem giải"; Đang đấu → **"Vào xem"**; Sắp mở → "Xem giải". Tất cả → `#/tournament` (chưa mở được đúng giải theo id — ghi giả định).
  - **Phần mềm mới / Core game mới:** phiên bản + 1 câu nổi bật, nút **"Xem có gì mới"** → mở hộp thoại changelog đúng phiên bản, đúng nhóm.
  - **Sự kiện:** tiêu đề + thời gian, nút "Xem chi tiết" → `Toast` giả lập.
- Tự chuyển **7 s**; **dừng khi rê chuột / focus** vào banner; chấm chỉ vị trí + nút ‹ › ; phím ← → khi banner có focus. Chuyển cảnh mờ dần 200 ms; **giảm chuyển động** (`prefers-reduced-motion`) → không tự chuyển, đổi slide không hiệu ứng.

### 3.3 Giải đấu (`TournamentStrip`)

- Tối đa **4 thẻ**, thứ tự: Đang đăng ký → Đang đấu → Sắp mở → Vừa kết thúc.
- Thẻ: tên giải, `Badge` giai đoạn (`PHASE_LABEL`), thể thức (thể loại + loại map), số đội `11/16` (`ProgressBar` mảnh), thời gian bắt đầu hoặc đếm ngược, **phần thưởng là vật phẩm kho đồ** (danh hiệu / khung avatar — **không tiền**, đã chốt ở T7).
- Bấm thẻ / "Xem tất cả" → `#/tournament`.
- Rỗng → `EmptyState` "Chưa có giải đấu nào sắp diễn ra".

### 3.4 Có gì mới (`WhatsNew`)

- `Tabs` segmented: **Phần mềm** (launcher / hub) · **Core game**.
- Mỗi dòng: phiên bản, ngày, nhãn (`Badge`: **Mới** / **Sửa lỗi** / **Cân bằng** / **Hiệu năng**), 1–2 ý chính. Hiện 3–4 dòng mới nhất.
- Phiên bản người dùng **chưa xem** → chấm "Mới" (nhớ phiên bản đã xem trong `localStorage`, bọc `try/catch`); mở changelog → đánh dấu đã xem.
- **"Xem tất cả"** → `Dialog lg` changelog: trái là danh sách phiên bản, phải là chi tiết (nhóm theo nhãn, gạch đầu dòng).
- Nội dung giả phải khớp các tính năng thật của dự án (voice chat, trạm trung chuyển TURN, giải đấu, clan, cấu hình game áp dụng ngay…).

### 3.5 Phòng gợi ý (`SuggestedRooms`)

- Tiêu đề + nút **"Vào Sảnh"** (→ `#/lobby`) và **"Tạo phòng"** (mở `CreateRoomDialog` có sẵn → `lobby.createRoom` → `enterRoom(room, "create")`, như Sảnh).
- 3–4 phòng từ dữ liệu Sảnh (`useLobbyMock` ở `App.tsx`): ưu tiên phòng **còn chỗ, chưa khoá, có bạn bè trong phòng**, rồi ping thấp. Dòng gọn: tên, thể loại, số người `4/8`, `PingIndicator`, avatar bạn bè trong phòng (nếu có), nút **"Vào"** (→ `enterRoom(room, "join")`; phòng đang chơi → "Vào xem" / `"watch"`).
- Rỗng → `EmptyState` "Chưa có phòng nào đang mở" + nút "Tạo phòng".

### 3.6 Bạn bè online (`FriendsOnline`)

- Dùng lại `FriendList` (T7) ở bản gọn — chỉ người **Đang chơi** và **Trực tuyến / Vắng**; người ngoại tuyến ẩn, cuối danh sách ghi "+ n ngoại tuyến".
- Dòng: avatar, tên, hoạt động ("Đang chơi: Đồng cỏ 2v2"), nút nhỏ **"Mời"** (`Toast` giả lập) hoặc **"Vào xem"** khi bạn đang trong phòng (→ phòng đó nếu có trong dữ liệu Sảnh, không thì `Toast`). Bấm tên → `#/profile/<id>`.
- Đầu khối: số bạn online; chân khối: "Tất cả bạn bè" → `#/profile?tab=friends`.
- Không ai online → `EmptyState` gọn "Chưa có bạn nào online".

### 3.7 Đang đấu trực tiếp + Vô địch gần nhất (`LiveAndChampion`)

- **Đang đấu trực tiếp:** 1–2 trận `status: "live"` từ dữ liệu giải — vòng (`roundTitle`), tên giải, hai đội + tỉ số, nút **"Vào xem"** (→ `#/tournament`). Không có → ẩn khối này (cột phải dành chỗ cho bạn bè).
- **Vô địch gần nhất:** đội thắng giải vừa kết thúc — 🏆 + tên đội, tên giải, ngày, avatar thành viên (≤ 4), bấm thành viên → hồ sơ. Không có → ẩn.

## 4. Dữ liệu giả — `homeMock.ts` + bảng "⚙ Dữ liệu giả"

- Giải đấu: dùng `createInitialTournaments()` (như Hồ sơ / Clan đang làm) — không tạo nguồn dữ liệu giải thứ hai.
- Phòng: dữ liệu Sảnh có sẵn (`useLobbyMock` ở `App.tsx`), phòng tạo ở Trang chủ phải hiện ở Sảnh.
- Bạn bè: cùng nguồn với tab Bạn bè của Hồ sơ (`profileMock.ts`) để hai nơi khớp nhau.
- `homeMock.ts`: `HeroSlide { id, kind: "tournament" | "software" | "coregame" | "event", title, description, image, cta… }`, `ChangelogEntry { product: "software" | "coregame", version, date, tags, highlights: string[], details: { tag, items: string[] }[] }` — mỗi nhóm 6–8 phiên bản.
- Bảng Dữ liệu giả (`MockShell` + `MockChoice` / `MockSlider` / `MockCheck`):
  - Số slide banner (1–5); có / không slide giải đấu.
  - Giải đấu: bình thường / không có giải / có trận đang đấu / có nhà vô địch.
  - Số phòng gợi ý (0–4).
  - Số bạn online (0–20).
  - Có phiên bản chưa xem (bật / tắt).
  - Trạng thái tải trang: bình thường / đang tải (skeleton từng khối) / lỗi (`EmptyState` + "Thử lại").
  - "Đặt lại".

## 5. Không tự quyết

Gặp quyết định không có trong brief / wireframe → làm phương án đơn giản nhất và ghi trong PLAN.md là "giả định, chờ người dùng chốt", không mở rộng phạm vi.

**Đã chốt (13/11, người dùng):** trang quảng bá; giữ cột phải; giữ phòng gợi ý và bạn bè online; SideNav cất vào kho, bỏ Alt+1…9.

Không làm: chat sảnh thu gọn ở chân trang, trung tâm thông báo (`NotificationCenter`), tìm kiếm trên TopBar, tin nhắn riêng (T6), mở giải đấu theo id.

## 6. Hoàn thành khi

- [x] `npm run typecheck` và `npm run build` không lỗi.
- [x] `/demo/app/#/home` (đăng nhập `demo`/`demo`): không lỗi console, không SideNav ở mọi màn, Alt+1…9 không còn tác dụng; `SideNav` vẫn còn ở trang demo component.
- [x] Banner tự chuyển 7 s, dừng khi rê chuột / focus, ‹ › và ← → chạy; giảm chuyển động → không tự chuyển. Nút trên slide đúng theo giai đoạn giải.
- [x] Thẻ giải lấy đúng dữ liệu `tournamentMock` (giai đoạn, số đội, đếm ngược chạy); phần thưởng không có tiền.
- [x] Có gì mới: chuyển Phần mềm / Core game; "Xem tất cả" mở changelog; chấm "Mới" mất sau khi xem, tải lại vẫn nhớ.
- [x] Phòng gợi ý: "Vào" vào đúng phòng; "Tạo phòng" tạo xong vào phòng và phòng có ở Sảnh.
- [x] Bạn bè online khớp tab Bạn bè của Hồ sơ; Mời / Vào xem / bấm tên chạy.
- [x] Bảng Dữ liệu giả đổi được mọi mục ở §4, kể cả trạng thái rỗng / đang tải / lỗi của từng khối.
- [x] Không mã màu hex trong file `.tsx` mới. Vừa 1600×900, trang không cuộn.
- [x] Cập nhật PLAN.md dưới mục **T2**: dòng "Bản đầu tiên (<ngày>, chờ duyệt — chưa đánh dấu xong)" liệt kê file tạo ra, đã làm, chưa làm, giả định, lỗi tìm thấy. **Không** đổi `- [ ]` của T2 thành `- [x]`.
- [x] Không sửa màn khác ngoài các chỗ nêu ở §1.1 và §2.

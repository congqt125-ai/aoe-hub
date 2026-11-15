# Brief T7 — Trang Hồ sơ (giao cho agent dựng)

Tài liệu này đủ để một agent (Gemini) dựng **bản đầu tiên** của trang Hồ sơ trong app mẫu `demo/app/`. Đọc hết trước khi sửa code. Cách làm giống T5 Giải đấu (brief [`t5-tournament-brief.md`](t5-tournament-brief.md)) — giữ cùng phong cách code với các màn đã có.

## 0. Đọc trước

1. [`CLAUDE.md`](../CLAUDE.md) — quy tắc dự án (bắt buộc). Hay vi phạm:
   - Text trên UI, ghi chú trong PLAN.md: **tiếng Việt Unicode**. Tên file / biến / hàm / CSS class: tiếng Anh.
   - **Không hard-code mã màu** trong component — dùng class Tailwind từ preset (`text-tone-text`, `text-tone-state`, `text-tone-focus`, `bg-black/60`, `bevel-raised-2`, `bevel-sunken-1`, `frame-line`…). CSS riêng chỉ khi Tailwind không làm được.
   - Không đụng thư mục game, không sửa `raw/`, `assets/ui/`, `tokens/` (sinh tự động).
   - **Không dùng con trỏ `cursor/pointer.png`** (con trỏ dấu "?").
2. [`PLAN.md`](../PLAN.md) → Bước 4 → mục **T7. Hồ sơ** (các điều đã chốt).
3. [`docs/wireframes.md`](wireframes.md) §7 **Hồ sơ** — wireframe của trang này.
4. [`docs/ux-guidelines.md`](ux-guidelines.md) — trạng thái rỗng / đang tải / lỗi, focus, tooltip lý do khi nút bị khoá, chuyển động 100/150/200 ms.
5. Code mẫu (đọc kỹ, viết theo cùng phong cách):
   - [`demo/app/screens/TournamentScreen.tsx`](../demo/app/screens/TournamentScreen.tsx), [`LobbyScreen.tsx`](../demo/app/screens/LobbyScreen.tsx) — bố cục màn, `PanelTitle` / `PanelFooter` / `LINE` ([`panel.tsx`](../demo/app/screens/panel.tsx)).
   - [`demo/app/profile.tsx`](../demo/app/profile.tsx) — **hộp thoại hồ sơ nhanh** hiện có (`ProfileProvider`, `useProfile().open(...)`, `mockProfile()` sinh số liệu theo tên, trạng thái "Kết bạn / Đã gửi lời mời / Đã là bạn bè").
   - [`demo/app/MockPanel.tsx`](../demo/app/MockPanel.tsx) — `MockShell`, `MockGroup`, `MockSlider`, `MockChoice`, `MockCheck` (bảng "⚙ Dữ liệu giả" trên thanh rìa phải).
   - [`demo/app/lobbyMock.ts`](../demo/app/lobbyMock.ts) (`rng`, `pick`, `makePlayers`), [`demo/shared/mock.ts`](../demo/shared/mock.ts) (`players`), [`demo/app/civs.ts`](../demo/app/civs.ts) (16 đế chế + `civStyle` → icon nhà theo kiến trúc), [`demo/app/roomMock.ts`](../demo/app/roomMock.ts) (`GAME_TYPES`, `MAP_TYPES`), [`demo/app/tournamentMock.ts`](../demo/app/tournamentMock.ts) (giải đấu — dùng cho tab Lịch sử đấu › Giải đấu).
   - [`demo/app/App.tsx`](../demo/app/App.tsx), [`demo/app/routes.ts`](../demo/app/routes.ts) — route `profile` đã có (đang hiện `PlaceholderScreen`).
6. Thư viện component `components/index.ts`; xem trực quan ở `npm run dev` → `/demo/`. **Dùng lại component có sẵn**: `Avatar` (size `xs`…`2xl`, `source` unit / civ / initials), `Badge`, `StatusDot`, `PingIndicator`, `StatBlock` (label, value, delta), `ProgressBar`, `Tabs` + `TabPanel` (`variant` top / segmented / vertical), `Surface` (`texture`: `wood` / `sandstone` / `marble` / `darkstone`…), `GameIcon` (`set`: `unit`, `tech`, `stat`, `building:<faction>`), `Icon` (`trophy`, `crown`, `star`, `lock`, `user`, `users`, `chat`, `shield`, `clock`…), `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Tooltip`, `Dialog`, `Toast`, `EmptyState`, `Spinner`, `ListRow`, `PlayerChip`, `Pagination` (load-more), `SearchBar`, `Menu`. Chỉ tạo component mới khi không có.

## 1. Kỹ thuật

- Vite 8 + React 19 + TypeScript + Tailwind 3.4. Không thêm thư viện npm.
- Sân khấu cố định **1600×900**; theme `hub-village`, kiểu viền B (`modern`) — đã khai báo trong `routes.ts`.
- **Không SideNav** ở trang này: trong `App.tsx` thêm `current === "profile"` vào điều kiện ẩn `sideNav` (như lobby / room / tournament).
- **Tham số route:** `#/profile` = hồ sơ của mình; `#/profile/<playerId>` = người khác. `routes.ts` hiện chỉ đọc đoạn đầu của hash (`parse` cắt ở `/`) nên `#/profile/minh` vẫn ra route `profile` — thêm hàm đọc tham số thứ hai (ví dụ `useHashParam()` trong `routes.ts`), không thêm thư viện router. Id không tồn tại → `EmptyState` "Không tìm thấy người chơi" + nút "Về hồ sơ của tôi".
- Chạy: `npm run dev` → `http://localhost:5173/demo/app/#/profile` (đăng nhập `demo` / `demo`). Kiểm tra: `npm run typecheck`, `npm run build`.

## 2. File cần tạo / sửa

| File | Việc |
|---|---|
| `demo/app/screens/ProfileScreen.tsx` | Trang chính: đầu trang + tab (mới) |
| `demo/app/screens/profile/ProfileHeader.tsx` | Dải đầu trang (mới) |
| `demo/app/screens/profile/OverviewTab.tsx` | Tab Tổng quan (mới) |
| `demo/app/screens/profile/HistoryTab.tsx` | Tab Lịch sử đấu: Trận đấu / Giải đấu (mới) |
| `demo/app/screens/profile/AchievementsTab.tsx` | Tab Thành tựu (mới) |
| `demo/app/screens/profile/InventoryTab.tsx` | Tab Kho đồ (mới) |
| `demo/app/screens/profile/FriendsTab.tsx` | Tab Bạn bè (mới) |
| `demo/app/screens/profile/EditProfileDialog.tsx` | Hộp thoại "Sửa hồ sơ" (mới) |
| `demo/app/profileMock.ts` | Kiểu dữ liệu + dữ liệu giả có seed + thao tác (mới) |
| `demo/app/routes.ts` | Đọc tham số `#/profile/<id>` |
| `demo/app/App.tsx` | Dùng `ProfileScreen` khi `current === "profile"`; ẩn SideNav |
| `demo/app/profile.tsx` | Hộp thoại hồ sơ nhanh: thêm nút **"Xem hồ sơ đầy đủ"** → `#/profile/<id>`; nếu đưa `mockProfile` sang `profileMock.ts` thì hộp thoại dùng chung để số liệu hai nơi **khớp nhau** |
| `PLAN.md` | Ghi chú tiến độ dưới mục T7 (xem §6) |

Giữ mỗi file dưới ~400 dòng. Comment tiếng Anh, ngắn, giải thích *tại sao* — mật độ như code xung quanh.

## 3. Đặc tả

### 3.1 Bố cục

Trong `AppShell` (TopBar + LaunchBar). Trên cùng là **đầu trang** (cao ~200px), dưới là thanh `Tabs` và vùng nội dung tab (cuộn dọc bên trong nếu dài; trang không cuộn).

Tab: **Tổng quan · Lịch sử đấu · Thành tựu · Kho đồ · Bạn bè**. Hồ sơ người khác **không có tab Kho đồ**. Tab đang mở giữ trong hash (ví dụ `#/profile/minh?tab=achievements` hoặc `#/profile/minh/achievements`) để tải lại vẫn đúng tab.

### 3.2 Đầu trang (`ProfileHeader`)

- Nền: ảnh "Nền hồ sơ" đang trang bị (mặc định `assets/hub/bg/village-dusk.webp`; các nền khác lấy từ `assets/hub/bg/`), phủ tối để chữ đọc rõ (class token, không hex).
- `Avatar` `2xl` + **khung avatar** đang trang bị (viền theo độ hiếm, xem §3.6).
- Tên (heading), **thẻ clan** `[ABC]` cạnh tên, **danh hiệu** đang dùng (dòng nhỏ, ví dụ « Bá chủ Hy Lạp »).
- Dòng phụ: `StatusDot` + trạng thái, hạng + điểm + biến động tuần (▲/▼), đế chế yêu thích (`GameIcon` nhà theo kiến trúc + tên), cờ màu người chơi, "Tham gia 03/2025".
- Phải: tối đa **3 thành tựu ghim** (icon + `Tooltip` tên) và số cúp giải đấu (icon `trophy` × n).
- Nút: **mình** → "Sửa hồ sơ" (`EditProfileDialog`); **người khác** → "Kết bạn" (cùng trạng thái với hộp thoại nhanh: Kết bạn / Đã gửi lời mời / Đã là bạn bè), "Nhắn tin" (T6 chưa có → `Toast` "Tin nhắn riêng làm ở T6"), "Mời vào phòng" (`Toast` giả lập), menu ⋯: Chặn (xác nhận bằng `Dialog`), Báo cáo (`Toast`).

`EditProfileDialog`: giới thiệu (`Textarea`, ≤ 200 ký tự, đếm ký tự), đế chế yêu thích (`Select` 16 đế chế), ghim thành tựu (chọn tối đa 3 trong số đã đạt; chọn thứ 4 → khoá kèm lý do). Lưu → đầu trang cập nhật + `Toast`.

### 3.3 Tab Tổng quan

Hai cột: trái rộng, phải hẹp (~360px).

- **Trái:**
  - Hàng `StatBlock`: Số trận · Tỉ lệ thắng · Điểm (delta tuần) · Chuỗi thắng · Giờ chơi.
  - **Điểm 30 ngày:** đường nhỏ (SVG inline, màu từ token qua `currentColor` / class), có điểm thấp nhất – cao nhất.
  - **10 trận gần nhất:** hàng chấm thắng (`success`) / thua (`danger`), `Tooltip` mỗi chấm: thể loại, ngày, điểm ±.
  - **Đế chế hay dùng:** 5 dòng — icon nhà theo kiến trúc, tên, số trận, tỉ lệ thắng (`ProgressBar` mảnh).
  - **Thể loại / loại map:** Random, Cung R Shang; Map sáng / đen / đồng minh — số trận + tỉ lệ thắng.
  - **Hay chơi cùng:** 5 người (`Avatar` + tên + số trận chung), bấm → `#/profile/<id>`.
- **Phải (ghi nhỏ — đã chốt):**
  - **Giới thiệu** (văn bản người chơi viết; trống → chữ mờ "Chưa có giới thiệu").
  - **Clan:** thẻ + tên clan, vai (Trưởng clan / Phó / Thành viên), ngày vào, số thành viên. Không có clan → "Chưa tham gia clan".
  - **Hạng theo mùa:** 3–4 dòng: tên mùa, hạng cuối mùa (mùa hiện tại: hạng hiện tại), hạng cao nhất.

### 3.4 Tab Lịch sử đấu

`Tabs` segmented: **Trận đấu · Giải đấu**.

- **Trận đấu:** bảng — Kết quả (Thắng / Thua, màu `success` / `danger`), Thể loại, Loại map, Đế chế (icon + tên), Đồng đội / Đối thủ (avatar nhỏ chồng nhau, `Tooltip` tên), Thời lượng, Ngày, Điểm ±. Lọc: thể loại (`Select`), kết quả (`Select`: Tất cả / Thắng / Thua), thời gian (7 ngày / 30 ngày / Tất cả). "Tải thêm" (`Pagination` load-more, 20 dòng mỗi lần, giả lập tải 0,6 s với `Spinner`). Bấm dòng → `Dialog` chi tiết trận: hai bên, mỗi người (tên, đế chế, màu), thời lượng, điểm ± (T9 sẽ làm hộp thoại kết quả đầy đủ — bản này giữ đơn giản).
- **Giải đấu:** danh sách giải đã tham gia — tên giải, ngày, đội, vai (Đội trưởng / Thành viên), thành tích (Vô địch 🏆 / Á quân / Bị loại ở <vòng> / Đang đấu). Lấy từ `tournamentMock.ts` nếu người này có trong một đội; còn lại sinh thêm vài giải cũ có seed. Bấm → `#/tournament` (nếu `TournamentScreen` nhận được id giải thì mở đúng giải; không thì chỉ chuyển trang — ghi rõ trong báo cáo).
- Rỗng → `EmptyState` ("Chưa có trận nào" / "Chưa tham gia giải nào").

### 3.5 Tab Thành tựu

- Thanh trên: tổng "Đã đạt 23/60", lọc **Đã đạt / Chưa đạt / Tất cả** (`Tabs` segmented), lọc nhóm.
- Lưới huy hiệu, chia nhóm có tiêu đề: **Chiến trận** (thắng 10 / 100 / 1000 trận, chuỗi thắng 5 / 10…) · **Đế chế** (thắng 50 trận với từng đế chế — 16 huy hiệu) · **Giải đấu** (tham gia giải, vào chung kết, vô địch) · **Cộng đồng** (có 10 bạn, chơi 50 trận cùng bạn bè, làm chủ phòng 100 lần) · **Mùa giải** (hạng cuối mùa).
- Mỗi huy hiệu: icon từ asset game (`GameIcon` `tech` / `unit` / `building:<faction>`), tên, mô tả, `ProgressBar` tiến độ (`37/50`) khi chưa đạt, ngày đạt khi đã đạt, **độ hiếm** "% người chơi có". Chưa đạt → icon xám + mờ. Huy hiệu mở khoá vật phẩm → ghi "Thưởng: <vật phẩm>".
- Hồ sơ của mình: mỗi huy hiệu đã đạt có nút ghim (icon `star`); tối đa 3, ghim thứ 4 → khoá + `Tooltip` "Đã ghim đủ 3 — bỏ ghim một cái trước". Ghim đổi → đầu trang cập nhật ngay.

### 3.6 Tab Kho đồ (chỉ hồ sơ của mình — đã chốt)

**Chỉ đồ trang trí, không tiền, không cửa hàng, không mua bán — đã chốt.** Không có nút / chữ nào gợi ý mua.

- **Trái:** danh mục (`Tabs` vertical): Avatar · Khung avatar · Danh hiệu · Nền hồ sơ · Biểu tượng chat — kèm số đã có / tổng.
- **Giữa:** lưới ô vật phẩm. **Độ hiếm = texture theme** (dùng `Surface texture=…`): Thường = `wood` · Hiếm = `sandstone` · Sử thi = `marble` · Huyền thoại = `darkstone` + viền `text-tone-focus`. Ô đang trang bị có dấu ✓. Ô chưa có: mờ + icon `lock`, `Tooltip` cách nhận ("Thành tựu: Thắng 100 trận", "Giải đấu: Vô địch", "Mùa 2: hạng Vàng", "Sự kiện Tết").
  - Avatar: dùng `AvatarSource` unit / civ có sẵn. Khung avatar: viền theo độ hiếm. Danh hiệu: chữ. Nền hồ sơ: ảnh trong `assets/hub/bg/`. Biểu tượng chat: icon nhỏ cạnh tên khi chat.
- **Phải:** **xem trước** — đầu hồ sơ thu nhỏ + một dòng `ChatMessage` mẫu với vật phẩm đang chọn; tên, độ hiếm, nguồn nhận; nút **"Trang bị"** (đã trang bị → "Đang dùng", khoá; chưa có → khoá kèm lý do). Trang bị → đầu trang cập nhật + `Toast`.

### 3.7 Tab Bạn bè (thêm theo người dùng)

- **Hồ sơ của mình:**
  - Trên cùng **Lời mời kết bạn** (n): mỗi dòng Đồng ý / Từ chối. Ẩn khi không có.
  - `SearchBar` lọc theo tên.
  - Danh sách nhóm theo trạng thái: **Đang chơi · Trực tuyến · Vắng · Ngoại tuyến** (tiêu đề nhóm + số). Mỗi dòng (`ListRow` / `PlayerChip`): avatar, tên, trạng thái / hoạt động ("Đang chơi: Đồng cỏ 2v2"), ping.
  - Hành động mỗi dòng (nút + menu ⋯): Xem hồ sơ (→ `#/profile/<id>`), Nhắn tin (`Toast` T6), Mời vào phòng (`Toast`), Huỷ kết bạn (xác nhận `Dialog`).
- **Hồ sơ người khác (đã chốt 13/11):** danh sách bạn của họ, **bạn chung lên đầu** có `Badge` "Bạn chung"; chỉ có Xem hồ sơ / Kết bạn.
- Rỗng → `EmptyState` "Chưa có bạn bè" (+ gợi ý "Tìm người chơi ở Sảnh").
- Ghi chú: T6 (Bạn bè & tin nhắn) sau này sẽ dùng lại danh sách này — viết phần danh sách thành component riêng (ví dụ `FriendList`) để dễ tái dùng.

### 3.8 Mình và người khác

| | Mình | Người khác |
|---|---|---|
| Tổng quan | ✓ | ✓ |
| Lịch sử đấu | ✓ | ✓ |
| Thành tựu | ✓ (ghim) | ✓ (chỉ xem) |
| Kho đồ | ✓ | ẩn tab (chỉ thấy đồ đang trang bị) |
| Bạn bè | ✓ (đầy đủ) | ✓ (bạn chung lên đầu) |

**Không có chế độ riêng tư** (người dùng chốt 13/11) — không làm công tắc, nhãn hay trạng thái "riêng tư" nào.

## 4. Dữ liệu giả — `profileMock.ts` + bảng "⚙ Dữ liệu giả"

- Sinh **theo id / tên người chơi, có seed** (cùng người → cùng dữ liệu mỗi lần tải; dùng hàm băm như `hash()` trong `profile.tsx`). Số liệu ở trang và ở hộp thoại hồ sơ nhanh phải **khớp nhau**.
- Gợi ý kiểu: `ProfileData { player, joinedAt, bio, favouriteCiv, clan?: { tag, name, role, joinedAt, members }, seasons: { name, finalRank, peakRank }[], stats: { matches, winRate, elo, eloWeekDelta, streak, hours }, elo30d: number[], recent: MatchRow[], civs: …, modes: …, mates: Player[], matches: MatchRow[], tournaments: …, achievements: Achievement[], pinned: string[], inventory: Item[], equipped: Record<ItemCategory, string>, friends: Player[], requests: Player[] }`.
- `Achievement { id, group, name, description, icon, progress, goal, achievedAt?, rarityPercent, reward?: itemId }` — khoảng 60 huy hiệu. `Item { id, category, name, rarity: "common" | "rare" | "epic" | "legendary", owned, source }` — mỗi danh mục 8–16 vật phẩm.
- Thay đổi trong phiên (ghim, trang bị, sửa hồ sơ, đồng ý / huỷ kết bạn) giữ trong state của app tới khi tải lại; "Đặt lại" xoá.
- Bảng Dữ liệu giả (`MockShell` + `MockChoice` / `MockSlider` / `MockCheck`):
  - Xem hồ sơ: **của mình / người khác** (chọn nhanh một người mẫu).
  - Số trận (0 → 2000; 0 = người mới: các khối thống kê hiện trạng thái rỗng hợp lý).
  - Tỉ lệ thắng (%).
  - Số thành tựu đã đạt (%).
  - Độ đầy kho đồ (%).
  - Có clan / không.
  - Số bạn bè, số lời mời kết bạn.
  - Trạng thái tải trang: bình thường / đang tải (skeleton hoặc `Spinner`) / lỗi (`EmptyState` + "Thử lại").
  - "Đặt lại".

## 5. Không tự quyết

Gặp quyết định không có trong brief / wireframe → làm phương án đơn giản nhất và ghi trong PLAN.md là "giả định, chờ người dùng chốt", không tự mở rộng phạm vi. Không làm: chế độ riêng tư, cửa hàng / tiền tệ, nhắn tin thật (T6), trang Cài đặt (T8), hộp thoại kết quả trận đầy đủ (T9), trang clan riêng.

## 6. Hoàn thành khi

- [x] `npm run typecheck` và `npm run build` không lỗi.
- [x] `/demo/app/#/profile` (đăng nhập `demo`/`demo`) và `#/profile/<id>` của một người khác: không lỗi console; đủ 5 tab (người khác 4 tab); tải lại giữ đúng người + tab; id sai → "Không tìm thấy người chơi".
- [x] Hộp thoại hồ sơ nhanh ở Sảnh / Phòng có "Xem hồ sơ đầy đủ" mở đúng người; số liệu khớp với trang.
- [x] Ghim thành tựu (giới hạn 3, tooltip lý do), trang bị vật phẩm, sửa hồ sơ → đầu trang cập nhật ngay.
- [x] Kho đồ: 4 độ hiếm hiện bằng 4 texture; ô chưa có khoá + tooltip nguồn nhận; không có chữ / nút nào về mua bán.
- [x] Bạn bè: đồng ý / từ chối lời mời, huỷ kết bạn có xác nhận, tìm theo tên, nhóm theo trạng thái; hồ sơ người khác có bạn chung lên đầu.
- [x] Bảng Dữ liệu giả đổi được mọi mục ở §4, kể cả người mới 0 trận và trạng thái đang tải / lỗi.
- [x] Không mã màu hex trong file `.tsx` mới.
- [x] Vừa 1600×900, không vỡ bố cục.
- [x] Cập nhật PLAN.md dưới mục **T7**: dòng "Bản đầu tiên (<ngày>, chờ duyệt — chưa đánh dấu xong)" liệt kê file tạo ra, đã làm, chưa làm, giả định, lỗi tìm thấy. **Không** đổi `- [ ]` của T7 thành `- [x]`.
- [x] Không sửa màn khác ngoài các chỗ nêu ở §2.

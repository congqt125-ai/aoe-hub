# Brief T11 — Trang Clan (giao cho agent dựng)

Tài liệu này đủ để một agent (Gemini) dựng **bản đầu tiên** của trang Clan trong app mẫu `demo/app/`. Đọc hết trước khi sửa code. Cách làm giống T5 Giải đấu và T7 Hồ sơ ([`t5-tournament-brief.md`](t5-tournament-brief.md), [`t7-profile-brief.md`](t7-profile-brief.md)) — giữ cùng phong cách code với các màn đã có.

## 0. Đọc trước

1. [`CLAUDE.md`](../CLAUDE.md) — quy tắc dự án (bắt buộc). Hay vi phạm:
   - Text trên UI, ghi chú trong PLAN.md: **tiếng Việt Unicode**. Tên file / biến / hàm / CSS class: tiếng Anh.
   - **Không hard-code mã màu** trong component — dùng class Tailwind từ preset (`text-tone-text`, `text-tone-state`, `text-tone-focus`, `bg-black/60`, `bevel-raised-2`, `bevel-sunken-1`, `frame-line`…). Màu cờ clan = **màu người chơi 1–8 có sẵn trong token** (như `Avatar` / `PlayerChip` dùng `player.color`), không tự đặt hex.
   - Không đụng thư mục game, không sửa `raw/`, `assets/ui/`, `tokens/` (sinh tự động).
   - **Không dùng con trỏ `cursor/pointer.png`** (con trỏ dấu "?").
2. [`PLAN.md`](../PLAN.md) → Bước 4 → mục **T11. Clan** (các điều đã chốt).
3. [`docs/wireframes.md`](wireframes.md) §11 **Clan** — wireframe của trang này. **Làm đúng theo đây.**
4. [`docs/ux-guidelines.md`](ux-guidelines.md) — trạng thái rỗng / đang tải / lỗi, focus, tooltip lý do khi nút bị khoá, xác nhận hành động phá huỷ.
5. Code mẫu (đọc kỹ, viết theo cùng phong cách):
   - [`demo/app/screens/ProfileScreen.tsx`](../demo/app/screens/ProfileScreen.tsx) + [`demo/app/screens/profile/`](../demo/app/screens/profile/) — đầu trang + tab, đọc tham số hash.
   - [`demo/app/screens/LobbyScreen.tsx`](../demo/app/screens/LobbyScreen.tsx) — bảng có lọc / tìm, `PanelTitle` / `PanelFooter` / `ChatBox` / `LINE` ([`panel.tsx`](../demo/app/screens/panel.tsx)).
   - [`demo/app/screens/TournamentScreen.tsx`](../demo/app/screens/TournamentScreen.tsx) — QTV / vai khác nhau thấy nút khác nhau, tin hệ thống trong chat.
   - [`demo/app/profileMock.ts`](../demo/app/profileMock.ts) — **dữ liệu clan đang có** (`ProfileClan`: `tag`, `name`, `role` "Trưởng clan" / "Phó" / "Thành viên", `joinedAt`, `members`; danh sách `CLANS`), `hashString`, `MOCK_SAMPLE_PLAYERS`, `resolveProfilePlayer`.
   - [`demo/app/routes.ts`](../demo/app/routes.ts) — `ROUTES`, `useHashRoute`, `useProfileRoute` (mẫu đọc tham số `#/profile/<id>`).
   - [`demo/app/profile.tsx`](../demo/app/profile.tsx) — `useProfile().open(player, anchor, extra)` mở menu người chơi.
   - [`demo/app/MockPanel.tsx`](../demo/app/MockPanel.tsx) — `MockShell`, `MockGroup`, `MockSlider`, `MockChoice`, `MockCheck`.
   - [`demo/app/tournamentMock.ts`](../demo/app/tournamentMock.ts) — giải đấu (cho tab Thành tích).
6. Thư viện component `components/index.ts`; xem ở `npm run dev` → `/demo/`. **Dùng lại component có sẵn** (`Avatar`, `Badge`, `StatusDot`, `StatBlock`, `ProgressBar`, `Tabs` + `TabPanel`, `Surface`, `GameIcon` với `set: "building:<faction>"` cho biểu tượng clan, `Icon` (`shield`, `crown`, `users`, `trophy`, `lock`…), `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Radio`, `Checkbox`, `Tooltip`, `Dialog`, `Toast`, `EmptyState`, `Spinner`, `ListRow`, `PlayerChip`, `SearchBar`, `Menu`, `ChatMessage`). Chỉ tạo component mới khi không có.

## 1. Kỹ thuật

- Vite 8 + React 19 + TypeScript + Tailwind 3.4. Không thêm thư viện npm.
- Sân khấu cố định **1600×900**; theme `hub-village`, kiểu viền B (`modern`).
- **Route mới `clan`** trong `routes.ts`: label "Clan", icon `shield`, task "T11", `inTopNav: true`, `inSideNav: true`, **đặt ngay sau `tournament`** trong mảng `ROUTES` (TopBar: Trang chủ · Sảnh · Giải đấu · **Clan** · Hồ sơ; SideNav Alt+4 = Clan, các phím sau lùi một — SideNav tự đánh số theo thứ tự).
- `#/clan` = clan của mình (chưa có → màn Tìm clan); `#/clan/<THẺ>` = xem clan khác ở chế độ khách; tab đang mở giữ trong hash như Hồ sơ. Thẻ không tồn tại → `EmptyState` "Không tìm thấy clan" + nút "Về Tìm clan".
- **Không SideNav** trong trang: thêm `current === "clan"` vào điều kiện ẩn `sideNav` trong `App.tsx`.
- Chạy: `npm run dev` → `http://localhost:5173/demo/app/#/clan` (đăng nhập `demo` / `demo`). Kiểm tra: `npm run typecheck`, `npm run build`.

## 2. File cần tạo / sửa

| File | Việc |
|---|---|
| `demo/app/clanMock.ts` | Kiểu dữ liệu + dữ liệu giả có seed + các thao tác (mới) |
| `demo/app/screens/ClanScreen.tsx` | Chọn hiển thị Tìm clan / trang clan theo trạng thái + hash (mới) |
| `demo/app/screens/clan/ClanFinder.tsx` | Màn Tìm clan + lời mời đã nhận (mới) |
| `demo/app/screens/clan/CreateClanDialog.tsx` | Hộp thoại tạo clan (mới) |
| `demo/app/screens/clan/ClanHeader.tsx` | Đầu trang clan (mới) |
| `demo/app/screens/clan/ClanOverviewTab.tsx` | Tab Tổng quan (mới) |
| `demo/app/screens/clan/ClanMembersTab.tsx` | Tab Thành viên (mới) |
| `demo/app/screens/clan/ClanRequestsTab.tsx` | Tab Đơn xin vào (mới) |
| `demo/app/screens/clan/ClanAchievementsTab.tsx` | Tab Thành tích (mới) |
| `demo/app/screens/clan/ClanManageTab.tsx` | Tab Quản lý (mới) |
| `demo/app/screens/clan/InviteDialog.tsx` | Hộp thoại mời người (mới) |
| `demo/app/routes.ts` | Route `clan` + đọc tham số `#/clan/<THẺ>` |
| `demo/app/App.tsx` | Dùng `ClanScreen` khi `current === "clan"`; ẩn SideNav |
| `demo/app/profileMock.ts` | Clan của hồ sơ lấy từ `clanMock.ts` (một nguồn dữ liệu); sửa số thành viên mẫu cho **≤ 50** (`HND` đang 52) |
| `demo/app/screens/profile/ProfileHeader.tsx`, `OverviewTab.tsx` | Thẻ / tên clan bấm được → `#/clan/<THẺ>` |
| `demo/app/screens/LobbyScreen.tsx` | Ở danh mục CLAN ROOMS thêm `Checkbox` "Phòng của clan tôi" (lọc phòng có chủ phòng cùng clan; chưa có clan → ẩn) |
| `PLAN.md` | Ghi chú tiến độ dưới mục T11 (xem §6) |

Giữ mỗi file dưới ~400 dòng. Comment tiếng Anh, ngắn, giải thích *tại sao*.

## 3. Đặc tả

### 3.1 Quy tắc chung (đã chốt)

- Mỗi người chơi ở **tối đa một clan**.
- Vai: **Trưởng clan** (đúng 1) · **Phó** (tối đa **3**) · **Thành viên**. Clan tối đa **50 thành viên** (tính cả Trưởng và Phó).
- Tạo clan **không mất phí**, không có tiền tệ / cửa hàng.
- **Không có đấu giữa các clan** ở bản này — Thành tích chỉ lấy từ giải đấu.
- Cách nhận người: **Mở** (bấm là vào) · **Duyệt đơn** · **Đóng** (không nhận, chỉ vào qua lời mời).

**Quyền theo vai:**

| Hành động | Trưởng clan | Phó | Thành viên |
|---|---|---|---|
| Viết / sửa / ghim thông báo | ✓ | ✓ | |
| Mời người | ✓ | ✓ | ✓ |
| Duyệt / từ chối đơn | ✓ | ✓ | |
| Thăng Phó / giáng xuống Thành viên | ✓ | | |
| Kích khỏi clan | mọi người | chỉ Thành viên | |
| Tab Quản lý (sửa thông tin, chuyển quyền Trưởng, giải tán) | ✓ | | |
| Rời clan | chỉ khi là người cuối (= giải tán) hoặc đã chuyển quyền | ✓ | ✓ |

Nút không đủ quyền: **ẩn** (không phải khoá). Nút đủ quyền nhưng bị chặn bởi điều kiện (đủ 50, đủ 3 Phó, Trưởng còn thành viên khác…) → **khoá + `Tooltip` lý do**. Mọi hành động phá huỷ (kích, rời, giải tán, chuyển quyền, giáng chức) có `Dialog` xác nhận.

### 3.2 Màn Tìm clan (chưa có clan) — `ClanFinder`

- Thanh trên: `SearchBar` (tên hoặc thẻ), lọc cách nhận người (`Select`: Tất cả / Mở / Duyệt đơn / Đóng), lọc hạng tối thiểu, nút **"+ Tạo clan"**.
- **Lời mời vào clan** đã nhận (ẩn khi không có): mỗi dòng — clan, người mời, Từ chối / Đồng ý (Đồng ý → vào clan với vai Thành viên, sang trang clan, `Toast`).
- **Bảng clan:** biểu tượng, thẻ, tên, thành viên `n/50`, hạng tối thiểu, cách nhận người, nút:
  - Mở + đủ điều kiện → **"Vào clan"** (vào ngay).
  - Duyệt đơn → **"Xin vào"** → `Dialog` lời nhắn (≤ 140 ký tự, có đếm) → "Đã gửi đơn" (nút thành "Huỷ đơn"). Chỉ có **một** đơn đang chờ mỗi clan.
  - Đóng / đủ 50 / hạng thấp hơn yêu cầu → khoá + tooltip ("Clan không nhận người", "Clan đã đủ 50 thành viên", "Cần hạng Vàng trở lên").
- Bấm dòng → `#/clan/<THẺ>` (chế độ khách, §3.4).
- Rỗng (không clan nào khớp lọc) → `EmptyState` + nút "Xoá lọc".

**`CreateClanDialog`:**
- Tên clan (bắt buộc, 3–24 ký tự, không trùng).
- Thẻ (bắt buộc, 2–4 ký tự `A–Z 0–9`, tự viết hoa khi gõ, không trùng; báo "Thẻ đã được dùng").
- Biểu tượng: chọn kiến trúc (5: Ai Cập, Hy Lạp, Babylon, Á Đông, La Mã → `GameIcon set="building:<faction>"`, chọn một frame công trình) + màu cờ (8 màu người chơi). Xem trước biểu tượng lớn.
- Giới thiệu (`Textarea`, ≤ 200 ký tự), cách nhận người (`Radio`), hạng tối thiểu (`Select`, có "Không yêu cầu").
- Kiểm tra lỗi theo cách màn Đăng nhập (lỗi khi rời ô / khi gửi, focus về ô lỗi đầu). Tạo xong → mình là **Trưởng clan**, sang trang clan, tin hoạt động "Clan được thành lập".

### 3.3 Trang clan (thành viên) — đầu trang + tab

**`ClanHeader`:** biểu tượng lớn (`Surface` + `GameIcon` + màu cờ), `[THẺ] Tên clan`, điểm clan + hạng clan (#), `n/50 thành viên`, Trưởng clan (bấm → menu người chơi), ngày thành lập, cách nhận người. Nút: **Mời người** (`InviteDialog`) · **Rời clan** · **⚙ Quản lý** (chỉ Trưởng; chuyển sang tab Quản lý).

**Tab:** Tổng quan · Thành viên · Đơn xin vào (chỉ Trưởng / Phó, kèm `Badge` số đơn) · Thành tích · Quản lý (chỉ Trưởng).

**Tổng quan** — hai cột, phải ~360px:
- **Thông báo:** tối đa 3 ghim lên đầu (📌), mỗi thông báo: nội dung, người viết, thời gian. Trưởng / Phó: "+ Viết thông báo" (`Textarea` ≤ 300 ký tự), sửa, xoá, ghim / bỏ ghim (ghim thứ 4 → khoá + lý do). Rỗng → chữ mờ "Chưa có thông báo".
- **Hoạt động gần đây:** danh sách sự kiện mới nhất trên đầu — vào clan, rời clan, bị kích, thăng / giáng chức, đổi thông tin clan, thành tích giải ("Đội ABC Team vào bán kết Cúp Mùa Thu"). Mọi thao tác trong trang đều thêm dòng ở đây.
- **Đang online:** avatar các thành viên online, bấm → `useProfile().open(...)`.
- **Cột phải:** `ChatBox` "Chat clan"; các hoạt động quan trọng (vào / rời / thăng chức) cũng hiện dạng tin hệ thống.

**Thành viên** — bảng: tên (avatar + `StatusDot`), vai (`Badge`: Trưởng clan có `crown`), hạng, điểm đóng góp, ngày vào, lần online gần nhất ("Đang online" / "3 giờ trước"). Sắp xếp theo cột (mặc định: vai rồi điểm đóng góp), lọc vai (`Select`), tìm tên. Bấm dòng / tên → `useProfile().open(player, anchor, extra)` với `extra` theo quyền §3.1: "Thăng Phó" (đủ 3 Phó → khoá + lý do), "Giáng xuống Thành viên", "Kích khỏi clan". Không có hành động với chính mình.

**Đơn xin vào** (Trưởng / Phó):
- Danh sách đơn: avatar, tên, hạng, lời nhắn, thời gian; "Xem hồ sơ", **Duyệt** (clan đủ 50 → khoá + lý do), **Từ chối**. Duyệt → người đó thành Thành viên, hoạt động + tin chat.
- Mục **"Lời mời đã gửi"**: người được mời, người mời, thời gian, "Huỷ lời mời".
- Rỗng → `EmptyState` "Không có đơn nào đang chờ".

**Thành tích:** `StatBlock` (điểm clan, số cúp, số giải đã tham gia), đường điểm clan 12 tuần (SVG nhỏ, màu từ token), danh sách giải có đội mang thẻ clan (giải, đội, thành tích: Vô địch / Á quân / bị loại ở vòng …) — bấm → `#/tournament`. Lấy từ `tournamentMock.ts` khi có đội mang thẻ clan, còn lại sinh có seed.

**Quản lý** (chỉ Trưởng):
- Sửa tên, biểu tượng, giới thiệu, cách nhận người, hạng tối thiểu (dùng lại phần form của `CreateClanDialog`). **Thẻ không đổi được** (hiện chỉ đọc + ghi chú "Thẻ clan không đổi sau khi tạo"). Lưu → `Toast` + hoạt động.
- **Chuyển quyền Trưởng clan:** chọn một thành viên (`Select`, Phó lên đầu) → `Dialog` xác nhận → mình thành Phó (nếu đủ 3 Phó thì thành Thành viên — nói rõ trong hộp xác nhận); tab Quản lý biến mất.
- **Giải tán clan:** vùng nguy hiểm cuối tab; `Dialog` yêu cầu **gõ đúng tên clan** mới bật nút "Giải tán". Xong → mọi người rời clan, về Tìm clan, `Toast`.

**Rời clan** (nút ở đầu trang): `Dialog` xác nhận → về Tìm clan. Trưởng clan khi còn người khác → nút khoá + tooltip "Chuyển quyền Trưởng clan trước khi rời". Trưởng là người cuối → hộp xác nhận nói rõ "Rời = giải tán clan".

**`InviteDialog`:** `SearchBar` tìm người chơi (từ `MOCK_SAMPLE_PLAYERS` / `makePlayers`), mỗi người: avatar, tên, hạng, nút "Mời". Đã ở clan khác → khoá + "Đã ở clan [XYZ]"; đã ở clan này → "Đã là thành viên"; đã mời → "Đã mời". Clan đủ 50 → mọi nút Mời khoá + lý do.

### 3.4 Chế độ khách (`#/clan/<THẺ>` khác clan của mình)

Cùng đầu trang nhưng nút là **Vào clan / Xin vào / Huỷ đơn / khoá** (như bảng Tìm clan); đã có clan khác → không có nút, chỉ dòng "Bạn đang ở clan [XYZ]". Tab: **Tổng quan** (thông báo ghim + hoạt động + đang online; **không có chat clan**), **Thành viên** (chỉ đọc, không hành động quản lý), **Thành tích**. Không có Đơn xin vào / Quản lý.

### 3.5 Liên kết với trang khác

- Hồ sơ: thẻ clan ở `ProfileHeader` và khối Clan ở tab Tổng quan bấm được → `#/clan/<THẺ>`. Dữ liệu clan của hồ sơ lấy từ `clanMock.ts` (vai, ngày vào, số thành viên **khớp** với trang clan).
- Sảnh › CLAN ROOMS: `Checkbox` "Phòng của clan tôi" (chỉ hiện khi mình có clan).

## 4. Dữ liệu giả — `clanMock.ts` + bảng "⚙ Dữ liệu giả"

- Kiểu gợi ý: `Clan { tag, name, emblem: { faction, frame, color }, bio, recruit: "open" | "approval" | "closed", minRank?, points, rankPosition, foundedAt, members: ClanMember[], announcements: Announcement[], activity: ClanActivity[], requests: JoinRequest[], invitesSent: ClanInvite[], pointsHistory: number[] }`, `ClanMember { player, role: "Trưởng clan" | "Phó" | "Thành viên", joinedAt, contribution, lastOnline }`.
- **8–12 clan mẫu** có seed (gồm 3 clan đang có trong `profileMock.ts`: ABC, HND, SGP), đủ các cách nhận người, có clan đủ 50, có clan yêu cầu hạng.
- Thay đổi trong phiên (tạo, vào, rời, duyệt, kích, thăng chức, thông báo, sửa thông tin, giải tán) giữ trong state của app tới khi tải lại; "Đặt lại" xoá.
- Bảng Dữ liệu giả (`MockShell` + `MockChoice` / `MockSlider` / `MockCheck`):
  - Vai của bạn: **Chưa có clan / Thành viên / Phó / Trưởng clan**.
  - Số thành viên clan của bạn (1 → 50).
  - Số Phó (0 → 3).
  - Số đơn đang chờ (0 → 20), số lời mời đã nhận (0 → 3).
  - Cách nhận người của clan bạn.
  - Số thông báo (0 → 6).
  - Trạng thái tải trang: bình thường / đang tải / lỗi (`EmptyState` + "Thử lại").
  - "Đặt lại".

## 5. Không tự quyết

Gặp quyết định không có trong brief / wireframe → làm phương án đơn giản nhất và ghi trong PLAN.md là "giả định, chờ người dùng chốt", không tự mở rộng phạm vi. **Không làm:** đấu giữa các clan / clan war, tiền / phí / cửa hàng, kho đồ clan, chat clan thật qua mạng, nhắn tin riêng thật (T6 — dùng `Toast`).

## 6. Hoàn thành khi

- [x] `npm run typecheck` và `npm run build` không lỗi.
- [x] TopBar có "Clan" giữa Giải đấu và Hồ sơ; Alt+4 mở Clan; trang không có SideNav; không lỗi console.
- [x] Chưa có clan: tìm / lọc; Vào clan (Mở); Xin vào có lời nhắn + Huỷ đơn; nút khoá đúng lý do (Đóng / đủ 50 / thiếu hạng); Đồng ý lời mời → vào clan.
- [x] Tạo clan: lỗi tên / thẻ trùng, thẻ tự viết hoa, xem trước biểu tượng; tạo xong là Trưởng clan.
- [ ] Đổi vai bằng bảng Dữ liệu giả → nút và tab hiện / ẩn đúng bảng quyền §3.1 (Thành viên không thấy Đơn xin vào / Quản lý; Phó chỉ kích được Thành viên).
- [ ] Thăng Phó khoá khi đủ 3; Duyệt đơn / Mời khoá khi đủ 50; Trưởng không rời được khi còn người; chuyển quyền; giải tán phải gõ đúng tên.
- [x] Mọi thao tác thêm dòng Hoạt động gần đây (và tin hệ thống ở chat với vào / rời / thăng chức).
- [x] `#/clan/<THẺ>` clan khác: chế độ khách đúng §3.4; thẻ sai → "Không tìm thấy clan"; tải lại giữ đúng clan + tab.
- [x] Thẻ clan ở Hồ sơ bấm được, số liệu clan ở Hồ sơ khớp trang clan; Sảnh có lọc "Phòng của clan tôi".
- [x] Không mã màu hex trong file `.tsx` mới; vừa 1600×900 với clan 50 người.
- [x] Cập nhật PLAN.md dưới mục **T11**: dòng "Bản đầu tiên (<ngày>, chờ duyệt — chưa đánh dấu xong)" liệt kê file tạo ra, đã làm, chưa làm, giả định, lỗi tìm thấy. **Không** đổi `- [ ]` của T11 thành `- [x]`.
- [x] Không sửa màn khác ngoài các chỗ nêu ở §2.

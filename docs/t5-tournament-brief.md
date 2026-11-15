# Brief T5 — Màn Giải đấu (giao cho agent dựng)

Tài liệu này đủ để một agent (Gemini) dựng **bản đầu tiên** của màn Giải đấu trong app mẫu `demo/app/`. Đọc hết trước khi sửa code.

## 0. Đọc trước

1. [`CLAUDE.md`](../CLAUDE.md) — quy tắc dự án (bắt buộc). Tóm tắt những điều hay vi phạm:
   - Text trên UI, ghi chú trong PLAN.md: **tiếng Việt Unicode**. Tên file / biến / hàm / CSS class: tiếng Anh.
   - **Không hard-code mã màu** trong component — dùng class Tailwind từ preset (`text-tone-text`, `text-tone-state`, `text-tone-focus`, `bg-black/60`, `bevel-raised-2`, `bevel-sunken-1`, `frame-line`…). CSS riêng chỉ khi Tailwind không làm được.
   - Không đụng thư mục game, không sửa `raw/`, `assets/ui/`, `tokens/` (sinh tự động).
   - **Không dùng con trỏ `cursor/pointer.png`** (con trỏ dấu "?").
2. [`PLAN.md`](../PLAN.md) → Bước 4 → mục **T5. Giải đấu** (phạm vi + các điều đã chốt).
3. [`docs/wireframes.md`](wireframes.md) §5 **Giải đấu** — wireframe ASCII của màn này.
4. [`docs/ux-guidelines.md`](ux-guidelines.md) — quy tắc UX (trạng thái rỗng / đang tải / lỗi, focus, tooltip lý do khi nút bị khoá, chuyển động 100/150/200 ms).
5. Code mẫu để bắt chước (đọc kỹ, viết theo cùng phong cách):
   - [`demo/app/screens/LobbyScreen.tsx`](../demo/app/screens/LobbyScreen.tsx) — bố cục 3 cột, danh sách trái nối thân bằng đường kẻ, cột phải chat.
   - [`demo/app/screens/RoomScreen.tsx`](../demo/app/screens/RoomScreen.tsx) — thẻ ghế người chơi, menu ngữ cảnh, kéo thả, xác nhận bằng `Dialog`, đếm ngược.
   - [`demo/app/screens/panel.tsx`](../demo/app/screens/panel.tsx) — `PanelTitle`, `PanelFooter`, `ChatBox`, `LINE`.
   - [`demo/app/MockPanel.tsx`](../demo/app/MockPanel.tsx) — `MockShell`, `MockGroup`, `MockSlider`, `MockChoice`, `MockCheck` (bảng "⚙ Dữ liệu giả" trên thanh rìa phải).
   - [`demo/app/lobbyMock.ts`](../demo/app/lobbyMock.ts) — dữ liệu giả có seed (`rng`, `pick`, `makePlayers`, `makeChat`).
   - [`demo/app/profile.tsx`](../demo/app/profile.tsx) — `useProfile().open(player, anchor, extra)` mở menu người chơi; `useMentionTarget`.
   - [`demo/app/App.tsx`](../demo/app/App.tsx), [`demo/app/routes.ts`](../demo/app/routes.ts) — route `tournament` **đã có** (hiện màn chờ `PlaceholderScreen`).
6. Thư viện component: `components/index.ts` (atoms / molecules / organisms). Xem trực quan ở `npm run dev` → `/demo/` (mục Nguyên tử / Phân tử / Thành phần). **Dùng lại component có sẵn** (`Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Tabs`, `Avatar`, `Badge`, `StatusDot`, `PingIndicator`, `Tooltip`, `Dialog`, `Toast`, `EmptyState`, `Spinner`, `ListRow`, `PlayerChip`, `ChatMessage`, `Icon` — có icon `trophy`, `crown`, `clock`, `sword`, `eye`, `lock`…). Chỉ tạo component mới khi không có.

## 1. Kỹ thuật

- Stack: Vite 8 + React 19 + TypeScript + Tailwind 3.4 (preset trong `tokens/tailwind.preset.js`).
- App chạy trên **sân khấu cố định 1600×900** (không responsive). Màn Giải đấu dùng theme `hub-village`, kiểu viền B (`modern`) — đã khai báo trong `routes.ts`.
- **Không có SideNav** ở màn này (như Sảnh / Phòng): trong `App.tsx` thêm `current === "tournament"` vào điều kiện ẩn `sideNav`.
- Chạy: `npm run dev` → `http://localhost:5173/demo/app/#/tournament` (đăng nhập `demo` / `demo`). Kiểm tra kiểu: `npm run typecheck`. Build: `npm run build`.
- Không thêm thư viện npm mới.

## 2. File cần tạo / sửa

| File | Việc |
|---|---|
| `demo/app/screens/TournamentScreen.tsx` | Màn chính (mới) |
| `demo/app/screens/TeamCard.tsx` | Card đội (mới) |
| `demo/app/screens/Bracket.tsx` | Sơ đồ nhánh loại trực tiếp + thẻ trận (mới) |
| `demo/app/screens/TournamentSetupDialog.tsx` | Hộp thoại QTV tạo / sửa giải (mới) |
| `demo/app/screens/MatchResultDialog.tsx` | Chi tiết trận + QTV nhập kết quả (mới) |
| `demo/app/tournamentMock.ts` | Kiểu dữ liệu + dữ liệu giả có seed + các hàm thao tác (mới) |
| `demo/app/App.tsx` | Thay `PlaceholderScreen` bằng `TournamentScreen` khi `current === "tournament"`; ẩn SideNav |
| `PLAN.md` | Ghi chú tiến độ dưới mục T5 (xem §6) |

Tách nhỏ hơn nếu file quá dài (> ~400 dòng). Giữ mật độ comment như code xung quanh: comment tiếng Anh, ngắn, giải thích *tại sao*.

## 3. Đặc tả

### 3.1 Vòng đời giải (pha)

`draft` (Nháp, chỉ QTV thấy) → `registration` (Đăng ký) → `drawing` (Ngày xếp đội: đang lập sơ đồ) → `playing` (Thi đấu) → `finished` (Kết thúc).

Đầu thân màn có **thanh pha** (`PhaseStepper`): `Đăng ký ── Xếp đội <ngày giờ> ── Thi đấu ── Kết thúc`; pha đã qua có dấu ✓, pha hiện tại sáng (`text-tone-focus`), pha sau mờ.

### 3.2 Bố cục (1600×900, trong `AppShell` có TopBar + LaunchBar)

- **Trái (~240px):** danh sách giải nhóm theo pha — "Đang đăng ký", "Đang đấu", "Đã kết thúc" (QTV thấy thêm "Nháp"). Mỗi dòng: tên giải, số đội có người / tối đa. Chọn dòng → thân hiện giải đó. QTV: nút "+ Tạo giải" trên đầu cột. Nối thân bằng đường kẻ như Sảnh.
- **Giữa:** tiêu đề giải (tên, thể loại, giải thưởng, đếm ngược tới ngày xếp đội khi đang đăng ký) + thanh pha + `Tabs` theo pha (bên dưới). QTV: nút "Sửa giải" ở tiêu đề (chỉ tới ngày xếp đội).
- **Phải (~360px):** trên — **"Trận của bạn"** (khi đang đấu: đối thủ, giờ, vòng; khi đang đăng ký: đội của bạn + nút Rời đội); dưới — **Chat giải** (`ChatBox`), các sự kiện của giải (đổi đội trưởng, đổi luật, kết quả trận) báo vào đây dưới dạng tin hệ thống.

### 3.3 Pha Đăng ký — tab **Đội** (mặc định) · **Luật**

**Đã chốt với người dùng — làm đúng như sau:**

- **Lưới card đội có sẵn, mỗi hàng 4 card.** Số card = số đội tối đa (8 / 16 / 32 → 2 / 4 / 8 hàng). Vùng lưới cuộn dọc.
- **Mỗi đội tối đa 4 người, xếp dọc theo cột** trong card: 4 ô cố định, ô có người hiện avatar (`Avatar` sm), tên, hạng, ping; ô trống hiện "Trống" mờ. Đầu card: tên đội + `n/4`. Chân card: nút hành động.
- **Người chơi tự bấm vào đội** (bấm card hoặc nút chân card):
  - Card trống → nút "Vào – làm đội trưởng".
  - Card còn chỗ → "Vào đội"; nếu mình đang ở đội khác → "Chuyển vào" và hỏi xác nhận bằng `Dialog` ("Rời <đội cũ> và vào <đội mới>?"; nếu mình là đội trưởng đội cũ, nói rõ quyền đội trưởng sẽ chuyển cho ai).
  - Card đủ 4 → nút khoá, `Tooltip` "Đội đã đủ 4 người".
  - Card của mình → viền vàng (focus), nút "Đang ở đây".
- **Người vào đầu tiên là đội trưởng** (icon `crown` cạnh tên) và **được đặt tên đội**: nút ✎ cạnh tên đội (chỉ đội trưởng và QTV thấy) → sửa tại chỗ bằng `Input`, Enter lưu / Esc huỷ; 1–24 ký tự, không trùng tên đội khác (báo lỗi dưới ô). Đội chưa đặt tên hiện "Đội <số thứ tự>".
- Thứ tự trong cột = thứ tự vào đội.
- **Được rời đội và đổi đội** tới ngày xếp đội. Đội trưởng rời → quyền đội trưởng chuyển cho người vào kế tiếp (tin hệ thống trong chat giải). Đội trở về trống → tên quay về "Đội <số>".
- Mỗi người chỉ ở **một** đội. Phía trên lưới: "Bạn: <tên đội> · [Rời đội]" hoặc "Bạn chưa vào đội nào — bấm một đội để tham gia".
- Bấm vào tên / avatar một người trong card → `useProfile().open(...)` (menu người chơi như ở Sảnh). QTV có thêm mục "Mời ra khỏi đội" và "Đặt làm đội trưởng".
- Tab **Luật:** văn bản luật QTV soạn + tóm tắt thể thức (loại trực tiếp, số ván mỗi vòng, loại map, người tối thiểu mỗi đội).

### 3.4 QTV — thiết lập giải (`TournamentSetupDialog`, `Dialog` cỡ lớn)

Mở từ "+ Tạo giải" (giải mới, pha `draft`) hoặc "Sửa giải". `Tabs` dọc: **Thông tin · Thể thức · Lịch · Luật**.

- Thông tin: tên giải (bắt buộc, ≤ 40 ký tự), thể loại (`Select`: Random / Cung R Shang — dùng `GAME_TYPES` trong `roomMock.ts`), giải thưởng (text, tuỳ chọn).
- Thể thức: **Loại trực tiếp** (cố định, hiện dạng chữ, không cho đổi); số đội tối đa 8 / 16 / 32; người mỗi đội: tối đa 4 (cố định), **tối thiểu để vào nhánh** 1–4 (mặc định 4); số ván: vòng thường Bo1 / Bo3, bán kết & chung kết Bo1 / Bo3 / Bo5; loại map (`MAP_TYPES` trong `roomMock.ts`).
- Lịch: **ngày xếp đội** (ngày + giờ), giờ bắt đầu vòng 1, khoảng cách giữa các vòng (1 giờ / 1 ngày / 1 tuần). Ngày xếp đội phải trước vòng 1 (lỗi dưới ô nếu sai).
- Luật: `Textarea` + nút "Chèn mẫu luật" (chèn vài dòng mẫu: không rush trước phút 15; trễ quá 10 phút xử thua; mất kết nối trong 5 phút đầu được đấu lại…).
- Nút: "Lưu nháp" (pha `draft`) · "Công bố giải" (sang `registration`). Kiểm tra lỗi theo cách của màn Đăng nhập (lỗi hiện khi rời ô hoặc khi gửi, focus về ô lỗi đầu tiên).
- Sửa sau khi công bố: được tới ngày xếp đội; mỗi lần lưu báo tin hệ thống trong chat giải. Giảm số đội tối đa mà có đội đang có người ở các card bị bỏ → chặn, báo lý do.

### 3.5 Ngày xếp đội (pha `drawing`)

- Tới giờ (trong bản mẫu: QTV bấm "Chốt đội & lập sơ đồ", hoặc đổi pha ở bảng Dữ liệu giả) → **khoá đội** (không vào / rời / đổi được; nút trong card ẩn).
- Đội có số người < tối thiểu bị **loại khỏi giải** (card mờ + nhãn "Không đủ người"; tin hệ thống).
- Các đội còn lại được **bốc thăm ngẫu nhiên vào nhánh loại trực tiếp**. Số đội không phải lũy thừa của 2 → làm tròn lên lũy thừa 2 gần nhất, các đội bốc được ô trống **miễn vòng 1** (thẻ trận hiện "Miễn đấu", đội tự lên vòng 2).
- QTV xem trước sơ đồ → "Bốc lại" hoặc "Công bố sơ đồ" (sang `playing`). Người chơi trong lúc này thấy `Spinner` + "Đang lập sơ đồ…".

### 3.6 Pha Thi đấu — tab **Sơ đồ đấu** (mặc định) · **Lịch sử đấu** · **Đội** · **Luật**

**Sơ đồ đấu (`Bracket`):**
- Cột theo vòng, tên cột: "Vòng 1/16", "Vòng 1/8", "Tứ kết", "Bán kết", "Chung kết" (tuỳ số đội). 16 đội = 4 cột vừa màn; 32 đội = 5 cột, cuộn ngang được.
- Thẻ trận (`MatchCard`): 2 dòng đội (tên đội, tỉ số), giờ đấu, trạng thái: Sắp đấu / ● Đang đấu / Xong / Xử thắng / Miễn đấu. Đội thắng sáng, đội thua mờ. Ô vòng sau chưa có đội → "Chờ đội thắng trận X".
- Đường nối giữa các thẻ (CSS border hoặc SVG; màu từ token, ví dụ class `frame-line`).
- **Trận có đội của mình: viền vàng.** Rê chuột lên một đội → sáng đường đi của đội đó qua các vòng.
- Bấm thẻ trận → `MatchResultDialog`.

**`MatchResultDialog`:**
- Hiện 2 đội (danh sách thành viên), thể thức BoN của vòng, từng ván: bên thắng, map, ghi chú.
- **QTV nhập kết quả tay (đã chốt):** với mỗi ván chọn bên thắng (`Radio` / nút chọn), tỉ số tự tính; ô ghi chú; "Xử thắng" cho một đội (lý do: bỏ cuộc / trễ giờ / khác). Không cho lưu khi chưa đủ số ván thắng (Bo3 cần 2) — nút khoá kèm lý do.
- Lưu → trận thành "Xong", **đội thắng tự lên ô vòng sau**, trận vào Lịch sử đấu, tin hệ thống trong chat giải. QTV sửa lại được kết quả trận khi trận vòng sau **chưa** có kết quả.
- Người không phải QTV: chỉ xem; trận đang đấu có nút "Vào xem" (chỉ cần hiện, chưa phải nối sang Phòng).

**Lịch sử đấu:** bảng trận đã xong, mới nhất trên đầu — thời gian, vòng, đội A, tỉ số, đội B, ghi chú (Xử thắng: lý do). Lọc: theo vòng (`Select`), "Chỉ trận của tôi" (`Checkbox`). Rỗng → `EmptyState` "Chưa có trận nào kết thúc".

**Đội:** lưới card đội như pha Đăng ký nhưng chỉ đọc; đội bị loại có nhãn "Bị loại ở <vòng>".

### 3.7 Pha Kết thúc

Banner trên tab Sơ đồ đấu: đội vô địch (tên, thành viên, icon `trophy`), hạng 2. Mọi tab chỉ đọc.

### 3.8 Vai

- **QTV:** thấy mọi nút quản lý (tạo / sửa giải, chốt đội, bốc lại, nhập kết quả, mời ra, đặt đội trưởng, đổi tên đội bất kỳ).
- **Người chơi:** vào / rời / đổi đội; đội trưởng đặt tên đội của mình.
- Nút bị khoá luôn có `Tooltip` nói lý do (ux-guidelines).

## 4. Dữ liệu giả — `tournamentMock.ts` + bảng "⚙ Dữ liệu giả"

- Kiểu gợi ý: `Tournament { id, name, gameType, prize, phase, maxTeams, minPlayers, bestOf: { normal, final }, mapType, drawAt, startAt, roundGap, rules, teams: Team[], matches: Match[] }`, `Team { id, index, name?, members: Player[] /* [0] = captain */, eliminated?: { reason, round } }`, `Match { id, round, slot, teamA?, teamB?, games: { winner: "A" | "B" }[], forfeit?, status, at }`.
- Sinh có seed (dùng `rng` / `makePlayers` trong `lobbyMock.ts`), cùng cấu hình → cùng dữ liệu. Có 3–4 giải mẫu ở các pha khác nhau.
- Bảng Dữ liệu giả (dùng `MockShell` + `MockChoice` / `MockSlider` / `MockCheck`):
  - Pha của giải đang xem (Nháp / Đăng ký / Xếp đội / Thi đấu / Kết thúc).
  - Vai: QTV / Người chơi.
  - Mình đang ở: không đội / một đội / là đội trưởng.
  - Số đội tối đa 8 / 16 / 32; độ đầy các đội (%).
  - Số trận đã xong (0 → hết); có trận đang đấu.
  - "Đặt lại".
- Đổi pha bằng bảng phải sinh dữ liệu hợp lệ cho pha đó (ví dụ sang Thi đấu → đã có sơ đồ từ các đội hiện tại).

## 5. Phạm vi bản đầu — giữ đơn giản

**Mỗi đội tối đa 4 thành viên** (tương ứng tối đa 4v4 trong một trận AoE). Bản đầu: trận chỉ ghi **đội A vs đội B** và bên thắng từng ván, không cần chọn lại đội hình.

Gặp quyết định khác không có trong brief / wireframe → làm phương án đơn giản nhất, ghi rõ trong PLAN.md ("giả định, chờ người dùng chốt") thay vì tự mở rộng phạm vi.

## 6. Hoàn thành khi

- [x] `npm run typecheck` và `npm run build` không lỗi.
- [x] Mở `/demo/app/#/tournament` (đăng nhập `demo`/`demo`): không lỗi console; chạy được đủ các pha bằng bảng Dữ liệu giả.
- [ ] Pha Đăng ký: vào đội trống → thành đội trưởng, đặt tên (lỗi trùng / rỗng hiện đúng); chuyển đội có xác nhận; đội trưởng rời → quyền chuyển cho người kế; đội đủ 4 bị khoá có tooltip. *(đã qua phần lớn trên trình duyệt, còn ca đội trưởng rời để bạn test thêm)*
- [ ] QTV: tạo giải (lỗi form), công bố, sửa luật → tin trong chat; chốt đội → đội thiếu người bị loại, nhánh có miễn đấu khi số đội lẻ; nhập kết quả Bo3 → đội thắng lên vòng sau, trận vào Lịch sử đấu. *(đã qua tạo/sửa/chốt đội/nhập kết quả, còn ca lỗi form rỗng & miễn đấu số đội lẻ để bạn test thêm)*
- [x] Người chơi thường không thấy nút quản lý.
- [x] Không mã màu hex trong file `.tsx` mới (`grep -n "#[0-9a-fA-F]\{3,6\}"` chỉ ra id / text, không phải màu).
- [x] Màn vừa 1600×900, không vỡ bố cục với 32 đội.
- [x] Cập nhật PLAN.md dưới mục **T5**: thêm dòng "Bản đầu tiên (<ngày>, chờ duyệt — chưa đánh dấu xong)" liệt kê file tạo ra, đã làm gì, chưa làm gì, lỗi tìm thấy. **Không** đổi `- [ ]` của T5 thành `- [x]` — người dùng duyệt xong mới đánh dấu.
- [x] Không sửa màn khác ngoài các chỗ nêu ở §2.

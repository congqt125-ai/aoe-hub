# Đặc tả component — AoE UI Hub

Đặc tả bộ component cho **game hub kiểu nền tảng kết nối** (sảnh, phòng chơi, bạn bè, chat, hồ sơ, xếp trận, launcher), theo Atomic Design.
Dùng làm đầu vào cho bước 4 (React + TypeScript + Tailwind). Nguồn sự thật về tiến độ: [PLAN.md](../PLAN.md).

- Tokens: [`tokens/design-tokens.json`](../tokens/design-tokens.json) (sinh bởi `tools/build_tokens.py`), xem trước ở [`demo/tokens/index.html`](../demo/tokens/index.html).
- Asset: [`assets/ui/`](../assets/ui/) + [`assets/ui/index.json`](../assets/ui/index.json) (sinh bởi `tools/organize_assets.py`).
- Wireframe và luồng màn hình: [`docs/wireframes.md`](wireframes.md).
- Quy tắc UX, tương phản, bàn phím, ARIA, responsive: [`docs/ux-guidelines.md`](ux-guidelines.md).

---

## 0. Nguyên tắc chung

### 0.1 Nguồn của component

| Mức | Nghĩa |
|---|---|
| **Game** | Dùng thẳng asset hoặc token tách từ game. |
| **Phái sinh** | Game có kiểu tương tự; dựng lại bằng CSS từ tokens (bevel, màu, texture). |
| **Tự thiết kế** | Game không có; thiết kế mới chỉ bằng tokens + font + `Bevel` + `Surface` để đồng bộ. |

### 0.2 Theme

- **Mặc định duy nhất:** màn hình `scr2` (nền `bg/scr2.webp`) + hộp thoại `dlg6_0` (texture sa thạch). Token `defaults`.
- **Theme phụ:** các theme màn hình / hộp thoại khác, `dlg6_1`–`dlg6_4`, 5 phong cách phe. Không có "phe mặc định".
- Đổi theme bằng `data-theme` trên `<html>` (màn hình) và `data-dialog-theme` trên `Dialog` (hộp thoại). Component chỉ đọc CSS variables, không hard-code màu.
- Lưu ý: `themes.screens.scr2.background` = `#00ff40` là màu khoá trong suốt của palette, **không dùng làm màu nền**; nền màn hình luôn là ảnh `backgroundImage`.

### 0.3 Viền = `Bevel` (quan trọng)

Trong game **không có sprite viền**. Engine vẽ viền bevel 3px từ 6 màu `bevel[0..5]` (sáng → tối) của theme:

```
raised (nổi):  trên/trái = bevel[0] (ngoài), bevel[1], bevel[2] (trong)
               dưới/phải = bevel[3] (trong), bevel[4], bevel[5] (ngoài)
sunken (lõm):  đảo hai nhóm
etched (khắc): 1px sunken + 1px raised (đường kẻ chìm, dùng cho Divider / group box)
flat:          1px bevel[5] (viền mảnh cho vùng phụ)
```

Mọi đối tượng có viền (nút, panel, ô nhập, danh sách, tab, thanh tiến độ) **phải dùng `Bevel`**, không tự viết `border`.

### 0.4 Chữ

| Vai trò | Font | Ghi chú |
|---|---|---|
| Tiêu đề, tên màn hình, nút, nhãn, menu, tab | **Spectral SC** 400/600/700 | Font mặc định của hub (người dùng chọn). |
| Đoạn văn dài: chat, mô tả, thông báo | **Arimo** 400/700 | Dễ đọc; cùng số đo với Arial của game. |
| Số liệu (ping, điểm, thời gian) | Arimo, `font-variant-numeric: tabular-nums` | Không nhảy chiều rộng khi cập nhật. |

- Màu chữ: `text` của theme; bóng chữ `1px 1px 0 textShadow` trên mọi chữ nằm trên ảnh/texture (giống game).
- **Trên texture hộp thoại chỉ dùng chữ trắng.** Chữ màu (người chơi, ngữ nghĩa, trạng thái) trên nền tối dùng biến thể `onDark`; chữ trên badge màu dùng `color.onSemantic`. Chi tiết: [ux-guidelines §4.1](ux-guidelines.md#41-tương-phản-wcag-21-aa).
- Hover/focus: chữ đổi sang `focus` (vàng). Đang chọn/đang nhấn: `state` (trắng).
- Cỡ chữ theo `typography.scale` (11–32px).

### 0.5 Trạng thái chuẩn

Mọi component tương tác có đủ: `default` · `hover` (chữ `focus`) · `pressed` (bevel đảo sang sunken, nội dung dịch 1px xuống/phải) · `focus-visible` (khung 1px nét đứt màu `focus` bên trong bevel) · `disabled` (chữ giảm 50% độ sáng, bỏ bóng, không hover) · `loading` (nếu có thao tác bất đồng bộ).

### 0.6 Quy ước tên asset dùng trong tài liệu

| Nhóm | Mẫu |
|---|---|
| Control theo theme | `button/<theme>-<control>-<normal\|pressed>.png`, control ∈ `checkbox-off`, `checkbox-on`, `blank`, `close`, `arrow-up`, `arrow-down`, `blank-alt`, `arrow-down-alt` |
| Texture hộp thoại | `dialog/dlg6_0-sandstone.png`, `dlg6_1-marble`, `dlg6_2-brick`, `dlg6_3-wood`, `dlg6_4-darkstone`, `dlg3-sand` |
| Ảnh nền | `bg/<theme>.webp` (bản gốc lớn nhất, thường 2560×1440) + `bg/<theme>-1920.webp` (thu nhỏ từ bản gốc) |
| HUD theo phe | `hud/<style>-topbar.png`, `hud/<style>-bottombar.png` (bản 2560, không scale — xem `TopBar`), `hud/<style>-button-bg-sheet.png`, `hud/<style>-arrow-cancel-sheet.png`, `hud/<style>-text-button-<sm\|md>-sheet.png` |
| Icon | `icon/res-<wood\|stone\|food\|gold>.png`, `icon/resources-sheet.png`, `icon/units-sheet.png`, `icon/techs-sheet.png`, `icon/<style>-buildings-sheet.png`, `icon/digits-sheet.png`, `icon/stats-small-sheet.png` |
| Khác | `hud/pennant.png` (cờ đổi màu người chơi), `hud/health-bar-sheet.png`, `fx/move-marker-sheet.png`, `fx/rally-flag-sheet.png`, `minimap/minimap-bg-<sm\|lg>.png`, `cursor/<name>.cur` |

---

## 1. Atoms

### `Bevel` / `Frame`
- **Nguồn:** Phái sinh — viền engine của game.
- **Mục đích:** viền cho mọi đối tượng. Là nền tảng của `Button`, `Input`, `Panel`, `ListRow`, `Tabs`, `ProgressBar`.
- **Props:** `variant`: `raised` | `sunken` | `etched` | `flat`; `width`: 1 | 2 | 3 (mặc định 3); `tone`: `screen` | `dialog` | `faction:<style>` (lấy bevel từ theme tương ứng).
- **Token:** `themes.*.bevel[0..5]`, `bevel.width`.
- **Kỹ thuật:** `box-shadow` inset theo thứ tự ở mục 0.3 (Tailwind utility `bevel-raised` / `bevel-sunken` / `bevel-etched` / `bevel-flat` ở bước 4). Góc vuông (`radius.none`).
- **UX:** không có trạng thái riêng; component cha đổi `variant` khi pressed / selected.

### `Surface`
- **Nguồn:** Game (texture) / Phái sinh (lớp phủ).
- **Mục đích:** mặt nền của panel, hộp thoại, thẻ.
- **Props:** `texture`: `sandstone` | `marble` | `brick` | `wood` | `darkstone` | `sand` | `none`; `shade`: 0–100 (mặc định `shade` của theme); `tone` như `Bevel`.
- **Asset:** `dialog/dlg6_*-*.png`, `dialog/dlg3-sand.png` — lát bằng `background-repeat`. `none` = màu `surfaceAverage` của theme.
- **UX:** chữ trên `Surface` luôn có bóng chữ; kiểm tra tương phản theo `contrast` của theme (dlg6_x đều ≥ 6:1).

### `Button`
- **Nguồn:** Phái sinh (`Surface` + `Bevel`); game không có sprite nút chữ cho menu.
- **Biến thể:**
  - `primary` — `Surface` texture theme + `Bevel raised`, chữ Spectral SC 600.
  - `secondary` — `Surface none` (nền tối) + `Bevel raised`.
  - `ghost` — không nền, `Bevel flat` khi hover.
  - `danger` — như `secondary`, chữ / icon màu `semantic.danger`.
  - `faction` — dùng sprite `hud/<style>-text-button-<sm|md>-sheet.png` (2 frame: normal, pressed) cho nút nhỏ kiểu trong trận.
- **Cỡ:** `sm` (h 24, chữ 12) · `md` (h 32, chữ 14, mặc định) · `lg` (h 40, chữ 16).
- **Trạng thái:** đủ bộ 0.5. `loading`: thay nhãn bằng `Spinner` cỡ nhỏ, giữ nguyên chiều rộng, chặn bấm lặp.
- **UX:** nhãn động từ ngắn ("Vào phòng", "Sẵn sàng"); mỗi khu vực tối đa 1 `primary`; nút nguy hiểm luôn mở `Dialog` xác nhận.

### `IconButton`
- **Nguồn:** Game + Phái sinh.
- **Biến thể:** `control` — dùng sprite control theo theme (`button/<theme>-close-*`, `arrow-up`, `arrow-down`, `blank`); `hud` — nền `hud/<style>-button-bg-sheet.png` + icon; `plain` — `Bevel raised` + icon hệ thống.
- **Cỡ:** 24 / 32 / 40 (vuông).
- **Trạng thái:** normal ↔ pressed lấy đúng cặp frame của sprite; hover = chữ/icon `focus` hoặc viền `focus`.
- **UX:** **bắt buộc** `aria-label` + `Tooltip`.

### `Text` / `Heading`
- **Nguồn:** Game (màu chữ, bóng chữ) + font thay thế.
- **Biến thể:** `h1` 32 · `h2` 24 · `h3` 20 · `h4` 16 (Spectral SC) · `body` 14 · `caption` 12 · `micro` 11 (Arimo) · `numeric` (tabular).
- **Tông màu:** `default` (`text`) · `muted` (`text` 70%) · `focus` · `state` · `success` / `warning` / `danger` / `info` · `player-N`.
- **UX:** cắt chữ bằng `…` + `title` khi tràn; không viết hoa thủ công (Spectral SC đã là small caps).

### `Icon`
- **Nguồn:** Game + Tự thiết kế.
- **Bộ:** `resource` (gỗ, đá, thịt, vàng — `icon/res-*.png`), `unit` (`icon/units-sheet.png`), `tech` (`icon/techs-sheet.png`), `building` (`icon/<style>-buildings-sheet.png`), `stat` (`icon/stats-small-sheet.png`), `system` (tự thiết kế, nét 1.5px, màu `text`: settings, bell, search, user, users, chat, close, plus, filter, lock, crown, sword…).
- **Cỡ:** 16 / 20 / 24 / 32 / 50 (icon game gốc 50×50 — chỉ thu nhỏ, không phóng to quá 100%).
- **UX:** icon trang trí `aria-hidden`; icon mang nghĩa có `aria-label`.

### `Input`
- **Nguồn:** Phái sinh (`Bevel sunken` + nền tối).
- **Biến thể:** `text` · `password` (nút hiện/ẩn) · `search` (icon kính lúp + nút xoá) · `number`.
- **Trạng thái:** `default` · `hover` (bevel sáng hơn 1 bậc) · `focus` (nền ô tối hơn + viền trong 1px trắng mờ — **không dùng khung vàng nét đứt**, người dùng chốt 12/11) · `error` (viền trong `semantic.danger` + `FormField` hiện lỗi) · `disabled` · `readonly`.
- **UX:** cao 32 (md); placeholder `text` 50%; chữ nhập Arimo.

### `Textarea`
- Như `Input`; tự giãn 2–8 dòng; đếm ký tự khi có giới hạn (chat: 500).

### `Checkbox`
- **Nguồn:** **Game** — `button/<theme>-checkbox-off|on-<normal|pressed>.png`.
- **Trạng thái:** off / on × normal / pressed (đúng 4 frame); `indeterminate` (tự thiết kế: gạch ngang trên nền `blank`); `disabled` (giảm sáng 50%); `focus-visible`.
- **UX:** cả nhãn bấm được; nhãn bên phải; dùng cho tuỳ chọn độc lập.

### `Radio`
- **Nguồn:** Tự thiết kế trên nền sprite `blank` + chấm tròn màu `text`.
- **Trạng thái:** như `Checkbox`; nhóm dùng `role="radiogroup"`, phím mũi tên chuyển lựa chọn.

### `Toggle`
- **Nguồn:** Phái sinh — rãnh `Bevel sunken`, núm `Bevel raised` + `Surface`.
- **Trạng thái:** off / on (núm sang phải, rãnh màu `semantic.success` 60%) / disabled. Đổi trạng thái có hiệu lực ngay (không cần nút Lưu).

### `Select`
- **Nguồn:** Phái sinh + Game (nút mũi tên `button/<theme>-arrow-down-alt-*`).
- **Trạng thái:** đóng / mở (danh sách = `Menu`) / disabled / error.
- **UX:** gõ chữ để nhảy tới mục; Esc đóng; danh sách dài > 8 mục có `SearchBar`.

### `Slider`
- **Nguồn:** Phái sinh — rãnh `Bevel sunken`, núm `Bevel raised`.
- **Dùng cho:** âm lượng, độ khó, tốc độ game. Có nhãn giá trị; phím mũi tên ±1, PageUp/Down ±10.

### `Badge` / `Tag`
- **Nguồn:** Tự thiết kế.
- **Biến thể:** `count` (số thông báo, nền `semantic.danger`, "99+") · `status` (trạng thái phòng: Đang chờ / Đang chơi / Đầy / Khoá) · `rank` · `team` (màu `player-N`).
- **UX:** chữ 11–12px, Spectral SC; không dùng chỉ màu để truyền nghĩa (luôn có chữ / icon).

### `Avatar`
- **Nguồn:** Tự thiết kế + token player.
- **Biến thể:** `image` · `initials` · `unit` (frame từ `icon/units-sheet.png`) · `civ` (frame từ `icon/<style>-buildings-sheet.png`).
- **Cỡ:** xs 20 · sm 24 · md 32 · lg 48 · xl 80. Viền `Bevel raised` 2px; viền trong 1px màu `player-N.base` khi cần thể hiện màu người chơi.
- **Kèm:** `StatusDot` góc dưới phải (md trở lên).

### `StatusDot`
- **Nguồn:** Tự thiết kế.
- **Trạng thái:** `online` · `away` · `busy` · `in-game` · `offline` (token `color.status`). Viền 1px đen; `in-game` có biểu tượng kiếm nhỏ khi ≥ 12px.
- **UX:** luôn có `aria-label` / tooltip bằng chữ.

### `PingIndicator`
- **Nguồn:** Tự thiết kế.
- **Mức:** 4 vạch — < 80 ms (4, `success`) · < 150 (3, `success`) · < 250 (2, `warning`) · ≥ 250 (1, `danger`) · mất kết nối (0, `offline` + dấu ×).
- **UX:** tooltip hiện số ms; cập nhật ≤ 1 lần/giây.

### `ProgressBar`
- **Nguồn:** Phái sinh (`Bevel sunken` + fill) — tham khảo `hud/health-bar-sheet.png`.
- **Biến thể:** `determinate` (phần trăm) · `indeterminate` (sọc chạy, tắt khi `prefers-reduced-motion`) · `health` (xanh → đỏ theo mức, dùng 26 frame của health bar khi cần đúng kiểu game).
- **UX:** có nhãn ("Đang tải 42%"), `role="progressbar"` + `aria-valuenow`.

### `Spinner`
- **Nguồn:** Game — đồng hồ cát `cursor/busy.png`.
- **Cỡ:** 16 / 24 / 32. Xoay lật 180° mỗi 600 ms (bước, không mượt — đúng chất game); tĩnh khi `prefers-reduced-motion`.

### `Divider`
- **Nguồn:** Phái sinh — `Bevel etched` 2px. Ngang / dọc; có thể kèm nhãn ở giữa (Spectral SC 12).

### `Tooltip`
- **Nguồn:** Phái sinh — `Surface none` (nền `#000` 85%) + `Bevel flat`, chữ Arimo 12.
- **Biến thể:** `text` · `rich` (tiêu đề + mô tả + phím tắt).
- **UX:** hiện sau 400 ms hover hoặc ngay khi focus bàn phím; Esc ẩn; không chứa thao tác.

### `Cursor`
- **Nguồn:** Game — `cursor/default.png` (mặc định cho toàn UI, hotspot 0 0 — sinh trong `tokens/aoe-theme.css`; `data-cursor="system"` trên `<html>` để tắt), `cursor/busy.cur`, `cursor/action.cur` (nút "Chiến!"), `cursor/crosshair.cur`.
- **Không dùng** `cursor/pointer.*` (thật ra là con trỏ trợ giúp có dấu "?") trừ khi người dùng yêu cầu — nút / link dùng mũi tên `default`.
- **UX:** tuỳ chọn trong Cài đặt "Dùng con trỏ của game" (mặc định bật); luôn có fallback CSS `auto` / `pointer`.

### `Kbd`
- **Nguồn:** Tự thiết kế — `Bevel raised` 1px, Arimo 11, nền tối.

---

## 2. Molecules

### `FormField`
- **Thành phần:** `Text` label (Spectral SC 12) + control (`Input` / `Select` / `Textarea` / `Checkbox`) + hint (Arimo 12 muted) + lỗi (Arimo 12 `danger` + icon).
- **Trạng thái:** default / error / disabled / required (dấu `*` + `aria-required`).
- **UX:** lỗi hiện khi rời ô hoặc khi submit; nối `aria-describedby` tới hint và lỗi.
- **Không đổi kích thước form khi báo lỗi** (người dùng chốt 12/11, "A + B"): (A) mỗi ô chừa sẵn 1 dòng 20px cho gợi ý / lỗi, lỗi thay gợi ý tại chỗ; (B) form ít ô / lỗi chung (Đăng nhập) dùng `errorDisplay="border"` — ô chỉ đỏ viền — và một dòng `FormMessage` chừa sẵn trên hàng nút (`aria-live`). Lời báo 1 dòng, dài hơn thì cắt "…" + tooltip; viết ngắn ("Email chưa đúng dạng.").

### `SearchBar`
- `Input search` + nút xoá (`IconButton control close`) + (tuỳ chọn) `Select` phạm vi.
- Gõ có debounce 250 ms; Esc xoá nội dung; hiện `Spinner` nhỏ khi đang tìm.

### `Tabs`
- **Nguồn:** Phái sinh — mỗi tab là `Button` kích thước sm; tab đang chọn `Bevel sunken` + chữ `state`; tab khác `raised`.
- **Biến thể:** `top` (mặc định) · `segmented` (nhóm nút liền nhau, dùng cho bộ lọc).
- **UX:** `role="tablist"`; mũi tên trái/phải chuyển tab; có `Badge count` trên tab.

### `ListRow`
- **Nguồn:** Game (kiểu danh sách của game: dòng chọn = nền sáng + chữ đổi màu).
- **Trạng thái:** default · hover (chữ `focus`) · selected (nền `bevel[0]` 25% + chữ `state`) · disabled.
- **Cấu trúc:** slot trái (icon / avatar) · nội dung chính · slot phải (meta, nút).
- **UX:** mũi tên lên/xuống di chuyển, Enter mở; danh sách dài dùng ảo hoá.

### `Menu` / `DropdownMenu`
- **Nguồn:** Phái sinh — `Surface none` + `Bevel raised`, các dòng là `ListRow` cỡ nhỏ.
- **Mục:** thường · có icon · có `Kbd` · nguy hiểm (`danger`) · ngăn cách (`Divider`) · có menu con.
- **UX:** mở bằng click / Enter / phím mũi tên xuống; Esc đóng và trả focus về nút mở.

### `PlayerChip`
- `Avatar sm` + tên (Arimo 14, có thể tô màu `player-N`) + `StatusDot` + (tuỳ chọn) `PingIndicator`, cờ `hud/pennant.png` thu nhỏ theo màu người chơi.
- **Trạng thái:** default / hover (hiện menu hành động: Nhắn tin, Mời vào phòng, Xem hồ sơ, Kết bạn) / bạn bè / bị chặn.

### `ChatMessage`
- **Biến thể:** `user` (Avatar xs + tên màu `player-N` + giờ + nội dung) · `own` (căn như user, tên màu `focus`) · `system` (Arimo 12 nghiêng, màu `info`, không avatar) · `whisper` (nhãn "nhắn riêng", màu `semantic.info`).
- **Trạng thái:** đang gửi (mờ 60%) · gửi lỗi (icon `danger` + "Thử lại") · được nhắc tên (nền `warning` 15%).
- **UX:** gộp tin liên tiếp của cùng người trong 2 phút; link bấm được; giới hạn 500 ký tự.

### `RoomCard`
- **Nội dung:** tên phòng (Spectral SC) · chủ phòng (`PlayerChip` gọn) · bản đồ (thumbnail trên `minimap/minimap-bg-sm.png`) · chế độ / tốc độ / thời đại bắt đầu · số người `6/8` · `PingIndicator` · `Badge status` · icon khoá nếu có mật khẩu.
- **Trạng thái:** default / hover (`Bevel` sáng + hiện nút "Vào") / selected / đầy (disabled, nút "Xem") / đang chơi.
- **Biến thể:** `card` (lưới) · `row` (dùng `ListRow` trong `RoomBrowser`).

### `PlayerSlot`
- **Nguồn:** Phái sinh (màn hình multiplayer của game).
- **Nội dung:** số thứ tự · `PlayerChip` · `Select` phe (5 phong cách + ngẫu nhiên, hiển thị icon công trình của phe) · `Select` màu (8 màu `player-N`, màu đã chọn bị khoá) · `Select` đội (–, 1–4) · `Checkbox` ready (sprite game) · nút kick (`IconButton close`, chỉ chủ phòng).
- **Trạng thái:** trống ("Mở" — bấm để mời / thêm AI) · đóng · có người · sẵn sàng (viền trong `success`) · chủ phòng (icon vương miện) · AI · mất kết nối.

### `StatBlock`
- Nhãn (Spectral SC 12 muted) + số (Arimo 24 tabular) + biến động (▲ `success` / ▼ `danger`) + (tuỳ chọn) icon `stat` / `resource`.

### `Toast`
- **Biến thể:** `success` · `info` · `warning` · `error` — `Surface none` + `Bevel raised` + dải màu 4px bên trái theo `semantic`.
- **Nội dung:** icon + tiêu đề + mô tả ngắn + (tuỳ chọn) 1 nút hành động ("Vào ngay", "Hoàn tác") + nút đóng.
- **UX:** tự ẩn 5 s (lỗi: không tự ẩn); dừng đếm khi hover; `role="status"` (lỗi: `role="alert"`).

### `EmptyState`
- Icon lớn (unit / building của game, 50px, mờ 60%) + tiêu đề + mô tả + `Button primary`.
- **Ví dụ:** "Chưa có phòng nào — Tạo phòng", "Chưa có bạn bè — Tìm người chơi".

### `Pagination`
- **Biến thể:** `pages` (nút `IconButton control arrow` + số trang) · `load-more` (`Button secondary` "Tải thêm" + `Spinner`) · `infinite` (tự tải khi cuộn tới cuối).

---

## 3. Organisms

### `AppShell`
- **Bố cục (≥ 1280px):** `TopBar` (cao 48) · `SideNav` trái (rộng 72, thu gọn icon) · vùng nội dung · `FriendsPanel` phải (rộng 280, thu gọn được) · `ChatPanel` dock dưới (cao 240, thu gọn được) · `LaunchBar` dưới cùng (cao 56).
- **Nền:** `image-set(bg/scr2-1920.webp 1x, bg/scr2.webp 2x)` — hoặc chọn `scr2-1920` khi cửa sổ ≤ 1920px, `scr2` (2560) khi lớn hơn; `background-size: cover`, phủ tối `shade` 51%. Chỉ thu nhỏ, không phóng to ảnh nền.
- **≥ 1024 < 1280:** `FriendsPanel` thành ngăn trượt; `ChatPanel` thu gọn mặc định.
- **Trạng thái toàn cục:** mất kết nối (banner `warning` trên cùng + "Đang kết nối lại…"), bảo trì (banner `info`).

### `TopBar`
- **Nguồn:** Game — `hud/<style>-topbar.png` làm nền (theme phụ theo phe) hoặc `Surface none` + `Bevel raised` (mặc định).
- **Cách đặt thanh HUD (không scale, cao cố định):** thanh trên (20px) neo trái, phần phải trơn bị cắt theo độ rộng. Thanh dưới (126px) ghép 2 lớp: lớp 1 = cả ảnh neo trái; lớp 2 = 280px cuối (ô minimap) neo phải, đè lên. Metadata `slice` trong `assets/ui/index.json`. Rộng tối đa 2560px.
- **Nội dung:** logo hub · điều hướng chính (Trang chủ, Sảnh, Giải đấu, Hồ sơ) · `SearchBar` người chơi / phòng · `NotificationCenter` (chuông + `Badge`) · `PingIndicator` máy chủ · menu tài khoản (`Avatar` + `DropdownMenu`).

### `SideNav`
- Danh sách `IconButton hud` (nền `hud/<style>-button-bg-sheet.png`) + nhãn khi mở rộng + `Badge count`.
- Mục đang chọn: frame pressed của nền nút + chữ `state`. Phím tắt Alt+1…Alt+6.

### `Dialog` / `Modal`
- **Nguồn:** Game — `Surface` texture `dialog/dlg6_0-sandstone.png` (mặc định) + `Bevel raised` 3px + lớp phủ màn hình `#000` theo `shade` (45%).
- **Cấu trúc:** tiêu đề (Spectral SC h3, căn giữa như game) · nút đóng (`IconButton control close` của theme dialog) · nội dung · hàng nút (phải: `primary` cuối cùng, `secondary` "Huỷ" bên trái nó).
- **Biến thể:** `confirm` (câu hỏi + 2 nút) · `form` · `info` (1 nút "OK") · `danger-confirm` (nút chính `danger`, gõ lại tên để xác nhận khi xoá).
- **Cỡ:** sm 360 · md 480 · lg 720.
- **UX:** khoá focus trong dialog; Esc / nút đóng = Huỷ; trả focus về phần tử mở; `role="dialog"` + `aria-modal` + `aria-labelledby`.
- **Theme phụ:** `data-dialog-theme="dlg6_1…dlg6_4"` đổi texture + bevel + sprite control.

### `FriendsPanel`
- **Nội dung:** `SearchBar` · `Tabs segmented` (Tất cả / Online / Lời mời `Badge`) · nhóm theo trạng thái (Đang chơi · Online · Vắng · Offline, có đếm, thu gọn được) · danh sách `PlayerChip` · nút "Thêm bạn".
- **Hành động mỗi người:** Nhắn tin · Mời vào phòng · Xem hồ sơ · Theo dõi trận · Huỷ kết bạn (xác nhận) · Chặn.
- **Trạng thái:** loading (skeleton 6 dòng) · rỗng (`EmptyState`) · lỗi (nút Thử lại).

### `ChatPanel`
- **Nội dung:** `Tabs` kênh (Sảnh · Phòng · các cuộc nhắn riêng, có `Badge`) · danh sách `ChatMessage` (tự cuộn xuống khi đang ở cuối; nếu không thì hiện nút "Tin mới ↓") · dòng "X đang gõ…" · `Textarea` 1 dòng + nút Gửi.
- **UX:** Enter gửi, Shift+Enter xuống dòng; `/w tên` nhắn riêng; giới hạn tốc độ (hiện đếm ngược khi bị chặn spam).

### `RoomBrowser`
- **Nội dung:** thanh công cụ (`SearchBar` · `Select` chế độ / bản đồ / ping · `Checkbox` "Ẩn phòng đầy", "Ẩn phòng có mật khẩu" · `Button primary` "Tạo phòng") · bảng `RoomCard row` có cột sắp xếp được (Tên, Chủ phòng, Bản đồ, Người, Ping) · `Pagination infinite`.
- **Trạng thái:** loading (skeleton) · rỗng ("Chưa có phòng — Tạo phòng") · lỗi · cập nhật trực tiếp (dòng mới loé sáng 1 lần).
- **UX:** double-click / Enter vào phòng; phòng có mật khẩu mở `Dialog form`.

### `RoomLobby`
- **Nguồn:** Phái sinh (màn multiplayer setup của game).
- **Nội dung:** tiêu đề phòng + nút Rời phòng · lưới 8 `PlayerSlot` · cột cài đặt trận (bản đồ + `minimap/minimap-bg-lg.png`, kích thước, tài nguyên ban đầu `icon/res-*`, thời đại bắt đầu, tốc độ, chế độ thắng; chỉ chủ phòng sửa được, người khác chỉ xem) · `ChatPanel` kênh phòng · hàng nút: `Checkbox` "Sẵn sàng" + `Button primary` "Bắt đầu" (chủ phòng; disabled cho tới khi mọi người sẵn sàng, tooltip nêu lý do).
- **Trạng thái:** chờ người · tất cả sẵn sàng · đếm ngược 5 s trước khi vào game (huỷ được) · đang khởi chạy game (`LaunchBar` hiện tiến trình) · bị kick (`Dialog info`).

### `MatchmakingQueue` — **bỏ 13/11** (màn Xếp trận thay bằng Giải đấu, xem wireframes §5)
- **Biến thể:** `panel` (trong trang Xếp trận) · `floating` (thẻ nhỏ góc dưới khi rời trang, vẫn đang tìm).
- **Trạng thái:** chọn chế độ (1v1 / 2v2 / 3v3 / 4v4, phe, khu vực) · đang tìm (đồng hồ đếm lên, thời gian chờ ước tính, nút Huỷ) · đã tìm thấy (`Dialog` "Chấp nhận / Từ chối" + đếm ngược 15 s, âm báo tuỳ chọn) · có người từ chối (quay lại hàng đợi, `Toast info`) · lỗi.

### `ProfileHeader`
- `Avatar xl` + tên (h2) + danh hiệu / rank `Badge` + phe yêu thích (icon công trình) + cờ `hud/pennant.png` màu người chơi + hàng `StatBlock` (Số trận, Tỉ lệ thắng, Điểm, Chuỗi thắng) + nút (Kết bạn / Nhắn tin / Sửa hồ sơ nếu là mình).

### `MatchHistoryTable`
- **Cột:** kết quả (Thắng `success` / Thua `danger` / Hoà) · chế độ · bản đồ · phe (icon) · đồng đội / đối thủ (`PlayerChip` gọn) · thời lượng · ngày · điểm ±.
- **UX:** sắp xếp theo ngày; lọc theo chế độ; click dòng mở chi tiết trận; `Pagination load-more`.

### `NotificationCenter`
- Nút chuông + `Badge count` → `Menu` rộng 360: danh sách thông báo (lời mời kết bạn, mời vào phòng — có nút Chấp nhận / Từ chối ngay trong dòng, kết quả trận, tin hệ thống), "Đánh dấu đã đọc tất cả", chưa đọc có chấm `info`.

### `LaunchBar`
- **Nguồn:** Tự thiết kế; nền `hud/<style>-bottombar.png` ghép 2 lớp như `TopBar` (theme phụ) hoặc `Surface` + `Bevel raised`.
- **Trạng thái:** chưa cài đặt (nút "Cài đặt") · cần cập nhật (`ProgressBar determinate` + tốc độ + nút Tạm dừng) · sẵn sàng (`Button primary lg` "**Chơi**") · đang chạy (chữ "Đang chơi" + nút "Về hub") · lỗi (thông báo + "Sửa lỗi cài đặt").

### `SettingsForm`
- Nhóm (`Tabs` dọc): Tài khoản · Giao diện (theme phụ, con trỏ game, cỡ chữ) · Âm thanh (`Slider`) · Đồ hoạ / độ phân giải game · Mạng (máy chủ, kiểm tra ping) · Phím tắt.
- **UX:** lưu tự động với `Toggle` / `Slider`; nhóm có form dùng nút "Lưu" + `Toast success`; cảnh báo khi rời trang chưa lưu.

### `ToastStack`
- Góc dưới phải, phía trên `LaunchBar`; tối đa 3 toast, cái mới ở dưới; toast thứ 4 trở đi gộp thành "+N thông báo".

---

## 4. Templates / màn hình

Chi tiết bố cục và luồng: [`docs/wireframes.md`](wireframes.md).

| Màn hình | Organisms chính | Theme |
|---|---|---|
| Đăng nhập / Đăng ký | `Dialog form` (`FormField`, `Button`) giữa màn hình | `scr1` + `dlg6_3` (đã chốt, xem PLAN.md) |
| Trang chủ | `AppShell`, tin tức / sự kiện, bạn đang online, phòng gợi ý (`RoomCard`), `LaunchBar` | `scr2` |
| Sảnh | `RoomBrowser`, `ChatPanel` (kênh sảnh), `FriendsPanel` | `scr2` |
| Phòng chơi | `RoomLobby`, `ChatPanel` (kênh phòng) | `scr2` |
| ~~Xếp trận~~ → Giải đấu | `TournamentList`, `Bracket`, `TournamentSetupDialog` | `hub-village` |
| Bạn bè & tin nhắn | `FriendsPanel` mở rộng, `ChatPanel` (nhắn riêng) | `scr2` |
| Hồ sơ | `ProfileHeader`, `StatBlock`, `MatchHistoryTable` | `scr2` |
| Cài đặt | `SettingsForm` | `scr2` |
| Kết quả trận (phụ) | `Dialog lg`: thắng / thua, `StatBlock`, bảng người chơi, điểm ±, nút "Về phòng" / "Về sảnh" | `dlg6_0` |

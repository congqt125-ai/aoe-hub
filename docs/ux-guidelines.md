# Quy tắc UX — AoE UI Hub

Quy tắc chung áp dụng cho mọi component trong [components.md](components.md) và mọi màn hình trong [wireframes.md](wireframes.md).
Mỗi quy tắc có tiêu chí kiểm tra được; bước 4 dùng mục **Checklist review** ở cuối để duyệt từng component / màn hình.

Số liệu tương phản đo trên theme mặc định (`scr2` + `dlg6_0`) bằng công thức WCAG 2.1; token tương ứng nằm trong [`tokens/design-tokens.json`](../tokens/design-tokens.json).

---

## 1. Trạng thái dữ liệu

Mọi vùng hiển thị dữ liệu từ máy chủ (danh sách phòng, bạn bè, chat, lịch sử trận, thông báo, hồ sơ) **phải** có đủ 5 trạng thái:

| Trạng thái | Khi nào | Hiển thị | Ghi chú |
|---|---|---|---|
| **Đang tải** | Lần tải đầu | Skeleton đúng bố cục thật (dòng / thẻ xám mờ, không chữ). Không dùng spinner giữa vùng trống. | Hiện skeleton sau 150 ms để tránh nháy khi tải nhanh. |
| **Đang làm mới** | Tải lại khi đã có dữ liệu | Giữ dữ liệu cũ, `Spinner` 16px cạnh tiêu đề vùng | Không xoá danh sách khi làm mới. |
| **Rỗng** | Tải xong, không có mục | `EmptyState`: icon game + 1 câu giải thích + 1 hành động chính | Phân biệt "chưa có gì" với "lọc không ra kết quả" (nút "Xoá bộ lọc"). |
| **Lỗi** | Request thất bại | Thông báo ngắn bằng ngôn ngữ người dùng + nút **Thử lại**; giữ dữ liệu cũ nếu có | Không hiện mã lỗi thô; mã lỗi đặt trong tooltip / log. |
| **Mất kết nối** | Mất socket / mạng | Banner `warning` trên cùng `AppShell`: "Mất kết nối — đang kết nối lại… (lần 3)" + nút "Thử ngay" | Thao tác cần mạng bị disabled kèm tooltip lý do. Khi nối lại: banner `success` 3 s rồi tự ẩn, tự tải lại vùng đang mở. |

## 2. Phản hồi thao tác

| Quy tắc | Tiêu chí |
|---|---|
| Mọi phần tử bấm được có đủ trạng thái `hover` / `pressed` / `focus-visible` / `disabled` | Xem [components.md §0.5](components.md#05-trạng-thái-chuẩn). Pressed = bevel đảo sang sunken + nội dung lệch 1px. |
| Phản hồi tức thì | Thay đổi trạng thái hiển thị trong ≤ 100 ms sau khi bấm. |
| Thao tác bất đồng bộ | > 300 ms: nút chuyển `loading` (giữ chiều rộng, chặn bấm lặp). > 2 s: thêm chữ tiến trình ("Đang vào phòng…"). > 10 s: cho phép Huỷ. |
| Cập nhật lạc quan | Gửi chat, đánh dấu sẵn sàng, đánh dấu đã đọc: hiện ngay, hoàn tác + báo lỗi nếu máy chủ từ chối. Không dùng cho thao tác tiền / xếp hạng. |
| Thao tác nguy hiểm phải xác nhận | Rời phòng (khi đang là chủ phòng / đang đếm ngược), kick, huỷ kết bạn, chặn, xoá tài khoản, huỷ trận đã chấp nhận → `Dialog confirm` / `danger-confirm`. Nút mặc định (Enter) là nút **an toàn**. |
| Hoàn tác thay vì hỏi | Thao tác dễ đảo ngược (ẩn thông báo, rời kênh chat) không hỏi lại; hiện `Toast` có nút "Hoàn tác" 5 s. |
| Nút bị khoá phải nói lý do | Nút disabled có tooltip giải thích ("Còn 1 người chưa sẵn sàng"). |
| Kết quả thao tác | Thành công không hiển nhiên → `Toast success`; lỗi → thông báo tại chỗ (form) hoặc `Toast error` (không tự ẩn). |

## 3. Bàn phím

### 3.1 Quy tắc chung
- Mọi chức năng dùng được chỉ bằng bàn phím; thứ tự Tab theo thứ tự đọc (trái → phải, trên → dưới).
- **Focus ring:** khung nét đứt 1px màu `focus` (vàng) nằm bên trong bevel, chỉ hiện với `:focus-visible`. Tương phản focus ring ≥ 3:1 với nền: 11.04 (`scr2`), 5.83 (`dlg6_0`) — đạt.
- Không bẫy focus, trừ `Dialog` (khoá focus bên trong, Esc thoát, đóng xong trả focus về phần tử đã mở).
- Có link "Bỏ qua tới nội dung" là phần tử focus đầu tiên của trang.
- Danh sách dài (`RoomBrowser`, `FriendsPanel`, `ChatPanel`): một điểm dừng Tab cho cả danh sách; phím mũi tên di chuyển giữa các dòng (roving tabindex).

### 3.2 Phím tắt

| Phím | Hành động | Phạm vi |
|---|---|---|
| `Alt+1` … `Alt+7` | Trang chủ · Sảnh · Giải đấu · Clan · Bạn bè · Hồ sơ · Cài đặt | Toàn cục |
| `Ctrl+K` hoặc `/` | Mở tìm kiếm người chơi / phòng | Toàn cục (không khi đang gõ) |
| `Enter` (ô chat) | Gửi tin; `Shift+Enter` xuống dòng | `ChatPanel` |
| `Esc` | Đóng dialog / menu / tooltip; xoá ô tìm kiếm | Theo ngữ cảnh |
| `↑` `↓` / `Enter` | Di chuyển / mở dòng | Danh sách |
| `←` `→` | Chuyển tab | `Tabs` |
| `R` | Bật / tắt Sẵn sàng | `RoomLobby` (không khi đang gõ) |
| `?` | Bảng phím tắt | Toàn cục |

Phím tắt một ký tự (`R`, `/`, `?`) tắt khi focus ở ô nhập liệu và có thể tắt hẳn trong Cài đặt.

## 4. Trợ năng (accessibility)

### 4.1 Tương phản (WCAG 2.1 AA)

Chữ thường cần ≥ 4.5:1, chữ lớn (≥ 18px hoặc ≥ 14px đậm) và thành phần giao diện (viền ô nhập, chấm trạng thái, focus ring) cần ≥ 3:1.

| Màu chữ | Nền tối `scr2` (`#1f0f01`) | Texture `dlg6_0` (TB `#745c44`) |
|---|---|---|
| `text` scr2 `#d9d0b0` | **12.07** ✅ | 4.05 ❌ |
| `text` dlg6_0 / `state` `#ffffff` | 18.63 ✅ | **6.26** ✅ |
| `focus` `#cacf01` / `#ffff00` | 11.04 ✅ | 5.83 ✅ |
| muted (text 70%) | 6.36 ✅ | 2.13 ❌ |
| `success` `#00bb37` | 7.24 ✅ | 2.43 ❌ |
| `warning` `#ffb32b` | 10.41 ✅ | 3.50 ❌ |
| `danger` `#ff2f2f` | 5.06 ✅ | 1.70 ❌ |
| `info` `#577bb3` | 4.34 ❌ → dùng `semanticOnDark.info` `#739bc7` **6.43** ✅ | 1.46 ❌ |
| `player-1` xanh `#577bb3` | 4.34 ❌ → `onDark` `#739bc7` ✅ | — |
| `player-6` lục `#637b2f` | 3.91 ❌ → `onDark` `#7f8b37` **5.01** ✅ | — |
| 6 màu người chơi còn lại | 4.55–11.60 ✅ | — |

**Quy tắc rút ra:**
1. **Trên texture hộp thoại chỉ dùng chữ trắng** (`text` của theme dialog) + bóng chữ. Không dùng chữ muted, chữ màu ngữ nghĩa hay màu người chơi trực tiếp trên texture — đặt chúng trong một "giếng" tối (`Surface none` + `Bevel sunken`, như ô nhập) bên trong dialog.
2. **Chữ màu trên nền tối dùng biến thể `onDark`:** `players.*.onDark`, `color.semanticOnDark`, `color.statusOnDark`. Màu `base` chỉ dùng cho mảng màu (chấm, viền, nền badge), không dùng cho chữ.
3. **Chữ trên nền màu ngữ nghĩa (badge) dùng `color.onSemantic`** — hiện là đen cho cả 4 màu (đen 4.89–11.73 so với trắng 1.79–4.30).
4. Chữ muted chỉ ở mức 70% và chỉ trên nền tối.
5. Theme phụ có tương phản chữ chính < 4.5 (`dlg1` 3.98, `dlg4` 4.4, `dlg12` 2.95, `dlg13` 4.3): khi bật phải tăng `shade` hoặc dùng `state` (trắng) cho chữ.

### 4.2 Không chỉ dựa vào màu
- Trạng thái online / bận / đang chơi: chấm màu **và** chữ hoặc tooltip; `in-game` có thêm biểu tượng kiếm.
- Kết quả trận: "Thắng" / "Thua" bằng chữ, màu chỉ để nhấn mạnh. Ping: số vạch + số ms trong tooltip.
- Màu người chơi trong phòng: kèm số thứ tự người chơi và tên màu trong `Select` ("Xanh dương", "Đỏ"…).

### 4.3 Ngữ nghĩa và ARIA

| Component | Yêu cầu |
|---|---|
| `Dialog` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` = tiêu đề |
| `Tabs` | `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls` |
| `Menu` | `role="menu"` / `menuitem`, nút mở có `aria-haspopup`, `aria-expanded` |
| `Toast` | Vùng `role="status"` (lỗi: `role="alert"`) cố định trong DOM |
| `ProgressBar` | `role="progressbar"`, `aria-valuenow/min/max`, `aria-label` |
| `IconButton`, `StatusDot`, `PingIndicator` | `aria-label` bằng chữ |
| `ChatPanel` | Danh sách tin `role="log"` + `aria-live="polite"`; không đọc lại toàn bộ khi tải lịch sử |
| `FormField` | `<label for>`, lỗi nối bằng `aria-describedby`, `aria-invalid` |
| Ảnh trang trí (nền, texture, phù điêu HUD) | `alt=""` / CSS background |

### 4.4 Cỡ chữ và vùng bấm
- Chữ nội dung tối thiểu 12px; 11px chỉ cho badge / nhãn phụ.
- Vùng bấm tối thiểu 24×24 px (WCAG 2.2 AA); nút chính ≥ 32px cao.
- Cài đặt "Cỡ chữ" phóng toàn bộ giao diện 90–125% (dùng `rem`), bố cục không vỡ ở 125%.

## 5. Responsive

| Độ rộng cửa sổ | Bố cục `AppShell` |
|---|---|
| ≥ 1600 | Đủ: `SideNav` mở rộng (nhãn chữ) + nội dung + `FriendsPanel` 280px + `ChatPanel` dock dưới |
| 1280–1599 | `SideNav` thu gọn (chỉ icon 72px); còn lại như trên |
| 1024–1279 | `FriendsPanel` thành ngăn trượt (mở bằng nút trên `TopBar`); `ChatPanel` thu gọn mặc định |
| < 1024 | Không phải mục tiêu chính: một cột, `SideNav` thành thanh dưới; vẫn dùng được, không vỡ chữ / không cuộn ngang |

- Ảnh nền: `bg/<theme>-1920.webp` khi cửa sổ ≤ 1920px, `bg/<theme>.webp` khi lớn hơn; chỉ thu nhỏ.
- Thanh HUD không scale; dài tối đa 2560px (đủ cho mọi cửa sổ thường gặp).
- Đồ hoạ điểm ảnh (icon, control, con trỏ) hiển thị đúng cỡ hoặc phóng bội số nguyên (2×, 3×) với `image-rendering: pixelated`, không phóng tỉ lệ lẻ.
- Trạng thái thu gọn / mở của panel được nhớ theo người dùng (localStorage).

## 6. Chuyển động và âm thanh

| Quy tắc | Giá trị |
|---|---|
| Thời lượng | `motion.fast` 100 ms (hover, pressed) · `base` 150 ms (menu, tooltip) · `slow` 200 ms (dialog, panel trượt) |
| Kiểu | Đổi trạng thái kiểu game: tức thời hoặc theo bước (`steps()`), không nảy / đàn hồi |
| Giới hạn | Không có chuyển động tự chạy > 5 s trừ chỉ báo đang chờ (spinner, hàng đợi); animation hiệu ứng game (`fx/*`) chỉ chạy khi có ý nghĩa (vd xác nhận vào phòng) |
| `prefers-reduced-motion` | Tắt trượt / mờ dần (hiện ngay), spinner thành biểu tượng tĩnh + chữ "Đang tải", tắt sọc chạy của progress |
| Âm thanh | Âm thanh từ game (`sound.drs`) là tuỳ chọn, **mặc định tắt**; nếu bật: chỉ cho sự kiện quan trọng (tìm thấy trận, được mời vào phòng, đến lượt bắt đầu). Có thanh âm lượng riêng. Không bao giờ là kênh thông tin duy nhất. |

## 7. Thời gian thực

| Sự kiện | Hiển thị |
|---|---|
| Trạng thái bạn bè đổi | Cập nhật `StatusDot` tại chỗ, không đẩy danh sách nhảy vị trí khi người dùng đang thao tác (gom lại, sắp xếp lại khi danh sách không được focus / hover) |
| Đang gõ | "Minh đang gõ…" dưới danh sách tin; ẩn sau 5 s không có sự kiện; nhiều người: "Minh và 2 người khác đang gõ…" |
| Tin nhắn mới | Đang ở cuối danh sách → tự cuộn; đang đọc tin cũ → không cuộn, hiện nút "Tin mới ↓ (3)" |
| Phòng thay đổi (người vào / ra, sẵn sàng) | Cập nhật ô `PlayerSlot` tại chỗ + tin hệ thống trong chat phòng; ô vừa đổi loé sáng 1 lần (tắt khi reduced-motion) |
| Danh sách phòng | Cập nhật số người / trạng thái tại chỗ; phòng mới chèn vào nhưng không đổi dòng đang chọn; phòng biến mất khi đang chọn → `Toast warning` "Phòng đã đóng" |
| Lời mời / tìm thấy trận | `Toast` có nút hành động + `Badge` trên chuông; tìm thấy trận dùng `Dialog` có đếm ngược và đưa cửa sổ lên trước (thông báo hệ điều hành nếu cửa sổ đang ẩn) |
| Kết nối lại | Xem §1 "Mất kết nối"; sau khi nối lại đồng bộ lại trạng thái, không tạo tin / thông báo trùng |
| Đồng hồ | Đếm ngược / thời gian chờ cập nhật mỗi giây, đọc cho trình đọc màn hình tối đa mỗi 15 s (tránh spam `aria-live`) |

## 8. Nội dung và ngôn ngữ

- Giao diện tiếng Việt Unicode (font Spectral SC / Arimo đã kiểm tra đủ glyph); tên riêng trong game giữ nguyên (tên phe dịch: Ai Cập, Hy Lạp, Babylon, Á Đông, La Mã).
- Nhãn nút là động từ ngắn ("Vào phòng", "Sẵn sàng", "Tạo phòng"); thông báo lỗi nói chuyện gì xảy ra + làm gì tiếp ("Không vào được phòng vì phòng đã đầy. Chọn phòng khác.").
- Thời gian: tương đối cho mốc gần ("2 phút trước"), tuyệt đối khi > 24 giờ (`10/11 21:02`); số dùng dấu cách nghìn ("12 400").

---

## Checklist review (dùng ở bước 4)

Mỗi component / màn hình trước khi đánh dấu xong:

- [ ] Có đủ trạng thái tương tác (§0.5 components) và trạng thái dữ liệu (§1) nếu hiển thị dữ liệu
- [ ] Viền dùng `Bevel`, màu chỉ lấy từ token, không hard-code
- [ ] Tương phản đạt §4.1 (chữ trên texture = trắng; chữ màu trên nền tối = biến thể `onDark`)
- [ ] Dùng được hoàn toàn bằng bàn phím, focus ring hiện rõ, Esc / Enter đúng
- [ ] ARIA theo §4.3; ảnh trang trí `alt=""`
- [ ] Không truyền thông tin chỉ bằng màu (§4.2)
- [ ] Hiển thị đúng ở 1024, 1366, 1920px và cỡ chữ 125%
- [ ] Tôn trọng `prefers-reduced-motion`
- [ ] Thao tác nguy hiểm có xác nhận / hoàn tác; nút disabled có lý do

# Kế hoạch: Bộ UI phong cách Age of Empires 1 (SuperAoE)

Nguồn dữ liệu: `C:\Users\congq\AppData\Local\Programs\superaoe-launcher\game\data\`
(`interfac.drs`, `inter1.drs`, `inter2.drs`, `inter2k.drs` + các font `.ttf`).

> Đồ hoạ thuộc bản quyền Microsoft/Ensemble — chỉ dùng cá nhân/nội bộ. Nếu phát hành công khai thì giữ tokens/bố cục, vẽ lại ảnh.

## Phát hiện quan trọng

Nút và viền trong AoE1 **không phải ảnh** mà được game tự vẽ bằng màu bevel (nổi/lõm) lấy từ bảng màu. Mỗi màn hình có một file mô tả, ví dụ `50051`:

```
background1_files  scr1a  none  50100        ← ảnh nền 640px (50103 = 800px, 50105 = 1024px)
palette_file       pal1   50501               ← bảng màu
cursor_file        cursor1 51001
shade_amount       percent 44                 ← độ tối lớp phủ
bevel_colors       222 213 181 181 153 104    ← 6 màu viền nổi/lõm (chỉ số trong bảng màu)
text_color1        217 208 176                ← màu chữ (RGB)
focus_color1       202 207 1                  ← màu chữ khi hover/focus
```

→ Bộ UI = **ảnh nền, nút và icon tách từ SLP** + **viền bevel dựng lại bằng CSS**.

### Bản đồ theme (từ file mô tả màn hình)

Game có **9 theme màn hình** (bảng màu 50500–50508), thêm vài biến thể hộp thoại `dlg6_x`. Mỗi theme là một bộ: ảnh nền + bảng màu + sprite nút + hộp thoại + 6 màu bevel.
Màn hình (`scr`) và hộp thoại (`dlg`) cùng số dùng chung bảng màu và sprite nút.

| Mô tả | Nền (640 / 800 / 1024) | Bảng màu | Sprite nút | Hộp thoại |
|---|---|---|---|---|
| `50051` scr1 | 50100 / 50103 / 50105 | 50501 | — (bevel thuần) | 50001 → nền 50200 |
| `50052` scr2 | 50107 / 50109 / 50111 | 50502 | 50601 | 50002 → nền 50202 |
| `50053` scr3 | 50113 / 50115 / 50117 | 50503 | 50602 | 50003 → nền 50204 |
| `50054` scr4 | 50119 / 50121 / 50123 | 50504 | 50603 | 50004 → nền 50206 |
| `50055` scr5 | 50125 | 50500 | 50604 | 50055 |
| `50057` scr7 | 50131 / 50133 / 50135 | 50505 | 50609 | 50010 |
| `50058` scr8 | 50137 / 50139 / 50141 | 50506 | 50610 | 50011 |
| `50060` scr9 | 50143 | 50507 | 50611 | 50012 |
| `50061` scr10 | 50149 / 50151 / 50153 | 50508 | 50612 | 50013 |
| `50006`–`50009`, `53000` dlg6_x | nền 50210–50216, 53003 | 50500 | 50605–50608, 53004 | — |
| `50059` credit | 50154 (shp) | 50519 | — | — |

- Nền 2K (`inter2k` 53201–53209) chưa gắn với file mô tả nào → xác định ở bước 3.
- Nền hộp thoại 50200, 50202, 50206, 50208 không có trong 4 file DRS giao diện → kiểm tra ở `graphic.drs` hoặc bỏ qua.
- Theme nào ứng với màn hình nào trong game (menu chính, multiplayer, kịch bản…) → xác nhận bằng ảnh chụp ở bước 3.

### Nội dung các file DRS

| File | Nội dung |
|---|---|
| `interfac.drs` (48 MB) | 108 SLP, 51 `bina` (11 bảng màu JASC-PAL, ~25 file mô tả màn hình, 2 BMP), 10 `shp` |
| `inter1.drs` | 27 SLP, 3 `bina` |
| `inter2.drs` | 23 SLP, 7 `bina` |
| `inter2k.drs` | 12 SLP (nền menu 2K), 7 `bina` |

---

## Bước 1 — Tách dữ liệu từ DRS

Script: `tools/extract_drs.py` (Python, chỉ đọc file game).

- [x] Đọc header DRS → bảng loại file → danh sách file (id, offset, size). Đã kiểm tra cấu trúc 4 archive DRS: `interfac.drs`, `inter1.drs`, `inter2.drs`, `inter2k.drs`.
- [x] Xuất ra `raw/<drs>/<id>.<ext>`: SLP, bảng màu `50500`–`50519`, file mô tả `500xx`, BMP `50401`/`50402`. Tổng cộng 248 file (108.48 MB, 0 lỗi).
  - Tách theo thư mục: `raw/interfac/` (169 file), `raw/inter1/` (30 file), `raw/inter2/` (30 file), `raw/inter2k/` (19 file).
  - Phát hiện thêm trong `bina`: 12 bảng đổi màu `50900`–`50911` (`.txt`), 1 bảng binary `50800` (`.bin`).
  - Phát hiện thêm trong `interfac.drs`: 10 file `shp` (`50154`–`50163`, 3D shape v1.10).
  - 34 id trùng nhau giữa các DRS (ảnh nền độ phân giải/màu khác nhau) được giữ an toàn nhờ phân thư mục `<drs>`.
- [x] Sinh `raw/manifest.json`: 248 bản ghi gồm id, loại semantic (`screen_desc`, `palette`, `bmp`, `slp`, `shp`, `color_table`, `binary`), bảng DRS gốc, kích thước, tên file và đường dẫn tương đối. Đã kiểm tra khớp 100% với dữ liệu trên đĩa.

## Bước 2 — Giải mã SLP sang PNG

Script: `tools/slp2png.py` (Python + Pillow).

- [x] Bộ giải mã SLP v2.0N: đủ các lệnh nén (Color List, Big Color List, Color Fill), trong suốt (Skip, Big Skip), vùng màu người chơi (Player Color List, Player Color Fill), shadow fill (bán trong suốt). Đã kiểm tra giải mã thành công 170/170 file SLP (982/982 frame, 0 lỗi).
  - **Sửa lỗi (11/11):** màu người chơi lấy index `141 + giá trị` (sai). Đúng: palette `50500`, người chơi N có dải 10 sắc độ bắt đầu ở index `16 × N` (1 xanh, 2 đỏ, 3 vàng, 4 nâu, 5 cam, 6 lục, 7 xám, 8 ngọc). Mặc định xuất người chơi 1 (xanh). Bảng `50900`–`50911` không phải bảng màu người chơi (chưa rõ công dụng).
- [x] Mỗi ảnh dùng đúng bảng màu theo file mô tả màn hình. Tự động đọc ánh xạ từ 42 file mô tả màn hình (`500xx`, `53000`), gán palette `50501`–`50508` cho từng màn hình.
  - **Sửa lỗi (11/11):** bản đầu fallback `50501` cho ảnh không có file mô tả → 110/170 SLP sai màu, nhìn như nhiễu. Ảnh không có file mô tả là đồ hoạ **trong trận**, game vẽ bằng palette `50500`. Nay fallback = `50500`, ngoại lệ `52001`/`52002` = `50501`. Đã chạy lại `slp2png.py` + `organize_assets.py` + asset browser (0 lỗi).
- [x] Ảnh nhiều frame → từng frame riêng + sprite sheet kèm JSON tọa độ:
  - Xuất 982 ảnh frame riêng vào thư mục `<id>_frames/frame_xxx.png`.
  - Đóng gói sprite sheet `<id>_sheet.png` (hỗ trợ các frame có kích thước khác nhau như thanh UI trên/dưới `50733`).
  - Xuất file tọa độ `<id>_sheet.json` (chứa `frame`, `x`, `y`, `width`, `height`, `hotspot_x`, `hotspot_y`).
  - Xuất `raw/slp_manifest.json` ghi lại toàn bộ thông tin ảnh đã giải mã.
- [x] Kiểm tra: so ảnh nền `50100` với ảnh chụp game thật, màu phải khớp:
  - Kích thước `1366x768` RGBA (bản HD `interfac`) và `1280x800` (`inter1`).
  - Màu viền vàng cát `(255, 192, 126)`, màu nền đá nâu `(45, 28, 8)`, 100% pixel thuộc bảng màu `50501.pal` (0 pixel sai lệch). Khớp hoàn toàn với giao diện chính của SuperAoE.
  - ⚠ Tiêu chí "pixel thuộc bảng màu" luôn đúng nên không phát hiện được palette sai. Kiểm tra đúng: (1) đo độ nhiễu (chênh lệch màu điểm kề nhau) với từng palette — palette đúng cho ảnh mượt hơn rõ rệt; (2) xem bằng mắt / so ảnh chụp game. Đã làm (1) cho 170 SLP: mọi ảnh nền có file mô tả đều khớp palette mượt nhất.

## Bước 3 — Lọc asset, tokens và đặc tả component cho Hub

Mục tiêu sản phẩm: **game hub kiểu nền tảng kết nối** (đăng nhập, sảnh, phòng chơi, bạn bè, chat, hồ sơ, giải đấu, launcher).
Game chỉ cung cấp "chất liệu" (nền, nút, bevel, màu, font, icon). Phần lớn component của hub **không có trong game** và phải tự thiết kế theo đúng chất liệu đó.

Nguồn của mỗi component được ghi theo 3 mức:
- **Game:** dùng thẳng asset/token tách từ game.
- **Phái sinh:** game có kiểu tương tự, dựng lại bằng CSS từ tokens (ví dụ bevel → input, scrollbar).
- **Tự thiết kế:** game không có, thiết kế mới bằng tokens + font + bevel cho đồng bộ.

### 3.1 Asset từ game

Trang xem nhanh toàn bộ PNG (`demo/asset-browser`) → đối chiếu id → đặt tên có nghĩa → lưu vào `assets/ui/`.

| Nhóm | Id thực tế | Nội dung xác nhận | Dùng cho hub |
|---|---|---|---|
| Ảnh nền màn hình (theo theme, nhiều độ phân giải) | 50100–50153, 53201–53209 | Ảnh nền 9 theme: 768p, 900p, 1080p và 2K QHD (2560x1440) | Nền `Screen`/`AppShell`, ảnh hero trang chủ |
| Texture lát nền hộp thoại | 50204 (sa thạch), 50210 (sa thạch), 50212 (cẩm thạch), 50214 (gạch), 50216 (gỗ), 53003 (đá đen) | **Đã sửa:** chỉ là texture lát (tile), **không có viền** — viền do engine vẽ bằng bevel (xem 3.2) | Nền `Panel`/`Dialog` (lát `background-repeat`) |
| Sprite control theo theme (16–21 frame) | 50601–50612, 53004 (50605–50608, 53004 = `dlg6_0`–`dlg6_4`) | **Đã sửa:** cặp (normal, pressed) của checkbox-off, checkbox-on, blank, close, arrow-up, arrow-down, blank-alt, arrow-down-alt; frame ≥ 16 = glyph phụ (?, rùa, mũi tên tốc độ). Xuất: `button/<theme>-<control>-<normal\|pressed>` | `Checkbox`, nút đóng, mũi tên cuộn / `Select` |
| Con trỏ chuột | 51000 (7 frame), 51001–51010 | Hệ thống (default, busy/đồng hồ cát, pointer, sword, crosshair) + mũi tên theo theme | Cursor mặc định, cursor bận/chờ, tương tác |
| Icon công trình theo phong cách (50 frame mỗi bộ) | 50704 Ai Cập, 50705 Hy Lạp, 50706 Babylon, 50707 Á Đông, 53005 La Mã | **Đã xác nhận:** 5 phong cách kiến trúc, cùng thứ tự frame = cùng loại công trình. Ảnh so sánh: [`demo/compare/architecture-styles.png`](demo/compare/architecture-styles.png). Xuất: `icon/<style>-buildings-sheet` | Icon phòng chơi, thẻ civ, theme theo phe |
| Icon công nghệ (101 frame) | 50729 | **Đã sửa:** công cụ, giấy cói, tượng, bánh xe, tiền… (Gemini ghi nhầm là lính/công trình). Xuất: `icon/techs-sheet` | Icon thành tựu, rank, kỹ năng |
| Icon lính (61 frame, 50x50) | 50730 | **Đã sửa:** dân làng, tu sĩ, bộ binh, cung thủ, kỵ binh, chiến xa, công thành, tàu (Gemini ghi nhầm là công nghệ). Xuất: `icon/units-sheet` | Avatar, icon phòng chơi, thẻ trận |
| Cờ tập kết (7 frame) | 50404 | **Đã sửa:** animation cờ trắng bay (không phải cờ civ, không có điểm ảnh màu người chơi). Xuất: `fx/rally-flag-sheet` | Chỉ báo "điểm hẹn", loading nhỏ |
| Dấu X ra lệnh di chuyển (8 frame) | 50405 | **Đã sửa:** animation dấu X đỏ khi ra lệnh (không phải icon tài nguyên). Xuất: `fx/move-marker-sheet` | Hiệu ứng click / xác nhận |
| Icon tài nguyên | 50732 (lớn, 4 frame), 50731 (nhỏ, 11 frame) | **Đã sửa:** 50732 = Gỗ, Đá, Thịt, Vàng → `icon/resources-sheet` + `icon/res-wood/stone/food/gold`; 50731 = bản nhỏ + dân số… + icon chỉ số lính (kiếm, giáp…) + 2 khung trắng (mask?) → `icon/stats-small-sheet` | Thanh tài nguyên, điểm thưởng hub |
| Nền nút vuông HUD (4 frame) | 50713–50716, 53006 (thứ tự Ai Cập, Hy Lạp, Babylon, Á Đông, La Mã) | **Đã sửa:** nền nút trống theo phong cách (không phải Menu/Chat/Diplomacy/TechTree); 4 frame = trạng thái. Xuất: `hud/<style>-button-bg-sheet` | Nền `IconButton` |
| Nút Mũi tên / Huỷ (4 frame) | 50725–50728, 53009 (cùng thứ tự phong cách) | Mũi tên đỏ (tiếp/xác nhận) và dấu X đỏ (huỷ), mỗi cái 2 trạng thái. Xuất: `hud/<style>-arrow-cancel-sheet` | Nút Tiếp / Huỷ |
| Nút chữ nhỏ trong trận (2 frame) | sm 72x20: 50717–50720, 53007; md 108x20: 50747–50750, 53008 (cùng thứ tự phong cách) | **Mới tìm thấy:** nút chữ 2 trạng thái theo 5 phong cách. Xuất: `hud/<style>-text-button-sm/md-sheet` | `Button` nhỏ, `Tabs`, nút trong panel |
| Thanh giao diện trong trận (frame 0 = top 20px, frame 1 = bottom 126px) | 1366: 50733–50736; 1600: 50737–50740; 1920: 50741–50744 (thứ tự Ai Cập, Hy Lạp, Babylon, Á Đông); La Mã: 53010/53011/53012; 2K 2560: 53210–53214 (5 phong cách) | **Đã xác nhận:** 5 phong cách × 4 độ phân giải (đã kiểm tra bằng mắt cả bản 2K). Phù điêu: Pharaoh (Ai Cập), vũ công cẩm thạch (Hy Lạp), sư tử đá tối (Babylon), gỗ đinh đồng (Á Đông), tượng người đá xám (La Mã). Xuất: chỉ bản 2560 → `hud/<style>-topbar.png`, `hud/<style>-bottombar.png` (các bản khác trong `raw/`) | TopBar / BottomBar của hub, đổi theo theme phe |
| Thanh máu / tiến độ (26 frame) | 50745 | **Đã xác nhận:** thanh 50x7 px xanh → đỏ theo mức máu. Xuất: `hud/health-bar-sheet` | ProgressBar, thanh tải game, ping |
| Cờ đuôi nheo người chơi | 50746 (126x33) | Cờ vải **đổi màu theo người chơi** (sau khi sửa màu người chơi: xanh cho người chơi 1). Xuất: `hud/pennant` | Nhãn người chơi / đội, ribbon tiêu đề |
| Chữ số nhóm (20 frame) | 50403 | Số trắng 1–9, 0, 10–19 (số nhóm quân). Xuất: `icon/digits-sheet` | Bộ đếm, badge số |
| Nền minimap (BMP) | 50401 (220x114), 50402 (275x137) | **Đã sửa:** nền hình thoi của minimap (không phải logo AoE). Xuất: `minimap/minimap-bg-sm/lg` | Khung bản đồ trong `RoomCard` / `RoomLobby` |
| Font | `coprgtl.ttf`, `vncoprgt.ttf`, `vnarial*.ttf` | Copperplate Gothic + Arial bản TCVN3 — **không có Unicode tiếng Việt**, chỉ tham khảo | Thay bằng Spectral SC + Arimo (xem 3.2) |

- [x] Dựng `demo/asset-browser`: [`demo/asset-browser/index.html`](demo/asset-browser/index.html). **Làm lại (11/11)** cho đỡ rối: mặc định là *Thư viện hub* — 350 asset của `assets/ui/` chia theo khu vực dùng trong hub (nền, texture hộp thoại, control theo theme, HUD theo phe ghép 2 lớp, icon, hiệu ứng, minimap, con trỏ thử được, mẫu font), đánh dấu theme mặc định, tìm kiếm + lọc theo khu vực, hộp chi tiết (đường dẫn có nút chép, id gốc, kích thước, duyệt từng frame). Tab phụ *Dữ liệu gốc* liệt kê 172 SLP trong `raw/` theo DRS.
  - ⚠ Còn nghi vấn: `hud/asian-text-button-sm` (50720) là sheet 671×242 gồm các mảnh lặt vặt, không giống nút chữ của 4 phe kia — cần xác định lại.
- [x] Xác nhận từng nhóm ở bảng trên; sửa id/ghi chú trong PLAN.md cho đúng thực tế:
  - Lần đầu định danh trên ảnh **sai palette** → nhiều nhóm đồ hoạ trong trận bị nhận nhầm. Bảng đã sửa theo ảnh đúng màu (các dòng "Đã sửa").
  - Đã xác nhận 5 phong cách (Ai Cập, Hy Lạp, Babylon, Á Đông, La Mã), thanh HUD (5 phong cách × 4 độ phân giải), 50729 = công nghệ, 50730 = lính, 50745 = thanh máu.
  - Chưa rõ, để lại: 2 khung trắng trong 50731; công dụng của 50746; 50721 (15 frame nền đen), 53001, 53002, 50400, 50406 chưa xuất.
- [x] Sửa `tools/organize_assets.py` theo bảng mới, giữ đủ 5 phong cách:
  - Thêm bảng `ARCH_STYLES` (egyptian, greek, babylonian, asian, roman) → mỗi phong cách xuất: thanh top/bottom × 4 độ phân giải, nền nút vuông, nút mũi tên/huỷ, nút chữ sm/md, icon công trình.
  - Đổi tên các file sai; thư mục mới `fx/`, `minimap/` (bỏ `logo/`). Script xoá và sinh lại các thư mục nó quản lý để không còn file tên cũ.
  - Chạy lại: 377 asset, 9 thư mục, 0 lỗi (nay là 350 sau khi gom độ phân giải, xem dưới). `build_asset_browser.py` đã cập nhật đường dẫn minimap và nhóm phân loại.
- [x] Quy ước tên: `<nhóm>/<theme>-<tên>[-<trạng thái>].png`; kèm `assets/ui/index.json` ánh xạ tên ↔ id gốc:
  - Đã xuất asset chuẩn vào [`assets/ui/`](assets/ui/) phân theo 9 thư mục: `bg/`, `button/`, `cursor/`, `dialog/`, `font/`, `fx/`, `hud/`, `icon/`, `minimap/`. Tên theo phong cách: `<style>-<tên>` với style ∈ egyptian / greek / babylonian / asian / roman.
  - Đã sinh [`assets/ui/index.json`](assets/ui/index.json) ánh xạ toàn bộ tên mới về ID gốc và DRS nguồn.
- [x] Sprite nút: tách đúng frame theo trạng thái `default / hover / pressed / disabled`:
  - Đã tách các nút `50601`–`50612`, `53004` thành từng file riêng theo kích thước (`lg`, `md`, `sm`) và 4 trạng thái, đồng thời lưu kèm sprite sheet và JSON tọa độ.
- [x] Cursor: xuất `.png` + `.cur` (có hotspot):
  - Đã xuất đầy đủ 16 cursor sang cả định dạng `.png` và `.cur` (32-bit RGBA, có hotspot chuẩn): `default`, `busy` (đồng hồ cát), `pointer` (bàn tay), `action` (kiếm), `crosshair` (ngắm), `resize-diag`, `scroll` và các cursor theo từng theme `theme-scr1`..`theme-scr10`.

- [x] **Gom độ phân giải** (người dùng duyệt): mỗi asset chỉ giữ 1 bản, các bản game khác vẫn nằm trong `raw/`.
  - Ảnh nền: giữ bản **lớn nhất** (2560, hoặc bản duy nhất với `scr5`/`scr9`) → `bg/<theme>.webp` + `bg/<theme>-1920.webp` thu nhỏ từ bản gốc. Lý do: các độ phân giải là cùng một hình (bản 2560 thu nhỏ lệch TB 2–6/255 so với bản nhỏ); ảnh 8-bit dithering thu nhỏ thì mịn, phóng to thì vỡ. Dung lượng 49 MB → 3,5 MB.
  - Thanh HUD: cao cố định, các bản chỉ khác chiều dài và không lặp đều theo pixel → giữ bản 2560 (`hud/<style>-topbar|bottombar.png`), đặt bằng neo trái + lớp 280px ô minimap neo phải (metadata `slice`). 1,7 MB → 634 KB. Đã thử hiển thị ở 1000 và 1500px.
  - Icon / sprite / control: vốn 1 bản, hiển thị đúng cỡ hoặc phóng bội số nguyên với `image-rendering: pixelated`.
  - Không phải chạy lại tách DRS / giải mã SLP; chỉ chạy lại `organize_assets.py` (15 giây), `build_tokens.py`, `build_asset_browser.py`. Tổng: **350 asset**, 0 lỗi.

### 3.2 Design tokens

Script: `tools/build_tokens.py` → [`tokens/design-tokens.json`](tokens/design-tokens.json) + trang xem trước [`demo/tokens/index.html`](demo/tokens/index.html).

**Viền (border) trong game:** không có sprite viền nào. Engine vẽ viền bevel 3px từ 6 màu `bevel_colors` (sáng → tối):
nổi = cạnh trên/trái `bevel[0]` (ngoài), `bevel[1]`, `bevel[2]` (trong); cạnh dưới/phải `bevel[3]` (trong), `bevel[4]`, `bevel[5]` (ngoài). Lõm = đảo hai nhóm.
`text_color2` = màu bóng chữ 1px (đen); `shade_amount` = % lớp phủ tối của panel. Đã dựng thử bằng `box-shadow` inset trong trang xem trước, nhìn khớp kiểu AoE.

- [x] `design-tokens.json`: 9 theme màn hình + 14 theme hộp thoại (`bevel[6]` hex + chỉ số palette, `text`, `textShadow`, `focus`, `state`, `shade`, `background`, ảnh nền / texture, màu nền trung bình).
- [x] Token viền `bevel`: độ dày 3px, biến thể `raised / sunken / etched / flat`, quy tắc thứ tự màu như trên.
- [x] 5 phe (`egyptian`, `greek`, `babylonian`, `asian`, `roman`): `surface / surfaceLight / surfaceDark / onSurface` lấy mẫu từ thanh HUD + đường dẫn asset của phe.
- [x] Màu người chơi `player-1..8` (blue, red, yellow, brown, orange, green, grey, cyan): `base / light / dark` + dải 10 sắc độ từ palette `50500`.
- [x] Token tự thiết kế: `semantic` (success / warning / danger / info) và `status` (online / away / busy / in-game / offline) — chọn từ palette `50500` để giữ chất game; spacing 4px, radius 0, z-index, motion.
- [x] Tương phản chữ chính / nền trung bình đã phủ tối: 9/9 theme màn hình đạt AA (9.0–15.6:1); hộp thoại **chưa đạt**: `dlg1` 3.98, `dlg4` 4.4, `dlg12` 2.95, `dlg13` 4.3 → khi dùng các theme này phải tăng `shade` hoặc dùng chữ `state` (trắng).
- [x] **Font tiếng Việt** — chọn hướng (b) font web thay thế:
  - Font game không dùng được: `vncoprgt.ttf`, `vnarial*.ttf` mã **TCVN3 (ABC)**, `coprgtl.ttf` chỉ Latin-1 (và là font thương mại) → chỉ giữ để tham khảo.
  - **Heading: Spectral SC** (400/600/700) — gần Copperplate nhất trong 7 font small caps có tiếng Việt đã so sánh ([`demo/compare/fonts.png`](demo/compare/fonts.png)).
  - **Body: Arimo** (400/700) — cùng số đo với Arial, font body của game.
  - Giấy phép OFL, đóng gói offline: `tools/fetch_web_fonts.py` → `vendor/fonts/` → `organize_assets.py` chép sang `assets/ui/font/web/`. Đã kiểm tra đủ glyph tiếng Việt (kể cả chữ hoa có dấu).
  - Token `typography.fontFamily` + `fontFaces` đã cập nhật; trang xem trước hiển thị đúng "SẢNH CHỜ".
- [x] Theme mặc định: màn hình **`scr2`**, hộp thoại **`dlg6_0`** (sa thạch). Các theme khác (màn hình, hộp thoại, 5 phe, `dlg6_1`–`dlg6_4`) là theme phụ. Ghi trong token `defaults`.

### 3.3 Danh mục component (Atomic Design)

Viết đặc tả vào `docs/components.md`: mỗi component có cấp, biến thể, trạng thái, nguồn, asset/token dùng, ghi chú UX.

**Atoms**

| Component | Biến thể / trạng thái | Nguồn |
|---|---|---|
| `Bevel` / `Frame` | raised / sunken / etched / flat; độ dày 1–3px; màu theo theme hoặc phe | Phái sinh — **viền của mọi đối tượng** (nút, panel, ô nhập, danh sách) do engine vẽ, dựng bằng `box-shadow` inset từ token `bevel` |
| `Surface` | texture lát (sa thạch / cẩm thạch / gạch / gỗ / đá đen) hoặc màu phẳng + lớp phủ `shade` | Game (texture 3.1) |
| `Button` | primary / secondary / ghost / danger; sm / md / lg; default / hover / pressed / focus / disabled / loading | Game (sprite nút) + `Bevel` raised, nhấn → sunken |
| `IconButton` | vuông, có tooltip bắt buộc | Phái sinh |
| `Text` / `Heading` | h1–h4 (Spectral SC), body (Arimo), caption, số liệu (tabular) | Game (màu chữ) + font thay thế |
| `Icon` | tài nguyên, civ, hệ thống (UI chung: settings, bell, search…) | Game + Tự thiết kế |
| `Input` | text / password / search; default / focus / error / disabled | Phái sinh (bevel lõm) |
| `Textarea` | như Input, tự giãn | Phái sinh |
| `Checkbox` / `Radio` / `Toggle` | checked / unchecked / indeterminate / disabled | Checkbox: **Game** (sprite control); Radio/Toggle: Phái sinh |
| `Select` | đóng / mở / disabled | Phái sinh |
| `Slider` | volume, độ khó | Phái sinh |
| `Badge` / `Tag` | số thông báo, trạng thái phòng, rank | Tự thiết kế |
| `Avatar` | ảnh / chữ cái / civ emblem; viền màu người chơi; size xs–xl | Tự thiết kế + token player |
| `StatusDot` | online / away / busy / in-game / offline | Tự thiết kế |
| `PingIndicator` | 3–4 vạch theo ms | Tự thiết kế |
| `ProgressBar` | xác định / không xác định | Phái sinh (bevel lõm + fill) |
| `Spinner` | dùng cursor chờ / đồng hồ cát | Game (cursor) |
| `Divider` | ngang / dọc, bevel khắc chìm | Phái sinh |
| `Tooltip` | text / rich | Phái sinh |
| `Cursor` | default / pointer / busy | Game |
| `Kbd` | phím tắt | Tự thiết kế |

**Molecules**

| Component | Mô tả | Nguồn |
|---|---|---|
| `FormField` | label + input + hint + lỗi | Phái sinh |
| `SearchBar` | input + icon + nút xoá | Phái sinh |
| `Tabs` | tab dạng nút bevel, tab đang chọn lõm | Phái sinh |
| `ListRow` | dòng danh sách kiểu game (chọn = nền sáng + chữ focus) | Game (style list) |
| `Menu` / `DropdownMenu` | danh sách hành động, phím tắt | Phái sinh |
| `PlayerChip` | avatar + tên + status + ping | Tự thiết kế |
| `ChatMessage` | avatar, tên (màu người chơi), giờ, nội dung, tin hệ thống | Tự thiết kế |
| `RoomCard` | tên phòng, map, chế độ, số người, ping, khoá | Tự thiết kế |
| `PlayerSlot` | ô người chơi trong phòng: civ, màu, đội, ready, kick | Phái sinh (màn multiplayer của game) |
| `StatBlock` | nhãn + số + biến động | Tự thiết kế |
| `Toast` | success / info / warning / error, có hành động | Tự thiết kế |
| `EmptyState` | icon + mô tả + nút hành động | Tự thiết kế |
| `Pagination` | trang / tải thêm | Phái sinh |

**Organisms**

| Component | Mô tả | Nguồn |
|---|---|---|
| `AppShell` | nền theme + top bar + side nav + vùng nội dung + panel bạn bè | Game (nền, bar) + Tự thiết kế (bố cục) |
| `TopBar` | logo, điều hướng chính, tìm kiếm, thông báo, tài khoản, ping | Game (thanh trong trận) |
| `SideNav` | mục điều hướng có icon + badge | Phái sinh |
| `Dialog` / `Modal` | tiêu đề, nội dung, nút hành động; xác nhận / form | Game (nền hộp thoại + shade) |
| `FriendsPanel` | tìm, nhóm theo trạng thái, lời mời, menu hành động | Tự thiết kế |
| `ChatPanel` | kênh sảnh / phòng / nhắn riêng, danh sách tin, ô nhập | Tự thiết kế |
| `RoomBrowser` | bảng phòng + lọc + sắp xếp + tạo phòng | Phái sinh (list game) |
| `RoomLobby` | lưới `PlayerSlot`, cài đặt trận, chat phòng, Ready / Start | Phái sinh (màn multiplayer game) |
| ~~`MatchmakingQueue`~~ | ~~đang tìm trận, thời gian chờ, huỷ, chấp nhận trận~~ — **bỏ 13/11** cùng màn Xếp trận | Tự thiết kế |
| `TournamentList`, `PhaseStepper`, `TournamentSetupDialog`, `Bracket` + `MatchCard` | giải đấu: danh sách giải, pha, thiết lập của QTV, sơ đồ nhánh (thêm 13/11, đề xuất) | Tự thiết kế |
| `ProfileHeader` | avatar, tên, rank, thống kê chính | Tự thiết kế |
| `MatchHistoryTable` | trận, civ, kết quả, thời lượng, ngày | Phái sinh |
| `NotificationCenter` | danh sách thông báo, đánh dấu đã đọc | Tự thiết kế |
| `LaunchBar` | trạng thái game, tải / cập nhật (progress), nút **Chơi** | Tự thiết kế |
| `SettingsForm` | nhóm cài đặt: tài khoản, âm thanh, đồ hoạ, mạng | Phái sinh |
| `ToastStack` | xếp chồng toast, tự ẩn | Tự thiết kế |

**Templates / màn hình**

| Màn hình | Organisms chính |
|---|---|
| Đăng nhập / Đăng ký | `Dialog`, `FormField`, `Button` trên nền theme |
| Trang chủ | `AppShell`, tin tức/sự kiện, bạn đang online, `LaunchBar` |
| Sảnh (danh sách phòng) | `RoomBrowser`, `ChatPanel` (kênh sảnh) |
| Phòng chơi | `RoomLobby`, `ChatPanel` (kênh phòng) |
| ~~Xếp trận~~ → Giải đấu (13/11) | `TournamentList`, `PhaseStepper`, `TournamentSetupDialog`, `Bracket`, `MatchHistoryTable`, `ChatPanel` (kênh giải) |
| Bạn bè & tin nhắn | `FriendsPanel`, `ChatPanel` (nhắn riêng) |
| Hồ sơ | `ProfileHeader`, `StatBlock`, `MatchHistoryTable` |
| Cài đặt | `SettingsForm` |

- [x] Viết [`docs/components.md`](docs/components.md): nguyên tắc chung (nguồn, theme mặc định, quy tắc `Bevel`, chữ, trạng thái chuẩn, quy ước tên asset) + 23 atoms, 13 molecules, 15 organisms, 9 màn hình — mỗi component có nguồn, biến thể, trạng thái, asset/token, ghi chú UX/a11y.
- [x] Wireframe ASCII [`docs/wireframes.md`](docs/wireframes.md): luồng chính đăng nhập → trang chủ → sảnh → phòng → sẵn sàng → chơi → kết quả (+ nhánh xếp trận, nhánh lỗi) và bố cục 8 màn hình + dialog kết quả trận.
- [x] Sửa xuất sprite control (phát hiện khi viết đặc tả `Checkbox`): `506xx`/`53004` không phải "nút 4 cỡ × 4 trạng thái" mà là cặp (normal, pressed) của checkbox-off/on, blank, close, arrow-up/down… ; theme `dlg6` lệch 1 bậc (50605 = `dlg6_0`). Đổi tên texture hộp thoại theo chất liệu (`dialog/dlg6_0-sandstone`…). Chạy lại: 394 asset, 0 lỗi.

### 3.4 Quy tắc UX

Tài liệu: [`docs/ux-guidelines.md`](docs/ux-guidelines.md) — quy tắc có tiêu chí kiểm tra được + checklist review dùng ở bước 4. Các mục dưới là **đặc tả đã viết**; việc kiểm tra trên code thật nằm ở mục "Kiểm tra" của bước 4.

- [x] **Trạng thái đầy đủ** (§1): đang tải (skeleton, trễ 150 ms) · đang làm mới (giữ dữ liệu cũ) · rỗng (phân biệt "lọc không ra") · lỗi (Thử lại) · mất kết nối (banner + tự nối lại + tải lại vùng đang mở).
- [x] **Phản hồi thao tác** (§2): ≤ 100 ms đổi trạng thái; > 300 ms loading, > 2 s chữ tiến trình, > 10 s cho Huỷ; cập nhật lạc quan cho chat / sẵn sàng; danh sách thao tác phải xác nhận (Enter = nút an toàn); hoàn tác thay vì hỏi cho thao tác nhẹ; nút disabled phải có lý do.
- [x] **Bàn phím** (§3): focus ring nét đứt màu `focus` (≥ 3:1: 11.04 / 5.83), roving tabindex cho danh sách dài, skip link, bảng phím tắt (`Alt+1…6`, `Ctrl+K`, `R`, `?`…), phím một ký tự tắt khi đang gõ.
- [x] **Truy cập** (§4): đo tương phản mọi cặp màu trên theme mặc định. Phát hiện và xử lý:
  - Chữ màu `scr2` trên texture `dlg6_0` chỉ 4.05, muted / màu ngữ nghĩa trên texture 1.5–3.5 → **trên texture hộp thoại chỉ dùng chữ trắng**; nội dung màu đặt trong "giếng" tối.
  - `info` (4.34), người chơi xanh (4.34), lục (3.91) không đạt trên nền tối → thêm token `players.*.onDark`, `color.semanticOnDark`, `color.statusOnDark` (sắc độ gần nhất trong cùng dải màu của game: `#739bc7` 6.43, `#7f8b37` 5.01), sinh tự động trong `build_tokens.py`.
  - Chữ trên badge màu: token `color.onSemantic` (đen cho cả 4 màu).
  - Bảng ARIA theo component, không truyền nghĩa chỉ bằng màu, vùng bấm ≥ 24px, cỡ chữ 90–125%.
- [x] **Responsive** (§5): 4 mốc 1600 / 1280 / 1024 / < 1024 cho `AppShell`; ảnh nền chỉ thu nhỏ; đồ hoạ điểm ảnh chỉ phóng bội số nguyên.
  - **12/11 đổi hướng:** app (`demo/app`) chạy trên sân khấu cố định **1600×900**, không đổi kích thước theo cửa sổ (cửa sổ nhỏ hơn thì cuộn, lớn hơn thì căn giữa) → các mốc 1280 / 1024 / < 1024 không còn áp dụng cho app; Bước 5 Electron sẽ khoá cửa sổ 1600×900 (`resizable: false`).
- [x] **Chuyển động** (§6): 100 / 150 / 200 ms, kiểu theo bước như game, `prefers-reduced-motion`; âm thanh game mặc định tắt, chỉ cho sự kiện quan trọng.
- [x] **Thời gian thực** (§7): quy tắc cho trạng thái bạn bè, đang gõ, tin mới (nút "Tin mới ↓"), thay đổi phòng, phòng biến mất, lời mời / tìm thấy trận, kết nối lại, nhịp đọc `aria-live`.
- [x] **Nội dung** (§8): giọng văn nút / lỗi, định dạng thời gian và số.

## Bước 4 — Dựng bộ component

- [x] **Khung dự án:** Vite + React + TypeScript + Tailwind; Storybook (hoặc trang demo) để xem từng component.
  - Xong (11/11): `package.json` (Vite 8, React 19, TypeScript, Tailwind 3.4 — bản 3 vì dùng preset JS + plugin), `vite.config.ts` (gốc = thư mục dự án, `assetsInlineLimit: 0` để sprite là file rời), `tailwind.config.js`, `tsconfig.json`. Chọn **trang demo** thay Storybook (nhẹ, không thêm phụ thuộc): [`demo/gallery/`](demo/gallery/) — `npm run dev` mở `/demo/gallery/`, `?screen=scr5&dialog=dlg6_3` mở theo theme. `npm run build` = typecheck + build ra `dist/`. Gallery mở mặc định hộp thoại **Gỗ `dlg6_3`** (người dùng chọn sau trang thử texture, 11/11); theme mặc định của dự án vẫn là `dlg6_0`.
  - **Gộp trang demo (13/11, người dùng yêu cầu):** mọi trang demo vào **một trang** [`demo/index.html`](demo/index.html) (`/demo/`, [`DemoHub.tsx`](demo/DemoHub.tsx)) — menu trái 3 nhóm: **Component** (Nguyên tử / Phân tử / Thành phần — story React render trực tiếp, thanh trên chọn theme màn hình, hộp thoại, kiểu viền Game / A′ / B, nền mẫu, con trỏ game) · **Theme** (Theme & tokens, Texture hộp thoại, Thư viện asset — các trang HTML sinh bởi `build_tokens.py` / `build_asset_browser.py` hoặc độc lập, nhúng bằng iframe để không đổi luồng sinh) · **Bố cục** (Đăng nhập, Sảnh & phòng chơi — app 1600×900 nhúng và thu nhỏ vừa khung, tự đặt phiên giả đăng nhập / chưa đăng nhập; Đăng nhập bản HTML cũ). Mỗi mục có địa chỉ riêng `#/atoms`, `#/lobby`… và nút "Mở riêng ↗". Bỏ `demo/gallery/index.html` / `main.tsx` / `Gallery.tsx`; `Story` tách sang [`demo/gallery/Story.tsx`](demo/gallery/Story.tsx), file story giữ nguyên. Build: input `demo` thay `gallery`. Bảng chỉnh thông số của trang ngoài chỉ hiện ở mục Component. Đã kiểm tra trên server 5173: 9 mục đều hiện, không lỗi JS, vào phòng được trong khung nhúng; `npm run build` qua. Hạn chế: các trang nhúng (tokens, textures, asset) chưa nằm trong `dist/` — chỉ xem bằng `npm run dev`.
  - **Thanh công cụ duyệt ở rìa (13/11, người dùng yêu cầu):** các nút duyệt của app không còn đè lên màn hình — dồn vào **thanh dọc 40px ở rìa phải cửa sổ, ngoài sân khấu 1600×900** (`#review-rail` trong [`demo/app/index.html`](demo/app/index.html), trang rộng tối thiểu 1640px; khung nhúng ở trang demo gộp đổi thành 1640×900). **Mỗi màn chỉ hiện nút của màn đó:** Đăng nhập → "Trạng thái" (bộ Xem trạng thái chuyển từ footer ra đây, Alt+S); Sảnh / Phòng → "Dữ liệu giả" (Alt+M); mọi màn → "Chỉnh thông số" ghim dưới đáy thanh (Alt+T). Mở bảng này thì bảng kia tự đóng (sự kiện `aoe-review-open`). Thành phần [`ReviewRail.tsx`](demo/app/ReviewRail.tsx) (`ReviewRailItem`, portal vào thanh); `MockShell` dùng nó; [`tuner.js`](demo/shared/tuner.js) tự gắn vào thanh khi trang có `#review-rail`, trang khác giữ chỗ cũ; bỏ biến `--aoe-tuner-bottom` trong `App`. Đã kiểm tra trên server 5173 ở cửa sổ 1640 và 1920 (thanh không chạm sân khấu) và trong trang demo gộp.
    - Sửa (13/11, người dùng): nút **chữ ngang**, **xếp từ dưới lên** (Chỉnh thông số thấp nhất, nút của màn ngay trên), căn mép phải — nút dài tràn sang trái **được đè lên màn hình chính**; nền nút đen đặc để đọc rõ khi đè. Bảng đang mở nằm trên đỉnh chồng nút, cùng căn mép phải (flex `order`: bảng 1, nút màn 2, tuner 3; tuner dùng `display: contents` để vào chung chồng). Đã kiểm tra trên 5173: Đăng nhập / Sảnh đúng thứ tự, mở Dữ liệu giả rồi Alt+T → chỉ còn bảng tuner.
- [x] **Tokens:** sinh `aoe-theme.css` (CSS variables theo theme) + `tailwind.preset.js` (màu, font, shade, player colors, semantic) + plugin `bevel-raised` / `bevel-sunken` / `bevel-etched`.
  - Đã có (11/11): `build_tokens.py` sinh [`tokens/aoe-theme.css`](tokens/aoe-theme.css) — @font-face, biến `--aoe-*` (theme màn hình, `data-theme`), `--dlg-*` (theme hộp thoại, `data-dialog-theme`), màu ngữ nghĩa / người chơi / `on-dark`, class `bevel-raised|sunken|etched|flat`, `tone-screen|dialog`, `surface-screen-bg|dialog|well`. Theme mặc định dùng `:where(:root)` để `data-theme` tường minh luôn thắng. ~~Còn thiếu `tailwind.preset.js`~~ → đã sinh (11/11).
  - [`tokens/tailwind.preset.js`](tokens/tailwind.preset.js) sinh từ cùng `build_tokens.py` (chạy 2 lần ra cùng kết quả): màu đều là CSS variable dạng kênh `rgb(var(--x-rgb) / <alpha-value>)` nên dùng được độ trong (`bg-tone-text/50`) và tự đổi theo theme; **thay hẳn bảng màu mặc định của Tailwind** (chỉ còn `tone-*`, `screen-*`, `dialog-*`, `success|warning|danger|info` + `-on-dark` / `-on`, `status-*`, `player-N` + `-on-dark`, `faction-*`, đen / trắng) để không lỡ tay dùng màu ngoài token. Font, cỡ chữ 11–32, radius 0, z-index, motion, keyframes `flip` / `stripes`.
  - Plugin utility (cùng định nghĩa với CSS thường): `bevel-raised|sunken` (+ `-1` / `-2` theo độ dày), `bevel-etched|flat|none`, `text-shadow-game|none`, `outline-game` (focus nét đứt trong bevel), `outline-game-out`, `pixelated`, `tabular` — dùng được với biến thể (`enabled:active:bevel-sunken`).
  - **Tone** `--t-*`: `.tone-screen` / `.tone-dialog` trỏ màu chữ, focus, bevel, sprite control về theme màn hình hay hộp thoại → component chỉ dùng `text-tone-*` và tự đúng màu khi nằm trong hộp thoại.
  - Sprite control theo theme thành biến CSS `--aoe-ctl-*` / `--dlg-ctl-*` (checkbox, close, mũi tên, blank × normal / pressed); `dlg6_3` mượn checkbox `dlg6_0` (quyết định màn Đăng nhập).
  - Con trỏ: `cursor-game-pointer|busy|action|crosshair` + con trỏ bàn tay mặc định cho nút / link, đều là PNG + hotspot đọc từ `.cur`, tắt bằng `data-cursor="system"`.
    - **Đổi (12/11, người dùng):** bỏ con trỏ dấu hỏi trên toàn app. **Phát hiện:** `cursor/pointer.png` thật ra là con trỏ "trợ giúp" (bánh xe + dấu "?" đỏ), không phải bàn tay (bàn tay là `scroll.png`) — bảng con trỏ ở trên ghi nhầm. Đã bỏ class `cursor-game-pointer`; nút / link / tab dùng mũi tên game `default.png`. **Quy ước: không dùng `pointer.png` trừ khi người dùng nhắc tới.** Sau đó (12/11) người dùng muốn **rê chuột lên bất cứ đâu cũng giữ mũi tên game**: mọi phần tử `cursor: inherit` từ `:root` — kể cả nút bị khoá (trước hiện mũi tên hệ thống) và ô nhập (trước hiện con trỏ chữ I); chỉ class `cursor-game-*` (đồng hồ cát, kiếm, ngắm) đổi con trỏ. Quét toàn bộ phần tử ở Đăng nhập và Sảnh: không còn phần tử nào khác con trỏ game.
  - Trang tokens có thêm bảng tương phản trước/sau (`onDark`), ô mẫu texture đã phủ `shade` đúng như số đo.
  - **Thử kiểu viền B (12/11, người dùng yêu cầu, chưa chốt):** class `bevel-*` giờ đọc biến `--bv-*` (khai báo cạnh `--b*` trong tone rule) → đổi kiểu viền không cần sửa component. `data-frame="modern"` trên `<html>` = khung một màu `bevel[0]` (đồng `#733b00` ở `hub-village`) — panel 80%, nút 100% + sáng nhẹ trên / tối nhẹ dưới, ô lõm 55% + bóng trong dưới mép trên; công thức ở `MODERN_SHADOWS` trong `build_tokens.py`. Bật / tắt: bảng "⚙ Chỉnh thông số" → "Kiểu viền", Alt+B, `?frame=modern|game` (nhớ trong localStorage). Thanh cuộn và line ngăn trong panel (`.frame-line`) đổi theo. **Phát hiện:** bảng bevel của theme màn hình hub không đi đều sáng → tối (chỉ `bevel[0]` sáng, `bevel[1..5]` gần đen) — vì thế kiểu game trông lệch sáng tối giữa các cạnh. Đã chụp so sánh Sảnh ở 2 kiểu; chưa kiểm tra hộp thoại gỗ ở kiểu B.
    - Thêm **kiểu A′** (12/11, `data-frame="lit"`): bevel game làm dịu, dày thống nhất 2px (lớp `-1` 1px), **luôn sáng trên-trái / tối dưới-phải cho mọi thứ** — ô nhập, nút, thẻ, cả trạng thái nhấn (nút nhấn chỉ còn dịch chữ 1px). Sáng = `bevel[0]`, tối = đen trong suốt (`LIT_SHADOWS`). Kiểu B thêm **độ nổi**: vệt sáng dưới mép trên, bóng tối trên mép dưới, đổ bóng ra ngoài (panel 4px/12px, nút 2px/3px); kiểu lõm không đổ bóng. Bảng chỉnh có 3 lựa chọn, Alt+B xoay vòng game → A′ → B. Đã chụp so sánh 3 kiểu ở Sảnh và hộp thoại Đăng nhập.
    - Sửa (12/11): kiểu B trước chỉ có vệt sáng trắng 10% nên không thấy nổi → giờ = viền đồng đều **bao quanh một vòng bevel 2px sáng trên-trái / tối dưới-phải** như A′ (+ đổ bóng); ô lõm = vòng tối trên-trái. Đo pixel mép panel: trái viền (111,57,1) → vòng sáng (85,44,5); đáy vòng tối (4,2,0) → viền (79,40,0).
    - Đổi theo người dùng (12/11): kiểu B = **3 bậc sáng của bevel game (`bevel[0]` → `[1]` → `[2]`, sáng ngoài, tối dần vào trong) chạy đều cả 4 cạnh** như khung tranh (người dùng thích dải này ở hộp thoại gỗ: (199,183,175) → (175,131,95) → (151,111,79)); nổi = đổ bóng ngoài; lõm đảo thứ tự (tối ngoài → sáng trong). Hộp thoại gỗ ra đúng như ảnh; ở theme màn hình `hub-village` `bevel[1..2]` gần đen nên khung chỉ thấy rõ đường đồng ngoài cùng.
    - **Đã chốt theo màn (12/11, người dùng):** màn Đăng nhập dùng **kiểu A′** (`lit`), mọi màn khác dùng **kiểu B** (`modern`). `ThemeProvider` có thêm `frame` / `setFrame` (đặt `data-frame` trên `<html>`); mỗi route khai báo `frame` trong [`routes.ts`](demo/app/routes.ts). Bảng chỉnh thông số vẫn đổi tạm để so (không lưu); `?frame=` cố định một kiểu.
  - **Lỗi ô nhập trắng khi trình duyệt tự điền** (12/11): Chrome tô nền sáng cho `:-webkit-autofill` đè lên ô trong suốt → `components/styles.css` giữ nền của ô (trì hoãn transition nền) + ép màu chữ / con trỏ về `--t-state`. Đã kiểm tra quy tắc có trong CSS trình duyệt nhận; **chưa tái hiện được tự điền thật bằng trình duyệt tự động** — cần người dùng xác nhận.
- [x] **Theme switch:** đổi theme bằng `data-theme` trên `<html>`, toàn bộ component đổi theo.
  - [`components/lib/theme.tsx`](components/lib/theme.tsx): `ThemeProvider` + `useTheme()` đặt `data-theme`, `data-dialog-theme`, `data-cursor` trên `<html>`; đổi theme không render lại cây component (chỉ đổi CSS variable). Đã chụp kiểm tra `scr2 + dlg6_0` và `scr5 + dlg6_3`: nền, texture, bevel, sprite control đổi đúng.
- [x] **Atoms** theo bảng 3.3, mỗi atom có story đủ trạng thái.
  - 23 atom trong [`components/atoms/`](components/atoms/) (`Frame` = Bevel, `Surface`, `Button`, `IconButton`, `Text` / `Heading`, `Icon` / `GameIcon` / `ResourceIcon`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Toggle`, `Select`, `Slider`, `Badge`, `Avatar`, `StatusDot`, `PingIndicator`, `ProgressBar`, `Spinner`, `Divider`, `Tooltip`, `Kbd`; `Cursor` = class `cursor-game-*`). Story ở gallery mục Atoms, đã chụp kiểm tra ở 1400px.
  - 47 icon hệ thống tự vẽ (lưới 24, nét 1.5, `currentColor`); icon game lấy frame từ sprite sheet JSON qua `import.meta.glob`.
  - Ghi chú: sprite control của `dlg6_3` (gỗ) cho close / mũi tên cũng chìm vào nền gỗ như checkbox — chưa đổi, cần người dùng quyết nếu dùng gỗ cho hộp thoại có nút control.
- [x] **Molecules** theo bảng 3.3.
  - 13 molecule trong [`components/molecules/`](components/molecules/): `FormField`, `SearchBar`, `Tabs` (+ `TabPanel`; top / segmented / vertical), `ListRow`, `Menu` / `DropdownMenu`, `PlayerChip`, `ChatMessage`, `RoomCard`, `PlayerSlot`, `StatBlock`, `Toast`, `EmptyState`, `Pagination` (pages / load-more / infinite). Kiểu dữ liệu chung ở [`components/lib/types.ts`](components/lib/types.ts), dữ liệu giả ở [`demo/gallery/mock.ts`](demo/gallery/mock.ts). Story ở gallery mục Molecules, đã chụp kiểm tra.
  - Asset mới: [`tools/recolor_player_sprites.py`](tools/recolor_player_sprites.py) sinh `hud/pennant-1..8.png` — thay dải màu xanh (người chơi 1) bằng dải màu người chơi N trong token, giống engine game đổi màu người chơi (chạy 2 lần ra cùng file). Chưa ghi vào `assets/ui/index.json`.
- [ ] **Organisms** theo bảng 3.3.
  - Dựng dần theo màn hình cần (xem Templates T0–T9), không dựng hàng loạt trước. Đã có (12/11, T0–T1): `AppShell`, `TopBar`, `SideNav`, `LaunchBar`, `ConnectionBanner`, `Dialog`. Còn lại: `FriendsPanel`, `ChatPanel`, `RoomBrowser`, `RoomLobby`, `MatchmakingQueue`, `ProfileHeader`, `MatchHistoryTable`, `NotificationCenter`, `SettingsForm`, `ToastStack`.
- [ ] **Templates:** dựng 8 màn hình với dữ liệu giả (mock), chạy được luồng chính — chia thành 11 việc ở mục **Templates — 11 việc** ngay dưới.
- [ ] **Kiểm tra:** đặt component cạnh ảnh chụp game thật; duyệt từng component / màn hình theo *Checklist review* trong [`docs/ux-guidelines.md`](docs/ux-guidelines.md).
  - Trang thử (11/11, người dùng yêu cầu): [`demo/textures/index.html`](demo/textures/index.html) — nền gốc `bg/scr2.webp` 2560×1440 + hộp thoại mẫu, chọn 6 texture (sa thạch, cẩm thạch, gạch, gỗ, đá đen, cát `dlg3`), chỉnh phủ tối (mặc định theo `shade` của theme), xem từng cái hoặc so sánh cả 6. Mở thẳng file, `?texture=wood&view=all`. Đã chụp kiểm tra.
  - **Phát hiện:** `url()` nằm trong biến CSS (`--dlg-texture`, `--*-ctl-*`) được trình duyệt giải theo stylesheet **dùng** biến, không theo `tokens/aoe-theme.css` → trang HTML tĩnh ở thư mục khác thấy ảnh hỏng. Gallery React không bị (Vite đổi sẵn đường dẫn); trang tĩnh phải đổi biến sang URL tuyệt đối bằng JS (hàm `absolutizeUrlVars` trong trang thử).

---

### Templates — 11 việc

Kế hoạch chi tiết (việc con, tiêu chí xong): [`docs/templates-plan.md`](docs/templates-plan.md).
**Chỉ làm khi người dùng bảo làm việc nào** — mỗi lần một việc; xong + chụp kiểm tra + người dùng duyệt mới sang việc khác. Organism nào màn cần mà chưa có thì dựng cùng màn đó (đánh dấu ở mục Organisms).

- [x] **T0. Khung app:** `demo/app/` (Vite page mới) — `ThemeProvider`, chuyển màn bằng state / hash (`#/login`, `#/home`…), dữ liệu giả dùng chung, `AppShell` rỗng (TopBar + SideNav + vùng nội dung + LaunchBar). Cần cho T2–T8.
  - Xong (12/11): [`demo/app/`](demo/app/) — `npm run dev` mở thẳng trang này. Router hash ([`routes.ts`](demo/app/routes.ts)), phiên giả (chưa đăng nhập → `#/login`; "Ghi nhớ" lưu `sessionStorage`), theme theo màn (`login` → `hub-temple`, còn lại `hub-village`), màn chưa làm hiện "làm ở việc T#". Dữ liệu giả chuyển sang [`demo/shared/mock.ts`](demo/shared/mock.ts).
  - Organisms mới: `AppShell`, `TopBar`, `SideNav` (nút HUD La Mã — tối nhất nên icon trắng rõ; mục chọn có viền vàng vì frame "nhấn" của sprite gần như không khác), `LaunchBar` (6 trạng thái), `ConnectionBanner`; story ở gallery mục Organisms.
  - Đã kiểm tra bằng điều khiển trình duyệt thật (script CDP trong scratchpad): đăng nhập → Trang chủ, nền đổi sang làng; Alt+2 → Sảnh; Chơi → Đang chơi; menu tài khoản → Đăng xuất → về Đăng nhập, nền đền. Chụp 1366×768 và 1280×1024. Chờ người dùng duyệt.
- [x] **T1. Đăng nhập / Đăng ký** (wireframes §1): chuyển bản mẫu `demo/screens/login.html` sang React. Theme `hub-temple` + `dlg6_3` (đã chốt). Organism: `Dialog`. Trạng thái: bình thường / lỗi form + lỗi từng ô / đang đăng nhập / mất kết nối; tab Đăng ký (Email, nhập lại mật khẩu, điều khoản). Đăng nhập `demo`/`demo` → sang Trang chủ.
  - Xong (12/11): [`demo/app/screens/LoginScreen.tsx`](demo/app/screens/LoginScreen.tsx) + organism `Dialog` (inline / modal: khoá focus, Esc, trả focus). Đăng ký là chế độ chuyển trong cùng hộp thoại (theo wireframe), xếp 2 cột để không che logo ở 768px. Lỗi hiện khi rời ô hoặc khi gửi, focus về ô lỗi đầu tiên; sai mật khẩu → lỗi dưới ô Mật khẩu, giữ tên, xoá mật khẩu, focus về ô Mật khẩu; tên đã có ("demo"…) báo trùng; đăng ký xong → về Đăng nhập với tên đã điền + `Toast`. Mất kết nối: banner đếm lần thử, nút chính khoá kèm lý do.
  - Đã kiểm tra: thứ tự Tab (tên → mật khẩu → Hiện → Ghi nhớ → Quên mật khẩu → Đăng ký → Đăng nhập), Enter gửi form, cả 4 trạng thái của thanh "Xem trạng thái". Lỗi tìm thấy khi kiểm tra và đã sửa: focus không về ô Mật khẩu (ô còn bị khoá lúc gọi focus); `FormField` ghi đè `id` của ô nhập; nút "Chỉnh thông số" che chân trang (nâng lên 64px). Chờ người dùng duyệt.
  - Sửa theo góp ý (12/11): ô nhập / ô văn bản bỏ khung vàng nét đứt khi focus → nền ô tối hơn + viền trong 1px trắng mờ (lỗi vẫn viền đỏ). Báo lỗi không còn làm hộp thoại đổi kích thước — người dùng chọn **A + B**: Đăng nhập dùng một dòng báo chung chừa sẵn trên hàng nút (ô chỉ đỏ viền), Đăng ký mỗi ô chừa sẵn 1 dòng gợi ý / lỗi + dòng chung cho điều khoản / mất kết nối; lời báo rút gọn còn 1 dòng (`FormField` `errorDisplay` / `reserveLine`, `FormMessage` mới). Đo bằng trình duyệt: hộp thoại Đăng nhập luôn 359px, nút luôn ở y=572 qua mọi trạng thái; Đăng ký luôn 407px.
- [ ] **T2. Trang chủ** (§2): `AppShell` đầy đủ, tin tức / sự kiện, bạn đang online, phòng gợi ý (`RoomCard`), `LaunchBar`. Organisms: `AppShell`, `TopBar`, `SideNav`, `LaunchBar`, `NotificationCenter`, `FriendsPanel` (bản gọn).
  - Bản đầu tiên (13/11, chờ duyệt — chưa đánh dấu xong, phạm vi §1–§6):
    - Đã tạo / sửa: [`demo/app/homeMock.ts`](demo/app/homeMock.ts), [`demo/app/screens/HomeScreen.tsx`](demo/app/screens/HomeScreen.tsx), [`demo/app/screens/home/HeroCarousel.tsx`](demo/app/screens/home/HeroCarousel.tsx), [`demo/app/screens/home/TournamentStrip.tsx`](demo/app/screens/home/TournamentStrip.tsx), [`demo/app/screens/home/WhatsNew.tsx`](demo/app/screens/home/WhatsNew.tsx), [`demo/app/screens/home/SuggestedRooms.tsx`](demo/app/screens/home/SuggestedRooms.tsx), [`demo/app/screens/home/FriendsOnline.tsx`](demo/app/screens/home/FriendsOnline.tsx), [`demo/app/screens/home/LiveAndChampion.tsx`](demo/app/screens/home/LiveAndChampion.tsx), [`demo/app/App.tsx`](demo/app/App.tsx).
    - Đã làm (§1–§6): cất `SideNav` khỏi `AppShell` và bỏ `Alt+1…9` trong app (§1.1, giữ nguyên `SideNav` ở trang demo component); khung 1600×900 2 cột không cuộn trang; `HeroCarousel` xoay 7s (dừng khi hover/focus, tôn trọng `prefers-reduced-motion`, nối giải đấu & changelog & toast sự kiện); `TournamentStrip` tối đa 4 thẻ giải đấu (phần thưởng vật phẩm kho đồ, không tiền); `WhatsNew` (tab Phần mềm / Core game, chấm đỏ chưa xem lưu `aoe-hub.seen-changelog.v1`, `Dialog lg` changelog); `SuggestedRooms` (lấy từ `lobbyMock`, nút Vào Sảnh / Tạo phòng / Vào / Vào xem); `FriendsOnline` (lấy từ `profileMock`, Mời / Vào xem / mở hồ sơ / Tất cả bạn bè); `LiveAndChampion` (trận đang đấu + vô địch gần nhất, tự ẩn khi trống); bảng `Dữ liệu giả — Trang chủ`.
    - Giả định (chờ người dùng chốt): vì `tournamentMock` đang có chuỗi `prize` dạng tiền (`500k`…), `TournamentStrip` ánh xạ sang nhãn phần thưởng vật phẩm kho đồ (`Danh hiệu Quán quân`, `Khung Sa thạch`…); `FriendList` (T7) chưa có chế độ thu gọn cho cột 380px nên `FriendsOnline` dựng bản gọn riêng dùng cùng nguồn `profileMock`.
    - Kiểm thử trình duyệt §6 (13/11, 1600×900): Đạt các luồng chính — không lỗi console app, không còn `SideNav` và `Alt+1…9` vô hiệu, `HeroCarousel` / `TournamentStrip` / `WhatsNew` (lưu `localStorage` qua reload) / `SuggestedRooms` (tạo phòng hiện ở Sảnh) / `FriendsOnline` / `MockShell` (rỗng, đang tải, lỗi) hoạt động đúng. Ghi chú: `#review-rail` nằm ngoài khung 1600px khiến `documentElement.scrollWidth` là `1640px`; `profileMock` của `demo` hiện không có bạn `offline` nên dòng `+ n ngoại tuyến` chỉ hiện khi có bạn ngoại tuyến.
    - Chưa làm: đánh dấu `[x]` T2 sau khi người dùng duyệt.
  - **Đổi hướng (13/11, người dùng):** Trang chủ là trang **quảng bá** — giải đấu, cái mới của phần mềm (launcher / hub) và core game; không còn phòng gợi ý / bạn bè / tin tức kiểu wireframe §2 cũ. **SideNav cất vào kho:** không hiện ở màn nào nữa (kể cả Trang chủ), giữ component `SideNav` trong thư viện + trang demo component để dùng sau. **Đã chốt thêm (13/11, người dùng):** giữ cột phải (bạn bè online, đang đấu trực tiếp, vô địch gần nhất); **giữ phòng gợi ý và bạn bè online**; **bỏ phím tắt Alt+1…9** cùng SideNav. Khối: banner xoay vòng (Giải đấu / Phần mềm mới / Core game mới / Sự kiện) · thẻ giải đấu · phòng gợi ý (+ Vào Sảnh / Tạo phòng) · Có gì mới (Phần mềm | Core game, changelog). Giao **Gemini** dựng. Thiết kế: [`docs/wireframes.md`](docs/wireframes.md) §2; brief: [`docs/t2-home-brief.md`](docs/t2-home-brief.md).
- [ ] **T3. Sảnh** (§3): `RoomBrowser` (lọc, sắp xếp, tìm, tải thêm) + `ChatPanel` kênh sảnh + `FriendsPanel`. Trạng thái: đang tải (skeleton) / rỗng / lỗi / dòng mới loé. Dialog "Tạo phòng" và "Nhập mật khẩu phòng". Vào phòng → T4.
  - **Bản đơn giản đầu tiên (12/11, người dùng yêu cầu, chờ duyệt — chưa đánh dấu xong):** [`LobbyScreen.tsx`](demo/app/screens/LobbyScreen.tsx) — Sảnh **không có SideNav icon**; trái = danh sách chữ Tất cả / RANDOM / CUNG R / CLAN ROOMS (kèm số phòng), nối liền thân bằng 1 đường kẻ; thân = "Danh sách phòng" (bảng: tên, chủ phòng, bản đồ, chế độ, người, ping, trạng thái); phải = "Đang online" (trên) + "Chat tổng" (dưới, gửi được, tự cuộn). Bảng điều khiển dữ liệu giả [`MockPanel.tsx`](demo/app/MockPanel.tsx) (nút "⚙ Dữ liệu giả", Alt+M, `?mock=open`): số phòng / người online / tin chat, tỉ lệ đầy-đang chơi / có mật khẩu, tin chat mới tự đến, trạng thái danh sách (bình thường / đang tải / rỗng / lỗi), mất kết nối chat, đặt lại; dữ liệu giả sinh có seed ở [`lobbyMock.ts`](demo/app/lobbyMock.ts). Chưa làm: lọc / sắp xếp / tìm, tải thêm, Tạo phòng, nhập mật khẩu, vào phòng, FriendsPanel, hành động trên người chơi. Đã chụp kiểm tra 1600×900 (Tất cả / CUNG R).
  - Sửa theo góp ý (12/11): 3 dải tiêu đề cao bằng nhau (40px) và nền tối hơn thân nhưng nhạt hơn TopBar; bảng đổi cột thành tên · chủ phòng · **thể loại** · người · ping · trạng thái (bỏ bản đồ / chế độ); **thanh cuộn kiểu game** toàn cục trong [`components/styles.css`](components/styles.css) — game không có sprite thanh cuộn (sprite mũi tên 72px chỉ có glyph ~4px, không dùng được ở 16px) nên vẽ từ màu bevel theme: rãnh lõm, thanh kéo nổi, nút mũi tên vẽ bằng gradient; chỉ Chromium / Electron.
  - Sửa lần 2 (12/11): line dưới tiêu đề "Sảnh" (trước chỉ "Danh sách phòng" có); **dải đáy 48px chung** (`PanelFooter`, cùng nền với dải tiêu đề, line phía trên) cho cả 3 cột → cột Sảnh (trống), danh sách phòng ("Đã chọn: …"), chat (ô nhập) kết thúc cùng một đường; cột Trạng thái căn giữa; line mờ ngăn giữa các phòng.
  - Sửa lần 3 (12/11): line dưới hàng tiêu đề cột; cột đầu **Mã phòng** `#1234` (4 số, mock `code`); Tên phòng = tên → khoá (nếu có) → chip Đang chờ / Đang chơi; cột cuối **Thao tác**: Vào (primary) / Vào xem (đang chơi) / Đầy (khoá); tiêu đề "Danh sách phòng" có ô tìm (tên, mã #, chủ phòng) + nút Tạo phòng căn phải. Tạo phòng / Vào chỉ báo ở dải đáy (dialog + màn Phòng chơi làm sau). Mock: tỉ lệ "Đang chơi / đầy" chia nửa đang chơi, nửa đầy đang chờ.
  - Sửa lần 4 (12/11): bỏ chip trạng thái ở tên phòng; **sắp xếp phòng đang chờ lên đầu, đang chơi xuống cuối, dòng đang chơi mờ 60%** (rê chuột rõ lại); ô tìm và nút Tạo phòng cùng cao 32px (cỡ `md`). **Hộp thoại Tạo phòng** [`CreateRoomDialog.tsx`](demo/app/screens/CreateRoomDialog.tsx): tên phòng (bắt buộc, tối đa 40 ký tự), mật khẩu (trống = phòng mở), thể loại (Select) chọn sẵn theo thẻ đang xem (thẻ "Tất cả" → Random); tạo xong phòng lên đầu danh sách, được chọn sẵn, dải đáy báo "Đã tạo phòng #mã"; phòng tạo mới giữ trong mock (`createRoom`), "Đặt lại" xoá. Bỏ nút **Chơi** ở `LaunchBar` (nút chỉ hiện khi truyền `onPlay`). Đã kiểm tra bằng trình duyệt: thứ tự 12 Vào / 1 Đầy / … / 4 Vào xem cuối, thẻ CUNG R → hộp thoại chọn sẵn "Cung R", gửi trống báo lỗi, tạo có mật khẩu → dòng đầu có khoá + được chọn.
  - Sửa lần 5 (12/11): avatar TopBar lên `md` 32px = nút chuông; avatar chat 32px (`ChatMessage` thêm `avatarSize`); khung phải rộng 300 → 360px; cột Thể loại / Người / Ping căn giữa. **Khán giả:** phòng đang chơi có `spectators` (mock 0–6), giới hạn 4, **QTV +2** (= 6) — hằng `SPECTATOR_LIMIT` / `MODERATOR_EXTRA_SPECTATORS` trong [`lobbyMock.ts`](demo/app/lobbyMock.ts), bảng dữ liệu giả có ô "Là QTV". Dòng đang chơi chỉ mờ các ô dữ liệu; nút **Vào xem** luôn sáng, chỉ mờ + khoá khi đủ khán giả (tooltip "Khán giả 2/4" / "Đã đủ khán giả"). Nền nút Vào xem = texture **cẩm thạch `dlg6_1`** từ kho theme (so 5 texture: sa thạch, cẩm thạch, gạch, đá đen, cát — chọn cẩm thạch vì tông lạnh tách khỏi gỗ của nút Vào). Đã kiểm tra: người thường 4 bật / 6 khoá, QTV 7 bật / 3 khoá trên cùng dữ liệu.
  - Sửa lần 7 (12/11): **LaunchBar 56 → 28px** (chữ / nút nhỏ lại, thanh tiến độ cập nhật đặt nhãn bên cạnh; nút bảng chỉnh và Dữ liệu giả 22px nằm gọn trong thanh). **Lỗi con trỏ biến mất khi gõ**: Windows ẩn con trỏ khi gõ, Chrome có thể không hiện lại con trỏ ảnh CSS khi rê chuột → `ThemeProvider` đổi `data-cursor-nudge` ở lần rê chuột đầu tiên sau khi gõ (cùng ảnh, khác từ khoá dự phòng → trình duyệt đặt lại con trỏ); đã kiểm tra cơ chế đổi thuộc tính, **chưa tái hiện được việc ẩn con trỏ trên trình duyệt tự động — cần người dùng xác nhận**. Avatar chat tổng đo lại = 32px, bằng avatar Đang online.
  - Sửa lần 8 (12/11): **avatar chat vẫn 20px trên trình duyệt người dùng** — nguyên nhân: server `npm run dev` (cổng 5173) của người dùng **không nhận lần sửa `ChatMessage.tsx`** (bộ theo dõi file của Vite bỏ sót, vẫn phục vụ bản cũ), mã nguồn đúng; "chạm" lại file → 5173 đo 32px = Đang online. Tên người gửi trong chat: trắng `state` → màu chữ `text` (#d9d0b0), đậm → nửa đậm.
  - Sửa lần 9 (12/11): nội dung tin nhắn chat = trắng ngà (`white/85`), khác tông be của tên. Nút **tải lại** (chỉ icon `refresh`, tooltip "Tải lại danh sách phòng") sau nút Tạo phòng — giả lập đang tải 0,8 s. **Viền nút dày hơn ô tìm**: nút sm / md dùng `bevel-raised` (kiểu B: 3 vòng + đổ bóng cỡ panel 4px/12px) → `Button` đổi sang `bevel-raised-2` cho sm / md (lg giữ 3px) — **áp dụng mọi nút trong app**. **Hồ sơ người chơi** ([`profile.tsx`](demo/app/profile.tsx), `ProfileProvider` trong `App`): bấm người ở danh sách Đang online, avatar / tên trong Chat tổng và Chat phòng (`ChatMessage` thêm `onAuthorClick`), ghế người chơi / khán giả trong Phòng → Dialog: avatar, tên, trạng thái, ping, hạng; số trận / tỉ lệ thắng / điểm; lịch sử 6 trận (kết quả, thể loại, loại map, thời gian, ±điểm; dữ liệu giả ổn định theo tên); nút "@ Nhắc tên ở chat tổng" (Sảnh) / "… chat phòng" (Phòng) chèn `@tên ` vào ô chat của màn đang mở (`useMentionTarget`, `ChatBox.insert`); "Kết bạn" → "Đã gửi lời mời" (nhớ trong phiên), bạn bè sẵn → "Đã là bạn bè"; hồ sơ của mình chỉ có Đóng. Đã kiểm tra trên server 5173 của người dùng; **lỗi tìm thấy khi kiểm tra và đã sửa:** dữ liệu giả hồ sơ dùng `>>` trên số 32 bit → chỉ số âm → hộp thoại không mở (đổi sang `>>>`).
  - Sửa lần 10 (12/11): **khung nút Tạo phòng + nút đồng bộ = khung ô tìm** (class `![box-shadow:var(--bv-sunken)]` trên 2 nút này; đo: cả 3 cùng giá trị box-shadow, cùng cao 32px) — người dùng muốn nút mảnh lại như ô tìm, không phải ô tìm to ra (lần thử đổi kiểu lõm toàn cục đã hoàn lại). **Nút đồng bộ chạy ngầm**: danh sách giữ nguyên trên màn, icon thành đồng hồ cát, xong thì vài phòng đổi số người + "vừa đồng bộ HH:MM" cạnh số phòng (`mock.sync()`). **Hồ sơ = menu ngữ cảnh trước**: bấm người chơi → menu nhỏ ngay dưới chỗ bấm (Thông tin · Lịch sử đấu · Nhắc tên tại chat tổng/phòng (@) · Kết bạn / Đã gửi lời mời / Đã là bạn bè; hồ sơ của mình chỉ 2 mục đầu); Thông tin / Lịch sử đấu mở Dialog giữa màn hình ở đúng thẻ (Tabs, cao cố định); Nhắc tên / Kết bạn làm ngay. Đóng menu: Esc, bấm ra ngoài, cuộn. Avatar chat thẳng cột avatar Đang online (cùng lề 12px). Đã kiểm tra trên server 5173.
  - Sửa lần 6 (12/11): avatar danh sách Đang online 24 → 32px (`PlayerChip` thêm `avatarSize`); chia chiều cao khung phải Đang online : Chat tổng = 2 : 3 (đo 312 / 467px); avatar chat đo lại = 32px bằng header. **Header (TopBar) và footer (LaunchBar) bỏ viền trái / phải**: class mới `bevel-bar` (chỉ cạnh trên + dưới, có công thức riêng cho cả 3 kiểu viền, sinh từ `build_tokens.py`).
- [ ] **T4. Phòng chơi** (§4): `RoomLobby` — 8 `PlayerSlot`, cài đặt trận (chỉ chủ phòng sửa), `ChatPanel` kênh phòng, Sẵn sàng / Bắt đầu (khoá tới khi đủ sẵn sàng, tooltip lý do), đếm ngược 5 s có Huỷ, `LaunchBar` khởi chạy; bị mời ra → `Dialog info`.
  - **Bản đơn giản đầu tiên (12/11, người dùng yêu cầu, chờ duyệt — chưa đánh dấu xong):** [`RoomScreen.tsx`](demo/app/screens/RoomScreen.tsx), mở từ Sảnh khi **Tạo phòng / Vào / Vào xem** (route `#/room`, không có SideNav, kiểu viền B). Bố cục **theo người dùng, khác wireframe §4**: trái ghế 1–4 dọc · giữa tên phòng (+ thẻ `#mã`, thể loại, khoá, "Đang chơi") và chat phòng · phải ghế 5–8 dọc; dưới là **6 ghế khán giả [QTV] 4 thường [QTV]** (ghế QTV nền cẩm thạch `dlg6_1`, chỉ QTV ngồi được); dưới cùng thanh điều hướng: Rời phòng · trạng thái · Mời bạn · Bắt đầu (chủ phòng, khoá kèm lý do khi < 2 người hoặc còn người chưa sẵn sàng) / Sẵn sàng ↔ Huỷ sẵn sàng (người chơi). **TopBar: trong phòng, mục "Sảnh" thành thẻ "Phòng #mã"** (`NavItem.label` nhận ReactNode); rời phòng mới về lại Sảnh. Thẻ ghế mới, gọn (không dùng `PlayerSlot` ngang 3 ô chọn — không vừa cột dọc). Bấm ghế trống để đổi chỗ (người chơi ↔ khán giả; trận đang chơi thì không vào ghế người chơi được). Phiên phòng giả ở [`roomMock.ts`](demo/app/roomMock.ts); dữ liệu Sảnh chuyển lên `App` (`useLobbyMock`) để phòng vừa tạo còn khi rời phòng; `PanelTitle` / `PanelFooter` / `ChatBox` tách sang [`panel.tsx`](demo/app/screens/panel.tsx) dùng chung. Chưa làm: chọn phe / màu / đội, cài đặt trận, đếm ngược 5 s, khởi chạy game, mời bạn thật, bị mời ra, đổi chủ phòng.
    - Đã kiểm tra bằng trình duyệt: tạo phòng (chủ ghế 1, nút Bắt đầu khoá "Cần ít nhất 2 người chơi"), rời → phòng vẫn trong Sảnh, vào lại phòng của mình → vẫn là chủ (**lỗi tìm thấy và đã sửa:** trước đó mình xuất hiện 2 lần), Vào phòng người khác → ghế trống đầu tiên, Sẵn sàng ↔ Huỷ, đổi ghế, sang ghế khán giả; Vào xem (thường → ghế khán giả thường; QTV → ghế QTV khi 4 ghế thường đã đầy); tải lại ở `#/room` → về Sảnh. **Lỗi thứ hai tìm thấy:** nút "⚙ Chỉnh thông số" đè lên nút Sẵn sàng → bảng chỉnh và "⚙ Dữ liệu giả" chuyển xuống đầu phải LaunchBar (trống từ khi bỏ nút Chơi; biến `--aoe-tuner-bottom`, màn Đăng nhập giữ chỗ cũ).
  - Sửa lần 2 (12/11): **dải cài đặt phòng** trên khung chat — Loại map (Map đồng minh / Map đen / Map sáng), Thể loại (Random / Cung R Shang; phòng Cung R chọn sẵn Cung R Shang), ô tích "Vào game ngay"; chủ phòng sửa (mỗi lần đổi báo trong chat phòng), người khác chỉ xem ("Chỉ chủ phòng đổi được"). **Bảng "⚙ Dữ liệu giả" riêng cho Phòng**: vai của bạn (chủ phòng / người chơi / khán giả), là QTV, số người chơi 1–8, khán giả 0–6, % đã sẵn sàng, số tin chat có sẵn, đang chơi; "Đặt lại" = như lúc vào. Mọi cách vào phòng quy về `RoomMockConfig` (`enterConfig` → `makeRoomSession` trong [`roomMock.ts`](demo/app/roomMock.ts)); `MockPanel.tsx` tách phần khung dùng chung (`MockShell`, `MockSlider`, `MockChoice`, `MockCheck`; Alt+M nằm trong `MockShell`). Đã kiểm tra bằng trình duyệt: chủ phòng đổi Map đen + Vào game ngay → chat báo; 6 người / 3 khán giả / 100% → Bắt đầu bật; đổi vai Người chơi → cài đặt khoá, nút Sẵn sàng; Khán giả + Đang chơi; 6 khán giả không QTV → mình ở ghế thường, QTV → mình ở ghế QTV; Đặt lại.
  - Sửa lần 3 (12/11): **tên phòng ở dải tiêu đề là ô nhập** — hiện tên mặc định của phòng, bấm vào bôi đen toàn bộ; chủ phòng sửa (Enter / rời ô lưu + báo trong chat, Esc huỷ, để trống giữ tên cũ), người khác chỉ đọc (vẫn bôi đen để chép). **Nút mở dropdown (`Select`) có khung chung** `bevel-raised-2` (nhấn → `bevel-sunken-2`) — áp dụng mọi ô chọn. **Hộp thoại: nút X về góc phải + khung chung** (IconButton thường, icon `close`) — áp dụng mọi Dialog. **Lỗi tìm thấy:** nút X vốn đặt `absolute right-2 top-2` nhưng `IconButton` tự có `relative`, trong CSS sinh ra `relative` đứng sau nên thắng → nút rơi về góc trái; sửa bằng khung bọc định vị riêng. Đã kiểm tra trên server 5173: X cách mép phải / trên 10px; tên phòng chọn 0–9 / 9 ký tự sau khi bấm; đổi tên + Enter → chat báo; Esc giữ tên.
  - Sửa lần 4 (12/11, người dùng làm rõ): **tên phòng mặc định thuộc hộp thoại Tạo phòng** — ô Tên phòng điền sẵn "Phòng của <tên>" và bôi đen toàn bộ khi mở / khi bấm (gõ là thay luôn); **trong Phòng không cho sửa tên** (ô sửa tên ở lần 3 đã hoàn lại, tên chỉ hiển thị). Nút mở dropdown thu vào trong khung ô chọn (26px trong ô 32px, cách mỗi cạnh 3px) — không còn cao bằng cả ô. Dropdown trong Phòng dùng cỡ chung `md` 32px như hộp thoại. "Vào game ngay": ô tích 32px **nằm bên phải chữ** (`Checkbox` thêm `labelPosition`), **dấu tích vẽ đè rõ nét** (`strongMark`: sprite `scr2` chỉ có dấu tích bé xíu, phóng to cũng không thấy), người không phải chủ phòng vẫn thấy rõ (không mờ). Thẻ ghế: **avatar 112px** (cỡ mới `2xl`, thẻ cao ~144px), **bỏ số ghế** (giữ trong `aria-label`), nhãn Sẵn sàng / Chủ phòng chuyển xuống dưới tên. Thanh điều hướng: trạng thái bên trái, rồi Mời bạn · Bắt đầu / Sẵn sàng · **Rời phòng ngoài cùng bên phải**. Đã kiểm tra trên server 5173.
  - Sửa lần 5 (12/11): **dải cài đặt không có tương phản** — sprite điều khiển của theme màn hình (`scr2`: ô cam trơn, mũi tên / dấu tích bé xíu) chìm trên nền tối → **thay bằng điều khiển tự vẽ từ token**: nút mở dropdown = khung nổi tối + icon `chevron-down` sáng (áp dụng **mọi `Select`**, cả trong hộp thoại gỗ); ô tích `Checkbox variant="drawn"` = giếng tối + khung lõm + dấu tích màu `tone-focus` (thay `strongMark` của lần 4). Ô tích 22px (32px trước đó to hơn ô chọn 32px). Chụp so sánh: chưa tích / đã tích / người chơi thường (ô chọn khoá mờ 50%, dấu tích vẫn rõ). **Ghi chú:** sprite checkbox / mũi tên của theme vẫn dùng ở chỗ khác (Đăng nhập dùng sprite gỗ — đủ tương phản).
  - Sửa lần 6 (12/11, **kiểu chung cho mọi dropdown**): nút mở dropdown **liền mạch với ô** — nằm trong khung của ô (cách 3px), không có khung riêng, ngăn với phần chữ bằng vạch 1px màu khung (`bevel[0]`); **mặt gỗ sáng** = texture hộp thoại hiện hành (`surface-dialog`) bỏ lớp phủ tối (`--dlg-shade: 0`) nên sáng hơn nền hộp thoại gỗ; mũi tên `chevron` sáng có bóng chữ; rê chuột sáng lên, nhấn tối đi. (Lần 5 đã lỡ bỏ nền gỗ — người dùng nhắc lại.)
  - Sửa lần 7 (12/11, người dùng chỉ định): **mặt chung của điều khiển nhỏ = `assets/ui/button/scr3-checkbox-off-normal.png`** (texture cát sáng, trung bình RGB 221/168/130) cho **cả nút mở dropdown lẫn ô tích** — hằng `CONTROL_FACE` trong [`components/lib/assets.ts`](components/lib/assets.ts) (import `?url`, thư mục `button/` không nằm trong glob của `assetUrl`). Mũi tên / dấu tích chuyển sang **màu đen** (nền sáng) có viền sáng nhẹ. Dropdown vẫn liền khung với ô (vạch ngăn 1px màu khung); ô tích `variant="drawn"` = mặt cát + khung lõm như ô nhập. Đã chụp trên server 5173: hộp thoại gỗ + dải cài đặt trong Phòng (chưa tích / đã tích).
  - Sửa lần 8 (12/11, người dùng chỉ định sprite): **dropdown = `scr3-arrow-down-normal.png`** (nhấn: `-pressed`), **ô tích = `scr3-checkbox-off-normal.png` / `scr3-checkbox-on-normal.png`** (nhấn: `on-pressed`) — `CONTROL_SPRITES` trong [`assets.ts`](components/lib/assets.ts), thay mặt cát + icon tự vẽ của lần 7. Hình trong sprite rất nhỏ (dấu tích 23px / 86, mũi tên 8px / 72) nên **phóng sprite quanh tâm** (`CONTROL_ZOOM`: ô tích 320% → dấu tích ≈ 19px trong ô 22px; mũi tên 350% → ≈ 10px trong nút 26px). Đã chụp phóng to trên server 5173.
  - Sửa lần 9 (12/11): **bộ sprite theo chỗ dùng** — `CONTROL_SETS` (`scr3` cát sáng mặc định, `scr2` cam) + prop `controlSet` cho `Select` và `Checkbox variant="drawn"`. **Trong Phòng dùng `scr2`** (`scr2-arrow-down-normal.png`, `scr2-checkbox-on-normal.png`) với độ phóng vừa phải (mũi tên 240% ≈ 13px trong nút 26px, dấu tích 260%); **ô tích 26px = nút mở dropdown**. Hộp thoại Tạo phòng giữ `scr3`. Đã kiểm tra trên server 5173 (ảnh nạp đúng bộ, không lọt thuộc tính `controlSet` ra DOM).
  - Sửa lần 10 (12/11): ô tích "Vào game ngay" trông viền mảnh hơn dropdown (mũi tên nằm trong khung 3px của ô, ô tích chỉ có khung 2px) → `Checkbox variant="drawn"` dùng **khung 3px của ô nhập** (`bevel-sunken`), mặt sprite nằm trong khung (`background-origin/clip: content-box`), cỡ 32px = ô chọn (mặt 26px = nút mũi tên). **Lỗi: dropdown chọn xong không đóng** — trong Phòng `Select` nằm trong `<label>`; bấm một mục, `Select` đóng danh sách nhưng trình duyệt chuyển cú bấm của `<label>` sang nút mở dropdown → mở lại. Sửa: mục danh sách `preventDefault` khi bấm (đúng ở mọi chỗ) + trong Phòng đổi `<label>` thành khối thường. Đã kiểm tra trên server 5173: chọn ở hộp thoại Tạo phòng, Loại map, Thể loại → danh sách đóng, giá trị đổi.
  - Sửa lần 11 (12–13/11): **bấm vào cả thẻ ghế → menu ngữ cảnh** (thẻ có người: Thông tin / Lịch sử đấu / Nhắc tên / Kết bạn + chủ phòng có **"Kích khỏi phòng"**; ghế trống: "Ngồi vào đây" nếu được + chủ phòng **"Đóng ghế" / "Mở ghế"** — trừ ghế chủ phòng và ghế QTV). `ProfileProvider` thêm `open(player, anchor, extra)` + `openMenu(anchor, label, items)`. **Kéo thả (chủ phòng)** giữa 8 ghế người chơi và 4 ghế khán giả thường: thả vào ghế trống = chuyển, vào ghế có người = đổi chỗ (giữ sẵn sàng / đế chế khi vẫn là người chơi), không thả vào ghế chủ phòng / ghế QTV / ghế đã đóng, trận đang chơi thì không chuyển giữa người chơi ↔ khán giả; viền nét đứt = chỗ thả được, viền đậm = đang trỏ; mỗi thao tác báo trong chat. **Đế chế** ở góc phải dưới mỗi thẻ: 16 nước AoE + RoR + Ngẫu nhiên ([`civs.ts`](demo/app/civs.ts), icon nhà theo kiến trúc), chủ phòng chọn bằng dropdown, người khác thấy nhãn; **đổi thể loại đặt lại đế chế mọi người** (Random → Ngẫu nhiên, Cung R Shang → Shang). Chip Sẵn sàng / Chưa sẵn sàng / Chủ phòng ở **góc phải trên** thẻ. Ô tích "Vào game ngay" **mặc định đã tích**, và **mờ như dropdown khi không phải chủ phòng** (trước giữ sáng → lệch màu). `Select`: danh sách **tự mở lên trên** khi dưới không đủ chỗ, nền đen đặc. **Lỗi tìm thấy khi kiểm tra và đã sửa:** danh sách đế chế bị thẻ bên dưới đè (thẻ sau vẽ đè + `brightness` khi rê tạo lớp xếp chồng) → thẻ có dropdown mở nâng `focus-within:z-20`. Đã kiểm tra trên server 5173 (kích, đóng ghế, chuyển / đổi chỗ / sang khán giả, thả vào ghế đóng & QTV bị chặn, đế chế, đổi thể loại, vai người chơi thường).
  - Sửa lần 12 (13/11): đế chế "Ngẫu nhiên" → **"Random"** (người chơi Việt quen dùng). **Ghế trống một chạm**: chủ phòng bấm = đóng / mở ngay, người khác bấm = ngồi ngay (không qua menu). **Bắt đầu → đếm ngược 5 giây giữa màn hình** (số 180px, mỗi số phóng từ to về theo nhịp bậc, tắt khi giảm chuyển động; nút Huỷ) → hết giờ: phòng "Đang chơi", chat "Trận đấu bắt đầu!", `LaunchBar` khởi chạy → Đang chơi · tên phòng (`RoomScreen.onLaunch`). **Đổi nghĩa "Vào game ngay"**: hết đếm ngược thì game tự khởi chạy cho mọi người (trước là "bỏ qua đếm ngược" — mặc định tích nên sẽ không bao giờ thấy đếm ngược). **Rời phòng có bước xác nhận** (Dialog: Ở lại / Rời phòng; chủ phòng được nhắc quyền chủ phòng sẽ chuyển). Đã kiểm tra trên server 5173 (đóng / mở / ngồi một chạm, 5 → 4 sau 1 s, Huỷ, chạy hết, xác nhận Ở lại / Rời phòng).
- [ ] **T5. Giải đấu** (§5, **thay Xếp trận — 13/11, người dùng**): bỏ màn Xếp trận (`MatchmakingQueue`); thêm màn Giải đấu theo pha Nháp → Đăng ký → Ngày xếp đội → Thi đấu → Kết thúc. QTV thiết lập giải (thông tin, thể thức, **ngày xếp đội**, **luật**); trước ngày xếp đội: tổng quan + đếm ngược + đăng ký + luật; sau ngày xếp đội: **sơ đồ đấu** + **lịch sử đấu** (+ Đội, Luật). Ý tưởng thiết kế: [`docs/wireframes.md`](docs/wireframes.md) §5 — **chưa dựng**.
  - **Đã chốt (13/11, người dùng):** (1) đăng ký lẻ bằng **card đội có sẵn, mỗi hàng 4 card, mỗi đội 8 người xếp dọc**; người chơi tự bấm vào đội, **người vào đầu là đội trưởng và đặt tên đội**, được rời / đổi đội tới ngày xếp đội (đội trưởng rời → quyền chuyển cho người vào kế tiếp). Ngày xếp đội = **chốt đội** + bốc thăm nhánh (đội thiếu người tối thiểu bị loại, thiếu lũy thừa 2 → miễn vòng 1). (2) Thể thức **loại trực tiếp**. (3) Kết quả trận **QTV nhập tay**.
  - **Brief giao agent khác (Gemini) dựng (13/11, người dùng yêu cầu):** [`docs/t5-tournament-brief.md`](docs/t5-tournament-brief.md) — tài liệu cần đọc, file cần tạo / sửa, đặc tả từng pha, dữ liệu giả, tiêu chí hoàn thành. Còn mở: đội 8 người nhưng một trận AoE tối đa 8 người (4v4) → mỗi trận ra sân mấy người / chọn đội hình thế nào; bản đầu chỉ ghi đội thắng từng ván.
  - Đã làm (13/11): route `#/matchmaking` → `#/tournament` "Giải đấu" (icon cúp; Hồ sơ đổi sang icon người) trong [`routes.ts`](demo/app/routes.ts), màn hiện chỗ chờ "làm ở việc T5"; nhãn trong story TopBar / SideNav đổi theo.
  - Bản đầu tiên (13/11, chờ duyệt — chưa đánh dấu xong, đủ §1–§3.7, mỗi đội tối đa 4 thành viên):
    - Đã tạo / sửa: [`demo/app/tournamentMock.ts`](demo/app/tournamentMock.ts), [`demo/app/screens/TeamCard.tsx`](demo/app/screens/TeamCard.tsx), [`demo/app/screens/TournamentSetupDialog.tsx`](demo/app/screens/TournamentSetupDialog.tsx), [`demo/app/screens/Bracket.tsx`](demo/app/screens/Bracket.tsx), [`demo/app/screens/MatchResultDialog.tsx`](demo/app/screens/MatchResultDialog.tsx), [`demo/app/screens/TournamentScreen.tsx`](demo/app/screens/TournamentScreen.tsx), [`demo/app/App.tsx`](demo/app/App.tsx), [`docs/t5-tournament-brief.md`](docs/t5-tournament-brief.md) (sửa giới hạn đội thành tối đa 4 thành viên).
    - Đã làm:
      - §3.1–3.4: vòng đời pha + `PhaseStepper`, bố cục 3 cột, lưới 4 cột `TeamCard` (4 ô/đội, vào/chuyển/rời đội có xác nhận, đội trưởng `crown` + đổi tên tại chỗ, menu QTV mời ra / đặt đội trưởng), hộp thoại QTV tạo / sửa giải (`TournamentSetupDialog`).
      - §3.5–3.7: ngày xếp đội (`Chốt đội & lập sơ đồ`, loại đội thiếu người, bốc thăm nhánh loại trực tiếp có miễn vòng 1, QTV `Bốc lại` / `Công bố sơ đồ`, người chơi thấy `Spinner`), `Bracket` (cột theo vòng, đường nối, viền vàng trận của mình, rê chuột sáng đường đi của đội), `MatchResultDialog` (QTV nhập kết quả từng ván BoN hoặc Xử thắng, tự lên vòng sau, sửa lại khi vòng sau chưa có kết quả; người chơi xem & có nút "Vào xem" khi đang đấu), tab **Lịch sử đấu** (lọc theo vòng & "Chỉ trận của tôi", `EmptyState`), tab **Đội** chỉ đọc kèm nhãn bị loại, banner Vô địch / Á quân khi Kết thúc, và bảng **⚙ Dữ liệu giả** sinh nhánh tự động theo pha.
    - Chưa nối / chờ việc khác: nút "Vào xem" khi trận đang đấu hiện `Toast` thông báo (chờ nối sang Phòng chơi ở T10).
  - ~~T5 cũ: Xếp trận (§5): `MatchmakingQueue` — chọn chế độ / phe / khu vực, đang tìm, tìm thấy (Dialog 15 s), thẻ `floating`.~~ Bỏ 13/11.
- [ ] **T6. Bạn bè & tin nhắn** (§6): `FriendsPanel` mở rộng (tab Tất cả / Online / Lời mời, nhóm theo trạng thái, menu hành động) + `ChatPanel` nhắn riêng (đang gõ, "Tin mới ↓", gửi lỗi / thử lại).
- [ ] **T7. Hồ sơ** (§7): `ProfileHeader` (avatar xl, rank, phe yêu thích, cờ màu người chơi), hàng `StatBlock`, `MatchHistoryTable` (lọc chế độ, tải thêm); hồ sơ của mình vs người khác.
  - Bản đầu tiên (13/11, chờ duyệt — chưa đánh dấu xong, phạm vi §1–§4):
    - Đã tạo / sửa: [`demo/app/profileMock.ts`](demo/app/profileMock.ts), [`demo/app/screens/ProfileScreen.tsx`](demo/app/screens/ProfileScreen.tsx), [`demo/app/screens/profile/ProfileHeader.tsx`](demo/app/screens/profile/ProfileHeader.tsx), [`demo/app/screens/profile/EditProfileDialog.tsx`](demo/app/screens/profile/EditProfileDialog.tsx), [`demo/app/screens/profile/OverviewTab.tsx`](demo/app/screens/profile/OverviewTab.tsx), [`demo/app/screens/profile/HistoryTab.tsx`](demo/app/screens/profile/HistoryTab.tsx), [`demo/app/screens/profile/AchievementsTab.tsx`](demo/app/screens/profile/AchievementsTab.tsx), [`demo/app/screens/profile/InventoryTab.tsx`](demo/app/screens/profile/InventoryTab.tsx), [`demo/app/screens/profile/FriendList.tsx`](demo/app/screens/profile/FriendList.tsx), [`demo/app/routes.ts`](demo/app/routes.ts), [`demo/app/profile.tsx`](demo/app/profile.tsx), [`demo/app/App.tsx`](demo/app/App.tsx).
    - Đã làm: đủ 5 tab (`Tổng quan`, `Lịch sử đấu`, `Thành tựu`, `Kho đồ`, `Bạn bè`), `ProfileHeader` + `EditProfileDialog`, bảng Dữ liệu giả (`MockShell` với người mẫu, số trận 0 = người mới, tỉ lệ thắng, % thành tựu, % kho đồ, clan, bạn bè/lời mời, trạng thái đang tải/lỗi, Đặt lại). Giả định: `TournamentScreen` chưa nhận id giải qua hash nên bấm giải đấu trong `HistoryTab` chuyển sang `#/tournament`; `FriendList` viết thành component riêng sẵn sàng cho T6.
    - Chưa làm: kiểm thử trình duyệt §6 (chờ người dùng duyệt).
  - **Thiết kế lại (13/11, đã chốt với người dùng):** trang có tab **Tổng quan · Lịch sử đấu (Trận đấu / Giải đấu) · Thành tựu · Kho đồ · Bạn bè**, không SideNav; `#/profile` = mình, `#/profile/<id>` = người khác; hộp thoại hồ sơ nhanh thêm "Xem hồ sơ đầy đủ". Đã chốt: (1) **Kho đồ chỉ đồ trang trí, không tiền / cửa hàng** — nhận qua thành tựu, giải đấu, mùa giải, sự kiện; độ hiếm = texture theme (Gỗ / Sa thạch / Cẩm thạch / Đá đen). (2) Người khác xem Tổng quan, Lịch sử đấu, Thành tựu (+ Bạn bè); **Kho đồ chỉ mình**. (3) **Clan và lịch sử hạng theo mùa ghi nhỏ ở tab Tổng quan**; **thêm tab Bạn bè**. (4) Giao **Gemini** dựng. Thiết kế: [`docs/wireframes.md`](docs/wireframes.md) §7; brief: [`docs/t7-profile-brief.md`](docs/t7-profile-brief.md). (5) **Tab Bạn bè hiện cả ở hồ sơ người khác** (bạn chung lên đầu) — chốt 13/11. (6) **Không có chế độ riêng tư** — chốt 13/11.
- [x] **T8. Cài đặt** (§8): `SettingsForm` — tab dọc Tài khoản / Giao diện (theme phụ, con trỏ game, cỡ chữ) / Âm thanh (`Slider`) / Đồ hoạ / Mạng / Phím tắt; lưu tự động vs nút Lưu + `Toast`; cảnh báo rời trang chưa lưu.
  - **Brief cho Gemini (13/11):** [`docs/t8-settings-brief.md`](docs/t8-settings-brief.md). Tính năng lấy từ trang Cài đặt của launcher SuperAqE hiện tại (chỉ tính năng, không lấy giao diện): cấu hình game (độ phân giải, chế độ hiển thị, giữ tỉ lệ, VSync, đường dẫn EMPIRESX.EXE), mạng (máy chủ relay, Kiểm tra mạng, trạm trung chuyển TURN + điều kiện), voice chat (âm lượng, độ nhạy mic + thanh mức, Thử mic), phím Nhấn để nói + kiểm tra xung đột phím game. Tab: Giao diện · Game · Mạng · Voice chat · Phím tắt. **Đã chốt (13/11, người dùng):** trang mở từ **menu tài khoản** trên TopBar (bỏ khỏi SideNav); **bỏ tab Tài khoản** vì Hồ sơ đã có (phiên bản launcher chuyển sang tab Game). **Tab Game áp dụng ngay** (core game của dự án) — không cần mở lại hub / game; riêng đường dẫn game khoá khi game đang chạy. **Tab Giao diện khoá toàn bộ** (hiện chỉ có 1 theme mặc định): mọi mục hiện mờ kèm lý do, không đổi được; mở trang vào tab Game. **Đã chốt (13/11, người dùng — theo đề xuất):** (1) lưu tự động, bỏ nút Lưu và cảnh báo rời trang; (2) "Đồ hoạ" → "Game", "Âm thanh" → "Voice chat".
  - Hoàn thành (13/11, phạm vi §1–§6):
    - Đã tạo / sửa: [`demo/app/settingsMock.ts`](demo/app/settingsMock.ts), [`demo/app/screens/SettingsScreen.tsx`](demo/app/screens/SettingsScreen.tsx), [`demo/app/screens/settings/SettingRow.tsx`](demo/app/screens/settings/SettingRow.tsx), [`demo/app/screens/settings/AppearanceTab.tsx`](demo/app/screens/settings/AppearanceTab.tsx), [`demo/app/screens/settings/GameTab.tsx`](demo/app/screens/settings/GameTab.tsx), [`demo/app/screens/settings/NetworkTab.tsx`](demo/app/screens/settings/NetworkTab.tsx), [`demo/app/screens/settings/VoiceTab.tsx`](demo/app/screens/settings/VoiceTab.tsx), [`demo/app/screens/settings/MicLevelMeter.tsx`](demo/app/screens/settings/MicLevelMeter.tsx), [`demo/app/screens/settings/HotkeysTab.tsx`](demo/app/screens/settings/HotkeysTab.tsx), [`demo/app/screens/settings/KeyCaptureInput.tsx`](demo/app/screens/settings/KeyCaptureInput.tsx), [`demo/app/routes.ts`](demo/app/routes.ts), [`demo/app/App.tsx`](demo/app/App.tsx).
    - Đã làm (§1–§4): mở từ menu tài khoản (`#/settings?tab=...`, mặc định `game`), bỏ khỏi `SideNav` và ẩn `SideNav`; 5 tab dọc (`Giao diện`, `Game`, `Mạng`, `Voice chat`, `Phím tắt`) có chấm đỏ khi lỗi; tab Giao diện khoá/mờ toàn bộ kèm `Tooltip`; tab Game (độ phân giải, chế độ hiển thị, tỉ lệ, VSync, đường dẫn `EMPIRESX.EXE` + `Dialog` chọn giả lập, áp dụng ngay khi game đang chạy); tab Mạng (relay URL, kiểm tra mạng giả lập 2 giây 4 kịch bản, TURN + 4 điều kiện); tab Voice chat (thiết bị giả, `EmptyState` khi thiếu/chặn mic, âm lượng, chế độ mic, độ nhạy + `MicLevelMeter`, thử mic 5 giây + phát lại); tab Phím tắt (`KeyCaptureInput`, kiểm tra xung đột phím game/hub, phím cố định); lưu tự động `aoe-hub.settings.v1` + `SettingsProvider` nối `LaunchBar`; nút Khôi phục mặc định theo từng tab; bảng `Dữ liệu giả — Cài đặt` (`MockShell`).
    - Giả định (chờ người dùng chốt): khi `EMPIRESX.EXE` không hợp lệ, `LaunchBar` chuyển sang trạng thái `error` sẵn có (`"Không tìm thấy EMPIRESX.EXE — kiểm tra trong Cài đặt"`) và nút sửa chuyển về `#/settings`; ở tab Giao diện dùng `Tabs variant="segmented"` cho cỡ chữ và `Select` cho chế độ hiển thị ở tab Game; huy hiệu kết luận kiểm tra mạng dùng nhãn nền `bg-success`/`bg-warning`/`bg-danger` cùng kiểu với `Badge` do `Badge` hiện chưa có variant `success`/`warning`/`danger`.
    - Chưa làm: nối chọn tệp Electron thật và voice chat thật (ngoài phạm vi §5); đánh dấu `[x]` sau khi người dùng duyệt.
    - Kiểm thử trình duyệt §6 (13/11, 1600×900): Đạt — không lỗi console app; SideNav ẩn ở `#/settings` và không còn mục Cài đặt; TopBar có mục Cài đặt; mặc định mở tab `Game`, `?tab=` giữ đúng khi tải lại; tab Giao diện khoá/mờ toàn bộ + `Tooltip`, không có nút Khôi phục; tab Game khoá đường dẫn và báo "Đã áp dụng cho game đang chạy" khi game chạy; tab Mạng báo lỗi URL + chấm đỏ, chạy Kiểm tra mạng 2s + đủ 4 điều kiện TURN; tab Voice chat khoá độ nhạy khi Nhấn để nói, `MicLevelMeter` dao động khi Thử mic; tab Phím tắt bắt xung đột `F3` + chấm đỏ; Khôi phục mặc định có `Dialog` xác nhận; bàn phím `ArrowDown`/`Tab` hoạt động. Lưu ý nhỏ: khi mở bảng `⚙ Dữ liệu giả` ở góc dưới phải có thể che nút "Khôi phục mặc định".
- [ ] **T9. Kết quả trận** (§9, phụ): `Dialog lg` thắng / thua, `StatBlock`, bảng người chơi, điểm ±, "Về phòng" / "Về sảnh".
- [ ] **T11. Clan** (thêm 13/11, người dùng yêu cầu — **đã chốt thiết kế, đang dựng**): trang clan — chưa có clan: tìm / xin vào / tạo clan; có clan: đầu trang clan + tab Tổng quan (thông báo, hoạt động, chat clan) · Thành viên · Đơn xin vào · Thành tích · Quản lý. Dùng lại dữ liệu clan của Hồ sơ (`profileMock.ts`: thẻ, tên, vai Trưởng clan / Phó / Thành viên); thẻ clan ở Hồ sơ bấm được → trang clan.
  - Bản cập nhật (13/11, chờ duyệt — chưa đánh dấu xong, phạm vi §1–§4):
    - Đã tạo / sửa: [`demo/app/clanMock.ts`](demo/app/clanMock.ts), [`demo/app/screens/ClanScreen.tsx`](demo/app/screens/ClanScreen.tsx), [`demo/app/screens/clan/ClanEmblemBadge.tsx`](demo/app/screens/clan/ClanEmblemBadge.tsx), [`demo/app/screens/clan/ClanFinder.tsx`](demo/app/screens/clan/ClanFinder.tsx), [`demo/app/screens/clan/CreateClanDialog.tsx`](demo/app/screens/clan/CreateClanDialog.tsx), [`demo/app/screens/clan/ClanHeader.tsx`](demo/app/screens/clan/ClanHeader.tsx), [`demo/app/screens/clan/ClanOverviewTab.tsx`](demo/app/screens/clan/ClanOverviewTab.tsx), [`demo/app/screens/clan/ClanMembersTab.tsx`](demo/app/screens/clan/ClanMembersTab.tsx), [`demo/app/screens/clan/ClanRequestsTab.tsx`](demo/app/screens/clan/ClanRequestsTab.tsx), [`demo/app/screens/clan/ClanAchievementsTab.tsx`](demo/app/screens/clan/ClanAchievementsTab.tsx), [`demo/app/screens/clan/ClanManageTab.tsx`](demo/app/screens/clan/ClanManageTab.tsx), [`demo/app/screens/clan/InviteDialog.tsx`](demo/app/screens/clan/InviteDialog.tsx), [`demo/app/routes.ts`](demo/app/routes.ts), [`demo/app/App.tsx`](demo/app/App.tsx), [`demo/app/profileMock.ts`](demo/app/profileMock.ts), [`demo/app/screens/profile/ProfileHeader.tsx`](demo/app/screens/profile/ProfileHeader.tsx), [`demo/app/screens/profile/OverviewTab.tsx`](demo/app/screens/profile/OverviewTab.tsx), [`demo/app/screens/LobbyScreen.tsx`](demo/app/screens/LobbyScreen.tsx).
    - Đã làm (§1–§4): `clan` route & nav, `ClanFinder`, `CreateClanDialog`, `ClanHeader`, 5 tab (`Tổng quan`, `Thành viên`, `Đơn xin vào`, `Thành tích`, `Quản lý`), `InviteDialog`, liên kết từ Hồ sơ (`ProfileHeader` `[TAG]` & `OverviewTab` thẻ clan → `#/clan/<TAG>`), bộ lọc `Phòng của clan tôi` trong `LobbyScreen` (`CLAN ROOMS`), và bảng `⚙ Dữ liệu giả — Clan` (`MockShell`: vai của bạn, số thành viên `1–50`, số Phó `0–3`, đơn đang chờ `0–20`, lời mời nhận `0–3`, cách nhận người, số thông báo `0–6`, trạng thái tải trang `Bình thường / Đang tải / Lỗi tải + Thử lại`, và nút `Đặt lại`).
    - Chưa làm: kiểm thử QA trên trình duyệt (§6) và đánh dấu hoàn thành sau khi người dùng duyệt.
  - **Đã chốt (13/11, người dùng — theo đề xuất):** (1) mục **"Clan"** trên TopBar giữa Giải đấu và Hồ sơ + SideNav (Alt+4, các phím sau lùi một); (2) 3 vai Trưởng clan / Phó / Thành viên, **tối đa 50 thành viên, 3 Phó**; (3) **chưa làm đấu giữa các clan** — thành tích lấy từ giải đấu; (4) giao **Gemini** dựng như T5 / T7. Thiết kế: [`docs/wireframes.md`](docs/wireframes.md) §11; brief: [`docs/t11-clan-brief.md`](docs/t11-clan-brief.md).
- [ ] **T10. Nối luồng chính:** đăng nhập → trang chủ → sảnh → phòng → sẵn sàng → (giả lập chơi) → kết quả, + nhánh giải đấu (đăng ký → xếp đội → vào phòng đấu → kết quả cập nhật sơ đồ) và nhánh lỗi (mất kết nối) theo wireframes §Luồng chính. Làm sau T1–T9.

### Asset tự làm (không bản quyền game)

Mục đích: có bộ ảnh phát hành được, thay dần asset tách từ game (xem "Quyết định còn mở" → bản quyền).

- [x] [`tools/gen_hub_art.py`](tools/gen_hub_art.py) (11/11): vẽ bằng code từ seed cố định, không đọc `raw/` hay `assets/ui/` → [`assets/hub/`](assets/hub/) (được commit). Chạy lại ra cùng file.
  - `dialog/wood.png` 96×144 — gỗ vân dọc lát liền, 8 tông nâu + đốm ô liu kiểu 8-bit (chất liệu giống `dlg6_3`).
  - `bg/temple-dusk.webp` (+ `-1920`) — hàng cột phối cảnh lúc hoàng hôn, đền nhỏ trên đồi (không khí `scr1`, không logo).
  - `bg/village-dusk.webp` (+ `-1920`) — làng lều tranh vòm, lửa trại, rừng thông, cỏ khung hai bên (không khí `scr2`).
  - Bố cục và hình vẽ mới hoàn toàn, chỉ lấy tông màu / không khí, không đồ lại ảnh gốc.
- [x] Theme trên ảnh tự làm trong `build_tokens.py` (`HUB_THEMES`): `hub-wood` (hộp thoại, màu / bevel / shade lấy từ `dlg6_3`), `hub-temple` (màn hình, từ `scr1`), `hub-village` (từ `scr2`). Tương phản đo lại trên ảnh mới: 9.34 / 8.21 / 11.48 — đều đạt AA.
- [x] Trang thử [`demo/textures/index.html`](demo/textures/index.html) thêm "Gỗ tự làm" và chọn nền (scr2 game / Đền / Làng). Đã chụp kiểm tra.
- [x] **Ảnh nền của người dùng thay scr1 / scr2** (12/11): `vendor/hub-art/temple-sunset.png`, `village-sunset.png` (chép từ 2 file người dùng đưa, 1672×941) → [`tools/import_hub_art.py`](tools/import_hub_art.py) → `assets/hub/bg/*-sunset.webp` (không phóng to; ảnh < 1920 nên **bị phóng trên màn ≥ 1920**, cần bản lớn hơn nếu có). Theme `hub-temple` / `hub-village` trỏ sang ảnh này (tương phản 8.6 / 10.64). Ảnh vẽ bằng code (`*-dusk.webp`) giữ lại nhưng không theme nào dùng.
  - Demo áp dụng: [`login.html`](demo/screens/login.html) → `hub-temple`; [`demo/textures`](demo/textures/index.html) → nền chọn theo theme (mặc định `hub-village`); gallery mặc định `hub-village`.
- [x] **Bảng chỉnh "điểm ngọt"** [`demo/shared/tuner.js`](demo/shared/tuner.js) trên cả 3 trang demo (nút "⚙ Chỉnh thông số", Alt+T, `?tuner=open`): độ sáng, tương phản, bão hoà, làm mờ, phủ tối đều, tối viền, khung ngang / dọc của nền + phủ tối texture hộp thoại. Lưu theo từng theme màn hình, "Chép giá trị" ra JSON. Đã chụp kiểm tra với giá trị nạp sẵn.
  - CSS: `.surface-screen-bg` chuyển ảnh nền sang lớp `::before` cố định (bộ lọc không ảnh hưởng nội dung) + `::after` phủ tối / tối viền; biến `--aoe-bg-*` mặc định = ảnh giữ nguyên. Hộp thoại đọc `--dlg-shade-tune` nếu có.
  - Ghi điểm ngọt: dán JSON vào phần `treatment` của theme trong `HUB_THEMES` (`build_tokens.py`) → sinh vào khối `[data-theme]`; bảng chỉnh đọc lại làm điểm xuất phát.
  - **Logo trên nền đền (12/11):** logo "SuperAge of Antiquity" của người dùng (`vendor/hub-art/superage-logo.png`, 2172×724 trên nền đen) được `import_hub_art.py` tách nền đen theo độ sáng (lòng chữ cũng trong suốt) + quầng tối mềm phía sau, đặt giữa trên cùng rộng 42% như logo scr1 → `bg/temple-sunset-logo.webp`; `hub-temple` dùng bản này (tương phản 8.72), bản không logo vẫn giữ. Đã chụp kiểm tra màn Đăng nhập ở 1366×768 và 1280×1024: logo không bị hộp thoại che.
    - Sửa tách nền (12/11): chỉ xoá vùng đen thông ra mép + lỗ đen lớn trong lòng chữ (≥ 400 px); thân logo giữ đặc, có lớp đen lót theo hình logo đã lấp khe → tấm đá "OF ANTIQUITY" không còn để trời xuyên qua (nguyên nhân logo "lẫn vào nền").
    - **Viền trắng 2px** (người dùng chọn sau khi so 0 / 2 / 3 / 5 px, ảnh so: [`demo/compare/logo-stroke.png`](demo/compare/logo-stroke.png)); tham số trong `TITLE_LOGOS`. Tương phản `hub-temple` sau đổi: 8.6.
  - **Điểm ngọt đã chốt (12/11, người dùng chọn):** `hub-temple` sáng 105%, bão hoà 90%, phủ tối 11%, tối viền 36%, khung dọc 46%; `hub-village` bão hoà 95%, phủ tối 34%. Phủ tối texture gỗ 31% = đúng mặc định `hub-wood`, không cần ghi. Đã chụp kiểm tra với trình duyệt sạch: giá trị lấy từ token.
- [ ] Sprite control (checkbox, nút đóng, mũi tên), con trỏ, icon, cờ vẫn là asset game — `hub-wood` đang mượn sprite của theme gốc. Cần vẽ bộ riêng nếu phát hành.

## Bước 4B — Contract kết nối backend

Thêm 14/11 (người dùng yêu cầu lên plan). **Mục tiêu:** chốt một hợp đồng dữ liệu (contract) giữa hub và máy chủ để (1) đội backend làm song song theo cùng một bản mô tả, (2) màn hình chỉ gọi qua một interface `HubClient` — hôm nay chạy bằng mock, mai thay bằng server thật mà không sửa màn. Nguồn dữ liệu để viết contract: 7 file mock trong [`demo/app/`](demo/app/) (`homeMock`, `lobbyMock`, `roomMock`, `tournamentMock`, `clanMock`, `profileMock`, `settingsMock`) + [`components/lib/types.ts`](components/lib/types.ts) + các brief trong [`docs/`](docs/).

**Nguyên tắc (đề xuất, chờ chốt ở C0):**

- **Contract-first, một nguồn sự thật:** thư mục `contract/` (TypeScript) chứa DTO, lệnh, sự kiện realtime, mã lỗi. Mọi thứ khác (tài liệu cho backend, JSON Schema / OpenAPI nếu cần) sinh từ đây — không viết tay hai nơi.
- **DTO ≠ view model:** DTO chỉ chứa dữ liệu server biết. Trường thuần UI (`sending`, `failed`, `kind: "own"`, `mentionsMe`, nhãn tiếng Việt…) do mapper phía client tính. `components/` không import `contract/` — chỉ lớp dữ liệu của app mới import.
- **Server trả mã, không trả câu chữ:** lỗi / trạng thái là `code` (ví dụ `ROOM_FULL`, `RANK_TOO_LOW`); câu tiếng Việt nằm ở client.
- **Hai đường truyền:** HTTP JSON cho truy vấn và lệnh (đăng nhập, danh sách phòng, hồ sơ, tạo giải…); WebSocket cho realtime (online / bạn bè, chat, trạng thái phòng, đếm ngược, giải đấu đang đá). Mỗi lệnh thay đổi trạng thái có `requestId` (chống gửi trùng khi mạng chập chờn).
- **Phân ranh với Electron (bước 5):** việc trên máy (đường dẫn game, mở game, cài đặt đồ hoạ / âm thanh trong `localStorage`) là contract riêng `DesktopBridge` qua preload — không đi qua backend.

**Việc:**

- [ ] **C0. Chốt quyết định** (xem "Quyết định còn mở"): backend viết bằng gì, công cụ mô tả schema, cơ chế đăng nhập, cách đánh phiên bản. Chưa chốt C0 thì chỉ làm C1–C2.
- [x] **C1. Kiểm kê dữ liệu theo màn:** đọc mock + brief T1–T11, lập bảng *màn → dữ liệu cần đọc → hành động gửi đi → sự kiện realtime cần nghe* → `docs/contract/inventory.md`. Đánh dấu trường nào là UI-only, trường nào server phải trả, trường nào còn mơ hồ (ví dụ `Room.speed` / `startAge` hiện là chuỗi hiển thị; `Player.rank` là chuỗi gộp bậc + số → tách `tier` + `points`).
  - Xong (14/11): [`docs/contract/inventory.md`](docs/contract/inventory.md) — bảng Đọc / Gửi / Nghe cho T1–T11, thực thể dùng chung, trường thuần UI, 7 điểm mơ hồ. Phát hiện: `Room.speed` / `startAge` / `map` dạng chữ chỉ có ở mock Sảnh (phòng thật dùng `mapType` + `gameType`); wireframe §4 có Màu / Đội / AI nhưng T4 đã dựng không có; `rank` gộp bậc + số; nhiều enum là chữ tiếng Việt (`ClanRole`, `RankTier`, `ChangelogTag`, lý do xử thắng) → contract đổi sang mã tiếng Anh; `MatchResultDialog.tsx` là hộp kết quả trận **giải**, T9 chưa dựng.
- [x] **C2. Quy ước chung** → `docs/contract/conventions.md`: id dạng chuỗi mờ; thời gian ISO 8601 UTC; phân trang theo `cursor`; khung lỗi `{ code, message?, details? }` + bảng mã lỗi; tiền tố phiên bản `/v1`; khung tin WebSocket `{ type, seq, requestId?, payload }`; quy tắc mở rộng (thêm trường tuỳ chọn không phá client cũ, enum có giá trị `unknown`).
  - Xong (14/11): [`docs/contract/conventions.md`](docs/contract/conventions.md). **Đổi so với plan:** HTTP dùng kiểu RPC `POST /v1/call/<tên>` cho cả truy vấn lẫn lệnh (payload truy vấn có object lồng nhau, ánh xạ 1-1 sang WebSocket); chỉ `GET /v1/health`. Bảng giới hạn ô nhập lấy đúng từ code (tên phòng 40, tên giải 60 — brief T5 ghi 40, chờ chốt) → [`contract/limits.ts`](contract/limits.ts).
- [x] **C3. DTO theo module** trong `contract/` — mỗi module một file: `auth` (đăng nhập / đăng ký / phiên), `player` (hồ sơ, rank, thống kê, lịch sử trận, thành tích, kho đồ), `social` (bạn bè, lời mời, chặn, presence), `chat` (kênh sảnh / phòng / thì thầm / clan / giải đấu), `lobby` (danh sách phòng, lọc, mã phòng, mật khẩu), `room` (ghế, khán giả, ghế QTV, cài đặt trận, sẵn sàng, đếm ngược, bắt đầu), `match` (kết quả trận, điểm ±), `tournament` (giải, đội, nhánh đấu, kết quả, chat), `clan` (clan, thành viên, vai trò, đơn xin vào, lời mời, thông báo), `home` (hero slide, changelog, sự kiện). Thuộc tính dùng lại kiểu sẵn có khi trùng nghĩa (`Faction`, `MapType`, `GameType`…) và chuyển các kiểu đó sang `contract/` để mock và component cùng import.
  - Xong nháp v0 (14/11): [`contract/`](contract/) 16 file TypeScript thuần (không import `components/`), `CONTRACT_VERSION = 0.1.0`, `tsconfig` thêm `contract`. Enum game **không chuyển** khỏi UI như plan định — contract giữ bản sao độc lập, [`demo/app/api/compat.ts`](demo/app/api/compat.ts) bắt lệch 15 enum khi typecheck (đã khớp hết). Sẽ còn sửa khi các màn T2–T7, T9–T11 đổi dữ liệu.
- [x] **C4. Danh mục realtime:** mỗi module liệt kê lệnh client → server và sự kiện server → client (ví dụ `room.seat.changed`, `room.countdown.started`, `chat.message`, `presence.changed`, `tournament.match.updated`). Quy tắc nối lại: client gửi `seq` cuối đã nhận → server gửi bù hoặc trả snapshot đầy đủ; ai là nguồn sự thật cho đếm ngược 5 giây và cho "Vào game ngay".
  - Xong nháp v0 (14/11): sự kiện + chủ đề trong từng module, gộp ở [`contract/api.ts`](contract/api.ts) (`Events`, `Topic`), khung tin ở [`contract/transport.ts`](contract/transport.ts); nối lại theo `seq` mỗi chủ đề + snapshot ([conventions §6](docs/contract/conventions.md)). Đếm ngược và "Vào game ngay": server giữ `endsAt`.
- [x] **C5. Quyền & luật nghiệp vụ phía server:** chuyển các hàm đang chạy ở client trong mock thành luật server phải kiểm (`canJoinOrApply`, `meetsMinRank`, `canEditMatchResult`, `canEditBracketSlot`, giới hạn khán giả / QTV, tối đa 50 thành viên / 3 phó clan…) — ghi rõ client chỉ dùng để ẩn / khoá nút, server mới quyết định.
  - Xong (14/11): [`docs/contract/rules.md`](docs/contract/rules.md) — luật Phòng / Giải / Clan / Hồ sơ / Chat kèm hàm nguồn và mã lỗi ([`contract/errors.ts`](contract/errors.ts)). 3 luật chưa có trong mock, đánh dấu **chờ chốt**: QTV bỏ qua mật khẩu phòng, phòng clan chặn người ngoài, chủ phòng rời.
- [ ] **C6. Interface `HubClient` + `MockHubClient`:** `HubClient` gồm các hàm theo module + `subscribe(event, handler)`. Gói 7 file mock hiện tại thành `MockHubClient` (giữ các kịch bản loading / empty / error / độ trễ để bảng "Chỉnh thông số" vẫn dùng được), cấp qua React context. Chuyển dần từng màn sang gọi `HubClient` — **mỗi màn một lần, chờ người dùng duyệt** như Templates.
  - Đã có phần interface (14/11): `HubClient` (`call` có kiểu theo tên lệnh, `subscribe` theo chủ đề, `on` theo sự kiện, `connection`, `serverNow`) trong [`contract/api.ts`](contract/api.ts). Chưa làm `MockHubClient` và chuyển màn — cần người dùng duyệt từng màn.
- [x] **C7. Mẫu dữ liệu + kiểm tra:** mỗi DTO có ít nhất 1 fixture JSON trong `contract/fixtures/`; `npm run typecheck` kiểm fixture khớp kiểu (`satisfies`); mapper DTO → view model có test nhỏ. Nếu C0 chọn có kiểm tra lúc chạy thì thêm validate ở biên `HttpHubClient`.
  - Xong phần fixture (14/11): [`contract/fixtures/index.ts`](contract/fixtures/index.ts) — mẫu cho 15 DTO chính + khung tin WS, viết bằng TS với `satisfies` (fixture JSON thuần mất kiểu literal nên không kiểm được). Đã thử ngược: 3 lỗi cố ý (enum sai, thiếu trường, sai kiểu kết quả) đều bị `tsc` bắt. Test mapper DTO → view model chuyển sang C6 (mapper chưa có).
- [x] **C8. Bàn giao cho backend:** `docs/contract/README.md` (cách đọc, quy ước, bảng endpoint + sự kiện, luồng chính đăng nhập → sảnh → phòng → vào game → kết quả dạng sequence) + bản xuất máy đọc được (JSON Schema / OpenAPI + AsyncAPI) nếu backend không viết bằng TypeScript.
  - Xong phần tài liệu (14/11): [`docs/contract/README.md`](docs/contract/README.md) (bản đồ file, cách gọi, sequence luồng chính, nhật ký thay đổi, còn mở) + [`docs/contract/api-index.md`](docs/contract/api-index.md) **sinh tự động** bởi [`tools/build_contract_docs.py`](tools/build_contract_docs.py) (26 truy vấn · 69 lệnh · 33 sự kiện, chạy 2 lần cùng kết quả). Còn lại: bản xuất JSON Schema / OpenAPI — chỉ làm nếu C0 chốt backend không dùng TypeScript.
- [ ] **C9. `HttpHubClient` khung:** fetch + WebSocket, gắn token, làm mới token, tự nối lại có backoff, gửi bù theo `seq`; bật bằng biến môi trường (`VITE_HUB_API_URL`), không có thì dùng mock. Chỉ làm khi đã có server thử (hoặc server giả từ fixture).
  - Chưa làm: cần server thử (hoặc server giả từ fixture) và C0.

**Thứ tự:** C1–C2 làm được ngay vì chỉ đọc mock. C3–C5 nên đợi các màn Templates còn lại (T2–T7, T9–T11) ổn định, hoặc làm theo từng module khi màn tương ứng đã duyệt — tránh viết contract cho dữ liệu sắp đổi. C6 gắn với T10 (nối luồng chính).

## Bước 5 — Vỏ desktop Electron

- [ ] Khung Electron (`electron-vite`): cửa sổ chính nạp UI bước 4, cửa sổ không viền tuỳ chọn, `contextIsolation` + preload chỉ mở API cần thiết.
- [ ] Mở game: đường dẫn game lấy từ cài đặt / `AOE_GAME_DIR`, chạy và theo dõi tiến trình game (đang chơi → về hub) cho `LaunchBar`.
- [ ] Đóng gói bộ cài (`electron-builder`): Windows trước, macOS / Linux sau; tự cập nhật.

## Đã chốt

- **Công nghệ bước 4:** React + TypeScript + HTML/CSS + Tailwind CSS. Tokens xuất thành Tailwind preset + CSS variables; bevel thành utility Tailwind.
- **Nền tảng chạy (11/11):** ứng dụng desktop bằng **Electron** (Windows trước; macOS / Linux build được, game AoE ngoài Windows cần Wine). UI vẫn là Vite + React + TS + Tailwind; Electron chỉ là vỏ cửa sổ + quyền mở game / file / tự cập nhật. Lý do chọn hơn Tauri: Chromium đi kèm nên hiển thị pixel giống nhau mọi máy, backend cùng TypeScript.
- **Sản phẩm đích:** game hub kiểu nền tảng kết nối (sảnh, phòng, bạn bè, chat, hồ sơ, giải đấu, launcher). Component thiết kế theo Atomic Design.
- **Theme mặc định:** 1 theme duy nhất — màn hình `scr2` + hộp thoại `dlg6_0`; mọi theme khác chỉ là phụ (không có khái niệm "phe mặc định").
- **Con trỏ mặc định của UI (11/11):** `assets/ui/cursor/default.png` (hotspot 0 0, đọc từ `default.cur`), sinh bởi `build_tokens.py` vào `tokens/aoe-theme.css` trên `:root`; tắt bằng `data-cursor="system"` (tuỳ chọn "Dùng con trỏ của game"). Các con trỏ theo theme `theme-scr*` không dùng làm mặc định.
- **Màn Đăng nhập:** nền `scr1` + hộp thoại Gỗ `dlg6_3`, checkbox sprite `dlg6_0` không viền — ngoại lệ riêng của màn này so với theme mặc định.
- **Demo trên GitHub Pages (15/11/2026):** chủ dự án quyết định đẩy mã nguồn (kể cả `assets/ui/`, trừ `raw/`) lên `https://github.com/congqt125-ai/aoe-hub` và build demo bằng GitHub Actions (`.github/workflows/pages.yml`, chạy mỗi lần push `main`) lên GitHub Pages để xem thử trong lúc phát triển; bản hoàn thiện deploy nơi khác. Trang `demo/tokens/` và `demo/asset-browser/` dùng ảnh trong `raw/` nên trên Pages sẽ thiếu ảnh.
- **Font mặc định:** Spectral SC (người dùng chọn sau khi so sánh 7 font) cho tiêu đề, nút, nhãn, menu; Arimo cho đoạn văn dài (chat, mô tả) để dễ đọc.

## Quyết định còn mở

- **Git:** thư mục `aoe-ui-hub` chưa phải git repo — có `git init` không?
- **Bản quyền khi phát hành:** asset tách từ game thuộc Microsoft. Hướng đề xuất (11/11): bản cài mặc định dùng asset tự làm (`assets/hub/`), tuỳ chọn "Giao diện game gốc" tách ảnh từ bản game người chơi đã cài lúc chạy (dùng lại script bước 1–3), không dùng tên / logo "Age of Empires". Chưa chốt.
- **Contract backend (bước 4B, C0 — 14/11):**
  - Backend viết bằng gì? Nếu TypeScript (Node) thì dùng chung thư mục `contract/`; nếu ngôn ngữ khác thì phải xuất JSON Schema / OpenAPI cho họ sinh code.
  - Mô tả schema bằng gì? Đề xuất: **TypeScript thuần** (không thêm phụ thuộc) nếu backend là TS; **zod** nếu cần kiểm tra dữ liệu lúc chạy + xuất JSON Schema; **OpenAPI + AsyncAPI viết tay** nếu backend ngôn ngữ khác và muốn họ làm chủ bản mô tả.
  - Đường truyền: HTTP JSON + WebSocket (đề xuất) hay chỉ WebSocket, hay dùng nền tảng có sẵn (Colyseus, Nakama, Supabase…)?
  - Đăng nhập: tài khoản riêng của hub (email / tên + mật khẩu, token + refresh) hay qua bên thứ ba?
  - Đã có backend / tài liệu API nào chưa (ví dụ máy chủ relay `superaqe.com` trong T8) cần khớp theo không?
  - Phát sinh khi viết contract (14/11, chi tiết ở [`docs/contract/inventory.md` §4](docs/contract/inventory.md) và [`rules.md`](docs/contract/rules.md)): **ai báo kết quả trận** (client sau game / relay / QTV) · công thức Elo, bậc I–III, mùa · QTV là vai toàn hệ thống hay theo giải · phòng có Màu / Đội / AI / tốc độ / thời đại không · chủ phòng rời thì chuyển chủ hay đóng phòng · phòng clan có chặn người ngoài · QTV có bỏ qua mật khẩu phòng · tên giải tối đa 60 (code) hay 40 (brief T5).

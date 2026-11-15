# aoe-ui-hub — quy tắc cho Agent

Dự án tách đồ hoạ giao diện từ Age of Empires 1 (SuperAoE) và dựng lại thành bộ UI phong cách game.

## Mục tiêu cuối

Sản phẩm đích là **game hub kiểu nền tảng kết nối** (sảnh, phòng chơi, bạn bè, chat, hồ sơ, giải đấu, launcher). Game chỉ cung cấp chất liệu; phần lớn component hub phải tự thiết kế theo chất liệu đó — danh mục và quy tắc UX ở bước 3 của PLAN.md.

Mọi thứ tách ra phải dùng được để thiết kế UI bằng **React + HTML/CSS + Tailwind CSS**:

- Màu, bevel, shade, font → **Tailwind preset** (`tokens/tailwind.preset.js`) + CSS variables (`tokens/aoe-theme.css`), cùng sinh từ `design-tokens.json`. Không hard-code mã màu trong component.
- Viền bevel nổi/lõm → Tailwind plugin/utility (ví dụ `bevel-raised`, `bevel-sunken`) để dùng thẳng trong `className`.
- Ảnh (nền, icon, sprite sheet, cursor) → đặt tên ổn định, có JSON tọa độ để component React import được.
- Component React + TypeScript, style bằng Tailwind class; chỉ dùng CSS riêng khi Tailwind không làm được (ví dụ `border-image`, `cursor: url()`).
- Mỗi quyết định ở bước 1–3 phải trả lời được: "cái này sẽ được dùng thế nào trong React/Tailwind?"

## Làm việc với PLAN.md

[PLAN.md](PLAN.md) là nguồn sự thật duy nhất về phạm vi và tiến độ.

- **Trước khi làm:** đọc PLAN.md, xác định việc đang làm thuộc bước nào. Việc không có trong plan → hỏi người dùng hoặc đề xuất thêm vào plan trước, không tự làm.
- **Làm theo thứ tự bước.** Không nhảy sang bước sau khi bước trước còn mục chưa xong, trừ khi người dùng yêu cầu.
- **Sau mỗi việc xong và đã kiểm tra:** đổi `- [ ]` thành `- [x]` ngay, kèm ghi chú ngắn nếu cần (file tạo ra, số lượng, lỗi còn lại). Chưa kiểm tra thì chưa đánh dấu.
- **Phát hiện mới** (id sai, định dạng khác dự kiến, nhóm asset mới) → cập nhật bảng/ghi chú trong PLAN.md, không để chỉ trong chat.
- **Đổi hướng hoặc thêm/bớt việc** → sửa PLAN.md và báo người dùng thay đổi gì.
- **Quyết định còn mở** → hỏi người dùng; khi đã chốt, chuyển từ mục "Quyết định còn mở" thành ghi chú đã chốt.
- Không xoá mục đã xong khỏi plan — giữ lại làm lịch sử.

## Ngôn ngữ

- Trả lời, ghi chú, commit message: tiếng Việt.
- Tên file, tên biến, tên hàm, CSS class: tiếng Anh.

## Dữ liệu game — CHỈ ĐỌC

- Thư mục game: `C:\Users\congq\AppData\Local\Programs\superaoe-launcher\game\` (shortcut: `game.lnk`).
- Không bao giờ ghi, sửa, đổi tên hay xoá bất cứ thứ gì trong thư mục game. Script chỉ mở file ở chế độ `rb`.
- Đường dẫn game truyền vào script qua tham số hoặc biến môi trường `AOE_GAME_DIR`, không hard-code trong code.

## Cấu trúc thư mục

```
tools/        script Python (extract_drs.py, slp2png.py, ...)
vendor/fonts/  font web OFL (Spectral SC, Arimo) tải bằng fetch_web_fonts.py — nguồn, được commit
raw/          dữ liệu tách thô từ DRS — sinh tự động, không sửa tay
assets/ui/    PNG/sprite/font/cursor đã lọc và đặt tên
tokens/       design-tokens.json → aoe-theme.css + tailwind.preset.js (sinh từ bảng màu + file mô tả màn hình)
components/   component React + TypeScript + Tailwind
demo/         trang mẫu so sánh với ảnh chụp game
```

- `raw/` và output sinh tự động phải tái tạo được hoàn toàn bằng cách chạy lại script.
- File tạm, thử nghiệm: dùng scratchpad của phiên, không để trong dự án.

## Python

- Python 3, chỉ dùng thư viện chuẩn + Pillow.
- Chạy script với `python -I`.
- Script có `argparse`, chạy lại nhiều lần cho ra cùng kết quả, in tóm tắt (số file, lỗi) khi xong.
- Lỗi ở một file không làm dừng cả lô: ghi log rồi chạy tiếp, cuối cùng báo tổng số lỗi.

## Định dạng file game (tóm tắt)

- **DRS:** header 64 byte (copyright 40, version 4, type 12, `num_tables` int32 @56, `first_file_offset` int32 @60); bảng loại 12 byte (ext đảo ngược 4, offset, số file); mỗi file 12 byte (id, offset, size). Loại: `slp`, `bina`, `shp`.
- **`bina`:** bảng màu JASC-PAL (`50500`–`50519`), file mô tả màn hình dạng text (`500xx`, `53000`), BMP (`50401`, `50402`).
- **SLP:** sprite 8-bit theo bảng màu; mặc định dùng `pal1` (`50501`) nếu file mô tả màn hình không chỉ định.
- **Bevel:** viền/khung do game tự vẽ từ `bevel_colors` (chỉ số bảng màu) → dựng lại bằng CSS. Nút của các theme có sprite riêng (`button_file`, SLP 50601–50612, 53004).
- **Theme:** 9 bộ chính (nền + bảng màu + sprite nút + hộp thoại + bevel), bảng ánh xạ ở PLAN.md.

## Font

- Hub dùng **Spectral SC** (heading) + **Arimo** (body). Font của game (`coprgtl`, `.Vn*` TCVN3) không có Unicode tiếng Việt — không dùng trong UI.
- Text tiếng Việt luôn là Unicode; kiểm tra glyph bằng fontTools khi thêm font mới.

## Kiểm tra

- Sau khi giải mã SLP: so ảnh nền `50100` với ảnh chụp game thật, màu phải khớp.
- Component: so trên `demo/index.html` cạnh ảnh chụp game.
- Báo kết quả thật: lỗi thì nói lỗi kèm output, bước nào bỏ qua thì nói rõ.

## Bản quyền

Đồ hoạ thuộc Microsoft/Ensemble. Chỉ dùng cá nhân/nội bộ — không commit `raw/` và `assets/ui/` lên repo công khai, không publish ra ngoài.

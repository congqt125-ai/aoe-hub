# Wireframe & luồng — AoE UI Hub

Phác bố cục (ASCII) cho các màn hình ở [components.md §4](components.md#4-templates--màn-hình). Kích thước tham chiếu: cửa sổ 1366×768, theme mặc định `scr2` + hộp thoại `dlg6_0`.
Ký hiệu: `[Nút]` = `Button`, `( )`/`(x)` = `Checkbox` sprite game, `▾` = `Select`, `●` = `StatusDot`, `▂▄▆█` = `PingIndicator`, `═` = `Bevel raised`, `░` = `Bevel sunken`.

---

## Luồng chính

```
 ┌──────────┐   đăng nhập OK   ┌──────────┐  chọn "Sảnh"  ┌──────────┐  Vào phòng   ┌────────────┐
 │ Đăng nhập│ ───────────────▶ │ Trang chủ│ ────────────▶ │   Sảnh   │ ───────────▶ │ Phòng chơi │
 └──────────┘                  └──────────┘               └──────────┘  (mật khẩu?  └────────────┘
      │ chưa có tài khoản           │ "Xếp trận"               ▲        → Dialog)         │ (x) Sẵn sàng
      ▼                             ▼                          │                          │ chủ phòng [Bắt đầu]
 ┌──────────┐                ┌──────────────┐  tìm thấy +      │                          ▼
 │ Đăng ký  │                │  Xếp trận    │  mọi người       │                   đếm ngược 5s (huỷ được)
 └──────────┘                │ (hàng đợi)   │  chấp nhận ──────┼──────────────────▶ LaunchBar: khởi chạy game
                             └──────────────┘                  │                          │
                                                               │                          ▼
                                                               │                   ── chơi trong game ──
                                                               │                          │ game đóng
                                                               │                          ▼
                                                               │  [Về sảnh]       ┌──────────────────┐
                                                               └──────────────────│ Kết quả trận     │
                                                                  [Về phòng] ───▶ │ (Dialog lg)      │
                                                                                  └──────────────────┘
```

Nhánh lỗi cần có ở mọi bước: mất kết nối (banner + tự kết nối lại), phòng đầy / bị đóng (`Toast warning` + quay về Sảnh), bị kick (`Dialog info`), game không khởi chạy được (`LaunchBar` lỗi + "Sửa lỗi cài đặt").

---

## 1. Đăng nhập / Đăng ký

```
┌───────────────────────────── nền bg/scr2 (phủ tối 51%) ─────────────────────────────┐
│                                                                                       │
│                     ╔═════════════ Dialog md (dlg6_0) ═════════════╗                   │
│                     ║            AOE  HUB  ·  ĐĂNG NHẬP             ║                   │
│                     ║                                                ║                   │
│                     ║  Tên đăng nhập                                 ║                   │
│                     ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    ║                   │
│                     ║  Mật khẩu                                  👁  ║                   │
│                     ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    ║                   │
│                     ║  ( ) Ghi nhớ đăng nhập        Quên mật khẩu?   ║                   │
│                     ║                                                ║                   │
│                     ║          [ Đăng ký ]     [ ĐĂNG NHẬP ]          ║                   │
│                     ╚════════════════════════════════════════════════╝                   │
│                                                                    phiên bản · ▂▄▆ máy chủ │
└───────────────────────────────────────────────────────────────────────────────────────┘
```
- Lỗi (để trống, sai mật khẩu, mất kết nối): một dòng báo chung chừa sẵn ngay trên hàng nút (`FormMessage`), ô liên quan chỉ đổi viền đỏ; không xoá tên đăng nhập. Hộp thoại không đổi kích thước (người dùng chốt "A + B", 12/11).
- Đang đăng nhập: nút chính `loading`, khoá form.
- Đăng ký: cùng dialog, thêm Email + Nhập lại mật khẩu + `Checkbox` điều khoản.

## 2. Trang chủ

Trang quảng bá: giải đấu, cái mới của phần mềm và core game, kèm phòng gợi ý và bạn bè online. Không SideNav (đã cất). Đặc tả đầy đủ: [`t2-home-brief.md`](t2-home-brief.md).

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

## 3. Sảnh (danh sách phòng)

```
┌ TopBar ═════════════════════════════════════════════════════════════════════════════┐
├──┬───────────────────────────────────────────────────────────────┬──────────────────┤
│  │ ░🔍 Tìm phòng░  Chế độ▾  Bản đồ▾  Ping▾  (x)Ẩn phòng đầy  ( )Ẩn có mật khẩu  [TẠO PHÒNG] │
│  │ ┌──────────────────────────────────────────────────────────┐   │ FriendsPanel     │
│  │ │ Tên phòng ▾      Chủ phòng   Bản đồ     Người   Ping  Tt │   │                  │
│  │ ├──────────────────────────────────────────────────────────┤   │                  │
│  │ │ Đấu 2v2 vui vẻ   ● Minh      Đảo nhỏ    3/4    ▂▄▆█ Chờ │   │                  │
│  │ │▓Rush đồ đồng 🔒▓ ● Lan       Lục địa    6/8    ▂▄▆  Chờ │◀ dòng chọn         │
│  │ │ Hội người già    ● Tuấn      Sông       8/8    ▂▄   Đầy │   │                  │
│  │ │ …                                                        │   │                  │
│  │ └──────────────────────────────────────────────────────────┘   │                  │
├──┴───────────────────────────────────────────────────────────────┴──────────────────┤
│ ChatPanel (mở): [Sảnh] [Minh]                                                        │
│  Hùng: có ai 1v1 không                                                     21:02     │
│  ✦ Hệ thống: Bảo trì lúc 23:00                                                       │
│  ░ Nhập tin nhắn…                                                       ░ [Gửi]      │
├ LaunchBar ═══════════════════════════════════════════════════════════════════════════┤
```
- Rỗng: `EmptyState` "Chưa có phòng — [Tạo phòng]". Loading: 8 dòng skeleton.
- Tạo phòng: `Dialog form md` (Tên, Mật khẩu tuỳ chọn, Chế độ, Số người, Bản đồ).

## 4. Phòng chơi

```
┌ TopBar ═════════════════════════════════════════════════════════════════════════════┐
├─────────────────────────────────────────────────────────────────────────────────────┤
│ RUSH ĐỒ ĐỒNG 🔒                                          [ Mời bạn ]  [ Rời phòng ] │
├──────────────────────────────────────────────────────┬──────────────────────────────┤
│ #  Người chơi          Phe▾          Màu▾  Đội▾ Sẵn sàng │ CÀI ĐẶT TRẬN (chủ phòng sửa) │
│ 1  👑● Lan  ▂▄▆█       [🏛 Hy Lạp ▾]  ■ ▾   1 ▾   (x)    │  ┌ minimap ◇ ┐ Bản đồ: Lục địa│
│ 2  ● Minh   ▂▄▆        [🏯 Á Đông ▾]  ■ ▾   2 ▾   ( )  ✕ │  └──────────┘ Cỡ: Trung bình │
│ 3  ● Hùng   ▂▄         [🧱 Babylon ▾] ■ ▾   1 ▾   (x)  ✕ │  Tài nguyên: 🪵200 🪨150 🍖200 💰0│
│ 4  [ + Mở — mời / thêm AI ]                              │  Thời đại: Đồ đá              │
│ 5  [ Đóng ]                                              │  Tốc độ: Bình thường ▾        │
│ …                                                        │  Thắng: Chinh phục ▾          │
├──────────────────────────────────────────────────────┴──────────────────────────────┤
│ ChatPanel kênh phòng                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                    (x) SẴN SÀNG          [ BẮT ĐẦU ] (disabled: 1 người chưa sẵn sàng) │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
- Màu đã có người chọn bị khoá trong `Select` màu.
- Khi tất cả sẵn sàng → "Bắt đầu" bật; bấm → đếm ngược 5 s (mọi người thấy, có [Huỷ]) → `LaunchBar` khởi chạy game.

## 5. Giải đấu (thay Xếp trận — 13/11, đang thiết kế)

> Xếp trận (hàng chờ tự ghép) **đã bỏ** theo người dùng (13/11). Giải đấu có vòng đời theo **pha**; nội dung trang đổi theo pha:
> **Nháp** (chỉ QTV) → **Đăng ký** (người chơi tự chọn đội) → **Ngày xếp đội** (chốt đội, lập nhánh) → **Thi đấu** → **Kết thúc**.
>
> **Đã chốt (13/11, người dùng):** đăng ký lẻ bằng cách **tự vào card đội**; thể thức **loại trực tiếp**; kết quả trận **QTV nhập tay**.

Bố cục 1600×900, kiểu viền B, không SideNav (như Sảnh): trái danh sách giải · giữa chi tiết giải · phải chat giải + trận của bạn.

**Trước ngày xếp đội** (Đăng ký) — tab **Đội** (mặc định) · **Luật**:
```
├────────────────┬──────────────────────────────────────────────────────────────────┬───────────────┤
│ GIẢI ĐẤU [+Tạo]│ CÚP MÙA THU · Cung R Shang · 🏆 500k     Xếp đội sau 1 ngày 04:12:33│ CHAT GIẢI     │
│ ĐANG ĐĂNG KÝ   │ (●)Đăng ký──( )Xếp đội 15/11 20:00──( )Thi đấu──( )Kết thúc         │ …             │
│▓Cúp Mùa Thu▓   │ [Đội] [Luật]                         Bạn: Đội Sói · [Rời đội]     │               │
│ Giao hữu T7    │ ┌─ĐỘI SÓI ✎──── 5/8┐┌─ĐỘI 2 ─────── 2/8┐┌─ĐỘI 3 ────── 0/8┐┌─ĐỘI 4 ──── 8/8┐│               │
│ ĐANG ĐẤU       │ │♛ lan_hylap  (bạn)││♛ Minh Babylon    ││  (trống)        ││♛ Hoàng La Mã ││               │
│ Clan War       │ │  thu.ai_cap      ││  Long Á Đông     ││  (trống)        ││  …           ││               │
│ ĐÃ KẾT THÚC    │ │  Lan Hy Lạp      ││  (trống)         ││  …              ││  …           ││               │
│ Cúp Hè         │ │  …  (8 ô / cột)  ││  …               ││                 ││  …           ││               │
│                │ │ [   Đang ở đây  ]││ [  Chuyển vào  ] ││ [ Vào – làm đội trưởng ]││[ Đã đủ ]││───────────────│
│                │ └──────────────────┘└──────────────────┘└─────────────────┘└──────────────┘│ ░ Nhập… ░     │
│                │ ┌─ĐỘI 5 …          (hàng 2, 3… cuộn dọc)                                │               │
```
- **Lưới card đội, mỗi hàng 4 card**; số card = số đội tối đa QTV đặt (8 / 16 / 32 → 2 / 4 / 8 hàng, cuộn dọc). Mỗi card: tên đội, số người `n/8`, **8 ô người chơi xếp dọc** (avatar, tên, hạng, ping), nút ở chân card.
- **Bấm card (hoặc nút chân card) để vào đội.** Card trống: "Vào – làm đội trưởng". Card còn chỗ: "Vào đội" / "Chuyển vào" (nếu đang ở đội khác — có hỏi xác nhận). Card đủ 8: khoá, tooltip "Đội đã đủ 8 người". Card của mình: viền vàng, nút "Đang ở đây".
- **Người vào đầu tiên là đội trưởng** (♛), được **đặt tên đội** (bấm ✎ cạnh tên, tối đa 24 ký tự, không trùng tên đội khác); đội chưa đặt tên hiện "Đội <số>". Thứ tự trong cột = thứ tự vào.
- **Rời đội / đổi đội** thoải mái tới ngày xếp đội. Đội trưởng rời → quyền đội trưởng chuyển cho người vào kế tiếp (báo trong chat giải); đội trống → về "Đội <số>", tên cũ bị xoá.
- Mỗi người chỉ ở **một** đội. Thanh trên tab: "Bạn: <đội> · [Rời đội]" hoặc "Bạn chưa vào đội nào".
- Tab **Luật**: luật giải (văn bản QTV soạn) + tóm tắt thể thức: loại trực tiếp, Bo mỗi vòng, loại map, xử thua khi trễ.

**QTV — thiết lập giải** (`Dialog lg`, nút "+ Tạo giải" / "Sửa giải"; Lưu nháp · Công bố):
```
┌─ TẠO GIẢI ĐẤU ─────────────────────────────────────────────────────────────┐
│ [Thông tin] [Thể thức] [Lịch] [Luật]                       (Tabs vertical)  │
│  Thông tin: Tên giải · Thể loại (Random / Cung R Shang) · Giải thưởng        │
│  Thể thức:  Loại trực tiếp (cố định)   Số đội tối đa [8|16|32]               │
│             Người mỗi đội: tối đa 8 · tối thiểu để vào nhánh [4 ▾]           │
│             Số ván: vòng thường Bo1 ▾ · Bán kết / Chung kết Bo3 ▾            │
│  Lịch:      NGÀY XẾP ĐỘI [15/11 20:00]   Vòng 1 bắt đầu [16/11 20:00]        │
│             mỗi vòng cách [1 ngày ▾]                                        │
│  Luật:      [ văn bản luật …                                    ] [+ Mẫu luật]│
│                                           [Lưu nháp]  [ CÔNG BỐ GIẢI ]      │
└────────────────────────────────────────────────────────────────────────────┘
```
- Sửa được tới ngày xếp đội (mỗi lần đổi luật / lịch báo trong chat giải). QTV cũng quản lý card đội: đổi tên đội, mời ra khỏi đội, đổi đội trưởng. Sau ngày xếp đội **khoá đội và thể thức**; QTV chỉ còn: **nhập kết quả** (tay), xử thắng (bỏ cuộc / trễ), dời giờ trận.

**Ngày xếp đội:** tới giờ, đội bị khoá (không vào / rời / đổi được nữa). Đội có ít hơn số người tối thiểu bị loại khỏi giải (báo trong chat). Các đội còn lại được **bốc thăm vào nhánh loại trực tiếp**; số đội không phải lũy thừa của 2 → một số đội được **miễn vòng 1** (bye). QTV xem trước nhánh → "Bốc lại" → **Công bố**; người chơi thấy "Đang lập sơ đồ…" tới khi công bố.

**Sau ngày xếp đội** (Thi đấu): tab mặc định **Sơ đồ đấu**, thêm **Lịch sử đấu** · **Đội** · **Luật**.
```
│ (✓)Đăng ký ──(✓)Xếp đội──(●)Thi đấu──( )Kết thúc                                 │
│ [Sơ đồ đấu] [Lịch sử đấu] [Đội] [Luật]                                           │
│  VÒNG 1/8            TỨ KẾT             BÁN KẾT          CHUNG KẾT               │
│ ┌Đội Sói    2┐                                                                    │
│ └Đội Ưng    0┘─┐  ┌Đội Sói   ● Đang đấu┐                                          │
│ ┌Đội Hổ     1┐ ├──┤ (Vào xem)          ├─┐                                         │
│ └Đội Báo    2┘─┘  └Đội Báo             ┘ │  ┌──────────┐                           │
│ ┌▓Đội của bạn▓┐ 20:00 16/11              ├──┤ Sắp đấu  │──── 🏆                   │
│ └ Đội Rồng    ┘─┐ ...                      │  └──────────┘                           │
```
- Thẻ trận: 2 đội, tỉ số, giờ, trạng thái (Sắp đấu / ● Đang đấu / Xong / Xử thắng). Đội thắng sáng, đội thua mờ; **trận của bạn viền vàng**; rê lên một đội → sáng đường đi của đội đó qua nhánh.
- Bấm trận → `Dialog`: từng ván (map, đế chế từng người, thời lượng, bên thắng); "Vào xem" khi đang đấu; QTV: **"Nhập kết quả"** (chọn bên thắng từng ván, tỉ số tự tính, ghi chú) / "Xử thắng". Nhập xong → đội thắng tự lên ô vòng sau, trận vào Lịch sử đấu.
- 16 đội = 4 cột vừa 1600px; 32 đội → cuộn ngang.
- **Lịch sử đấu:** bảng trận đã xong, mới nhất trên đầu — thời gian, vòng, đội A, tỉ số, đội B, map, thời lượng, ghi chú (bỏ cuộc / xử thắng); lọc theo vòng / đội / "chỉ trận của tôi".
- Cột phải: **Trận của bạn** (đối thủ, giờ, nút "Vào phòng đấu" mở Phòng có thẻ giải) + chat giải.
- **Kết thúc:** banner vô địch (đội, thành viên, cúp) + hạng 2–3; sơ đồ và lịch sử giữ lại, chỉ đọc.

Organisms mới: `TournamentList`, `PhaseStepper`, `TeamCard` (+ lưới 4 cột), `TournamentSetupDialog`, `Bracket` + `MatchCard`, `MatchResultDialog`, `MatchHistoryTable` (dùng lại cho Hồ sơ T7). Bảng "⚙ Dữ liệu giả": pha, vai (QTV / người chơi), mình đang ở đội nào / đội trưởng, số đội 8 / 16 / 32, độ đầy các đội, số trận đã xong, có trận đang đấu.

## 6. Bạn bè & tin nhắn

```
├──┬──────────────────────────────┬──────────────────────────────────────────────────┤
│  │ ░🔍 Tìm bạn░    [+ Thêm bạn]  │ ● Minh  ▂▄▆  Đang chơi: Rush đồ đồng   [Mời] [Hồ sơ] │
│  │ [Tất cả|Online|Lời mời 2]     ├──────────────────────────────────────────────────┤
│  │ LỜI MỜI (2)                   │  Minh: tối nay đánh không                21:00    │
│  │  ● Tuấn  [Đồng ý] [Từ chối]   │  Bạn:  ok 9h nhé                         21:01    │
│  │ ĐANG CHƠI (2)                 │  Minh đang gõ…                                    │
│  │ ▓● Minh▓                      │                                                   │
│  │  ● Lan                        │                                                   │
│  │ ONLINE / VẮNG / OFFLINE …     │ ░ Nhập tin nhắn…                       ░ [Gửi]    │
```

## 7. Hồ sơ (thiết kế lại 13/11, đã chốt với người dùng)

> Bản cũ (ProfileHeader + StatBlock + bảng lịch sử) mở rộng thành **trang có tab**: **Tổng quan · Lịch sử đấu · Thành tựu · Kho đồ · Bạn bè**. Không SideNav (như Sảnh / Phòng / Giải đấu).
> `#/profile` = hồ sơ của mình; `#/profile/<id>` = người khác. Hộp thoại hồ sơ nhanh (bấm tên ở Sảnh / Phòng) giữ nguyên, thêm nút "Xem hồ sơ đầy đủ".

```
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░ nền hồ sơ (vật phẩm "Nền hồ sơ") ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ╔══════╗ LAN_HYLAP  [ABC]  « Bá chủ Hy Lạp »            ★ ★ ★ (3 thành tựu ghim) 🏆×2   │
│ ║avatar║ ● Trực tuyến · Vàng II 1540 ▲18 · 🏛 Hy Lạp · cờ màu · tham gia 03/2025          │
│ ║ + khung║                                      [Sửa hồ sơ]  |  [Kết bạn][Nhắn tin][Mời][⋯]│
│ ╚══════╝                                                                                    │
│ [Tổng quan] [Lịch sử đấu] [Thành tựu] [Kho đồ*] [Bạn bè]          (* chỉ hồ sơ của mình)   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ TỔNG QUAN                                                                                   │
│ ╔Số trận╗╔Tỉ lệ thắng╗╔Điểm ▲18╗╔Chuỗi thắng╗╔Giờ chơi╗   │ GIỚI THIỆU                     │
│ ║ 342  ║║   58%    ║║  1540  ║║     4     ║║  210 h ║   │ "Chơi Hy Lạp, thích map đảo…"  │
│ Điểm 30 ngày  ▁▂▃▅▄▆▇   10 trận gần nhất  ● ● ○ ● ● ○ ● ● ● ○ │ CLAN  [ABC] Á Đông Bang · Phó   │
│ ĐẾ CHẾ HAY DÙNG              THỂ LOẠI / LOẠI MAP          │ HẠNG THEO MÙA                  │
│ 🏛 Hy Lạp   120 trận  61%    Random     210  55%          │ Mùa 3  Vàng II 1540 (cao: BK I)│
│ 🏯 Yamato    64 trận  52%    Cung R     132  62%          │ Mùa 2  Vàng I                  │
│ …(5)                         Map sáng / đen / đồng minh   │ Mùa 1  Bạc III                 │
│ HAY CHƠI CÙNG  (Minh)(Lan)(Hùng)(Tú)(Long)                │                                │
```

- **Đầu trang:** avatar `xl` + khung (vật phẩm), tên, thẻ clan, danh hiệu đang dùng, trạng thái, hạng + điểm (± tuần), đế chế yêu thích (icon nhà theo kiến trúc), cờ màu người chơi, ngày tham gia; tối đa 3 thành tựu ghim + số cúp giải đấu. Nút: mình → "Sửa hồ sơ" (giới thiệu, đế chế yêu thích, ghim thành tựu); người khác → Kết bạn / Nhắn tin / Mời vào phòng / ⋯ (Chặn, Báo cáo).
- **Tổng quan:** hàng `StatBlock`; điểm 30 ngày (đường nhỏ); 10 trận gần nhất (chấm thắng / thua); thống kê theo thể loại và loại map; 5 đế chế hay dùng (số trận, tỉ lệ thắng); 5 người hay chơi cùng (bấm → hồ sơ). Cột phải nhỏ: giới thiệu, **clan** (thẻ, tên, vai, ngày vào), **lịch sử hạng theo mùa** (3–4 dòng: mùa, hạng cuối, hạng cao nhất).
- **Lịch sử đấu:** tab con **Trận đấu** (bảng: kết quả, thể loại, loại map, đế chế, đồng đội / đối thủ, thời lượng, ngày, điểm ±; lọc thể loại / kết quả / thời gian; "Tải thêm"; bấm dòng → chi tiết trận) · **Giải đấu** (giải đã tham gia, đội, vai, thành tích: Vô địch / Á quân / bị loại ở vòng …; bấm → mở giải).
- **Thành tựu:** lưới huy hiệu theo nhóm Chiến trận · Đế chế · Giải đấu · Cộng đồng · Mùa giải; mỗi huy hiệu: icon từ asset game, tên, mô tả, tiến độ, ngày đạt, độ hiếm (% người có). Lọc Đã đạt / Chưa đạt / Tất cả; mình ghim được tối đa 3. Một số thành tựu mở khoá vật phẩm.
- **Kho đồ** (chỉ mình; **chỉ đồ trang trí, không tiền, không cửa hàng**): trái danh mục Avatar · Khung avatar · Danh hiệu · Nền hồ sơ · Biểu tượng chat; giữa lưới ô vật phẩm, **độ hiếm = texture theme**: Gỗ thường · Sa thạch hiếm · Cẩm thạch sử thi · Đá đen viền vàng huyền thoại; ô chưa có mờ + khoá, tooltip cách nhận (thành tựu / giải đấu / mùa giải / sự kiện); phải xem trước (đầu hồ sơ + một dòng chat) + "Trang bị".
- **Bạn bè:** hồ sơ của mình — lời mời kết bạn (Đồng ý / Từ chối) trên đầu, danh sách nhóm theo trạng thái (Đang chơi / Trực tuyến / Vắng / Ngoại tuyến), tìm, hành động (Xem hồ sơ, Nhắn tin, Mời vào phòng, Huỷ kết bạn có xác nhận). Hồ sơ người khác — danh sách bạn của họ, **bạn chung** lên đầu có nhãn.
- **Người khác xem** (chốt 13/11): Tổng quan · Lịch sử đấu · Thành tựu · Bạn bè; Kho đồ ẩn (chỉ thấy đồ đang trang bị). **Không có chế độ riêng tư** (chốt 13/11).

## 8. Cài đặt

```
├────────────────┬─────────────────────────────────────────────────────────────────┤
│ CÀI ĐẶT        │ MẠNG                                                             │
│  Giao diện     │ Kết nối                                                          │
│  Game          │ Máy chủ (relay)  [ https://superaqe.com        ] [Mặc định]      │
│ ▓Mạng▓         │ [ Kiểm tra mạng ]   Ping 42 ms · NAT mở · UPnP có   [ TỐT ]      │
│  Voice chat    │ ─────────────────────────────────────────────────────────────── │
│  Phím tắt •    │ Trạm trung chuyển                                                │
│                │ [■] Làm trạm trung chuyển (TURN) khi máy rảnh                    │
│                │  ✓ CPU ≥ 4 nhân  ✓ RAM ≥ 4 GB  ✓ Cắm điện  ✗ Kết nối từ ngoài   │
│                │  ⚠ Không làm trạm được: NAT của nhà mạng (router thấy 21.45…)    │
│                │                              Đã lưu ·  [ Khôi phục mặc định ]    │
```

Mở từ menu tài khoản (TopBar), không có trong SideNav; không có tab Tài khoản (đã có Hồ sơ). Lưu tự động (đã chốt 13/11). Chấm • cạnh tab = còn lỗi chưa sửa. Đặc tả đầy đủ: [`t8-settings-brief.md`](t8-settings-brief.md).

## 9. Kết quả trận (Dialog lg)

```
╔══════════════════════════ CHIẾN THẮNG ═══════════════════════════╗
║  2v2 · Lục địa · 32:10                                           ║
║  Người chơi    Phe   Điểm  Quân   Công trình  Tài nguyên   ±     ║
║  ● Lan (bạn)   🏛    3120   84      31          12 400     +18   ║
║  ● Minh        🏯    2870   66      27          10 900     +18   ║
║  ● Hùng        🧱    1990   51      19           8 200     −18   ║
║  ● Tú          🏺    1730   47      22           7 600     −18   ║
║                         [ Về sảnh ]   [ VỀ PHÒNG ]                ║
╚══════════════════════════════════════════════════════════════════╝
```
- "Về phòng" chỉ hiện khi phòng vẫn còn; nếu không, nút chính là "Về sảnh".

## 11. Clan (thêm 13/11, đã chốt với người dùng)

> Mỗi người ở tối đa **một** clan. Vai: **Trưởng clan** (1) · **Phó** (tối đa 3) · **Thành viên**; tối đa **50 thành viên**. Không phí tạo clan (hub không dùng tiền). **Chưa có đấu giữa các clan** — thành tích lấy từ giải đấu.
> Điều hướng: mục **"Clan"** trên TopBar (giữa Giải đấu và Hồ sơ) và SideNav (Alt+4). `#/clan` = clan của mình (chưa có → Tìm clan); `#/clan/<THẺ>` = xem clan khác (khách). Không SideNav trong trang (như Sảnh / Giải đấu / Hồ sơ).

**A. Chưa có clan — Tìm clan:**
```
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ TÌM CLAN   ░🔍 Tên hoặc thẻ░  Nhận người: Tất cả▾  Hạng tối thiểu ≤ Vàng▾     [+ Tạo clan] │
│ LỜI MỜI VÀO CLAN (1):  [ABC] Á Đông Bang — mời bởi Minh            [Từ chối] [Đồng ý]       │
│ ── Biểu tượng  Thẻ   Tên clan          Thành viên  Hạng tối thiểu  Nhận người   ──────────── │
│    🏛(xanh)   [ABC] Á Đông Bang         38/50       Bạc            Duyệt đơn   [Xin vào]    │
│    🏯(đỏ)     [SGP] Sài Gòn Phố         27/50       —              Mở          [Vào clan]   │
│    🧱(vàng)   [HND] Hà Nội Đế Chế       50/50       Vàng           Duyệt đơn   [Đã đủ]      │
```
- Bấm dòng → trang clan đó (chế độ khách: Tổng quan không có chat, Thành viên chỉ đọc, Thành tích).
- **Xin vào** → `Dialog` lời nhắn (≤ 140 ký tự) → "Đã gửi đơn" (huỷ đơn được). **Vào clan** (Mở) → vào ngay. Đủ 50 / hạng thấp hơn yêu cầu / clan Đóng → nút khoá + tooltip lý do. Đã có clan → không có nút xin vào clan khác.
- **Tạo clan** (`Dialog`): tên (≤ 24), thẻ (2–4 ký tự A–Z / 0–9, tự viết hoa, không trùng), biểu tượng (icon công trình theo 5 kiến trúc × màu cờ 8 màu), giới thiệu, cách nhận người (Mở / Duyệt đơn / Đóng), hạng tối thiểu. Tạo xong → mình là Trưởng clan.

**B. Đã có clan — trang clan:**
```
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ╔════╗ [ABC] Á ĐÔNG BANG                      Điểm clan 12.450 · Hạng clan #7              │
│ ║ 🏛 ║ 38/50 thành viên · Trưởng clan: Minh Babylon · Thành lập 02/2024 · Duyệt đơn          │
│ ╚════╝                                   [Mời người] [Rời clan] [⚙ Quản lý]                │
│ [Tổng quan] [Thành viên] [Đơn xin vào 3] [Thành tích] [Quản lý]                             │
├───────────────────────────────────────────────────────────────┬────────────────────────────┤
│ THÔNG BÁO  📌 Tối thứ 7 tập 4v4 Cung R lúc 20h — Minh          │ CHAT CLAN                  │
│ HOẠT ĐỘNG GẦN ĐÂY                                              │ …                          │
│  • thu.ai_cap được thăng Phó · 2 giờ trước                     │                            │
│  • Đội "ABC Team" vào bán kết Cúp Mùa Thu · hôm qua            │                            │
│ ĐANG ONLINE (9)  (Minh)(Lan)(Hùng)…                             │ ░ Nhập tin nhắn… ░         │
```
- **Tổng quan:** thông báo (Trưởng / Phó viết, sửa, ghim tối đa 3), hoạt động gần đây (vào / rời / thăng giáng chức / kích / thành tích giải), thành viên đang online (bấm → menu người chơi), cột phải **chat clan**.
- **Thành viên:** bảng — tên, vai, hạng, điểm đóng góp, trạng thái, ngày vào, lần online gần nhất; sắp xếp + lọc vai; menu mỗi người: Xem hồ sơ, Nhắn tin, Thăng Phó / Giáng xuống Thành viên (Trưởng), Kích khỏi clan (Trưởng: mọi người; Phó: chỉ Thành viên) — có xác nhận.
- **Đơn xin vào** (Trưởng / Phó; số đơn trên tab): đơn kèm lời nhắn + hồ sơ nhanh, Duyệt / Từ chối; mục "Lời mời đã gửi" (huỷ được). Đủ 50 → Duyệt khoá + lý do.
- **Thành tích:** điểm clan theo thời gian, số cúp, danh sách giải có đội mang thẻ clan (giải, đội, thành tích) — bấm → Giải đấu.
- **Quản lý** (chỉ Trưởng): sửa tên / biểu tượng / giới thiệu / cách nhận người / hạng tối thiểu (thẻ không đổi), **chuyển quyền Trưởng clan** (chọn một Phó / thành viên, xác nhận), **giải tán clan** (gõ đúng tên clan để xác nhận).
- **Rời clan:** xác nhận; Trưởng clan không rời được khi còn thành viên khác (nút khoá, tooltip "Chuyển quyền Trưởng clan trước"); là người cuối → rời = giải tán.
- **Mời người** (`Dialog`): tìm người chơi theo tên, gửi lời mời; người đã ở clan khác → khoá + lý do.
- Liên kết: thẻ clan ở Hồ sơ bấm được → `#/clan/<THẺ>`; Sảnh › CLAN ROOMS thêm lọc "Phòng của clan tôi".

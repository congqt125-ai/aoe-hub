# Kiểm kê dữ liệu theo màn (Bước 4B · C1)

Nguồn: mock trong [`demo/app/`](../../demo/app/), kiểu chung [`components/lib/types.ts`](../../components/lib/types.ts), đặc tả [`wireframes.md`](../wireframes.md) và các brief T2 / T5 / T7 / T8 / T11. Lập ngày 14/11 — màn T2–T7, T9–T11 còn đang dựng nên bảng này sẽ đổi theo; mỗi lần màn đổi dữ liệu thì sửa ở đây trước rồi mới sửa `contract/`.

Ký hiệu cột: **Đọc** = dữ liệu màn cần lấy từ server · **Gửi** = lệnh màn gửi lên · **Nghe** = sự kiện realtime màn cần nhận. Tên lệnh / sự kiện khớp với `contract/` (xem [README](README.md)).

---

## 1. Theo màn

### T1 · Đăng nhập / Đăng ký — [`LoginScreen.tsx`](../../demo/app/screens/LoginScreen.tsx)

| Đọc | Gửi | Nghe |
|---|---|---|
| Trạng thái máy chủ (ping, có kết nối không) · phiên bản tối thiểu của client | `auth.login { username, password, remember }` · `auth.register { username, email, password, acceptTerms }` · `auth.refresh` · `auth.logout` · (sau) `auth.forgotPassword` | — |

- Lỗi màn đang hiển thị: để trống (client tự kiểm), sai mật khẩu, mất kết nối, tên đã dùng (đăng ký). → mã `AUTH_INVALID_CREDENTIALS`, `AUTH_USERNAME_TAKEN`, `AUTH_EMAIL_TAKEN`, `NETWORK_*` (client tự sinh).
- "Ghi nhớ đăng nhập" → server cấp refresh token dài hạn; client cất ở Electron (bước 5), không ở `localStorage`.

### T2 · Trang chủ — [`homeMock.ts`](../../demo/app/homeMock.ts)

| Đọc | Gửi | Nghe |
|---|---|---|
| Hero slide (giải / phần mềm / core game / sự kiện) · changelog 2 sản phẩm · giải nổi bật (đang đăng ký / đang đấu trực tiếp / vô địch gần nhất) · phòng gợi ý · bạn bè online | (dùng lệnh của Sảnh / Giải / Bạn bè) | `presence.changed` · `tournament.match.updated` (khối "Đang đấu trực tiếp") |

- `HeroSlide.bgImage` đang là ảnh trong `assets/hub/` → server trả **khoá ảnh** (`bgKey`), client đổi sang URL; ảnh do server lưu thì trả `bgUrl`.
- `badge` ("Phần mềm mới", "Sự kiện") là chữ hiển thị → suy ra từ `kind` ở client.
- "Đã xem phiên bản" (`loadSeenVersions`) hiện lưu `localStorage` → **giữ ở client** (không cần đồng bộ). Ghi chú: nếu muốn đồng bộ giữa máy thì thêm sau.
- `ChangelogTag` đang là chữ tiếng Việt ("Mới", "Sửa lỗi"…) → đổi sang mã `new | fix | balance | performance`.

### T3 · Sảnh — [`lobbyMock.ts`](../../demo/app/lobbyMock.ts), [`LobbyScreen.tsx`](../../demo/app/screens/LobbyScreen.tsx)

| Đọc | Gửi | Nghe |
|---|---|---|
| Danh sách phòng (lọc loại `random / cungr / clan`, tìm, ẩn đầy / có mật khẩu, phân trang) · người online trong sảnh · chat sảnh (trang gần nhất) | `lobby.listRooms` · `lobby.findByCode { code }` · `room.create { name, password?, category }` · `room.join { roomId, password? }` · `room.watch { roomId }` · `chat.send { channel: lobby }` | `lobby.room.upserted` · `lobby.room.removed` · `chat.message` · `presence.changed` |

- `LobbyRoom = Room & { category, code, spectators, password? }` → **`password` không bao giờ trả về**, chỉ `hasPassword`. Kiểm mật khẩu ở `room.join`.
- `Room.ping` là ping **từ máy mình tới chủ phòng** → client tự đo / relay trả, không phải trường của phòng. DTO bỏ `ping`; client gắn sau.
- `Room.map / mode / speed / startAge` hiện là chữ hiển thị ngẫu nhiên. Phòng thật (T4) chỉ có `map: MapType` + `gameType: GameType` → DTO dùng mã đó; `speed`, `startAge` **chưa có trong phòng thật** — bỏ khỏi contract v0 (ghi ở mục Mơ hồ).
- `status` của phòng: `waiting | full | playing`. `locked` trong `RoomStatus` là trạng thái hiển thị (= `hasPassword`) → client suy ra.
- Giới hạn khán giả: 4 thường + 2 QTV (`SPECTATOR_LIMIT`, `MODERATOR_EXTRA_SPECTATORS`) → server kiểm.

### T4 · Phòng chơi — [`roomMock.ts`](../../demo/app/roomMock.ts), [`RoomScreen.tsx`](../../demo/app/screens/RoomScreen.tsx)

| Đọc | Gửi | Nghe |
|---|---|---|
| Snapshot phòng: thông tin phòng, `settings { map, gameType, startNow }`, 8 ghế người chơi `{ player, ready, civ }`, 6 ghế khán giả (2 ghế QTV ở hai đầu), ghế đã đóng, khoá vị trí, chat phòng | `room.leave` · `room.sit { slot }` · `room.setReady { ready }` · `room.setCiv { seat, civ }` (chủ phòng) · `room.updateSettings` (chủ phòng) · `room.moveSlot { from, to }` (chủ phòng kéo thả, đổi chỗ) · `room.setSlotClosed` · `room.kick` · `room.setPositionsLocked` · `room.invite { playerIds }` · `room.start` · `room.cancelCountdown` · `chat.send { channel: room }` | `room.snapshot` · `room.patch` (ghế, sẵn sàng, cài đặt) · `room.countdown { endsAt \| cancelled }` · `room.launch` (thông tin vào game) · `room.kicked` · `room.closed` · `chat.message` |

- Đổi `gameType` → đế chế của mọi ghế về mặc định (`defaultCiv`). **Server làm**, gửi một `room.patch` gồm cả settings lẫn ghế.
- Mọi thao tác chủ phòng đang sinh tin hệ thống tiếng Việt ("Chủ phòng đổi chỗ A và B") → server gửi **tin hệ thống dạng mã + tham số** (`system: { code: "room.seat.swapped", params }`), client dịch.
- Đếm ngược 5 giây và "Vào game ngay": **server là nguồn sự thật** — gửi `endsAt`; client chỉ hiển thị. `TODO(backend)` trong code: gửi cờ `startNow` → đã có trong `settings`.
- `room.launch` mang thứ client cần để mở game (địa chỉ relay / host, cổng, mã phiên, bản đồ, đế chế, màu) — phần mở game do Electron (`DesktopBridge`, bước 5).
- Wireframe §4 cũ có Màu / Đội / AI / tài nguyên / tốc độ — **màn đã dựng không có**. Contract theo màn đã dựng; ghi ở mục Mơ hồ.

### T5 · Giải đấu — [`tournamentMock.ts`](../../demo/app/tournamentMock.ts), [`TournamentScreen.tsx`](../../demo/app/screens/TournamentScreen.tsx)

| Đọc | Gửi | Nghe |
|---|---|---|
| Danh sách giải nhóm theo pha (QTV thấy thêm nháp) · chi tiết giải: thông tin, lịch, luật, đội (4 người, [0] = đội trưởng), trận (nhánh, BoN, từng ván, xử thắng) · chat giải | Người chơi: `tournament.joinTeam { teamId }` (vào / chuyển) · `tournament.leaveTeam` · `tournament.renameTeam` (đội trưởng / QTV). QTV: `tournament.save` (tạo / sửa nháp) · `tournament.publish` · `tournament.kickMember` · `tournament.setCaptain` · `tournament.lockAndDraw` · `tournament.redraw` · `tournament.publishBracket` · `tournament.setMatchResult` · `tournament.setMatchLive` · `tournament.swapBracketTeams` · `tournament.enterMatchRoom` | `tournament.upserted` · `tournament.team.updated` · `tournament.match.updated` · `tournament.phase.changed` · `chat.message` |

- Lý do xử thắng đang là chữ ("Bỏ cuộc", "Trễ giờ", "Khác") → mã `forfeit | late | other` + `note`.
- Bốc thăm nhánh (`drawTournamentBracket`), tự đẩy đội thắng lên vòng sau (`applyMatchResult`), loại đội thiếu người → **server làm**. Client chỉ xem trước khi QTV bấm "Bốc lại".
- `Team.members: Player[]` → DTO trả `PlayerSummary[]` (không cần ping / relation).
- `buildTournamentMatchRoom` tạo phòng cho trận giải → `tournament.enterMatchRoom` trả `roomId`, rồi theo luồng T4.
- `matchRoomOccupancy` (số người trong phòng trận đang đấu) → trường `liveRoom { roomId, players, spectators }` trên trận.

### T6 · Bạn bè & tin nhắn (chưa dựng — theo wireframe §6)

| Đọc | Gửi | Nghe |
|---|---|---|
| Danh sách bạn (presence, hoạt động) · lời mời đến / đã gửi · danh sách chặn · hội thoại riêng (trang tin) | `social.sendRequest` · `social.respondRequest { accept }` · `social.cancelRequest` · `social.removeFriend` · `social.block` / `social.unblock` · `chat.send { channel: dm }` · `chat.typing` · `chat.markRead` | `presence.changed` · `social.request.received` · `social.friend.added` / `removed` · `chat.message` · `chat.typing` |

### T7 · Hồ sơ — [`profileMock.ts`](../../demo/app/profileMock.ts)

| Đọc | Gửi | Nghe |
|---|---|---|
| Hồ sơ: player, ngày tham gia, giới thiệu, danh hiệu, nền, cúp, đế chế ưa thích, clan, các mùa · thống kê (trận, % thắng, elo, elo tuần, chuỗi, giờ chơi), elo 30 ngày, 10 trận gần, top đế chế, theo thể loại, bạn chơi cùng · lịch sử trận (phân trang, lọc) · giải đã tham gia · thành tựu (tiến độ, ghim) · kho đồ + đồ đang dùng (chỉ chủ hồ sơ) · bạn bè, lời mời, bạn chung | `profile.update { bio }` · `profile.pinAchievements { ids }` · `inventory.equip { category, itemId }` · (lệnh bạn bè của T6) | `profile.updated` (khi chính mình đổi ở máy khác) |

- `ProfileData` gom mọi thứ một cục → tách thành 4 lời gọi để tải theo tab: `profile.get` (đầu trang + tổng quan), `profile.matches` (phân trang), `profile.achievements`, `inventory.get`.
- Nhãn hiển thị (`gameTypeLabel`, `mapTypeLabel`, `dateLabel`, `ago`, `result` "Vô địch"…) → client tính từ mã + thời gian.
- `MatchRow.daysAgo` → server trả `playedAt` ISO.
- `bannerBg` / `bgFile` là tên file ảnh → khoá vật phẩm, client đổi ra ảnh.
- Danh mục thành tựu / vật phẩm (`ACHIEVEMENT_CATALOG`, `INVENTORY_CATALOG`) → **danh mục tĩnh** server trả một lần (`catalog.get`), có `version` để client cache.

### T8 · Cài đặt — [`settingsMock.ts`](../../demo/app/settingsMock.ts)

| Đọc | Gửi | Nghe |
|---|---|---|
| — | — | — |

- Toàn bộ cài đặt (đường dẫn game, độ phân giải, voice, phím tắt) **ở máy người chơi** → `DesktopBridge` (bước 5), không qua backend.
- Ngoại lệ cần server: **Kiểm tra mạng** (`runNetworkTest`) đo tới relay → `system.health` (`GET /v1/health`) + đo RTT qua khung WebSocket `ping`. Điều kiện làm trạm TURN (`getTurnStatus`: CGNAT, RAM, pin) → client tự đo; server chỉ cần nhận đăng ký `turn.offer { enabled }` (để mở sau, chưa vào v0).
- Tab Tài khoản (đổi mật khẩu, đăng xuất) chưa dựng — ghi sẵn `auth.changePassword`, `auth.logout`.

### T9 · Kết quả trận (chưa dựng — theo wireframe §9; `MatchResultDialog.tsx` hiện có là hộp kết quả trận **giải** của T5)

| Đọc | Gửi | Nghe |
|---|---|---|
| Kết quả: thắng / thua, thể loại, bản đồ, thời lượng, từng người (đế chế, điểm, quân, công trình, tài nguyên, elo ±), phòng còn không | `room.returnToRoom` (nếu phòng còn) | `match.result` (đẩy khi server nhận kết quả) |

- **Ai báo kết quả trận?** Game chạy ngoài hub. Cần chốt: client đọc kết quả sau game (Electron đọc file / bộ nhớ game) rồi gửi `match.report`, hay relay tự biết. Ghi ở Mơ hồ — ảnh hưởng chống gian lận.

### T10 · Luồng chính

Đăng nhập → trang chủ → sảnh → phòng → sẵn sàng → đếm ngược → mở game → kết quả. Sequence ở [README §4](README.md#4-luồng-chính).

### T11 · Clan — [`clanMock.ts`](../../demo/app/clanMock.ts)

| Đọc | Gửi | Nghe |
|---|---|---|
| Tìm clan (tìm, lọc cách nhận, hạng tối thiểu) · lời mời đã nhận · clan: thông tin, biểu tượng, điểm, hạng #, thành viên (vai, đóng góp, ngày vào, online gần nhất), thông báo (≤ 3 ghim), hoạt động, đơn xin vào, lời mời đã gửi, điểm 12 tuần, thành tích giải · chat clan | `clan.create` · `clan.update` (Trưởng) · `clan.join` (Mở) · `clan.apply { message }` · `clan.cancelApplication` · `clan.respondApplication` · `clan.invite` · `clan.cancelInvite` · `clan.respondInvite` · `clan.setRole` · `clan.kick` · `clan.leave` · `clan.transferLeadership` · `clan.disband { confirmName }` · `clan.postAnnouncement` / `editAnnouncement` / `deleteAnnouncement` / `pinAnnouncement` · `chat.send { channel: clan }` | `clan.updated` · `clan.member.changed` · `clan.activity` · `clan.invite.received` · `clan.application.changed` · `chat.message` |

- `ClanRole` đang là chữ ("Trưởng clan", "Phó") → mã `leader | deputy | member`.
- `RankTier` đang là chữ ("Vàng") → mã `bronze | silver | gold | platinum | diamond`.
- `ClanActivity.text` là câu hoàn chỉnh → `{ code, params }`.
- `canJoinOrApply`, `meetsMinRank` → server kiểm; client dùng để khoá nút (xem [rules.md](rules.md)).

---

## 2. Thực thể dùng chung

| Thực thể | Ở mock | Trong contract | Ghi chú |
|---|---|---|---|
| Người chơi | `Player` (types.ts) | `PlayerSummary` | Bỏ `color`, `ping`, `relation` (theo ngữ cảnh) — `relation` trả riêng trong danh sách bạn / hồ sơ. `rank: string` → `rank: Rank { tier, division, points }`. |
| Avatar | `AvatarSource` | `AvatarDto` | Giữ nguyên dạng (`image` / `initials` / `unit` / `civ`), `image.src` là URL tuyệt đối. |
| Tin chat | `ChatMessageData` | `ChatMessageDto` | Bỏ `sending`, `failed`, `mentionsMe`, `kind: "own"` (client tính). `kind` còn `user \| system \| whisper`. Tin hệ thống = `system { code, params }`. |
| Phòng | `Room` + `LobbyRoom` | `RoomSummary` | Xem T3. |
| Đế chế | `CivId`, `CivChoice` | `CivId`, `CivChoice` | 16 đế chế, mã tiếng Anh, giữ nguyên. |
| Kiến trúc | `Faction` (từ tokens) | `Faction` | 5 giá trị `egyptian \| greek \| babylonian \| asian \| roman`. Contract tự định nghĩa (không phụ thuộc tokens); file kiểm tra khớp ở `demo/app/api/compat.ts`. |
| Màu người chơi | `PlayerNumber` 1–8 | `PlayerColor` | |

## 3. Trường thuần UI (không vào contract)

`sending`, `failed`, `mentionsMe`, `kind: "own"`, `ping` (tới chủ phòng), mọi `*Label`, `ago`, `dateLabel`, `badge`, `locked` (RoomStatus), `RECRUIT_LABEL`, `PHASE_LABEL`, cấu hình mock (`*MockConfig`, `ListState`, `HomeLoadState`…), trạng thái kéo thả, toast.

## 4. Mơ hồ — cần người dùng / backend chốt

1. **Phòng có Màu / Đội / AI / tốc độ / thời đại không?** Wireframe §4 có, màn T4 đã dựng không có. v0 theo màn đã dựng.
2. **Kết quả trận do ai báo** (client sau game, relay, hay QTV nhập)? Ảnh hưởng `match.report` và chống gian lận.
3. **Elo / hạng:** công thức, bậc (`division` I–III?) và mùa. Mock đang ghép "Vàng II" + elo số riêng. v0: `Rank { tier, division?, points }` + `elo` riêng trong thống kê.
4. **QTV (moderator)** là vai toàn hệ thống hay theo giải / phòng? Mock: một cờ toàn cục. v0: `roles: ("moderator" | "admin")[]` trên phiên đăng nhập.
5. **Changelog / hero slide** do backend phục vụ hay file tĩnh đi kèm bản cài? v0: backend (`home.feed`), đổi được.
6. **Clan room** ("Phòng của clan tôi" ở Sảnh): chỉ thành viên clan vào được hay ai cũng vào? v0: `category: "clan"` + `clanTag`; server chặn người ngoài (`ROOM_CLAN_ONLY`).
7. **Lịch sử chat** giữ bao lâu, sảnh có lịch sử khi mới vào không? v0: trả 50 tin gần nhất mỗi kênh.

# Luật nghiệp vụ phía server (Bước 4B · C5)

Các luật dưới đây hiện chạy **ở client trong mock** (cột "Nguồn"). Khi có backend: **server là người quyết định**, trả mã lỗi ở cột "Mã lỗi" khi vi phạm. Client vẫn giữ bản sao luật để khoá / ẩn nút và hiện tooltip lý do (ux-guidelines: nút bị khoá luôn nói lý do), nhưng không được coi kết quả của mình là cuối cùng.

Khi luật đổi: sửa bảng này + hằng số trong [`contract/limits.ts`](../../contract/limits.ts) cùng lúc.

## Phòng chơi (T3 / T4)

| Luật | Nguồn | Mã lỗi |
|---|---|---|
| Phòng có mật khẩu: `room.join` / `room.watch` phải đúng mật khẩu (chủ phòng và QTV cũng vậy? — **chờ chốt**, v0: QTV được bỏ qua) | `LobbyScreen` | `ROOM_WRONG_PASSWORD` |
| 8 ghế người chơi; ghế 0 là chủ phòng, cố định (không kéo, không đóng) | `roomMock` `PLAYER_SEATS`, `RoomScreen` `fixed` | `ROOM_SEAT_TAKEN`, `FORBIDDEN` |
| 6 ghế khán giả: 4 thường + 2 ghế QTV ở hai đầu (chỉ QTV ngồi, không bao giờ bị đóng) | `isModeratorSeat`, `SPECTATOR_LIMIT`, `MODERATOR_EXTRA_SPECTATORS` | `ROOM_SEAT_MODERATOR_ONLY`, `ROOM_SPECTATORS_FULL` |
| QTV vào xem: ngồi ghế QTV trước; người thường: ghế thường trước | `makeRoomSession` | — |
| Ngồi vào ghế (`room.sit`): ghế trống, không đóng; đang đấu thì không vào ghế người chơi, người đang chơi không chuyển sang xem | `RoomScreen` `canSit` | `ROOM_SEAT_TAKEN`, `ROOM_SEAT_CLOSED`, `ROOM_PLAYING` |
| Khoá vị trí: người thường không tự đổi ghế; chủ phòng và QTV vẫn đổi được | `canSit` `positionsLocked` | `ROOM_POSITIONS_LOCKED` |
| Chỉ chủ phòng: đổi cài đặt, chọn đế chế cho ghế, kéo thả ghế, đóng / mở ghế, kích, khoá vị trí, bắt đầu, huỷ đếm ngược | `RoomScreen` `isHost` | `ROOM_NOT_HOST` |
| Kéo thả: không vào ghế cố định / ghế đóng; đang đấu không đổi giữa người chơi ↔ khán giả; ô đích có người → đổi chỗ, giữ `ready` và `civ` khi người đó vẫn là người chơi | `canDrop`, `move`, `put` | `FORBIDDEN`, `ROOM_PLAYING` |
| Đổi `gameType` → đế chế mọi ghế về mặc định (`random` → `random`, `cungr-shang` → `shang`) | `setGameType`, `defaultCiv` | — (server tự làm, gửi một `room.patch`) |
| Bắt đầu: ≥ 2 người chơi và mọi người (trừ chủ phòng) đã sẵn sàng | `RoomScreen` `startBlock` | `ROOM_NOT_ENOUGH_PLAYERS`, `ROOM_PLAYERS_NOT_READY` |
| Đếm ngược 5 s do server giữ (`endsAt`); ai đó bỏ sẵn sàng / rời phòng trong lúc đếm → server tự huỷ đếm ngược | `RoomScreen` `count` | — |
| Hết đếm ngược → server chốt đế chế Random, gán màu, gửi `room.launch` cho từng người | `launchMatch` | — |
| Phòng clan (`category: "clan"`): chỉ thành viên clan đó vào (**chờ chốt**) | — | `ROOM_CLAN_ONLY` |
| Mỗi người chỉ ở một phòng cùng lúc | — (mock không kiểm) | `ROOM_ALREADY_IN_ROOM` |
| Chủ phòng rời → **chờ chốt**: chuyển chủ cho người kế (thứ tự ghế) hay đóng phòng. v0: chuyển chủ; phòng không còn người chơi → đóng (`room.closed`) | — | — |

## Giải đấu (T5)

| Luật | Nguồn | Mã lỗi |
|---|---|---|
| Nháp chỉ QTV thấy; mọi lệnh quản lý chỉ QTV | brief T5 §3.8 | `FORBIDDEN` |
| Đội tối đa 4 người; mỗi người một đội; vào / rời / đổi đội chỉ trong pha `registration` | `TEAM_MAX_MEMBERS`, `TournamentScreen` | `TOURNAMENT_TEAM_FULL`, `TOURNAMENT_TEAMS_LOCKED` |
| Người vào đầu là đội trưởng; đội trưởng rời → quyền sang người vào kế tiếp; đội trống → tên về "Đội <số>" | `leaveCurrentTeam` | — |
| Đổi tên đội: đội trưởng hoặc QTV; 1–24 ký tự, không trùng trong giải | `handleRenameTeam`, `TeamCard` | `TOURNAMENT_NOT_CAPTAIN`, `TOURNAMENT_TEAM_NAME_TAKEN` |
| Sửa giải chỉ tới ngày xếp đội; `drawAt` trước `startAt`; giảm `maxTeams` mà đội bị bỏ còn người → chặn | `TournamentSetupDialog` | `TOURNAMENT_WRONG_PHASE`, `TOURNAMENT_DRAW_BEFORE_START`, `TOURNAMENT_SHRINK_BLOCKED` |
| Chốt đội: đội < `minPerTeam` bị loại; còn lại bốc thăm ngẫu nhiên vào nhánh loại trực tiếp, làm tròn lên luỹ thừa 2, đội bốc ô trống được miễn vòng 1 | `drawTournamentBracket` | — |
| Kết quả trận: Bo1 / Bo3 vòng thường, Bo3 / Bo5 bán kết + chung kết; phải đủ số ván thắng (hoặc xử thắng); đội thắng tự lên ô vòng sau | `applyMatchResult` | `TOURNAMENT_RESULT_INCOMPLETE` |
| Sửa kết quả chỉ khi trận vòng sau chưa có kết quả; không sửa trận miễn đấu / thiếu đội; giải kết thúc thì khoá | `canEditMatchResult` | `TOURNAMENT_RESULT_LOCKED` |
| Kéo đội trong nhánh: trận chưa xong và trận vòng sau chưa xong | `canEditBracketSlot`, `swapBracketTeams` | `TOURNAMENT_RESULT_LOCKED` |
| Chung kết xong → giải sang `finished` | `applyMatchResult` | — |

## Clan (T11)

| Luật | Nguồn | Mã lỗi |
|---|---|---|
| Mỗi người tối đa một clan | brief T11 §3.1 | `CLAN_ALREADY_IN_CLAN` |
| Tối đa 50 thành viên, 3 Phó, đúng 1 Trưởng | `CLAN_MAX_MEMBERS`, `CLAN_MAX_DEPUTIES` | `CLAN_FULL`, `CLAN_DEPUTIES_FULL` |
| Vào / xin vào: cách nhận người khác `closed`, chưa đủ 50, hạng ≥ hạng tối thiểu | `canJoinOrApply`, `meetsMinRank` | `CLAN_RECRUIT_CLOSED`, `CLAN_FULL`, `CLAN_RANK_TOO_LOW` |
| `open` → `clan.join` vào ngay; `approval` → `clan.apply`, mỗi clan một đơn chờ | brief §3.2 | `CLAN_APPLICATION_EXISTS` |
| Lời mời: mọi thành viên mời được; không mời người đã ở clan, đã mời rồi; clan đủ 50 → khoá | `InviteDialog` | `CLAN_ALREADY_IN_CLAN`, `CLAN_ALREADY_INVITED`, `CLAN_FULL` |
| Quyền theo vai (thông báo, duyệt đơn, thăng / giáng, kích, quản lý) — bảng quyền ở brief T11 §3.1 | brief | `FORBIDDEN` |
| Phó chỉ kích Thành viên; Trưởng kích mọi người | brief | `FORBIDDEN` |
| Trưởng rời khi còn người khác → phải chuyển quyền trước; Trưởng là người cuối → rời = giải tán | brief | `CLAN_LEADER_MUST_TRANSFER` |
| Chuyển quyền: Trưởng cũ thành Phó, nếu đã đủ 3 Phó thì thành Thành viên | brief §3.3 | — |
| Giải tán: phải gõ đúng tên clan | brief §3.3 | `CLAN_CONFIRM_NAME_MISMATCH` |
| Thẻ clan không đổi sau khi tạo; tên + thẻ không trùng | brief §3.3 | `CLAN_NAME_TAKEN`, `CLAN_TAG_TAKEN` |
| Ghim thông báo tối đa 3 | `ClanOverviewTab` `MAX_PINNED` | `CLAN_PINS_FULL` |
| Khách (không phải thành viên) không thấy chat clan, đơn xin vào, lời mời đã gửi | brief §3.4 | `FORBIDDEN` |

## Hồ sơ (T7)

| Luật | Nguồn | Mã lỗi |
|---|---|---|
| Ghim tối đa 3 thành tựu, chỉ thành tựu đã đạt | `ProfileScreen` `onTogglePin` | `PROFILE_PINS_FULL`, `FORBIDDEN` |
| Chỉ trang bị vật phẩm đã sở hữu; kho đồ chỉ chủ hồ sơ xem | `PROFILE_TABS` `selfOnly` | `INVENTORY_NOT_OWNED`, `FORBIDDEN` |

## Chat / bạn bè

| Luật | Nguồn | Mã lỗi |
|---|---|---|
| Giới hạn tần suất gửi tin (đề xuất 5 tin / 5 s mỗi kênh) | — | `CHAT_RATE_LIMITED` |
| Người bị chặn: không gửi tin riêng, không gửi lời mời kết bạn / mời phòng | — | `CHAT_BLOCKED_BY_RECIPIENT`, `SOCIAL_BLOCKED` |
| Chat phòng: chỉ người đang trong phòng (người chơi + khán giả) | — | `FORBIDDEN` |

# Danh mục lời gọi và sự kiện

<!-- Sinh tự động bởi tools/build_contract_docs.py từ contract/*.ts — không sửa tay. -->

HTTP: `POST <apiBase>/v1/call/<tên>` · WebSocket: `{ t: "cmd", id, name: <tên>, payload }`. Kiểu payload / result: xem file nguồn ở cột cuối. Quy ước: [conventions.md](conventions.md).

## Truy vấn (không đổi trạng thái) — 26

| Tên | Ghi chú | Nguồn |
|---|---|---|
| `auth.session` | Who am I (on app start with a stored token). | [`auth.ts`](../../contract/auth.ts) |
| `catalog.get` |  | [`player.ts`](../../contract/player.ts) |
| `chat.dmThreads` |  | [`chat.ts`](../../contract/chat.ts) |
| `chat.history` | Newest last. `before` pages back in time. Default 50. | [`chat.ts`](../../contract/chat.ts) |
| `clan.get` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.mine` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.search` |  | [`clan.ts`](../../contract/clan.ts) |
| `home.changelog` |  | [`home.ts`](../../contract/home.ts) |
| `home.feed` |  | [`home.ts`](../../contract/home.ts) |
| `inventory.get` | Mine only. | [`player.ts`](../../contract/player.ts) |
| `lobby.findByCode` |  | [`lobby.ts`](../../contract/lobby.ts) |
| `lobby.listRooms` |  | [`lobby.ts`](../../contract/lobby.ts) |
| `lobby.suggestedRooms` | Home screen "Phòng gợi ý". | [`lobby.ts`](../../contract/lobby.ts) |
| `match.get` |  | [`match.ts`](../../contract/match.ts) |
| `profile.achievements` |  | [`player.ts`](../../contract/player.ts) |
| `profile.friends` |  | [`player.ts`](../../contract/player.ts) |
| `profile.get` |  | [`player.ts`](../../contract/player.ts) |
| `profile.matches` |  | [`player.ts`](../../contract/player.ts) |
| `room.get` |  | [`room.ts`](../../contract/room.ts) |
| `social.friends` |  | [`social.ts`](../../contract/social.ts) |
| `social.online` | Online players in the lobby. | [`social.ts`](../../contract/social.ts) |
| `social.searchPlayers` | Player search (add friend, clan invite, room invite). | [`social.ts`](../../contract/social.ts) |
| `system.health` |  | [`home.ts`](../../contract/home.ts) |
| `tournament.featured` | Home: featured (registering / live / latest champion). | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.get` |  | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.list` | Drafts are returned only to moderators. | [`tournament.ts`](../../contract/tournament.ts) |

## Lệnh (đổi trạng thái, kèm X-Request-Id) — 69

| Tên | Ghi chú | Nguồn |
|---|---|---|
| `auth.changePassword` | Settings › Tài khoản (not built yet). | [`auth.ts`](../../contract/auth.ts) |
| `auth.forgotPassword` | Not built yet ("Quên mật khẩu?" shows "Chưa làm"). Always succeeds to avoid leaking accounts. | [`auth.ts`](../../contract/auth.ts) |
| `auth.login` |  | [`auth.ts`](../../contract/auth.ts) |
| `auth.logout` |  | [`auth.ts`](../../contract/auth.ts) |
| `auth.refresh` |  | [`auth.ts`](../../contract/auth.ts) |
| `auth.register` |  | [`auth.ts`](../../contract/auth.ts) |
| `chat.markRead` |  | [`chat.ts`](../../contract/chat.ts) |
| `chat.send` | Result is the stored message (replace the local "sending" bubble by clientId). | [`chat.ts`](../../contract/chat.ts) |
| `chat.typing` |  | [`chat.ts`](../../contract/chat.ts) |
| `clan.apply` | Recruit "approval"; one pending application per clan. | [`clan.ts`](../../contract/clan.ts) |
| `clan.cancelApplication` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.cancelInvite` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.create` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.deleteAnnouncement` | *Leader / deputy* | [`clan.ts`](../../contract/clan.ts) |
| `clan.disband` | `confirmName` must equal the clan name. | [`clan.ts`](../../contract/clan.ts) |
| `clan.editAnnouncement` | *Leader / deputy* | [`clan.ts`](../../contract/clan.ts) |
| `clan.invite` | Any member. | [`clan.ts`](../../contract/clan.ts) |
| `clan.join` | Recruit "open" and eligible. | [`clan.ts`](../../contract/clan.ts) |
| `clan.kick` | Leader kicks anyone; deputy kicks members only. | [`clan.ts`](../../contract/clan.ts) |
| `clan.leave` | Leader may leave only as the last member (= disband). | [`clan.ts`](../../contract/clan.ts) |
| `clan.pinAnnouncement` | *Leader / deputy* | [`clan.ts`](../../contract/clan.ts) |
| `clan.postAnnouncement` | *Leader / deputy* | [`clan.ts`](../../contract/clan.ts) |
| `clan.respondApplication` | Leader / deputy. | [`clan.ts`](../../contract/clan.ts) |
| `clan.respondInvite` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.setRole` | Leader: member ↔ deputy. | [`clan.ts`](../../contract/clan.ts) |
| `clan.transferLeadership` | Old leader becomes deputy, or member when deputies are full. | [`clan.ts`](../../contract/clan.ts) |
| `clan.update` | Leader. Tag cannot change. | [`clan.ts`](../../contract/clan.ts) |
| `inventory.equip` |  | [`player.ts`](../../contract/player.ts) |
| `match.report` |  | [`match.ts`](../../contract/match.ts) |
| `presence.set` | My own status (Bận / Vắng); "in-game" and "offline" are set by the server. | [`social.ts`](../../contract/social.ts) |
| `profile.pinAchievements` |  | [`player.ts`](../../contract/player.ts) |
| `profile.update` |  | [`player.ts`](../../contract/player.ts) |
| `room.cancelCountdown` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.create` |  | [`room.ts`](../../contract/room.ts) |
| `room.invite` |  | [`room.ts`](../../contract/room.ts) |
| `room.join` | Takes a player seat (first free in fill order). | [`room.ts`](../../contract/room.ts) |
| `room.kick` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.leave` |  | [`room.ts`](../../contract/room.ts) |
| `room.moveSlot` | *Host only* · Drag & drop; swaps when the target is taken. | [`room.ts`](../../contract/room.ts) |
| `room.respondInvite` |  | [`room.ts`](../../contract/room.ts) |
| `room.returnToRoom` | After the result dialog: back into the same room if it still exists. | [`room.ts`](../../contract/room.ts) |
| `room.setCiv` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.setPositionsLocked` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.setReady` |  | [`room.ts`](../../contract/room.ts) |
| `room.setSlotClosed` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.sit` | Me moving to a free seat (player ↔ spectator allowed while waiting). | [`room.ts`](../../contract/room.ts) |
| `room.start` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.updateSettings` | *Host only* | [`room.ts`](../../contract/room.ts) |
| `room.watch` | Takes a spectator seat; moderators get a moderator seat first. | [`room.ts`](../../contract/room.ts) |
| `social.block` |  | [`social.ts`](../../contract/social.ts) |
| `social.cancelRequest` |  | [`social.ts`](../../contract/social.ts) |
| `social.removeFriend` |  | [`social.ts`](../../contract/social.ts) |
| `social.respondRequest` |  | [`social.ts`](../../contract/social.ts) |
| `social.sendRequest` |  | [`social.ts`](../../contract/social.ts) |
| `social.unblock` |  | [`social.ts`](../../contract/social.ts) |
| `tournament.enterMatchRoom` | *Player* · Playing phase: opens / creates the room of a live match (watch, or play for the two teams). | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.joinTeam` | *Player* · Registration phase. Join a team, or switch from my current team (captain rights pass to the next member). | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.kickMember` | *Moderator* | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.leaveTeam` | *Player* · Registration phase. | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.lockAndDraw` | *Moderator* · Lock teams, drop short teams, draw a bracket preview (phase → drawing). | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.publish` | *Moderator* | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.publishBracket` | *Moderator* · Phase → playing. | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.redraw` | *Moderator* | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.renameTeam` | *Player* · Captain of the team, or moderator. Empty name = back to "Đội <number>". | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.save` | *Moderator* · Create (no id) or edit. New tournaments start as draft. | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.setCaptain` | *Moderator* | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.setMatchLive` | *Moderator* | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.setMatchResult` | *Moderator* · Either games (enough wins for BoN) or forfeit. Allowed while the next-round match has no result. | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.swapBracketTeams` | *Moderator* · Drag & drop in the bracket. Same round: swap the two slots. Different round: put the `from` team into the `to` slot (the `from` slot keeps it). Only editable matches (not done, next round not done). | [`tournament.ts`](../../contract/tournament.ts) |

## Sự kiện realtime (server → client) — 33

| Tên | Chủ đề | Ghi chú | Nguồn |
|---|---|---|---|
| `achievement.unlocked` | `"me"` |  | [`player.ts`](../../contract/player.ts) |
| `auth.sessionEnded` | `"me"` | Signed in elsewhere / banned / password changed: the client returns to the login screen. | [`auth.ts`](../../contract/auth.ts) |
| `chat.message` | `string` | Topic follows the channel: lobby, room:<id>, tournament:<id>, clan:<tag>, dm:<otherPlayerId>. | [`chat.ts`](../../contract/chat.ts) |
| `chat.typing` | `dm:{PlayerId}` |  | [`chat.ts`](../../contract/chat.ts) |
| `clan.activity` | `clan:{ClanTag}` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.announcement.changed` | `clan:{ClanTag}` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.application.changed` | `clan:{ClanTag}` | Leader / deputy only. `request` absent = resolved / cancelled. | [`clan.ts`](../../contract/clan.ts) |
| `clan.invite.received` | `"me"` |  | [`clan.ts`](../../contract/clan.ts) |
| `clan.member.changed` | `clan:{ClanTag}` | Join, leave, kick, role change; `member` absent = removed. | [`clan.ts`](../../contract/clan.ts) |
| `clan.membership.changed` | `"me"` | My membership changed (accepted, kicked, disbanded) → reload clan.mine. | [`clan.ts`](../../contract/clan.ts) |
| `clan.updated` | `clan:{ClanTag}` |  | [`clan.ts`](../../contract/clan.ts) |
| `lobby.room.removed` | `"lobby"` |  | [`lobby.ts`](../../contract/lobby.ts) |
| `lobby.room.upserted` | `"lobby"` | New room or any listed field changed (players, status…). Topic "lobby". | [`lobby.ts`](../../contract/lobby.ts) |
| `match.result` | `"me"` |  | [`match.ts`](../../contract/match.ts) |
| `presence.changed` | `"presence"` | Friends' presence, and anyone in a room / lobby list I am subscribed to. | [`social.ts`](../../contract/social.ts) |
| `profile.updated` | `"me"` | My own profile changed from another device, or a new achievement / item. | [`player.ts`](../../contract/player.ts) |
| `room.closed` | `room:{RoomId}` |  | [`room.ts`](../../contract/room.ts) |
| `room.invite.received` | `"me"` |  | [`room.ts`](../../contract/room.ts) |
| `room.kicked` | `"me"` |  | [`room.ts`](../../contract/room.ts) |
| `room.launch` | `"me"` | Countdown ended: everyone in the room gets their own launch info on topic "me". | [`room.ts`](../../contract/room.ts) |
| `room.patch` | `room:{RoomId}` |  | [`room.ts`](../../contract/room.ts) |
| `room.snapshot` | `room:{RoomId}` |  | [`room.ts`](../../contract/room.ts) |
| `social.friend.added` | `"me"` |  | [`social.ts`](../../contract/social.ts) |
| `social.friend.removed` | `"me"` |  | [`social.ts`](../../contract/social.ts) |
| `social.request.received` | `"me"` |  | [`social.ts`](../../contract/social.ts) |
| `social.request.resolved` | `"me"` |  | [`social.ts`](../../contract/social.ts) |
| `system.notice` | `"me"` | Broadcast notice ("Bảo trì lúc 23:00"), shown in the lobby chat as a system line and as a toast. | [`home.ts`](../../contract/home.ts) |
| `tournament.match.updated` | `string` | Also on topic "tournaments" while live, for the home screen block. | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.phase.changed` | `tournament:{TournamentId}` |  | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.settings.changed` | `tournament:{TournamentId}` |  | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.snapshot` | `tournament:{TournamentId}` |  | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.team.updated` | `tournament:{TournamentId}` |  | [`tournament.ts`](../../contract/tournament.ts) |
| `tournament.upserted` | `"tournaments"` | List rows (topic "tournaments" — anyone on the tournament or home screen). | [`tournament.ts`](../../contract/tournament.ts) |

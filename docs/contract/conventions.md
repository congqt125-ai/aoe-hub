# Quy ước contract (Bước 4B · C2)

Áp dụng cho mọi lời gọi HTTP và tin WebSocket giữa hub (client) và backend. Kiểu TypeScript tương ứng ở [`contract/common.ts`](../../contract/common.ts) và [`contract/transport.ts`](../../contract/transport.ts). Phiên bản contract: **v0 (nháp)** — chưa hứa giữ tương thích cho tới khi lên `v1`.

## 1. Đặt tên

- Trường JSON: `camelCase`. Giá trị enum: chữ thường, nối bằng `-` khi nhiều từ (`in-game`, `cungr-shang`) — giữ đúng giá trị client đang dùng.
- Lệnh: `<module>.<động từ>` (`room.setReady`). Sự kiện: `<module>.<danh từ>.<quá khứ>` hoặc `<module>.<danh từ>` (`room.countdown`, `chat.message`, `lobby.room.upserted`).
- Không có chữ tiếng Việt hiển thị trong dữ liệu server sinh ra. Chữ do **người dùng nhập** (tên phòng, chat, giới thiệu, luật giải) thì giữ nguyên Unicode (NFC).

## 2. Kiểu cơ bản

| Kiểu | Quy ước |
|---|---|
| Id | Chuỗi mờ (`string`), client không đoán cấu trúc. Tiền tố gợi ý: `pl_`, `rm_`, `tn_`, `tm_`, `mt_`, `cl_`, `msg_`. Thẻ clan (`tag`) và mã phòng (`code`, 4 chữ số) là khoá thứ hai cho người dùng gõ, không thay id. |
| Thời gian | Chuỗi ISO 8601 UTC có `Z`, độ chính xác mili giây: `2026-11-14T13:05:00.000Z`. Client đổi sang giờ máy khi hiển thị. Khoảng thời gian: số giây (`durationSec`). |
| Số | Số nguyên trừ khi ghi rõ. Phần trăm: 0–100 (số thực một chữ số thập phân). |
| Tuỳ chọn | Trường không có = bỏ hẳn khỏi JSON (không gửi `null`). `null` chỉ dùng khi "rỗng" có nghĩa riêng (ghế trống: `null`). |
| Ảnh | Server trả URL tuyệt đối (`https://…`) hoặc **khoá asset** của client (`assetKey`, ví dụ `bg/village-dusk`). Không trả đường dẫn file máy. |

## 3. HTTP

- Gốc: `<apiBase>/v1/…` — `apiBase` lấy từ cấu hình (`VITE_HUB_API_URL`, sau này Electron). Tiền tố phiên bản nằm trên đường dẫn.
- **Kiểu RPC:** mọi truy vấn và lệnh là `POST <apiBase>/v1/call/<tên>` với thân JSON = payload (`POST /v1/call/room.setReady` ≡ lệnh WebSocket `room.setReady`). Lý do: payload truy vấn có object lồng nhau (`chat.history { channel: { kind, roomId } }`) khó đưa vào query string, và một kiểu duy nhất thì ánh xạ 1-1 sang WebSocket. Ngoại lệ duy nhất: `GET /v1/health` (không cần đăng nhập).
- **Truy vấn** (`Queries` trong [`contract/api.ts`](../../contract/api.ts)) không đổi trạng thái → gọi lại, cache, tải trước thoải mái. **Lệnh** (`Commands`) đổi trạng thái → luôn kèm `X-Request-Id`.
- Header:
  - `Authorization: Bearer <accessToken>` (trừ `auth.login`, `auth.register`, `auth.refresh`, `GET /v1/health`).
  - `X-Request-Id: <uuid>` cho mọi lệnh — server nhớ ít nhất 10 phút, gửi lại cùng id trả **đúng kết quả cũ**, không làm lại (chống bấm hai lần / mạng chập chờn gửi lại).
  - `X-Client-Version: <semver>` — server từ chối bản quá cũ bằng `CLIENT_OUTDATED`.
  - `Accept-Language: vi` (để sau; server hiện không trả chữ hiển thị).
- Thành công: `200` + thân là kết quả trực tiếp (không bọc `{ data }`). Lệnh không có kết quả: `200 {}`.
- Lỗi: mã HTTP hợp lý (`400` dữ liệu sai, `401` chưa đăng nhập / token hết hạn, `403` không đủ quyền, `404`, `409` xung đột trạng thái, `429`, `5xx`) + thân `ApiError`.

## 4. Lỗi

```json
{ "code": "ROOM_FULL", "message": "room rm_123 is full", "details": { "maxPlayers": 8 }, "requestId": "…" }
```

- `code` ổn định, viết hoa `MODULE_LÝ_DO`; danh sách ở [`contract/errors.ts`](../../contract/errors.ts). Client chỉ dựa vào `code` để chọn câu tiếng Việt; `message` là tiếng Anh cho log, **không hiển thị**.
- Lỗi theo ô form: `details.fields: { [field]: code }` (ví dụ `{ "tag": "CLAN_TAG_TAKEN" }`) để client gắn lỗi dưới đúng ô như màn Đăng nhập.
- Mã lạ (client cũ gặp mã mới) → client hiện câu chung "Có lỗi xảy ra (MÃ)".
- Lỗi mạng do client tự sinh (không từ server): `NETWORK_OFFLINE`, `NETWORK_TIMEOUT`.

## 5. Phân trang

- Theo con trỏ: truy vấn nhận `{ cursor?, limit? }` (`limit` mặc định 20, tối đa 100), trả `Page<T> { items, nextCursor? }`. Không có `nextCursor` = hết.
- Không trả tổng số trừ khi màn cần (ví dụ `n/50` thành viên → có sẵn trong thực thể cha, không cần `total`).
- Chat: phân trang ngược (`before: messageId`) — tin mới nhất ở cuối mảng, giống thứ tự hiển thị.

## 6. WebSocket

- Một kết nối mỗi phiên: `wss://<host>/v1/ws?token=<accessToken>` (token hết hạn → server đóng với mã `4401`, client làm mới token rồi nối lại).
- Mọi tin là JSON một dòng, khung `WsFrame`:

| Hướng | Khung | Ý nghĩa |
|---|---|---|
| client → server | `{ "t": "cmd", "id": "<requestId>", "name": "room.setReady", "payload": { … } }` | Lệnh (cùng tên và payload với HTTP). |
| server → client | `{ "t": "ack", "id": "<requestId>", "result": { … } }` hoặc `{ "t": "ack", "id": "…", "error": ApiError }` | Trả lời đúng một lệnh. |
| server → client | `{ "t": "evt", "seq": 1042, "name": "room.patch", "topic": "room:rm_123", "payload": { … } }` | Sự kiện. |
| client → server | `{ "t": "sub", "topics": ["room:rm_123"] }` / `{ "t": "unsub", … }` | Đăng ký nhận theo chủ đề. |
| hai chiều | `{ "t": "ping", "at": 1731589500000 }` / `{ "t": "pong", "at": … }` | Giữ kết nối mỗi 20 s + đo RTT (dùng cho chỉ báo ping máy chủ). |

- **Chủ đề (`topic`)**: `lobby`, `room:<id>`, `tournament:<id>`, `clan:<tag>`, `dm:<playerId>`, `me` (sự kiện riêng của mình: lời mời, bị kích, kết quả trận). Server tự cho vào `me` và `presence` của bạn bè; các chủ đề khác client đăng ký khi mở màn, huỷ khi rời.
- **`seq`**: tăng dần **theo từng chủ đề**. Client nhớ `seq` cuối của mỗi chủ đề.
- **Nối lại:** client gửi `{ "t": "sub", "topics": [...], "since": { "room:rm_123": 1042 } }`. Server gửi bù các sự kiện sau `seq` đó nếu còn giữ; không giữ được thì gửi `…snapshot` của chủ đề (ví dụ `room.snapshot`) và client thay toàn bộ trạng thái. Backoff nối lại: 1 s, 2 s, 4 s … tối đa 30 s, có nhiễu ngẫu nhiên.
- **Snapshot + patch:** với trạng thái nhiều người cùng sửa (phòng, giải), sự kiện đầu tiên sau `sub` luôn là snapshot; sau đó là patch. Patch là **trạng thái mới của phần bị đổi** (ghế thứ i, `settings`…), không phải phép toán — áp dụng lại nhiều lần vẫn ra cùng kết quả.
- **Thời gian phía server là chuẩn:** đếm ngược, hạn đăng ký giải… gửi mốc `endsAt` (ISO). Client tính độ lệch đồng hồ từ `pong` (`serverNow`) để hiển thị đúng.

## 7. Lệnh và quyền

- Client có thể khoá / ẩn nút theo luật ở [rules.md](rules.md), nhưng **server luôn kiểm lại**; vi phạm trả `403 FORBIDDEN` (thiếu quyền) hoặc `409` + mã cụ thể (trạng thái không cho phép).
- Lệnh thành công **không** cần client tự sửa trạng thái theo kết quả trả về nếu lệnh đó có sự kiện tương ứng — sự kiện là nguồn sự thật (tránh lệch giữa người bấm và người khác). Kết quả trả về chỉ dùng cho thứ riêng của người bấm (ví dụ `room.create` trả `roomId` để chuyển màn).
- Tin hệ thống trong chat: `{ "kind": "system", "system": { "code": "room.seat.swapped", "params": { "a": "pl_1", "b": "pl_2" } } }` — client dịch câu và tra tên người từ id.

## 8. Mở rộng và phiên bản

- **Không phá client cũ:** được thêm trường tuỳ chọn, thêm lệnh / sự kiện mới, thêm giá trị enum. Client phải bỏ qua trường lạ và sự kiện lạ; enum lạ → xử lý như giá trị "khác" (mỗi enum hiển thị có nhánh mặc định).
- **Phá:** đổi tên / bỏ trường, đổi nghĩa → lên `/v2`, server giữ `/v1` song song tới khi bản cài cũ hết dùng.
- Thay đổi contract ghi ở đầu [`contract/index.ts`](../../contract/index.ts) (`CONTRACT_VERSION`) và trong [README](README.md#5-nhật-ký-thay-đổi).

## 9. Giới hạn (server kiểm, client kiểm sớm để báo lỗi dưới ô)

Hằng số tương ứng ở [`contract/limits.ts`](../../contract/limits.ts).

| Trường | Giới hạn |
|---|---|
| Tên đăng nhập | 3–16 ký tự, chữ (có dấu) / số / `_` `.`, không dấu cách (`LoginScreen` `validateRegister`) |
| Mật khẩu | ≥ 6 ký tự (như màn Đăng ký) |
| Tên phòng | 1–40 ký tự · mật khẩu phòng 0–20 (`CreateRoomDialog`) |
| Tin chat | 1–300 ký tự; 5 tin / 5 s mỗi kênh (`CHAT_RATE_LIMITED`) — **đề xuất**, màn chưa giới hạn |
| Tên giải | 1–60 (`TournamentSetupDialog`; brief T5 ghi 40 — chờ chốt) · giải thưởng ≤ 40 · tên đội 1–24, không trùng trong giải · ghi chú kết quả trận ≤ 120 |
| Tên clan | 3–24 · thẻ 2–4 ký tự `A–Z0–9` · giới thiệu ≤ 200 · đơn xin vào ≤ 140 · thông báo ≤ 300, ghim ≤ 3 |
| Hồ sơ | thành tựu ghim ≤ 3 · giới thiệu ≤ 200 (**đề xuất**, màn chưa sửa được) |

// Mock data for the gallery (and later the screen templates). Not part of the component library.
import type { ChatMessageData, Player, Room, SlotData } from "../../components";

export const players: Record<string, Player> = {
  me: { id: "me", name: "lan_hylap", status: "online", color: 1, ping: 42, rank: "Vàng II", relation: "none" },
  minh: { id: "minh", name: "Minh Babylon", status: "in-game", color: 2, ping: 88, activity: "Đang chơi: Đồng cỏ 2v2", relation: "friend", avatar: { kind: "unit", frame: 3 } },
  thu: { id: "thu", name: "thu.ai_cap", status: "away", color: 3, ping: 130, relation: "friend", avatar: { kind: "civ", faction: "egyptian" } },
  hoang: { id: "hoang", name: "Hoàng La Mã", status: "online", color: 6, ping: 210, relation: "none" },
  long: { id: "long", name: "Long Á Đông", status: "busy", color: 5, ping: 320, relation: "none", avatar: { kind: "unit", frame: 10 } },
  spam: { id: "spam", name: "xX_spam_Xx", status: "offline", ping: null, relation: "blocked" },
};

export const rooms: Room[] = [
  { id: "r1", name: "4v4 Đồng cỏ — vào là chơi", host: players.minh, map: "Đồng cỏ", mode: "Ngẫu nhiên", speed: "Bình thường", startAge: "Thời Đồ đá", players: 5, maxPlayers: 8, ping: 64, status: "waiting", hasPassword: false },
  { id: "r2", name: "Luyện tập 1v1", host: players.thu, map: "Sông ngòi", mode: "Chinh phục", speed: "Nhanh", startAge: "Thời Công cụ", players: 2, maxPlayers: 2, ping: 140, status: "playing", hasPassword: true },
  { id: "r3", name: "Đội Hy Lạp tuyển quân", host: players.hoang, map: "Đảo lớn", mode: "Kỳ quan", speed: "Chậm", startAge: "Thời Đồng", players: 8, maxPlayers: 8, ping: 230, status: "full", hasPassword: false },
];

const t = (min: number) => new Date(Date.UTC(2026, 10, 11, 13, min)).toISOString();

export const messages: ChatMessageData[] = [
  { id: "m1", kind: "system", text: "Minh Babylon đã vào phòng.", at: t(0) },
  { id: "m2", kind: "user", author: players.minh, text: "Ai vào phòng 4v4 không? Còn 3 chỗ.", at: t(1) },
  { id: "m3", kind: "user", author: players.minh, text: "Luật: không rush trước phút 15.", at: t(1) },
  { id: "m4", kind: "own", author: players.me, text: "Cho mình 1 chỗ, @Minh nhé", at: t(2) },
  { id: "m5", kind: "user", author: players.thu, text: "@lan_hylap vào đội mình đi", at: t(3), mentionsMe: true },
  { id: "m6", kind: "whisper", author: players.hoang, text: "Tối nay đánh xếp hạng không?", at: t(4) },
  { id: "m7", kind: "own", author: players.me, text: "Đang gửi…", at: t(5), sending: true },
  { id: "m8", kind: "own", author: players.me, text: "Tin này gửi lỗi", at: t(5), failed: true },
  { id: "m9", kind: "system", text: "Luật phòng: https://aoe.example/luat", at: t(6) },
];

export const slots: SlotData[] = [
  { index: 0, state: "player", player: players.minh, faction: "babylonian", color: 2, team: 1, ready: true, isHost: true },
  { index: 1, state: "player", player: players.me, faction: "greek", color: 1, team: 1, ready: false },
  { index: 2, state: "ai", player: { id: "ai1", name: "Máy (Khó)", status: "online" }, faction: "random", color: 3, team: 2, ready: true },
  { index: 3, state: "player", player: players.thu, faction: "egyptian", color: 4, team: 2, ready: true, disconnected: true },
  { index: 4, state: "open", color: 5 },
  { index: 5, state: "closed", color: 6 },
];

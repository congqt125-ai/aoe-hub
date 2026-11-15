import {
  Avatar, Button, EmptyState, ListRow, Tooltip,
} from "../../../../components";
import { CLAN_MAX_MEMBERS, type Clan, type ClanSentInvite, type JoinRequest } from "../../clanMock";

/** T11 §3.3 — Tab Đơn xin vào & Lời mời đã gửi (Trưởng / Phó). */
export function ClanRequestsTab({
  clan,
  onApprove,
  onReject,
  onCancelSentInvite,
}: {
  clan: Clan;
  onApprove: (req: JoinRequest) => void;
  onReject: (req: JoinRequest) => void;
  onCancelSentInvite: (inv: ClanSentInvite) => void;
}) {
  const isFull = clan.members.length >= CLAN_MAX_MEMBERS;

  return (
    <div className="flex flex-col gap-5">
      {/* Pending join requests */}
      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
          Đơn xin vào ({clan.requests.length})
        </h2>

        {clan.requests.length === 0 ? (
          <div className="bg-black/35 bevel-sunken-1">
            <EmptyState
              title="Không có đơn nào đang chờ"
              description="Khi có người chơi gửi đơn xin gia nhập clan, danh sách sẽ hiển thị tại đây."
              art={{ set: "building:greek", frame: 4 }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clan.requests.map((req) => (
              <ListRow
                key={req.id}
                size="lg"
                className="bg-black/35 bevel-sunken-1"
                leading={<Avatar size="sm" name={req.player.name} source={req.player.avatar} />}
                trailing={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        location.hash = `#/profile/${encodeURIComponent(req.player.id)}`;
                      }}
                    >
                      Xem hồ sơ
                    </Button>
                    {isFull ? (
                      <Tooltip content="Clan đã đủ 50 thành viên">
                        <span tabIndex={0} className="inline-flex cursor-not-allowed">
                          <Button size="sm" variant="primary" disabled className="pointer-events-none">
                            Duyệt
                          </Button>
                        </span>
                      </Tooltip>
                    ) : (
                      <Button size="sm" variant="primary" onClick={() => onApprove(req)}>
                        Duyệt
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => onReject(req)}>
                      Từ chối
                    </Button>
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-bold text-tone-focus">
                    {req.player.name}
                  </span>
                  <span className="text-xs text-tone-text/70">
                    {req.player.rank ?? "Chưa có hạng"} · {req.at}
                  </span>
                </div>
                <div className="truncate text-xs text-tone-text/85">
                  {req.message || "Không có lời nhắn."}
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </section>

      {/* Sent invitations */}
      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
          Lời mời đã gửi ({clan.invitesSent.length})
        </h2>

        {clan.invitesSent.length === 0 ? (
          <div className="bg-black/30 px-4 py-3 text-sm italic text-tone-text/55 bevel-sunken-1">
            Chưa có lời mời nào đang chờ phản hồi.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {clan.invitesSent.map((inv) => (
              <ListRow
                key={inv.id}
                size="md"
                className="bg-black/35 bevel-sunken-1"
                leading={<Avatar size="sm" name={inv.player.name} source={inv.player.avatar} />}
                trailing={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onCancelSentInvite(inv)}
                  >
                    Huỷ lời mời
                  </Button>
                }
              >
                <div className="font-semibold text-tone-text">{inv.player.name}</div>
                <div className="text-xs text-tone-text/65">
                  Người mời: {inv.inviterName} · {inv.at}
                </div>
              </ListRow>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


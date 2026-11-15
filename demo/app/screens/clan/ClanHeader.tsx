import { useState } from "react";
import { Button, Dialog, Icon, Tooltip, type Player } from "../../../../components";
import {
  canJoinOrApply, CLAN_MAX_MEMBERS, RECRUIT_LABEL, type Clan, type ClanRole,
} from "../../clanMock";
import { useProfile } from "../../profile";
import { ClanEmblemBadge } from "./ClanEmblemBadge";

/** T11 §3.3 & §3.4 — Đầu trang Clan (chế độ thành viên & chế độ khách). */
export function ClanHeader({
  clan,
  me,
  myRole,
  hasAnyClan,
  isApplied,
  onOpenInvite,
  onLeaveClan,
  onOpenManage,
  onJoinOpenClan,
  onApplyClan,
  onCancelApplication,
}: {
  clan: Clan;
  me: Player;
  /** Defined when viewer is a member of this clan. */
  myRole?: ClanRole;
  /** True when viewer belongs to a different clan (guest mode). */
  hasAnyClan: boolean;
  isApplied: boolean;
  onOpenInvite: () => void;
  onLeaveClan: () => void;
  onOpenManage: () => void;
  onJoinOpenClan: () => void;
  onApplyClan: () => void;
  onCancelApplication: () => void;
}) {
  const profile = useProfile();
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const leader = clan.members.find((m) => m.role === "Trưởng clan");
  const isMember = Boolean(myRole);
  const isLeader = myRole === "Trưởng clan";
  const leaderBlockedFromLeaving = isLeader && clan.members.length > 1;
  const isLastMember = isLeader && clan.members.length === 1;

  const guestCheck = canJoinOrApply(clan, me.rank);

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-4 bg-black/55 px-5 py-4 bevel-raised">
      {/* Left: emblem + clan identity + metadata */}
      <div className="flex min-w-0 items-center gap-4">
        <ClanEmblemBadge emblem={clan.emblem} size="lg" />

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 font-heading text-2xl font-bold text-tone-focus">
              [{clan.tag}] {clan.name}
            </h1>
            <span className="bg-black/55 px-2 py-0.5 font-heading text-xs font-semibold tabular text-tone-state bevel-sunken-1">
              Điểm {clan.points.toLocaleString("vi-VN")} · Hạng #{clan.rankPosition}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tone-text/85">
            <span className="tabular font-semibold">
              {clan.members.length}/{CLAN_MAX_MEMBERS} thành viên
            </span>
            <span aria-hidden className="text-tone-text/40">·</span>
            <span>
              Trưởng clan:{" "}
              {leader ? (
                <button
                  type="button"
                  onClick={(e) => profile.open(leader.player, e.currentTarget)}
                  className="font-semibold text-tone-focus hover:underline focus-visible:outline-game-out"
                >
                  {leader.player.name}
                </button>
              ) : (
                "—"
              )}
            </span>
            <span aria-hidden className="text-tone-text/40">·</span>
            <span>Thành lập {clan.foundedAt}</span>
            <span aria-hidden className="text-tone-text/40">·</span>
            <span>{RECRUIT_LABEL[clan.recruit]}</span>
            {clan.minRank && (
              <>
                <span aria-hidden className="text-tone-text/40">·</span>
                <span>Tối thiểu: {clan.minRank}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {isMember ? (
          <>
            <Button
              size="sm"
              variant="primary"
              icon={<Icon name="plus" size={16} />}
              onClick={onOpenInvite}
            >
              Mời người
            </Button>

            {leaderBlockedFromLeaving ? (
              <Tooltip content="Chuyển quyền Trưởng clan trước khi rời">
                <span tabIndex={0} className="inline-flex cursor-not-allowed">
                  <Button size="sm" variant="secondary" disabled className="pointer-events-none">
                    Rời clan
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setLeaveConfirmOpen(true)}
              >
                Rời clan
              </Button>
            )}

            {isLeader && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Icon name="settings" size={16} />}
                onClick={onOpenManage}
              >
                Quản lý
              </Button>
            )}
          </>
        ) : hasAnyClan ? (
          <span className="bg-black/45 px-3 py-1.5 text-xs font-semibold text-tone-text/80 bevel-sunken-1">
            Bạn đang ở clan khác
          </span>
        ) : isApplied ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-success-on-dark">Đã gửi đơn</span>
            <Button size="sm" variant="secondary" onClick={onCancelApplication}>
              Huỷ đơn
            </Button>
          </div>
        ) : !guestCheck.allowed ? (
          <Tooltip content={guestCheck.reason ?? "Không thể tham gia"}>
            <span tabIndex={0} className="inline-flex cursor-not-allowed">
              <Button size="sm" variant="secondary" disabled className="pointer-events-none">
                {clan.recruit === "open" ? "Vào clan" : clan.recruit === "closed" ? "Đóng" : "Xin vào"}
              </Button>
            </span>
          </Tooltip>
        ) : clan.recruit === "open" ? (
          <Button size="sm" variant="primary" onClick={onJoinOpenClan}>
            Vào clan
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={onApplyClan}>
            Xin vào
          </Button>
        )}
      </div>

      {leaveConfirmOpen && (
        <Dialog
          title={isLastMember ? "Rời & giải tán clan" : "Rời clan"}
          size="sm"
          onClose={() => setLeaveConfirmOpen(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setLeaveConfirmOpen(false)}>
                Ở lại
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setLeaveConfirmOpen(false);
                  onLeaveClan();
                }}
              >
                {isLastMember ? "Rời & giải tán" : "Xác nhận rời"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-tone-text/90">
            {isLastMember
              ? `Bạn là thành viên cuối cùng của [${clan.tag}] ${clan.name}. Rời clan đồng nghĩa với giải tán clan này.`
              : `Bạn có chắc muốn rời khỏi clan [${clan.tag}] ${clan.name}?`}
          </p>
        </Dialog>
      )}
    </header>
  );
}


import { useMemo, useState } from "react";
import {
  Avatar, Button, Dialog, SearchBar, Tooltip, type Player,
} from "../../../../components";
import { players as basePlayers } from "../../../shared/mock";
import { CLAN_MAX_MEMBERS, type Clan } from "../../clanMock";
import { makePlayers } from "../../lobbyMock";

/** T11 §3.3 — Hộp thoại mời người chơi vào clan. */
export function InviteDialog({
  clan,
  allClans,
  onInvite,
  onClose,
}: {
  clan: Clan;
  allClans: Clan[];
  onInvite: (player: Player) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const isFull = clan.members.length >= CLAN_MAX_MEMBERS;

  const candidates = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of [...Object.values(basePlayers), ...makePlayers(24)]) {
      map.set(p.id, p);
    }
    const q = query.trim().toLowerCase();
    return [...map.values()].filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Dialog
      title={`Mời người vào [${clan.tag}]`}
      size="md"
      onClose={onClose}
      actions={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <SearchBar
          label="Tìm người chơi"
          placeholder="Nhập tên người chơi…"
          onSearch={setQuery}
        />

        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {candidates.map((p) => {
            const inThisClan = clan.members.some((m) => m.player.id === p.id);
            const otherClan = allClans.find(
              (c) => c.tag !== clan.tag && c.members.some((m) => m.player.id === p.id),
            );
            const alreadyInvited = clan.invitesSent.some((inv) => inv.player.id === p.id);

            let action: React.ReactNode;
            if (inThisClan) {
              action = (
                <Button size="sm" variant="secondary" disabled>
                  Đã là thành viên
                </Button>
              );
            } else if (otherClan) {
              action = (
                <Tooltip content={`Đã ở clan [${otherClan.tag}]`}>
                  <span tabIndex={0} className="inline-flex cursor-not-allowed">
                    <Button size="sm" variant="secondary" disabled className="pointer-events-none">
                      Đã ở clan [{otherClan.tag}]
                    </Button>
                  </span>
                </Tooltip>
              );
            } else if (alreadyInvited) {
              action = (
                <Button size="sm" variant="secondary" disabled>
                  Đã mời
                </Button>
              );
            } else if (isFull) {
              action = (
                <Tooltip content="Clan đã đủ 50 thành viên">
                  <span tabIndex={0} className="inline-flex cursor-not-allowed">
                    <Button size="sm" variant="secondary" disabled className="pointer-events-none">
                      Mời
                    </Button>
                  </span>
                </Tooltip>
              );
            } else {
              action = (
                <Button size="sm" variant="primary" onClick={() => onInvite(p)}>
                  Mời
                </Button>
              );
            }

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-black/35 px-3 py-2 bevel-sunken-1"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm" name={p.name} source={p.avatar} status={p.status} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-tone-text">{p.name}</div>
                    <div className="text-xs text-tone-text/65">{p.rank ?? "Chưa có hạng"}</div>
                  </div>
                </div>
                <div className="shrink-0">{action}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}


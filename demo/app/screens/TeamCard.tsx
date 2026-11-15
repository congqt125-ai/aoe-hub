import { useEffect, useRef, useState } from "react";
import {
  Avatar, Button, Icon, Input, PingIndicator, Tooltip, type MenuEntry, type Player,
} from "../../../components";
import { useProfile } from "../profile";
import { TEAM_MAX_MEMBERS, teamDisplayName, type Team } from "../tournamentMock";
import { LINE } from "./panel";

const TEAM_NAME_MAX = 24;

export interface TeamCardProps {
  team: Team;
  me: Player;
  myTeamId: string | null;
  locked: boolean;
  moderator: boolean;
  /** Other team display names (lowercase) for duplicate check when renaming. */
  takenNames: Set<string>;
  onJoinOrSwitch: (team: Team) => void;
  onRename: (teamId: string, nextName: string) => void;
  onKickMember: (teamId: string, member: Player) => void;
  onPromoteCaptain: (teamId: string, member: Player) => void;
}

/**
 * Registration team card (4 per row): header with team name + inline rename + n/8,
 * 8 fixed vertical player slots (index 0 = captain), and action button at the bottom.
 */
export function TeamCard({
  team, me, myTeamId, locked, moderator, takenNames,
  onJoinOrSwitch, onRename, onKickMember, onPromoteCaptain,
}: TeamCardProps) {
  const profile = useProfile();
  const isMyTeam = myTeamId === team.id;
  const isCaptain = team.members[0]?.id === me.id;
  const isFull = team.members.length >= TEAM_MAX_MEMBERS;
  const isEmpty = team.members.length === 0;
  const canRename = !locked && (isCaptain || (moderator && !isEmpty));
  const canJoin = !locked && !isMyTeam && !isFull;

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraftName(team.customName ?? "");
    setRenameError(null);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setRenameError("Nhập tên đội (1–24 ký tự).");
      inputRef.current?.focus();
      return;
    }
    if (trimmed.length > TEAM_NAME_MAX) {
      setRenameError(`Tối đa ${TEAM_NAME_MAX} ký tự.`);
      inputRef.current?.focus();
      return;
    }
    if (takenNames.has(trimmed.toLowerCase())) {
      setRenameError("Tên đội đã trùng với đội khác.");
      inputRef.current?.focus();
      return;
    }
    onRename(team.id, trimmed);
    setEditing(false);
    setRenameError(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setRenameError(null);
  };

  const actionLabel = isMyTeam
    ? "Đang ở đây"
    : isFull
      ? "Đã đủ"
      : isEmpty
        ? "Vào – làm đội trưởng"
        : myTeamId
          ? "Chuyển vào"
          : "Vào đội";

  const footerBtn = (
    <Button
      size="sm"
      variant={canJoin ? "primary" : "secondary"}
      disabled={!canJoin}
      className="w-full justify-center"
      onClick={(e) => {
        e.stopPropagation();
        if (canJoin) onJoinOrSwitch(team);
      }}
    >
      {actionLabel}
    </Button>
  );

  return (
    <article
      aria-label={teamDisplayName(team)}
      onClick={() => {
        if (canJoin && !editing) onJoinOrSwitch(team);
      }}
      className={`flex flex-col bg-black/55 bevel-raised-1 transition-colors ${
        isMyTeam ? "ring-1 ring-tone-focus" : canJoin ? "cursor-pointer hover:bg-black/40" : ""
      } ${team.eliminated || (locked && isEmpty) ? "opacity-55" : ""}`}
    >
      {/* Header: team name (or inline rename input) + n/8 */}
      <header className="flex min-h-9 items-center justify-between gap-1.5 bg-black/25 px-2.5 py-1 text-shadow-game">
        {editing ? (
          <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={draftName}
              maxLength={TEAM_NAME_MAX}
              placeholder={`Đội ${team.number}`}
              aria-label="Đổi tên đội"
              onChange={(e) => {
                setDraftName(e.target.value);
                if (renameError) setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              onBlur={() => {
                if (!draftName.trim() && !team.customName) cancelEdit();
              }}
              className="!h-6 !px-1.5 !text-sm"
            />
            {renameError && (
              <p className="m-0 mt-0.5 font-body text-xs text-danger-on-dark">{renameError}</p>
            )}
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <h3 className={`m-0 truncate font-heading text-sm font-semibold ${isMyTeam ? "text-tone-focus" : "text-tone-state"}`}>
              {teamDisplayName(team)}
            </h3>
            {canRename && (
              <button
                type="button"
                title="Đổi tên đội"
                aria-label="Đổi tên đội"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit();
                }}
                className="shrink-0 rounded px-1 font-body text-xs text-tone-text/70 hover:bg-white/10 hover:text-tone-state"
              >
                ✎
              </button>
            )}
          </div>
        )}
        <span className={`shrink-0 font-body text-xs tabular ${isFull ? "text-tone-focus" : "text-tone-text/70"}`}>
          {team.members.length}/{TEAM_MAX_MEMBERS}
        </span>
      </header>
      <div className={`h-px shrink-0 ${LINE}`} />

      {/* 4 fixed vertical player slots */}
      <ul className="m-0 flex flex-1 list-none flex-col gap-0.5 p-1.5">
        {Array.from({ length: TEAM_MAX_MEMBERS }, (_, idx) => {
          const member = team.members[idx];
          if (!member) {
            return (
              <li
                key={`empty-${idx}`}
                className="flex h-7 items-center px-1.5 font-body text-xs text-tone-text/35"
              >
                <span className="truncate">— Trống —</span>
              </li>
            );
          }

          const memberIsMe = member.id === me.id;
          const memberIsCaptain = idx === 0;
          const extraMenu: MenuEntry[] = moderator && !locked
            ? [
                ...(!memberIsCaptain
                  ? [{
                      id: "promote",
                      label: "Đặt làm đội trưởng",
                      icon: "crown" as const,
                      onSelect: () => onPromoteCaptain(team.id, member),
                    }]
                  : []),
                {
                  id: "kick",
                  label: "Mời ra khỏi đội",
                  icon: "logout" as const,
                  danger: true,
                  onSelect: () => onKickMember(team.id, member),
                },
              ]
            : [];

          return (
            <li key={member.id} className="h-7">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  profile.open(member, e.currentTarget, extraMenu);
                }}
                className={`flex h-full w-full items-center gap-1.5 px-1.5 text-left transition-colors hover:bg-white/10 ${
                  memberIsMe ? "bg-white/10" : ""
                }`}
              >
                <Avatar name={member.name} size="xs" status={member.status} />
                {memberIsCaptain && (
                  <Icon name="crown" size={12} className="shrink-0 text-tone-focus" label="Đội trưởng" />
                )}
                <span className={`min-w-0 flex-1 truncate font-body text-xs ${memberIsMe ? "font-bold text-tone-focus" : "text-tone-text"}`}>
                  {member.name}
                  {memberIsMe ? " (bạn)" : ""}
                </span>
                {member.rank && (
                  <span className="hidden shrink-0 font-body text-[11px] text-tone-text/60 xl:inline">
                    {member.rank}
                  </span>
                )}
                <PingIndicator ms={member.ping ?? 45} className="shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>

      {team.eliminated && (
        <div className="bg-danger/20 px-2.5 py-1 font-body text-xs font-semibold text-danger-on-dark">
          {team.eliminated.round ? `Bị loại ở ${team.eliminated.round}` : team.eliminated.reason}
        </div>
      )}
      {!team.eliminated && locked && isEmpty && (
        <div className="bg-black/35 px-2.5 py-1 font-body text-xs text-tone-text/60">
          Không có thành viên
        </div>
      )}

      {/* Footer action (hidden when teams are locked after draw) */}
      {!locked && (
        <div className="px-2 pb-2 pt-1">
          {isFull && !isMyTeam ? (
            <Tooltip className="w-full" content={`Đội đã đủ ${TEAM_MAX_MEMBERS} người`}>{footerBtn}</Tooltip>
          ) : isMyTeam ? (
            <Tooltip className="w-full" content="Bạn đang ở trong đội này">{footerBtn}</Tooltip>
          ) : (
            footerBtn
          )}
        </div>
      )}
    </article>
  );
}

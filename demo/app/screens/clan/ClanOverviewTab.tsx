import { useState } from "react";
import {
  Avatar, Button, Dialog, FormField, Icon, Textarea, Tooltip, cx,
  type ChatMessageData, type Player,
} from "../../../../components";
import type { Announcement, Clan, ClanRole } from "../../clanMock";
import { useMentionTarget, useProfile } from "../../profile";
import { ChatBox } from "../panel";

const ANN_MAX = 300;
const MAX_PINNED = 3;

/** T11 §3.3 & §3.4 — Tab Tổng quan Clan (Thông báo, Hoạt động, Đang online, Chat clan). */
export function ClanOverviewTab({
  clan,
  myRole,
  chatMessages,
  onSendChat,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onTogglePinAnnouncement,
}: {
  clan: Clan;
  myRole?: ClanRole;
  chatMessages: ChatMessageData[];
  onSendChat: (text: string) => void;
  onSaveAnnouncement: (text: string, editId?: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onTogglePinAnnouncement: (id: string) => void;
}) {
  const profile = useProfile();
  const [insert, setInsert] = useState<{ text: string; id: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [annText, setAnnText] = useState("");

  const isMember = Boolean(myRole);
  const canManageAnn = myRole === "Trưởng clan" || myRole === "Phó";

  useMentionTarget(
    isMember ? "chat clan" : "",
    (text) => setInsert((prev) => ({ text, id: (prev?.id ?? 0) + 1 })),
  );

  const sortedAnnouncements = [...clan.announcements].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return 0;
  });
  const pinnedCount = clan.announcements.filter((a) => a.pinned).length;
  const onlineMembers = clan.members.filter(
    (m) => m.player.status === "online" || m.player.status === "in-game",
  );

  const openNewEditor = () => {
    setEditingAnn(null);
    setAnnText("");
    setEditorOpen(true);
  };

  const openEditEditor = (ann: Announcement) => {
    setEditingAnn(ann);
    setAnnText(ann.text);
    setEditorOpen(true);
  };

  return (
    <div
      className={cx(
        "grid min-h-0 gap-4",
        isMember ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
      )}
    >
      {/* Left column: Announcements, Activity, Online */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Announcements */}
        <section className="flex flex-col gap-2.5 bg-black/35 p-4 bevel-sunken-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
              Thông báo
            </h2>
            {canManageAnn && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Icon name="plus" size={16} />}
                onClick={openNewEditor}
              >
                Viết thông báo
              </Button>
            )}
          </div>

          {sortedAnnouncements.length === 0 ? (
            <p className="text-sm italic text-tone-text/50">Chưa có thông báo</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedAnnouncements.map((ann) => {
                const pinDisabled = !ann.pinned && pinnedCount >= MAX_PINNED;
                return (
                  <div
                    key={ann.id}
                    className={cx(
                      "flex flex-col gap-1 p-3 bevel-sunken-1",
                      ann.pinned ? "bg-black/55 border-l-2 border-tone-focus" : "bg-black/35",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap text-sm text-tone-text">
                        {ann.pinned && (
                          <span aria-label="Đã ghim" className="mr-1.5 text-tone-focus">
                            📌
                          </span>
                        )}
                        {ann.text}
                      </p>

                      {canManageAnn && (
                        <div className="flex shrink-0 items-center gap-1">
                          {pinDisabled ? (
                            <Tooltip content="Đã ghim đủ 3 — bỏ ghim một cái trước">
                              <span tabIndex={0} className="inline-flex cursor-not-allowed">
                                <Button size="sm" variant="secondary" disabled className="pointer-events-none">
                                  Ghim
                                </Button>
                              </span>
                            </Tooltip>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onTogglePinAnnouncement(ann.id)}
                            >
                              {ann.pinned ? "Bỏ ghim" : "Ghim"}
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => openEditEditor(ann)}>
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDeleteAnnouncement(ann.id)}
                          >
                            Xoá
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-tone-text/60">
                      {ann.authorName} · {ann.at}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="flex flex-col gap-2 bg-black/35 p-4 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
            Hoạt động gần đây
          </h2>
          {clan.activity.length === 0 ? (
            <p className="text-sm italic text-tone-text/50">Chưa có hoạt động nào</p>
          ) : (
            <ul className="m-0 flex max-h-60 list-none flex-col gap-1.5 overflow-y-auto p-0 text-sm">
              {clan.activity.slice(0, 20).map((act) => (
                <li
                  key={act.id}
                  className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1 text-tone-text/85 last:border-b-0"
                >
                  <span>• {act.text}</span>
                  <span className="shrink-0 text-xs text-tone-text/55">{act.at}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Online members */}
        <section className="flex flex-col gap-2.5 bg-black/35 p-4 bevel-sunken-1">
          <h2 className="m-0 font-heading text-sm font-bold uppercase tracking-wider text-tone-state">
            Đang online ({onlineMembers.length})
          </h2>
          {onlineMembers.length === 0 ? (
            <p className="text-sm italic text-tone-text/50">Không có thành viên nào đang online</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlineMembers.map((m) => (
                <Tooltip key={m.player.id} content={`${m.player.name} (${m.role})`}>
                  <button
                    type="button"
                    onClick={(e) => profile.open(m.player, e.currentTarget)}
                    className="inline-flex items-center gap-1.5 bg-black/45 px-2 py-1 text-xs text-tone-text bevel-raised-1 hover:text-tone-focus focus-visible:outline-game-out"
                  >
                    <Avatar
                      size="xs"
                      name={m.player.name}
                      source={m.player.avatar}
                      status={m.player.status}
                    />
                    <span className="max-w-28 truncate">{m.player.name}</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right column: Clan chat (members only) */}
      {isMember && (
        <aside className="flex min-h-[420px] flex-col overflow-hidden bg-black/45 bevel-sunken-1">
          <ChatBox
            title="Chat clan"
            messages={chatMessages}
            onSend={onSendChat}
            onAuthorClick={(author: Player, el: HTMLElement) => profile.open(author, el)}
            insert={insert}
          />
        </aside>
      )}

      {/* Announcement create/edit dialog */}
      {editorOpen && (
        <Dialog
          title={editingAnn ? "Sửa thông báo" : "Viết thông báo mới"}
          size="sm"
          onClose={() => setEditorOpen(false)}
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = annText.trim();
            if (!trimmed) return;
            onSaveAnnouncement(trimmed, editingAnn?.id);
            setEditorOpen(false);
          }}
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" variant="primary" disabled={!annText.trim()}>
                Lưu
              </Button>
            </>
          }
        >
          <FormField label={`Nội dung (${annText.length}/${ANN_MAX})`} required>
            <Textarea
              value={annText}
              rows={4}
              maxLength={ANN_MAX}
              placeholder="Nhập thông báo gửi toàn clan…"
              onChange={(e) => setAnnText(e.target.value.slice(0, ANN_MAX))}
            />
          </FormField>
        </Dialog>
      )}
    </div>
  );
}


import { Fragment } from "react";
import { cx } from "../lib/cx";
import type { ChatMessageData, Player } from "../lib/types";
import { Avatar } from "../atoms/Avatar";
import { Icon } from "../atoms/Icon";
import { TEXT_TONE } from "../atoms/Text";

export interface ChatMessageProps {
  message: ChatMessageData;
  /** Same author within 2 minutes: hide avatar and name. */
  grouped?: boolean;
  /** Author avatar: xs 20 (compact lists), md 32 (lobby / room chat, same as the TopBar avatar). */
  avatarSize?: "xs" | "md";
  /** Avatar and name become buttons (e.g. open the author's profile next to the clicked element). */
  onAuthorClick?: (author: Player, anchor: HTMLElement) => void;
  onRetry?: () => void;
  className?: string;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/** Linkify http(s) URLs; everything else stays plain text (no HTML injection). */
function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="text-info-on-dark underline underline-offset-2 hover:text-tone-focus">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Chat line: user / own / system / whisper; sending (dim), failed (retry), mention (warm band). */
export function ChatMessage({ message: m, grouped, avatarSize = "xs", onAuthorClick, onRetry, className }: ChatMessageProps) {
  if (m.kind === "system") {
    return (
      <div className={cx("px-2 py-0.5 font-body text-sm italic text-info-on-dark", className)}>
        {linkify(m.text)}
      </div>
    );
  }
  const author = m.author;
  // Names in the warm text tone; the message below is a cooler off-white so the two read apart (user 12/11).
  const nameTone = m.kind === "own" ? "text-tone-focus" : author?.color ? TEXT_TONE[`player-${author.color}`] : "text-tone-text";
  return (
    <div
      className={cx(
        "flex gap-2 px-2",
        grouped ? "py-0" : "pt-1.5",
        m.mentionsMe && "bg-warning/15",
        m.sending && "opacity-60",
        className,
      )}
    >
      <span className={cx("shrink-0", avatarSize === "md" ? "w-8" : "w-5")}>
        {!grouped && author && (onAuthorClick ? (
          <button type="button" aria-label={`Hồ sơ ${author.name}`} onClick={(e) => onAuthorClick(author, e.currentTarget)} className="block hover:brightness-125 focus-visible:outline-game-out">
            <Avatar name={author.name} source={author.avatar} size={avatarSize} />
          </button>
        ) : (
          <Avatar name={author.name} source={author.avatar} size={avatarSize} />
        ))}
      </span>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            {m.kind === "whisper" && <span className="font-heading text-xs text-info-on-dark">nhắn riêng</span>}
            {author && onAuthorClick ? (
              <button type="button" onClick={(e) => onAuthorClick(author, e.currentTarget)} className={cx("font-body text-md font-semibold hover:underline focus-visible:outline-game-out", nameTone)}>
                {author.name}
              </button>
            ) : (
              <span className={cx("font-body text-md font-semibold", nameTone)}>{author?.name}</span>
            )}
            <time dateTime={m.at} className="font-body text-xs tabular text-tone-text/60">
              {time(m.at)}
            </time>
          </div>
        )}
        <p className={cx("m-0 whitespace-pre-wrap break-words font-body text-md", m.kind === "whisper" ? "text-info-on-dark" : "text-white/85")}>
          {linkify(m.text)}
        </p>
        {m.failed && (
          <span className="flex items-center gap-1.5 font-body text-sm text-danger-on-dark">
            <Icon name="error" size={12} />
            Gửi lỗi.
            {onRetry && (
              <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:text-tone-focus focus-visible:outline-game-out">
                Thử lại
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

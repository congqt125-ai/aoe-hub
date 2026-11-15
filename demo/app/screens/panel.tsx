// Panel parts shared by the hub screens (lobby, room): title band, footer band, divider line, chat panel.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChatMessage, Input, type ChatMessageData, type Player } from "../../../components";

export const LINE = "frame-line";

export function PanelTitle({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 bg-black/20 px-3 text-shadow-game">
      <h2 className="m-0 flex-1 font-heading text-lg font-semibold text-tone-state">{children}</h2>
      {trailing}
    </header>
  );
}

/** Bottom band (48px) shared by every column so the panels end on the same line; same tint as the title. */
export function PanelFooter({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className={`h-px shrink-0 ${LINE}`} />
      <footer className="flex h-12 shrink-0 items-center gap-2 bg-black/20 px-2 font-body text-sm text-tone-text/70 text-shadow-game">{children}</footer>
    </>
  );
}

/** Chat panel: title, live log (sticks to the newest line unless the reader scrolled up), input in the footer band. */
export function ChatBox({ title, showTitle = true, messages, error = false, onSend, onAuthorClick, insert, className = "flex-1" }: {
  title: string;
  /** false: the panel above already names it (title still labels the region for screen readers). */
  showTitle?: boolean;
  messages: ChatMessageData[];
  error?: boolean;
  onSend: (text: string) => void;
  /** Click on an author's avatar / name (profile). */
  onAuthorClick?: (author: Player, anchor: HTMLElement) => void;
  /** Text to add to the input (e.g. "@name " from a profile); a new `id` inserts again. */
  insert?: { text: string; id: number } | null;
  /** Share of the column height (flex-1 by default). */
  className?: string;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!insert) return;
    setText((t) => (t && !t.endsWith(" ") ? `${t} ` : t) + insert.text);
    inputRef.current?.focus();
  }, [insert]);

  // Keep the newest line in view unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    const t = text.trim();
    if (!t || error) return;
    onSend(t);
    setText("");
    stick.current = true;
  };

  return (
    <section aria-label={title} className={`flex min-h-0 flex-col ${className}`}>
      {showTitle && (
        <>
          <PanelTitle>{title}</PanelTitle>
          <div className={`h-px ${LINE}`} />
        </>
      )}
      {error && (
        <p role="alert" className="m-0 bg-danger/25 px-3 py-1 font-body text-sm font-bold text-danger-on-dark">
          Mất kết nối kênh chat — đang kết nối lại…
        </p>
      )}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={`Tin nhắn — ${title}`}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="min-h-0 flex-1 overflow-y-auto py-1"
      >
        {messages.length === 0 && <p className="m-0 px-3 py-4 font-body text-md text-tone-text/70">Chưa có tin nhắn.</p>}
        {messages.map((m, i) => {
          const grouped = i > 0 && messages[i - 1].author?.id === m.author?.id && m.kind === messages[i - 1].kind;
          return (
            <ChatMessage
              key={m.id}
              message={m}
              avatarSize="md"
              onAuthorClick={onAuthorClick}
              grouped={grouped}
              className={`px-3 ${i > 0 && !grouped ? "mt-1.5 border-t border-white/10 pt-2" : ""}`}
            />
          );
        })}
      </div>
      <PanelFooter>
        <Input
          ref={inputRef}
          wrapperClassName="flex-1"
          aria-label={`Nhập tin nhắn — ${title}`}
          placeholder={error ? "Chưa gửi được lúc mất kết nối" : "Nhập tin nhắn…"}
          maxLength={200}
          disabled={error}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </PanelFooter>
    </section>
  );
}

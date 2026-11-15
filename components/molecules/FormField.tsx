import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { Icon, type IconName } from "../atoms/Icon";

/*
 * Messages never resize the form (user decision 12/11, "A + B"):
 * A — each field reserves one 20px line shared by hint and error (error replaces the hint in place);
 * B — a form-level FormMessage line, always present, for errors about the whole form.
 * Messages are one line; longer text is cut with "…" and shown in full as a tooltip.
 */
const LINE = "h-5 leading-5";

export interface FormFieldProps {
  label: string;
  /** The control (Input, Select, Textarea...); receives id, aria-describedby, aria-required, invalid. */
  children: ReactElement<Record<string, unknown>>;
  hint?: ReactNode;
  /** Shown after blur or submit; turns the control red. */
  error?: string;
  /**
   * inline: error text in the field's reserved line (A);
   * border: red border only, the text lives in a form-level FormMessage (B) — point the control's
   * aria-describedby at that message.
   */
  errorDisplay?: "inline" | "border";
  /** Reserve the message line even when there is no hint / error (default true: no layout shift). */
  reserveLine?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Label + control + one reserved line for hint / error, wired with aria-describedby. */
export function FormField({ label, children, hint, error, errorDisplay = "inline", reserveLine = true, required, disabled, className }: FormFieldProps) {
  const auto = useId();
  // Keep the control's own id when it has one (screens focus fields by id).
  const id = (isValidElement(children) && typeof children.props.id === "string" ? children.props.id : auto) as string;
  const inlineError = errorDisplay === "inline" ? error : undefined;
  const hintId = hint && !inlineError ? `${id}-hint` : undefined;
  const errorId = inlineError ? `${id}-error` : undefined;
  const own = isValidElement(children) ? (children.props["aria-describedby"] as string | undefined) : undefined;
  const describedBy = [own, hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
        invalid: Boolean(error),
        disabled: disabled || children.props.disabled,
      })
    : children;

  let line: ReactNode = null;
  if (inlineError) line = <ErrorLine id={errorId!} text={inlineError} />;
  else if (hint)
    line = (
      <span id={hintId} className={cx("block truncate font-body text-sm text-tone-text/70", LINE)} title={typeof hint === "string" ? hint : undefined}>
        {hint}
      </span>
    );

  return (
    <div className={cx("flex min-w-0 flex-col gap-1", disabled && "opacity-60", className)}>
      <label htmlFor={id} className="font-heading text-sm font-semibold text-tone-text">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-tone-focus">
            *
          </span>
        )}
      </label>
      {control}
      {reserveLine ? <div className={cx("min-w-0", LINE)}>{line}</div> : line}
    </div>
  );
}

/** One-line error in a dark well (colored text needs it on textures), same height as a hint line. */
function ErrorLine({ id, text, icon = "error", tone = "danger" }: { id: string; text: string; icon?: IconName; tone?: MessageTone }) {
  return (
    <span id={id} title={text} className={cx("inline-flex max-w-full items-center gap-1.5 bg-black/70 px-2 font-body text-sm text-shadow-none", LINE, TONE[tone])}>
      <Icon name={icon} size={12} className="[filter:none]" />
      <span className="truncate">{text}</span>
    </span>
  );
}

export type MessageTone = "danger" | "warning" | "info";
const TONE: Record<MessageTone, string> = { danger: "text-danger-on-dark", warning: "text-warning-on-dark", info: "text-info-on-dark" };
const TONE_ICON: Record<MessageTone, IconName> = { danger: "error", warning: "warning", info: "info" };

export interface FormMessageProps {
  /** Referenced by the controls' aria-describedby. */
  id: string;
  /** Nothing to say = empty line (the space stays reserved). */
  message?: string;
  tone?: MessageTone;
  className?: string;
}

/** Form-level message line (B): always takes one line, announced politely when it changes. */
export function FormMessage({ id, message, tone = "danger", className }: FormMessageProps) {
  return (
    <div aria-live="polite" className={cx("min-w-0", LINE, className)}>
      {message && <ErrorLine id={id} text={message} icon={TONE_ICON[tone]} tone={tone} />}
    </div>
  );
}

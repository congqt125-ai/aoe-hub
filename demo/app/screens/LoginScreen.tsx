import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Button, Checkbox, Dialog, FormField, FormMessage, Input, PingIndicator, Toast, cx,
  type ConnectionState, type MessageTone, type ToastData,
} from "../../../components";
import { ReviewRailItem } from "../ReviewRail";

type Mode = "login" | "register";
type Status = "idle" | "loading";
type Errors = Partial<Record<"username" | "password" | "email" | "confirm" | "terms", string>>;

export interface LoginScreenProps {
  banner: ReactNode;
  connection: ConnectionState;
  onConnectionChange: (c: ConnectionState) => void;
  onSignedIn: (name: string, remember: boolean) => void;
}

const MOCK_DELAY_MS = 1100;
const DEMO = { username: "demo", password: "demo" };
const TAKEN_NAMES = ["demo", "admin", "lan_hylap"];

function validateLogin(username: string, password: string): Errors {
  const e: Errors = {};
  if (!username.trim()) e.username = "Nhập tên đăng nhập.";
  if (!password) e.password = "Nhập mật khẩu.";
  return e;
}

function validateRegister(v: { username: string; email: string; password: string; confirm: string; terms: boolean }): Errors {
  const e: Errors = {};
  if (!/^[\p{L}\p{N}_.]{3,16}$/u.test(v.username.trim())) e.username = "Cần 3–16 ký tự, không dấu cách.";
  else if (TAKEN_NAMES.includes(v.username.trim().toLowerCase())) e.username = "Tên này đã có người dùng.";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Email chưa đúng dạng.";
  if (v.password.length < 6) e.password = "Cần ít nhất 6 ký tự.";
  if (v.confirm !== v.password || !v.confirm) e.confirm = "Hai mật khẩu chưa khớp.";
  if (!v.terms) e.terms = "Cần đồng ý điều khoản để tạo tài khoản.";
  return e;
}

/**
 * T1 — Đăng nhập / Đăng ký (wireframes §1): inline Dialog under the logo of the temple background.
 * Login demo/demo; register switches mode inside the same dialog.
 */
export function LoginScreen({ banner, connection, onConnectionChange, onSignedIn }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  // Field to focus once the form is enabled again (focus() is ignored while the fieldset is disabled).
  const [focusId, setFocusId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const closeToast = useCallback(() => setToast(null), []);
  const offline = connection.kind === "offline";
  const busy = status === "loading";

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!focusId || busy) return;
    document.getElementById(focusId)?.focus();
    setFocusId(null);
  }, [focusId, busy]);
  useEffect(() => {
    document.getElementById(mode === "login" ? "login-username" : "reg-username")?.focus();
  }, [mode]);

  const values = { username, email, password, confirm, terms };
  const liveErrors = mode === "login" ? validateLogin(username, password) : validateRegister(values);
  // Field errors show after leaving the field (touched) or after a submit; server errors are kept in `errors`.
  const shown = (k: keyof Errors) => errors[k] ?? (touched[k] ? liveErrors[k] : undefined);
  const touch = (k: keyof Errors) => () => setTouched((t) => ({ ...t, [k]: true }));
  const edit = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }));

  const focusFirstError = (e: Errors) => {
    const order: (keyof Errors)[] = ["username", "email", "password", "confirm", "terms"];
    const first = order.find((k) => e[k]);
    if (first) document.getElementById(`${mode === "login" ? "login" : "reg"}-${first}`)?.focus();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setTouched({});
    setPassword("");
    setConfirm("");
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (busy || offline) return;
    const e = liveErrors;
    setTouched({ username: true, password: true, email: true, confirm: true, terms: true });
    setErrors({});
    if (Object.keys(e).length) {
      focusFirstError(e);
      return;
    }
    setStatus("loading");
    timer.current = window.setTimeout(() => {
      setStatus("idle");
      if (mode === "register") {
        switchMode("login");
        setToast({ id: "reg", kind: "success", title: "Đã tạo tài khoản", description: `Đăng nhập bằng “${username.trim()}” để vào sảnh.` });
        return;
      }
      if (username.trim() === DEMO.username && password === DEMO.password) {
        onSignedIn(username.trim(), remember);
      } else {
        // Wrong credentials: form-level message, password field red; keep the user name, clear the password.
        setErrors({ password: "Sai tên đăng nhập hoặc mật khẩu." });
        setPassword("");
        setFocusId("login-password");
      }
    }, MOCK_DELAY_MS);
  };

  // Review-only: jump to a state without typing.
  const review = (s: "idle" | "error" | "loading" | "offline") => {
    window.clearTimeout(timer.current);
    setMode("login");
    setStatus(s === "loading" ? "loading" : "idle");
    setTouched({});
    setErrors(s === "error" ? { password: "Sai tên đăng nhập hoặc mật khẩu." } : {});
    if (s === "error") setUsername((u) => u || "lan_hylap");
    onConnectionChange(s === "offline" ? { kind: "offline", attempt: 1 } : { kind: "online" });
  };
  const reviewState = offline ? "offline" : busy ? "loading" : errors.password ? "error" : "idle";

  const login = mode === "login";
  // One reserved message line per form (B): offline first, then the login / register error.
  let formMessage: { tone: MessageTone; text: string } | undefined;
  if (offline) formMessage = { tone: "warning", text: "Chưa kết nối được máy chủ — thử lại khi có mạng." };
  else if (login) {
    const u = shown("username");
    const p = shown("password");
    const text = u && p && !errors.password ? "Nhập tên đăng nhập và mật khẩu." : (u ?? p);
    if (text) formMessage = { tone: "danger", text };
  } else if (shown("terms")) formMessage = { tone: "danger", text: shown("terms")! };
  const messageId = login ? "login-message" : "reg-message";

  return (
    <div className="relative flex h-full flex-col">
      {banner}
      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-4">
        {/* Keeps the logo of the background visible; shrinks first on short windows. */}
        <div aria-hidden className="min-h-[72px] shrink basis-[324px]" />
        <Dialog
          variant="inline"
          size="md"
          title={login ? "Đăng nhập" : "Đăng ký"}
          description={login ? "Vào sảnh để tìm phòng và chơi cùng bạn bè." : "Tạo tài khoản để vào sảnh và chơi cùng bạn bè."}
          onSubmit={submit}
          // Register is two columns so the dialog stays short enough to sit under the logo at 768px.
          className={login ? "w-[min(420px,100%)]" : "w-[min(600px,100%)]"}
          actions={
            login ? (
              <>
                <Button size="lg" onClick={() => switchMode("register")} disabled={busy}>
                  Đăng ký
                </Button>
                <Button size="lg" variant="primary" type="submit" loading={busy} disabled={offline} className="min-w-[150px]" title={offline ? "Không có kết nối tới máy chủ" : undefined}>
                  Đăng nhập
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => switchMode("login")} disabled={busy}>
                  Quay lại
                </Button>
                <Button size="lg" variant="primary" type="submit" loading={busy} disabled={offline} className="min-w-[150px]">
                  Tạo tài khoản
                </Button>
              </>
            )
          }
        >
          <fieldset disabled={busy} className={cx("m-0 flex flex-col border-0 p-0", login ? "gap-3.5" : "gap-2")}>
            {login ? (
              <>
                {/* B: fields only turn red; the text is in the form message line above the buttons. */}
                <FormField label="Tên đăng nhập" error={shown("username")} errorDisplay="border" reserveLine={false}>
                  <Input
                    id="login-username"
                    aria-describedby={messageId}
                    autoComplete="username"
                    placeholder="vd: lan_hylap"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      edit("username");
                    }}
                    onBlur={touch("username")}
                  />
                </FormField>
                <FormField label="Mật khẩu" error={shown("password")} errorDisplay="border" reserveLine={false}>
                  <Input
                    id="login-password"
                    aria-describedby={messageId}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      edit("password");
                    }}
                    onBlur={touch("password")}
                  />
                </FormField>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Checkbox label="Ghi nhớ đăng nhập" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <a
                    href="#/login"
                    onClick={(e) => {
                      e.preventDefault();
                      setToast({ id: "forgot", kind: "info", title: "Quên mật khẩu", description: "Chưa làm trong bản mẫu này." });
                    }}
                    className="font-body text-md text-tone-state underline underline-offset-[3px] hover:text-tone-focus focus-visible:outline-game-out"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* A: every field reserves one line for its hint / error. */}
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <FormField label="Tên đăng nhập" required hint="3–16 ký tự, không dấu cách." error={shown("username")}>
                  <Input id="reg-username" autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); edit("username"); }} onBlur={touch("username")} />
                </FormField>
                <FormField label="Email" required error={shown("email")}>
                  <Input id="reg-email" type="email" autoComplete="email" placeholder="ban@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={touch("email")} />
                </FormField>
                </div>
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                <FormField label="Mật khẩu" required hint="Ít nhất 6 ký tự." error={shown("password")}>
                  <Input id="reg-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={touch("password")} />
                </FormField>
                <FormField label="Nhập lại mật khẩu" required error={shown("confirm")}>
                  <Input id="reg-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={touch("confirm")} />
                </FormField>
                </div>
                <div className="pt-1">
                  <Checkbox
                    id="reg-terms"
                    label="Tôi đồng ý với điều khoản sử dụng"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      touch("terms")();
                    }}
                    aria-invalid={Boolean(shown("terms")) || undefined}
                    aria-describedby={messageId}
                  />
                </div>
              </>
            )}
            <FormMessage id={messageId} message={formMessage?.text} tone={formMessage?.tone} className={login ? "-mb-2" : undefined} />
          </fieldset>
        </Dialog>
      </main>

      <footer className="tone-screen flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-black/55 px-4 py-2.5 font-body text-sm text-tone-state text-shadow-game">
        <span>SuperAge Hub · bản mẫu 0.1 · tài khoản thử: demo / demo</span>
        <span className="flex items-center gap-2">
          Máy chủ: {offline ? "mất kết nối" : "Châu Á"}
          <PingIndicator ms={offline ? null : 42} showValue={!offline} />
        </span>
      </footer>

      <ReviewRailItem label="Trạng thái" title="Xem trạng thái (chỉ để duyệt bản mẫu)" hotkey="s">
        <h4 className="mb-1.5 mt-0 font-heading text-xs font-semibold uppercase tracking-wide text-tone-focus">Xem trạng thái</h4>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Xem trạng thái">
          {([["idle", "Bình thường"], ["error", "Lỗi"], ["loading", "Đang đăng nhập"], ["offline", "Mất kết nối"]] as const).map(([s, label]) => (
            <button
              key={s}
              type="button"
              aria-pressed={reviewState === s}
              onClick={() => review(s)}
              className={cx("border px-2 py-0.5", reviewState === s ? "border-tone-focus bg-white/25 text-tone-focus" : "border-white/30 bg-white/10 hover:bg-white/20")}
            >
              {label}
            </button>
          ))}
        </div>
      </ReviewRailItem>

      {toast && (
        <div className="fixed bottom-14 right-4 z-toast">
          <Toast toast={toast} onClose={closeToast} />
        </div>
      )}
    </div>
  );
}

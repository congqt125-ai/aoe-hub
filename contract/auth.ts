// T1 Đăng nhập / Đăng ký + session. Tokens are stored by the desktop shell (step 5), not in localStorage.
import type { IsoDateTime, PlayerSummary } from "./common";

/** System-wide roles. "moderator" = QTV (extra spectator seats, tournament admin). */
export type AccountRole = "moderator" | "admin";

export interface AuthTokens {
  accessToken: string;
  /** Absent when the user did not tick "Ghi nhớ đăng nhập" (session ends when the app closes). */
  refreshToken?: string;
  accessExpiresAt: IsoDateTime;
}

export interface SessionDto {
  me: PlayerSummary;
  email: string;
  roles: AccountRole[];
  /** Server clock at response time, for countdown skew. */
  serverNow: IsoDateTime;
}

export interface LoginInput {
  username: string;
  password: string;
  remember: boolean;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  acceptTerms: true;
}

export interface AuthQueries {
  /** Who am I (on app start with a stored token). */
  "auth.session": { payload: Record<string, never>; result: SessionDto };
}

export interface AuthCommands {
  "auth.login": { payload: LoginInput; result: { tokens: AuthTokens; session: SessionDto } };
  "auth.register": { payload: RegisterInput; result: { tokens: AuthTokens; session: SessionDto } };
  "auth.refresh": { payload: { refreshToken: string }; result: AuthTokens };
  "auth.logout": { payload: Record<string, never>; result: Record<string, never> };
  /** Not built yet ("Quên mật khẩu?" shows "Chưa làm"). Always succeeds to avoid leaking accounts. */
  "auth.forgotPassword": { payload: { email: string }; result: Record<string, never> };
  /** Settings › Tài khoản (not built yet). */
  "auth.changePassword": { payload: { current: string; next: string }; result: Record<string, never> };
}

export interface AuthEvents {
  /** Signed in elsewhere / banned / password changed: the client returns to the login screen. */
  "auth.sessionEnded": { topic: "me"; payload: { reason: "signed-out" | "replaced" | "banned" | "password-changed" } };
}

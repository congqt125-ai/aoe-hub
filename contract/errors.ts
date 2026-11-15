// Stable error codes. The client maps each code to a Vietnamese sentence; `message` is for logs only.
// Unknown codes must still render ("Có lỗi xảy ra (CODE)").

export const ERROR_CODES = [
  // Generic
  "BAD_REQUEST",
  "VALIDATION_FAILED", // details.fields: { [field]: ErrorCode }
  "UNAUTHENTICATED",
  "TOKEN_EXPIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "CLIENT_OUTDATED",
  "SERVER_ERROR",
  "MAINTENANCE",
  // Client-made (never sent by the server)
  "NETWORK_OFFLINE",
  "NETWORK_TIMEOUT",
  // Field-level (inside VALIDATION_FAILED.details.fields)
  "FIELD_REQUIRED",
  "FIELD_TOO_SHORT",
  "FIELD_TOO_LONG",
  "FIELD_INVALID",
  // Auth
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_USERNAME_TAKEN",
  "AUTH_EMAIL_TAKEN",
  "AUTH_TERMS_NOT_ACCEPTED",
  "AUTH_ACCOUNT_LOCKED",
  // Lobby / room
  "ROOM_NOT_FOUND",
  "ROOM_CODE_NOT_FOUND",
  "ROOM_FULL",
  "ROOM_WRONG_PASSWORD",
  "ROOM_PLAYING",
  "ROOM_CLAN_ONLY",
  "ROOM_SEAT_TAKEN",
  "ROOM_SEAT_CLOSED",
  "ROOM_SEAT_MODERATOR_ONLY",
  "ROOM_SPECTATORS_FULL",
  "ROOM_POSITIONS_LOCKED",
  "ROOM_NOT_HOST",
  "ROOM_NOT_ENOUGH_PLAYERS",
  "ROOM_PLAYERS_NOT_READY",
  "ROOM_KICKED",
  "ROOM_ALREADY_IN_ROOM",
  // Chat
  "CHAT_RATE_LIMITED",
  "CHAT_MUTED",
  "CHAT_BLOCKED_BY_RECIPIENT",
  // Social
  "SOCIAL_ALREADY_FRIENDS",
  "SOCIAL_REQUEST_EXISTS",
  "SOCIAL_BLOCKED",
  "SOCIAL_SELF",
  // Tournament
  "TOURNAMENT_NOT_FOUND",
  "TOURNAMENT_WRONG_PHASE",
  "TOURNAMENT_TEAM_FULL",
  "TOURNAMENT_TEAM_NAME_TAKEN",
  "TOURNAMENT_TEAMS_LOCKED",
  "TOURNAMENT_SHRINK_BLOCKED", // lowering maxTeams would drop teams with members
  "TOURNAMENT_DRAW_BEFORE_START", // drawAt must be before startAt
  "TOURNAMENT_RESULT_INCOMPLETE", // not enough game wins for BoN
  "TOURNAMENT_RESULT_LOCKED", // next-round match already has a result
  "TOURNAMENT_NOT_CAPTAIN",
  // Clan
  "CLAN_NOT_FOUND",
  "CLAN_NAME_TAKEN",
  "CLAN_TAG_TAKEN",
  "CLAN_ALREADY_IN_CLAN",
  "CLAN_NOT_MEMBER",
  "CLAN_RECRUIT_CLOSED",
  "CLAN_FULL",
  "CLAN_RANK_TOO_LOW",
  "CLAN_DEPUTIES_FULL",
  "CLAN_LEADER_MUST_TRANSFER",
  "CLAN_APPLICATION_EXISTS",
  "CLAN_ALREADY_INVITED",
  "CLAN_PINS_FULL",
  "CLAN_CONFIRM_NAME_MISMATCH",
  // Profile
  "PROFILE_PINS_FULL",
  "INVENTORY_NOT_OWNED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
  /** Known codes are listed above; a newer server may send others. */
  code: ErrorCode | (string & {});
  /** English, for logs. Never shown to players. */
  message?: string;
  details?: {
    fields?: Record<string, ErrorCode | (string & {})>;
    [key: string]: unknown;
  };
  requestId?: string;
}

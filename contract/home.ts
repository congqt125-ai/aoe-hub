// T2 Trang chủ: hero slides, changelog, events. Tournament / room / friend blocks reuse their own modules.
import type { Id, ImageRef, IsoDateTime, TournamentId } from "./common";

export type HeroSlideKind = "tournament" | "software" | "coregame" | "event";
export type ChangelogProduct = "software" | "coregame";
export type ChangelogTag = "new" | "fix" | "balance" | "performance";

/** News content is authored in Vietnamese on the server (like the catalog); badges are derived from `kind`. */
export interface HeroSlideDto {
  id: Id;
  kind: HeroSlideKind;
  title: string;
  description: string;
  background: ImageRef;
  /** software / coregame slides link to a changelog entry. */
  product?: ChangelogProduct;
  version?: string;
  /** tournament slides link to the tournament. */
  tournamentId?: TournamentId;
  /** Show between these times (event slides). */
  startsAt?: IsoDateTime;
  endsAt?: IsoDateTime;
}

export interface ChangelogEntryDto {
  product: ChangelogProduct;
  version: string;
  date: IsoDateTime;
  tags: ChangelogTag[];
  highlights: string[];
  details: { tag: ChangelogTag; items: string[] }[];
}

export interface HomeFeedDto {
  slides: HeroSlideDto[];
  changelog: ChangelogEntryDto[];
}

export interface HomeQueries {
  "home.feed": { payload: Record<string, never>; result: HomeFeedDto };
  "home.changelog": { payload: { product: ChangelogProduct; before?: string; limit?: number }; result: ChangelogEntryDto[] };
}

export interface HealthDto {
  status: "ok" | "degraded" | "maintenance";
  serverNow: IsoDateTime;
  /** Clients older than this get CLIENT_OUTDATED. */
  minClientVersion: string;
  latestClientVersion: string;
  maintenanceAt?: IsoDateTime;
}

/** `GET /v1/health` — no auth; login screen server indicator and the Settings network test. */
export interface SystemQueries {
  "system.health": { payload: Record<string, never>; result: HealthDto };
}

export interface SystemEvents {
  /** Broadcast notice ("Bảo trì lúc 23:00"), shown in the lobby chat as a system line and as a toast. */
  "system.notice": { topic: "me"; payload: { text: string; at: IsoDateTime; maintenanceAt?: IsoDateTime } };
}

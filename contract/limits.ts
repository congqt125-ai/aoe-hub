// Field limits and game rules shared by client (early form errors) and server (authoritative checks).
// Values come from the screens already built; "proposed" = not enforced by any screen yet.

export const LIMITS = {
  username: { min: 3, max: 16, pattern: "^[\\p{L}\\p{N}_.]{3,16}$" },
  passwordMin: 6,
  roomName: { min: 1, max: 40 },
  roomPasswordMax: 20,
  /** 4-digit room number shown as #1234. */
  roomCodePattern: "^[0-9]{4}$",
  /** Proposed. */
  chatText: { min: 1, max: 300 },
  /** Proposed: messages per window per channel. */
  chatRate: { messages: 5, windowSec: 5 },
  tournamentName: { min: 1, max: 60 },
  tournamentPrizeMax: 40,
  teamName: { min: 1, max: 24 },
  matchNoteMax: 120,
  clanName: { min: 3, max: 24 },
  clanTagPattern: "^[A-Z0-9]{2,4}$",
  clanBioMax: 200,
  clanApplicationMax: 140,
  clanAnnouncementMax: 300,
  clanPinnedMax: 3,
  profilePinnedAchievementsMax: 3,
  /** Proposed. */
  profileBioMax: 200,
} as const;

export const ROOM_RULES = {
  playerSeats: 8,
  /** Regular spectator seats. */
  spectatorSeats: 4,
  /** Extra seats only moderators (QTV) may take, at both ends of the spectator row. */
  moderatorSeats: 2,
  minPlayersToStart: 2,
  countdownSec: 5,
} as const;

export const TOURNAMENT_RULES = {
  maxTeamSizes: [8, 16] as const,
  teamMaxMembers: 4,
  bestOfRegular: [1, 3] as const,
  bestOfFinals: [3, 5] as const,
} as const;

export const CLAN_RULES = {
  maxMembers: 50,
  maxDeputies: 3,
} as const;

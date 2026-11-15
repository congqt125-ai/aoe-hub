// Type-only guard: the contract (contract/) is standalone, so its enums are copies of the ones the UI uses.
// If either side changes, `npm run typecheck` fails here. Nothing imports this file.
import type * as C from "../../../contract";
import type { Faction, PlayerNumber, PresenceStatus } from "../../../components";
import type { CivChoice, CivId } from "../civs";
import type { RecruitMode } from "../clanMock";
import type { ChangelogProduct, HeroSlideKind } from "../homeMock";
import type { AchievementGroup, ItemCategory, ItemRarity } from "../profileMock";
import type { GameType, MapType } from "../roomMock";
import type { MatchStatus, TournamentPhase } from "../tournamentMock";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

export type ContractCompat = [
  Assert<Same<C.PresenceStatus, PresenceStatus>>,
  Assert<Same<C.Faction, Faction>>,
  Assert<Same<C.PlayerColor, PlayerNumber>>,
  Assert<Same<C.CivId, CivId>>,
  Assert<Same<C.CivChoice, CivChoice>>,
  Assert<Same<C.MapType, MapType>>,
  Assert<Same<C.GameType, GameType>>,
  Assert<Same<C.TournamentPhase, TournamentPhase>>,
  Assert<Same<C.TournamentMatchStatus, MatchStatus>>,
  Assert<Same<C.RecruitMode, RecruitMode>>,
  Assert<Same<C.ItemRarity, ItemRarity>>,
  Assert<Same<C.ItemCategory, ItemCategory>>,
  Assert<Same<C.AchievementGroup, AchievementGroup>>,
  Assert<Same<C.HeroSlideKind, HeroSlideKind>>,
  Assert<Same<C.ChangelogProduct, ChangelogProduct>>,
];

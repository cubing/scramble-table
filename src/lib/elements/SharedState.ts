import type { ExperimentalMillisecondTimestamp } from "cubing/twisty";
import type { ScrambleJSONCache } from "../json/ScrambleJSONCache";
import type { CompetitorScrambleDisplayOptions } from "./CompetitorScrambleDisplay";

export type MatchupID = string;
export type MatchupName = string;

export type ResultForTimedAttempt =
  | ExperimentalMillisecondTimestamp
  | "DNF"
  | "DNS";

export interface ScrambleTableCallbacks {
  setScramblerCallback?: (displayNumber: number) => Promise<string | null>;
  resultSubmittedCallback?: (
    displayNumber: number,
    result: ResultForTimedAttempt,
  ) => Promise<void>;
  refreshCurrentMatchupsCallback?: () => Promise<
    Record<MatchupID, MatchupName>
  >;
  resetMatchupCallback?: (matchupID: MatchupID) => Promise<void>;
  // Use this to e.g. call `setScramble(…)` on the competitor scramble displays.
  matchupSelectedCallback?: (matchupID: MatchupID) => void;
}

export interface ScrambleTableInitializationOptions {
  numDisplays?: number;
  callbacks?: ScrambleTableCallbacks;
  showMatchupsSelection?: "hide" | "show";
  competitorScrambleDisplayOptions?: CompetitorScrambleDisplayOptions;
}

export interface SharedState {
  scrambleJSONCache: ScrambleJSONCache;
  callbacks: ScrambleTableCallbacks;
}

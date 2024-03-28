import type { ScrambleJSONCache } from "../json/ScrambleJSONCache";

export type SetScramblerCallback = (
  displayNumber: number,
) => Promise<string | null>;

export interface ScrambleTableInitializationOptions {
  numDisplays?: number;
  setScramblerCallback?: SetScramblerCallback;
}

export interface SharedState {
  scrambleJSONCache: ScrambleJSONCache;
  setScramblerCallback: SetScramblerCallback;
}

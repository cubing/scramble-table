import type { CachedScrambleJSON } from "../json/CachedScrambleJSON";

export type SetScramblerCallback = (displayNumber: number) => Promise<string>;

export interface ScrambleTableInitializationOptions {
  numDisplays?: number;
  setScramblerCallback?: SetScramblerCallback;
}

export interface SharedState {
  cachedScrambleJSON: CachedScrambleJSON;
  setScramblerCallback: SetScramblerCallback;
}

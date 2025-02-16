import { addCSS } from "./elements/html";
// @ts-ignore
import mainCSS from "./elements/main.css";
addCSS(mainCSS);

export { CompetitorScrambleDisplay } from "./elements/CompetitorScrambleDisplay";
export { ScrambleTable } from "./elements/ScrambleTable";
export type {
  MatchupID,
  MatchupName,
  ResultForTimedAttempt,
  ScrambleTableCallbacks,
} from "./elements/SharedState";

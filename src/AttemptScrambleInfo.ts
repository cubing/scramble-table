import type { Alg } from "cubing/alg";

export interface AttemptScrambleInfo {
  competitorName: string;
  competitorCompetitionID: number;
  eventID: string;
  roundNumber: number;
  groupID: string; // e.g. "Y2" (yellow 2)
  attemptID: string; // "1" through "5", "E1", etc.
  scramble: Alg; // TODO: handle extra
}

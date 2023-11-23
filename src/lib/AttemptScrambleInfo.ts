export interface AttemptScrambleInfo {
  competitorName: string;
  competitorCompetitionID?: number;
  eventID: string;
  roundNumber: number; // 1-indexed
  scrambleSetNumber: number; // 1-indexed for the round (convert to letters as 1=A, 2=B, etc). NOT the global scramble set ID for the competition.
  attemptID: string; // "1" through "5", "E1", etc.
  numSubScrambles?: number; // for multi-puzzle events (e.g. Multi-Blind)
  passcode: string; // Passcode for the scramble set (or attempt, in the case of Multi-Blind)
}

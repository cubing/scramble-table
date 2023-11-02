// Unencrypted

export interface ScrambleSetJSON {
  id: number;
  scrambles: string[];
  extraScrambles: string[];
}

export interface ScrambleSetEncryptedJSON {
  id: number;
  ciphertext: string;
}

export interface PartialCompetitionScramblesRoundJSON<T> {
  scrambleSetCount: number;
  scrambleSets: T[];
}

export interface PartialCompetitionScramblesEventJSON<T> {
  id: string;
  rounds: PartialCompetitionScramblesRoundJSON<T>[];
}

export interface PartialCompetitionScramblesJSON<T> {
  encryptedScrambles?: boolean;
  wcif: {
    events: PartialCompetitionScramblesEventJSON<T>[];
  };
}

// Unencrypted

type EncryptedJSON = string;

export interface ScrambleSetJSON {
  id: number;
  scrambles: string[];
  extraScrambles: string[];
}

export interface ScrambleSetEncryptedBulkJSON {
  id: number;
  ciphertext: EncryptedJSON;
}

export interface ScrambleSetEncryptedPerAttemptJSON {
  id: number;
  encryptedScrambles: EncryptedJSON[];
  encryptedExtraScrambles: EncryptedJSON[];
}

export type ScrambleSetEncryptedJSON =
  | ScrambleSetEncryptedBulkJSON
  | ScrambleSetEncryptedPerAttemptJSON;

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
  competitionName: string;
  wcif: {
    events: PartialCompetitionScramblesEventJSON<T>[];
  };
}

// Unencrypted

export interface CompetitionScrambleSetJSON {
  id: number;
  scrambles: string[];
  extraScrambles: string[];
}

export interface PartialCompetitionScramblesRoundJSON {
  scrambleSetCount: number;
  scrambleSets: CompetitionScrambleSetJSON[];
}

export interface PartialCompetitionScramblesJSON {
  wcif: {
    events: [
      {
        id: string;
        rounds: PartialCompetitionScramblesRoundJSON[];
      },
    ];
  };
}

// Encrypted

export interface CompetitionScrambleSetEncryptedJSON {
  id: number;
  ciphertext: string;
}

export interface PartialCompetitionScramblesRoundEncryptedJSON {
  scrambleSets: CompetitionScrambleSetEncryptedJSON[];
}

export interface PartialCompetitionScramblesEncryptedJSON {
  encryptedScrambles: true;
  wcif: {
    events: [
      {
        id: string;
        rounds: PartialCompetitionScramblesRoundEncryptedJSON[];
      },
    ];
  };
}

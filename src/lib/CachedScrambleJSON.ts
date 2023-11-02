import type {
  PartialCompetitionScramblesEventJSON,
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
  ScrambleSetJSON,
} from "./json/format";

import type { AttemptScrambleInfo } from "./AttemptScrambleInfo";
import { decryptJSON } from "./encryption/passcode-encryption";

export class CachedScrambleJSON {
  #json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON> | undefined;
  constructor() {
    try {
      const jsonFromLocalStorage = localStorage["encrypted-scrambles-json"];
      if (jsonFromLocalStorage) {
        this.#json = JSON.parse(jsonFromLocalStorage);
      }
    } catch {
      console.warn("Invalid localStorage JSON!");
    }
  }

  setEncryptedScrambleJSON(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    if (!json.encryptedScrambles) {
      throw new Error("Tried to set unencrypted scramble JSON?");
    }
    this.#json = json;
    localStorage["encrypted-scrambles-json"] = JSON.stringify(json);
  }

  #getEvent(
    eventID: string,
  ): PartialCompetitionScramblesEventJSON<ScrambleSetEncryptedJSON> {
    // TODO: cache this lookup.
    for (const event of this.#json.wcif.events) {
      if (event.id === eventID) {
        return event;
      }
    }
    throw new Error(`Event not found: ${eventID}`);
  }

  async getScramble(info: AttemptScrambleInfo) {
    if (!this.#json) {
      throw new Error("Tried to get a scramble with missing JSON.");
    }
    const event = this.#getEvent(info.eventID);
    const scrambleSetEncryptedJSON =
      event.rounds[info.roundNumber - 1].scrambleSets[
        info.scrambleSetNumber - 1
      ];
    const scrambleSetJSON: ScrambleSetJSON = await decryptJSON(
      scrambleSetEncryptedJSON.ciphertext,
      info.passcode,
    );
    if (info.attemptID.startsWith("E")) {
      return scrambleSetJSON.extraScrambles[
        parseInt(info.attemptID.slice(1)) - 1
      ];
    } else {
      return scrambleSetJSON.scrambles[parseInt(info.attemptID) - 1];
    }
  }
}

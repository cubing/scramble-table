import type {
  PartialCompetitionScramblesEventJSON,
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
  ScrambleSetJSON,
} from "./format";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";
import { decryptJSON } from "../encryption/passcode-encryption";

const LOCAL_STORAGE_KEY = "encrypted-scrambles-json";

export interface ScrambleJSONCacheDelegate {
  setCompetitionName(name: string): void;
}

export class ScrambleJSONCache {
  #json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON> | undefined;
  constructor(private delegate: ScrambleJSONCacheDelegate) {
    try {
      const jsonFromLocalStorage = localStorage[LOCAL_STORAGE_KEY];
      if (jsonFromLocalStorage) {
        this.#json = JSON.parse(jsonFromLocalStorage);
        console.info("Loaded JSON from `localStorage` successfully! 🥳");
        this.#onJSONHasBeenSet();
      }
    } catch (e) {
      console.warn("Invalid localStorage JSON!");
      console.warn(e);
    }
  }

  #onJSONHasBeenSet() {
    this.delegate.setCompetitionName(this.#json.competitionName);
  }

  setEncryptedScrambleJSON(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    if (!json.encryptedScrambles) {
      throw new Error("Tried to set unencrypted scramble JSON?");
    }
    this.#json = json;
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(json);
    this.#onJSONHasBeenSet();
  }

  // Does not propagate updates.
  clear() {
    delete localStorage[LOCAL_STORAGE_KEY];
    this.#json = undefined;
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

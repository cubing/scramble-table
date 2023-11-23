import type {
  PartialCompetitionScramblesEventJSON,
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedBulkJSON,
  ScrambleSetEncryptedJSON,
  ScrambleSetEncryptedPerAttemptJSON,
  ScrambleSetJSON,
} from "./format";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";
import { decryptJSON } from "../encryption/passcode-encryption";

import { multiScramblesEncryptedPerAttemptEvents } from "../eventMetadata";

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

  async getScrambleStringOrStrings(
    info: AttemptScrambleInfo,
  ): Promise<string | string[]> {
    if (!this.#json) {
      throw new Error("Tried to get a scramble with missing JSON.");
    }
    const event = this.#getEvent(info.eventID);

    if (multiScramblesEncryptedPerAttemptEvents[event.id]) {
      const scrambleSetEncryptedJSON = event.rounds[info.roundNumber - 1]
        .scrambleSets[
        info.scrambleSetNumber - 1
      ] as ScrambleSetEncryptedPerAttemptJSON;
      let ciphertext: string;
      if (info.attemptID.startsWith("E")) {
        ciphertext =
          scrambleSetEncryptedJSON.encryptedExtraScrambles[
            parseInt(info.attemptID.slice(1)) - 1
          ];
      } else {
        ciphertext =
          scrambleSetEncryptedJSON.encryptedScrambles[
            parseInt(info.attemptID) - 1
          ];
      }
      const scrambleStrings: string[] = (
        (await decryptJSON(ciphertext, info.passcode)) as string
      ).split("\n");
      if (scrambleStrings.length < info.numSubScrambles) {
        throw new Error("Not enough sub-scrambles available!");
      }
      if (!("numSubScrambles" in info)) {
        throw new Error(
          "Must specify the number of sub-scrambles for this event!",
        );
      }
      return scrambleStrings.slice(0, info.numSubScrambles);
    } else {
      const scrambleSetEncryptedJSON = event.rounds[info.roundNumber - 1]
        .scrambleSets[
        info.scrambleSetNumber - 1
      ] as ScrambleSetEncryptedBulkJSON;
      const scrambleSetJSON: ScrambleSetJSON = await decryptJSON(
        scrambleSetEncryptedJSON.ciphertext,
        info.passcode,
      );
      if (info.attemptID.startsWith("E")) {
        return [
          scrambleSetJSON.extraScrambles[parseInt(info.attemptID.slice(1)) - 1],
        ];
      } else {
        return [scrambleSetJSON.scrambles[parseInt(info.attemptID) - 1]];
      }
    }
  }
}

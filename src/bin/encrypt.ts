import { encryptJSON } from "../lib/encryption/passcode-encryption";
import {
  eventName,
  multiScramblesEncryptedPerAttemptEvents,
} from "../lib/eventMetadata";
import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
  ScrambleSetEncryptedPerAttemptJSON,
  ScrambleSetJSON,
} from "../lib/json/format";

// Modifies `competitionScramblesJSON` in place.
export async function encryptScrambles(
  competitionScramblesJSON: PartialCompetitionScramblesJSON<ScrambleSetJSON>,
  passcodesInputFileText: string,
): Promise<PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>> {
  const passcodeTable = [];
  for (const line of passcodesInputFileText.split(/\r?\n/g)) {
    const [key, value, ..._] = line.split(": ");
    if (!value) {
      continue;
    }
    passcodeTable[key] = value;
  }

  function passcodeForScrambleSetOrAttempt(
    eventID: string,
    roundNumber: number,
    scrambleSetNumber: number,
    onlyScrambleSetForRound: boolean,
    attemptID?: string, // Required for `multiScramblesEncryptedPerAttemptEvents` events.
  ): string {
    let key = eventName(eventID);
    key += ` Round ${roundNumber}`;
    key += ` Scramble Set ${String.fromCharCode(64 + scrambleSetNumber)}`;
    if (multiScramblesEncryptedPerAttemptEvents[eventID]) {
      if (!attemptID) {
        throw new Error(`Attempt ID required for event: ${eventID}`);
      }
      key += ` Attempt ${attemptID}`;
    }
    const passcode = passcodeTable[key];
    if (!passcode) {
      throw new Error(`Could not find passcode for key: ${key}`);
    }
    return passcode;
  }

  for (const event of competitionScramblesJSON.wcif.events) {
    for (const [roundNumberZeroIndexed, round] of event.rounds.entries()) {
      const oldScrambleSets = round.scrambleSets;
      const newScrambleSets: ScrambleSetEncryptedJSON[] = [];
      round.scrambleSets = newScrambleSets as unknown as ScrambleSetJSON[];
      for (const [
        scrambleSetNumberZeroIndexed,
        scrambleSet,
      ] of oldScrambleSets.entries()) {
        const onlyScrambleSetForRound = round.scrambleSetCount === 1;
        if (multiScramblesEncryptedPerAttemptEvents[event.id]) {
          const encryptedScrambleSetJSON: ScrambleSetEncryptedPerAttemptJSON = {
            id: scrambleSet.id,
            encryptedScrambles: [],
            encryptedExtraScrambles: [],
          };
          for (const key of ["scrambles", "extraScrambles"] as const) {
            for (const [attemptNumberZeroIndexed, scrambles] of scrambleSet[
              key
            ].entries()) {
              const extra = key === "extraScrambles";
              const encryptedField = extra
                ? encryptedScrambleSetJSON.encryptedExtraScrambles
                : encryptedScrambleSetJSON.encryptedScrambles;
              const attemptID =
                (extra ? "E" : "") + (attemptNumberZeroIndexed + 1);
              if (event.id === "333mbf" && scrambles === "") {
                console.warn(
                  `[${event.id}][Round ${
                    roundNumberZeroIndexed + 1
                  }][Scramble set ${
                    scrambleSetNumberZeroIndexed + 1
                  }][Attempt ${attemptID}] Skipping empty extra scrambles for 3x3x3 Multi-Blind.`,
                );
                continue;
              }
              console.log(
                `[${event.id}][Round ${
                  roundNumberZeroIndexed + 1
                }][Scramble set ${
                  scrambleSetNumberZeroIndexed + 1
                }][Attempt ${attemptID}] Encrypting…`,
              );
              const passcode = passcodeForScrambleSetOrAttempt(
                event.id,
                roundNumberZeroIndexed + 1,
                scrambleSetNumberZeroIndexed + 1,
                onlyScrambleSetForRound,
                attemptID,
              );
              encryptedField.push(await encryptJSON(scrambles, passcode));
              console.log("Done!");
            }
          }
          newScrambleSets.push(encryptedScrambleSetJSON);
        } else {
          console.log(
            `[${event.id}][Round ${roundNumberZeroIndexed + 1}][Scramble set ${
              scrambleSetNumberZeroIndexed + 1
            }] Encrypting…`,
          );
          const passcode = passcodeForScrambleSetOrAttempt(
            event.id,
            roundNumberZeroIndexed + 1,
            scrambleSetNumberZeroIndexed + 1,
            onlyScrambleSetForRound,
          );
          const ciphertext = await encryptJSON(scrambleSet, passcode);
          newScrambleSets.push({
            id: scrambleSet.id,
            ciphertext,
          });
          console.log("Done!");
        }
      }
    }
  }
  const competitionScramblesEncryptedJSON =
    competitionScramblesJSON as unknown as PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>;
  competitionScramblesEncryptedJSON.encryptedScrambles = true;

  return competitionScramblesEncryptedJSON as unknown as PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>;
}

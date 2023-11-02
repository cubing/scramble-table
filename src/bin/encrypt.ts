#!/usr/bin/env bun

import { assert } from "node:console";
import { readFile, writeFile } from "node:fs/promises";
import { argv, exit, stdout } from "node:process";
import { encryptJSON } from "../lib/encryption/passcode-encryption";
import {
  CompetitionScrambleSetEncryptedJSON,
  CompetitionScrambleSetJSON,
  PartialCompetitionScramblesEncryptedJSON,
  PartialCompetitionScramblesJSON,
} from "../lib/json/format";

(async () => {
  function printUsageAndExit(exitCode: number) {
    console.log(
      "Usage: npx @cubing/scramble-table encrypt [competition.json] [passcodes.txt] [competition.encrypted-scrambles.json]",
    );
    exit(exitCode);
  }

  const args = argv.slice(2);
  if (args[0] === "help") {
    printUsageAndExit(0);
  }
  if (args.length < 3) {
    printUsageAndExit(1);
  }

  const [jsonInputFile, passcodesInputFile, encryptedJSONOutputFile, ..._] =
    args;

  const passcodesInputFileText = await readFile(passcodesInputFile, "utf-8");

  const passcodeTable = [];
  for (const line of passcodesInputFileText.split("\n")) {
    const [key, value, ..._] = line.split(": ");
    if (!value) {
      continue;
    }
    passcodeTable[key] = value;
  }

  // From: https://github.com/thewca/tnoodle/blob/2d9ef27d95eec86367a592210ebc6e45558516aa/tnoodle-ui/src/test/mock/tnoodle.api.test.mock.ts#L14
  const tnoodleEventNameMappings: Record<string, string> = {
    "333": "3x3x3",
    "222": "2x2x2",
    "444": "4x4x4",
    "555": "5x5x5",
    "666": "6x6x6",
    "777": "7x7x7",
    "333bf": "3x3x3 Blindfolded",
    "333fm": "3x3x3 Fewest Moves",
    "333oh": "3x3x3 One-Handed",
    clock: "Clock",
    minx: "Megaminx",
    pyram: "Pyraminx",
    skewb: "Skewb",
    sq1: "Square-1",
    "444bf": "4x4x4 Blindfolded",
    "555bf": "5x5x5 Blindfolded",
    // "333mbf": "3x3x3 Multiple Blindfolded", // TODO
  };

  function passcodeForScrambleSet(
    eventID: string,
    roundNumber: number,
    scrambleSetNumber: number,
    onlyScrambleSetForRound: boolean,
  ): string {
    if (eventID === "333mbf") {
      // TODO
      console.error("Multi-Blind is not yet supported.");
      exit(1);
    }
    if (eventID === "clock") {
      // TODO
      console.warn(
        "WARNING: clock scramble display does not support pins yet.",
      );
    }
    let key = tnoodleEventNameMappings[eventID];
    key += ` Round ${roundNumber}`;
    if (!onlyScrambleSetForRound) {
      key += ` Scramble Set ${String.fromCharCode(64 + scrambleSetNumber)}`;
    }
    const passcode = passcodeTable[key];
    if (!passcode) {
      throw new Error("Could not find passcode");
    }
    return passcode;
  }

  const competitionScramblesJSON: PartialCompetitionScramblesJSON = JSON.parse(
    await readFile(jsonInputFile, "utf-8"),
  );

  for (const event of competitionScramblesJSON.wcif.events) {
    for (const [roundNumberZeroIndexed, round] of event.rounds.entries()) {
      const oldScrambleSets = round.scrambleSets;
      const newScrambleSets: CompetitionScrambleSetEncryptedJSON[] = [];
      round.scrambleSets =
        newScrambleSets as unknown as CompetitionScrambleSetJSON[];
      for (const [
        scrambleSetNumberZeroIndexed,
        scrambleSet,
      ] of oldScrambleSets.entries()) {
        stdout.write(
          `[${event.id}][Round ${roundNumberZeroIndexed + 1}][Scramble set ${
            scrambleSetNumberZeroIndexed + 1
          }] Encrypting…`,
        );
        const onlyScrambleSetForRound = round.scrambleSetCount === 1;
        const passcode = passcodeForScrambleSet(
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
        stdout.write(" Done!\n");
      }
    }
  }
  const competitionScramblesEncryptedJSON =
    competitionScramblesJSON as unknown as PartialCompetitionScramblesEncryptedJSON;
  competitionScramblesEncryptedJSON.encryptedScrambles = true;
  const outputFileContents = JSON.stringify(
    competitionScramblesEncryptedJSON,
    null,
    "  ",
  );

  assert(!outputFileContents.includes("scrambles")); // Simple check for unexpected scrambles left in the data.
  assert(!outputFileContents.includes("extraScrambles")); // Simple check for unexpected scrambles left in the data.

  await writeFile(encryptedJSONOutputFile, outputFileContents);
  console.log();
  console.log(`Encrypted scramble file written to: ${encryptedJSONOutputFile}`);
})();

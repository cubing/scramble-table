#!/usr/bin/env bun

import { assert } from "node:console";
import { readFile, writeFile } from "node:fs/promises";
import { argv, exit, stdout } from "node:process";
import {
  decryptJSON,
  encryptJSON,
} from "../lib/encryption/passcode-encryption";
import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
  ScrambleSetJSON,
} from "../lib/json/format";
import { encryptScrambles } from "./encrypt";

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
  if (args.length < 4) {
    printUsageAndExit(1);
  }

  const [
    command,
    jsonInputFile,
    passcodesInputFile,
    encryptedJSONOutputFile,
    ..._
  ] = args;

  if (command !== "encrypt") {
    printUsageAndExit(1);
  }

  const competitionScramblesJSON: PartialCompetitionScramblesJSON<ScrambleSetJSON> =
    JSON.parse(await readFile(jsonInputFile, "utf-8"));
  const passcodesInputFileText = await readFile(passcodesInputFile, "utf-8");

  const outputFileContents = JSON.stringify(
    encryptScrambles(competitionScramblesJSON, passcodesInputFileText),
  );

  assert(!outputFileContents.includes("scrambles")); // Simple check for unexpected scrambles left in the data.
  assert(!outputFileContents.includes("extraScrambles")); // Simple check for unexpected scrambles left in the data.

  await writeFile(encryptedJSONOutputFile, outputFileContents);
  console.log();
  console.log(`Encrypted scramble file written to: ${encryptedJSONOutputFile}`);
})();

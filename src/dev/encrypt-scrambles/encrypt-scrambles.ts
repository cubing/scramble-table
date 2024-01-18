import { randomScrambleForEvent } from "cubing/scramble";
import { randomChoice, randomUIntBelow } from "random-uint-below";
import { encryptScrambles } from "../../bin/encrypt";
import type {
  PartialCompetitionScramblesJSON,
  PartialCompetitionScramblesRoundJSON,
  ScrambleSetJSON,
} from "../../lib/json/format";

let scrambleJSON: PartialCompetitionScramblesJSON<ScrambleSetJSON> | undefined;
let passcodesFile: string | undefined;

const downloadButton = document.querySelector<HTMLButtonElement>(
  "#download-encrypted-json",
)!;
function maybeEnableDownload() {
  if (scrambleJSON && passcodesFile) {
    downloadButton.disabled = false;
  }
}

const passcodeChars = "23456789abcdefghijkmnpqrstuvwxyz".split("");
function generatePasscode(): string {
  return new Array(8)
    .fill(0)
    .map(() => randomChoice(passcodeChars))
    .join("");
}

async function addFTO(
  scrambleJSONIn: PartialCompetitionScramblesJSON<ScrambleSetJSON>,
  passcodesFileIn: string,
): Promise<[PartialCompetitionScramblesJSON<ScrambleSetJSON>, string]> {
  const scrambleJSON = structuredClone(scrambleJSONIn);
  let passcodesFile = passcodesFileIn;
  const rounds: PartialCompetitionScramblesRoundJSON<ScrambleSetJSON>[] = [];
  let scrambleSetID = scrambleJSON.wcif.events
    .at(-1)
    .rounds.at(-1)
    .scrambleSets.at(-1).id;
  for (const roundNumber of [1, 2]) {
    const scrambleSets: ScrambleSetJSON[] = [];
    for (const scrambleSetNumber of ["A", "B", "C", "D"]) {
      const passcode = generatePasscode();
      passcodesFile += `Face-Turning Octahedron Round ${roundNumber} Scramble Set ${scrambleSetNumber}: ${passcode}\n`;
      scrambleSetID++;
      const scrambleSet: ScrambleSetJSON = {
        id: scrambleSetID,
        scrambles: [
          (await randomScrambleForEvent("fto")).toString(),
          (await randomScrambleForEvent("fto")).toString(),
          (await randomScrambleForEvent("fto")).toString(),
          (await randomScrambleForEvent("fto")).toString(),
          (await randomScrambleForEvent("fto")).toString(),
        ],
        extraScrambles: [
          (await randomScrambleForEvent("fto")).toString(),
          (await randomScrambleForEvent("fto")).toString(),
        ],
      };
      scrambleSets.push(scrambleSet);
    }

    const round: PartialCompetitionScramblesRoundJSON<ScrambleSetJSON> = {
      scrambleSetCount: 4,
      scrambleSets,
    };
    rounds.push(round);
  }

  const event = {
    id: "fto",
    rounds,
  };
  scrambleJSON.wcif.events.push(event);

  return [scrambleJSON, passcodesFile];
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "download";
  a.download = filename;
  a.click();
}

downloadButton.addEventListener("click", async () => {
  const [modifiedScrambleJSON, modifiedPasscodesFile] = await addFTO(
    scrambleJSON,
    passcodesFile,
  );
  console.log(modifiedScrambleJSON);
  console.log(modifiedPasscodesFile);

  download(
    "scrambles.UNENCRYPTED.json",
    JSON.stringify(modifiedScrambleJSON, null, "  "),
  );
  download("Passcodes.txt", modifiedPasscodesFile);

  const file = await encryptScrambles(
    modifiedScrambleJSON!,
    modifiedPasscodesFile!,
  );
  download("scrambles.encrypted.json", JSON.stringify(file, null, "  "));
});

document
  .querySelector<HTMLInputElement>("#json-file")!
  .addEventListener("change", async (e) => {
    scrambleJSON = JSON.parse(
      await (e.target as HTMLInputElement).files![0].text(),
    );
    maybeEnableDownload();
  });

document
  .querySelector<HTMLInputElement>("#passcodes-file")!
  .addEventListener("change", async (e) => {
    passcodesFile = await (e.target as HTMLInputElement).files![0].text();
    maybeEnableDownload();
  });

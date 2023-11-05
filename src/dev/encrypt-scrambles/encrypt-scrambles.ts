import { encryptScrambles } from "../../bin/encrypt";
import type {
  PartialCompetitionScramblesJSON,
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
downloadButton.addEventListener("click", async () => {
  console.log(scrambleJSON);
  console.log(passcodesFile);
  const file = await encryptScrambles(scrambleJSON!, passcodesFile!);
  const text = JSON.stringify(file);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "download";
  a.download = "scrambles.encrypted.json";
  a.click();
  console.log(text);
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

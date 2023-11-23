import { ScrambleTable } from "../lib";
import encryptedScramblesJSON from "./fake-competition/Fake Test Competition.encrypted-scrambles.json" assert {
  type: "json",
};

declare global {
  interface globalThis {
    app: ScrambleTable;
  }
}

const app = document.body.appendChild(new ScrambleTable());
globalThis.app = app;

app.displays[0].setScramble({
  competitorName: "Minh Thai",
  competitorCompetitionID: 10,
  eventID: "333",
  roundNumber: 1,
  scrambleSetNumber: 1,
  attemptID: "4",
  passcode: "ew9pyvnt",
});

app.displays[1].setScramble({
  competitorName: "Amelia Multicube",
  competitorCompetitionID: 11,
  eventID: "333mbf",
  roundNumber: 1,
  scrambleSetNumber: 2,
  attemptID: "1",
  passcode: "d7uhhs8j",
  numSubScrambles: 10,
});

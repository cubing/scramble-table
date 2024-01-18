import { ScrambleTable } from "../lib";

declare global {
  interface globalThis {
    app: ScrambleTable;
  }
}

const app = document.body.appendChild(new ScrambleTable());
globalThis.app = app;

app.displays[0].setScramble({
  competitorName: "Amelia Multicube",
  competitorCompetitionID: 11,
  eventID: "333mbf",
  roundNumber: 3,
  scrambleSetNumber: 1,
  attemptID: "2",
  passcode: "uce4zdvm",
  numSubScrambles: 23,
});

app.displays[1].setScramble({
  competitorName: "Ben Streeter",
  competitorCompetitionID: 34,
  eventID: "fto",
  roundNumber: 1,
  scrambleSetNumber: 1,
  attemptID: "3",
  passcode: "7dig4j6y",
});

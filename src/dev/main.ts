import { ScrambleTable } from "../lib";

declare global {
  interface globalThis {
    app: ScrambleTable;
  }
}

const app = document.body.appendChild(new ScrambleTable());
globalThis.app = app;

app.addEventListener(
  "scramble-cleared",
  (e: CustomEvent<{ displayIndex: number }>) => {
    console.log(`Scramble cleared for display index: ${e.detail.displayIndex}`);
  },
);

app.displays[0].setScramble({
  competitorName: "Minh Thai",
  competitorCompetitionID: 11,
  eventID: "333",
  roundNumber: 1,
  scrambleSetNumber: 1,
  attemptID: "2",
  passcode: "tszgw3r9",
  // numSubScrambles: 23,
});

app.displays[1].setScramble({
  competitorName: "Abraham Lincoln",
  competitorCompetitionID: 34,
  eventID: "333",
  roundNumber: 1,
  scrambleSetNumber: 1,
  attemptID: "2",
  passcode: "tszgw3r9",
});

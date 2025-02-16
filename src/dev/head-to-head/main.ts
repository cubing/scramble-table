import type { ExperimentalMillisecondTimestamp } from "cubing/twisty";
import { ScrambleTable } from "../../lib";
import type {
  MatchupID,
  ResultForTimedAttempt,
} from "../../lib/elements/SharedState";
import { formatResultForTimedAttempt } from "../../lib/vendor/timer.cubing.net/stats";

declare global {
  interface globalThis {
    app: ScrambleTable;
  }
}

async function refreshCurrentMatchupsCallback() {
  return {
    "matchup-23": "Minh Thai vs. Abraham Lincoln",
    "matchup-24": "Gilgamesh vs. Enkidu",
  };
}

async function resultSubmittedCallback(
  displayNumber: number,
  result: ResultForTimedAttempt,
) {
  console.log(
    `Submitting a result of ${formatResultForTimedAttempt(result)} for display number ${displayNumber}`,
  );
  // Submit results here and throw/return depending on success.
  // await fetch(…);

  // Simulate an occasional failure.
  if (Math.random() < 0.1) {
    throw new Error("Submission failure!");
  }

  // Simulate 0.5 second submission round-trip for now.
  await new Promise((resolve) => setTimeout(resolve, 500));
}

function matchupSelectedCallback(matchupID: MatchupID) {
  switch (matchupID) {
    case "matchup-23": {
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
      return;
    }
    case "matchup-24": {
      app.displays[0].setScramble({
        competitorName: "Gilgamesh",
        competitorCompetitionID: 32,
        eventID: "333",
        roundNumber: 1,
        scrambleSetNumber: 1,
        attemptID: "1",
        passcode: "tszgw3r9",
        // numSubScrambles: 23,
      });
      app.displays[1].setScramble({
        competitorName: "Enkidu",
        competitorCompetitionID: 11,
        eventID: "333",
        roundNumber: 1,
        scrambleSetNumber: 1,
        attemptID: "1",
        passcode: "tszgw3r9",
      });
      return;
    }
  }
}

const app = document.body.appendChild(
  new ScrambleTable({
    competitorScrambleDisplayOptions: {
      resultsInput: "show",
    },
    callbacks: {
      resultSubmittedCallback,
      refreshCurrentMatchupsCallback,
      resetMatchupCallback: async (matchupID) =>
        console.log("Reset matchup:", { matchupID }),
      matchupSelectedCallback,
    },
    showMatchupsSelection: "show",
  }),
);
globalThis.app = app;

app.addEventListener(
  "scramble-cleared",
  (e: CustomEvent<{ displayIndex: number }>) => {
    console.log(`Scramble cleared for display index: ${e.detail.displayIndex}`);
  },
);

matchupSelectedCallback("matchup-23");

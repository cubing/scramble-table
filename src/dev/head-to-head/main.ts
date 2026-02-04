import { ScrambleTable } from "../../lib";
import type { AttemptScrambleInfo } from "../../lib/AttemptScrambleInfo";
import type {
  MatchupCallbackIdentifyingInfo,
  MatchupID,
} from "../../lib/elements/SharedState";
import { customEventWorkaround } from "../../lib/mustExist";
import type { ResultForTimedAttemptWithPenalty } from "../../lib/vendor/timer.cubing.net/stats";

declare global {
  interface globalThis {
    app: ScrambleTable;
  }
}

async function simulateLatency() {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 250));
}

async function refreshCurrentMatchupsCallback() {
  await simulateLatency();
  return {
    "matchup-23": "Minh Thai vs. Abraham Lincoln",
    "matchup-24": "Gilgamesh vs. Enkidu",
  };
}

function matchupSelectedCallback(matchupID: MatchupID) {
  switch (matchupID) {
    case "matchup-23": {
      app.displays[0].setScramble({
        competitorName: "Minh Thai",
        eventID: "333",
        matchupID: "matchup-23",
        competitorMatchupID: "minh-thai",
        attemptID: "1",
        scrambleString:
          "B2 D F2 D2 B2 L2 B2 U B2 U L2 F2 L' F D' B2 D' L D R' U",
        score: 0,
      });
      app.displays[0].setScramble({
        competitorName: "Abraham Lincoln",
        eventID: "333",
        matchupID: "matchup-23",
        competitorMatchupID: "abe",
        attemptID: "1",
        scrambleString:
          "B2 D F2 D2 B2 L2 B2 U B2 U L2 F2 L' F D' B2 D' L D R' U",
        score: 0,
      });
      return;
    }
    case "matchup-24": {
      app.displays[0].setScramble({
        competitorName: "Gilgamesh",
        eventID: "333",
        matchupID: "matchup-24",
        competitorMatchupID: "gilgamesh",
        attemptID: "1",
        scrambleString:
          "D2 F U R' U' D F L U' R' L2 B D2 R2 L2 F D2 F' L2 F R2",
        score: 1,
      });
      app.displays[0].setScramble({
        competitorName: "Enkidu",
        eventID: "333",
        matchupID: "matchup-24",
        competitorMatchupID: "enkidu",
        attemptID: "1",
        scrambleString:
          "D2 F U R' U' D F L U' R' L2 B D2 R2 L2 F D2 F' L2 F R2",
        score: 1,
      });
      return;
    }
  }
}

const localResultDB: Record<string, ResultForTimedAttemptWithPenalty> = {};

function randomNewResult(): ResultForTimedAttemptWithPenalty {
  if (Math.random() < 0.05) {
    return {
      resultForTimedAttempt: "DNF",
      penaltySeconds: 0,
    };
  }
  const resultForTimedAttempt =
    Math.floor(Math.random() * 5000) + Math.floor(Math.random() * 5000) + 5000;
  return {
    resultForTimedAttempt,
    penaltySeconds: 0,
  };
}

function accessResult(
  identifyingInfo: MatchupCallbackIdentifyingInfo,
): ResultForTimedAttemptWithPenalty {
  const uniqueAttemptIdentifier = `${identifyingInfo.matchupID}###${identifyingInfo.competitorMatchupID}###${identifyingInfo.attemptID}`;
  // biome-ignore lint/suspicious/noAssignInExpressions: DRY pattern
  return (localResultDB[uniqueAttemptIdentifier] ??= randomNewResult());
}

async function matchupGetResultCallback(
  identifyingInfo: MatchupCallbackIdentifyingInfo,
): Promise<ResultForTimedAttemptWithPenalty> {
  await simulateLatency();
  return structuredClone(accessResult(identifyingInfo));
}

async function matchupAdjustPenaltyCallback(
  identifyingInfo: MatchupCallbackIdentifyingInfo,
  deltaSeconds: number,
): Promise<ResultForTimedAttemptWithPenalty> {
  await simulateLatency();
  const result = accessResult(identifyingInfo);

  result.penaltySeconds += deltaSeconds;
  if (result.penaltySeconds < 0) {
    result.penaltySeconds = 0;
  }

  return structuredClone(result);
}

async function matchupToggleDNF(
  identifyingInfo: MatchupCallbackIdentifyingInfo,
): Promise<ResultForTimedAttemptWithPenalty> {
  await simulateLatency();
  const result = accessResult(identifyingInfo);

  // A real DB should persist the time and restore it here, but we just generate a new one for testing.
  result.resultForTimedAttempt =
    result.resultForTimedAttempt === "DNF"
      ? randomNewResult().resultForTimedAttempt
      : "DNF";

  return structuredClone(result);
}

async function matchupFinishAttemptCallback(
  identifyingInfo: MatchupCallbackIdentifyingInfo,
): Promise<void> {
  const scrambleInfo = await (async (): Promise<AttemptScrambleInfo> => {
    throw new Error("TODO: implement using a proper backend");
  })();
  app.displays[identifyingInfo.displayNumber].setScramble(scrambleInfo);
}

const app = document.body.appendChild(
  new ScrambleTable({
    competitorScrambleDisplayOptions: {
      resultInput: "show",
    },
    callbacks: {
      matchupGetResultCallback,
      matchupAdjustPenaltyCallback,
      matchupToggleDNF,
      matchupFinishAttemptCallback,
      refreshCurrentMatchupsCallback,
      resetCallback: async (matchupID) => console.log("Reset:", { matchupID }),
      matchupSelectedCallback,
    },
    showMatchupsSelection: "show",
  }),
);
// biome-ignore lint/suspicious/noExplicitAny: Augmentation.
(globalThis as any).app = app;

app.addEventListener(
  "scramble-cleared",
  (e: CustomEventInit<{ displayIndex: number }>) => {
    console.log(
      `Scramble cleared for display index: ${customEventWorkaround(e).detail.displayIndex}`,
    );
  },
);

matchupSelectedCallback("matchup-23");

import { eventInfo } from "cubing/puzzles";
import "cubing/twisty";

import { Alg } from "cubing/alg";
import type {
  AttemptScrambleInfo,
  MatchupAttemptScrambleInfo,
} from "../AttemptScrambleInfo";
// @ts-expect-error
import css from "./CompetitorScrambleDisplay.css";
import templateHTML from "./CompetitorScrambleDisplay.template.html";
import { addCSS, parseHTML } from "./html";
import type {
  MatchupCallbackIdentifyingInfo,
  SharedState,
} from "./SharedState";
import "./MultiBlindGridDisplay";
import { mustExist } from "../mustExist";
import { ResultAdjustment } from "./ResultAdjustment";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

let unassignedCounter = 0;
function nextUnassigned(): string {
  return `(unassigned #${++unassignedCounter})`;
}

export interface CompetitorScrambleDisplayOptions {
  resultInput?: "hide" | "show";
  generateScrambleButton?: "auto" | "hide" | "show";
}

export class CompetitorScrambleDisplay extends HTMLElement {
  #resultAdjustment: ResultAdjustment | undefined;

  constructor(
    private options: CompetitorScrambleDisplayOptions,
    private sharedState: SharedState,
    public readonly displayIndex: number,
    private onScrambleCleared: () => void,
  ) {
    super();
  }

  connectedCallback() {
    this.append(template.content.cloneNode(true));
    this.#setField("scrambler-name", nextUnassigned());
    mustExist(this.querySelector(".set-scrambler")).addEventListener(
      "click",
      () => this.#onSetScrambler(),
    );
    this.querySelector("twisty-alg-viewer")!.twistyPlayer =
      this.querySelector("twisty-player");
    mustExist(
      this.querySelector<HTMLButtonElement>(".multi .previous"),
    ).addEventListener("click", () => this.#currentSubScrambleDelta(-1));
    mustExist(
      this.querySelector<HTMLButtonElement>(".multi .next"),
    ).addEventListener("click", () => this.#currentSubScrambleDelta(1));
    mustExist(
      this.querySelector<HTMLButtonElement>(".multi .all"),
    ).addEventListener("click", () => this.#toggleShowAllSubScrambles());
    mustExist(this.querySelector(".clear-scramble")).addEventListener(
      "click",
      () => this.clearScramble(),
    );

    mustExist(this.querySelector("multi-blind-grid-display")).addEventListener(
      "scramble-clicked",
      // Workaround for https://github.com/microsoft/TypeScript/issues/28357
      (e: CustomEventInit<{ idx: number }>) => {
        this.#currentSubScrambleSetIndex(e.detail!.idx);
      },
    );
    this.#initializeAdditionalActions();
    if (this.options.resultInput === "show") {
      this.append(
        // biome-ignore lint/suspicious/noAssignInExpressions: DRY pattern
        (this.#resultAdjustment = new ResultAdjustment(this, this.sharedState)),
      );
    }
  }

  // TODO: unify dialog code with main settings
  #initializeAdditionalActions() {
    mustExist(
      this.querySelector(".additional-actions-button"),
    ).addEventListener("click", () => {
      this.#showAdditionalActions();
    });

    mustExist(
      this.querySelector(".additional-actions button.close"),
    ).addEventListener("click", () => {
      this.#hideAdditionalActions();
    });
  }

  #showAdditionalActions() {
    mustExist(
      this.querySelector<HTMLDialogElement>(".additional-actions"),
    ).showModal();
  }

  #hideAdditionalActions() {
    mustExist(
      this.querySelector<HTMLDialogElement>(".additional-actions"),
    ).close();
  }

  clearScramble() {
    this.classList.remove("scramble-signed");
    this.#toggleShowAllSubScrambles(false);
    this.#setField("competitor", "");
    this.#setField("event", "");
    this.#setField("round", "");
    this.#setField("scramble-set", "");
    this.#setField("attempt", "");
    mustExist(this.querySelector("twisty-player")).alg = new Alg();
    mustExist(this.querySelector("multi-blind-grid-display")).setScrambles([]);
    mustExist(
      this.querySelector(".multi .current-sub-scramble-num"),
    ).textContent = "—";
    mustExist(
      this.querySelector(".multi .total-sub-scramble-num"),
    ).textContent = "—";
    mustExist(this.querySelector<HTMLButtonElement>(".multi .next")).disabled =
      true;
    mustExist(this.querySelector<HTMLButtonElement>(".multi .all")).disabled =
      true;
    this.#hideAdditionalActions();
    this.onScrambleCleared();
    this.#resultAdjustment?.reset();
  }

  #info: AttemptScrambleInfo | undefined;
  async setScramble(info: AttemptScrambleInfo): Promise<void> {
    const isMatchup = "matchupID" in info;
    this.classList.toggle("matchup", isMatchup);
    this.classList.toggle("score", isMatchup);
    this.classList.toggle("round", !isMatchup);

    this.classList.remove("scramble-signed");
    this.#toggleShowAllSubScrambles(false);
    this.#info = info;

    let competitorField = info.competitorName;
    if (typeof info.competitorCompetitionID !== "undefined") {
      competitorField = `${competitorField} (ID ${info.competitorCompetitionID})`;
    }
    this.#setField("competitor", competitorField);
    const eventInfoData = mustExist(eventInfo(info.eventID));

    this.#setField("event", eventInfoData.eventName);
    this.#setField("attempt", `Attempt ${info.attemptID}`);

    const twistyPlayer = mustExist(this.querySelector("twisty-player"));
    twistyPlayer.puzzle = eventInfoData.puzzleID;
    if (isMatchup) {
      this.#toggleShowAllSubScrambles(false);
      twistyPlayer.alg = info.scrambleString;
      this.#setField("matchup", `Matchup: ${info.matchupID}`);
      this.#setField("score", `Score: ${info.score ?? "—"}`);
    } else {
      this.#setField("round", `Round ${info.roundNumber}`);
      this.#setField("scramble-set", `Scramble Set ${info.scrambleSetNumber}`);

      const multiElem = mustExist(this.querySelector<HTMLElement>(".multi"));

      const scrambleStringOrStrings =
        await this.sharedState.scrambleJSONCache.getScrambleStringOrStrings(
          info,
        );
      if (typeof scrambleStringOrStrings === "string") {
        this.classList.remove("show-multi");
        twistyPlayer.alg = scrambleStringOrStrings;
        twistyPlayer.timestamp = "end";
        multiElem.hidden = true;
      } else {
        this.classList.add("show-multi");
        this.#currentSubScrambleStrings = scrambleStringOrStrings;
        this.#currentSubScrambleIndex = 0;
        multiElem.hidden = false;
        mustExist(
          this.querySelector(".multi .total-sub-scramble-num"),
        ).textContent = `${scrambleStringOrStrings.length}`;
        mustExist(this.querySelector("multi-blind-grid-display")).setScrambles(
          scrambleStringOrStrings,
        );
        this.#currentSubScrambleSetIndex(0);
        mustExist(
          this.querySelector<HTMLButtonElement>(".multi .all"),
        ).disabled = false;
      }
    }
  }

  matchupACallbackIdentifyingInfo(): MatchupCallbackIdentifyingInfo {
    const { matchupID, competitorMatchupID, attemptID } = this
      .#info as MatchupAttemptScrambleInfo;
    const { scramblerName, displayIndex } = this;
    return {
      matchupID,
      competitorMatchupID,
      attemptID,
      scrambler: scramblerName,
      displayNumber: displayIndex,
    };
  }

  #showingMultiScrambles(): boolean {
    return this.classList.contains("show-multi");
  }

  #showingAllSubScrambles(): boolean {
    return !mustExist(this.querySelector("multi-blind-grid-display")).hidden;
  }

  #toggleShowAllSubScrambles(forceShow?: boolean) {
    if (typeof forceShow === "undefined") {
      forceShow = !this.#showingAllSubScrambles();
    }

    mustExist(this.querySelector("twisty-player")).hidden = forceShow;
    this.classList.toggle("show-multi-grid", forceShow);
    mustExist(this.querySelector("multi-blind-grid-display")).hidden =
      !forceShow;
  }

  #currentSubScrambleIndex = 0;
  #currentSubScrambleStrings: string[] = [];
  #currentSubScrambleSetIndex(idx: number) {
    this.#toggleShowAllSubScrambles(false);

    this.#currentSubScrambleIndex = idx;
    this.#currentSubScrambleIndex = Math.max(0, this.#currentSubScrambleIndex);
    this.#currentSubScrambleIndex = Math.min(
      this.#currentSubScrambleIndex,
      this.#currentSubScrambleStrings.length - 1,
    );
    mustExist(this.querySelector("twisty-player")).alg =
      this.#currentSubScrambleStrings[this.#currentSubScrambleIndex];
    mustExist(this.querySelector("twisty-player")).timestamp = "end";
    mustExist(
      this.querySelector(".multi .current-sub-scramble-num"),
    ).textContent = `${this.#currentSubScrambleIndex + 1}`;
    mustExist(
      this.querySelector<HTMLButtonElement>(".multi .previous"),
    ).disabled = idx === 0;
    mustExist(this.querySelector<HTMLButtonElement>(".multi .next")).disabled =
      idx === this.#currentSubScrambleStrings.length - 1;
    mustExist(this.querySelector("multi-blind-grid-display")).setHighlightIndex(
      idx,
    );
  }

  #currentSubScrambleDelta(delta: number) {
    this.#currentSubScrambleSetIndex(this.#currentSubScrambleIndex + delta);
  }

  #setField(field: string, text: string): void {
    for (const elem of this.getElementsByClassName(field)) {
      elem.textContent = text;
    }
  }

  async setScramblerName(scramblerName: string) {
    this.#scramblerName = scramblerName;
    this.#setField("scrambler-name", scramblerName);
  }

  #scramblerName: string | undefined;
  async #onSetScrambler() {
    const setScramblerButton = mustExist(this.querySelector(".set-scrambler"));
    setScramblerButton.textContent = "Please identify this scrambler…";
    const name =
      (await this.sharedState.callbacks.setScramblerCallback?.(
        this.displayIndex,
      )) ?? nextUnassigned();
    void this.setScramblerName(name);
    setScramblerButton.textContent =
      setScramblerButton.getAttribute("data-original-text");
  }

  get scramblerName(): string | undefined {
    return this.#scramblerName;
  }

  markAsSigned() {
    this.classList.add("scramble-signed");
  }

  // - If showing an individual multi scramble:
  //   - Advance to the next scramble, or to the "Show All" view.
  // - Else: Mark as signed
  advanceOrMarkAsSigned() {
    console.log(this.#showingMultiScrambles(), this.#showingAllSubScrambles());
    if (this.#showingMultiScrambles() && !this.#showingAllSubScrambles()) {
      const showingLastSubScramble =
        this.#currentSubScrambleIndex ===
        this.#currentSubScrambleStrings.length - 1;
      if (showingLastSubScramble) {
        this.#toggleShowAllSubScrambles(true);
      } else {
        this.#currentSubScrambleDelta(1);
      }
      return;
    }
    this.markAsSigned();
  }
}

customElements.define("competitor-scramble-display", CompetitorScrambleDisplay);

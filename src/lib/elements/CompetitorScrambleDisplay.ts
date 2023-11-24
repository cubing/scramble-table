import { eventInfo } from "cubing/puzzles";
import "cubing/twisty";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";

// @ts-ignore
import css from "./CompetitorScrambleDisplay.css";
// @ts-ignore
import templateHTML from "./CompetitorScrambleDisplay.template.html";

import type { SharedState } from "./SharedState";
import { addCSS, parseHTML } from "./html";

import "./MultiBlindGridDisplay";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

export class CompetitorScrambleDisplay extends HTMLElement {
  constructor(private sharedState: SharedState, private displayIndex: number) {
    super();
  }

  connectedCallback() {
    this.append(template.content.cloneNode(true));
    this.querySelector(".set-scrambler")!.addEventListener("click", () =>
      this.#onSetScrambler(),
    );
    this.querySelector("twisty-alg-viewer")!.twistyPlayer =
      this.querySelector("twisty-player");
    this.querySelector<HTMLButtonElement>(".multi .previous")!.addEventListener(
      "click",
      () => this.#currentSubScrambleDelta(-1),
    );
    this.querySelector<HTMLButtonElement>(".multi .next")!.addEventListener(
      "click",
      () => this.#currentSubScrambleDelta(1),
    );
    this.querySelector<HTMLButtonElement>(".multi .all")!.addEventListener(
      "click",
      () => this.#toggleShowAllSubScrambles(),
    );
    this.querySelector("multi-blind-grid-display")!.addEventListener(
      "scramble-clicked",
      (e: CustomEvent<{ idx: number }>) => {
        this.#currentSubScrambleSetIndex(e.detail.idx);
      },
    );
  }

  #info: AttemptScrambleInfo | undefined;
  async setScramble(info: AttemptScrambleInfo): Promise<void> {
    this.classList.remove("scramble-signed");
    this.#toggleShowAllSubScrambles(false);
    this.#info = info;

    let competitorField = info.competitorName;
    if (typeof info.competitorCompetitionID !== "undefined") {
      competitorField = `${competitorField} (ID ${info.competitorCompetitionID})`;
    }
    this.#setField("competitor", competitorField);
    const eventInfoData = eventInfo(info.eventID);

    this.#setField("event", eventInfoData.eventName);
    this.#setField("round", `Round ${info.roundNumber}`);
    this.#setField("scramble-set", `Scramble Set ${info.scrambleSetNumber}`);
    this.#setField("attempt", `Attempt ${info.attemptID}`);
    this.querySelector("twisty-player").puzzle = eventInfoData.puzzleID;

    const multiElem = this.querySelector<HTMLElement>(".multi");

    const scrambleStringOrStrings =
      await this.sharedState.scrambleJSONCache.getScrambleStringOrStrings(info);
    if (typeof scrambleStringOrStrings === "string") {
      this.classList.remove("show-multi");
      this.querySelector("twisty-player").alg = scrambleStringOrStrings;
      this.querySelector("twisty-player").timestamp = "end";
      multiElem.hidden = true;
    } else {
      this.classList.add("show-multi");
      this.#currentSubScrambleStrings = scrambleStringOrStrings;
      this.#currentSubScrambleIndex = 0;
      multiElem.hidden = false;
      this.querySelector(
        ".multi .total-sub-scramble-num",
      ).textContent = `${scrambleStringOrStrings.length}`;
      this.querySelector("multi-blind-grid-display").setScrambles(
        scrambleStringOrStrings,
      );
      this.#currentSubScrambleSetIndex(0);
    }
  }

  #showingMultiScrambles(): boolean {
    return this.classList.contains("show-multi");
  }

  #showingAllSubScrambles(): boolean {
    return !this.querySelector("multi-blind-grid-display").hidden;
  }

  #toggleShowAllSubScrambles(forceShow?: boolean) {
    if (typeof forceShow === "undefined") {
      // biome-ignore lint/style/noParameterAssign: 🤷
      forceShow = this.#showingAllSubScrambles();
    }

    this.querySelector("twisty-player").hidden = forceShow;
    this.classList.toggle("show-multi-grid", forceShow);
    this.querySelector("multi-blind-grid-display").hidden = !forceShow;
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
    this.querySelector("twisty-player").alg =
      this.#currentSubScrambleStrings[this.#currentSubScrambleIndex];
    this.querySelector("twisty-player").timestamp = "end";
    this.querySelector(".multi .current-sub-scramble-num").textContent = `${
      this.#currentSubScrambleIndex + 1
    }`;
    this.querySelector<HTMLButtonElement>(".multi .previous").disabled =
      idx === 0;
    this.querySelector<HTMLButtonElement>(".multi .next").disabled =
      idx === this.#currentSubScrambleStrings.length - 1;
    this.querySelector("multi-blind-grid-display").setHighlightIndex(idx);
  }

  #currentSubScrambleDelta(delta: number) {
    this.#currentSubScrambleSetIndex(this.#currentSubScrambleIndex + delta);
  }

  #setField(field: string, text: string): void {
    this.getElementsByClassName(field)[0].textContent = text;
  }

  async #onSetScrambler() {
    const setScramblerButton = this.querySelector(".set-scrambler");
    setScramblerButton.textContent = "Please identify this scrambler…";
    const name = await this.sharedState.setScramblerCallback(this.displayIndex);
    this.#setField("scrambler-name", `Scrambler: ${name}`);
    setScramblerButton.textContent =
      setScramblerButton.getAttribute("data-original-text");
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

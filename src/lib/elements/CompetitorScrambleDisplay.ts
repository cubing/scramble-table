import { eventInfo } from "cubing/puzzles";
import "cubing/twisty";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";

// @ts-ignore
import css from "./CompetitorScrambleDisplay.css";
// @ts-ignore
import templateHTML from "./CompetitorScrambleDisplay.template.html";

import type { SharedState } from "./SharedState";
import { addCSS, parseHTML } from "./html";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

export class CompetitorScrambleDisplay extends HTMLElement {
  constructor(private sharedState: SharedState, private displayIndex: number) {
    super();
  }

  connectedCallback() {
    this.append(template.content.cloneNode(true));
    this.querySelector(".set-scrambler").addEventListener("click", () =>
      this.#onSetScrambler(),
    );
    this.querySelector("twisty-alg-viewer").twistyPlayer =
      this.querySelector("twisty-player");
    this.querySelector<HTMLButtonElement>(".multi .previous").addEventListener(
      "click",
      () => this.#onCurrentSubScrambleIncrement(-1),
    );
    this.querySelector<HTMLButtonElement>(".multi .next").addEventListener(
      "click",
      () => this.#onCurrentSubScrambleIncrement(1),
    );
  }

  #info: AttemptScrambleInfo | undefined;
  async setScramble(info: AttemptScrambleInfo): Promise<void> {
    this.classList.remove("scramble-signed");
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
      this.querySelector("twisty-player").alg = scrambleStringOrStrings;
      multiElem.hidden = true;
    } else {
      this.#currentSubScrambleStrings = scrambleStringOrStrings;
      this.querySelector("twisty-player").alg = scrambleStringOrStrings[0];
      this.#currentSubScrambleIndex = 0;
      multiElem.hidden = false;
      this.querySelector(
        ".multi .total-sub-scramble-num",
      ).textContent = `${scrambleStringOrStrings.length}`;
    }
  }

  #currentSubScrambleIndex = 0;
  #currentSubScrambleStrings: string[] = [];
  #onCurrentSubScrambleIncrement(delta: number) {
    this.#currentSubScrambleIndex += delta;
    this.#currentSubScrambleIndex = Math.max(0, this.#currentSubScrambleIndex);
    this.#currentSubScrambleIndex = Math.min(
      this.#currentSubScrambleIndex,
      this.#currentSubScrambleStrings.length - 1,
    );
    this.querySelector("twisty-player").alg =
      this.#currentSubScrambleStrings[this.#currentSubScrambleIndex];
    this.querySelector(".multi .current-sub-scramble-num").textContent = `${
      this.#currentSubScrambleIndex + 1
    }`;
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
}

customElements.define("competitor-scramble-display", CompetitorScrambleDisplay);

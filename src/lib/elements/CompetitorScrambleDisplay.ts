import { eventInfo } from "cubing/puzzles";
import "cubing/twisty";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";

// @ts-ignore
import css from "./CompetitorScrambleDisplay.css";
// @ts-ignore
import templateHTML from "./CompetitorScrambleDisplay.template.html";

import type { CachedScrambleJSON } from "../json/CachedScrambleJSON";
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
  }

  #info: AttemptScrambleInfo | undefined;
  async setScramble(info: AttemptScrambleInfo): Promise<void> {
    this.#info = info;

    const scramble = await this.sharedState.cachedScrambleJSON.getScramble(
      info,
    );

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
    this.querySelector("twisty-player").alg = scramble;
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
}

customElements.define("competitor-scramble-display", CompetitorScrambleDisplay);

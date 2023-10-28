import { eventInfo } from "cubing/puzzles";

import type { AttemptScrambleInfo } from "../AttemptScrambleInfo";

// @ts-ignore
import mainCSS from "./CompetitorScrambleDisplay.css";
// @ts-ignore
import templateHTML from "./CompetitorScrambleDisplay.template.html";
// @ts-ignore
import css from "./main.css";

import { addCSS, parse as parseHTML } from "./html";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(mainCSS);
addCSS(css);

export class CompetitorScrambleDisplay extends HTMLElement {
  connectedCallback() {
    this.append(template.content.cloneNode(true));
    this.querySelector("twisty-alg-viewer").twistyPlayer =
      this.querySelector("twisty-player");
  }

  #info: AttemptScrambleInfo | undefined;
  setScramble(info: AttemptScrambleInfo): void {
    this.#info = info;

    this.#setField(
      "competitor",
      `${info.competitorName} (${info.competitorCompetitionID})`,
    );
    const eventInfoData = eventInfo(info.eventID);
    this.#setField("event", eventInfoData.eventName);
    this.#setField("round", `Round ${info.roundNumber}`);
    this.#setField("group", `Group ${info.groupID}`);
    this.#setField("attempt", `Attempt ${info.attemptID}`);
    this.querySelector("twisty-player").puzzle = eventInfoData.puzzleID;
    this.querySelector("twisty-player").alg = info.scramble;
  }

  #setField(field: string, text: string): void {
    this.getElementsByClassName(field)[0].textContent = text;
  }
}

customElements.define("competitor-scramble-display", CompetitorScrambleDisplay);

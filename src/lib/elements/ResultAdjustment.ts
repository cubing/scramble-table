import type { ExperimentalMillisecondTimestamp } from "cubing/twisty";
import { addCSS, parseHTML } from "./html";

import {
  type ResultForTimedAttemptWithPenalty,
  formatResultForTimedAttempt,
  formatResultForTimedAttemptWithPenalty,
} from "../vendor/timer.cubing.net/stats";
import type { CompetitorScrambleDisplay } from "./CompetitorScrambleDisplay";
// @ts-ignore
import css from "./ResultAdjustment.css";
// @ts-ignore
import templateHTML from "./ResultAdjustment.template.html";
import type { SharedState } from "./SharedState";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

export class ResultAdjustment extends HTMLElement {
  constructor(
    private competitorScrambleDisplay: CompetitorScrambleDisplay,
    private sharedState: SharedState,
  ) {
    super();
    this.append(template.content.cloneNode(true));
    this.#update();

    this.#getResultElem.addEventListener("click", () =>
      this.#getResultPressed(),
    );
    this.#plusTwoButton.addEventListener("click", () => this.adjustPenalty(2));
    this.#minusTwoButton.addEventListener("click", () =>
      this.adjustPenalty(-2),
    );
    this.#dnfButton.addEventListener("click", () => this.toggleDNF());
    this.#finishAttemptButton.addEventListener("click", () =>
      this.finishAttemptPressed(),
    );
  }

  #resultForTimedAttemptWithPenalty:
    | ResultForTimedAttemptWithPenalty
    | undefined;

  set result(timedResultWithPenalty:
    | ResultForTimedAttemptWithPenalty
    | undefined) {
    this.#resultForTimedAttemptWithPenalty = timedResultWithPenalty;
    this.#update();
  }

  get result(): ResultForTimedAttemptWithPenalty | undefined {
    return structuredClone(this.#resultForTimedAttemptWithPenalty);
  }

  #update() {
    this.#timedResultElem.textContent = this.#resultForTimedAttemptWithPenalty
      ? formatResultForTimedAttemptWithPenalty(
          this.#resultForTimedAttemptWithPenalty,
        )
      : "—.——";
    this.#minusTwoButton.disabled =
      this.#resultForTimedAttemptWithPenalty &&
      this.#resultForTimedAttemptWithPenalty.penaltySeconds === 0;
  }

  get #getResultElem(): HTMLButtonElement {
    return this.querySelector(".get-result");
  }

  async #getResultPressed() {
    this.#loading = true;
    if (!this.sharedState.callbacks.matchupGetResultCallback) {
      throw new Error("Missing `getResultCallback`!");
    }
    this.result = await this.sharedState.callbacks.matchupGetResultCallback(
      this.competitorScrambleDisplay.matchupACallbackIdentifyingInfo(),
    );
    this.#loading = false;
  }

  get #timedResultElem(): HTMLButtonElement {
    return this.querySelector("timed-result");
  }

  get #plusTwoButton(): HTMLButtonElement {
    return this.querySelector(".plus-2");
  }

  get #dnfButton(): HTMLButtonElement {
    return this.querySelector(".DNF");
  }

  // `deltaSeconds` will usually be `2` or `-2`.
  async adjustPenalty(deltaSeconds: number) {
    this.#loading = true;
    if (this.#resultForTimedAttemptWithPenalty) {
      const { result } = this;
      result.penaltySeconds += deltaSeconds;
      this.result = result;
    }
    if (!this.sharedState.callbacks.matchupAdjustPenaltyCallback) {
      throw new Error("Missing `matchupAdjustPenaltyCallback`!");
    }
    this.result = await this.sharedState.callbacks.matchupAdjustPenaltyCallback(
      this.competitorScrambleDisplay.matchupACallbackIdentifyingInfo(),
      deltaSeconds,
    );
    this.#loading = false;
  }

  async toggleDNF() {
    this.#loading = true;
    if (
      this.#resultForTimedAttemptWithPenalty.resultForTimedAttempt !== "DNF"
    ) {
      const { result } = this;
      result.resultForTimedAttempt = "DNF";
      this.result = result;
    }
    if (!this.sharedState.callbacks.matchupToggleDNF) {
      throw new Error("Missing `matchupToggleDNF` callback!");
    }
    this.result = await this.sharedState.callbacks.matchupToggleDNF(
      this.competitorScrambleDisplay.matchupACallbackIdentifyingInfo(),
    );
    this.#loading = false;
  }

  get #minusTwoButton(): HTMLButtonElement {
    return this.querySelector(".minus-2");
  }

  get #finishAttemptButton(): HTMLButtonElement {
    return this.querySelector(".finish-attempt");
  }

  async finishAttemptPressed(): Promise<void> {
    await this.sharedState.callbacks.matchupFinishAttemptCallback(
      this.competitorScrambleDisplay.matchupACallbackIdentifyingInfo(),
    );
    this.reset();
  }

  reset() {
    this.result = undefined;
  }

  set #loading(loading: boolean) {
    this.classList.toggle("loading", loading);
    this.#finishAttemptButton.disabled = loading;
  }
}

customElements.define("result-adjustment", ResultAdjustment);

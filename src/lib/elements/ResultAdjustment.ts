import { mustExist } from "../mustExist";
import {
  formatResultForTimedAttemptWithPenalty,
  type ResultForTimedAttemptWithPenalty,
} from "../vendor/timer.cubing.net/stats";
import type { CompetitorScrambleDisplay } from "./CompetitorScrambleDisplay";
import { addCSS, parseHTML } from "./html";
// @ts-expect-error
import css from "./ResultAdjustment.css";
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
      !!this.#resultForTimedAttemptWithPenalty &&
      this.#resultForTimedAttemptWithPenalty.penaltySeconds === 0;
  }

  get #getResultElem(): HTMLButtonElement {
    return mustExist(this.querySelector(".get-result"));
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
    return mustExist(this.querySelector("timed-result"));
  }

  get #plusTwoButton(): HTMLButtonElement {
    return mustExist(this.querySelector(".plus-2"));
  }

  get #dnfButton(): HTMLButtonElement {
    return mustExist(this.querySelector(".DNF"));
  }

  // `deltaSeconds` will usually be `2` or `-2`.
  async adjustPenalty(deltaSeconds: number) {
    this.#loading = true;
    if (this.#resultForTimedAttemptWithPenalty) {
      const result = mustExist(this.result);
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
      this.#resultForTimedAttemptWithPenalty?.resultForTimedAttempt !== "DNF"
    ) {
      const result = mustExist(this.result);
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
    return mustExist(this.querySelector(".minus-2"));
  }

  get #finishAttemptButton(): HTMLButtonElement {
    return mustExist(this.querySelector(".finish-attempt"));
  }

  async finishAttemptPressed(): Promise<void> {
    // TODO: `?.`?
    await mustExist(this.sharedState.callbacks.matchupFinishAttemptCallback)(
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

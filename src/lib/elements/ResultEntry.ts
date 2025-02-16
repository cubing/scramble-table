import { addCSS, parseHTML } from "./html";

// @ts-ignore
import css from "./ResultEntry.css";
// @ts-ignore
import templateHTML from "./ResultEntry.template.html";
import type { ResultForTimedAttempt, SharedState } from "./SharedState";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

const RESULT_FOR_TIMED_ATTEMPT_REGEX =
  "(((([0-5]?[0-9]):)?([0-5]?[0-9]):)?([0-9]{1,2}).([0-9]{2,3})|(DNF|DNS))";

function parseMilliseconds(result: string): ResultForTimedAttempt {
  const match = result.match(RESULT_FOR_TIMED_ATTEMPT_REGEX);
  if (!match) {
    throw new Error(`Result could not be parsed: ${result}`);
  }
  let [
    _,
    __,
    ___,
    hourString,
    ____,
    minString,
    secString,
    msString,
    DNF_or_DNS,
    _____,
  ] = match;
  if (DNF_or_DNS) {
    return DNF_or_DNS as "DNF" | "DNS";
  }
  hourString ??= "00";
  minString ??= "00";
  msString = msString.padEnd(3, "0");

  const hour = Number.parseInt(hourString, 10);
  const min = Number.parseInt(minString, 10);
  const sec = Number.parseInt(secString, 10);
  const ms = Number.parseInt(msString, 10);

  return ((hour * 60 + min) * 60 + sec) * 1000 + ms;
}

const ANNOTATION_STATUSES = [
  "ready",
  "submitting",
  "success",
  "failed",
] as const;

export class ResultEntry extends HTMLElement {
  constructor(
    private displayIndex,
    private sharedState: SharedState,
  ) {
    super();
    this.append(template.content.cloneNode(true));
    if (this.input.getAttribute("pattern") !== RESULT_FOR_TIMED_ATTEMPT_REGEX) {
      console.warn("Mismatching result time regex!", this);
    }

    this.form.addEventListener("submit", (e) => this.onFormSubmit(e));
    this.form.addEventListener("input", (e) =>
      this.setAnnotationStatus("ready"),
    );
  }

  get input(): HTMLInputElement {
    return this.querySelector("input");
  }

  get form(): HTMLFormElement {
    return this.querySelector("form");
  }

  get annotation(): HTMLFormElement {
    return this.querySelector(".annotation");
  }

  private async onFormSubmit(e: SubmitEvent) {
    // We rely on HTML form input `pattern` attribute validation to enforce validity.
    e.preventDefault();
    const ms = parseMilliseconds(this.input.value);
    this.setAnnotationStatus("submitting");
    try {
      await this.sharedState.callbacks.resultSubmittedCallback?.(
        this.displayIndex,
        ms,
      );
      this.setAnnotationStatus("success");
    } catch (e) {
      this.setAnnotationStatus("failed");
      throw e;
    }
  }

  reset() {
    this.input.value = "";
    this.setAnnotationStatus("ready");
  }

  setAnnotationStatus(status: (typeof ANNOTATION_STATUSES)[number]) {
    for (const annotationStatus of ANNOTATION_STATUSES) {
      this.annotation.classList.toggle(
        annotationStatus,
        annotationStatus === status,
      );
    }
  }
}

customElements.define("result-entry", ResultEntry);

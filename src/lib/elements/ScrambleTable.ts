import "cubing/twisty";
import { CompetitorScrambleDisplay } from "./CompetitorScrambleDisplay";

import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
} from "../json/format";

import {
  CachedScrambleJSON,
  type CachedScrambleJSONDelegate,
} from "../json/CachedScrambleJSON";
import { addCSS, parseHTML } from "./html";

// @ts-ignore
import css from "./ScrambleTable.css";
// @ts-ignore
import templateHTML from "./ScrambleTable.template.html";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

const DEFAULT_NUM_DISPLAYS = 2;
export class ScrambleTable
  extends HTMLElement
  implements CachedScrambleJSONDelegate
{
  public displays: CompetitorScrambleDisplay[] = [];
  private cachedScrambleJSON;
  constructor(numDisplays: number = DEFAULT_NUM_DISPLAYS) {
    super();
    // TODO: Defer some of this to `connectedCallback`?
    this.append(template.content.cloneNode(true));
    this.cachedScrambleJSON = new CachedScrambleJSON(this); // TODO: place this in a less fragile location.

    for (let i = 0; i < numDisplays; i++) {
      this.addDisplay();
    }
    this.#initializeSettings();
  }

  #initializeSettings() {
    this.querySelector("header button").addEventListener("click", () => {
      this.#toggleSettings();
    });

    // TODO: separate the settings into a separate element?
    const inputFeedback = this.querySelector(".input-feedback");
    this.querySelector("scramble-table-settings").addEventListener(
      "change",
      async (e) => {
        try {
          inputFeedback.textContent = "Setting encrypted JSON…";
          this.cachedScrambleJSON.setEncryptedScrambleJSON(
            JSON.parse(await (e.target as HTMLInputElement).files[0].text()),
          );
          inputFeedback.textContent = "Setting encrypted JSON… Success!";
          await new Promise((resolve) => setTimeout(resolve, 1000));
          this.#toggleSettings();
        } catch (e) {
          inputFeedback.textContent = `Setting encrypted JSON… Error: ${e}`;
          console.error(e);
        }
      },
    );
    this.querySelector(".clear-json").addEventListener("click", () => {
      this.cachedScrambleJSON.clear();
      location.reload();
    });
  }

  #toggleSettings() {
    this.classList.toggle("show-settings");
  }

  addDisplay() {
    this.displays.push(
      this.appendChild(new CompetitorScrambleDisplay(this.cachedScrambleJSON)),
    );
  }

  setCompetitionName(name: string) {
    this.querySelector(".competition-name").textContent = name;
  }

  setEncryptedScrambleJSONForDebugging(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    this.cachedScrambleJSON.setEncryptedScrambleJSON(json);
  }
}

customElements.define("scramble-table", ScrambleTable);

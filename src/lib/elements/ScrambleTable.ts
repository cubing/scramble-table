import "cubing/twisty";
import { CompetitorScrambleDisplay } from "./CompetitorScrambleDisplay";

import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
} from "../json/format";

import {
  ScrambleJSONCache,
  type ScrambleJSONCacheDelegate,
} from "../json/ScrambleJSONCache";
import { addCSS, parseHTML } from "./html";

import type {
  ScrambleTableInitializationOptions,
  SharedState,
} from "./SharedState";

// @ts-ignore
import css from "./ScrambleTable.css";
// @ts-ignore
import templateHTML from "./ScrambleTable.template.html";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

const NUM_SCRAMBLE_DISPLAYS_LOCALSTORAGE_KEY =
  "scrambleTableNumStorageDisplays";

const DEFAULT_NUM_DISPLAYS = parseInt(
  localStorage[NUM_SCRAMBLE_DISPLAYS_LOCALSTORAGE_KEY] ?? 2,
);
const DEFAULT_SET_SCRAMBLER_CALLBACK = async (
  displayIndex: number,
): Promise<string> => {
  return prompt(`Please enter the name of scrambler ${displayIndex + 1}:`);
};

export class ScrambleTable
  extends HTMLElement
  implements ScrambleJSONCacheDelegate
{
  public displays: CompetitorScrambleDisplay[] = [];
  private sharedState: SharedState;
  constructor(options?: ScrambleTableInitializationOptions) {
    super();
    // TODO: Defer some of this to `connectedCallback`?
    this.append(template.content.cloneNode(true));
    const scrambleJSONCache = new ScrambleJSONCache(this); // TODO: place this in a less fragile location.
    const setScramblerCallback =
      options?.setScramblerCallback ?? DEFAULT_SET_SCRAMBLER_CALLBACK;

    this.sharedState = {
      scrambleJSONCache,
      setScramblerCallback,
    };

    const initialNumDisplays = options?.numDisplays ?? DEFAULT_NUM_DISPLAYS;
    for (let i = 0; i < initialNumDisplays; i++) {
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
    this.querySelector("scramble-table-settings .file-input").addEventListener(
      "change",
      async (e) => {
        try {
          inputFeedback.textContent = "Setting encrypted JSON…";
          this.sharedState.scrambleJSONCache.setEncryptedScrambleJSON(
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
      this.sharedState.scrambleJSONCache.clear();
      location.reload();
    });

    const numScrambleDisplaysInput = this.querySelector<HTMLInputElement>(
      ".num-scramble-displays",
    );
    numScrambleDisplaysInput.value = `${this.displays.length}`;
    numScrambleDisplaysInput.addEventListener("change", () => {
      const newNumScrambleDisplays = parseInt(numScrambleDisplaysInput.value);
      while (this.displays.length < newNumScrambleDisplays) {
        this.addDisplay();
      }
      while (this.displays.length > newNumScrambleDisplays) {
        this.removeLastDisplay();
      }
      localStorage[NUM_SCRAMBLE_DISPLAYS_LOCALSTORAGE_KEY] =
        newNumScrambleDisplays;
    });
  }

  #toggleSettings() {
    this.classList.toggle("show-settings");
  }

  addDisplay() {
    const idx = this.displays.length;
    this.displays.push(
      this.querySelector("scramble-table-contents").appendChild(
        new CompetitorScrambleDisplay(this.sharedState, idx),
      ),
    );
  }

  removeLastDisplay() {
    const display = this.displays.splice(-1)[0];
    display.remove();
  }

  setCompetitionName(name: string) {
    this.querySelector(".competition-name").textContent = name;
  }

  setEncryptedScrambleJSONForDebugging(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    this.sharedState.scrambleJSONCache.setEncryptedScrambleJSON(json);
  }

  customHeaderElement(): HTMLElement {
    return this.querySelector(".custom-header-element");
  }
}

customElements.define("scramble-table", ScrambleTable);

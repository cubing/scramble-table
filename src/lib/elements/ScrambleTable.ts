import "cubing/twisty";

import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
} from "../json/format";
import {
  ScrambleJSONCache,
  type ScrambleJSONCacheDelegate,
} from "../json/ScrambleJSONCache";
import { mustExist } from "../mustExist";
import {
  CompetitorScrambleDisplay,
  type CompetitorScrambleDisplayOptions,
} from "./CompetitorScrambleDisplay";
import { addCSS, parseHTML } from "./html";
// @ts-expect-error
import css from "./ScrambleTable.css";
import templateHTML from "./ScrambleTable.template.html";
import { ScrambleTableMatchupSelection } from "./ScrambleTableMatchupSelection";
import type {
  ScrambleTableCallbacks,
  ScrambleTableInitializationOptions,
  SharedState,
} from "./SharedState";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

const NUM_SCRAMBLE_DISPLAYS_LOCALSTORAGE_KEY =
  "scrambleTableNumStorageDisplays";

const DEFAULT_NUM_DISPLAYS = parseInt(
  localStorage[NUM_SCRAMBLE_DISPLAYS_LOCALSTORAGE_KEY] ?? 2,
  10,
);
const DEFAULT_SET_SCRAMBLER_CALLBACK = async (
  displayIndex: number,
): Promise<string> => {
  return mustExist(
    prompt(`Please enter the name of scrambler ${displayIndex + 1}:`),
  );
};

/**
 *
 * Dispatches the following events:
 *
 * - `"scramble-cleared"`
 */
export class ScrambleTable
  extends HTMLElement
  implements ScrambleJSONCacheDelegate
{
  public displays: CompetitorScrambleDisplay[] = [];
  private sharedState: SharedState;
  private competitorScrambleDisplayOptions: CompetitorScrambleDisplayOptions;
  constructor(options?: ScrambleTableInitializationOptions) {
    super();
    // TODO: Defer some of this to `connectedCallback`?
    this.append(template.content.cloneNode(true));
    const scrambleJSONCache = new ScrambleJSONCache(this); // TODO: place this in a less fragile location.
    const callbacks: ScrambleTableCallbacks = {
      setScramblerCallback: DEFAULT_SET_SCRAMBLER_CALLBACK,
      ...options?.callbacks,
    };

    this.sharedState = {
      scrambleJSONCache,
      callbacks,
    };

    this.competitorScrambleDisplayOptions =
      options?.competitorScrambleDisplayOptions ?? {};

    const initialNumDisplays = options?.numDisplays ?? DEFAULT_NUM_DISPLAYS;
    for (let i = 0; i < initialNumDisplays; i++) {
      this.addDisplay();
    }
    this.#initializeSettings();

    if (options?.showMatchupsSelection === "show") {
      const scrambleTableMatchupSelection = new ScrambleTableMatchupSelection(
        this.sharedState,
      );
      this.insertBefore(
        scrambleTableMatchupSelection,
        this.#scrambleTableContents,
      );
    }
  }

  #onScrambleCleared(displayIndex: number) {
    this.dispatchEvent(
      new CustomEvent("scramble-cleared", {
        detail: {
          displayIndex,
        },
      }),
    );
  }

  #initializeSettings() {
    mustExist(this.querySelector("header .settings-button")).addEventListener(
      "click",
      () => {
        this.#showSettings();
      },
    );

    mustExist(
      this.querySelector(".scramble-table-settings button.close"),
    ).addEventListener("click", () => {
      this.#hideSettings();
    });
    // TODO: separate the settings into a separate element?
    const inputFeedback = mustExist(this.querySelector(".input-feedback"));
    mustExist(
      this.querySelector(".scramble-table-settings .file-input"),
    ).addEventListener("change", async (e) => {
      try {
        inputFeedback.textContent = "Setting encrypted JSON…";
        this.sharedState.scrambleJSONCache.setEncryptedScrambleJSON(
          JSON.parse(
            await mustExist((e.target as HTMLInputElement).files)[0].text(),
          ),
        );
        inputFeedback.textContent = "Setting encrypted JSON… Success!";
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.#hideSettings();
      } catch (e) {
        inputFeedback.textContent = `Setting encrypted JSON… Error: ${e}`;
        console.error(e);
      }
    });
    mustExist(this.querySelector(".clear-json")).addEventListener(
      "click",
      () => {
        this.sharedState.scrambleJSONCache.clear();
        location.reload();
      },
    );

    const numScrambleDisplaysInput = mustExist(
      this.querySelector<HTMLInputElement>(".num-scramble-displays"),
    );
    numScrambleDisplaysInput.value = `${this.displays.length}`;
    numScrambleDisplaysInput.addEventListener("change", () => {
      const newNumScrambleDisplays = parseInt(
        numScrambleDisplaysInput.value,
        10,
      );
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

  #showSettings() {
    mustExist(
      this.querySelector<HTMLDialogElement>(".scramble-table-settings"),
    ).showModal();
  }

  #hideSettings() {
    mustExist(
      this.querySelector<HTMLDialogElement>(".scramble-table-settings"),
    ).close();
  }

  get #scrambleTableContents(): HTMLElement {
    return mustExist(this.querySelector("scramble-table-contents"));
  }

  addDisplay() {
    const idx = this.displays.length;
    this.displays.push(
      this.#scrambleTableContents.appendChild(
        new CompetitorScrambleDisplay(
          this.competitorScrambleDisplayOptions,
          this.sharedState,
          idx,
          () => {
            this.#onScrambleCleared(idx);
          },
        ),
      ),
    );
  }

  removeLastDisplay() {
    const display = this.displays.splice(-1)[0];
    display.remove();
  }

  setCompetitionName(name: string) {
    mustExist(this.querySelector(".competition-name")).textContent = name;
  }

  setEncryptedScrambleJSONForDebugging(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    this.sharedState.scrambleJSONCache.setEncryptedScrambleJSON(json);
  }

  customHeaderElement(): HTMLElement {
    return mustExist(this.querySelector(".custom-header-element"));
  }
}

customElements.define("scramble-table", ScrambleTable);

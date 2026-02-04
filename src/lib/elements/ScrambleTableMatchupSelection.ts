import { mustExist } from "../mustExist";
import { addCSS, parseHTML } from "./html";

// @ts-expect-error
import css from "./ScrambleTableMatchupSelection.css";
import templateHTML from "./ScrambleTableMatchupSelection.template.html";
import type { MatchupID, MatchupName, SharedState } from "./SharedState";

const template = parseHTML<HTMLTemplateElement>(templateHTML);
addCSS(css);

export class ScrambleTableMatchupSelection extends HTMLElement {
  constructor(private sharedState: SharedState) {
    super();
    // TODO: Defer some of this to `connectedCallback`?
    this.append(template.content.cloneNode(true));

    this.#refreshMatchups.addEventListener("click", async () => {
      void this.refreshMatchups();
    });
    void this.refreshMatchups();

    this.#resetCurrentMatchups.addEventListener("click", async () => {
      const { resetCallback } = this.sharedState.callbacks;
      if (resetCallback) {
        await this.resetCurrentMatchup();
      }
    });

    this.#select.addEventListener("change", async () => {
      const { matchupSelectedCallback } = this.sharedState.callbacks;
      if (matchupSelectedCallback) {
        matchupSelectedCallback(this.#select.value);
      }
    });
  }

  get #select(): HTMLSelectElement {
    return mustExist(this.querySelector("select"));
  }

  get #refreshMatchups(): HTMLButtonElement {
    return mustExist(this.querySelector(".refresh-matchups"));
  }

  get #resetCurrentMatchups(): HTMLButtonElement {
    return mustExist(this.querySelector(".reset"));
  }

  private async refreshMatchups(): Promise<void> {
    const { refreshCurrentMatchupsCallback } = this.sharedState.callbacks;
    if (refreshCurrentMatchupsCallback) {
      this.setMatchups(await refreshCurrentMatchupsCallback());
    }
  }

  private async resetCurrentMatchup(): Promise<void> {
    const { resetCallback } = this.sharedState.callbacks;
    if (resetCallback) {
      await resetCallback(this.#select.value);
    }
    // TODO: what should we reset here?
  }

  private setMatchups(matchups: Record<MatchupID, MatchupName>): void {
    const select = this.#select;
    const { value } = select;
    select.textContent = "";
    for (const [matchupID, matchupName] of Object.entries(matchups)) {
      const option = select.appendChild(document.createElement("option"));
      option.textContent = matchupName;
      option.value = matchupID;
    }
    select.value = value; // TODO: what if this fails?
    if (!select.value) {
      const option = document.createElement("option");
      option.textContent = "Click to select a matchup.";
      select.prepend(option);
    }
  }
}

customElements.define(
  "scramble-table-matchup-selection",
  ScrambleTableMatchupSelection,
);

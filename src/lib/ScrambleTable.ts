import "cubing/twisty";
import { CompetitorScrambleDisplay } from "./elements/CompetitorScrambleDisplay";

import type {
  PartialCompetitionScramblesJSON,
  ScrambleSetEncryptedJSON,
} from "./json/format";

import { CachedScrambleJSON } from "./CachedScrambleJSON";

const DEFAULT_NUM_DISPLAYS = 2;
export class ScrambleTable {
  public displays: CompetitorScrambleDisplay[] = [];
  private cachedScrambleJSON = new CachedScrambleJSON();
  constructor(numDisplays: number = DEFAULT_NUM_DISPLAYS) {
    for (let i = 0; i < numDisplays; i++) {
      this.addDisplay();
    }
  }

  addDisplay() {
    this.displays.push(
      document.body.appendChild(
        new CompetitorScrambleDisplay(this.cachedScrambleJSON),
      ),
    );
  }

  setEncryptedScrambleJSON(
    json: PartialCompetitionScramblesJSON<ScrambleSetEncryptedJSON>,
  ) {
    this.cachedScrambleJSON.setEncryptedScrambleJSON(json);
  }
}

import "cubing/twisty";
import { CompetitorScrambleDisplay } from "./elements/CompetitorScrambleDisplay";

const DEFAULT_NUM_DISPLAYS = 2;

export class ScrambleTable {
  public displays: CompetitorScrambleDisplay[] = [];
  constructor(numDisplays: number = DEFAULT_NUM_DISPLAYS) {
    for (let i = 0; i < numDisplays; i++) {
      this.addDisplay();
    }
  }

  addDisplay() {
    this.displays.push(
      document.body.appendChild(new CompetitorScrambleDisplay()),
    );
  }
}

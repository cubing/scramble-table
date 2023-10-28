import "cubing/twisty";
import { CompetitorScrambleDisplay } from "./elements/CompetitorScrambleDisplay";

const INITIAL_NUM_DISPLAYS = 2;

export class ScrambleTableApp {
  displays: CompetitorScrambleDisplay[] = [];
  constructor() {
    for (let i = 0; i < INITIAL_NUM_DISPLAYS; i++) {
      this.addDisplay();
    }
  }

  addDisplay() {
    this.displays.push(
      document.body.appendChild(new CompetitorScrambleDisplay()),
    );
  }
}

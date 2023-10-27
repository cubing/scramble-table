// Always keep the following line if you are using any twisty players on your page.
import "cubing/twisty";
// Use the following line for specific imports from `cubing/twisty`.
import { TwistyAlgViewer, type TwistyPlayer } from "cubing/twisty";

import { Alg } from "cubing/alg";
// Import from other modules as usual.
import { randomScrambleForEvent } from "cubing/scramble";
import { CompetitorScrambleDisplay } from "./elements/CompetitorScrambleDisplay";

class App {
  // Example of getting an element from the page.
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  twistyPlayer: TwistyPlayer = document.querySelector("#main-player")!;
  // Example of creating a new element and adding it to the page.
  twistyAlgViewer = document.body.appendChild(
    new TwistyAlgViewer({ twistyPlayer: this.twistyPlayer }),
  );
  constructor() {
    this.updateScramble();
    document.body.appendChild(new CompetitorScrambleDisplay());
  }

  async updateScramble() {
    this.twistyPlayer.alg = await randomScrambleForEvent("333");
  }
}

// Make the app object available in the console for debugging.
// Try running: app.updateScramble()
// globalThis.app = new App();

{
  const disp = new CompetitorScrambleDisplay();
  document.body.appendChild(disp);
  disp.setScramble({
    competitorName: "Minh Thai",
    competitorCompetitionID: 10,
    eventID: "333",
    roundNumber: 2,
    groupID: "1",
    attemptID: "2",
    scramble: new Alg(
      "U L2 D' B2 U' R2 B2 F2 D' F2 L2 R2 F R2 D L2 R2 B' L' D' R F'",
    ),
  });
}
{
  const disp = new CompetitorScrambleDisplay();
  document.body.appendChild(disp);
  disp.setScramble({
    competitorName: "Ben Streeter",
    competitorCompetitionID: 10,
    eventID: "fto",
    roundNumber: 1,
    groupID: "Y1",
    attemptID: "1",
    scramble: new Alg(
      "B' L' U' F' L' B' L' D F2 U2 B2 L D2 R2 B2 R' D2 L D2 L' U",
    ),
  });
}

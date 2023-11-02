import { Alg } from "cubing/alg";
import { ScrambleTableApp } from "../lib/ScrambleTableApp";
import {
  decryptJSON,
  encryptJSON,
} from "../lib/encryption/passcode-encryption";

declare global {
  interface globalThis {
    app: ScrambleTableApp;
  }
}

const app = new ScrambleTableApp();
globalThis.app = app;

app.displays[0].setScramble({
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

app.displays[1].setScramble({
  competitorName: "Ben Streeter",
  eventID: "fto",
  roundNumber: 1,
  groupID: "Y1",
  attemptID: "1",
  scramble: new Alg(
    "B' L' U' F' L' B' L' D F2 U2 B2 L D2 R2 B2 R' D2 L D2 L' U",
  ),
});

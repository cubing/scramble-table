import { Alg } from "cubing/alg";
import { TwistyPlayer } from "cubing/twisty";

// @ts-ignore
import css from "./MultiBlindGridDisplay.css";
import { addCSS } from "./html";

addCSS(css);

class MultiBlindGridDisplay extends HTMLElement {
  #subScrambles: (Alg | string)[] = [];
  #subScrambleElems: TwistyPlayer[] = [];
  #highlightedSubScrambleElem: TwistyPlayer | undefined;

  #wrapper: HTMLDivElement = document.createElement("div");
  constructor() {
    super();
    this.appendChild(this.#wrapper).classList.add("wrapper");
  }

  #columnCSS: HTMLStyleElement;
  connectedCallback() {
    this.#columnCSS = this.appendChild(document.createElement("style"));
    this.setNumColumnsAndRows(1, 1);
  }

  setNumColumnsAndRows(numCols: number, numRows: number): void {
    this.#wrapper.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
    this.#wrapper.style.gridTemplateRows = `repeat(${numCols}, 1fr)`;
    this.#wrapper.style.aspectRatio = `${numCols}/${numRows}`;
  }

  setScrambles(scrambles: (Alg | string)[]): void {
    this.#subScrambles = scrambles;
    while (this.#subScrambleElems.length > scrambles.length) {
      this.#subScrambleElems.splice(-1)[0].remove();
    }
    while (this.#subScrambleElems.length < scrambles.length) {
      const twistyPlayer = this.#wrapper.appendChild(
        new TwistyPlayer({
          visualization: "experimental-2D-LL-face",
          controlPanel: "none",
          background: "none",
        }),
      );
      const idx = this.#subScrambleElems.length; // Capture.
      twistyPlayer.addEventListener("click", () => this.#onClick(idx));
      this.#subScrambleElems.push(twistyPlayer);
    }
    const numCols = Math.round(Math.sqrt(scrambles.length));
    const numRows = Math.ceil(scrambles.length / numCols);
    this.setNumColumnsAndRows(numCols, numRows);
    for (const [i, scramble] of scrambles.entries()) {
      this.#subScrambleElems[i].alg = scramble;
    }
  }

  setHighlightIndex(idx: number): void {
    this.#highlightedSubScrambleElem?.classList.remove("highlighted");
    this.#highlightedSubScrambleElem = this.#subScrambleElems[idx];
    this.#highlightedSubScrambleElem.classList.add("highlighted");
  }

  #onClick(idx: number): void {
    this.dispatchEvent(
      new CustomEvent("scramble-clicked", {
        detail: {
          idx,
        },
      }),
    );
  }
}

customElements.define("multi-blind-grid-display", MultiBlindGridDisplay);

declare global {
  interface HTMLElementTagNameMap {
    "multi-blind-grid-display": MultiBlindGridDisplay;
  }
}

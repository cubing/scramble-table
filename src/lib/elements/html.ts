import type { HTMLBundle } from "bun";

export function parseHTML<T extends Element>(s: string | HTMLBundle): T {
  return new DOMParser().parseFromString(s as string, "text/html").head
    .firstElementChild as T;
}

export function addCSS(cssStringSource: string): void {
  const elem = document.createElement("style");
  elem.textContent = cssStringSource;
  document.head.appendChild(elem);
}

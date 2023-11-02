export function parse<T extends Element>(s: string): T {
  return new DOMParser().parseFromString(s, "text/html").head
    .firstElementChild as T;
}

export function addCSS(cssStringSource: string): void {
  const elem = document.createElement("style");
  elem.textContent = cssStringSource;
  document.head.appendChild(elem);
}

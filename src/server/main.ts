import { serve as bunServe } from "bun";

export function serve() {
  bunServe({
    fetch(req) {
      return new Response("Bun!");
    },
  });
}

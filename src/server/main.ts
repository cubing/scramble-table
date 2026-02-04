import { serve as bunServe } from "bun";

export function serve() {
  bunServe({
    fetch(_req) {
      return new Response("Bun!");
    },
  });
}

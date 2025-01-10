import { barelyServe } from "barely-a-dev-server";
import { esbuildOptions } from "./esbuildOptions.js";

await barelyServe({
  entryRoot: "src/dev",
  port: 3338,
  esbuildOptions,
});

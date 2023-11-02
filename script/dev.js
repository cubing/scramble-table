import { barelyServe } from "barely-a-dev-server";
import { esbuildOptions } from "./esbuildOptions.js";

barelyServe({
  entryRoot: "src/dev",
  port: 3338,
  esbuildOptions,
});

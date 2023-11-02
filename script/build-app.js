import { barelyServe } from "barely-a-dev-server";
import { esbuildOptions } from "./esbuildOptions.js";

barelyServe({
  entryRoot: "src",
  esbuildOptions,
});

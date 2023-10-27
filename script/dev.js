import { barelyServe } from "barely-a-dev-server";
import { esbuildOptions } from "./esbuildOptions.js";

barelyServe({
  entryRoot: "src",
  port: 3338,
  esbuildOptions,
});

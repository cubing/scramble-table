import { barelyServe } from "barely-a-dev-server";
import { serve } from "../src/server/main";
import { esbuildOptions } from "./esbuildOptions.js";

serve();

await Promise.all([
  barelyServe({
    entryRoot: "src/dev",
    port: 3338,
    esbuildOptions,
  }),
]);

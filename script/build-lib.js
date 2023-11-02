import { build } from "esbuild";
import { esbuildOptions } from "./esbuildOptions.js";

await build({
  entryPoints: ["src/index.ts"],
  ...esbuildOptions,
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: "dist/@cubing/scramble-display",
  external: ["cubing"],
});

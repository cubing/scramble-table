import { build } from "esbuild";
import { esbuildOptions } from "./esbuildOptions.js";

await build({
  entryPoints: ["src/lib/index.ts"],
  ...esbuildOptions,
  bundle: true,
  target: "es2020",
  splitting: true,
  format: "esm",
  outdir: "dist/lib/@cubing/scramble-display",
  sourcemap: true,
  external: ["cubing"],
});

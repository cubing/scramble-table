import { build } from "esbuild";
import { esbuildOptions } from "./esbuildOptions";

await build({
  entryPoints: ["src/bin/main.ts", "src/lib/index.ts"],
  ...esbuildOptions,
  bundle: true,
  target: "es2020",
  splitting: true,
  format: "esm",
  outdir: "dist/",
  chunkNames: "chunks/[name]-[hash]",
  sourcemap: true,
  external: [
    "array-buffer-to-hex",
    "cubing",
    "hex-to-array-buffer",
    "libsodium-wrappers",
    "pbkdf2-hmac",
    "node:*",
  ],
});

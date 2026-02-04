import { es2022Lib } from "@cubing/dev-config/esbuild/es2022";
import { build } from "esbuild";
import { esbuildOptions } from "./esbuildOptions";

await build({
  ...es2022Lib(),
  entryPoints: ["src/bin/main.ts", "src/lib/index.ts"],
  ...esbuildOptions,
  outdir: "./dist/",
  external: [
    "array-buffer-to-hex",
    "cubing",
    "hex-to-array-buffer",
    "libsodium-wrappers",
    "pbkdf2-hmac",
    "node:*",
  ],
});

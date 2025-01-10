import type { BuildOptions } from "esbuild";

export const esbuildOptions: BuildOptions = {
  loader: { ".css": "text", ".html": "text" },
};

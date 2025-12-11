import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts",
  plugins: [
    json(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".ts"],
      preferBuiltins: false,
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tsconfig: "./tsconfig.browser.json",
      module: "es2022",
      target: "es2022",
      moduleResolution: "node",
      declaration: true,
      declarationMap: true,
      outDir: "dist/esm",
      noEmitOnError: true,
    }),
  ],
  external: [
    "@coral-xyz/borsh",
    "@solana/web3.js",
    "@solana/spl-token",
    "@coral-xyz/anchor"
  ],
  output: {
    dir: "./dist/esm",
    format: "es",
    sourcemap: true,
    entryFileNames: "[name].js",
  },
};

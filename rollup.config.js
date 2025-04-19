import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf8")
);

// Create a banner with version info
const banner = `/*!
 * XMLJSONTransformer v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} License
 */`;

export default [
  // Main ESM build
  {
    input: "src/index.js",
    output: {
      file: "./dist/index.js",
      format: "es",
      banner,
      sourcemap: true,
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      filesize(),
    ],
  },
  // Minified ESM version
  {
    input: "src/index.js",
    output: {
      file: "./dist/index.min.js",
      format: "es",
      banner,
      sourcemap: false,
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      terser(),
      filesize(),
    ],
  },
  // UMD bundle for direct browser usage
  {
    input: "src/index.js",
    output: {
      file: "./dist/xmltojson.umd.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      filesize(),
    ],
  },
  // Minified UMD bundle
  {
    input: "src/index.js",
    output: {
      file: "./dist/xmltojson.umd.min.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: false,
      exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      terser(),
      filesize(),
    ],
  }
];
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
  // Main ESM build (for both browser and Node.js)
  {
    input: "src/xml-json-transformer.js",
    output: {
      file: "./dist/xml-json-transformer.js",
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
  // Minified ESM build (for production use)
  {
    input: "src/xml-json-transformer.js",
    output: {
      file: "./dist/xml-json-transformer.min.js",
      format: "es",
      banner,
      sourcemap: false, // No source map for production
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      terser(), // Minification
      filesize(),
    ],
  },
  // Browser-specific build (UMD for direct <script> inclusion)
  // This is mainly for backward compatibility and demo usage
  {
    input: "src/xml-json-transformer.js",
    output: {
      file: "./dist/xml-json-transformer.umd.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: true,
      exports: "auto",
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

  // Minified browser build
  {
    input: "src/xml-json-transformer.js",
    output: {
      file: "./dist/xml-json-transformer.umd.min.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: false,
      exports: "auto",
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
  },
];

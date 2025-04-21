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

// Define external dependencies for plugins
const pluginExternals = [
  'dayjs',
  'dayjs/plugin/customParseFormat',
  'dayjs/plugin/utc', 
  'dayjs/plugin/timezone'
];

// Create base config for reuse
const createBaseConfig = (input, output, options = {}) => ({
  input,
  output,
  external: options.external || [],
  plugins: [
    resolve(),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
    ...(options.minify ? [terser()] : []),
    filesize(),
  ],
});

export default [
  // Core library: ESM build
  createBaseConfig(
    "src/index.js",
    {
      file: "./dist/index.js",
      format: "es",
      banner,
      sourcemap: true,
    }
  ),
  
  // Core library: Minified ESM
  createBaseConfig(
    "src/index.js",
    {
      file: "./dist/index.min.js",
      format: "es",
      banner,
      sourcemap: false,
    },
    { minify: true }
  ),
  
  // Core library: UMD bundle
  createBaseConfig(
    "src/index.js",
    {
      file: "./dist/xmltojson.umd.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: true,
      exports: "named",
    },
    { 
      plugins: [commonjs()]
    }
  ),
  
  // Core library: Minified UMD bundle
  createBaseConfig(
    "src/index.js",
    {
      file: "./dist/xmltojson.umd.min.js",
      format: "umd",
      name: "XMLJSONTransformer",
      banner,
      sourcemap: false,
      exports: "named",
    },
    { 
      plugins: [commonjs()],
      minify: true
    }
  ),
  
  // Plugins: ESM build
  createBaseConfig(
    "src/plugins/index.js",
    {
      file: "./dist/plugins/index.js",
      format: "es",
      banner,
      sourcemap: true,
    },
    {
      external: [...pluginExternals, '../../core/transformers/ValueTransformer.js']
    }
  ),
  
  // Plugins: Minified ESM
  createBaseConfig(
    "src/plugins/index.js",
    {
      file: "./dist/plugins/index.min.js",
      format: "es",
      banner,
      sourcemap: false,
    },
    {
      external: [...pluginExternals, '../../core/transformers/ValueTransformer.js'],
      minify: true
    }
  ),
  
  // Plugins: UMD bundle
  createBaseConfig(
    "src/plugins/index.js",
    {
      file: "./dist/plugins/xmltojson-plugins.umd.js",
      format: "umd",
      name: "XMLJSONTransformerPlugins",
      banner,
      sourcemap: true,
      exports: "named",
      globals: {
        'dayjs': 'dayjs',
        'dayjs/plugin/customParseFormat': 'dayjsCustomParseFormat',
        'dayjs/plugin/utc': 'dayjsUtc',
        'dayjs/plugin/timezone': 'dayjsTimezone',
        '../../core/transformers/ValueTransformer.js': 'ValueTransformer'
      }
    },
    { 
      external: [...pluginExternals, '../../core/transformers/ValueTransformer.js'],
      plugins: [commonjs()]
    }
  ),
  
  // Plugins: Minified UMD bundle
  createBaseConfig(
    "src/plugins/index.js",
    {
      file: "./dist/plugins/xmltojson-plugins.umd.min.js",
      format: "umd",
      name: "XMLJSONTransformerPlugins",
      banner,
      sourcemap: false,
      exports: "named",
      globals: {
        'dayjs': 'dayjs',
        'dayjs/plugin/customParseFormat': 'dayjsCustomParseFormat',
        'dayjs/plugin/utc': 'dayjsUtc',
        'dayjs/plugin/timezone': 'dayjsTimezone',
        '../../core/transformers/ValueTransformer.js': 'ValueTransformer'
      }
    },
    { 
      external: [...pluginExternals, '../../core/transformers/ValueTransformer.js'],
      plugins: [commonjs()],
      minify: true
    }
  ),
  
  // Individual plugin: DateTransformer
  createBaseConfig(
    "src/plugins/DateTransformer.js",
    {
      file: "./dist/plugins/DateTransformer.js",
      format: "es",
      banner,
      sourcemap: true,
    },
    {
      external: [...pluginExternals, '../core/transformers/ValueTransformer.js']
    }
  ),
  
  // Individual plugin: DateTransformer (minified)
  createBaseConfig(
    "src/plugins/DateTransformer.js",
    {
      file: "./dist/plugins/DateTransformer.min.js",
      format: "es",
      banner,
      sourcemap: false,
    },
    {
      external: [...pluginExternals, '../core/transformers/ValueTransformer.js'],
      minify: true
    }
  )
];
// rollup.config.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

// Read package.json manually since we're using ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));

const banner = `/*!
 * XMLJSONTransformer v${pkg.version}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * Released under the ${pkg.license} License
 */`;

export default [
  // UMD build (for browsers and globals)
  {
    input: 'src/xml-json-transformer.js',
    output: [
      {
        name: 'XMLJSONTransformer',
        file: pkg.browser,
        format: 'umd',
        banner,
        sourcemap: true
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      terser(),
      filesize()
    ]
  },

  // ESM and CJS builds (for bundlers and Node.js)
  {
    input: 'src/xml-json-transformer.js',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        banner,
        exports: 'auto',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        banner,
        sourcemap: true
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      filesize()
    ]
  }
];
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import pkg from './package.json'

const config = {
  input: 'src/index.js',
  plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    commonjs(),
    nodeResolve()
  ],
  external: [
    ...Object.keys(pkg.dependencies),
  ],
};

export default [
  Object.assign(
    {
      output: {
        file: 'lib/index.js',
        format: 'cjs',
        exports: 'named'
      }
    },
    config,
  ),
  Object.assign(
    {
      output: {
        file: 'es/index.js',
        format: 'esm'
      }
    },
    config,
  ),
];

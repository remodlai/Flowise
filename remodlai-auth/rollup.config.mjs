import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
  // CJS build
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      json(),
    ],
    external: ['@supabase/supabase-js'],
  },
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      json(),
    ],
    external: ['@supabase/supabase-js'],
  },
  // UMD build with bundled dependencies
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'RemodlAuth',
      sourcemap: true,
      globals: {
        '@supabase/supabase-js': 'supabase'
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: true
      }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      json(),
    ]
    // Don't mark any dependencies as external for UMD build
  },
  // Types
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]; 
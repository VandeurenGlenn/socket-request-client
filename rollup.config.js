import typescript from '@rollup/plugin-typescript';
import tsconfig from './tsconfig.json' assert { type: 'json'}
import pkg from './package.json' assert { type: 'json'}

const input = ['src/index.ts']
export default [{
  input,
  output: {
    format: 'es',
    dir: './exports'
  },
  plugins: [
    typescript({ compilerOptions: { outDir: './exports'} })
  ]
}]
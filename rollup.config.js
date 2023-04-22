import typescript from '@rollup/plugin-typescript';
import tsconfig from './tsconfig.json' assert { type: 'json'}
import pkg from './package.json' assert { type: 'json'}

const input = Object.values(pkg.exports).map(exported => exported.replace('./', './src/').replace('.js', '.ts'))
export default [{
  input,
  output: {
    format: 'es',
    dir: './exports'
  },
  plugins: [
    typescript({ compilerOption: { outDir: './exports'} })
  ]
}]
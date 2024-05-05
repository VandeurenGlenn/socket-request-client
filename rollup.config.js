import typescript from '@rollup/plugin-typescript';

const input = ['src/index.ts'];
export default [
  {
    input,
    output: {
      format: 'es',
      dir: './exports',
    },
    plugins: [typescript({ compilerOptions: { outDir: './exports' } })],
  },
];

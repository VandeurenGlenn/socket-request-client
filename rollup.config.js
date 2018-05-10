const cleanup = require('rollup-plugin-cleanup');
const readFileSync = require('fs').readFileSync;
const npmPackage = readFileSync('package.json', 'utf8');
const { version, name } = JSON.parse(npmPackage);
const production = Boolean(process.argv[2] === 'production');
export default [
	// CommonJS version, for Node, Browserify & Webpack
	{
    input: ['src/index.js'],
    output: {
      dir: './',
      format: 'cjs',
      sourcemap: false,
      intro: `const ENVIRONMENT = {version: '${version}', production: true};`,
      banner: `/* ${name} version ${version} */`
    },
    plugins: [
      cleanup()
    ],
    experimentalCodeSplitting: true,
    experimentalDynamicImport: true
	}
];

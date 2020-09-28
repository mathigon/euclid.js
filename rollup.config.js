import typescript from '@rollup/plugin-typescript';

const options = {
  input: './index.ts',
  plugins: [typescript()],
  external: ['@mathigon/core', '@mathigon/fermat']
};

module.exports = [
  {...options, output: {file: 'dist/euclid.cjs.js', format: 'cjs'}},
  {...options, output: {file: 'dist/euclid.esm.js', format: 'esm'}}
];

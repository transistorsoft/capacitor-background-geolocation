import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorBackgroundGeolocation',
      globals: {
        '@capacitor/core': 'capacitorExports',
        '@transistorsoft/background-geolocation-types': 'backgroundGeolocationTypes',
      },
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs()
  ],
  external: ['@capacitor/core', '@transistorsoft/background-geolocation-types'],
};


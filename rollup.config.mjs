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
      // (WO-007) The ESM entry (dist/index.js) carries named exports so `import { Permission }`
      // works.  Rollup would then emit `exports.default = …` here, changing what
      // `require('@transistorsoft/capacitor-background-geolocation')` returns and breaking every
      // CJS consumer.  Re-point module.exports at the class and hang the named values off it,
      // so BOTH `require(...)` and `const { Permission } = require(...)` keep working.
      exports: 'named',
      // Restore the historical shape exactly.  (Object.assign here would CRASH at require
      // time: the class already declares getter-only statics of the same names.)  Named
      // values stay reachable for CJS through those statics, as they always were.
      footer: 'module.exports = module.exports.default;',
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs()
  ],
  external: ['@capacitor/core', '@transistorsoft/background-geolocation-types'],
};


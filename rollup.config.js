import commonjs from '@rollup/plugin-commonjs';
import copy from "rollup-plugin-copy";

export default {
  input: 'dist/index.js',
  output: [{
    dir: 'output',
    format: 'iife',
    name: 'capacitorBackgroundGeolocation',
    globals: {
      '@capacitor/core': 'capacitorExports',
    },
  },
  {
    file: 'dist/plugin.cjs.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'auto',
    inlineDynamicImports: true,
  }],
  plugins: [
    commonjs(),
    copy({
      targets: [
        { src: 'src/index.d.ts', dest: 'dist' },
        //{ src: 'src/declarations/**/*', dest: 'dist/declarations'}
        { src: 'src/declarations', dest: 'dist'}
      ]
    })
  ],
  external: ['@capacitor/core'],
};


/*
export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorBackgroundGeolocation',
      globals: {
        '@capacitor/core': 'capacitorExports',
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
  external: ['@capacitor/core'],
};
*/

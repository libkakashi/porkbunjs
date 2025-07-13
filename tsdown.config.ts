// eslint-disable-next-line n/no-unpublished-import
import {defineConfig} from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  outDir: 'build',
  dts: true,
  clean: true,
  minify: false,
  platform: 'neutral',
  format: ['esm', 'cjs'],
});

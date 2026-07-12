import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default {
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [{
    name: 'copy-classic-src',
    closeBundle() {
      const source = resolve('src');
      const target = resolve('dist/src');
      if (existsSync(source)) cpSync(source, target, { recursive: true });
    }
  }]
};

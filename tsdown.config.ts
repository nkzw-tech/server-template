import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/app.tsx'],
  outputOptions: { file: 'dist/index.js' },
});

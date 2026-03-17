import nkzw from '@nkzw/oxlint-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    experimentalSortImports: {
      newlinesBetween: false,
    },
    experimentalSortPackageJson: {
      sortScripts: true,
    },
    ignorePatterns: ['coverage/', 'dist/', 'pnpm-lock.yaml', 'src/graphql/schema.graphql'],
    singleQuote: true,
  },
  lint: {
    extends: [nkzw],
    ignorePatterns: ['dist/', 'src/prisma/prisma-client/*', 'src/prisma/pothos-types.ts'],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['scripts/**/*.tsx', 'src/app.tsx', 'src/index.tsx', 'src/prisma/seed.tsx'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
  },
  pack: {
    entry: ['./src/app.tsx'],
    outputOptions: { file: 'dist/index.js' },
  },
  run: {
    tasks: {
      'test:all': {
        command: 'vp check && vp test',
      },
    },
  },
  staged: {
    '*': 'vp check --fix',
  },
});

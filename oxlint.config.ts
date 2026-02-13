import nkzw from '@nkzw/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [nkzw],
  ignorePatterns: ['dist/', 'src/prisma/prisma-client/*', 'src/prisma/pothos-types.ts'],
  overrides: [
    {
      files: ['scripts/**/*.tsx', 'src/app.tsx', 'src/index.tsx', 'src/prisma/seed.tsx'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
});

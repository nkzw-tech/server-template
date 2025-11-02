import nkzw from '@nkzw/eslint-config';

export default [
  ...nkzw,
  {
    ignores: [
      'dist/',
      'src/prisma/prisma-client/*',
      'src/prisma/pothos-types.ts',
    ],
  },
  {
    files: [
      'scripts/**/*.tsx',
      'src/app.tsx',
      'src/index.tsx',
      'src/prisma/seed.tsx',
    ],
    rules: {
      'no-console': 0,
    },
  },
];

#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { globSync } from 'glob';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { styleText } from 'node:util';
import { format } from 'oxfmt';

console.log(styleText('bold', '› Generating GraphQL schema import map...'));

const sign = (code: string) =>
  `/* @generated(${createHash('sha256').update(code).digest('hex')}) */\n${code}`;

const root = process.cwd();
const path = join(root, 'src/graphql');
const outputFile = join(path, 'schemaImportMap.tsx');

const files = (
  await Promise.all(globSync(`${path}/{nodes,mutations}/*.tsx`.split(sep).join(posix.sep)))
)
  .map((file) => relative(path, file.slice(0, file.lastIndexOf('.'))))
  .sort((a, b) => String(a).localeCompare(String(b)));

if (!files.length) {
  throw new Error(`generate-graphql: No GraphQL schema files found.`);
}

writeFileSync(
  outputFile,
  sign(
    (
      await format(outputFile, `${files.map((name) => `import './${name}.tsx';`).join('\n')}`, {
        singleQuote: true,
      })
    ).code,
  ),
);

console.log(styleText(['green', 'bold'], '✓ Done generating GraphQL schema import map.'));

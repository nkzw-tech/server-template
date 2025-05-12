import builder from './builder.tsx';
import './schemaImportMap.tsx';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { lexicographicSortSchema } from 'graphql';

const schema = builder.toSchema();

if (process.env.NODE_ENV === 'development') {
  writeFileSync(
    join(process.cwd(), 'src/graphql/schema.graphql'),
    printSchemaWithDirectives(lexicographicSortSchema(schema)),
    'utf8',
  );
}
export default schema;

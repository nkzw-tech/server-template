import builder from './builder.tsx';
import './schemaImportMap.tsx';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { printSchema } from 'graphql';

const schema = builder.toSchema();

if (process.env.NODE_ENV === 'development') {
  writeFileSync(
    join(process.cwd(), 'src/graphql/schema.graphql'),
    printSchema(schema),
    'utf8',
  );
}
export default schema;

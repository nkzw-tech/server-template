import { MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { Role } from '../../prisma/prisma-client/client.ts';
import isAdmin from '../../user/isAdmin.tsx';
import { Context } from '../../context.tsx';

export default function addDirectives(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const maybeDirectives = fieldConfig.extensions?.directives as
        | Record<string, { role?: Role }>
        | undefined;
      const directiveName = Object.keys(maybeDirectives || {}).at(0);
      if (!maybeDirectives || !directiveName) {
        return undefined;
      }
      const directive = maybeDirectives[directiveName];
      if (directive) {
        const role = directive?.role;
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = (source, args, context: Context, info) => {
          const sessionUser = context.req.user;
          if (directiveName === 'requiresAuth') {
            if (
              !sessionUser ||
              (role &&
                !role.includes(sessionUser.access) &&
                !isAdmin(sessionUser))
            ) {
              return null;
            }
          } else if (directiveName === 'self') {
            const type = (
              fieldConfig?.extensions?.pothosConfig as {
                parentType: string;
              } | null
            )?.parentType;
            if (
              type !== 'User' ||
              !sessionUser ||
              sessionUser.id !== source.id
            ) {
              return null;
            }
          }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}

import SchemaBuilder from '@pothos/core';
import ComplexityPlugin from '@pothos/plugin-complexity';
import DirectivesPlugin from '@pothos/plugin-directives';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import PrismaTypes, { getDatamodel } from '../prisma/pothos-types.ts';
import prisma from '../prisma/prisma.tsx';
import isAdmin from '../user/isAdmin.tsx';
import { Context } from './context.tsx';
import AuthDirectivesPlugin from './lib/authDirectives.tsx';
import decodeGlobalID from './lib/decodeGlobalID.tsx';
import encodeGlobalID from './lib/encodeGlobalID.tsx';

interface PothosTypes extends Partial<PothosSchemaTypes.UserSchemaTypes> {
  AuthScopes: {
    role: string;
    self: string;
  };
  Context: Context;
  PrismaTypes: PrismaTypes;
}

const builder = new SchemaBuilder<PothosTypes>({
  complexity: {
    defaultComplexity: 1,
    defaultListMultiplier: 10,
    limit: {
      breadth: 300,
      complexity: 20_000,
      depth: 20,
    },
  },
  directives: {
    useGraphQLToolsUnorderedDirectives: true,
  },
  plugins: [
    ScopeAuthPlugin,
    ComplexityPlugin,
    PrismaPlugin,
    RelayPlugin,
    AuthDirectivesPlugin,
    DirectivesPlugin,
  ],
  prisma: {
    client: prisma,
    dmmf: getDatamodel(),
    exposeDescriptions: false,
    filterConnectionTotalCount: true,
    maxConnectionSize: 120,
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'error',
  },
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
    decodeGlobalID,
    encodeGlobalID: (typename, id) =>
      encodeGlobalID(typename as keyof PrismaTypes, id),
    nodesQueryOptions: false,
  },
  scopeAuth: {
    authScopes: ({ sessionUser }) => ({
      role: (role) =>
        !!sessionUser && (role === sessionUser.role || isAdmin(sessionUser)),
      self: (id) => !!sessionUser && id === sessionUser.id,
    }),
  },
});

builder.mutationType();
builder.queryType();

export default builder;

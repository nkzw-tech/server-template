import SchemaBuilder from '@pothos/core';
import ComplexityPlugin from '@pothos/plugin-complexity';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import PrismaTypes from '../prisma/pothos-types.ts';
import { Role } from '../prisma/prisma-client/client.ts';
import prisma from '../prisma/prisma.tsx';
import isAdmin from '../user/isAdmin.tsx';
import { Context } from './context.tsx';
import decodeGlobalID from './lib/decodeGlobalID.tsx';
import encodeGlobalID from './lib/encodeGlobalID.tsx';

interface PothosTypes extends Partial<PothosSchemaTypes.UserSchemaTypes> {
  AuthScopes: {
    role: Role;
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
  plugins: [ScopeAuthPlugin, ComplexityPlugin, PrismaPlugin, RelayPlugin],
  prisma: {
    client: prisma,
    exposeDescriptions: false,
    filterConnectionTotalCount: true,
    maxConnectionSize: 120,
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'error',
  },
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
    decodeGlobalID,
    encodeGlobalID,
    nodesQueryOptions: false,
  },
  scopeAuth: {
    authScopes: (context) => ({
      role: (role) =>
        role === context.sessionUser.access || isAdmin(context.sessionUser),
      self: (id) => id === context.sessionUser.id,
    }),
  },
});

builder.mutationType();
builder.queryType();

export default builder;

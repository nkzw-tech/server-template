import SchemaBuilder from '@pothos/core';
import ComplexityPlugin from '@pothos/plugin-complexity';
import DirectivePlugin from '@pothos/plugin-directives';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import { Context } from '../context.tsx';
import PrismaTypes from '../prisma/pothos-types.ts';
import { Role } from '../prisma/prisma-client/client.ts';
import prisma from '../prisma/prisma.tsx';
import decodeGlobalID from './lib/decodeGlobalID.tsx';
import encodeGlobalID from './lib/encodeGlobalID.tsx';

const builder = new SchemaBuilder<{
  Context: Context;
  Directives: {
    requiresAuth: {
      args: { role: Role };
      locations: 'OBJECT' | 'FIELD_DEFINITION';
    };
    self: {
      locations: 'FIELD_DEFINITION';
    };
  };
  PrismaTypes: PrismaTypes;
}>({
  complexity: {
    defaultComplexity: 1,
    defaultListMultiplier: 10,
    limit: {
      breadth: 300,
      complexity: 20_000,
      depth: 20,
    },
  },
  directives: { useGraphQLToolsUnorderedDirectives: true },
  plugins: [ComplexityPlugin, DirectivePlugin, PrismaPlugin, RelayPlugin],
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
});

builder.mutationType();
builder.queryType();

export default builder;

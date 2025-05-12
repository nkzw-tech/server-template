import prisma from '../../prisma/prisma.tsx';
import builder from '../builder.tsx';
import decodeIDOrThrow from '../lib/decodeIDOrThrow.tsx';

const Pokemon = builder.prismaNode('Pokemon', {
  fields: (t) => ({
    name: t.exposeString('name', { nullable: false }),
    primaryType: t.exposeString('primaryType', { nullable: false }),
    secondaryType: t.exposeString('secondaryType'),
  }),
  id: { field: 'id' },
});

builder.queryFields((t) => ({
  pokemon: t.prismaField({
    args: { id: t.arg.id({ required: true }) },
    authScopes: {
      role: 'User',
    },
    resolve: (query, _, { id }) =>
      prisma.pokemon.findUnique({
        ...query,
        where: {
          id: decodeIDOrThrow('Pokemon', id),
        },
      }),
    type: 'Pokemon',
  }),
}));

export default Pokemon;

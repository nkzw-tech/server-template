import { auth } from '../../lib/auth.tsx';
import prisma from '../../prisma/prisma.tsx';
import builder from '../builder.tsx';

builder.mutationField('updateName', (t) =>
  t.prismaField({
    args: {
      name: t.arg.string({ required: true }),
    },
    authScopes: {
      role: 'User',
    },
    resolve: async (query, _, { name }, { sessionUser }) => {
      name = name.trim();

      if (name.length < 2 || name.length > 32) {
        throw new Error('invalid-display-name');
      }

      await auth.api.updateUser({ body: { name } });

      return await prisma.user.findUniqueOrThrow({
        ...query,
        where: {
          id: sessionUser.id,
        },
      });
    },
    type: 'User',
  }),
);

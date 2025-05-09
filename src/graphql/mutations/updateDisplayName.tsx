import prisma from '../../prisma/prisma.tsx';
import isValidName from '../../user/isValidName.tsx';
import builder from '../builder.tsx';

builder.mutationField('updateDisplayName', (t) =>
  t.prismaField({
    args: {
      displayName: t.arg.string({ required: true }),
    },
    directives: {
      requiresAuth: { role: 'User' },
    },
    resolve: async (query, _, { displayName }, context) => {
      const sessionUser = context.req.user;
      const user =
        sessionUser &&
        (await prisma.user.findUniqueOrThrow({
          where: {
            id: sessionUser.id,
          },
        }));

      displayName = displayName.trim();

      if (
        displayName.length < 2 ||
        displayName.length > 32 ||
        !isValidName(displayName.replaceAll(' ', '-'))
      ) {
        throw new Error('invalid-display-name');
      }

      return prisma.user.update({
        ...query,
        data: {
          displayName,
        },
        where: {
          id: user?.id,
        },
      });
    },
    type: 'User',
  }),
);

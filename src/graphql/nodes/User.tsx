import { Role } from '../../prisma/prisma-client/client.ts';
import prisma from '../../prisma/prisma.tsx';
import builder from '../builder.tsx';
import decodeIDOrThrow from '../lib/decodeIDOrThrow.tsx';
import encodeGlobalID from '../lib/encodeGlobalID.tsx';

const RoleEnum = builder.enumType(Role, {
  name: 'Role',
});

export const encodeUserID = (id: string) => encodeGlobalID('User', id);
export const decodeUserID = (id: string) => decodeIDOrThrow('User', id);

const MAX_RESULTS = 10;

const User = builder.prismaNode('User', {
  fields: (t) => ({
    access: t.field({
      authScopes: (user) => ({ self: user.id }),
      resolve: ({ access }) => access,
      type: RoleEnum,
    }),
    caughtPokemon: t.relatedConnection('CaughtPokemon', {
      cursor: 'id',
      nullable: false,
      query: {
        orderBy: { caughtAt: 'asc' },
      },
    }),
    displayName: t.exposeString('displayName', { nullable: false }),
    email: t.string({
      authScopes: (user) => ({ self: user.id }),
      resolve: ({ email }) => email,
    }),
    locale: t.string({
      authScopes: (user) => ({ self: user.id }),
      resolve: ({ locale }) => locale,
    }),
    username: t.exposeString('username', { nullable: false }),
  }),
  id: { field: 'id' },
});

export const UserConnection = builder.connectionObject({
  name: 'UserConnection',
  type: User,
});

builder.queryFields((t) => ({
  findUsers: t.prismaConnection({
    args: {
      name: t.arg.string({ required: true }),
    },
    authScopes: {
      role: 'User',
    },
    cursor: 'id',
    resolve: (query, _, { name }) => {
      name = name.trim();
      return prisma.user.findMany({
        ...query,
        take: MAX_RESULTS,
        where:
          name.length >= 1
            ? {
                OR: [
                  {
                    username: {
                      mode: 'insensitive',
                      startsWith: name,
                    },
                  },
                  {
                    displayName: {
                      mode: 'insensitive',
                      startsWith: name,
                    },
                  },
                ],
              }
            : undefined,
      });
    },
    type: 'User',
  }),
  user: t.prismaField({
    args: { username: t.arg.string({ required: true }) },
    authScopes: {
      role: 'User',
    },
    resolve: (query, _, { username }) =>
      prisma.user.findUnique({
        ...query,
        where: {
          username,
        },
      }),
    type: 'User',
  }),
  viewer: t.prismaField({
    resolve: (query, root, args, { sessionUser }) =>
      sessionUser
        ? prisma.user.findUniqueOrThrow({
            ...query,
            where: { id: sessionUser.id },
          })
        : void query.include,
    type: 'User',
  }),
}));

export default User;

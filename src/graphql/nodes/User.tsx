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
      directives: { self: {} },
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
      directives: { self: {} },
      resolve: ({ email }) => email,
    }),
    locale: t.string({
      directives: { self: {} },
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
    cursor: 'id',
    directives: {
      requiresAuth: { role: 'User' },
    },
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
    directives: {
      requiresAuth: { role: 'User' },
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
    resolve: (query, root, args, context) =>
      context.req.user
        ? prisma.user.findUniqueOrThrow({
            ...query,
          where: { id: context.req.user.id },
          })
        : void query.include,
    type: 'User',
  }),
}));

export default User;

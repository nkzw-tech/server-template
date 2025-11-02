#!/usr/bin/env NODE_ENV=development node_modules/.bin/nodemon -q -I --exec node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm --env-file .env
import { parseArgs, styleText } from 'node:util';
import { serve } from '@hono/node-server';
import parseInteger from '@nkzw/core/parseInteger.js';
import { createYoga } from 'graphql-yoga';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Context } from './graphql/context.tsx';
import schema from './graphql/schema.tsx';
import { auth } from './lib/auth.tsx';
import env from './lib/env.tsx';
import prisma from './prisma/prisma.tsx';
import { toSessionUser } from './user/SessionUser.tsx';

try {
  await prisma.$connect();
} catch (error) {
  console.error(
    `${styleText(['red', 'bold'], 'Prisma Database Connection Error')}\n`,
    error,
  );
  process.exit(1);
}

const origin = env('CLIENT_DOMAIN');
const app = new Hono();

app.use(
  cors({
    credentials: true,
    origin,
  }),
);

app.on(['POST', 'GET'], '/api/auth/*', ({ req }) => auth.handler(req.raw));

const yoga = createYoga<Context>({
  graphiql: process.env.NODE_ENV === 'development',
  schema,
});

app.on(['POST', 'GET', 'OPTIONS'], '/graphql/*', async (context) => {
  const req = context.req.raw;
  const user = (
    await auth.api.getSession({
      headers: req.headers,
    })
  )?.user;

  return yoga.handleRequest(req, {
    sessionUser: user ? toSessionUser(user) : null,
  });
});

app.all('/*', (context) => context.redirect(origin));

if (process.env.npm_lifecycle_event === 'dev') {
  const name = 'Pothos GraphQL Server';
  const {
    values: { port: portArg },
  } = parseArgs({
    options: {
      port: {
        default: '9000',
        short: 'p',
        type: 'string',
      },
    },
  });

  const port = (portArg && parseInteger(portArg)) || 9000;
  serve({ fetch: app.fetch, port }, () =>
    console.log(
      `${styleText(['green', 'bold'], `${name}\n  ➜`)}  Server running on port ${styleText('bold', String(port))}.\n`,
    ),
  );

  const setTitle = (title: string) => {
    process.title = title;
    if (process.stdout.isTTY) {
      process.stdout.write(
        `${String.fromCharCode(27)}]0;🚀 ${title}${String.fromCharCode(7)}`,
      );
    }
  };
  setTimeout(() => setTitle(name), 0);
}

export default app;

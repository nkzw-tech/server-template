import { styleText } from 'node:util';
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

export default app;

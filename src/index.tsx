#!/usr/bin/env NODE_ENV=development node_modules/.bin/nodemon -q -I --exec node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm --env-file .env
import { createServer } from 'node:http';
import { parseArgs, styleText } from 'node:util';
import parseInteger from '@nkzw/core/parseInteger.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { createYoga } from 'graphql-yoga';
import schema from './graphql/schema.tsx';
import { getClientDomain, setClientDomain } from './lib/ClientDomain.tsx';
import env from './lib/env.tsx';
import prisma from './prisma/prisma.tsx';
import installAuthMiddleware from './user/installAuthMiddleware.tsx';
import { SessionUser } from './user/SessionUser.tsx';

try {
  await prisma.$connect();
} catch (error) {
  console.error(
    `${styleText(['red', 'bold'], 'Prisma Database Connection Error')}\n`,
    error,
  );
  process.exit(1);
}

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

if (process.env.NODE_ENV === 'development') {
  setClientDomain(env('DEVELOPMENT_DOMAIN'));
}

const port = (portArg && parseInteger(portArg)) || 9000;
const domain = getClientDomain();

const origin = (
  origin: unknown,
  callback: (error: Error | null, allowed?: boolean) => void,
) => {
  if (process.env.NODE_ENV === 'development' || !origin || origin === domain) {
    callback(null, true);
  } else {
    callback(new Error(`Invalid origin '${origin}'.`));
  }
};
const app = express();
const httpServer = createServer(app);

app.disable('x-powered-by');

app.use((req, res, next) => bodyParser.json({ strict: false })(req, res, next));

app.use(
  cors({
    credentials: true,
    origin,
  }),
);

// `installAuthMiddleware` must be called after `cors` but before the authentication handler.
installAuthMiddleware(app);

app.use(
  (error: Error, _: express.Request, res: express.Response, next: unknown) => {
    if (error.name === 'AuthenticationError') {
      res.json({
        message: error.message || 'authentication-error',
      });
      return;
    }
    res.json({ code: 2, message: 'An error occurred.' });
    console.log(error);
  },
);

const yoga = createYoga({
  context: (request) => ({
    sessionUser: (request as unknown as { req: { user: SessionUser } }).req
      .user,
  }),
  graphiql: process.env.NODE_ENV === 'development',
  schema,
});

app.use('/graphql', async (req, res, next) => {
  try {
    return await yoga(req, res);
  } catch (error) {
    const user = req.user as SessionUser | undefined;
    console.log(
      `${styleText(['red', 'bold'], 'GraphQL Error')}${
        user ? ` › User '${user.username}' (id '${user.id}')` : ''
      }\n`,
      error,
    );
    next(error);
  }
});

app.all('/{*splat}', (_, res) => {
  res.redirect(domain);
});

httpServer.listen(port, () =>
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

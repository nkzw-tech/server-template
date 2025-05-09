import type express from 'express';
import type { YogaInitialContext } from 'graphql-yoga';
import type { SessionUser } from './user/SessionUser.tsx';

export type ServerRequest = express.Request & {
  user?: SessionUser;
};

export interface ServerContext {
  req: ServerRequest;
  res: express.Response;
}

export type Context = Readonly<YogaInitialContext & ServerContext>;

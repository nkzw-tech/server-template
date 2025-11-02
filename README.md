# Template for a Prisma, Pothos & GraphQL Server

_Type‑safe, stable, scalable._

This is a template for a Node.js GraphQL server using Prisma and Pothos including basic authentication. It is designed as a starting point for building a GraphQL server with stability and scalability in mind. It features end-to-end type safety from the database, through GraphQL and all the way to the client. It is recommended to use [Relay](https://relay.dev/) as the client for servers built using this template.

![GraphiQL UI showing an example query](https://github.com/user-attachments/assets/4dcf4999-a1e3-410e-b6ee-248ab63aaa25)

## Technologies

- [Prisma](https://www.prisma.io/) as the ORM, with the new ESM multi-file generated client.
- [Pothos](https://pothos-graphql.dev/) as the GraphQL schema builder.
- [`prisma-json-types-generator`](https://github.com/arthurfiorette/prisma-json-types-generator) for type-safe JSON types from the database all the way to the client.
- [`graphql-yoga`](https://the-guild.dev/graphql/yoga-server)
- [Hono](https://hono.dev/)
- [Better Auth](https://better-auth.com/) for Authentication.
- [pnpm](https://pnpm.io/)

Check out the [`nkzw-tech/expo-app-template`](https://github.com/nkzw-tech/expo-app-template/tree/with-relay) for a React Native template with the Relay GraphQL client, or the [`nkzw-tech/web-app-template`](https://github.com/nkzw-tech/web-app-template/tree/with-relay) for building web apps.

## Setup

You'll need Node.js 23+ and pnpm 10+ to use this template.

- Start here: [Create a new app using this template](https://github.com/new?template_name=server-template&template_owner=nkzw-tech).
- Run `pnpm install && pnpm generate-graphql`.
- Set up a Postgres database locally and add the connection string to `.env` as `DATABASE_URL` or run `docker-compose up -d` to start postgres in a docker container.
- `pnpm prisma migrate dev` to create the database, run the migrations, and seed the database.
  - **Note**: If the database already exists, the [seed script is not executed](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding#integrated-seeding-with-prisma-migrate). In that case, manually run `pnpm prisma db seed`.
- Run `pnpm dev` to start the server.
- Open `http://localhost:9000/graphql` in your browser to see the GraphiQL, a GraphQL playground.
- Open the Dev Tools and paste this code into the console to authenticate:

```js
await (
  await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@nakazawa.dev',
      password: 'not-a-secure-password',
    }),
  })
).json();
// This should return a {success: true, user: …} response.
```

- Now you are ready to execute GraphQL queries. This template comes with a `viewer` root query that returns the currently authenticated user. Try this query:

```graphql
{
  viewer {
    id
    username
    caughtPokemon {
      edges {
        node {
          pokemon {
            id
            name
            primaryType
          }
          shiny
        }
      }
    }
  }
}
```

## Type-safety from the database to the client

Prisma, Pothos and GraphQL allow creating type-safe APIs with minimal effort that are only loosely coupled to the client. This means that the server and client can be developed and deployed independently, which is especially advantageous when building mobile apps published on app stores. Everything flows from the database to the client, let's look at an example:

First, we define our [Prisma schema](https://github.com/nkzw-tech/server-template/blame/main/src/prisma/schema.prisma), for example the `User` model:

```prisma
model User {
  id            String          @unique @default(uuid(7))
  created       DateTime        @default(now())
  email         String          @unique
  locale        String          @default("en_US")
  name          String
  password      String
  role          String          @default("user")
  username      String          @unique
  CaughtPokemon CaughtPokemon[]

  […]

  @@index([id(sort: Asc)])
}
```

Then we use Pothos to define which fields we want to expose to clients via GraphQL on a [`User` node](https://github.com/nkzw-tech/server-template/blob/main/src/graphql/nodes/User.tsx):

```tsx
builder.prismaNode('User', {
  fields: (t) => ({
    access: t.field({
      authScopes: (user) => ({ self: user.id })
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
      authScopes: (user) => ({ self: user.id })
      resolve: ({ email }) => email,
    }),
    locale: t.string({
      authScopes: (user) => ({ self: user.id })
      resolve: ({ locale }) => locale,
    }),
    username: t.exposeString('username', { nullable: false }),
  }),
  id: { field: 'id' },
});
```

To make nodes available at the top level, we need to add a query. For example a query to look up a user by username might look like this:

```tsx
builder.queryFields((t) => ({
  user: t.prismaField({
    args: { username: t.arg.string({ required: true }) },
    authScopes: {
      role: 'user',
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
});
```

As you can see, it's minimal and highly descriptive. Through the strong typing guarantees from Prisma and Pothos, it's impossible to make mistakes. Any typos or incorrect code will be  highlighted to you by TypeScript.

The above code generates the following GraphQL schema automatically:

```graphql
type User implements Node {
  access: Role
  caughtPokemon(
    after: String
    before: String
    first: Int
    last: Int
  ): UserCaughtPokemonConnection!
  displayName: String!
  email: String
  id: ID!
  locale: String
  username: String!
}
```

The default setup in this template also adds various types like connections to work with Relay.

_That's it._ You can now query the User type in your GraphQL API either by calling `user(username: "admin")` to retrieve all Pokémon caught by the user.

## Developing a Node.js Server

When you make a change to a file in `src/`, the server restarts instantly. Every file in this template is designed to be modified by you. It's just a starting point to make you go faster.

### Code Organization

- Prisma code should be in [`src/prisma/`](https://github.com/nkzw-tech/server-template/tree/main/src/prisma).
- GraphQL & Pothos code goes into [`src/graphql/`](https://github.com/nkzw-tech/server-template/tree/main/src/graphql).
- Authentication related code goes into [`src/user/`](https://github.com/nkzw-tech/server-template/tree/main/src/user).

### Adding GraphQL Types and Mutations

Pothos Nodes are expected to be added in `src/graphql/nodes` and Mutations in `src/graphql/mutations`. When you add a new file, run `pnpm generate-graphql` to automatically pull them into your GraphQL schema.

### Auth scopes

This template supports two auth scopes to control the access to fields in the GraphQL schema:

- `self` accepts a user ID and will grant access if the id matches the currently authenticated user (`viewer`).
- `role: "user"` or `role: "admin"` makes the field accessible only to users with the specified role. The `role` matches the `Role` enum in the prisma schema. You can add your own roles in the Prisma schema and use them here.

### JSON Types in the Database

This template uses [`prisma-json-types-generator`](https://github.com/arthurfiorette/prisma-json-types-generator) to allow typing JSON fields in the database. For example, the `stats` field in the `CaughtPokemon` model in the Prisma schema is annotated like this:

```prisma
model CaughtPokemon {
  id        String   @id @default(uuid(7))
  […]

  shiny     Boolean
  /// [PokemonStats]
  stats     Json

  […]
}
```

And the [`PokemonStats` type](https://github.com/nkzw-tech/server-template/blame/main/src/prisma/prisma.tsx) is defined in TypeScript like this:

```tsx
type PokemonStats = Readonly<{
  attack: number;
  defense: number;
  hp: number;
  level: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}>;
```

Running `pnpm prisma generate` connects the annoation with the type definition so that the `stats` field on `CaughtPokemon` is now typed as as `PokemonStats` when fetching or mutating database entries. For example, when you insert a new `CaughtPokemon` into the database, TypeScript will ensure you are providing all the correct fields:

```tsx
await prisma.caughtPokemon.create({
  data: {
    …
    stats: {
      // TypeScript Error: There is a typo in `attack` and `defense` is missing altogether!
      atttack: random(70, 110),
      hp: random(60, 120),
      level: random(1, 100),
      specialAttack: random(70, 110),
      specialDefense: random(60, 100),
      speed: random(70, 100),
    },
  },
});
```

_Note: There is no validation and no actual guarantee that the data from the database actually conforms to your defined types. This is fine and safe if your server is the only client mutating data in your database. If you have other clients mutating data in your database that might not make use of the same types, you have to actually validate the data you retrieve from your database during runtime._

### Authentication

Authentication is handled using [Better Auth](https://better-auth.com). This template only supports the email/password authentication flow. You can add other authentication methods like OAuth2, SSO, etc. by reading the [Better Auth documentation](https://better-auth.com/docs/).

You need to build your own authentication flow in your client using [Better Auth's client](https://www.better-auth.com/docs/concepts/client).

### Security

The sample data in this repository is insecure demo data. Before deploying a server built using this template, make sure to at least change the passwords for the seed users and the authentication secret in the `.env` file.

## Deployment to serverless

This template can also be deployed to serverless hosting platforms like Vercel. To increase portability, we strip all TypeScript types and bundle the app via [tsdown](https://tsdown.dev/) into a single file at `dist/index.js`.

To deploy on Vercel with the default configurations, specify the following options for the project:

- **Framework Preset**: Hono
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

Be sure to add the necessary environment variables.

After which, the GraphQL endpoint can be accessed at `https://yourdomain.vercel.app/graphql`.

## Building a client

This template is designed to be used with [Relay](https://relay.dev/) as the client. Relay is a mature choice for a GraphQL client for TypeScript apps. The CORS policy expects the client to run at `http://localhost:5173` during development. If you are using a different port, change the `DEVELOPMENT_DOMAIN` in `.env`.

## Why does this template use `.tsx` as a file extension?

_You can use `.ts` if you prefer!_ This template uses `.tsx` because it is commonly used in monorepos alongside React projects. You might also choose to use JSX in your server code. Whenever you start out using a `.ts` file and decide to use JSX, you have to rename the file. Blaming the file history then becomes cumbersome. It's also confusing to use two different extensions for TypeScript and the legacy casting syntax supported by `.ts` is not useful. There is no upside to using `.ts` as an extension

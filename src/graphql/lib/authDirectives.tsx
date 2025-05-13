import SchemaBuilder, {
  BasePlugin,
  PothosOutputFieldConfig,
  SchemaTypes,
} from '@pothos/core';
import { FieldAuthScopes } from '@pothos/plugin-scope-auth';

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      authDirectives: AuthDirectivesPlugin<Types>;
    }
  }
}

export class AuthDirectivesPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {
  override onOutputFieldConfig(
    fieldConfig: PothosOutputFieldConfig<Types>,
  ): PothosOutputFieldConfig<Types> | null {
    const { authScopes } = fieldConfig.pothosOptions;

    if (!authScopes) {
      return fieldConfig;
    }

    const scopes = this.#resolveScopes(authScopes);

    return {
      ...fieldConfig,
      extensions: {
        ...fieldConfig.extensions,
        directives: {
          ...(fieldConfig.extensions?.directives ?? {}),
          auth: scopes,
        },
      },
    };
  }

  #resolveScopes(
    authScopes: FieldAuthScopes<Types, object, Record<string, unknown>>,
  ) {
    if (typeof authScopes !== 'function') {
      return authScopes;
    }

    try {
      const resolved = authScopes({}, {}, {}, {} as never);

      if (typeof resolved !== 'object' || !resolved) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(resolved).map(([key, value]) => [
          key,
          value === undefined ? true : value,
        ]),
      );
    } catch {
      return {};
    }
  }
}

SchemaBuilder.registerPlugin('authDirectives', AuthDirectivesPlugin);

export default 'authDirectives';

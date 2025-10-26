import parseInteger from '@nkzw/core/parseInteger.js';
import PrismaTypes from '../../prisma/pothos-types.ts';
import decodeGlobalID from './decodeGlobalID.tsx';

export default function decodeIDOrThrow(
  type: keyof PrismaTypes,
  globalID: string,
) {
  const { id, typename } = decodeGlobalID(globalID);
  const number = parseInteger(id);
  if (typename !== type || !number) {
    throw new Error(
      `Expected '${type}' but received '${typename}' with id '${id}'.`,
    );
  }
  return number;
}

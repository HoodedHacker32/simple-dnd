import rawPack from './pack.json';
import { parseContentPack, type ContentPack } from './schema';

/**
 * The shipped content pack. Parsed through the same validator the editor uses,
 * so a malformed pack fails loudly at startup rather than rendering half a game.
 */
export const CONTENT: ContentPack = parseContentPack(rawPack);

export type { ContentPack };
export { parseContentPack, PackError, PACK_FORMAT, PACK_VERSION } from './schema';

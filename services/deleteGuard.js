import fs from 'fs/promises';
import path from 'path';

import { ENV } from '../env.js';

const DEFAULT_MAX_DELETE_DEPTH = 2;

// -1 means "no limit" - skip the depth walk entirely rather than treating it as invalid config.
const UNLIMITED = -1;

const configuredMaxDepth = Number.parseInt(ENV.MAX_DELETE_DEPTH, 10);
export const MAX_DELETE_DEPTH = Number.isFinite(configuredMaxDepth) && configuredMaxDepth >= UNLIMITED
    ? configuredMaxDepth
    : DEFAULT_MAX_DELETE_DEPTH;

export class TooDeepToDeleteError extends Error {}

/**
 * Refuses to recursively delete a directory whose subtree nests more than MAX_DELETE_DEPTH levels
 * of subfolders below it - a safety net against a stray click wiping out a huge, deeply-nested tree.
 * Depth 0 is the target folder itself, so a depth limit of 2 allows deleting folder/sub/subsub/...
 * but refuses folder/sub/subsub/subsubsub. Only applies to directories - deleting a single file is
 * never recursive, so it's never depth-limited. Set MAX_DELETE_DEPTH=-1 to disable the check.
 *
 * This intentionally does NOT apply to move: fs.rename() on the same volume is a single, instant
 * directory-entry update regardless of how deep or large the subtree underneath it is - it never
 * touches descendants, so depth has no bearing on move's cost or reversibility the way it does for
 * a genuinely recursive, irreversible delete.
 */
export const assertDeletableDepth = async (absolutePath) => {
    if (MAX_DELETE_DEPTH === UNLIMITED) return;

    const stat = await fs.stat(absolutePath);
    if (!stat.isDirectory()) return;

    const exceeds = await exceedsDepth(absolutePath, 0);
    if (exceeds) {
        throw new TooDeepToDeleteError(
            `Folder is nested more than ${MAX_DELETE_DEPTH} levels deep - refusing to delete for safety. ` +
            `Delete a subfolder directly, or raise MAX_DELETE_DEPTH in .env if you really want to remove this all at once.`
        );
    }
};

const exceedsDepth = async (dir, depth) => {
    if (depth > MAX_DELETE_DEPTH) return true;

    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        // Unreadable - don't block on something we can't inspect further; the actual delete
        // attempt will surface a proper error (e.g. permission denied) instead.
        return false;
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const tooDeep = await exceedsDepth(path.join(dir, entry.name), depth + 1);
            if (tooDeep) return true;
        }
    }

    return false;
};

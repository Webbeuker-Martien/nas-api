import path from 'path';

import { ENV } from '../env.js';

export class PathEscapesRootError extends Error {}

/**
 * Resolves a client-supplied relative path ("/Unsorted/file.txt") against BASE_PATH and verifies
 * the result stays inside it. Required for the write endpoints (delete/move/rename) - without this,
 * a relativePath containing ".." (or, on Windows, an absolute path like "C:\Windows") could resolve
 * outside the NAS root entirely, since path.resolve() treats an absolute second argument as
 * overriding the base rather than being joined to it.
 */
export const resolveSafe = (relativePath) => {
    const base = path.resolve(ENV.BASE_PATH);
    // A drive root ("D:" -> "D:\\") already ends with the separator - path.resolve does NOT add
    // one for a plain subfolder base, so appending one unconditionally would double it up there
    // (base + sep = "D:\\\\") and every real path would wrongly fail the startsWith check below.
    const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;

    const cleaned = String(relativePath).replace(/^[/\\]+/, '');
    const resolved = path.resolve(base, cleaned);

    if (resolved !== base && !resolved.startsWith(baseWithSep)) {
        throw new PathEscapesRootError(`Path escapes NAS root: ${relativePath}`);
    }

    return resolved;
};

/** A rename target must be a plain filename - no separators, no "..", not empty. */
export const isValidFilename = (name) => {
    if (typeof name !== 'string') return false;
    if (name.trim() === '') return false;
    if (name === '.' || name === '..') return false;
    if (name.includes('/') || name.includes('\\')) return false;

    return true;
};

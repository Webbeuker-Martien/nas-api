import fs from 'fs/promises';
import path from 'path';

import { ENV } from '../env.js';
import { getMimeType } from './mime.js';

// path.join/path.relative use the OS-native separator (backslash on Windows). URL paths must
// always be forward-slash, so this normalizes before encodeURI - a no-op on the Linux/RPi
// production target, where paths already use forward slashes throughout, but required for correct
// local Windows dev/testing.
const toUrlPath = (p) => p.split(path.sep).join('/');

// Path relative to the NAS root, as a URL path ("/Movies/2024/clip.mp4") - uses path.relative
// rather than stripping a literal ENV.BASE_PATH prefix, so it's correct whether or not BASE_PATH
// happens to have a trailing slash.
const relativeUrlPath = (absolutePath) => '/' + toUrlPath(path.relative(ENV.BASE_PATH, absolutePath));

const compareEntries = (a, b, order) => {
    // Folders first, then alphabetical by name (case-insensitive)
    if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
    }

    const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    return order === 'desc' ? -cmp : cmp;
};

const enrichFile = async (basePath, entry) => {
    const ext = '.' + entry.name.split('.').pop();
    const absolutePath = path.join(basePath, entry.name);
    const relPath = relativeUrlPath(absolutePath);

    let size = 0;
    let mtimeMs = 0;

    try {
        const stat = await fs.stat(absolutePath);
        size = stat.size;
        mtimeMs = stat.mtimeMs;
    } catch {
        // Race with deletion, permissions, etc. - report zeroed metadata rather than failing the page
    }

    return {
        name: entry.name,
        type: 'file',
        ext,
        mime: getMimeType(ext),
        size,
        mtimeMs,
        relativePath: encodeURI(relPath).replaceAll('#', '%23'),
        absolutePath: encodeURI(absolutePath).replaceAll('#', '%23'),
        assetPaths: [
            encodeURI(ENV.BASE_URL + relPath).replaceAll('#', '%23'),
            encodeURI(ENV.BASE_URL + '/view' + relPath).replaceAll('#', '%23')
        ],
        downloadPath: encodeURI(ENV.BASE_URL + '/download' + relPath).replaceAll('#', '%23'),
        thumbPath: encodeURI(ENV.BASE_URL + '/thumb' + relPath).replaceAll('#', '%23')
    };
};

const enrichDir = async (basePath, entry) => {
    const absolutePath = path.join(basePath, entry.name);

    let children = 0;

    try {
        const subEntries = await fs.readdir(absolutePath, { withFileTypes: true });
        children = subEntries.length;
    } catch {
        // Unreadable subdirectory (permissions, race with deletion, etc.) - report as empty rather than failing the whole page
        children = 0;
    }

    return {
        name: entry.name,
        type: 'folder',
        relativePath: encodeURI(relativeUrlPath(absolutePath)).replaceAll('#', '%23'),
        absolutePath: encodeURI(absolutePath).replaceAll('#', '%23'),
        children
    };
};

/**
 * Lists one page of a directory's contents.
 *
 * Only the requested page is stat/mime/child-count enriched - readdir() is called once for the
 * page's own entries, and only entries within [offset, offset+limit) that are directories pay the
 * extra child-count readdir. This keeps large-folder requests O(limit), not O(total).
 */
export const listPage = async (basePath, { offset = 0, limit = 200, order = 'asc' } = {}) => {
    const entries = await fs.readdir(basePath, { withFileTypes: true });

    entries.sort((a, b) => compareEntries(a, b, order));

    const total = entries.length;
    const page = entries.slice(offset, offset + limit);

    const body = await Promise.all(page.map((entry) => (
        entry.isDirectory() ? enrichDir(basePath, entry) : enrichFile(basePath, entry)
    )));

    return {
        body,
        total,
        offset,
        limit,
        hasMore: offset + page.length < total
    };
};

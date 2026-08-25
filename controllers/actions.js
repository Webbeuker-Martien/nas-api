import fs from 'fs/promises';
import path from 'path';

import { resolveSafe, isValidFilename, PathEscapesRootError } from '../services/paths.js';
import { assertDeletableDepth, TooDeepToDeleteError } from '../services/deleteGuard.js';

const deleteOne = async (absolutePath) => {
    await assertDeletableDepth(absolutePath);

    const stat = await fs.stat(absolutePath);

    if (stat.isDirectory()) {
        await fs.rm(absolutePath, { recursive: true });
    } else {
        await fs.unlink(absolutePath);
    }
};

export const bulkDelete = async (req, res) => {
    const { paths } = req.body || {};

    if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ success: false, message: 'No paths provided' });
    }

    const results = await Promise.all(paths.map(async (relativePath) => {
        try {
            const absolutePath = resolveSafe(relativePath);
            await deleteOne(absolutePath);
            return { path: relativePath, success: true };
        } catch (err) {
            return { path: relativePath, success: false, message: errorMessage(err) };
        }
    }));

    const allOk = results.every((r) => r.success);

    return res.status(allOk ? 200 : 207).json({ success: allOk, results });
};

export const bulkMove = async (req, res) => {
    const { paths, destination } = req.body || {};

    if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ success: false, message: 'No paths provided' });
    }

    if (typeof destination !== 'string') {
        return res.status(400).json({ success: false, message: 'No destination provided' });
    }

    let destAbsolute;
    try {
        destAbsolute = resolveSafe(destination);
    } catch (err) {
        return res.status(400).json({ success: false, message: errorMessage(err) });
    }

    try {
        const destStat = await fs.stat(destAbsolute);
        if (!destStat.isDirectory()) {
            return res.status(400).json({ success: false, message: 'Destination is not a folder' });
        }
    } catch {
        return res.status(404).json({ success: false, message: 'Destination folder not found' });
    }

    const results = await Promise.all(paths.map(async (relativePath) => {
        try {
            const sourceAbsolute = resolveSafe(relativePath);
            const targetAbsolute = path.join(destAbsolute, path.basename(sourceAbsolute));

            if (targetAbsolute === sourceAbsolute) {
                return { path: relativePath, success: false, message: 'Already in that folder' };
            }

            try {
                await fs.access(targetAbsolute);
                return { path: relativePath, success: false, message: 'An item with that name already exists in the destination' };
            } catch {
                // Doesn't exist yet - clear to move
            }

            await fs.rename(sourceAbsolute, targetAbsolute);
            return { path: relativePath, success: true };
        } catch (err) {
            if (err.code === 'EXDEV') {
                return { path: relativePath, success: false, message: 'Cannot move across drives' };
            }
            return { path: relativePath, success: false, message: errorMessage(err) };
        }
    }));

    const allOk = results.every((r) => r.success);

    return res.status(allOk ? 200 : 207).json({ success: allOk, results });
};

export const rename = async (req, res) => {
    const { path: relativePath, newName } = req.body || {};

    if (typeof relativePath !== 'string') {
        return res.status(400).json({ success: false, message: 'No path provided' });
    }

    if (!isValidFilename(newName)) {
        return res.status(400).json({ success: false, message: 'Invalid new name' });
    }

    try {
        const sourceAbsolute = resolveSafe(relativePath);
        const targetAbsolute = path.join(path.dirname(sourceAbsolute), newName);

        if (targetAbsolute === sourceAbsolute) {
            return res.status(200).json({ success: true });
        }

        try {
            await fs.access(targetAbsolute);
            return res.status(400).json({ success: false, message: 'An item with that name already exists' });
        } catch {
            // Doesn't exist yet - clear to rename
        }

        await fs.rename(sourceAbsolute, targetAbsolute);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error: ', err);
        return res.status(err instanceof PathEscapesRootError ? 400 : 500).json({ success: false, message: errorMessage(err) });
    }
};

const errorMessage = (err) => {
    if (err instanceof PathEscapesRootError) return 'Invalid path';
    if (err instanceof TooDeepToDeleteError) return err.message;
    if (err.code === 'ENOENT') return 'Not found';
    if (err.code === 'EACCES' || err.code === 'EPERM') return 'Permission denied';
    return 'Internal server error';
};

export default { bulkDelete, bulkMove, rename };

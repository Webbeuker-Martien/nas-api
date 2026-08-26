import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

// process.env is read directly (not the ENV re-export from index.js) so this module has no
// import-time dependency on index.js - avoids a circular-import deadlock, since index.js itself
// (transitively, via routes/thumb.js -> controllers/thumb.js) imports this module.
if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

const CACHE_DIR = path.resolve(process.env.THUMB_CACHE_DIR || path.join(process.cwd(), 'cache', 'thumbs'));

const SIZES = {
    sm: 200,
    md: 400,
    lg: 800
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.avif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.ogv', '.3gp']);

// Dedupe concurrent misses for the same cache key so N simultaneous grid requests for a
// not-yet-cached thumbnail collapse into a single sharp/ffmpeg invocation.
const inFlight = new Map();

const cacheKeyFor = (absolutePath, mtimeMs, size) => {
    const hash = crypto.createHash('sha1').update(absolutePath).digest('hex');
    return `${hash}-${Math.round(mtimeMs)}-${size}.webp`;
};

const generateImageThumb = async (absolutePath, destPath, width) => {
    await sharp(absolutePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(destPath);
};

const generateVideoThumb = (absolutePath, destPath, width) => {
    const folder = path.dirname(destPath);
    const filename = path.basename(destPath);

    return new Promise((resolve, reject) => {
        ffmpeg(absolutePath)
            .on('end', () => resolve())
            .on('error', reject)
            .screenshots({
                timestamps: ['10%'],
                folder,
                filename,
                size: `${width}x?`
            });
    });
};

export const kindOf = (ext) => {
    const lower = ext.toLowerCase();
    if (IMAGE_EXTS.has(lower)) return 'image';
    if (VIDEO_EXTS.has(lower)) return 'video';
    return null;
};

/**
 * Returns the absolute path to a cached (webp) thumbnail for the given source file,
 * generating it on first request. Returns null if the file type isn't thumbnailable.
 */
export const getThumbnail = async (absolutePath, size = 'md') => {
    const ext = path.extname(absolutePath);
    const kind = kindOf(ext);
    if (!kind) return null;

    const width = SIZES[size] || SIZES.md;

    const stat = await fs.stat(absolutePath);
    const key = cacheKeyFor(absolutePath, stat.mtimeMs, `${size}-${kind}`);
    const destPath = path.join(CACHE_DIR, key);

    try {
        await fs.access(destPath);
        return destPath;
    } catch {
        // Not cached yet - fall through to generation
    }

    if (inFlight.has(key)) {
        await inFlight.get(key);
        return destPath;
    }

    const generation = (async () => {
        await fs.mkdir(CACHE_DIR, { recursive: true });

        if (kind === 'image') {
            await generateImageThumb(absolutePath, destPath, width);
        } else {
            await generateVideoThumb(absolutePath, destPath, width);
        }
    })();

    inFlight.set(key, generation);

    try {
        await generation;
    } finally {
        inFlight.delete(key);
    }

    return destPath;
};

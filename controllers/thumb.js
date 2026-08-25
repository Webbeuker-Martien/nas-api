import path from 'path';

import { ENV } from '../env.js';
import { getThumbnail } from '../services/thumbnails.js';

export const get = async (req, res) => {
    const relativePath = req.params[0];
    const size = ['sm', 'md', 'lg'].includes(req.query.size) ? req.query.size : 'md';

    try {
        const absolutePath = path.join(ENV.BASE_PATH, relativePath);
        const thumbPath = await getThumbnail(absolutePath, size);

        if (!thumbPath) {
            return res.status(404).json({
                success: false,
                message: 'No thumbnail available for this file type'
            });
        }

        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).sendFile(thumbPath);
    } catch (err) {
        console.error('Error: ', err);

        if (err.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export default { get };

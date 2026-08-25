import path from 'path';

import { ENV } from '../env.js';

export const getAll = async (req, res) => {
    const relativePath = req.params[0];

    if (!relativePath) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }

    const absolutePath = path.join(ENV.BASE_PATH, relativePath);
    const filename = path.basename(absolutePath);

    res.download(absolutePath, filename, (err) => {
        if (!err) return;

        console.error('Error: ', err);

        if (res.headersSent) return;

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
    });
};

export default {
    getAll
};

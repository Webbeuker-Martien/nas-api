import jwt from 'jsonwebtoken';

import { ENV } from '../env.js';

export const requireAuth = (req, res, next) => {
    if (ENV.AUTH_ENABLED === 'false') {
        return next();
    }

    const token = req.cookies?.session;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    try {
        jwt.verify(token, ENV.AUTH_JWT_SECRET);
        return next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Session expired or invalid'
        });
    }
};

export default { requireAuth };

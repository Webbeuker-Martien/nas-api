import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

import auth from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again later' }
});

router.post('/login', loginLimiter, auth.login);
router.post('/logout', auth.logout);
router.get('/status', requireAuth, auth.status);

export default router;

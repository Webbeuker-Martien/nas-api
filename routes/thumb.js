import express from 'express';

const router = express.Router();

import thumb from '../controllers/thumb.js';
import { requireAuth } from '../middleware/auth.js';

router.get('/*', requireAuth, thumb.get);

export default router;

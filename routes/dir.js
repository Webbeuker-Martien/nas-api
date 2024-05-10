import express from 'express';

const router = express.Router();

import dir from '../controllers/dir.js';

router.get('/', dir.getAll);
router.get('/:dir', dir.get);
router.get('/*', (req, res, next) => dir.get(req, res, next, true));

export default router;

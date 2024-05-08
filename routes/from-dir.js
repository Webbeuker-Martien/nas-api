import express from 'express';

const router = express.Router();

import fromDir from '../controllers/from-dir.js';

router.get('/', fromDir.getAll);
router.get('/:dir', fromDir.get);
router.get('/*', (req, res, next) => fromDir.get(req, res, next, true));

export default router;

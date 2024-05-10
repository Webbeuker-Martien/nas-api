import express from 'express';

const router = express.Router();

import download from '../controllers/download.js';

router.get('/*', download.getAll);

export default router;

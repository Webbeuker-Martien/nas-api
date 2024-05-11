import express from 'express';
const router = express.Router();

import fileUpload from 'express-fileupload';

import dir from '../controllers/dir.js';

router.get('/', dir.getAll);
router.get('/:dir', dir.get);
router.get('/*', (req, res, next) => dir.get(req, res, next, true));

// Upload file
router.post('/*',
    fileUpload({ createParentPath: true }),
    (req, res, next) => dir.post(req, res, next, true)
);

// Move file
router.put('/move/*',
    fileUpload({ createParentPath: true }),
    (req, res, next) => dir.moveOrCopy(req, res, next, 'move')
);

router.put('/copy/*',
    fileUpload({ createParentPath: true }),
    (req, res, next) => dir.moveOrCopy(req, res, next, 'copy')
);

export default router;

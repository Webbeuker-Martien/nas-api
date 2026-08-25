import express from 'express';
const router = express.Router();

import fileUpload from 'express-fileupload';

import dir from '../controllers/dir.js';
import actions from '../controllers/actions.js';
import { requireAuth } from '../middleware/auth.js';

router.use(requireAuth);

router.get('/', dir.getAll);
router.get('/*', dir.get);

// These must come before the wildcard `POST /*` upload route below, since Express matches
// same-method routes in registration order and the wildcard would otherwise swallow them.
router.post('/actions/delete', actions.bulkDelete);
router.post('/actions/move', actions.bulkMove);
router.post('/actions/rename', actions.rename);

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

router.delete('/:dir', dir.deleteFileOrDir);
router.delete('/*',
    (req, res, next) => dir.deleteFileOrDir(req, res, next, true)
);

export default router;

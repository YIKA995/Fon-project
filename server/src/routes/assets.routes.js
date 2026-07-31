const { Router } = require('express');
const assetsController = require('../controllers/assetsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { assetSchema } = require('../schemas');

const router = Router();

router.use(requireAuth);
router.get('/', assetsController.list);
router.get('/:id', assetsController.get);
router.post('/', requireRole('ADMIN', 'ANALYST'), validate(assetSchema), assetsController.create);
router.patch('/:id', requireRole('ADMIN', 'ANALYST'), assetsController.update);
router.delete('/:id', requireRole('ADMIN'), assetsController.remove);

module.exports = router;

const { Router } = require('express');
const threatIntelController = require('../controllers/threatIntelController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { threatIntelSchema } = require('../schemas');

const router = Router();

router.use(requireAuth);
router.get('/', threatIntelController.list);
router.post('/', requireRole('ADMIN', 'ANALYST'), validate(threatIntelSchema), threatIntelController.create);
router.delete('/:id', requireRole('ADMIN', 'ANALYST'), threatIntelController.remove);

module.exports = router;

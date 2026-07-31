const { Router } = require('express');
const alertsController = require('../controllers/alertsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { alertUpdateSchema } = require('../schemas');

const router = Router();

router.use(requireAuth);
router.get('/', alertsController.list);
router.get('/:id', alertsController.get);
router.patch('/:id', requireRole('ADMIN', 'ANALYST'), validate(alertUpdateSchema), alertsController.update);

module.exports = router;

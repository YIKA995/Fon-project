const { Router } = require('express');
const auditController = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/', auditController.list);

module.exports = router;

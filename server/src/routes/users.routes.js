const { Router } = require('express');
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { userUpdateSchema } = require('../schemas');

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('ADMIN', 'ANALYST'), usersController.list);
router.patch('/:id', requireRole('ADMIN'), validate(userUpdateSchema), usersController.update);

module.exports = router;

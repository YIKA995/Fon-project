const { Router } = require('express');
const notificationsController = require('../controllers/notificationsController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
router.get('/', notificationsController.list);
router.post('/:id/read', notificationsController.markRead);
router.post('/read-all', notificationsController.markAllRead);

module.exports = router;

const { Router } = require('express');
const eventsController = require('../controllers/eventsController');
const { requireAuth, requireAgentKey } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { eventSchema, eventBatchSchema } = require('../schemas');

const router = Router();

// Offline/edge agents authenticate with an API key, not a user session.
router.post('/ingest', requireAgentKey, validate(eventSchema), eventsController.ingestOne);
router.post('/ingest/batch', requireAgentKey, validate(eventBatchSchema), eventsController.ingestBatch);

router.use(requireAuth);
router.get('/', eventsController.list);
router.post('/', requireRole('ADMIN', 'ANALYST'), validate(eventSchema), eventsController.ingestOne);

module.exports = router;

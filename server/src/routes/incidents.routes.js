const { Router } = require('express');
const incidentsController = require('../controllers/incidentsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { incidentCreateSchema, incidentUpdateSchema, incidentNoteSchema } = require('../schemas');

const router = Router();

router.use(requireAuth);
router.get('/', incidentsController.list);
router.get('/:id', incidentsController.get);
router.post('/', requireRole('ADMIN', 'ANALYST'), validate(incidentCreateSchema), incidentsController.create);
router.patch('/:id', requireRole('ADMIN', 'ANALYST'), validate(incidentUpdateSchema), incidentsController.update);
router.post('/:id/notes', requireRole('ADMIN', 'ANALYST'), validate(incidentNoteSchema), incidentsController.addNote);

module.exports = router;

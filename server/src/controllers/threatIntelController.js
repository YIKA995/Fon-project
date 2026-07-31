const prisma = require('../config/db');
const { recordAudit } = require('../services/auditService');

async function list(req, res, next) {
  try {
    const indicators = await prisma.threatIntel.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ indicators });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const indicator = await prisma.threatIntel.create({ data: req.body });
    await recordAudit({ userId: req.user.id, action: 'threatintel.create', target: indicator.id, ipAddress: req.ip });
    res.status(201).json({ indicator });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Indicator already exists' });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.threatIntel.delete({ where: { id: req.params.id } });
    await recordAudit({ userId: req.user.id, action: 'threatintel.delete', target: req.params.id, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Indicator not found' });
    next(err);
  }
}

module.exports = { list, create, remove };

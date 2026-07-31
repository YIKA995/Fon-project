const prisma = require('../config/db');
const { sanitizeUser } = require('./authController');
const { recordAudit } = require('../services/auditService');

async function list(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ users: users.map(sanitizeUser) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({ where: { id }, data: req.body });
    await recordAudit({
      userId: req.user.id,
      action: 'user.update',
      target: id,
      metadata: req.body,
      ipAddress: req.ip,
    });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    next(err);
  }
}

module.exports = { list, update };

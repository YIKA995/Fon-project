const prisma = require('../config/db');
const { recordAudit } = require('../services/auditService');

async function list(req, res, next) {
  try {
    const { status, type } = req.query;
    const assets = await prisma.asset.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { riskScore: 'desc' },
    });
    res.json({ assets });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        events: { orderBy: { occurredAt: 'desc' }, take: 25 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 25 },
      },
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const asset = await prisma.asset.create({ data: req.body });
    await recordAudit({ userId: req.user.id, action: 'asset.create', target: asset.id, ipAddress: req.ip });
    res.status(201).json({ asset });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const asset = await prisma.asset.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ userId: req.user.id, action: 'asset.update', target: asset.id, metadata: req.body, ipAddress: req.ip });
    res.json({ asset });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Asset not found' });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    await recordAudit({ userId: req.user.id, action: 'asset.delete', target: req.params.id, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Asset not found' });
    next(err);
  }
}

module.exports = { list, get, create, update, remove };

const prisma = require('../config/db');
const { recordAudit } = require('../services/auditService');
const { emitAssetStatusChange } = require('../websocket/socket');

async function list(req, res, next) {
  try {
    const { status, severity, assignedToId, limit } = req.query;
    const alerts = await prisma.alert.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
        ...(assignedToId ? { assignedToId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 100, 500),
      include: {
        asset: { select: { id: true, name: true, type: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: req.params.id },
      include: {
        asset: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        event: true,
        incident: true,
      },
    });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.status === 'RESOLVED' || data.status === 'FALSE_POSITIVE') {
      data.resolvedAt = new Date();
    }

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data,
      include: { asset: true },
    });

    if (alert.status === 'RESOLVED' && alert.asset && alert.asset.status !== 'HEALTHY') {
      const openAlerts = await prisma.alert.count({
        where: { assetId: alert.assetId, status: { in: ['OPEN', 'INVESTIGATING'] } },
      });
      if (openAlerts === 0) {
        const healed = await prisma.asset.update({
          where: { id: alert.assetId },
          data: { status: 'HEALTHY', riskScore: 0 },
        });
        emitAssetStatusChange(healed);
      }
    }

    await recordAudit({
      userId: req.user.id,
      action: 'alert.update',
      target: alert.id,
      metadata: req.body,
      ipAddress: req.ip,
    });

    res.json({ alert });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Alert not found' });
    next(err);
  }
}

module.exports = { list, get, update };

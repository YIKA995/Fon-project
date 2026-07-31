const prisma = require('../config/db');
const { recordAudit } = require('../services/auditService');

async function list(req, res, next) {
  try {
    const { status } = req.query;
    const incidents = await prisma.incident.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        alerts: { select: { id: true, title: true, severity: true, status: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json({ incidents });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        alerts: { include: { asset: true } },
        notes: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, summary, severity, alertIds = [] } = req.body;
    const incident = await prisma.incident.create({
      data: {
        title,
        summary,
        severity,
        createdById: req.user.id,
        alerts: alertIds.length ? { connect: alertIds.map((id) => ({ id })) } : undefined,
      },
      include: { alerts: true },
    });
    await recordAudit({ userId: req.user.id, action: 'incident.create', target: incident.id, ipAddress: req.ip });
    res.status(201).json({ incident });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.status === 'CLOSED' || data.status === 'RESOLVED') {
      data.closedAt = new Date();
    }
    const incident = await prisma.incident.update({ where: { id: req.params.id }, data });
    await recordAudit({
      userId: req.user.id,
      action: 'incident.update',
      target: incident.id,
      metadata: req.body,
      ipAddress: req.ip,
    });
    res.json({ incident });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Incident not found' });
    next(err);
  }
}

async function addNote(req, res, next) {
  try {
    const note = await prisma.incidentNote.create({
      data: {
        incidentId: req.params.id,
        authorId: req.user.id,
        body: req.body.body,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, addNote };

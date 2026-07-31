const prisma = require('../config/db');
const { evaluateEvent } = require('../services/detectionEngine');
const { emitNewAlert, emitAssetStatusChange } = require('../websocket/socket');
const { notifyAnalystsOfAlert } = require('../services/notificationService');
const logger = require('../utils/logger');

async function persistAndEvaluate(raw, ingestedVia) {
  const data = {
    externalId: raw.externalId,
    assetId: raw.assetId,
    sourceIp: raw.sourceIp,
    eventType: raw.eventType,
    payload: raw.payload,
    occurredAt: raw.occurredAt ? new Date(raw.occurredAt) : new Date(),
    ingestedVia,
  };

  let event;
  try {
    event = await prisma.event.create({ data });
  } catch (err) {
    // Duplicate externalId = an offline agent re-sending an already-synced
    // event after a flaky connection; treat as a no-op, not an error.
    if (err.code === 'P2002') {
      event = await prisma.event.findUnique({ where: { externalId: raw.externalId } });
      return { event, alert: null, duplicate: true };
    }
    throw err;
  }

  const { event: evaluated, alert } = await evaluateEvent(event);

  if (alert) {
    emitNewAlert(alert);
    if (alert.asset) emitAssetStatusChange(alert.asset);
    notifyAnalystsOfAlert(alert).catch((err) =>
      logger.error('Failed to fan out alert notifications', { error: err.message })
    );
  }

  return { event: evaluated, alert, duplicate: false };
}

async function ingestOne(req, res, next) {
  try {
    const result = await persistAndEvaluate(req.body, 'online');
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// Used by offline agents flushing a locally-buffered queue once
// connectivity is restored. Accepts up to 500 events per batch and is
// idempotent on externalId so retried batches never double-count.
async function ingestBatch(req, res, next) {
  try {
    const { events } = req.body;
    const results = [];
    for (const raw of events) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await persistAndEvaluate(raw, 'offline-sync'));
    }
    res.status(201).json({
      accepted: results.length,
      alertsGenerated: results.filter((r) => r.alert).length,
      duplicates: results.filter((r) => r.duplicate).length,
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { assetId, eventType, isAnomaly, limit } = req.query;
    const events = await prisma.event.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        ...(eventType ? { eventType } : {}),
        ...(isAnomaly !== undefined ? { isAnomaly: isAnomaly === 'true' } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: Math.min(Number(limit) || 100, 500),
      include: { asset: { select: { id: true, name: true } } },
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

module.exports = { ingestOne, ingestBatch, list };

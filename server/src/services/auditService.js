const prisma = require('../config/db');
const logger = require('../utils/logger');

async function recordAudit({ userId, action, target, metadata, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId || null, action, target, metadata, ipAddress },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { action, error: err.message });
  }
}

module.exports = { recordAudit };

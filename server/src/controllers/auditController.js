const prisma = require('../config/db');

async function list(req, res, next) {
  try {
    const { userId, action, limit } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 100, 500),
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };

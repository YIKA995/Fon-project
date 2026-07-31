const prisma = require('../config/db');

async function summary(req, res, next) {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      atRiskAssets,
      compromisedAssets,
      openAlerts,
      criticalAlerts,
      openIncidents,
      alerts24h,
      events24h,
      severityBreakdown,
      topAssets,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AT_RISK' } }),
      prisma.asset.count({ where: { status: 'COMPROMISED' } }),
      prisma.alert.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.incident.count({ where: { status: { in: ['OPEN', 'CONTAINED'] } } }),
      prisma.alert.count({ where: { createdAt: { gte: since24h } } }),
      prisma.event.count({ where: { occurredAt: { gte: since24h } } }),
      prisma.alert.groupBy({ by: ['severity'], _count: true }),
      prisma.asset.findMany({
        where: { riskScore: { gt: 0 } },
        orderBy: { riskScore: 'desc' },
        take: 5,
        select: { id: true, name: true, type: true, riskScore: true, status: true },
      }),
    ]);

    const alertsTrend = await prisma.$queryRaw`
      SELECT date_trunc('hour', "createdAt") AS bucket, COUNT(*)::int AS count
      FROM "Alert"
      WHERE "createdAt" >= ${since7d}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    res.json({
      assets: { total: totalAssets, atRisk: atRiskAssets, compromised: compromisedAssets },
      alerts: { open: openAlerts, critical: criticalAlerts, last24h: alerts24h },
      incidents: { open: openIncidents },
      events: { last24h: events24h },
      severityBreakdown: severityBreakdown.map((s) => ({ severity: s.severity, count: s._count })),
      topAssets,
      alertsTrend,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };

const prisma = require('../config/db');
const { emitNotification } = require('../websocket/socket');

async function notifyAnalystsOfAlert(alert) {
  const recipients = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'ANALYST'] }, isActive: true },
    select: { id: true },
  });

  const message = `[${alert.severity}] ${alert.title}`;
  await Promise.all(
    recipients.map(async (u) => {
      const notification = await prisma.notification.create({
        data: { userId: u.id, message, severity: alert.severity },
      });
      emitNotification(u.id, notification);
    })
  );
}

module.exports = { notifyAnalystsOfAlert };

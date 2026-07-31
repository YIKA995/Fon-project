const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const {
  signAccessToken,
  generateRefreshTokenValue,
  refreshExpiryDate,
} = require('../utils/jwt');
const { recordAudit } = require('../services/auditService');

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshTokenValue = generateRefreshTokenValue();
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });
  return { accessToken, refreshToken: refreshTokenValue };
}

async function register(req, res, next) {
  try {
    const { name, email, password, organization } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // First user to ever register becomes ADMIN, so the platform is
    // self-bootstrapping without needing a manual DB seed in production.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'VIEWER';

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, organization, role },
    });

    const session = await issueSession(user);
    await recordAudit({ userId: user.id, action: 'auth.register', ipAddress: req.ip });

    res.status(201).json({ user: sanitizeUser(user), ...session });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await recordAudit({ action: 'auth.login_failed', target: email, ipAddress: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const session = await issueSession(user);
    await recordAudit({ userId: user.id, action: 'auth.login', ipAddress: req.ip });

    res.json({ user: sanitizeUser(user), ...session });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke the used token and issue a new pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const session = await issueSession(stored.user);

    res.json({ user: sanitizeUser(stored.user), ...session });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
    await recordAudit({ userId: req.user?.id, action: 'auth.logout', ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me, sanitizeUser };

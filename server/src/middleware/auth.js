const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

function requireAgentKey(req, res, next) {
  const key = req.headers['x-agent-key'];
  const validKeys = (process.env.AGENT_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);

  if (!key || !validKeys.includes(key)) {
    return res.status(401).json({ error: 'Invalid or missing agent API key' });
  }
  return next();
}

module.exports = { requireAuth, requireAgentKey };

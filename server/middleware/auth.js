const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = function auth(req, res, next) {
  if (!req.app.locals.jwtReady || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(503).json({ error: 'Authentication is not configured. Set a strong JWT_SECRET and restart the server.' });
  }
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded || !decoded.sub || !mongoose.Types.ObjectId.isValid(decoded.sub)) {
      return res.status(401).json({ error: 'Session is invalid or expired.' });
    }
    req.user = decoded;
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Session is invalid or expired.' });
  }
};

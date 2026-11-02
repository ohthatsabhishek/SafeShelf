require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Product = require('./server/models/Product');
const authRoutes = require('./server/routes/auth');
const productRoutes = require('./server/routes/products');
const uploadRoutes = require('./server/routes/uploads');
const userDataRoutes = require('./server/routes/userData');
const shoppingImportRoutes = require('./server/routes/shoppingImport');
const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || '';
const validSecret = jwtSecret.length >= 32 && !/replace-with|change-me|your-secret/i.test(jwtSecret);
if (!validSecret && isProduction) {
  console.error('Startup blocked: configure a unique JWT_SECRET of at least 32 characters in the environment.');
  process.exit(1);
}
if (!validSecret) console.warn('WARNING: Authentication tokens are disabled until a valid JWT_SECRET is configured.');
app.locals.jwtReady = validSecret;
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'", 'https://dummyjson.com', 'https://api.emailjs.com'],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  }
}));
app.use(express.json({ limit: '1mb', strict: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many authentication attempts. Please try again later.' } }), authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api/shopping-import', shoppingImportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { fallthrough: false, dotfiles: 'deny', index: false, setHeaders(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: app.locals.mongoReady ? 'connected' : 'offline', fallback: 'local dataset', authentication: app.locals.jwtReady ? 'configured' : 'not-configured' }));
app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'ignore', setHeaders(res, filePath) { if (path.extname(filePath) === '.html') res.setHeader('Cache-Control', 'no-cache'); } }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = 500;
  if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    status = 400;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
  } else if (Number.isInteger(err.status)) {
    status = err.status;
  }
  if (status >= 500) console.error('Request failed:', err.message);
  res.status(status).json({ error: status === 500 ? 'Server error. Check server logs.' : err.message });
});
const port = Number(process.env.PORT) || 3000;
async function start() {
  if (process.env.MONGODB_URI) {
    try { await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 }); app.locals.mongoReady = true; console.log('MongoDB connected'); }
    catch (e) { app.locals.mongoReady = false; console.warn('MongoDB unavailable; product API will use local dataset:', e.message); }
  } else { app.locals.mongoReady = false; console.warn('MONGODB_URI not configured; using local dataset fallback.'); }
  mongoose.connection.on('disconnected', () => { app.locals.mongoReady = false; console.warn('MongoDB disconnected; cloud data operations are paused.'); });
  mongoose.connection.on('connected', () => { app.locals.mongoReady = true; console.log('MongoDB connection restored.'); });
  app.listen(port, () => console.log(`SafeShelf running at http://localhost:${port}`));
}
if (require.main === module) start();
module.exports = { app, start };

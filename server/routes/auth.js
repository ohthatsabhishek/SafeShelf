const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const requireDatabase = (req,res,next) => req.app.locals.mongoReady ? next() : res.status(503).json({error:'Account service is unavailable because MongoDB is disconnected. Please try again shortly.'});
router.use(requireDatabase);
const tokenFor = user => jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
router.post('/register', async (req, res, next) => {
 try {
  const name = String(req.body.name || '').trim(), email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Enter a name, valid email and password of at least 8 characters.' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
 } catch (e) { next(e); }
});
router.post('/login', async (req, res, next) => {
 try {
  const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
 } catch (e) { next(e); }
});
const auth = require('../middleware/auth');
router.put('/profile', auth, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid name (at least 2 characters) and a valid email.' });
    }
    const duplicate = await User.findOne({ email, _id: { $ne: req.user.sub } });
    if (duplicate) {
      return res.status(409).json({ error: 'This email is already in use by another account.' });
    }
    const user = await User.findByIdAndUpdate(req.user.sub, { $set: { name, email } }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});
module.exports = router;

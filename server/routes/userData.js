const express = require('express');
const UserData = require('../models/UserData');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);
router.use((req, res, next) => req.app.locals.mongoReady ? next() : res.status(503).json({ error: 'Your saved data is temporarily unavailable because MongoDB is disconnected. Local cached data remains on this device.' }));
router.get('/', async (req, res, next) => {
  try {
    const doc = await UserData.findOne({ userId: req.user.sub }).lean();
    res.set('Cache-Control', 'no-store').json({
      inventory: doc?.inventory || [],
      shoppingList: doc?.shoppingList || [],
      updatedAt: doc?.updatedAt || null,
      version: doc ? (Number(doc.version) || 1) : 0
    });
  }
  catch (e) { next(e); }
});
router.put('/', async (req, res, next) => {
  try {
    const inventory = Array.isArray(req.body.inventory) ? req.body.inventory : null;
    const shoppingList = Array.isArray(req.body.shoppingList) ? req.body.shoppingList : null;
    if (!inventory || !shoppingList) return res.status(400).json({ error: 'inventory and shoppingList must be arrays.' });
    if (inventory.length > 5000 || shoppingList.length > 2000) return res.status(413).json({ error: 'Too many records.' });
    // Bound nested user-controlled payloads and reject executable/non-JSON values.
    const serialized = JSON.stringify({ inventory, shoppingList });
    if (Buffer.byteLength(serialized, 'utf8') > 900 * 1024) return res.status(413).json({ error: 'Saved data exceeds the 900 KB limit.' });
    const isPlainRecord = value => value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
    if (![...inventory, ...shoppingList].every(isPlainRecord)) return res.status(400).json({ error: 'Each inventory and shopping-list entry must be an object.' });

    // Optimistic Concurrency Control: require a non-negative integer revision version.
    const clientVersion = req.body.version !== undefined && req.body.version !== null ? Number(req.body.version) : null;
    if (clientVersion === null || !Number.isInteger(clientVersion) || clientVersion < 0) {
      return res.status(400).json({ error: 'A non-negative integer version is required for optimistic concurrency control.' });
    }

    const existing = await UserData.findOne({ userId: req.user.sub });

    if (!existing) {
      // First-time document creation: expect version === 0
      if (clientVersion !== 0) {
        return res.status(409).json({
          error: 'Conflict: Document does not exist on server yet, but client sent a non-zero version.',
          currentVersion: 0,
          serverData: null
        });
      }

      try {
        const newDoc = await UserData.create({
          userId: req.user.sub,
          inventory,
          shoppingList,
          version: 1
        });
        return res.set('Cache-Control', 'no-store').json({
          ok: true,
          version: newDoc.version,
          updatedAt: newDoc.updatedAt
        });
      } catch (err) {
        // Safe handling of concurrent initial writes: Mongo E11000 duplicate key error on userId
        if (err.code === 11000) {
          const conflictDoc = await UserData.findOne({ userId: req.user.sub }).lean();
          return res.status(409).json({
            error: 'Conflict: Another session created cloud data concurrently.',
            currentVersion: conflictDoc ? (Number(conflictDoc.version) || 1) : 1,
            serverData: {
              inventory: conflictDoc?.inventory || [],
              shoppingList: conflictDoc?.shoppingList || [],
              updatedAt: conflictDoc?.updatedAt || null
            }
          });
        }
        throw err;
      }
    }

    // Document already exists: verify version matches
    const currentServerVersion = Number(existing.version) || 1;
    if (clientVersion !== currentServerVersion) {
      return res.status(409).json({
        error: 'Conflict: Your data is out of date. Another session has saved newer changes.',
        currentVersion: currentServerVersion,
        serverData: {
          inventory: existing.inventory || [],
          shoppingList: existing.shoppingList || [],
          updatedAt: existing.updatedAt
        }
      });
    }

    // Atomic update with version check in query filter to protect against concurrent writes between find and update
    const filter = {
      _id: existing._id,
      userId: req.user.sub,
      $or: [
        { version: clientVersion },
        { version: { $exists: false } }
      ]
    };
    const update = {
      $set: {
        inventory,
        shoppingList,
        version: currentServerVersion + 1
      }
    };
    const updatedDoc = await UserData.findOneAndUpdate(filter, update, { new: true, runValidators: true });

    if (!updatedDoc) {
      // Interleaving write occurred concurrently
      const latest = await UserData.findOne({ userId: req.user.sub }).lean();
      return res.status(409).json({
        error: 'Conflict: Another session updated this document concurrently.',
        currentVersion: latest ? (Number(latest.version) || 1) : 1,
        serverData: {
          inventory: latest?.inventory || [],
          shoppingList: latest?.shoppingList || [],
          updatedAt: latest?.updatedAt || null
        }
      });
    }

    res.set('Cache-Control', 'no-store').json({
      ok: true,
      version: updatedDoc.version,
      updatedAt: updatedDoc.updatedAt
    });
  } catch (e) { next(e); }
});
module.exports = router;

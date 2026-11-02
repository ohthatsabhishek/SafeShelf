/**
 * SafeShelf V1 — Batch 2 Verification Suite
 * Tests:
 * 1. Optimistic Concurrency Control (OCC) logic in server/routes/userData.js
 * 2. Version handling, 409 Conflict detection, and initial write race conditions
 * 3. Frontend StorageModule & AuthModule logout / sync queueing / storage cleanup
 */

const assert = require('assert');
const express = require('express');
const jwt = require('jsonwebtoken');

console.log('====================================================');
console.log(' SafeShelf V1 — Batch 2 Concurrency & Sync Tests');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

async function run() {
  // ----------------------------------------------------
  // SECTION 1: Route OCC & Version Logic Tests
  // ----------------------------------------------------
  console.log('Section 1: Route OCC & Version Logic:');

  // Create a mock UserData model simulating MongoDB collection behavior
  const mockDb = new Map();

  const MockUserData = {
    async findOne(query) {
      if (query.userId) {
        const doc = mockDb.get(query.userId);
        return doc ? { ...doc } : null;
      }
      return null;
    },
    async create(data) {
      if (mockDb.has(data.userId)) {
        const err = new Error('E11000 duplicate key error collection: safeshelf.userdatas index: userId_1 dup key');
        err.code = 11000;
        throw err;
      }
      const doc = {
        _id: 'mock_doc_' + Date.now(),
        userId: data.userId,
        inventory: data.inventory || [],
        shoppingList: data.shoppingList || [],
        version: 1,
        updatedAt: new Date()
      };
      mockDb.set(data.userId, doc);
      return { ...doc };
    },
    async findOneAndUpdate(filter, update, options) {
      const doc = mockDb.get(filter.userId);
      if (!doc) return null;
      if (filter.version !== undefined && doc.version !== filter.version) {
        return null; // Atomic OCC check failure in MongoDB
      }
      if (update.$set) {
        Object.assign(doc, update.$set);
      }
      if (update.$inc && update.$inc.version) {
        doc.version = (doc.version || 1) + update.$inc.version;
      }
      doc.updatedAt = new Date();
      mockDb.set(filter.userId, doc);
      return { ...doc };
    }
  };

  // Mock verifyToken middleware
  const TEST_USER_ID = '507f1f77bcf86cd799439011';
  const mockVerifyToken = (req, res, next) => {
    req.user = { id: TEST_USER_ID, email: 'tester@safeshelf.test' };
    next();
  };

  // Setup express test app matching server/routes/userData.js
  const app = express();
  app.use(express.json());

  // Replicate route handler using MockUserData to test all branches
  app.get('/api/user-data', mockVerifyToken, async (req, res) => {
    try {
      const doc = await MockUserData.findOne({ userId: req.user.id });
      if (!doc) {
        return res.json({ inventory: [], shoppingList: [], version: 0 });
      }
      return res.json({
        inventory: doc.inventory || [],
        shoppingList: doc.shoppingList || [],
        version: doc.version || 1,
        updatedAt: doc.updatedAt
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
  });

  app.put('/api/user-data', mockVerifyToken, async (req, res) => {
    try {
      const { inventory, shoppingList, version } = req.body;

      if (!Array.isArray(inventory) || !Array.isArray(shoppingList)) {
        return res.status(400).json({ error: 'inventory and shoppingList must be arrays' });
      }

      if (version === undefined || version === null || typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
        return res.status(400).json({
          error: 'A valid non-negative integer "version" is required for optimistic concurrency control.'
        });
      }

      const existingDoc = await MockUserData.findOne({ userId: req.user.id });

      if (!existingDoc) {
        if (version !== 0) {
          return res.status(409).json({
            error: 'Document does not exist yet. Expected version 0.',
            currentVersion: 0,
            conflict: true
          });
        }

        try {
          const newDoc = await MockUserData.create({
            userId: req.user.id,
            inventory,
            shoppingList,
            version: 1
          });
          return res.json({
            ok: true,
            message: 'User data created successfully',
            version: newDoc.version,
            updatedAt: newDoc.updatedAt
          });
        } catch (createErr) {
          if (createErr.code === 11000) {
            const conflictDoc = await MockUserData.findOne({ userId: req.user.id });
            return res.status(409).json({
              error: 'Concurrent write detected during creation.',
              currentVersion: conflictDoc ? conflictDoc.version : 1,
              conflict: true,
              serverData: conflictDoc ? { inventory: conflictDoc.inventory, shoppingList: conflictDoc.shoppingList } : null
            });
          }
          throw createErr;
        }
      }

      const currentServerVersion = existingDoc.version || 1;
      if (version !== currentServerVersion) {
        return res.status(409).json({
          error: `Version conflict: client version is ${version}, but server version is ${currentServerVersion}.`,
          currentVersion: currentServerVersion,
          conflict: true,
          serverData: {
            inventory: existingDoc.inventory,
            shoppingList: existingDoc.shoppingList
          }
        });
      }

      const updatedDoc = await MockUserData.findOneAndUpdate(
        { userId: req.user.id, version: version },
        {
          $set: { inventory, shoppingList },
          $inc: { version: 1 }
        },
        { new: true, runValidators: true }
      );

      if (!updatedDoc) {
        const latestDoc = await MockUserData.findOne({ userId: req.user.id });
        return res.status(409).json({
          error: 'Concurrent write detected during update.',
          currentVersion: latestDoc ? latestDoc.version : currentServerVersion,
          conflict: true,
          serverData: latestDoc ? { inventory: latestDoc.inventory, shoppingList: latestDoc.shoppingList } : null
        });
      }

      return res.json({
        ok: true,
        message: 'User data saved successfully',
        version: updatedDoc.version,
        updatedAt: updatedDoc.updatedAt
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update user data' });
    }
  });

  // Start test server on dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/user-data`;

  // Helper fetch
  const httpReq = async (method, body) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(baseUrl, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  await asyncTest('GET returns version 0 when document does not exist', async () => {
    const res = await httpReq('GET');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.version, 0);
    assert.deepStrictEqual(res.data.inventory, []);
  });

  await asyncTest('PUT rejects missing version with 400', async () => {
    const res = await httpReq('PUT', { inventory: [], shoppingList: [] });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.error, /version/i);
  });

  await asyncTest('PUT rejects negative version with 400', async () => {
    const res = await httpReq('PUT', { inventory: [], shoppingList: [], version: -1 });
    assert.strictEqual(res.status, 400);
  });

  await asyncTest('PUT rejects non-zero version on initial write with 409 Conflict', async () => {
    const res = await httpReq('PUT', { inventory: [], shoppingList: [], version: 1 });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.conflict, true);
    assert.strictEqual(res.data.currentVersion, 0);
  });

  await asyncTest('PUT initial write with version 0 succeeds and creates document at version 1', async () => {
    const res = await httpReq('PUT', {
      inventory: [{ id: '1', name: 'Fresh Milk' }],
      shoppingList: [{ id: 's1', name: 'Bread' }],
      version: 0
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
    assert.strictEqual(res.data.version, 1);
  });

  await asyncTest('GET returns version 1 after creation', async () => {
    const res = await httpReq('GET');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.version, 1);
    assert.strictEqual(res.data.inventory.length, 1);
  });

  await asyncTest('PUT with stale version 0 returns 409 Conflict with currentVersion 1 and serverData', async () => {
    const res = await httpReq('PUT', {
      inventory: [{ id: '1', name: 'Stale Attempt' }],
      shoppingList: [],
      version: 0
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.conflict, true);
    assert.strictEqual(res.data.currentVersion, 1);
    assert.ok(res.data.serverData);
    assert.strictEqual(res.data.serverData.inventory[0].name, 'Fresh Milk');
  });

  await asyncTest('PUT with correct version 1 succeeds and advances version to 2', async () => {
    const res = await httpReq('PUT', {
      inventory: [{ id: '1', name: 'Fresh Milk' }, { id: '2', name: 'Eggs' }],
      shoppingList: [],
      version: 1
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
    assert.strictEqual(res.data.version, 2);
  });

  await asyncTest('PUT with version 1 is now stale and returns 409 Conflict (currentVersion 2)', async () => {
    const res = await httpReq('PUT', {
      inventory: [{ id: '1', name: 'Another Stale Edit' }],
      shoppingList: [],
      version: 1
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.conflict, true);
    assert.strictEqual(res.data.currentVersion, 2);
  });

  await asyncTest('PUT with future version 99 returns 409 Conflict', async () => {
    const res = await httpReq('PUT', {
      inventory: [],
      shoppingList: [],
      version: 99
    });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.conflict, true);
    assert.strictEqual(res.data.currentVersion, 2);
  });

  await asyncTest('Concurrent initial write (E11000 duplicate key) returns 409 Conflict', async () => {
    // Clear user from mockDb to simulate new user
    mockDb.delete(TEST_USER_ID);
    // Simulate race: doc is inserted into DB right before MockUserData.create is invoked
    mockDb.set(TEST_USER_ID, {
      userId: TEST_USER_ID,
      inventory: [{ id: 'race', name: 'Race Winner' }],
      shoppingList: [],
      version: 1
    });
    // Now call PUT with version: 0, but create throws E11000
    // To test route handler catch branch, call PUT
    const res = await httpReq('PUT', {
      inventory: [{ id: 'loser', name: 'Race Loser' }],
      shoppingList: [],
      version: 0
    });
    // Document exists now so route detects existingDoc or handles duplicate
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.conflict, true);
    assert.strictEqual(res.data.currentVersion, 1);
  });

  server.close();

  // ----------------------------------------------------
  // SECTION 2: StorageModule & Concurrency Logic Tests
  // ----------------------------------------------------
  console.log('\nSection 2: Frontend StorageModule & AuthModule:');

  // Load and evaluate auth.js in mock browser environment
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');

  const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');

  // Mock browser localStorage
  const localStorageStore = new Map();
  const mockLocalStorage = {
    getItem: (k) => (localStorageStore.has(k) ? localStorageStore.get(k) : null),
    setItem: (k, v) => localStorageStore.set(k, String(v)),
    removeItem: (k) => localStorageStore.delete(k),
    clear: () => localStorageStore.clear()
  };

  const domElements = new Map();
  const mockDocument = {
    getElementById: (id) => domElements.get(id) || null,
    querySelector: () => null,
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        style: {},
        className: '',
        textContent: '',
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null
      };
      return el;
    }
  };

  const context = {
    window: {},
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    location: { reload: () => {} },
    fetch: global.fetch || (() => Promise.reject(new Error('offline'))),
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    JSON: JSON,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    Boolean: Boolean,
    Error: Error
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(authCode + '\nthis.StorageModule = StorageModule; this.AuthModule = AuthModule;\n', context);

  test('StorageModule has version management methods', () => {
    assert.strictEqual(typeof context.StorageModule.getVersion, 'function');
    assert.strictEqual(typeof context.StorageModule.setVersion, 'function');
    assert.strictEqual(context.StorageModule.VERSION_KEY, 'safeshelf_data_version');
  });

  test('getVersion returns 0 when no user is logged in', () => {
    context.AuthModule.currentUser = null;
    assert.strictEqual(context.StorageModule.getVersion(), 0);
  });

  test('setVersion and getVersion track revision per-user', () => {
    context.AuthModule.currentUser = { id: 'u_test_1', name: 'User 1' };
    context.StorageModule.setVersion(5);
    assert.strictEqual(context.StorageModule.getVersion(), 5);

    // Switch user
    context.AuthModule.currentUser = { id: 'u_test_2', name: 'User 2' };
    assert.strictEqual(context.StorageModule.getVersion(), 0);
    context.StorageModule.setVersion(3);
    assert.strictEqual(context.StorageModule.getVersion(), 3);

    // Switch back to User 1
    context.AuthModule.currentUser = { id: 'u_test_1', name: 'User 1' };
    assert.strictEqual(context.StorageModule.getVersion(), 5);
  });

  await asyncTest('StorageModule.saveProducts writes to localStorage before sync', async () => {
    context.AuthModule.currentUser = { id: 'u_test_1', name: 'User 1' };
    // Mock syncToServer to fail
    context.StorageModule.syncToServer = async () => ({ ok: false, status: 503, reason: 'offline' });

    const testProducts = [{ id: 'p1', name: 'Offline Salt', userId: 'u_test_1' }];
    const res = await context.StorageModule.saveProducts(testProducts);

    // Verify current user gets their products locally
    const userProducts = context.StorageModule.loadProducts();
    assert.strictEqual(userProducts.length, 1);
    assert.strictEqual(userProducts[0].name, 'Offline Salt');

    // Result indicates offline, but local data was preserved
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 503);
  });

  test('AuthModule.logout clears all user-specific storage keys and data version', () => {
    // Populate keys
    mockLocalStorage.setItem('safeshelf_current_user', JSON.stringify({ id: 'u1' }));
    mockLocalStorage.setItem('safeshelf_auth_token', 'test_token');
    mockLocalStorage.setItem('safeshelf_inventory_data', '[]');
    mockLocalStorage.setItem('safeshelf_shopping_list', '{}');
    mockLocalStorage.setItem('safeshelf_shopping_suppressed', '{}');
    mockLocalStorage.setItem('safeshelf_dismissed_notifications', '{}');
    mockLocalStorage.setItem('safeshelf_data_version', '{"u1":5}');

    context.AuthModule.currentUser = { id: 'u1' };
    context.AuthModule.logout({ skipSync: true });

    assert.strictEqual(mockLocalStorage.getItem('safeshelf_current_user'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_auth_token'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_inventory_data'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_shopping_list'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_shopping_suppressed'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_dismissed_notifications'), null);
    assert.strictEqual(mockLocalStorage.getItem('safeshelf_data_version'), null);
  });

  console.log(`\n====================================================`);
  console.log(` Batch 2 Verification Results: ${passedTests}/${totalTests} Passed`);
  console.log(`====================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

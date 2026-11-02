const assert = require('assert');
const http = require('http');
const { app } = require('../server');

async function testDatabaseResilience() {
  console.log('====================================================');
  console.log('🛡️ TESTING DATABASE OFFLINE FALLBACK & RESILIENCE');
  console.log('====================================================\n');

  // Start app on an ephemeral port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const results = [];
  function record(name, pass, detail = '') {
    results.push({ name, pass, detail });
    console.log(`[${pass ? '✔ PASS' : '✖ FAIL'}] ${name} ${detail ? '— ' + detail : ''}`);
  }

  try {
    // 1. Simulate MongoDB being offline
    app.locals.mongoReady = false;

    // A. Health check reports offline
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    record('Health endpoint reports database offline', healthData.database === 'offline', `db=${healthData.database}`);

    // B. Products API serves local dataset fallback
    const prodRes = await fetch(`${baseUrl}/api/products`);
    const prodData = await prodRes.json();
    record('Products catalog serves local dataset when Mongo is offline', prodRes.status === 200 && prodData.products?.length >= 112, `count=${prodData.count}`);

    // C. Categories API serves local categories fallback
    const catRes = await fetch(`${baseUrl}/api/products/categories`);
    const catData = await catRes.json();
    record('Categories API serves local categories fallback when Mongo is offline', catRes.status === 200 && catData.length >= 10, `categories=${catData.length}`);

    // D. Auth register returns 503 Service Unavailable with friendly message
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Offline Test', email: 'offline@test.com', password: 'password123' })
    });
    const regData = await regRes.json();
    record('Register returns 503 when MongoDB is offline', regRes.status === 503 && regData.error.includes('MongoDB is disconnected'), `status=${regRes.status}`);

    // E. Auth login returns 503 Service Unavailable
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'offline@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    record('Login returns 503 when MongoDB is offline', loginRes.status === 503 && loginData.error.includes('MongoDB is disconnected'), `status=${loginRes.status}`);

    // F. User Data returns 503 without silent failure
    const jwt = require('jsonwebtoken');
    const validSubToken = jwt.sign({ sub: '507f1f77bcf86cd799439011', email: 'offline@test.com' }, process.env.JWT_SECRET || 'generate-a-unique-random-secret-at-least-32-characters', { algorithm: 'HS256' });
    const userDataRes = await fetch(`${baseUrl}/api/user-data`, {
      headers: { Authorization: `Bearer ${validSubToken}` }
    });
    const userData = await userDataRes.json();
    record('Cloud data returns 503 without claiming save succeeded', userDataRes.status === 503 && userData.error.includes('MongoDB is disconnected'), `status=${userDataRes.status}`);

    // 2. Simulate MongoDB recovery
    app.locals.mongoReady = true;
    const recoveredHealth = await fetch(`${baseUrl}/api/health`);
    const recData = await recoveredHealth.json();
    record('Health endpoint reports database connected after recovery', recData.database === 'connected', `db=${recData.database}`);

  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  console.log('\n====================================================');
  console.log('📊 DATABASE RESILIENCE SUMMARY:');
  console.log('====================================================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  testDatabaseResilience().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = testDatabaseResilience;

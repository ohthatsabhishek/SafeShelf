const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

async function runApiSecurityTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND & API TEST SUITE');
  console.log('====================================================\n');

  const results = [];
  const testId = Date.now().toString(36);
  const userAEmail = `qa_usera_${testId}@safeshelf.test`;
  const userBEmail = `qa_userb_${testId}@safeshelf.test`;
  const password = 'TestPassword123!';

  let tokenA = '';
  let userAId = '';
  let tokenB = '';
  let userBId = '';

  function logTest(name, passed, details = '') {
    results.push({ name, passed, details });
    const mark = passed ? '✔ PASS' : '✖ FAIL';
    console.log(`[${mark}] ${name} ${details ? '— ' + details : ''}`);
  }

  // 1. Health Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'ok' && data.database === 'connected' && data.authentication === 'configured';
    logTest('API Health Endpoint (/api/health)', passed, `status=${res.status}, db=${data.database}`);
  } catch (e) {
    logTest('API Health Endpoint (/api/health)', false, e.message);
  }

  // 2. Security Headers (Helmet)
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const xContentType = res.headers.get('x-content-type-options');
    const xFrameOptions = res.headers.get('x-frame-options');
    const csp = res.headers.get('content-security-policy');
    const xPoweredBy = res.headers.get('x-powered-by');
    const passed = xContentType === 'nosniff' && (!xPoweredBy) && (xFrameOptions === 'SAMEORIGIN' || csp?.includes("frame-ancestors 'self'"));
    logTest('Security Headers (Helmet, nosniff, no x-powered-by)', passed, `nosniff=${xContentType}, x-powered-by=${xPoweredBy}`);
  } catch (e) {
    logTest('Security Headers', false, e.message);
  }

  // 3. Products Catalog & Categories
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.products) && data.count >= 112;
    logTest('Products Catalog API (/api/products)', passed, `returned ${data.count} products`);
  } catch (e) {
    logTest('Products Catalog API', false, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/products?q=honey`);
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.products) && data.products.some(p => p.name.toLowerCase().includes('honey'));
    logTest('Products Search Filter (/api/products?q=honey)', passed, `found ${data.count} items`);
  } catch (e) {
    logTest('Products Search Filter', false, e.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/products/categories`);
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data) && data.length > 0 && data.every(c => c.name && typeof c.count === 'number');
    logTest('Products Categories API (/api/products/categories)', passed, `found ${data.length} categories`);
  } catch (e) {
    logTest('Products Categories API', false, e.message);
  }

  // 4. Auth Validation: Register User A
  try {
    const badReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'invalid-email', password: '123' })
    });
    const passed = badReg.status === 400;
    logTest('Auth Register Validation (Reject invalid name/email/short password)', passed, `status=${badReg.status}`);
  } catch (e) {
    logTest('Auth Register Validation', false, e.message);
  }

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha', email: userAEmail, password })
    });
    const regData = await regRes.json();
    const passed = regRes.status === 201 && regData.token && regData.user?.email === userAEmail;
    tokenA = regData.token;
    userAId = regData.user?.id;
    logTest('Auth Register Success (User A)', passed, `userAId=${userAId}`);
  } catch (e) {
    logTest('Auth Register Success (User A)', false, e.message);
  }

  try {
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha Duplicate', email: userAEmail, password })
    });
    const passed = dupRes.status === 409;
    logTest('Auth Register Duplicate Email Rejection (409 Conflict)', passed, `status=${dupRes.status}`);
  } catch (e) {
    logTest('Auth Register Duplicate Email', false, e.message);
  }

  // 5. Auth Login
  try {
    const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'WrongPassword!' })
    });
    const passed = badLogin.status === 401;
    logTest('Auth Login Rejection (Wrong password -> 401)', passed, `status=${badLogin.status}`);
  } catch (e) {
    logTest('Auth Login Rejection', false, e.message);
  }

  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password })
    });
    const data = await loginRes.json();
    const passed = loginRes.status === 200 && data.token && data.user?.id === userAId;
    tokenA = data.token; // Refresh token
    logTest('Auth Login Success (User A)', passed, `status=${loginRes.status}`);
  } catch (e) {
    logTest('Auth Login Success (User A)', false, e.message);
  }

  // Register User B for multi-tenancy testing
  try {
    const regB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Beta', email: userBEmail, password })
    });
    const dataB = await regB.json();
    tokenB = dataB.token;
    userBId = dataB.user?.id;
    logTest('Auth Register User B (for account isolation tests)', regB.status === 201, `userBId=${userBId}`);
  } catch (e) {
    logTest('Auth Register User B', false, e.message);
  }

  // 6. User Profile Update
  try {
    const profRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'User Alpha Updated', email: userAEmail })
    });
    const data = await profRes.json();
    const passed = profRes.status === 200 && data.user?.name === 'User Alpha Updated';
    logTest('Profile Update (/api/auth/profile)', passed, `name=${data.user?.name}`);
  } catch (e) {
    logTest('Profile Update', false, e.message);
  }

  try {
    // Attempt to update User B's profile to User A's email (should fail with 409)
    const dupProf = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'User Beta', email: userAEmail })
    });
    const passed = dupProf.status === 409;
    logTest('Profile Update Duplicate Email Rejection (409)', passed, `status=${dupProf.status}`);
  } catch (e) {
    logTest('Profile Update Duplicate Email', false, e.message);
  }

  // 7. Multi-Tenant User Data Isolation & Persistence (PHASE 4 & 5)
  const testInventoryA = [
    { id: 'item_a_1', name: 'User A Secret Item', quantity: '3 kg', category: 'Food Grains', expiryDate: '2026-12-01' }
  ];
  const testShoppingA = [
    { id: 'shop_a_1', name: 'User A Shopping Item', quantity: '1 unit', category: 'Condiments', purchased: false }
  ];

  try {
    const putRes = await fetch(`${BASE_URL}/api/user-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ inventory: testInventoryA, shoppingList: testShoppingA, version: 0 })
    });
    const putData = await putRes.json();
    const passed = putRes.status === 200 && putData.ok === true && putData.version === 1;
    logTest('Save User A Cloud Data Initial Write (/api/user-data PUT version=0 -> 1)', passed, `status=${putRes.status}, version=${putData.version}`);
  } catch (e) {
    logTest('Save User A Cloud Data', false, e.message);
  }

  try {
    // OCC Conflict check: Sending stale version 0 must return 409 Conflict
    const conflictRes = await fetch(`${BASE_URL}/api/user-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ inventory: testInventoryA, shoppingList: testShoppingA, version: 0 })
    });
    const conflictData = await conflictRes.json();
    const passed = conflictRes.status === 409 && conflictData.currentVersion === 1;
    logTest('Optimistic Concurrency Control Rejects Stale Version (409 Conflict)', passed, `status=${conflictRes.status}, currentVersion=${conflictData.currentVersion}`);
  } catch (e) {
    logTest('Optimistic Concurrency Control Rejects Stale Version', false, e.message);
  }

  try {
    // Missing version check: Sending update without version must return 400 Bad Request
    const noVerRes = await fetch(`${BASE_URL}/api/user-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ inventory: testInventoryA, shoppingList: testShoppingA })
    });
    const passed = noVerRes.status === 400;
    logTest('User Data Update Rejects Missing Version (400 Bad Request)', passed, `status=${noVerRes.status}`);
  } catch (e) {
    logTest('User Data Update Rejects Missing Version', false, e.message);
  }

  try {
    // Verify User A gets their own saved data
    const getResA = await fetch(`${BASE_URL}/api/user-data`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataA = await getResA.json();
    const passed = getResA.status === 200 && dataA.inventory?.length === 1 && dataA.inventory[0].name === 'User A Secret Item';
    logTest('Retrieve User A Cloud Data (/api/user-data GET)', passed, `items=${dataA.inventory?.length}`);
  } catch (e) {
    logTest('Retrieve User A Cloud Data', false, e.message);
  }

  try {
    // Multi-tenant check: User B requests their own data -> MUST NOT see User A's data
    const getResB = await fetch(`${BASE_URL}/api/user-data`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dataB = await getResB.json();
    const passed = getResB.status === 200 && (!dataB.inventory || dataB.inventory.length === 0);
    logTest('Account Isolation: User B Cannot Read User A Data', passed, `User B items count=${dataB.inventory?.length || 0}`);
  } catch (e) {
    logTest('Account Isolation: Read Isolation', false, e.message);
  }

  try {
    // Unauthorized access: Request without token -> 401
    const noAuthRes = await fetch(`${BASE_URL}/api/user-data`);
    const passed = noAuthRes.status === 401;
    logTest('Protected Endpoint Rejects Unauthenticated Request (401)', passed, `status=${noAuthRes.status}`);
  } catch (e) {
    logTest('Protected Endpoint Rejects Unauthenticated Request', false, e.message);
  }

  // 8. Image Uploads Validation & Security
  try {
    // Fails without token
    const noAuthUpload = await fetch(`${BASE_URL}/api/uploads/image`, { method: 'POST' });
    const passed = noAuthUpload.status === 401;
    logTest('Image Upload Rejection Without Auth (401)', passed, `status=${noAuthUpload.status}`);
  } catch (e) {
    logTest('Image Upload Rejection Without Auth', false, e.message);
  }

  try {
    // Fails with fake file / wrong magic bytes (text masquerading as png)
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    const fakeContent = 'This is a plain text script, not a png image.';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="fake.png"\r\nContent-Type: image/png\r\n\r\n`),
      Buffer.from(fakeContent),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const fakeRes = await fetch(`${BASE_URL}/api/uploads/image`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const passed = fakeRes.status === 400;
    logTest('Image Upload Rejects Spoofed Magic Bytes (400 Bad Request)', passed, `status=${fakeRes.status}`);
  } catch (e) {
    logTest('Image Upload Rejects Spoofed Magic Bytes', false, e.message);
  }

  try {
    // Valid PNG upload
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    const validPngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="valid.png"\r\nContent-Type: image/png\r\n\r\n`),
      validPngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${BASE_URL}/api/uploads/image`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const uploadData = await uploadRes.json();
    const passed = uploadRes.status === 201 && uploadData.url && uploadData.url.startsWith('/uploads/');
    logTest('Image Upload Valid PNG with Correct Signature (201 Created)', passed, `url=${uploadData.url}`);
  } catch (e) {
    logTest('Image Upload Valid PNG', false, e.message);
  }

  // 9. Shopping List CSV Import Preview & Error Handling
  try {
    // Reject non-csv file extension / mime type
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    const textContent = 'Not a CSV file';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from(textContent),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const txtRes = await fetch(`${BASE_URL}/api/shopping-import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const passed = txtRes.status === 400;
    logTest('CSV Import Rejects Non-CSV File (Expected 400 Bad Request, NOT 500)', passed, `status=${txtRes.status}`);
  } catch (e) {
    logTest('CSV Import Rejects Non-CSV File', false, e.message);
  }

  try {
    // Valid CSV import
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    const csvContent = 'itemName,quantity,category\nAlmond Milk,2 cartons,Dairy\nRolled Oats,1 bag,Food Grains\n';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="groceries.csv"\r\nContent-Type: text/csv\r\n\r\n`),
      Buffer.from(csvContent),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const csvRes = await fetch(`${BASE_URL}/api/shopping-import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const csvData = await csvRes.json();
    const passed = csvRes.status === 200 && csvData.items?.length === 2 && csvData.items[0].name === 'Almond Milk';
    logTest('CSV Import Valid File Preview (/api/shopping-import/preview)', passed, `parsed items=${csvData.items?.length}`);
  } catch (e) {
    logTest('CSV Import Valid File Preview', false, e.message);
  }

  try {
    // Unclosed quoted field CSV
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    const brokenCsv = 'itemName,quantity,category\n"Unclosed item,1,Dairy\n';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="broken.csv"\r\nContent-Type: text/csv\r\n\r\n`),
      Buffer.from(brokenCsv),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const brokenRes = await fetch(`${BASE_URL}/api/shopping-import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const passed = brokenRes.status === 400;
    logTest('CSV Import Rejects Malformed Unclosed Quotes (400 Bad Request)', passed, `status=${brokenRes.status}`);
  } catch (e) {
    logTest('CSV Import Rejects Malformed Unclosed Quotes', false, e.message);
  }

  // 10. Malformed JSON Body Error Handling (No stack traces exposed)
  try {
    const rawRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json }'
    });
    const passed = rawRes.status === 400;
    const bodyText = await rawRes.text();
    const noStackTrace = !bodyText.includes('    at ') && !bodyText.includes('node_modules');
    logTest('Malformed JSON Handled as 400 Without Stack Trace Leakage', passed && noStackTrace, `status=${rawRes.status}`);
  } catch (e) {
    logTest('Malformed JSON Handling', false, e.message);
  }

  // 11. Token Integrity & Forgery Protection
  try {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmb3JnZWR1c2VyMTIzIiwiZW1haWwiOiJhdHRhY2tlckB0ZXN0LmNvbSJ9.invalidsignature';
    const fakeRes = await fetch(`${BASE_URL}/api/user-data`, {
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    const passed = fakeRes.status === 401;
    logTest('Invalid / Forged JWT Signature Rejection (401)', passed, `status=${fakeRes.status}`);
  } catch (e) {
    logTest('Invalid / Forged JWT', false, e.message);
  }

  // 12. Non-ObjectId Token Subject Protection
  try {
    // Generate valid signature using known secret but with non-ObjectId sub
    const jwt = require('jsonwebtoken');
    const tokenNonObjId = jwt.sign({ sub: 'non_object_id_user_123', email: 'test@safeshelf.test' }, process.env.JWT_SECRET || 'generate-a-unique-random-secret-at-least-32-characters', { algorithm: 'HS256' });
    const resNonObj = await fetch(`${BASE_URL}/api/user-data`, {
      headers: { Authorization: `Bearer ${tokenNonObjId}` }
    });
    const passed = resNonObj.status === 401;
    logTest('JWT With Non-ObjectId Subject Rejected Cleanly (401)', passed, `status=${resNonObj.status}`);
  } catch (e) {
    logTest('Non-ObjectId Subject Rejection', false, e.message);
  }

  // 13. CSV 500 Row Limit Rejection (413 Payload Too Large)
  try {
    const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
    let bigCsv = 'itemName,quantity,category\n';
    for (let i = 1; i <= 505; i++) {
      bigCsv += `Item ${i},1 unit,Food Grains\n`;
    }
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="oversized.csv"\r\nContent-Type: text/csv\r\n\r\n`),
      Buffer.from(bigCsv),
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const bigRes = await fetch(`${BASE_URL}/api/shopping-import/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${tokenA}`
      },
      body
    });
    const passed = bigRes.status === 413;
    logTest('CSV Import Rejects Files Exceeding 500 Rows (413 Payload Too Large)', passed, `status=${bigRes.status}`);
  } catch (e) {
    logTest('CSV Import Rejects Files Exceeding 500 Rows', false, e.message);
  }

  console.log('\n====================================================');
  console.log('📊 BACKEND TEST SUITE SUMMARY:');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);

  return { total: results.length, passed: passedCount, failed: failedCount, results };
}

if (require.main === module) {
  runApiSecurityTests().then(summary => {
    if (summary.failed > 0) process.exitCode = 1;
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = runApiSecurityTests;

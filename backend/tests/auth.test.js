import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function parseCookie(response, cookieName) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

async function runAuthTests() {
  console.log('\n======================================================');
  console.log('FixLoop Phase 2: Authentication & Authorization Tests');
  console.log('======================================================\n');

  // Connect to live database
  await connectDatabase();

  // Start server on an ephemeral free port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Running on ephemeral port: ${port}`);

  const testTimestamp = Date.now();
  const testStudentEmail = `test.student.${testTimestamp}@campus.edu`;
  const testStudentPassword = 'StudentPass123!';
  let studentAccessToken = '';
  let studentRefreshToken = '';
  let studentId = '';

  const testTechEmail = `test.tech.${testTimestamp}@campus.edu`;
  const testTechPassword = 'TechPassword123!';
  let techAccessToken = '';

  const testAdminEmail = `test.admin.${testTimestamp}@campus.edu`;
  const testAdminPassword = 'AdminPassword123!';
  let adminAccessToken = '';

  try {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Student Registration ---');

    // Test 1.1: Successful Registration
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: testStudentEmail,
        password: testStudentPassword
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Student registration returns 201 Created');
    assert(regData.success === true, 'Response contains success: true');
    assert(regData.data.user.role === ROLES.STUDENT, 'Registered user has STUDENT role');
    assert(regData.data.token && typeof regData.data.token === 'string', 'Access token is returned');
    assert(regData.data.user.passwordHash === undefined, 'passwordHash is NOT exposed in registration response');

    studentAccessToken = regData.data.token;
    studentId = regData.data.user._id;
    studentRefreshToken = parseCookie(regRes, 'refreshToken');
    assert(studentRefreshToken !== null, 'Secure HttpOnly refreshToken cookie is set on registration');

    // Test 1.2: Duplicate Email Registration
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: testStudentEmail,
        password: testStudentPassword
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict');
    assert(dupData.success === false, 'Duplicate registration response contains success: false');

    // Test 1.3: Registration with Short Password (<8 chars)
    const shortPwRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pw Student',
        email: `shortpw.${testTimestamp}@campus.edu`,
        password: 'short'
      })
    });
    assert(shortPwRes.status === 400, 'Registration with password <8 characters returns 400 Bad Request');

    // Test 1.4: Privilege Escalation Attempt via Registration
    const escalateRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Attempt',
        email: `escalate.${testTimestamp}@campus.edu`,
        password: 'SecurePass123!',
        role: 'ADMIN' // Trying to register as ADMIN
      })
    });
    const escalateData = await escalateRes.json();
    assert(escalateRes.status === 201, 'Registration succeeded');
    assert(escalateData.data.user.role === ROLES.STUDENT, 'Public registration strictly forces STUDENT role (ignoring ADMIN payload)');

    // -------------------------------------------------------------------------
    // 2. LOGIN TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Authentication & Login ---');

    // Create a technician and an admin account for testing
    const { authService } = await import('../src/services/auth.service.js');
    const bcrypt = (await import('bcryptjs')).default;
    const techHash = await bcrypt.hash(testTechPassword, 12);
    await User.create({
      name: 'Test Technician',
      email: testTechEmail,
      passwordHash: techHash,
      role: ROLES.TECHNICIAN,
      isActive: true
    });

    const adminHash = await bcrypt.hash(testAdminPassword, 12);
    await User.create({
      name: 'Test Administrator',
      email: testAdminEmail,
      passwordHash: adminHash,
      role: ROLES.ADMIN,
      isActive: true
    });

    // Test 2.1: Student Login Success
    const loginStudentRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: testStudentPassword
      })
    });
    const loginStudentData = await loginStudentRes.json();
    assert(loginStudentRes.status === 200, 'Student login returns 200 OK');
    assert(loginStudentData.data.user.role === ROLES.STUDENT, 'Logged in student profile has STUDENT role');
    assert(loginStudentData.data.user.passwordHash === undefined, 'passwordHash is NOT exposed in login response');

    // Test 2.2: Technician Login Success
    const loginTechRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testTechEmail,
        password: testTechPassword
      })
    });
    const loginTechData = await loginTechRes.json();
    assert(loginTechRes.status === 200, 'Technician login returns 200 OK');
    assert(loginTechData.data.user.role === ROLES.TECHNICIAN, 'Technician profile has TECHNICIAN role');
    techAccessToken = loginTechData.data.token;

    // Test 2.3: Admin Login Success
    const loginAdminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAdminEmail,
        password: testAdminPassword
      })
    });
    const loginAdminData = await loginAdminRes.json();
    assert(loginAdminRes.status === 200, 'Admin login returns 200 OK');
    assert(loginAdminData.data.user.role === ROLES.ADMIN, 'Admin profile has ADMIN role');
    adminAccessToken = loginAdminData.data.token;

    // Test 2.4: Login with Wrong Password
    const wrongPwRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'WrongPassword999!'
      })
    });
    assert(wrongPwRes.status === 401, 'Login with incorrect password returns 401 Unauthorized');

    // Test 2.5: Login with Non-Existent Email
    const noEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does.not.exist@campus.edu',
        password: 'AnyPassword123!'
      })
    });
    assert(noEmailRes.status === 401, 'Login with non-existent email returns 401 Unauthorized');

    // Test 2.6: Inactive Account Login Rejection
    const inactiveEmail = `inactive.${testTimestamp}@campus.edu`;
    const inactiveHash = await bcrypt.hash('InactivePass123!', 12);
    await User.create({
      name: 'Deactivated User',
      email: inactiveEmail,
      passwordHash: inactiveHash,
      role: ROLES.STUDENT,
      isActive: false // Deactivated
    });
    const inactiveLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveEmail,
        password: 'InactivePass123!'
      })
    });
    assert(inactiveLoginRes.status === 401, 'Deactivated account is rejected with 401 Unauthorized');

    // -------------------------------------------------------------------------
    // 3. TOKEN VALIDATION & GET /api/auth/me
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Authentication Middleware & GET /api/auth/me ---');

    // Test 3.1: Valid token access
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${studentAccessToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 with valid access token');
    assert(meData.data.user._id === studentId, 'Current user profile matches authenticated user');
    assert(meData.data.user.passwordHash === undefined, 'passwordHash is NOT exposed in /me');

    // Test 3.2: Missing token
    const noTokenRes = await fetch(`${baseUrl}/auth/me`);
    assert(noTokenRes.status === 401, 'GET /api/auth/me returns 401 when Authorization header is missing');

    // Test 3.3: Invalid/Forged token
    const invalidTokenRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.payload' }
    });
    assert(invalidTokenRes.status === 401, 'GET /api/auth/me returns 401 with forged token');

    // Test 3.4: Expired token
    const expiredToken = jwt.sign(
      { sub: studentId, email: testStudentEmail, role: ROLES.STUDENT },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );
    const expiredRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(expiredRes.status === 401, 'GET /api/auth/me returns 401 with expired access token');

    // -------------------------------------------------------------------------
    // 4. REFRESH TOKEN ROTATION & REVOCATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Refresh Token Rotation & Revocation ---');

    // Test 4.1: Successful token rotation
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${studentRefreshToken}`
      }
    });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200, 'POST /api/auth/refresh returns 200 OK');
    assert(refreshData.data.token !== studentAccessToken, 'New access token is issued');
    const rotatedRefreshToken = parseCookie(refreshRes, 'refreshToken');
    assert(rotatedRefreshToken !== null && rotatedRefreshToken !== studentRefreshToken, 'New refresh token is rotated and set via cookie');

    // Test 4.2: Token Reuse Detection (Re-using old refresh token)
    const reuseRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${studentRefreshToken}` // Reusing already rotated token
      }
    });
    assert(reuseRes.status === 401, 'Re-using a rotated refresh token is detected and rejected with 401');

    // -------------------------------------------------------------------------
    // 5. LOGOUT TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Logout ---');

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${rotatedRefreshToken}`
      }
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');

    // Check that revoked refresh token cannot be refreshed anymore
    const postLogoutRefresh = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${rotatedRefreshToken}`
      }
    });
    assert(postLogoutRefresh.status === 401, 'Revoked refresh token after logout is rejected with 401');

    // -------------------------------------------------------------------------
    // 6. ROLE-BASED AUTHORIZATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Role-Based Authorization (/api/admin/overview) ---');

    // Test 6.1: Student accessing Admin endpoint -> 403 Forbidden
    const studentToAdmin = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${studentAccessToken}` }
    });
    assert(studentToAdmin.status === 403, 'STUDENT access to /api/admin is rejected with 403 Forbidden');

    // Test 6.2: Technician accessing Admin endpoint -> 403 Forbidden
    const techToAdmin = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${techAccessToken}` }
    });
    assert(techToAdmin.status === 403, 'TECHNICIAN access to /api/admin is rejected with 403 Forbidden');

    // Test 6.3: Admin accessing Admin endpoint -> Authorized (Controller scaffold returns 501 or data, but passes 403 auth check)
    const adminToAdmin = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    assert(adminToAdmin.status !== 401 && adminToAdmin.status !== 403, 'ADMIN access to /api/admin passes authorization');

    // Clean up test documents created during testing
    await User.deleteMany({
      email: {
        $in: [
          testStudentEmail,
          `escalate.${testTimestamp}@campus.edu`,
          testTechEmail,
          testAdminEmail,
          inactiveEmail
        ]
      }
    });
    console.log('\n[Cleanup] Test accounts cleaned up from MongoDB Atlas.');
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDatabase();
  }

  console.log('\n======================================================');
  console.log(`Phase 2 Auth Test Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('[Fatal Test Error]:', err);
  process.exit(1);
});


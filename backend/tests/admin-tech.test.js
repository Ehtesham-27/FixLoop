import http from 'http';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { AuditLog, AUDIT_ACTIONS } from '../src/models/AuditLog.js';
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

async function runAdminTechTests() {
  console.log('\n================================================================');
  console.log('FixLoop: Admin Technician Account Creation & Authorization Tests');
  console.log('================================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Ephemeral port: ${port}`);

  const timestamp = Date.now();
  const adminEmail = `admin.techtest.${timestamp}@campus.edu`;
  const adminPassword = 'AdminPassword123!';

  const studentEmail = `student.techtest.${timestamp}@campus.edu`;
  const studentPassword = 'StudentPassword123!';

  const existingTechEmail = `existingtech.${timestamp}@campus.edu`;
  const existingTechPassword = 'TechPassword123!';

  const newTechName = 'Carlos Mendez';
  const newTechEmail = `carlos.mendez.${timestamp}@campus.edu`;
  const newTechPassword = 'TempTechPassword456!';

  let adminToken = '';
  let studentToken = '';
  let existingTechToken = '';
  let createdTechId = '';

  try {
    // Seed initial users for role-based authorization testing
    const pwHash = await bcrypt.hash('InitialPass123!', 12);
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      passwordHash: pwHash,
      role: ROLES.ADMIN,
      isActive: true
    });

    const studentUser = await User.create({
      name: 'Campus Student',
      email: studentEmail,
      passwordHash: pwHash,
      role: ROLES.STUDENT,
      isActive: true
    });

    const existingTechUser = await User.create({
      name: 'Existing Tech',
      email: existingTechEmail,
      passwordHash: pwHash,
      role: ROLES.TECHNICIAN,
      isActive: true
    });

    // Obtain access tokens for each role
    const getTokens = async (email, password) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'InitialPass123!' })
      });
      const data = await res.json();
      return data.data?.token || '';
    };

    adminToken = await getTokens(adminEmail);
    studentToken = await getTokens(studentEmail);
    existingTechToken = await getTokens(existingTechEmail);

    // -------------------------------------------------------------------------
    // 1. ENDPOINT AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Technician Creation Authorization ---');

    // 1.1 Unauthenticated request is rejected
    const unauthRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTechName,
        email: newTechEmail,
        password: newTechPassword
      })
    });
    assert(unauthRes.status === 401, 'Unauthenticated request to POST /api/admin/technicians returns 401 Unauthorized');

    // 1.2 Student cannot create technicians (403 Forbidden)
    const studentRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: newTechName,
        email: newTechEmail,
        password: newTechPassword
      })
    });
    assert(studentRes.status === 403, 'Student cannot create technician accounts (returns 403 Forbidden)');

    // 1.3 Existing technician cannot create technicians (403 Forbidden)
    const techRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${existingTechToken}`
      },
      body: JSON.stringify({
        name: newTechName,
        email: newTechEmail,
        password: newTechPassword
      })
    });
    assert(techRes.status === 403, 'Technicians cannot create technician accounts (returns 403 Forbidden)');

    // -------------------------------------------------------------------------
    // 2. INPUT VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Input Validation ---');

    // 2.1 Name too short (< 2 chars)
    const shortNameRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'A',
        email: newTechEmail,
        password: newTechPassword
      })
    });
    assert(shortNameRes.status === 400, 'Name shorter than 2 characters returns 400 Bad Request');

    // 2.2 Invalid email format
    const invalidEmailRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: newTechName,
        email: 'invalid-email-format',
        password: newTechPassword
      })
    });
    assert(invalidEmailRes.status === 400, 'Invalid email format returns 400 Bad Request');

    // 2.3 Password too short (< 8 chars)
    const shortPwRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: newTechName,
        email: newTechEmail,
        password: 'short'
      })
    });
    assert(shortPwRes.status === 400, 'Password shorter than 8 characters returns 400 Bad Request');

    // -------------------------------------------------------------------------
    // 3. SUCCESSFUL CREATION & ROLE ASSIGNMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Technician Creation & Role Assignment ---');

    // 3.1 Admin successfully creates technician account
    const createRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: newTechName,
        email: newTechEmail,
        password: newTechPassword,
        role: 'ADMIN' // Malicious attempt to escalate role
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Admin creation returns 201 Created');
    assert(createData.success === true, 'Response contains success: true');
    assert(createData.data?.user?.role === ROLES.TECHNICIAN, 'Created user strictly has TECHNICIAN role (ignoring any payload override)');
    assert(createData.data?.user?.name === newTechName, 'Created user name matches input');
    assert(createData.data?.user?.email === newTechEmail.toLowerCase(), 'Created user email matches normalized email');
    assert(createData.data?.user?.isActive === true, 'Technician account is active');
    assert(createData.data?.user?.passwordHash === undefined, 'passwordHash is NOT exposed in API response');
    assert(createData.data?.user?.refreshTokens === undefined, 'refreshTokens are NOT exposed in API response');

    createdTechId = createData.data?.user?._id;

    // -------------------------------------------------------------------------
    // 4. DUPLICATE ACCOUNT PREVENTION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Duplicate Email Prevention ---');

    const dupRes = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Carlos Mendez Clone',
        email: newTechEmail,
        password: newTechPassword
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate technician registration returns 409 Conflict');
    assert(dupData.success === false, 'Duplicate response contains success: false');

    // -------------------------------------------------------------------------
    // 5. AUDIT LOGGING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Audit Logging ---');

    const auditEntry = await AuditLog.findOne({
      action: AUDIT_ACTIONS.TECHNICIAN_CREATED,
      actorId: adminUser._id
    });
    assert(auditEntry !== null, 'AuditLog entry created for technician creation');
    assert(auditEntry?.ticketId === null, 'AuditLog ticketId is null for administrative user creation');
    assert(auditEntry?.newValue?.role === ROLES.TECHNICIAN, 'AuditLog recorded role as TECHNICIAN');
    assert(auditEntry?.newValue?.email === newTechEmail.toLowerCase(), 'AuditLog recorded correct email');
    assert(auditEntry?.newValue?.password === undefined, 'Plaintext password is NEVER saved in audit log');
    assert(auditEntry?.newValue?.passwordHash === undefined, 'Password hash is NEVER saved in audit log');

    // -------------------------------------------------------------------------
    // 6. TECHNICIAN LOGIN & ACCESS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Technician Login & Route Privileges ---');

    // 6.1 Technician can log in with temporary credentials
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newTechEmail,
        password: newTechPassword
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Technician can successfully log in with temporary credentials (200 OK)');
    assert(loginData.data?.user?.role === ROLES.TECHNICIAN, 'Authenticated user profile role is TECHNICIAN');
    assert(typeof loginData.data?.token === 'string', 'Login returns valid access token');

    const techRefreshToken = parseCookie(loginRes, 'refreshToken');
    assert(techRefreshToken !== null, 'Refresh token cookie is set for technician session');

    const newTechAccessToken = loginData.data?.token;

    // 6.2 Technician can access assigned tickets endpoint
    const assignedTicketsRes = await fetch(`${baseUrl}/tickets/assigned`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${newTechAccessToken}` }
    });
    assert(assignedTicketsRes.status === 200, 'Technician can access GET /api/tickets/assigned (200 OK)');

    // 6.3 Technician CANNOT access admin users endpoint (403 Forbidden)
    const adminEndpointRes = await fetch(`${baseUrl}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${newTechAccessToken}` }
    });
    assert(adminEndpointRes.status === 403, 'Technician is forbidden from accessing GET /api/admin/users (403 Forbidden)');

    // 6.4 Technician CANNOT create another technician (403 Forbidden)
    const techCreateAttempt = await fetch(`${baseUrl}/admin/technicians`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newTechAccessToken}`
      },
      body: JSON.stringify({
        name: 'Another Tech',
        email: `another.${timestamp}@campus.edu`,
        password: 'Password123!'
      })
    });
    assert(techCreateAttempt.status === 403, 'Newly created technician cannot access POST /api/admin/technicians (403 Forbidden)');

  } finally {
    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await User.deleteMany({
      email: {
        $in: [adminEmail, studentEmail, existingTechEmail, newTechEmail.toLowerCase()]
      }
    });
    if (adminToken) {
      await AuditLog.deleteMany({ action: AUDIT_ACTIONS.TECHNICIAN_CREATED });
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDatabase();
  }

  console.log('\n======================================');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminTechTests().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});

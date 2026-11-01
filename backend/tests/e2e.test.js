import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';
import { Category } from '../src/models/Category.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { cloudinaryConfigured } from '../src/config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('FixLoop Phase 6: Complete End-to-End Workflow Verification');
  console.log('======================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Running on ephemeral port: ${port}`);

  const testTs = Date.now();
  const createdFilesToClean = [];

  // Setup actors and data
  const studentEmail = `e2e.student.${testTs}@campus.edu`;
  const studentPassword = 'SecurePassword123!';
  const studentName = 'Elena Rostova';

  const techEmail = `e2e.tech.${testTs}@campus.edu`;
  const techPassword = 'TechPassword123!';
  const techName = 'Carlos Mendez';

  const adminEmail = `e2e.admin.${testTs}@campus.edu`;
  const adminPassword = 'AdminPassword123!';
  const adminName = 'Dean Henderson';

  // Seed technician and admin directly with hashed password to test real auth login
  const techPasswordHash = await bcrypt.hash(techPassword, 12);
  const techUser = await User.create({
    name: techName,
    email: techEmail,
    passwordHash: techPasswordHash,
    role: ROLES.TECHNICIAN,
    isActive: true
  });

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await User.create({
    name: adminName,
    email: adminEmail,
    passwordHash: adminPasswordHash,
    role: ROLES.ADMIN,
    isActive: true
  });

  // Active Category
  let category = await Category.findOne({ isActive: true });
  if (!category) {
    category = await Category.create({
      name: `E2E Category ${testTs}`,
      slug: `e2e-cat-${testTs}`,
      isActive: true
    });
  }

  let studentAccessToken = '';
  let studentRefreshToken = '';
  let techAccessToken = '';
  let adminAccessToken = '';
  let ticketId = '';
  let ticketCode = '';

  console.log('--- Step 1: Student Registers ---');
  {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: studentName,
        email: studentEmail,
        password: studentPassword
      })
    });

    const data = await res.json();
    assert(res.status === 201, `Student registration succeeded with 201 (got ${res.status})`);
    assert(data.success === true, 'Registration response success is true');
    assert(data.data?.user?.role === ROLES.STUDENT, 'Registered user role is strictly STUDENT');
    assert(!data.data?.user?.passwordHash, 'passwordHash is not exposed in registration');
    assert(Boolean(data.data?.token || data.data?.accessToken), 'Access token received on registration');
  }

  console.log('\n--- Step 2: Student Logs In ---');
  {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Student login succeeded with 200 OK (got ${res.status})`);
    studentAccessToken = data.data?.token || data.data?.accessToken;
    assert(Boolean(studentAccessToken), 'Student access token issued');

    const cookieHeader = res.headers.get('set-cookie');
    assert(cookieHeader?.includes('refreshToken'), 'HttpOnly refreshToken cookie was set');
    studentRefreshToken = cookieHeader || '';
  }

  console.log('\n--- Step 3: Student Reports Campus Issue with Photo ---');
  {
    const dummyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('title', 'Ceiling tile water leak in CS Lab 404');
    formData.append(
      'description',
      'Severe leak from HVAC duct dripping onto student desktop computers in room 404.'
    );
    formData.append('category', category._id.toString());
    formData.append('building', 'Computer Science Building');
    formData.append('room', 'Lab 404');
    formData.append('priority', 'MEDIUM');

    const photoBlob = new Blob([dummyPng], { type: 'image/png' });
    formData.append('images', photoBlob, 'ceiling_leak.png');

    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentAccessToken}`
      },
      body: formData
    });

    const data = await res.json();
    assert(res.status === 201, `Ticket creation returned 201 Created (got ${res.status})`);
    assert(data.data?.ticket?.status === 'OPEN', 'Ticket starts in OPEN status');
    assert(data.data?.ticket?.assignedTo === null, 'Ticket starts unassigned');
    assert(data.data?.ticket?.images?.length === 1, 'Attached photo successfully recorded');
    assert(
      data.data?.ticket?.location === 'Computer Science Building - Lab 404',
      'Campus location derived correctly'
    );

    ticketId = data.data?.ticket?._id;
    ticketCode = data.data?.ticket?.ticketCode;
    assert(Boolean(ticketId), 'Ticket ID generated');
    assert(ticketCode?.startsWith('FL-'), `Human-readable ticket code generated: ${ticketCode}`);

    if (data.data?.ticket?.images?.[0]?.fileName) {
      if (!cloudinaryConfigured) {
        // In disk-storage mode, track local file path for cleanup
        createdFilesToClean.push(
          path.resolve(__dirname, '../uploads', data.data.ticket.images[0].fileName)
        );
      }
      // In Cloudinary mode, fileName is a public_id; no local file to clean up
    }
  }

  console.log('\n--- Step 4: Admin Logs In ---');
  {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Admin login returned 200 OK (got ${res.status})`);
    assert(data.data?.user?.role === ROLES.ADMIN, 'Admin role confirmed');
    adminAccessToken = data.data?.token || data.data?.accessToken;
  }

  console.log('\n--- Step 5: Admin Views Ticket & Campus Overview ---');
  {
    // Overview check
    const overviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    const overviewData = await overviewRes.json();
    assert(overviewRes.status === 200, 'Admin overview returned 200 OK');
    assert(overviewData.data?.tickets?.open >= 1, 'Overview shows open ticket count');

    // Admin views ticket list
    const listRes = await fetch(`${baseUrl}/tickets?status=OPEN`, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'Admin ticket list returned 200 OK');
    const found = listData.data?.tickets?.some((t) => t._id === ticketId);
    assert(found, 'Created ticket is visible in Admin open queue');
  }

  console.log('\n--- Step 6: Admin Assigns Technician ---');
  {
    const res = await fetch(`${baseUrl}/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        technicianId: techUser._id.toString()
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Technician assignment returned 200 OK (got ${res.status})`);
    assert(data.data?.ticket?.status === 'ASSIGNED', 'Ticket status transitioned OPEN -> ASSIGNED');
    assert(
      (data.data?.ticket?.assignedTo?._id || data.data?.ticket?.assignedTo) === techUser._id.toString(),
      'Ticket assignedTo matches technician ID'
    );
  }

  console.log('\n--- Step 7: Admin Escalates Ticket Priority ---');
  {
    const res = await fetch(`${baseUrl}/tickets/${ticketId}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        priority: 'CRITICAL'
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Priority update returned 200 OK (got ${res.status})`);
    assert(data.data?.ticket?.priority === 'CRITICAL', 'Priority updated to CRITICAL');
  }

  console.log('\n--- Step 8: Technician Logs In ---');
  {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: techEmail,
        password: techPassword
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Technician login returned 200 OK (got ${res.status})`);
    assert(data.data?.user?.role === ROLES.TECHNICIAN, 'Technician role confirmed');
    techAccessToken = data.data?.token || data.data?.accessToken;
  }

  console.log('\n--- Step 9: Technician Views Assigned Work Queue ---');
  {
    const res = await fetch(`${baseUrl}/tickets/assigned`, {
      headers: { Authorization: `Bearer ${techAccessToken}` }
    });

    const data = await res.json();
    assert(res.status === 200, 'Assigned queue returned 200 OK');
    const inQueue = data.data?.tickets?.some((t) => t._id === ticketId);
    assert(inQueue, 'Assigned ticket is present in technician work queue');
  }

  console.log('\n--- Step 10: Technician Updates Status to IN_PROGRESS ---');
  {
    const res = await fetch(`${baseUrl}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAccessToken}`
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS'
      })
    });

    const data = await res.json();
    assert(res.status === 200, `Technician start work returned 200 OK (got ${res.status})`);
    assert(data.data?.ticket?.status === 'IN_PROGRESS', 'Status updated to IN_PROGRESS');
  }

  console.log('\n--- Step 11: Technician Resolves Ticket with Mandatory Resolution Note ---');
  {
    // Try resolving without notes -> must fail
    const invalidRes = await fetch(`${baseUrl}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAccessToken}`
      },
      body: JSON.stringify({
        status: 'RESOLVED'
      })
    });
    assert(invalidRes.status === 400, 'Resolving without resolution note is rejected with 400');

    // Provide valid resolution note
    const resolutionText =
      'Isolated condensation line above tile grid, cleared blockage, and replaced damaged acoustic tile. Leak fully resolved.';
    const validRes = await fetch(`${baseUrl}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techAccessToken}`
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNote: resolutionText
      })
    });

    const validData = await validRes.json();
    assert(validRes.status === 200, `Ticket resolution returned 200 OK (got ${validRes.status})`);
    assert(validData.data?.ticket?.status === 'RESOLVED', 'Status is now RESOLVED');
    assert(validData.data?.ticket?.resolutionNote === resolutionText, 'Resolution note recorded');
    assert(Boolean(validData.data?.ticket?.resolvedAt), 'resolvedAt timestamp is recorded');
  }

  console.log('\n--- Step 12: Student Views Resolved Ticket & Audit Trail ---');
  {
    const res = await fetch(`${baseUrl}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${studentAccessToken}` }
    });

    const data = await res.json();
    assert(res.status === 200, 'Student details fetch returned 200 OK');
    assert(data.data?.ticket?.status === 'RESOLVED', 'Student observes ticket as RESOLVED');
    assert(
      data.data?.ticket?.priority === 'CRITICAL',
      'Student observes updated CRITICAL priority'
    );
    assert(
      Boolean(data.data?.ticket?.resolutionNote),
      'Student can read technician resolution notes'
    );

    // Activity timeline check
    const activityRes = await fetch(`${baseUrl}/tickets/${ticketId}/activity`, {
      headers: { Authorization: `Bearer ${studentAccessToken}` }
    });

    const activityData = await activityRes.json();
    assert(activityRes.status === 200, 'Activity timeline fetch returned 200 OK');
    const actions = activityData.data?.activity?.map((a) => a.action) || [];
    assert(actions.includes('TICKET_CREATED'), 'Audit log contains TICKET_CREATED');
    assert(actions.includes('TECHNICIAN_ASSIGNED'), 'Audit log contains TECHNICIAN_ASSIGNED');
    assert(actions.includes('PRIORITY_CHANGED'), 'Audit log contains PRIORITY_CHANGED');
    assert(actions.includes('STATUS_CHANGED'), 'Audit log contains STATUS_CHANGED');
    assert(actions.includes('RESOLUTION_ADDED'), 'Audit log contains RESOLUTION_ADDED');
  }

  // Cleanup
  console.log('\n[Cleanup] Cleaning up created files, test tickets, and users...');
  for (const filePath of createdFilesToClean) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }

  await Ticket.deleteOne({ _id: ticketId });
  await AuditLog.deleteMany({ ticketId });
  await User.deleteMany({ _id: { $in: [techUser._id, adminUser._id] } });
  await User.deleteOne({ email: studentEmail });

  server.close();
  await disconnectDatabase();

  console.log('\n======================================================');
  console.log(`Phase 6 E2E Test Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('Test runner failure:', err);
  if (server) server.close();
  disconnectDatabase();
  process.exit(1);
});

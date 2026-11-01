import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';
import { Category } from '../src/models/Category.js';
import { AuditLog, AUDIT_ACTIONS } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { TICKET_STATUS } from '../src/constants/ticket-status.js';
import { PRIORITIES } from '../src/constants/priorities.js';
import { generateAccessToken } from '../src/utils/token.js';

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

async function runTicketTests() {
  console.log('\n======================================================');
  console.log('FixLoop Phase 3: Ticket Workflow & Management Tests');
  console.log('======================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Running on ephemeral port: ${port}`);

  const testTs = Date.now();

  // Create test actors
  const studentA = await User.create({
    name: 'Student A',
    email: `student.a.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.STUDENT,
    isActive: true
  });
  const tokenStudentA = generateAccessToken(studentA);

  const studentB = await User.create({
    name: 'Student B',
    email: `student.b.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.STUDENT,
    isActive: true
  });
  const tokenStudentB = generateAccessToken(studentB);

  const technician1 = await User.create({
    name: 'Technician One',
    email: `tech1.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.TECHNICIAN,
    isActive: true
  });
  const tokenTech1 = generateAccessToken(technician1);

  const technician2 = await User.create({
    name: 'Technician Two',
    email: `tech2.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.TECHNICIAN,
    isActive: true
  });
  const tokenTech2 = generateAccessToken(technician2);

  const admin = await User.create({
    name: 'Admin Supervisor',
    email: `admin.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.ADMIN,
    isActive: true
  });
  const tokenAdmin = generateAccessToken(admin);

  // Inactive technician to test assignment validation
  const inactiveTech = await User.create({
    name: 'Inactive Tech',
    email: `inactive.tech.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.TECHNICIAN,
    isActive: false
  });

  // Ensure category exists
  let category = await Category.findOne({ slug: 'electrical', isActive: true });
  if (!category) {
    category = await Category.create({
      name: 'Electrical',
      slug: 'electrical',
      description: 'Electrical fixtures',
      isActive: true
    });
  }

  let createdTicketId = '';

  try {
    // -------------------------------------------------------------------------
    // 1. TICKET CREATION (STUDENT)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Ticket Creation (Student) ---');

    // 1.1 Successful Ticket Creation
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`
      },
      body: JSON.stringify({
        title: 'Projector ceiling bracket loose',
        description: 'The overhead projector in room 302 appears ready to fall.',
        category: 'electrical',
        building: 'Academic Block B',
        room: 'Room 302',
        priority: 'HIGH'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Student creates ticket with 201 Created');
    assert(createData.data.ticket.status === TICKET_STATUS.OPEN, 'New ticket starts with OPEN status');
    assert(createData.data.ticket.assignedTo === null, 'New ticket has null assignedTo');
    assert(createData.data.ticket.location === 'Academic Block B - Room 302', 'Location is properly derived and set');
    assert(createData.data.ticket.ticketCode.startsWith('FL-'), 'Human-readable ticketCode FL- is generated');
    createdTicketId = createData.data.ticket._id;

    // Verify audit log for creation
    const creationAudit = await AuditLog.findOne({
      ticketId: createdTicketId,
      action: AUDIT_ACTIONS.TICKET_CREATED
    });
    assert(creationAudit !== null, 'TICKET_CREATED audit log entry recorded');
    assert(creationAudit.actorId.toString() === studentA._id.toString(), 'Audit actor is verified student reporter');

    // 1.2 Creation with Invalid / Inactive Category
    const badCatRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`
      },
      body: JSON.stringify({
        title: 'Valid title for testing',
        description: 'Valid description with more than 10 characters',
        category: 'non-existent-category-slug',
        location: 'Campus Gym'
      })
    });
    assert(badCatRes.status === 400, 'Creation with invalid category returns 400 Bad Request');

    // 1.3 Creation with Missing Location / Details
    const badLocRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`
      },
      body: JSON.stringify({
        title: 'Valid title for testing',
        description: 'Valid description with more than 10 characters',
        category: 'electrical'
        // Missing location, building, and room
      })
    });
    assert(badLocRes.status === 400, 'Creation with missing location returns 400 Bad Request');

    // -------------------------------------------------------------------------
    // 2. TICKET LISTING & RESOURCE OWNERSHIP (STUDENT)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Ticket Listing & Ownership (Student) ---');

    // 2.1 Student A views own tickets
    const myTicketsRes = await fetch(`${baseUrl}/tickets/my`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` }
    });
    const myTicketsData = await myTicketsRes.json();
    assert(myTicketsRes.status === 200, 'GET /api/tickets/my returns 200 OK');
    assert(myTicketsData.data.tickets.length >= 1, 'Student A sees their created ticket');

    // 2.2 Student B views own tickets (should be empty for student B)
    const studentBMyTickets = await fetch(`${baseUrl}/tickets/my`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` }
    });
    const studentBData = await studentBMyTickets.json();
    assert(studentBData.data.tickets.length === 0, 'Student B cannot see Student A tickets in /my');

    // 2.3 Student A views their ticket details
    const studentADetails = await fetch(`${baseUrl}/tickets/${createdTicketId}`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` }
    });
    assert(studentADetails.status === 200, 'Student A can view their own ticket details');

    // 2.4 Student B attempts to access Student A ticket details -> 404 (safe disclosure)
    const studentBDetails = await fetch(`${baseUrl}/tickets/${createdTicketId}`, {
      headers: { Authorization: `Bearer ${tokenStudentB}` }
    });
    assert(studentBDetails.status === 404, 'Student B accessing Student A ticket details is denied with 404');

    // 2.5 Student attempts to access Admin ticket list -> 403 Forbidden
    const studentToAll = await fetch(`${baseUrl}/tickets`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` }
    });
    assert(studentToAll.status === 403, 'Student accessing GET /api/tickets is rejected with 403 Forbidden');

    // -------------------------------------------------------------------------
    // 3. TECHNICIAN ASSIGNMENT & PRIORITY MANAGEMENT (ADMIN)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Technician Assignment & Priority (Admin) ---');

    // 3.1 Attempting to assign an inactive technician account -> 400
    const assignInactiveRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ technicianId: inactiveTech._id.toString() })
    });
    assert(assignInactiveRes.status === 400, 'Assigning inactive technician is rejected with 400');

    // 3.2 Attempting to assign a student as technician -> 400
    const assignStudentRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ technicianId: studentB._id.toString() })
    });
    assert(assignStudentRes.status === 400, 'Assigning user without TECHNICIAN role is rejected with 400');

    // 3.3 Non-admin attempting to assign technician -> 403
    const nonAdminAssign = await fetch(`${baseUrl}/tickets/${createdTicketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`
      },
      body: JSON.stringify({ technicianId: technician1._id.toString() })
    });
    assert(nonAdminAssign.status === 403, 'Non-admin assigning technician is rejected with 403');

    // 3.4 Valid Admin assignment -> Status becomes ASSIGNED
    const assignValidRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ technicianId: technician1._id.toString() })
    });
    const assignValidData = await assignValidRes.json();
    assert(assignValidRes.status === 200, 'Admin assigns technician successfully (200 OK)');
    assert(assignValidData.data.ticket.assignedTo._id === technician1._id.toString(), 'Ticket assignedTo updated to Tech 1');
    assert(assignValidData.data.ticket.status === TICKET_STATUS.ASSIGNED, 'Ticket status transitioned OPEN -> ASSIGNED');

    // Verify assignment audit log
    const assignAudit = await AuditLog.findOne({
      ticketId: createdTicketId,
      action: AUDIT_ACTIONS.TECHNICIAN_ASSIGNED
    });
    assert(assignAudit !== null, 'TECHNICIAN_ASSIGNED audit log entry created');

    // 3.5 Admin changes ticket priority
    const priorityRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ priority: 'CRITICAL' })
    });
    const priorityData = await priorityRes.json();
    assert(priorityRes.status === 200, 'Admin changes ticket priority to CRITICAL');
    assert(priorityData.data.ticket.priority === 'CRITICAL', 'Updated priority is reflected');

    // Student attempting to change priority -> 403
    const studentPriority = await fetch(`${baseUrl}/tickets/${createdTicketId}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`
      },
      body: JSON.stringify({ priority: 'LOW' })
    });
    assert(studentPriority.status === 403, 'Student changing priority is rejected with 403 Forbidden');

    // -------------------------------------------------------------------------
    // 4. TECHNICIAN WORKFLOW & STATUS TRANSITIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Technician Workflow & State Transitions ---');

    // 4.1 Technician 1 views their assigned queue
    const tech1QueueRes = await fetch(`${baseUrl}/tickets/assigned`, {
      headers: { Authorization: `Bearer ${tokenTech1}` }
    });
    const tech1Queue = await tech1QueueRes.json();
    assert(tech1QueueRes.status === 200, 'GET /api/tickets/assigned returns 200 OK');
    assert(tech1Queue.data.tickets.some((t) => t._id === createdTicketId), 'Assigned ticket appears in Tech 1 queue');

    // 4.2 Technician 2 views assigned queue (should NOT see ticket assigned to Tech 1)
    const tech2QueueRes = await fetch(`${baseUrl}/tickets/assigned`, {
      headers: { Authorization: `Bearer ${tokenTech2}` }
    });
    const tech2Queue = await tech2QueueRes.json();
    assert(!tech2Queue.data.tickets.some((t) => t._id === createdTicketId), 'Tech 2 cannot see ticket assigned to Tech 1 in queue');

    // 4.3 Technician 2 attempting to update Tech 1's ticket -> 403 Forbidden
    const tech2Update = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTech2}`
      },
      body: JSON.stringify({ status: TICKET_STATUS.IN_PROGRESS })
    });
    assert(tech2Update.status === 403, 'Technician 2 updating Tech 1 ticket status is rejected with 403');

    // 4.4 Invalid Transition Test: Tech 1 attempting to jump ASSIGNED -> RESOLVED directly without IN_PROGRESS -> 400
    const invalidJumpRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTech1}`
      },
      body: JSON.stringify({
        status: TICKET_STATUS.RESOLVED,
        resolutionNote: 'Skipped in progress'
      })
    });
    assert(invalidJumpRes.status === 400, 'Jumping ASSIGNED -> RESOLVED without IN_PROGRESS is rejected with 400');

    // 4.5 Valid Transition: Tech 1 changes ASSIGNED -> IN_PROGRESS
    const inProgressRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTech1}`
      },
      body: JSON.stringify({ status: TICKET_STATUS.IN_PROGRESS })
    });
    const inProgressData = await inProgressRes.json();
    assert(inProgressRes.status === 200, 'Tech 1 moves status ASSIGNED -> IN_PROGRESS');
    assert(inProgressData.data.ticket.status === TICKET_STATUS.IN_PROGRESS, 'Status is IN_PROGRESS');

    // 4.6 Missing Resolution Note when resolving -> 400
    const resolveNoNoteRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTech1}`
      },
      body: JSON.stringify({ status: TICKET_STATUS.RESOLVED })
    });
    assert(resolveNoNoteRes.status === 400, 'Resolving ticket without resolution note is rejected with 400');

    // 4.7 Valid Resolution: Tech 1 resolves ticket with note
    const resolveRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTech1}`
      },
      body: JSON.stringify({
        status: TICKET_STATUS.RESOLVED,
        resolutionNote: 'Replaced loose ceiling bolts and safely anchored projector bracket.'
      })
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, 'Tech 1 resolves ticket with resolution note (200 OK)');
    assert(resolveData.data.ticket.status === TICKET_STATUS.RESOLVED, 'Ticket is RESOLVED');
    assert(resolveData.data.ticket.resolvedAt !== null, 'resolvedAt timestamp is recorded');

    // -------------------------------------------------------------------------
    // 5. AUDIT HISTORY & ADMIN OVERVIEW
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Activity History & Admin Overview ---');

    // 5.1 Retrieve ticket activity history
    const activityRes = await fetch(`${baseUrl}/tickets/${createdTicketId}/activity`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` }
    });
    const activityData = await activityRes.json();
    assert(activityRes.status === 200, 'GET /api/tickets/:id/activity returns 200 OK');
    assert(activityData.data.activity.length >= 4, 'Activity history contains all state transitions & priority changes');

    // 5.2 Admin Overview
    const overviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const overviewData = await overviewRes.json();
    assert(overviewRes.status === 200, 'Admin overview returns 200 OK');
    assert(overviewData.data.tickets.total >= 1, 'Overview shows total tickets count');
    assert(overviewData.data.tickets.resolved >= 1, 'Overview reflects resolved tickets count');

    // 5.3 Admin Ticket Filtering & Pagination
    const filterRes = await fetch(`${baseUrl}/tickets?status=RESOLVED&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const filterData = await filterRes.json();
    assert(filterRes.status === 200, 'Admin filters tickets by status=RESOLVED');
    assert(filterData.data.tickets.every((t) => t.status === 'RESOLVED'), 'All returned tickets have status RESOLVED');
    assert(filterData.data.pagination.page === 1, 'Pagination page is 1');

    // Clean up test documents
    await Ticket.deleteOne({ _id: createdTicketId });
    await AuditLog.deleteMany({ ticketId: createdTicketId });
    await User.deleteMany({
      email: {
        $in: [
          studentA.email,
          studentB.email,
          technician1.email,
          technician2.email,
          admin.email,
          inactiveTech.email
        ]
      }
    });
    console.log('\n[Cleanup] Test tickets, audit logs, and users cleanly removed from Atlas.');
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDatabase();
  }

  console.log('\n======================================================');
  console.log(`Phase 3 Ticket Tests: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTicketTests().catch((err) => {
  console.error('[Fatal Ticket Test Error]:', err);
  process.exit(1);
});


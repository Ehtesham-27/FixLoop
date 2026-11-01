import http from 'http';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';
import { Category } from '../src/models/Category.js';
import { AuditLog, AUDIT_ACTIONS } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { PRIORITIES } from '../src/constants/priorities.js';
import { TICKET_STATUS } from '../src/constants/ticket-status.js';
import { SLA_TARGETS, SLA_STATUS } from '../src/constants/sla.js';
import { slaService } from '../src/services/sla.service.js';

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

async function runSlaTests() {
  console.log('\n======================================================');
  console.log('FixLoop Phase 2: SLA & Overdue Tracking Tests');
  console.log('======================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Ephemeral port: ${port}`);

  const timestamp = Date.now();
  const testCategorySlug = `sla-cat-${timestamp}`;
  let categoryId;

  // Test accounts
  const student1Email = `student1.sla.${timestamp}@campus.edu`;
  const student2Email = `student2.sla.${timestamp}@campus.edu`;
  const tech1Email = `tech1.sla.${timestamp}@campus.edu`;
  const adminEmail = `admin.sla.${timestamp}@campus.edu`;

  let student1Token = '';
  let student2Token = '';
  let tech1Token = '';
  let adminToken = '';

  let student1Id = '';
  let tech1Id = '';
  let adminId = '';

  const createdTicketIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. UNIT CALCULATIONS & RULE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Centralized SLA Targets & Calculation Rules ---');

    // Requirements 1-4: Priorities target hours
    assert(slaService.getSlaTargetHours(PRIORITIES.CRITICAL) === 2, 'Requirement 1: CRITICAL priority gets a 2-hour SLA');
    assert(slaService.getSlaTargetHours(PRIORITIES.HIGH) === 8, 'Requirement 2: HIGH priority gets an 8-hour SLA');
    assert(slaService.getSlaTargetHours(PRIORITIES.MEDIUM) === 24, 'Requirement 3: MEDIUM priority gets a 24-hour SLA');
    assert(slaService.getSlaTargetHours(PRIORITIES.LOW) === 72, 'Requirement 4: LOW priority gets a 72-hour SLA');

    // calculateDueAt deterministic checks
    const baseTime = new Date('2026-11-02T10:00:00.000Z');
    const criticalDue = slaService.calculateDueAt(baseTime, PRIORITIES.CRITICAL);
    assert(criticalDue.toISOString() === '2026-11-02T12:00:00.000Z', 'Critical due date is exactly +2 hours');

    const highDue = slaService.calculateDueAt(baseTime, PRIORITIES.HIGH);
    assert(highDue.toISOString() === '2026-11-02T18:00:00.000Z', 'High due date is exactly +8 hours');

    // -------------------------------------------------------------------------
    // 2. DETERMINISTIC SLA STATUS LOGIC (CLOCK SIMULATION)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Deterministic SLA Status Lifecycle ---');

    // Total duration: 10:00 to 18:00 (8 hours = 480 minutes).
    // 20% of 8h = 96 minutes = 1h 36m.
    // At-risk window begins at 18:00 - 96 min = 16:24.

    const sampleTicket = {
      priority: PRIORITIES.HIGH,
      status: TICKET_STATUS.OPEN,
      createdAt: new Date('2026-11-02T10:00:00.000Z'),
      dueAt: new Date('2026-11-02T18:00:00.000Z'),
      slaTargetHours: 8
    };

    // Requirement 9: Tickets well before deadline are ON_TRACK
    const clockOnTrack = new Date('2026-11-02T14:00:00.000Z'); // 4 hours remaining (50%)
    const slaOnTrack = slaService.getSlaDetails(sampleTicket, clockOnTrack);
    assert(slaOnTrack.slaStatus === SLA_STATUS.ON_TRACK, 'Requirement 9: Ticket with >20% remaining is ON_TRACK');
    assert(!slaOnTrack.isOverdue, 'ON_TRACK ticket is not overdue');
    assert(slaOnTrack.remainingMilliseconds === 4 * 3600 * 1000, 'Correct remainingMilliseconds computed');

    // Requirement 10: Tickets near deadline (<= 20% remaining) are AT_RISK
    const clockAtRisk = new Date('2026-11-02T17:00:00.000Z'); // 1 hour remaining (< 96 minutes = 20%)
    const slaAtRisk = slaService.getSlaDetails(sampleTicket, clockAtRisk);
    assert(slaAtRisk.slaStatus === SLA_STATUS.AT_RISK, 'Requirement 10: Ticket with <=20% SLA remaining is AT_RISK');
    assert(!slaAtRisk.isOverdue, 'AT_RISK ticket is not yet overdue');

    // Requirement 11: Tickets past deadline are OVERDUE
    const clockOverdue = new Date('2026-11-02T18:05:00.000Z'); // 5 minutes past deadline
    const slaOverdue = slaService.getSlaDetails(sampleTicket, clockOverdue);
    assert(slaOverdue.slaStatus === SLA_STATUS.OVERDUE, 'Requirement 11: Ticket past deadline is OVERDUE');
    assert(slaOverdue.isOverdue === true, 'OVERDUE ticket has isOverdue: true');
    assert(slaOverdue.remainingMilliseconds < 0, 'OVERDUE ticket has negative remainingMilliseconds');

    // Requirement 12 & 13: Tickets resolved on time are RESOLVED_ON_TIME and NOT currently overdue
    const resolvedOnTimeTicket = {
      ...sampleTicket,
      status: TICKET_STATUS.RESOLVED,
      resolvedAt: new Date('2026-11-02T17:30:00.000Z') // Resolved 30 min before deadline
    };
    const slaResolvedOnTime = slaService.getSlaDetails(resolvedOnTimeTicket, clockOverdue);
    assert(slaResolvedOnTime.slaStatus === SLA_STATUS.RESOLVED_ON_TIME, 'Requirement 13: Ticket resolved before deadline is RESOLVED_ON_TIME');
    assert(slaResolvedOnTime.isOverdue === false, 'Requirement 12: Resolved ticket is never currently overdue');
    assert(slaResolvedOnTime.remainingMilliseconds === 0, 'Resolved ticket has remainingMilliseconds: 0');

    // Requirement 14: Tickets resolved after deadline are RESOLVED_LATE and NOT currently overdue
    const resolvedLateTicket = {
      ...sampleTicket,
      status: TICKET_STATUS.RESOLVED,
      resolvedAt: new Date('2026-11-02T19:00:00.000Z') // Resolved 1 hour after deadline
    };
    const slaResolvedLate = slaService.getSlaDetails(resolvedLateTicket, clockOverdue);
    assert(slaResolvedLate.slaStatus === SLA_STATUS.RESOLVED_LATE, 'Requirement 14: Ticket resolved after deadline is RESOLVED_LATE');
    assert(slaResolvedLate.isOverdue === false, 'Requirement 12b: Resolved late ticket is never currently overdue');

    // Requirement 8 & 21: Legacy ticket without dueAt or invalid dates
    const legacyTicket = {
      priority: PRIORITIES.MEDIUM,
      status: TICKET_STATUS.OPEN,
      createdAt: new Date('2026-11-01T12:00:00.000Z')
      // dueAt and slaTargetHours omitted!
    };
    const legacySla = slaService.getSlaDetails(legacyTicket, new Date('2026-11-01T15:00:00.000Z'));
    assert(legacySla.slaTargetHours === 24, 'Requirement 8: Legacy ticket derives 24h SLA target');
    assert(legacySla.dueAt instanceof Date && !isNaN(legacySla.dueAt.getTime()), 'Legacy ticket derives valid Date for dueAt');
    assert(legacySla.slaStatus === SLA_STATUS.ON_TRACK, 'Legacy ticket calculates correct status');

    const corruptTicket = {
      priority: 'INVALID_PRIORITY',
      status: 'OPEN',
      dueAt: 'invalid-date',
      createdAt: 'invalid-date'
    };
    const corruptSla = slaService.getSlaDetails(corruptTicket);
    assert(corruptSla.dueAt instanceof Date && !isNaN(corruptSla.dueAt.getTime()), 'Requirement 21: Corrupt/missing dates do not crash SLA calculations');

    // -------------------------------------------------------------------------
    // 3. SEEDING & HTTP INTEGRATION PREPARATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Setting up HTTP Test Environment ---');

    const passwordHash = await bcrypt.hash('TestPass123!', 12);

    const student1 = await User.create({
      name: 'Alice Student',
      email: student1Email,
      passwordHash,
      role: ROLES.STUDENT,
      isActive: true
    });
    student1Id = student1._id.toString();

    const student2 = await User.create({
      name: 'Bob Student',
      email: student2Email,
      passwordHash,
      role: ROLES.STUDENT,
      isActive: true
    });

    const tech1 = await User.create({
      name: 'Dave Technician',
      email: tech1Email,
      passwordHash,
      role: ROLES.TECHNICIAN,
      isActive: true
    });
    tech1Id = tech1._id.toString();

    const admin = await User.create({
      name: 'Carol Admin',
      email: adminEmail,
      passwordHash,
      role: ROLES.ADMIN,
      isActive: true
    });
    adminId = admin._id.toString();

    const category = await Category.create({
      name: 'Electrical SLA',
      slug: testCategorySlug,
      description: 'Electrical fixtures and power outlets',
      isActive: true
    });
    categoryId = category._id.toString();

    const loginAndGetToken = async (email) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'TestPass123!' })
      });
      const data = await res.json();
      return data.data?.token || '';
    };

    student1Token = await loginAndGetToken(student1Email);
    student2Token = await loginAndGetToken(student2Email);
    tech1Token = await loginAndGetToken(tech1Email);
    adminToken = await loginAndGetToken(adminEmail);

    // -------------------------------------------------------------------------
    // 4. TICKET CREATION & SLA INITIALIZATION (HTTP)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Ticket Creation with SLA Fields ---');

    // Requirement 5: New ticket receives valid SLA deadline
    const createRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`
      },
      body: JSON.stringify({
        title: 'Broken projector in Science Block',
        description: 'The overhead projector does not power on during lab session.',
        category: categoryId,
        location: 'Science Block - Lab 201',
        priority: PRIORITIES.HIGH
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Ticket creation returns 201 Created');
    const createdTicket = createData.data?.ticket;
    assert(createdTicket.slaTargetHours === 8, 'Requirement 5: Created ticket has slaTargetHours: 8');
    assert(typeof createdTicket.dueAt === 'string', 'Created ticket has dueAt timestamp string');
    assert(createdTicket.slaStatus === SLA_STATUS.ON_TRACK, 'Newly created ticket starts ON_TRACK');
    assert(createdTicket.isOverdue === false, 'Newly created ticket is not overdue');

    const ticket1Id = createdTicket._id;
    createdTicketIds.push(ticket1Id);

    // -------------------------------------------------------------------------
    // 5. PRIORITY UPDATE & DEADLINE RECALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Priority Changes & Deadline Recalculation ---');

    // Requirement 18: Student cannot change priority
    const studentPriorityRes = await fetch(`${baseUrl}/tickets/${ticket1Id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1Token}`
      },
      body: JSON.stringify({ priority: PRIORITIES.CRITICAL })
    });
    assert(studentPriorityRes.status === 403, 'Requirement 18: Non-admin cannot change priority (403 Forbidden)');

    // Requirement 6 & 7: Admin changes priority to CRITICAL -> recalculates dueAt, preserves createdAt
    const originalCreatedAt = createdTicket.createdAt;
    const originalDueAt = createdTicket.dueAt;

    const adminPriorityRes = await fetch(`${baseUrl}/tickets/${ticket1Id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ priority: PRIORITIES.CRITICAL })
    });
    const adminPriorityData = await adminPriorityRes.json();
    assert(adminPriorityRes.status === 200, 'Admin changes priority successfully (200 OK)');
    const updatedTicket = adminPriorityData.data?.ticket;

    assert(updatedTicket.priority === PRIORITIES.CRITICAL, 'Ticket priority updated to CRITICAL');
    assert(updatedTicket.slaTargetHours === 2, 'Requirement 6: SLA target recalculated to 2 hours');
    assert(updatedTicket.dueAt !== originalDueAt, 'dueAt updated to new deadline');
    assert(updatedTicket.createdAt === originalCreatedAt, 'Requirement 7: createdAt is strictly preserved');

    // Audit log verification for priority change
    const priorityAudit = await AuditLog.findOne({
      ticketId: ticket1Id,
      action: AUDIT_ACTIONS.PRIORITY_CHANGED
    });
    assert(priorityAudit !== null, 'AuditLog recorded for PRIORITY_CHANGED');
    assert(priorityAudit?.oldValue?.priority === PRIORITIES.HIGH, 'Audit recorded old priority HIGH');
    assert(priorityAudit?.newValue?.priority === PRIORITIES.CRITICAL, 'Audit recorded new priority CRITICAL');
    assert(priorityAudit?.newValue?.slaTargetHours === 2, 'Audit recorded new SLA target 2h');

    // -------------------------------------------------------------------------
    // 6. ROLE AUTHORIZATION & PERMISSION BOUNDARIES
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Role-Based SLA Authorization ---');

    // Requirement 15: Student 2 cannot access Student 1's ticket details/SLA
    const student2GetRes = await fetch(`${baseUrl}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    assert(student2GetRes.status === 404, "Requirement 15: Student cannot view another student's ticket/SLA (404)");

    // Requirement 16: Technician cannot view unassigned ticket
    const techUnassignedRes = await fetch(`${baseUrl}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${tech1Token}` }
    });
    assert(techUnassignedRes.status === 404, 'Requirement 16: Technician cannot view unassigned ticket (404)');

    // Admin assigns ticket to technician 1
    const assignRes = await fetch(`${baseUrl}/tickets/${ticket1Id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ technicianId: tech1Id })
    });
    assert(assignRes.status === 200, 'Admin assigns technician to ticket (200 OK)');

    // Now technician 1 CAN view assigned ticket SLA details
    const techAssignedRes = await fetch(`${baseUrl}/tickets/${ticket1Id}`, {
      headers: { Authorization: `Bearer ${tech1Token}` }
    });
    const techAssignedData = await techAssignedRes.json();
    assert(techAssignedRes.status === 200, 'Technician can view assigned ticket SLA details (200 OK)');
    assert(techAssignedData.data?.ticket?.slaStatus !== undefined, 'Technician response includes computed slaStatus');

    // -------------------------------------------------------------------------
    // 7. ADMIN SLA OVERVIEW & FILTERING (HTTP)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Admin SLA Overview & SLA Status Filtering ---');

    // Requirement 17: Non-admin cannot access SLA overview
    const studentSlaOverviewRes = await fetch(`${baseUrl}/admin/sla-overview`, {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(studentSlaOverviewRes.status === 403, 'Requirement 17: Student cannot access /admin/sla-overview (403)');

    const techSlaOverviewRes = await fetch(`${baseUrl}/admin/sla-overview`, {
      headers: { Authorization: `Bearer ${tech1Token}` }
    });
    assert(techSlaOverviewRes.status === 403, 'Requirement 17: Technician cannot access /admin/sla-overview (403)');

    // Admin can access SLA overview
    const adminSlaOverviewRes = await fetch(`${baseUrl}/admin/sla-overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminSlaOverviewData = await adminSlaOverviewRes.json();
    assert(adminSlaOverviewRes.status === 200, 'Admin can access /admin/sla-overview (200 OK)');
    const stats = adminSlaOverviewData.data;
    assert(typeof stats?.totalUnresolved === 'number', 'Requirement 20: totalUnresolved is a number');
    assert(typeof stats?.onTrack === 'number', 'onTrack is a number');
    assert(typeof stats?.atRisk === 'number', 'atRisk is a number');
    assert(typeof stats?.overdue === 'number', 'overdue is a number');
    assert(typeof stats?.complianceRate === 'number', 'complianceRate is a number');

    // Requirement 19: Ticket listing with slaStatus filter
    const filterOnTrackRes = await fetch(`${baseUrl}/tickets?slaStatus=ON_TRACK`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const filterOnTrackData = await filterOnTrackRes.json();
    assert(filterOnTrackRes.status === 200, 'Requirement 19: Filter by slaStatus=ON_TRACK returns 200 OK');
    assert(Array.isArray(filterOnTrackData.data?.tickets), 'Returns tickets array');

    // Test resolving the ticket
    await fetch(`${baseUrl}/tickets/${ticket1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`
      },
      body: JSON.stringify({ status: TICKET_STATUS.IN_PROGRESS })
    });

    const resolveRes = await fetch(`${baseUrl}/tickets/${ticket1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tech1Token}`
      },
      body: JSON.stringify({
        status: TICKET_STATUS.RESOLVED,
        resolutionNote: 'Replaced blown power supply capacitor and tested.'
      })
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, 'Ticket resolved successfully (200 OK)');
    assert(resolveData.data?.ticket?.slaStatus === SLA_STATUS.RESOLVED_ON_TIME, 'Ticket marked RESOLVED_ON_TIME');
    assert(resolveData.data?.ticket?.isOverdue === false, 'Resolved ticket is not overdue');

  } finally {
    console.log('\n--- Cleaning up test records ---');
    if (createdTicketIds.length > 0) {
      await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
      await AuditLog.deleteMany({ ticketId: { $in: createdTicketIds } });
    }
    if (categoryId) {
      await Category.deleteMany({ _id: categoryId });
    }
    await User.deleteMany({
      email: { $in: [student1Email, student2Email, tech1Email, adminEmail] }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDatabase();
  }

  console.log('\n======================================');
  console.log(`SLA Test Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSlaTests().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});

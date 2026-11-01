import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Ticket } from '../src/models/Ticket.js';
import { AuditLog, AUDIT_ACTIONS } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { TICKET_STATUS } from '../src/constants/ticket-status.js';
import { PRIORITIES } from '../src/constants/priorities.js';
import { connectDatabase, disconnectDatabase, isDbConnected } from '../src/config/database.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runModelTests() {
  console.log('\n--- 1. Testing User Schema & Validation ---');

  // Test 1: Valid user passes validation
  const validUser = new User({
    name: 'Alice Student',
    email: 'alice@campus.edu',
    passwordHash: 'hashed_pw_placeholder',
    role: ROLES.STUDENT
  });
  const validUserErr = validUser.validateSync();
  assert(!validUserErr, 'Valid student user document passes validation');

  // Test 2: Invalid email fails
  const invalidEmailUser = new User({
    name: 'Bad Email',
    email: 'not-an-email',
    passwordHash: 'hashed_pw_placeholder',
    role: ROLES.STUDENT
  });
  const invalidEmailErr = invalidEmailUser.validateSync();
  assert(invalidEmailErr?.errors['email'] !== undefined, 'Invalid email format is rejected');

  // Test 3: Invalid role fails
  const invalidRoleUser = new User({
    name: 'Bad Role',
    email: 'role@campus.edu',
    passwordHash: 'hashed_pw_placeholder',
    role: 'SUPERADMIN_NOT_ALLOWED'
  });
  const invalidRoleErr = invalidRoleUser.validateSync();
  assert(invalidRoleErr?.errors['role'] !== undefined, 'Unauthorized role value is rejected');

  // Test 4: Password hashing & comparePassword method
  const plainTextPassword = 'MySecretPassword123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainTextPassword, salt);
  validUser.passwordHash = hash;
  const isMatch = await validUser.comparePassword(plainTextPassword);
  const isWrongMatch = await validUser.comparePassword('WrongPassword');
  assert(isMatch === true, 'comparePassword verifies correct bcrypt hash');
  assert(isWrongMatch === false, 'comparePassword rejects incorrect password');

  console.log('\n--- 2. Testing Category Schema & Slug Validation ---');

  // Test 5: Valid category passes
  const validCategory = new Category({
    name: 'Electrical Maintenance',
    slug: 'electrical-maintenance',
    description: 'All electrical wiring and fixtures'
  });
  const validCategoryErr = validCategory.validateSync();
  assert(!validCategoryErr, 'Valid category with URL-safe slug passes validation');

  // Test 6: Invalid slug (uppercase/spaces) fails
  const invalidSlugCategory = new Category({
    name: 'Bad Slug',
    slug: 'Invalid Slug With Spaces!',
    description: 'Bad slug'
  });
  const invalidSlugErr = invalidSlugCategory.validateSync();
  assert(invalidSlugErr?.errors['slug'] !== undefined, 'Non URL-safe category slug is rejected');

  console.log('\n--- 3. Testing Ticket Schema & Enum Validation ---');

  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyCategoryId = new mongoose.Types.ObjectId();

  // Test 7: Valid ticket passes
  const validTicket = new Ticket({
    title: 'Water pipe leakage in lab',
    description: 'The sink in chemistry lab 204 is leaking onto the floor.',
    category: dummyCategoryId,
    building: 'Science Complex',
    room: 'Lab 204',
    priority: PRIORITIES.HIGH,
    status: TICKET_STATUS.OPEN,
    reportedBy: dummyUserId
  });
  const validTicketErr = validTicket.validateSync();
  assert(!validTicketErr, 'Valid ticket with category and reporter ObjectId references passes validation');

  // Test 8: Short title (<5 chars) fails
  const shortTitleTicket = new Ticket({
    title: 'leak',
    description: 'The sink in chemistry lab 204 is leaking onto the floor.',
    category: dummyCategoryId,
    building: 'Science Complex',
    room: 'Lab 204',
    reportedBy: dummyUserId
  });
  const shortTitleErr = shortTitleTicket.validateSync();
  assert(shortTitleErr?.errors['title'] !== undefined, 'Ticket title shorter than 5 chars is rejected');

  // Test 9: Invalid ticket status fails
  const invalidStatusTicket = new Ticket({
    title: 'Valid ticket title',
    description: 'Valid description with sufficient length for testing.',
    category: dummyCategoryId,
    building: 'Main Hall',
    room: 'Room 101',
    status: 'UNKNOWN_STATUS',
    reportedBy: dummyUserId
  });
  const invalidStatusErr = invalidStatusTicket.validateSync();
  assert(invalidStatusErr?.errors['status'] !== undefined, 'Arbitrary invalid ticket status is rejected');

  // Test 10: Invalid ticket priority fails
  const invalidPriorityTicket = new Ticket({
    title: 'Valid ticket title',
    description: 'Valid description with sufficient length for testing.',
    category: dummyCategoryId,
    building: 'Main Hall',
    room: 'Room 101',
    priority: 'URGENT_NOW',
    reportedBy: dummyUserId
  });
  const invalidPriorityErr = invalidPriorityTicket.validateSync();
  assert(invalidPriorityErr?.errors['priority'] !== undefined, 'Invalid ticket priority is rejected');

  console.log('\n--- 4. Testing AuditLog Schema & Action Validation ---');

  const dummyTicketId = new mongoose.Types.ObjectId();

  // Test 11: Valid audit log passes
  const validAudit = new AuditLog({
    ticketId: dummyTicketId,
    actorId: dummyUserId,
    action: AUDIT_ACTIONS.STATUS_CHANGED,
    oldValue: TICKET_STATUS.OPEN,
    newValue: TICKET_STATUS.ASSIGNED,
    note: 'Assigned to senior electrician'
  });
  const validAuditErr = validAudit.validateSync();
  assert(!validAuditErr, 'Valid audit log record passes validation');

  // Test 12: Invalid audit action fails
  const invalidAudit = new AuditLog({
    ticketId: dummyTicketId,
    actorId: dummyUserId,
    action: 'UNAUTHORIZED_ACTION'
  });
  const invalidAuditErr = invalidAudit.validateSync();
  assert(invalidAuditErr?.errors['action'] !== undefined, 'Non allow-listed audit action is rejected');

  console.log('\n--- 5. Testing Seeder Logic & Duplicate Prevention ---');
  const { seedUserAccount } = await import('../src/scripts/seed.js');

  // Test 13: Missing credentials skips gracefully
  const skippedSeed = await seedUserAccount({ name: 'No Pass', email: 'nopass@campus.edu', password: '', role: ROLES.ADMIN });
  assert(skippedSeed.status === 'skipped', 'Seeder skips gracefully when password or email is missing');

  // Test 14: Short password throws validation error
  let shortPwThrew = false;
  try {
    await seedUserAccount({ name: 'Short', email: 'short@campus.edu', password: '123', role: ROLES.ADMIN });
  } catch {
    shortPwThrew = true;
  }
  assert(shortPwThrew === true, 'Seeder rejects password shorter than 8 characters');

  console.log('\n--- 6. Testing Database Connection & Event Handling ---');

  // Test 13: Attempt database connection and test graceful handling
  try {
    await connectDatabase();
    const connected = isDbConnected();
    console.log(`  ℹ MongoDB reachability test completed. Status: ${connected ? 'CONNECTED' : 'OFFLINE (handled cleanly)'}`);
    assert(true, 'Database connection attempt handled cleanly without crashing process');
  } catch (err) {
    console.error(`  ✗ Unexpected fatal error: ${err.message}`);
    failedTests++;
  } finally {
    await disconnectDatabase();
  }

  console.log('\n======================================');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed.`);
  console.log('======================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runModelTests();


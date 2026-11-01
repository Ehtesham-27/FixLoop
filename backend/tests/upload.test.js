import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Ticket } from '../src/models/Ticket.js';
import { Category } from '../src/models/Category.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { generateAccessToken } from '../src/utils/token.js';

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

async function runUploadTests() {
  console.log('\n======================================================');
  console.log('FixLoop Phase 5: Image Upload Security Tests');
  console.log('======================================================\n');

  await connectDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Server] Running on ephemeral port: ${port}`);

  const testTs = Date.now();
  const createdFilesToClean = [];

  // Create test student user
  const student = await User.create({
    name: 'Upload Test Student',
    email: `upload.student.${testTs}@campus.edu`,
    passwordHash: 'dummy_hash',
    role: ROLES.STUDENT,
    isActive: true
  });
  const studentToken = generateAccessToken(student);

  // Retrieve an active category
  let testCategory = await Category.findOne({ isActive: true });
  if (!testCategory) {
    testCategory = await Category.create({
      name: `Upload Test Category ${testTs}`,
      slug: `upload-test-cat-${testTs}`,
      isActive: true
    });
  }

  // Helper dummy file buffers
  // 1x1 PNG image buffer
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  console.log('--- 1. Testing Valid Image Attachment Upload ---');
  {
    const formData = new FormData();
    formData.append('title', 'Water leak in 3rd floor restroom');
    formData.append('description', 'Sink pipe valve is leaking water onto the tile floor.');
    formData.append('category', testCategory._id.toString());
    formData.append('building', 'Science Hall');
    formData.append('room', 'Restroom 302');
    formData.append('priority', 'HIGH');

    const fileBlob = new Blob([validPngBuffer], { type: 'image/png' });
    formData.append('images', fileBlob, 'sink_leak.png');

    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      body: formData
    });

    const data = await res.json();
    assert(res.status === 201, `Ticket with valid PNG upload returns 201 Created (got ${res.status})`);
    assert(data.success === true, 'Response contains success: true');
    assert(Array.isArray(data.data?.ticket?.images), 'Ticket has images array');
    assert(data.data?.ticket?.images?.length === 1, '1 image is recorded in ticket');

    const uploadedImage = data.data?.ticket?.images?.[0];
    assert(uploadedImage?.originalName === 'sink_leak.png', 'Image originalName is preserved');
    assert(uploadedImage?.mimeType === 'image/png', 'Image mimeType is image/png');
    assert(uploadedImage?.url?.startsWith('/uploads/'), 'Image URL starts with /uploads/');

    if (uploadedImage?.fileName) {
      const diskPath = path.resolve(__dirname, '../uploads', uploadedImage.fileName);
      assert(fs.existsSync(diskPath), `Uploaded image exists on disk at ${uploadedImage.fileName}`);
      createdFilesToClean.push(diskPath);
    }
  }

  console.log('\n--- 2. Testing Static Serving of Uploaded Files ---');
  {
    if (createdFilesToClean.length > 0) {
      const filename = path.basename(createdFilesToClean[0]);
      const res = await fetch(`http://127.0.0.1:${port}/uploads/${filename}`);
      assert(res.status === 200, `Static route GET /uploads/${filename} returns 200 OK`);
      assert(
        res.headers.get('content-type')?.includes('image/png'),
        'Content-Type header matches image/png'
      );
    }
  }

  console.log('\n--- 3. Testing Dangerous Extension & MIME Rejection ---');
  {
    // Try uploading an executable script (.sh)
    const dangerousScript = Buffer.from('#!/bin/bash\necho "exploit"', 'utf-8');
    const formData = new FormData();
    formData.append('title', 'Attempting dangerous file upload');
    formData.append('description', 'Testing backend rejection of non-image extensions and mimes.');
    formData.append('category', testCategory._id.toString());
    formData.append('building', 'Main Block');
    formData.append('room', '101');

    const scriptBlob = new Blob([dangerousScript], { type: 'application/x-sh' });
    formData.append('images', scriptBlob, 'script.sh');

    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      body: formData
    });

    const data = await res.json();
    assert(res.status === 400, `Dangerous file (.sh) is rejected with 400 Bad Request (got ${res.status})`);
    assert(data.success === false, 'Response contains success: false');
    assert(
      data.message?.toLowerCase().includes('only jpeg, png, and webp') ||
        data.message?.toLowerCase().includes('invalid file'),
      'Error message clarifies that only JPEG, PNG, and WebP are allowed'
    );
  }

  {
    // Try uploading an executable with disguised extension or mime (.exe)
    const fakeExe = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'binary');
    const formData = new FormData();
    formData.append('title', 'Attempting executable upload');
    formData.append('description', 'Testing backend rejection of .exe binary files.');
    formData.append('category', testCategory._id.toString());
    formData.append('building', 'Main Block');
    formData.append('room', '101');

    const exeBlob = new Blob([fakeExe], { type: 'application/x-msdownload' });
    formData.append('images', exeBlob, 'malware.exe');

    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      body: formData
    });

    assert(res.status === 400, `Executable (.exe) is rejected with 400 Bad Request (got ${res.status})`);
  }

  console.log('\n--- 4. Testing Oversized File Rejection (>5MB) ---');
  {
    // Create a 6MB dummy buffer
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0);
    const formData = new FormData();
    formData.append('title', 'Attempting oversized image upload');
    formData.append('description', 'Testing backend rejection of images exceeding 5MB.');
    formData.append('category', testCategory._id.toString());
    formData.append('building', 'Main Block');
    formData.append('room', '101');

    const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/jpeg' });
    formData.append('images', oversizedBlob, 'huge_photo.jpg');

    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      body: formData
    });

    const data = await res.json();
    assert(res.status === 400, `Oversized image (>5MB) is rejected with 400 Bad Request (got ${res.status})`);
    assert(data.success === false, 'Response contains success: false');
    assert(
      data.message?.toLowerCase().includes('too large') || data.message?.toLowerCase().includes('size'),
      'Error message explicitly specifies file size violation'
    );
  }

  // Cleanup
  console.log('\n[Cleanup] Cleaning up created files, test tickets, and user...');
  for (const filePath of createdFilesToClean) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore
    }
  }

  await Ticket.deleteMany({ reportedBy: student._id });
  await AuditLog.deleteMany({ actorId: student._id });
  await User.deleteOne({ _id: student._id });

  server.close();
  await disconnectDatabase();

  console.log('\n======================================================');
  console.log(`Phase 5 Upload Test Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runUploadTests().catch((err) => {
  console.error('Test runner failure:', err);
  if (server) server.close();
  disconnectDatabase();
  process.exit(1);
});


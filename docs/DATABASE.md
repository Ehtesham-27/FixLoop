# FixLoop — Database Schema & Data Models

FixLoop utilizes MongoDB with Mongoose ODM. Schemas enforce data integrity, normalization, and safe access control.

## 1. Collections & Schemas

### 1.1 `users`
Stores user identities, credentials, and roles.
- `_id`: ObjectId (Primary Key)
- `name`: String, required, trim, 2-100 characters
- `email`: String, required, unique, trim, lowercase
- `passwordHash`: String, required, select: false (hidden by default)
- `role`: String enum (`['STUDENT', 'TECHNICIAN', 'ADMIN']`), default: `STUDENT`
- `isActive`: Boolean, default: true
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

**Indexes:**
- `{ email: 1 }` (unique)

---

### 1.2 `categories`
Stores available maintenance categories for ticket classification.
- `_id`: ObjectId (Primary Key)
- `name`: String, required, unique, trim
- `slug`: String, required, unique, lowercase URL-safe identifier
- `description`: String, optional
- `isActive`: Boolean, default: true
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

**Indexes:**
- `{ slug: 1 }` (unique)
- `{ isActive: 1, name: 1 }` (compound index for active category listings)

---

### 1.3 `tickets`
Stores campus maintenance issue tickets.
- `_id`: ObjectId (Primary Key)
- `ticketCode`: String, unique sparse (e.g., `FL-000101`)
- `title`: String, required, trim, 5-150 characters
- `description`: String, required, trim, 10-2000 characters
- `category`: ObjectId ref `Category`, required
- `building`: String, required, max 100 characters
- `room`: String, required, max 100 characters
- `location`: String, optional / auto-derived from `building` and `room`
- `priority`: String enum (`['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']`), default: `MEDIUM`
- `status`: String enum (`['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']`), default: `OPEN`
- `reportedBy` (alias `reporter`): ObjectId ref `User`, required
- `assignedTo`: ObjectId ref `User`, nullable
- `images` (alias `attachments`): Array of attachment metadata:
  - `fileName`: String
  - `originalName`: String
  - `mimeType`: String
  - `size`: Number
  - `url`: String
  - `uploadedAt`: Date
- `resolutionNote` (alias `resolutionNotes`): String, optional
- `resolvedAt`: Date, nullable
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

**Indexes:**
- `{ reportedBy: 1, createdAt: -1 }` (student personal tickets)
- `{ assignedTo: 1, status: 1, createdAt: -1 }` (technician assigned work queue)
- `{ status: 1, priority: 1, createdAt: -1 }` (admin overview & priority filtering)
- `{ category: 1, createdAt: -1 }` (category filtering)

---

### 1.4 `auditlogs`
Immutable record of ticket updates and state transitions.
- `_id`: ObjectId (Primary Key)
- `ticketId` (alias `ticket`): ObjectId ref `Ticket`, required
- `actorId` (alias `actor`): ObjectId ref `User`, required
- `action`: String enum (`TICKET_CREATED`, `TECHNICIAN_ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `RESOLUTION_ADDED`, `ATTACHMENT_ADDED`)
- `oldValue` (alias `previousValue`): Mixed (previous value)
- `newValue`: Mixed (updated value)
- `note`: String, optional
- `createdAt`: Date, default: Date.now

**Indexes:**
- `{ ticketId: 1, createdAt: -1 }` (chronological ticket activity timeline)
- `{ actorId: 1, createdAt: -1 }` (actions performed by a user)

---

## 2. Entity Relationships

```text
User (Student)
   |
   | creates
   v
Ticket --------------------> Category
   |
   | assigned to
   v
User (Technician)

Ticket --------------------> AuditLog
                                  |
                                  v
                              User (Actor)
```

---

## 3. Database Seeding & Setup

The seeder script (`backend/src/scripts/seed.js`) provides idempotent initialization:
- Seeds all 8 standard campus categories (`electrical`, `plumbing`, `furniture`, `classroom-equipment`, `laboratory-equipment`, `internet-wifi`, `cleaning-sanitation`, `other`).
- Supports initial `ADMIN` and `TECHNICIAN` account creation from environment variables (`INITIAL_ADMIN_*`, `INITIAL_TECH_*`) or interactively (`npm run seed:backend:interactive`).
- Passwords are encrypted with `bcryptjs` using a salt work factor of 12.
- Never overwrites credentials for existing user accounts.

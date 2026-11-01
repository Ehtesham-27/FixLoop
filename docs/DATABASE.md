# FixLoop — Database Schema & Data Models

FixLoop utilizes MongoDB with Mongoose ODM. Schemas enforce data integrity, normalization, and safe access control.

## 1. Collections & Schemas

### 1.1 `users`
Stores user identities, credentials, and roles.
- `_id`: ObjectId (Primary Key)
- `name`: String, required, trim, 2-100 characters
- `email`: String, required, unique, trim, lowercase, index
- `passwordHash`: String, required, select: false (hidden by default)
- `role`: String enum (`['STUDENT', 'TECHNICIAN', 'ADMIN']`), default: `STUDENT`
- `isActive`: Boolean, default: true
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

**Indexes:**
- Unique index on `email`

### 1.2 `tickets`
Stores campus maintenance issue tickets.
- `_id`: ObjectId (Primary Key)
- `ticketCode`: String, unique sparse (e.g., `FL-000101`)
- `title`: String, required, trim, 5-150 characters
- `description`: String, required, trim, max 2000 characters
- `category`: String, required (e.g. Electrical, Plumbing, HVAC)
- `building`: String, required, max 100 characters
- `room`: String, required, max 100 characters
- `priority`: String enum (`['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']`), default: `MEDIUM`
- `status`: String enum (`['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']`), default: `OPEN`
- `reportedBy`: ObjectId ref `User`, required, index
- `assignedTo`: ObjectId ref `User`, nullable, index
- `images`: Array of Image subdocuments:
  - `filename`: String
  - `originalName`: String
  - `mimeType`: String
  - `size`: Number
  - `url`: String
- `resolutionNote`: String, optional
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

**Indexes:**
- Compound index: `{ status: 1, priority: 1 }`
- Single index: `{ reportedBy: 1 }`
- Single index: `{ assignedTo: 1 }`
- Index: `{ createdAt: -1 }`

### 1.3 `categories`
Stores allowed maintenance categories.
- `_id`: ObjectId (Primary Key)
- `name`: String, required, unique, trim (e.g. Electrical, Plumbing)
- `description`: String, optional
- `isActive`: Boolean, default: true
- `createdAt`: Date (timestamp)
- `updatedAt`: Date (timestamp)

### 1.4 `auditlogs`
Immutable record of ticket updates and state transitions.
- `_id`: ObjectId (Primary Key)
- `ticketId`: ObjectId ref `Ticket`, required, index
- `actorId`: ObjectId ref `User`, required, index
- `action`: String, required (`CREATED`, `ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`)
- `oldValue`: Mixed (previous state/value)
- `newValue`: Mixed (updated state/value)
- `createdAt`: Date, default: Date.now, index

---

## 2. Relationships

- `tickets.reportedBy` -> `users._id` (One User has Many Tickets)
- `tickets.assignedTo` -> `users._id` (One Technician has Many Assigned Tickets)
- `auditlogs.ticketId` -> `tickets._id` (One Ticket has Many AuditLogs)
- `auditlogs.actorId` -> `users._id` (One User produces Many AuditLogs)


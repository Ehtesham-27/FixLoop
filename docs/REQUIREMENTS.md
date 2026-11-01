# FixLoop — Requirements Specification

## 1. Project Title & Overview
**FixLoop: A Responsive Campus Maintenance and Issue Management System**  
FixLoop is a responsive web application designed for campus environments (colleges, universities). It enables students and faculty to submit maintenance issue reports (e.g. electrical faults, plumbing problems, broken lab projectors), enables campus administrators to review, prioritize, and assign tickets to technician staff, and allows technicians to track and update the status of their assigned tasks until resolution.

## 2. Core Personas & Roles

### 2.1 Student / Faculty (Role: `STUDENT`)
- Register and securely log in.
- Submit maintenance tickets with location, category, description, and suggested priority.
- Attach optional photo evidence of the issue.
- View their own submitted tickets and current resolution progress.
- Access ticket detail view with location and status.

### 2.2 Technician (Role: `TECHNICIAN`)
- Log in and view their assigned work queue.
- View ticket details, campus building/room location, and reported issue details.
- Update ticket status strictly following the lifecycle: `OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`.
- Append resolution notes upon fixing the problem.

### 2.3 Administrator (Role: `ADMIN`)
- View full campus maintenance overview and all tickets.
- Filter tickets by status, priority, and location.
- Assign tickets to specific technicians.
- Adjust ticket priority level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Monitor user accounts and system audit trails.

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Lucide React icons.
- **Backend:** Node.js, Express.js (ES Modules), Mongoose ODM, Zod, bcryptjs, jsonwebtoken, Multer, Helmet, express-rate-limit, cors, cookie-parser, dotenv.
- **Database:** MongoDB (Local instance or MongoDB Atlas).

## 4. MVP Lifecycle Rules & State Machine

Tickets progress strictly through four finite states:
1. `OPEN`: Newly reported ticket, awaiting administrator review and technician assignment.
2. `ASSIGNED`: Technician has been assigned by an administrator.
3. `IN_PROGRESS`: Technician has commenced work on the issue.
4. `RESOLVED`: Maintenance has completed, resolution note added.

Invalid status jumps (such as `OPEN` straight to `RESOLVED` by client) are rejected by server-side validation.

## 5. Scope Boundaries (Strict MVP)
To maintain project focus, the MVP excludes:
- Real-time chat or AI bots
- Payment gateways
- Spare parts inventory tracking
- Automatic technician auto-allocation algorithms
- Native mobile app wrappers (responsive mobile web is used instead)


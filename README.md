# FixLoop: Responsive Campus Maintenance and Issue Management System

FixLoop is a production-ready, full-stack campus maintenance management platform built with the MERN stack (React 18 + TypeScript + Vite on frontend; Node.js + Express ES Modules + MongoDB Atlas on backend). It provides an intuitive, responsive web experience for students, technicians, and administrators to report, triage, assign, and resolve campus issues efficiently.

---

## 1. Core Capabilities & Workflows

- **Student Portal:**
  - Campus issue reporting with live category selection, building, and room specification.
  - Multi-image photo attachment support (JPEG, PNG, WebP up to 5MB) with client-side preview and remove actions.
  - My Tickets dashboard with real-time status pills, priority indicators, and pagination.
  - Detailed ticket view with complete activity timeline, technician resolution notes, and photo galleries.
- **Technician Portal:**
  - Dedicated assigned work queue (`GET /api/tickets/assigned`).
  - Strict state-machine progression: `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`.
  - Mandatory resolution note entry (>= 5 characters) with automatic timestamping upon issue closure.
- **Administrator Portal:**
  - Real-time campus maintenance metrics (Total, Open, Assigned, In Progress, Resolved, Critical).
  - Triage queue for unassigned issues (`OPEN` status).
  - Complete campus ticket directory with filtering by status, priority, category, and text search.
  - Active technician assignment and reassignment modals.
  - Ticket priority escalation (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - Campus user directory with role badges and account statuses.
- **Security & Reliability:**
  - Bcrypt password hashing (work factor 12).
  - Short-lived JWT access tokens (15m) paired with rotating `HttpOnly`, `SameSite=Strict` refresh cookies (7d).
  - Automatic refresh token reuse detection and instant session revocation.
  - Complete immutable audit logging (`AuditLog` collection) for every status transition and priority update.
  - Anti-IDOR server-side ownership enforcement and NoSQL injection mitigation.
  - Multi-layer file upload validation (MIME, extension, 5MB limit, randomized safe filenames).

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (calm, minimal campus utility aesthetic)
- **Routing:** React Router v6 with role-based `ProtectedRoute` guards
- **HTTP Client:** Axios with automated token refresh queue interceptor
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express.js (ES Modules)
- **Database & ODM:** MongoDB Atlas via Mongoose 8
- **Validation:** Zod schemas for request body, query, and params
- **Security:** Helmet (CORP cross-origin), bcryptjs, jsonwebtoken, express-rate-limit, cors, cookie-parser
- **File Upload:** Multer local disk storage with cryptographic hex naming

---

## 3. Project Architecture & State Machine

```
   Student Reports Issue (OPEN)
             │
             ▼
   Admin Assigns Technician ────────► Status: ASSIGNED
             │
             ▼
   Assigned Tech Clicks "Start Work" ─► Status: IN_PROGRESS
             │
             ▼
   Assigned Tech Resolves with Note ──► Status: RESOLVED (resolvedAt recorded)
```

For in-depth architectural specifications, see [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md).

---

## 4. Documentation Index

Comprehensive engineering documents are located in the [`docs/`](docs/) directory:

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — Product specifications, functional requirements, and phase milestones.
- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) — System design, layered architecture, data flows, and state machines.
- [`docs/API.md`](docs/API.md) — Complete REST API contract, endpoints, request/response schemas, and error formats.
- [`docs/DATABASE.md`](docs/DATABASE.md) — Mongoose schemas, compound indexes, relations, and idempotent seeder guide.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Defense-in-depth architecture, JWT rotation, IDOR defense, and sanitization.
- [`docs/UI-UX.md`](docs/UI-UX.md) — Design system, color tokens, responsive breakpoints, and screen inventory.
- [`docs/TESTING.md`](docs/TESTING.md) — Automated testing strategy, test suite breakdown (160 assertions), and E2E flow.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Production deployment guide for MongoDB Atlas, Render (backend), and Vercel (frontend).

---

## 5. Quickstart & Local Setup

### Prerequisites
- Node.js v20+ LTS
- npm v10+
- MongoDB Community Server running locally OR a MongoDB Atlas cluster URI

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd "Full Stack 2"

# Install monorepo dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Environment Configuration
**Backend:**
Copy `backend/.env.example` to `backend/.env` and supply your database connection and secrets:
```dotenv
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/fixloop?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

**Frontend:**
Copy `frontend/.env.example` to `frontend/.env`:
```dotenv
VITE_API_BASE_URL=http://localhost:5001/api
```

### 3. Database Seeding
Seed initial maintenance categories and optional administrative accounts:
```bash
npm run seed:backend
```

### 4. Running Development Servers
Start both servers simultaneously in separate terminals:
```bash
# Terminal 1: Backend API (runs on http://localhost:5001)
npm run dev:backend

# Terminal 2: Frontend Client (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 6. Automated Testing & Verification

FixLoop includes 5 automated backend integration suites (running against live MongoDB) and full frontend quality checks:

```bash
# Run all automated backend tests (160 assertions)
npm test

# Run individual test suites
npm run test:db        # Database schemas, compound indexes, & connection
npm run test:auth      # Student registration, login, JWT rotation, & RBAC
npm run test:tickets   # Ticket workflow, state machine, ownership, & audit
npm run test:upload    # Multer photo upload, size & MIME type validation
npm run test:e2e       # Full 12-step multi-role end-to-end scenario

# Run frontend checks
npm run typecheck      # TypeScript static type check (tsc --noEmit)
npm run lint           # ESLint code quality check
npm run build          # Production Vite bundle build
```

---

## 7. User Roles Matrix

| Feature / Action | Student | Technician | Administrator |
|---|:---:|:---:|:---:|
| Register account | Self-registration | Admin created | Admin / Seeded |
| Report issue with photos | Yes | No | Yes |
| View own reported tickets | Yes | No | Yes |
| View assigned tickets | No | Yes (assigned only) | Yes (all) |
| View global campus queue | No | No | Yes |
| Assign / Reassign staff | No | No | Yes |
| Change ticket priority | No | No | Yes |
| Start work (`IN_PROGRESS`) | No | Yes (if assigned) | Yes |
| Resolve ticket with notes | No | Yes (if assigned) | Yes |
| View user directory | No | No | Yes |
| View campus analytics | No | No | Yes |

---

## 8. License

Developed for the Campus Maintenance and Issue Management System project.  
License: ISC

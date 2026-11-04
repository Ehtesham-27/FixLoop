# FixLoop: Responsive Campus Maintenance and Issue Management System

FixLoop is a production-ready, full-stack campus maintenance management platform built with the MERN stack (React 18 + TypeScript + Vite on frontend; Node.js + Express ES Modules + MongoDB Atlas on backend). It provides an intuitive, responsive web experience for students, technicians, and administrators to report, triage, assign, and resolve campus issues efficiently.

---

## 1. Core Capabilities & Features

- **Student Portal:**
  - Campus issue reporting with live category selection, building, and room specification.
  - Multi-image photo attachment support (JPEG, PNG, WebP up to 5MB) with client-side preview and remove actions.
  - My Tickets dashboard with real-time status pills, priority indicators, SLA badges, and pagination.
  - Detailed ticket view with complete activity timeline, technician resolution notes, photo galleries, and SLA status.

- **Technician Portal:**
  - Dedicated assigned work queue (`GET /api/tickets/assigned`).
  - Real-time SLA deadline tracking and overdue warning indicators.
  - Strict state-machine progression: `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`.
  - Mandatory resolution note entry (>= 5 characters) with automatic timestamping upon issue closure.

- **Administrator Portal:**
  - Real-time campus maintenance metrics (Total, Open, Assigned, In Progress, Resolved, Critical).
  - SLA Overview metrics dashboard (Total Unresolved, On Track, At Risk, Overdue, Resolved On Time, Resolved Late, Compliance Rate %).
  - Triage queue for unassigned issues (`OPEN` status).
  - Complete campus ticket directory with multi-criteria filtering by status, priority, category, SLA status, and keyword search.
  - Active technician assignment and reassignment modals.
  - Secure technician account provisioning with temporary passwords and audit logging.
  - Ticket priority escalation (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with automatic SLA recalculation.
  - Campus user directory with role badges and account statuses.

- **SLA & Overdue Engine:**
  - Centralized SLA target hours: Critical (2h), High (8h), Medium (24h), Low (72h).
  - Deterministic SLA statuses: `ON_TRACK`, `AT_RISK` (<= 20% window remaining), `OVERDUE`, `RESOLVED_ON_TIME`, and `RESOLVED_LATE`.
  - Compound MongoDB index on `{ dueAt: 1, status: 1 }` for high-performance overdue filtering.
  - Idempotent legacy migration utility that backfills SLA targets on existing tickets at server startup without altering `createdAt`.

- **Security & Storage:**
  - Bcrypt password hashing (work factor 12).
  - Short-lived JWT access tokens (15m) paired with rotating `HttpOnly`, `SameSite=Strict/None` refresh cookies (7d).
  - Automatic refresh token reuse detection and instant session revocation.
  - Complete immutable audit logging (`AuditLog` collection) for all status transitions and priority updates.
  - Dual-mode image storage: Cloudinary CDN in production with local disk storage in development.
  - Anti-IDOR server-side ownership enforcement, NoSQL injection mitigation, and Zod input validation.

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
- **Runtime:** Node.js (v22 LTS)
- **Framework:** Express.js (ES Modules)
- **Database & ODM:** MongoDB Atlas via Mongoose 8
- **Validation:** Zod schemas for request body, query, and params
- **Security:** Helmet, bcryptjs, jsonwebtoken, express-rate-limit, cors, cookie-parser
- **File Upload:** Multer with Cloudinary CDN storage (production) / disk storage (development)

---

## 3. Project Structure

```
FixLoop/
├── .github/                      # CI/CD workflows
├── backend/                      # Express.js REST API
│   ├── src/
│   │   ├── config/               # Environment, database, & Cloudinary config
│   │   ├── constants/            # Roles, priorities, ticket status, & SLA constants
│   │   ├── controllers/          # Request handlers (auth, ticket, admin, user)
│   │   ├── middleware/           # Auth, RBAC, error handling, validation, upload
│   │   ├── models/               # Mongoose schemas (User, Ticket, Category, AuditLog)
│   │   ├── routes/               # Express route definitions
│   │   ├── scripts/              # Database seeder scripts
│   │   ├── services/             # Core business logic (auth, ticket, SLA, audit)
│   │   ├── utils/                # Token utilities, error classes, SLA backfill
│   │   ├── validators/           # Zod request validators
│   │   ├── app.js                # Express app setup & middleware pipeline
│   │   └── server.js             # Server startup & graceful shutdown
│   ├── tests/                    # Integration & unit test suites (8 suites)
│   ├── uploads/                  # Local uploads storage directory (.gitkeep)
│   ├── package.json              # Backend dependencies & test scripts
│   └── .env.example              # Backend environment template
├── frontend/                     # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # UI components (common, feedback, layout, sla, tickets)
│   │   ├── constants/            # Frontend theme tokens, status colors, SLA constants
│   │   ├── context/              # React AuthContext & session management
│   │   ├── hooks/                # Custom hooks (useAuth)
│   │   ├── layouts/              # AppLayout (nav/sidebar) & AuthLayout
│   │   ├── pages/                # Route pages (auth, student, technician, admin, errors)
│   │   ├── routes/               # AppRoutes & ProtectedRoute role guards
│   │   ├── services/             # Axios API service clients
│   │   ├── styles/               # Tailwind CSS entrypoint
│   │   ├── types/                # TypeScript interfaces & domain types
│   │   ├── utils/                # Formatting & string helper utilities
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Application entrypoint
│   ├── package.json              # Frontend dependencies
│   ├── vercel.json               # Vercel SPA routing & backend API proxy rewrite
│   ├── vite.config.ts            # Vite build configuration
│   └── .env.example              # Frontend environment template
├── docs/                         # Engineering specifications & architectural documentation
│   ├── API.md                    # REST API contract & endpoints
│   ├── DATABASE.md               # MongoDB schema & indexing design
│   ├── DEPLOYMENT.md             # Render & Vercel deployment guide
│   ├── PROJECT_ARCHITECTURE.md   # Architectural design & data flows
│   ├── REQUIREMENTS.md           # Product requirements specification
│   ├── SECURITY.md               # Security model & defense-in-depth
│   ├── TESTING.md                # Testing strategy & suite breakdown
│   └── UI-UX.md                  # Design system & wireframe specifications
├── render.yaml                   # Render Infrastructure-as-Code blueprint
├── package.json                  # Monorepo root workspaces & orchestrator scripts
├── LICENSE                       # Project license (ISC)
└── README.md                     # Main project documentation
```

---

## 4. Documentation Index

Comprehensive engineering documents are located in the [`docs/`](docs/) directory:

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — Product specifications, functional requirements, and phase milestones.
- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) — System design, layered architecture, data flows, and state machines.
- [`docs/API.md`](docs/API.md) — Complete REST API contract, endpoints, request/response schemas, and error formats.
- [`docs/DATABASE.md`](docs/DATABASE.md) — Mongoose schemas, compound indexes, relations, and idempotent seeder guide.
- [`docs/SECURITY.md`](docs/SECURITY.md) — Defense-in-depth architecture, JWT rotation, IDOR defense, and sanitization.
- [`docs/UI-UX.md`](docs/UI-UX.md) — Design system, color tokens, responsive breakpoints, and screen inventory.
- [`docs/TESTING.md`](docs/TESTING.md) — Automated testing strategy, test suite breakdown, and E2E flow.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Production deployment guide for MongoDB Atlas, Render (backend), and Vercel (frontend).

---

## 5. Quickstart & Local Setup

### Prerequisites
- Node.js v22+ LTS
- npm v10+
- MongoDB Community Server running locally OR a MongoDB Atlas cluster URI
- (Optional) Free Cloudinary account for photo uploads

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Ehtesham-27/FixLoop.git
cd FixLoop

# Install all monorepo dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Environment Configuration

Refer to the template files for local configuration:
- **Backend:** Copy `backend/.env.example` to `backend/.env` and configure your local settings.
- **Frontend:** Copy `frontend/.env.example` to `frontend/.env` and configure your API endpoint.

> [!NOTE]
> All `.env` files are strictly ignored by Git and must never be committed or reflected in documentation.

### 3. Database Seeding
Seed initial maintenance categories and optional administrative accounts:
```bash
npm run seed:backend
```

### 4. Running Development Servers
Start both servers simultaneously in separate terminals:
```bash
# Terminal 1: Backend API (http://localhost:5001)
npm run dev:backend

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:frontend
```

## 6. Automated Testing & Verification

FixLoop includes 8 automated backend test suites (281 assertions executing against live MongoDB) and full frontend quality checks:

```bash
# Run all automated backend tests (281 assertions)
npm test

# Run individual test suites
npm run test:db          # Database schemas, compound indexes, & connection
npm run test:auth        # Student registration, login, JWT rotation, & RBAC
npm run test:tickets     # Ticket workflow, state machine, ownership, & audit
npm run test:upload      # Multer photo upload, size & MIME type validation
npm run test:e2e         # Full multi-role end-to-end scenario
npm run test:cloudinary  # Cloudinary buffer upload & CSRF origin verification
npm run test:admin-tech  # Admin technician account provisioning & RBAC
npm run test:sla         # SLA calculation rules, overdue lifecycle, & deadlines

# Run frontend quality gates
npm run typecheck        # TypeScript static type check (tsc --noEmit)
npm run lint             # ESLint code quality check
npm run build            # Production Vite bundle build
```

---

## 7. Deployment Overview

FixLoop is designed for a ₹0/month production deployment:

- **Frontend (Vercel):**
  - Hosted on Vercel with SPA rewrite rules in `frontend/vercel.json`.
  - Production URL: `https://fix-loop-livid.vercel.app`
  - Rewrites `/api/:path*` requests directly to the Render backend to prevent cross-origin cookie issues.

- **Backend (Render):**
  - Hosted as a Node.js web service on Render Free Tier (`render.yaml`).
  - Production URL: `https://fixloop.onrender.com`
  - Automated health check at `/api/health`.

- **Database (MongoDB Atlas):**
  - M0 Free Cluster in AWS region.
  - Automated compound indexes and TLS encrypted connection string.

- **Media Storage (Cloudinary):**
  - Free Tier Cloudinary image storage with automatic CDN distribution and unique file IDs.

---

## 8. License

Developed for the Campus Maintenance and Issue Management System project.  
License: ISC

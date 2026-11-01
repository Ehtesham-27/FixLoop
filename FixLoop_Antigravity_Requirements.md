# FixLoop --- Project Requirements and Antigravity Build Instructions

**Project title:** FixLoop: A Responsive Campus Maintenance and Issue
Management System\
**Project type:** College full-stack web application\
**Build approach:** Modular monolith, responsive web application\
**Status:** Initial project scaffold and foundation

------------------------------------------------------------------------

## 1. Instruction to Antigravity

Act as a senior full-stack engineer. Set up the FixLoop repository
according to this specification.

**Primary task:** Inspect the existing repository first, then create the
complete folder structure, configuration files, starter files,
dependencies, scripts, and documentation needed for the project.

### Important execution rules

1.  Do not delete, overwrite, or rename existing user files without
    checking their contents and explaining why a change is needed.
2.  If a React frontend or Express backend already exists, extend it
    instead of generating a duplicate application.
3.  Do not create multiple competing implementations of the same
    feature.
4.  Use JavaScript only for the Express backend and TypeScript for the
    React frontend.
5.  Use MongoDB with Mongoose. Do not introduce MySQL, Prisma, Java,
    Spring Boot, or a separate microservice.
6.  Do not hardcode secrets, database credentials, JWT keys, or
    production URLs.
7.  Create `.env.example` files with placeholder values, and ensure real
    `.env` files are ignored by Git.
8.  Add clear README instructions and useful npm scripts.
9.  Keep the architecture understandable for a college project and
    achievable as a small MVP.
10. After setup, run the available install, lint, type-check, and build
    commands. Report exactly what succeeded and what remains incomplete.
11. Do not claim that authentication, uploads, security, or APIs are
    implemented merely because placeholder files exist.
12. For this initial task, prioritize a working project scaffold and
    configuration. Implement business features in later steps unless
    explicitly asked to do them now.

------------------------------------------------------------------------

## 2. Product overview

FixLoop is a responsive web-based campus maintenance platform. Students
and faculty report problems in campus facilities. Administrators review
reports and assign maintenance staff. Technicians update the progress
and resolution of assigned issues. Reporters can track their own
requests.

Example issues include:

-   Broken classroom projector
-   Faulty ceiling fan or light
-   Water leakage
-   Damaged classroom furniture
-   Laboratory equipment issue
-   Wi-Fi or network problem

### Product goals

-   Make reporting campus problems simple.
-   Make ticket ownership and assignment clear.
-   Let users track progress.
-   Provide a simple interface for laptop, tablet, and mobile.
-   Demonstrate core full-stack concepts and practical security.

### Keep the MVP deliberately small

Do not add AI, chat, payments, inventory management, native mobile apps,
microservices, predictive maintenance, or automatic technician
allocation.

------------------------------------------------------------------------

## 3. Technology stack --- fixed decisions

### Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router
-   Axios
-   Lucide React icons

### Backend

-   Node.js (use a current supported LTS release)
-   Express.js
-   JavaScript modules (ESM)
-   Mongoose ODM
-   Zod for request validation
-   bcryptjs for password hashing
-   jsonwebtoken for JWT handling
-   Multer for multipart image uploads
-   Helmet for security headers
-   express-rate-limit for rate limiting
-   cors for controlled cross-origin access
-   cookie-parser if the chosen authentication design uses cookies
-   dotenv for environment variables

### Database

-   MongoDB, either local development MongoDB or MongoDB Atlas
-   Mongoose schemas and indexes
-   MongoDB ObjectId references between related documents

### Development and quality tools

-   Git and GitHub
-   ESLint
-   Prettier (optional but recommended)
-   Nodemon for backend development
-   Postman or an equivalent API client
-   Vitest / React Testing Library for frontend tests (can be added
    during implementation)
-   Node test runner or Jest/Vitest/Supertest for backend tests (choose
    one consistent setup)

Do not add a package just because it is popular. Keep dependencies
minimal and document their purpose.

------------------------------------------------------------------------

## 4. User roles

The application has exactly three roles in the MVP.

### 4.1 STUDENT

-   Register and log in.
-   Create a maintenance ticket.
-   Add an optional issue photograph.
-   View their own tickets.
-   View ticket details and status.
-   View relevant activity for their own tickets.
-   Edit or cancel a ticket only if the defined business rules permit
    it.

### 4.2 TECHNICIAN

-   Log in.
-   View tickets assigned to them.
-   View ticket details and location.
-   Update the status of tickets assigned to them.
-   Add a resolution note.
-   View relevant ticket activity.

### 4.3 ADMIN

-   Log in.
-   View all tickets.
-   Filter and search tickets.
-   Assign a ticket to a technician.
-   Change ticket priority.
-   Manage or deactivate user accounts.
-   View basic activity/audit records.
-   View a concise overview of campus maintenance requests.

Faculty can use the STUDENT role in the MVP. Do not create a fourth role
unless explicitly requested.

------------------------------------------------------------------------

## 5. Core MVP features

Create the project structure to support these modules:

1.  Authentication and user management
2.  Ticket / issue reporting
3.  Ticket listing and details
4.  Technician assignment
5.  Ticket status management
6.  Priority management
7.  Basic activity history / audit logs
8.  Role-specific dashboards
9.  Responsive UI
10. Basic validation and error handling

### Ticket fields

A ticket should support:

-   Unique MongoDB `_id`
-   Optional human-readable ticket reference, such as `FL-000123`
-   Title
-   Description
-   Category
-   Building
-   Room or specific location
-   Priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
-   Status: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`
-   Reporter reference (`reportedBy`)
-   Assigned technician reference (`assignedTo`, nullable)
-   Image metadata / storage references (optional array)
-   Resolution note (optional)
-   Created and updated timestamps

New tickets should start with `OPEN` status. The backend, not the
frontend, must control status transitions.

### Status transition rules

Keep the MVP to four statuses:

-   `OPEN`
-   `ASSIGNED`
-   `IN_PROGRESS`
-   `RESOLVED`

Expected flow:

`OPEN → ASSIGNED → IN_PROGRESS → RESOLVED`

The backend must reject invalid transitions. An administrator may be
allowed to make an explicitly documented corrective transition. Do not
let clients freely set arbitrary status values.

### Priority rules

-   `LOW`
-   `MEDIUM`
-   `HIGH`
-   `CRITICAL`

A reporter may suggest a priority at creation if desired. Admin has
final authority to change priority. Every priority change should be
recorded in activity history.

------------------------------------------------------------------------

## 6. Required repository structure

Create or adapt the following structure. If an existing project already
uses a sensible equivalent, preserve it and explain the mapping rather
than duplicating it.

``` text
FixLoop/
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── tickets/
│   │   │   └── feedback/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── technician/
│   │   │   ├── admin/
│   │   │   └── errors/
│   │   ├── layouts/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Ticket.js
│   │   │   ├── Category.js
│   │   │   └── AuditLog.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── ticket.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── ticket.service.js
│   │   │   └── audit.service.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── ticket.routes.js
│   │   │   └── admin.routes.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   ├── validate.js
│   │   │   ├── upload.js
│   │   │   ├── not-found.js
│   │   │   └── error-handler.js
│   │   ├── validators/
│   │   │   ├── auth.validators.js
│   │   │   └── ticket.validators.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   └── async-handler.js
│   │   ├── constants/
│   │   │   ├── roles.js
│   │   │   ├── ticket-status.js
│   │   │   └── priorities.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── uploads/
│   │   └── .gitkeep
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── UI-UX.md
│
├── .gitignore
├── README.md
└── LICENSE (optional)
```

### Structure rules

-   Keep route definitions separate from controllers.
-   Keep business rules in services, not directly in route files.
-   Keep Mongoose models in `models/`.
-   Keep authentication and authorization middleware separate.
-   Keep shared enums/constants in one place.
-   Keep frontend API calls in `services/`.
-   Keep reusable UI elements in `components/`.
-   Do not create empty folders without a purpose. Add a short README or
    `.gitkeep` only when needed.
-   Do not create placeholder files pretending to implement a feature.
    Use clearly named TODOs where implementation is pending.

------------------------------------------------------------------------

## 7. Backend configuration requirements

### Backend package scripts

Set up appropriate scripts similar to:

``` json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js"
  }
}
```

Add lint/test scripts when the corresponding tools and configuration are
installed. Ensure the scripts actually work.

### Backend environment example

Create `backend/.env.example` with safe placeholders:

``` dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fixloop
CLIENT_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

Do not place real secrets in this file. Validate required environment
variables at startup and fail with a clear message if critical
configuration is missing.

### Backend startup behavior

-   Load and validate environment variables.
-   Connect to MongoDB before accepting requests.
-   Create the Express app in `app.js`.
-   Start the HTTP server in `server.js`.
-   Add a simple health endpoint: `GET /api/health`.
-   Configure JSON parsing, security headers, CORS and request limits.
-   Register routes under `/api`.
-   Add a not-found handler and centralized error handler.
-   Handle database connection errors clearly.
-   Do not expose stack traces in production responses.

------------------------------------------------------------------------

## 8. MongoDB / Mongoose requirements

Create Mongoose schemas for:

### User

Suggested fields:

-   `name`
-   `email` (unique, normalized and indexed)
-   `passwordHash`
-   `role` (`STUDENT`, `TECHNICIAN`, `ADMIN`)
-   `isActive`
-   timestamps

Never return `passwordHash` in API responses. Use schema selection or
explicit response serializers to prevent accidental disclosure.

### Ticket

Suggested fields:

-   `title`
-   `description`
-   `category`
-   `building`
-   `room`
-   `priority`
-   `status`
-   `reportedBy` (User ObjectId reference)
-   `assignedTo` (User ObjectId reference, nullable)
-   `images` (array of safe metadata/storage references)
-   `resolutionNote`
-   timestamps

### Category

Suggested fields:

-   `name`
-   `description`
-   `isActive`

### AuditLog

Suggested fields:

-   `ticketId`
-   `actorId`
-   `action`
-   `oldValue`
-   `newValue`
-   `createdAt`

Add useful indexes for common queries, such as email, ticket status,
priority, reporter, assigned technician and creation time. Avoid
over-indexing.

Use Mongoose validation and explicit allowed fields. Never pass
untrusted request bodies directly into MongoDB query filters or update
operators.

------------------------------------------------------------------------

## 9. API design requirements

Create and document these planned endpoints. They do not all need full
business implementation during initial scaffolding, but route files and
API documentation should follow this contract.

  -----------------------------------------------------------------------------
  Method                  Endpoint                      Intended access
  ----------------------- ----------------------------- -----------------------
  POST                    `/api/auth/register`          Public or controlled
                                                        registration

  POST                    `/api/auth/login`             Public

  POST                    `/api/auth/refresh`           Valid refresh session

  POST                    `/api/auth/logout`            Authenticated

  GET                     `/api/auth/me`                Authenticated

  POST                    `/api/tickets`                Student / Admin

  GET                     `/api/tickets/my`             Student

  GET                     `/api/tickets/assigned`       Technician

  GET                     `/api/tickets`                Admin

  GET                     `/api/tickets/:id`            Authorized owner /
                                                        assignee / Admin

  PATCH                   `/api/tickets/:id/assign`     Admin

  PATCH                   `/api/tickets/:id/status`     Assigned Technician /
                                                        Admin

  PATCH                   `/api/tickets/:id/priority`   Admin

  GET                     `/api/tickets/:id/activity`   Authorized owner /
                                                        assignee / Admin

  GET                     `/api/admin/users`            Admin

  GET                     `/api/admin/overview`         Admin
  -----------------------------------------------------------------------------

### API conventions

-   Use JSON for ordinary requests and responses.
-   Use multipart form data only for image upload requests.
-   Return appropriate HTTP status codes.
-   Use a consistent response/error shape.
-   Validate pagination limits and allowed sort/filter fields.
-   Do not reveal whether another user's private ticket exists if that
    would leak information.
-   Never rely on frontend route guards as the only authorization
    mechanism.

------------------------------------------------------------------------

## 10. Security requirements

Security must be enforced by the backend.

1.  Hash passwords with bcryptjs using a suitable work factor.
2.  Verify JWT signature, expiry and expected claims.
3.  Keep secrets in environment variables.
4.  Use short-lived access tokens.
5.  If refresh tokens are used, store them in Secure, HttpOnly, SameSite
    cookies in production, and implement rotation/revocation. Apply CSRF
    protection appropriate to the cookie-based design.
6.  Enforce role-based authorization on protected endpoints.
7.  Enforce resource-level ownership and assignment checks.
8.  Validate and normalize all input on the server.
9.  Prevent NoSQL injection by using explicit query construction and
    allow-listed fields.
10. Apply rate limits to login and sensitive endpoints.
11. Configure CORS to allow only the intended frontend origin(s).
12. Use Helmet and sensible HTTP security headers.
13. Limit image size and allowed file types; validate file content, not
    just filename extension or MIME header.
14. Generate safe random filenames and do not trust user-supplied paths.
15. Never expose password hashes, secrets, stack traces or internal
    database errors.
16. Do not allow users to set their own role through public
    registration.
17. Do not allow a student to access another student's ticket.
18. Do not allow a technician to update tickets not assigned to them
    unless an explicitly defined admin override applies.
19. Record important assignment, status and priority changes in audit
    history.
20. Ensure `.env`, uploads containing private user data, build output
    and dependencies are excluded from Git.

------------------------------------------------------------------------

## 11. Frontend requirements

### Main screens

Create route/page scaffolding for:

-   Login
-   Register
-   Student dashboard
-   Create issue / report issue
-   My reports
-   Ticket details
-   Technician dashboard / assigned work
-   Admin dashboard
-   Admin ticket management
-   Profile
-   Not found / unauthorized pages

### Frontend organization

-   Use reusable components.
-   Keep API logic outside page components.
-   Define TypeScript types for users, tickets, API responses and
    errors.
-   Use protected routes for user experience, while remembering that
    backend authorization is authoritative.
-   Handle loading, empty, success and error states.
-   Use accessible form labels and keyboard-friendly controls.
-   Avoid unnecessary global state libraries for the MVP.

### Visual design direction

FixLoop should look like a calm, minimal campus utility product, not a
generic admin template.

-   Warm off-white page background.
-   Dark navy / charcoal typography.
-   Blue primary action color.
-   Inter or a similar clean sans-serif font.
-   Subtle borders and restrained shadows.
-   Clear typography hierarchy and generous spacing.
-   Minimal decoration and no unnecessary charts.
-   Consistent status labels and priority indicators.

### Role-specific dashboard intent

**Student / Faculty** - A clear greeting. - Prominent "Report an issue"
action. - Concise list of the user's own requests. - Visible ticket
status and location. - No unnecessary analytics cards.

**Technician** - Prioritized assigned-work queue. - Issue title,
location, priority and current status. - Quick access to ticket details
and status update. - No admin-only controls.

**Admin** - Unassigned and urgent issues should be prominent. - Concise
all-ticket overview. - Quick technician assignment. - Filters for status
and priority. - Basic staff/user management. - Avoid decorative charts
unless they provide useful information.

------------------------------------------------------------------------

## 12. Responsive design requirements

The same React application must work on laptops, tablets and phones. Do
not create a separate mobile application.

Suggested breakpoints:

-   Mobile: below 640px
-   Tablet: 640px to 1023px
-   Desktop: 1024px and above

### Desktop

-   Compact left sidebar.
-   Main content area with comfortable maximum width.
-   Ticket tables or structured lists where appropriate.
-   Multi-column dashboard layout only when useful.

### Mobile

-   Compact top header.
-   Bottom navigation for the main sections.
-   Single-column content.
-   Ticket cards instead of wide tables.
-   Full-width forms and buttons where appropriate.
-   Touch-friendly controls.
-   No horizontal page overflow.
-   Images should scale within their containers.
-   Long forms should remain usable with a clear submit action.

Test at minimum widths of 375px, 768px and 1366px.

------------------------------------------------------------------------

## 13. Git and repository hygiene

Create a root `.gitignore` that excludes at minimum:

``` gitignore
node_modules/
dist/
build/
.env
.env.*
!.env.example
.DS_Store
*.log
coverage/
backend/uploads/*
!backend/uploads/.gitkeep
```

If the repository already has a `.gitignore`, merge rules carefully
rather than replacing it blindly.

Do not commit: - Real database connection strings - JWT secrets -
User-uploaded private files - `node_modules` - Build output - Local
editor or operating-system noise

Use meaningful commits, for example:

-   `chore: initialize FixLoop monorepo`
-   `chore: scaffold Express backend`
-   `chore: scaffold React frontend`
-   `docs: add project requirements and API plan`

------------------------------------------------------------------------

## 14. Root README requirements

Create a useful `README.md` containing:

1.  Project title and short description.
2.  Main features.
3.  Technology stack.
4.  User roles.
5.  Repository structure.
6.  Prerequisites.
7.  Local setup instructions.
8.  Environment variable setup.
9.  How to run frontend and backend.
10. API health-check example.
11. Security notes.
12. Screenshots section with placeholders.
13. Team / author details as placeholders.

Provide accurate commands matching the generated package scripts. Do not
include commands that have not been tested.

------------------------------------------------------------------------

## 15. Documentation files

Create the following:

-   `docs/REQUIREMENTS.md` --- project scope and requirements.
-   `docs/API.md` --- endpoint contract, access roles and sample
    request/response shapes.
-   `docs/DATABASE.md` --- collections, fields, references and indexes.
-   `docs/SECURITY.md` --- authentication, authorization and security
    controls.
-   `docs/UI-UX.md` --- design system, screen inventory and responsive
    behavior.

Keep documentation consistent with the actual code and clearly label
features that are planned but not implemented.

------------------------------------------------------------------------

## 16. Acceptance criteria for the initial scaffold

The initial setup is complete only when:

-   [ ] Existing repository has been inspected and preserved.
-   [ ] `frontend/` contains a working React + TypeScript + Vite
    application.
-   [ ] `backend/` contains a working Express application.
-   [ ] Backend uses JavaScript ESM consistently.
-   [ ] MongoDB connection configuration uses Mongoose.
-   [ ] Backend has `GET /api/health`.
-   [ ] Environment examples exist without real secrets.
-   [ ] `.gitignore` excludes secrets, dependencies and generated files.
-   [ ] Frontend and backend have usable npm scripts.
-   [ ] Root README contains accurate setup instructions.
-   [ ] Documentation files are created.
-   [ ] Frontend starts successfully.
-   [ ] Backend starts successfully.
-   [ ] Lint/type-check/build commands that are configured pass.
-   [ ] No secrets are committed.
-   [ ] No unrequested frameworks or databases have been introduced.

### Final response required from Antigravity

When finished, provide:

1.  Summary of files and folders created.
2.  Dependencies installed.
3.  Commands to start frontend and backend.
4.  MongoDB setup instructions and required environment variables.
5.  Health endpoint URL and result.
6.  Build/lint/type-check results.
7.  Any incomplete tasks or errors.
8.  Confirmation that no existing user work was overwritten.

**Do not report a feature as complete unless it has actually been
implemented and tested.**

------------------------------------------------------------------------

## 17. Recommended next implementation stages

After the scaffold is accepted, implement in this order:

1.  MongoDB connection and Mongoose models.
2.  Registration, login, logout and current-user API.
3.  Authentication and role authorization middleware.
4.  Ticket creation and reporter-owned ticket listing.
5.  Admin assignment and technician assigned-ticket listing.
6.  Ticket status and priority updates with audit records.
7.  Secure image upload.
8.  Responsive frontend screens and API integration.
9.  Authorization, validation and responsive UI tests.
10. Final documentation and deployment.

This sequence keeps the project small, understandable and demonstrable
while covering the core full-stack and security concepts.

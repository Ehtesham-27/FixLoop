# FixLoop: Responsive Campus Maintenance and Issue Management System

FixLoop is a full-stack, responsive web application designed for universities and colleges to streamline facility issue reporting, technician task assignment, and maintenance resolution tracking.

---

## 1. Main Features

- **Issue Reporting:** Students and faculty report maintenance issues with categories, building/room locations, priority indicators, and photo attachments.
- **Role-based Portals:** Dedicated dashboards tailored for students, maintenance technicians, and campus administrators.
- **Strict Ticket Lifecycle:** Automated state progression: `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`.
- **Assignment & Prioritization:** Administrators review incoming reports, adjust priority levels, and assign work to technicians.
- **Audit History:** Full tracking of assignment and status changes for accountability.
- **Responsive Layout:** Optimized for mobile phones, tablets, and desktop workstations without duplicate mobile applications.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express.js (ES Modules)
- **Database ODM:** Mongoose (MongoDB)
- **Validation:** Zod
- **Security:** Helmet, bcryptjs, jsonwebtoken, express-rate-limit, cors, cookie-parser
- **File Handling:** Multer

---

## 3. User Roles

| Role | Responsibilities |
|---|---|
| **`STUDENT`** | Report campus facility problems, track status, view own tickets. |
| **`TECHNICIAN`** | View assigned repair tasks, update task status, append resolution notes. |
| **`ADMIN`** | View all tickets across campus, assign technicians, set priorities, manage users. |

---

## 4. Repository Structure

```text
FixLoop/
├── frontend/                     # React + TypeScript + Vite frontend
│   ├── public/                   # Static assets (favicons, etc.)
│   ├── src/
│   │   ├── components/           # Reusable UI elements (common, layout, tickets, feedback)
│   │   ├── context/              # Context providers (AuthContext)
│   │   ├── hooks/                # Custom React hooks (useAuth)
│   │   ├── layouts/              # App and Auth responsive layouts
│   │   ├── pages/                # Role-specific and auth pages
│   │   ├── routes/               # App routing and ProtectedRoute guard
│   │   ├── services/             # Axios API service clients
│   │   ├── styles/               # Tailwind CSS entry points
│   │   ├── types/                # TypeScript shared interfaces
│   │   └── utils/                # Date and text helper utilities
│   ├── .env.example              # Frontend environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Express.js backend (ES Modules)
│   ├── src/
│   │   ├── config/               # Database and environment configuration
│   │   ├── constants/            # Roles, priorities, ticket statuses
│   │   ├── controllers/          # Request handlers
│   │   ├── middleware/           # Auth, error handling, rate-limiting, upload
│   │   ├── models/               # Mongoose schemas (User, Ticket, Category, AuditLog)
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Business logic layer
│   │   ├── utils/                # ApiError and async handler
│   │   ├── validators/           # Zod schema validators
│   │   ├── app.js                # Express app setup and middleware configuration
│   │   └── server.js             # HTTP server bootstrap and graceful shutdown
│   ├── uploads/                  # Uploaded ticket photos (.gitkeep)
│   ├── .env.example              # Backend environment template
│   └── package.json
│
├── docs/                         # Specifications & Architectural Documentation
│   ├── REQUIREMENTS.md           # Product specification and MVP requirements
│   ├── API.md                    # REST API endpoints and contracts
│   ├── DATABASE.md               # MongoDB collections, schemas, and indexes
│   ├── SECURITY.md               # Security controls, auth flow, and sanitization
│   └── UI-UX.md                  # Layout guidelines and responsive design rules
│
├── .gitignore
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Project overview and setup instructions
```

---

## 5. Prerequisites

- **Node.js:** v20.x or higher LTS
- **npm:** v10.x or higher
- **MongoDB:** Local MongoDB Community Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

## 6. Local Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd "Full Stack 2"
```

### 2. Configure Environment Variables

**Backend configuration:**
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Ensure `backend/.env` has:
```dotenv
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

**Frontend configuration:**
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
Ensure `frontend/.env` has:
```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Install Dependencies

You can install all dependencies from the root monorepo:
```bash
# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

### 4. Database Setup & Seeding

FixLoop connects to MongoDB using the `MONGODB_URI` environment variable.

1. **Start MongoDB:**
   - **Local MongoDB Community Server:** Ensure MongoDB service is running on `mongodb://127.0.0.1:27017/fixloop`.
   - **MongoDB Atlas:** Obtain your cluster connection string and paste it into `backend/.env` under `MONGODB_URI`.

2. **Verify Database Models & Validation:**
   ```bash
   npm run test:db
   ```

3. **Seed Maintenance Categories & Initial Accounts:**
   - **Standard Seeding:** Seeds all 8 campus categories and any configured initial admin/technician accounts from `.env`:
     ```bash
     npm run seed:backend
     ```
   - **Interactive Seeding:** Prompts for administrator and technician credentials securely in the terminal (passwords are automatically hashed with bcrypt):
     ```bash
     npm run seed:backend:interactive
     ```
   *(Note: The seeder is idempotent. Re-running it will never create duplicate categories or overwrite existing account credentials).*

---

## 7. How to Run Frontend and Backend

### Running Backend (Development)
```bash
npm run dev --prefix backend
```
The backend server runs on `http://localhost:5000`.

### Running Frontend (Development)
```bash
npm run dev --prefix frontend
```
The frontend application runs on `http://localhost:5173`.

### Type-checking and Building
```bash
# Run backend syntax check
npm run check --prefix backend

# Run frontend typecheck
npm run typecheck --prefix frontend

# Build frontend production bundle
npm run build --prefix frontend
```

---

## 8. API Health Check

Verify that the backend is running and view database connectivity status:
```bash
curl http://localhost:5000/api/health
```
Response when connected to MongoDB:
```json
{
  "status": "ok",
  "service": "FixLoop API",
  "uptime": 12.34,
  "timestamp": "2026-11-01T14:15:00.000Z",
  "database": "connected"
}
```
Response when database is offline/unreachable:
```json
{
  "status": "degraded",
  "service": "FixLoop API",
  "uptime": 12.34,
  "timestamp": "2026-11-01T14:15:00.000Z",
  "database": "disconnected"
}
```

---

## 9. Security Notes

- Never commit `.env` or secrets to version control.
- Passwords are encrypted using `bcryptjs` with salt rounds.
- Authorization and status transitions are validated authoritatively on the backend.
- Image uploads use secure random hashes for naming and are validated for MIME type and file size.
- API endpoints are protected with Helmet security headers and rate-limiting.

---

## 10. Screenshots (Placeholders)

| Student Dashboard | Technician Work Queue | Admin Management |
|:---:|:---:|:---:|
| *(Screenshot coming soon)* | *(Screenshot coming soon)* | *(Screenshot coming soon)* |

---

## 11. Team & Authors

- **Student Developer:** College Full Stack Project Team
- **Course:** Full Stack Web Development (5th Semester)
- **License:** ISC


# FixLoop — Security Architecture & Guidelines

FixLoop implements defense-in-depth principles across all application layers.

---

## 1. Authentication & Session Security

- **Bcrypt Password Hashing:** User passwords are encrypted using `bcryptjs` with a cost factor (salt rounds) of 12. Plaintext passwords are never logged, stored, or transmitted in responses.
- **Dual-Token Architecture:**
  - **Short-Lived Access Tokens:** Signed with HMAC-SHA256 (`JWT_ACCESS_SECRET`) with a default TTL of 15 minutes. Contains minimal identity payload (`_id`, `role`, `email`).
  - **HttpOnly Refresh Tokens:** Stored exclusively in `HttpOnly`, `SameSite=Strict` cookies with `Secure` flag enabled in production. Refresh tokens cannot be read or exfiltrated by client-side JavaScript.
- **Refresh Token Rotation & Reuse Detection:**
  - Every refresh rotation issues a new random refresh token and invalidates the previous token.
  - Refresh tokens are hashed using SHA-256 before storage in MongoDB.
  - If a previously rotated token hash is presented, the system detects a potential replay/theft attack and immediately revokes all active refresh tokens for that user account.
- **Credential Sanitization:**
  - Mongoose `User` schema marks `passwordHash` and `refreshTokens` with `select: false`.
  - JSON serializer transform strips `passwordHash`, `refreshTokens`, and `__v` from all JSON responses.
- **Deactivated Account Invalidation:**
  - Authentication middleware (`authenticate.js`) verifies `isActive === true` on every request, immediately terminating access if an account is suspended.

---

## 2. Authorization & RBAC (Role-Based Access Control)

- **Strict Separation of Privileges:**
  - **`STUDENT`:** Can create tickets, inspect categories, view only their own tickets, and inspect activity logs for their tickets. Access to other students' tickets returns `404 Not Found` (preventing IDOR and resource enumeration).
  - **`TECHNICIAN`:** Can view only tickets assigned to them in `/api/tickets/assigned`. Can transition ticket status from `ASSIGNED` to `IN_PROGRESS` and `RESOLVED` with mandatory resolution notes. Cannot modify unassigned tickets or tickets assigned to colleagues.
  - **`ADMIN`:** Can view all campus tickets, assign/reassign technicians, update priority levels, browse user accounts, and view global operational metrics.
- **Public Registration Privilege Escalation Prevention:**
  - Public registration (`POST /api/auth/register`) strictly assigns the `STUDENT` role. Any `role` field submitted in the payload is ignored.
- **Backend-Authoritative State Machine:**
  - Status transitions are enforced by the backend state machine:
    $$\text{OPEN} \longrightarrow \text{ASSIGNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED}$$
  - Illegal skips (e.g. `ASSIGNED` -> `RESOLVED` without `IN_PROGRESS`) are rejected with `400 Bad Request`.
  - Resolving tickets requires a minimum 5-character resolution note.

---

## 3. Injection Prevention & Input Validation

- **Zod Schema Validation:** Every incoming request body, query parameter, and route parameter is validated using strict Zod schemas before hitting controllers.
- **NoSQL Injection Defense:**
  - Dynamic queries avoid passing raw client objects into MongoDB filters.
  - Search terms are escaped for regex special characters (`replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) and trimmed.
  - Route ID parameters are validated to be exact 24-character hex strings (`/^[0-9a-fA-F]{24}$/`).
- **XSS (Cross-Site Scripting) Defense:**
  - User-supplied text strings are sanitized and length-constrained.
  - React JSX handles automatic context-aware HTML entity escaping on the frontend.
  - Image attachments only render validated image URLs, preventing `javascript:` pseudo-protocols.

---

## 4. File Upload Security

- **Dual-Layer Format Validation:** Uploads are checked against both declared MIME type (`image/jpeg`, `image/png`, `image/webp`) and file extension (`.jpg`, `.jpeg`, `.png`, `.webp`).
- **Executable Blocking:** Dangerous extensions (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.py`, `.php`, `.phar`, `.html`) are rejected.
- **Collision & Traversal Prevention:** Files are saved using timestamped cryptographic hex strings (`${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`) inside the dedicated `backend/uploads` directory.
- **File Size Cap:** Enforced 5MB maximum file size via Multer limits. Oversized files are rejected with `400 Bad Request`.
- **CORS / CORP:** Express configures Helmet with `crossOriginResourcePolicy: { policy: 'cross-origin' }` to allow frontend asset loading while restricting arbitrary cross-origin embeds.

---

## 5. Network & Transport Security

- **HTTP Security Headers:** Configured via `helmet` including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security`.
- **CORS Configuration:** Locked to `CLIENT_ORIGIN` (`http://localhost:5173` in development, custom domain in production) with `credentials: true`.
- **Rate Limiting:**
  - General API rate limiter: 200 requests per 15 minutes per IP.
  - Dedicated Auth rate limiter: 5 login/registration requests per 15 minutes per IP to block brute-force and credential-stuffing attacks.
- **Production Error Masking:**
  - In production (`NODE_ENV === 'production'`), error stack traces and internal Mongoose driver details are suppressed; client receives clean, structured JSON error objects.

---

## 6. Audit & Accountability

- **Immutable Audit Trail:**
  - Every ticket lifecycle event (`TICKET_CREATED`, `TECHNICIAN_ASSIGNED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `RESOLUTION_ADDED`) is immutably logged to the `auditlogs` collection.
  - Audit records capture the actor ObjectId, previous value, updated value, timestamp, and optional context note.
  - Audit records cannot be modified or deleted via API endpoints.

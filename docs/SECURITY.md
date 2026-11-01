# FixLoop — Security Architecture & Guidelines

## 1. Authentication & Session Management
- **Password Hashing:** Passwords hashed with `bcryptjs` using 10+ salt rounds.
- **JWT Protection:** Access tokens signed with `JWT_ACCESS_SECRET`.
- **Credential Storage:** Real secrets and connection strings are kept exclusively in environment variables and excluded from source control.
- **Credential Sanitization:** User Mongoose schema excludes `passwordHash` by default (`select: false`), preventing accidental exposure in API responses.

## 2. Authorization & Access Control
- **Role-based Enforcement:** Express middleware checks `req.user.role` against endpoint requirements (`authorize('ADMIN')`, etc.).
- **Resource Ownership Checks:** Reporters can only view their own tickets; technicians can only update tickets explicitly assigned to them.
- **Authoritative Backend Validation:** Frontend routes provide visual guidance and pleasant UX, but server-side authorization is strictly enforced on all mutations.

## 3. Input Validation & Injection Prevention
- **Schema Validation:** Strict runtime validation using `Zod` middleware (`validate(schema)`).
- **NoSQL Injection Prevention:** Explicit field parsing and structured queries; untrusted `req.body` is never passed directly into MongoDB filter objects.
- **Parameter Tampering Defense:** Status transitions validate allowed state paths (`OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`).

## 4. Network & Transport Security
- **Security Headers:** `Helmet` is configured on all Express HTTP responses.
- **CORS Whitelist:** Cross-Origin Resource Sharing is locked to configured client origins (`CLIENT_ORIGIN`).
- **Rate Limiting:** `express-rate-limit` prevents brute force on API and authentication routes.

## 5. File Upload Safeguards
- **Multer Storage:** Randomized file names generated with `crypto.randomBytes(16)` to eliminate filename collisions and path traversal attacks.
- **MIME & Extension Whitelist:** Only standard image formats (`image/jpeg`, `image/png`, `image/webp`) are accepted.
- **Size Limits:** Enforced maximum upload size (configured via `MAX_FILE_SIZE_MB`).


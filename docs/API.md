# FixLoop — API Contract & Specification

Base URL: `/api`

All standard requests and responses use JSON (`application/json`). File uploads use `multipart/form-data`.

Standard success wrapper:
```json
{
  "success": true,
  "message": "Optional descriptive message",
  "data": { ... }
}
```

Standard error wrapper:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descriptive error message",
  "errors": [
    { "field": "email", "message": "Invalid email address format" }
  ]
}
```

---

## 1. Authentication & Session Endpoints

### `POST /api/auth/register`
- **Access:** Public (Rate-limited via `loginLimiter`)
- **Description:** Registers a new campus student account. Automatically assigns `STUDENT` role; role escalation in request body is strictly ignored.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "67b93a8d...",
        "name": "Jane Doe",
        "email": "jane@campus.edu",
        "role": "STUDENT"
      },
      "token": "eyJhbGciOi...",
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```
- **Set-Cookie Header:** Sets `refreshToken` cookie (`HttpOnly; Path=/api/auth; SameSite=Strict; Max-Age=604800; [Secure in production]`).

### `POST /api/auth/login`
- **Access:** Public (Rate-limited: 5 attempts per 15 min per IP)
- **Description:** Authenticates any active user (`STUDENT`, `TECHNICIAN`, `ADMIN`). Verifies bcrypt password hash.
- **Request Body:**
  ```json
  {
    "email": "jane@campus.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "67b93a8d...",
        "name": "Jane Doe",
        "email": "jane@campus.edu",
        "role": "STUDENT"
      },
      "token": "eyJhbGciOi...",
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```
- **Set-Cookie Header:** Issues new rotated `refreshToken` cookie.

### `POST /api/auth/refresh`
- **Access:** Public with valid `refreshToken` HttpOnly cookie or body parameter.
- **Description:** Rotates refresh token, invalidating old token and issuing new short-lived access token. Protects against token reuse attacks by revoking all tokens upon reused hash detection.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
      "user": { "_id": "...", "name": "...", "email": "...", "role": "..." },
      "token": "eyJhbGciOi...",
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/logout`
- **Access:** Authenticated (`Bearer <token>`) or with `refreshToken` cookie.
- **Description:** Revokes stored refresh token hash in database and clears the HttpOnly cookie.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### `GET /api/auth/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Description:** Returns profile of the currently authenticated user. Rejects inactive or deleted accounts.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "67b93a8d...",
      "name": "Jane Doe",
      "email": "jane@campus.edu",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  }
  ```

---

## 2. Category Endpoints

### `GET /api/categories`
- **Access:** Authenticated (`STUDENT`, `TECHNICIAN`, `ADMIN`)
- **Description:** Returns list of all active maintenance categories for issue reporting forms and filters.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "67b93a8d...",
        "name": "Electrical & Lighting",
        "slug": "electrical-lighting",
        "description": "Wiring, power outlets, circuit breakers, and lighting fixtures",
        "isActive": true
      }
    ]
  }
  ```

---

## 3. Ticket Management Endpoints

### `POST /api/tickets`
- **Access:** `STUDENT`, `ADMIN`
- **Content-Type:** `multipart/form-data` or `application/json`
- **Description:** Reports a new campus maintenance issue. State starts strictly as `OPEN` with unassigned technician. Supports optional image attachments (up to 3 files, JPEG/PNG/WebP, <=5MB each).
- **Form Fields / JSON:**
  - `title`: string (5–150 chars)
  - `description`: string (10–2000 chars)
  - `category`: string (Category ObjectId or slug)
  - `building`: string (optional if location provided)
  - `room`: string (optional if location provided)
  - `location`: string (e.g. `Science Hall - Room 302`)
  - `priority`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` (defaults to `MEDIUM`)
  - `images`: file[] (optional binary image attachments)
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Ticket created successfully",
    "data": {
      "ticket": {
        "_id": "67b93a8d...",
        "ticketCode": "FL-577460",
        "title": "Water leak in 3rd floor restroom",
        "description": "Sink pipe valve is leaking water onto the tile floor.",
        "category": { "_id": "...", "name": "Plumbing & Water" },
        "location": "Science Hall - Room 302",
        "building": "Science Hall",
        "room": "Room 302",
        "priority": "HIGH",
        "status": "OPEN",
        "reportedBy": { "_id": "...", "name": "Jane Doe", "email": "jane@campus.edu", "role": "STUDENT" },
        "assignedTo": null,
        "images": [
          {
            "fileName": "1793547524-abc.png",
            "originalName": "sink_leak.png",
            "mimeType": "image/png",
            "size": 142050,
            "url": "/uploads/1793547524-abc.png"
          }
        ],
        "createdAt": "2026-11-01T12:00:00.000Z"
      }
    }
  }
  ```

### `GET /api/tickets/my`
- **Access:** `STUDENT`, `ADMIN`
- **Description:** Returns paginated tickets reported by the authenticated student. Enforces strict IDOR prevention—students cannot see tickets created by other students.
- **Query Parameters:** `page`, `limit`, `status`, `priority`, `category`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "tickets": [ ... ],
      "pagination": { "total": 12, "page": 1, "limit": 10, "pages": 2 }
    }
  }
  ```

### `GET /api/tickets/assigned`
- **Access:** `TECHNICIAN`, `ADMIN`
- **Description:** Returns paginated tickets assigned to the authenticated technician. Technicians only see tickets assigned to their account.
- **Query Parameters:** `page`, `limit`, `status`, `priority`
- **Response (200 OK):** Returns matching tickets and pagination object.

### `GET /api/tickets`
- **Access:** `ADMIN`
- **Description:** Returns full campus ticket queue with multi-criteria filtering, search, and pagination.
- **Query Parameters:** `page`, `limit`, `status`, `priority`, `category`, `search`
- **Response (200 OK):** Returns tickets and pagination metadata.

### `GET /api/tickets/:id`
- **Access:** Ticket reporter (`STUDENT`), assigned `TECHNICIAN`, or `ADMIN`. Access by unauthorized students returns 404 Not Found to prevent enumeration.
- **Description:** Retrieves full ticket details, populated references, and image attachments.
- **Response (200 OK):** Returns populated Ticket object.

### `PATCH /api/tickets/:id/assign`
- **Access:** `ADMIN` only
- **Description:** Assigns or reassigns an active technician to a ticket. Automatically transitions status from `OPEN` to `ASSIGNED` and creates a `TECHNICIAN_ASSIGNED` audit record.
- **Request Body:**
  ```json
  { "technicianId": "67b93a8d..." }
  ```
- **Response (200 OK):** Returns updated Ticket.

### `PATCH /api/tickets/:id/status`
- **Access:** Assigned `TECHNICIAN` or `ADMIN`
- **Description:** Executes status machine transition:
  - `ASSIGNED` -> `IN_PROGRESS`
  - `IN_PROGRESS` -> `RESOLVED` (requires `resolutionNote` with >= 5 chars)
- **Request Body:**
  ```json
  {
    "status": "RESOLVED",
    "resolutionNote": "Replaced leaking copper valve gasket and pressure-tested line."
  }
  ```
- **Response (200 OK):** Returns updated Ticket with `resolvedAt` timestamp.

### `PATCH /api/tickets/:id/priority`
- **Access:** `ADMIN` only
- **Description:** Updates ticket priority level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and logs `PRIORITY_CHANGED` in audit timeline.
- **Request Body:**
  ```json
  { "priority": "CRITICAL" }
  ```
- **Response (200 OK):** Returns updated Ticket.

### `GET /api/tickets/:id/activity`
- **Access:** Ticket reporter, assigned technician, or `ADMIN`.
- **Description:** Returns chronological immutable audit log timeline for ticket actions.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "activity": [
        {
          "_id": "...",
          "ticketId": "...",
          "actorId": { "_id": "...", "name": "Jane Doe", "role": "STUDENT" },
          "action": "TICKET_CREATED",
          "oldValue": null,
          "newValue": { "status": "OPEN", "priority": "HIGH" },
          "note": "Ticket created by student reporter",
          "createdAt": "2026-11-01T12:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 4. Administration Endpoints

### `GET /api/admin/overview`
- **Access:** `ADMIN` only
- **Description:** Aggregates campus operational metrics across tickets and personnel.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "tickets": {
        "total": 45,
        "open": 8,
        "assigned": 12,
        "inProgress": 10,
        "resolved": 15,
        "critical": 3
      },
      "users": {
        "activeTechnicians": 4,
        "activeStudents": 62
      }
    }
  }
  ```

### `GET /api/admin/users`
- **Access:** `ADMIN` only
- **Description:** Paginated directory of campus user accounts.
- **Query Parameters:** `page`, `limit`, `role` (`STUDENT`, `TECHNICIAN`, `ADMIN`), `search`
- **Response (200 OK):** Returns users array (excluding `passwordHash` and `refreshTokens`) and pagination metadata.

---

## 5. System Health Check

### `GET /api/health`
- **Access:** Public
- **Response (200 OK when DB connected, 503 Service Unavailable when degraded):**
  ```json
  {
    "status": "ok",
    "service": "FixLoop API",
    "uptime": 1234.56,
    "timestamp": "2026-11-01T15:00:00.000Z",
    "database": "connected"
  }
  ```

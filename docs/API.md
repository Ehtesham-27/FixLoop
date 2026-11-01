# FixLoop — API Contract & Specification

Base URL: `/api`

All request and response bodies use JSON format (`application/json`), except image file uploads which use `multipart/form-data`.

## 1. Authentication Endpoints

### `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "password": "SecurePassword123"
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
      "token": "eyJhbGci..."
    }
  }
  ```

### `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "jane@campus.edu",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "67b93a8d...",
        "name": "Jane Doe",
        "email": "jane@campus.edu",
        "role": "STUDENT"
      },
      "token": "eyJhbGci..."
    }
  }
  ```

### `POST /api/auth/refresh`
- **Access:** Valid refresh cookie/token
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": { "token": "eyJhbGci..." }
  }
  ```

### `POST /api/auth/logout`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```

### `GET /api/auth/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "67b93a8d...",
      "name": "Jane Doe",
      "email": "jane@campus.edu",
      "role": "STUDENT"
    }
  }
  ```

---

## 2. Ticket Endpoints

### `POST /api/tickets`
- **Access:** `STUDENT`, `ADMIN`
- **Request Body:**
  ```json
  {
    "title": "Water leakage under sink",
    "description": "Continuous leak noticed in 2nd floor men's restroom.",
    "category": "Plumbing",
    "building": "Science Complex",
    "room": "Room 208 Restroom",
    "priority": "HIGH"
  }
  ```
- **Response (201 Created):** Returns created Ticket object.

### `GET /api/tickets/my`
- **Access:** `STUDENT`
- **Response (200 OK):** Returns array of tickets created by authenticated user.

### `GET /api/tickets/assigned`
- **Access:** `TECHNICIAN`
- **Response (200 OK):** Returns array of tickets assigned to authenticated technician.

### `GET /api/tickets`
- **Access:** `ADMIN`
- **Query Params:** `?status=OPEN&priority=HIGH`
- **Response (200 OK):** Returns filtered list of all campus tickets.

### `GET /api/tickets/:id`
- **Access:** Ticket reporter, Assigned technician, or `ADMIN`
- **Response (200 OK):** Returns full ticket details.

### `PATCH /api/tickets/:id/assign`
- **Access:** `ADMIN`
- **Request Body:**
  ```json
  {
    "technicianId": "67b93a8d..."
  }
  ```
- **Response (200 OK):** Ticket updated with `assignedTo` and status transitioned to `ASSIGNED`.

### `PATCH /api/tickets/:id/status`
- **Access:** Assigned `TECHNICIAN` or `ADMIN`
- **Request Body:**
  ```json
  {
    "status": "IN_PROGRESS",
    "resolutionNote": "Parts ordered, currently repairing"
  }
  ```
- **Response (200 OK):** Returns updated ticket.

### `PATCH /api/tickets/:id/priority`
- **Access:** `ADMIN`
- **Request Body:**
  ```json
  {
    "priority": "CRITICAL"
  }
  ```
- **Response (200 OK):** Returns updated ticket.

### `GET /api/tickets/:id/activity`
- **Access:** Reporter, Assigned technician, `ADMIN`
- **Response (200 OK):** Chronological array of audit logs for the ticket.

---

## 3. Admin Management Endpoints

### `GET /api/admin/users`
- **Access:** `ADMIN`
- **Response (200 OK):** List of campus users and their roles.

### `GET /api/admin/overview`
- **Access:** `ADMIN`
- **Response (200 OK):** Summary metrics on active, unassigned, and resolved issues.

---

## 4. System Health Endpoint

### `GET /api/health`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "FixLoop API",
    "uptime": 12.34,
    "timestamp": "2026-11-01T13:50:00.000Z",
    "database": "connected"
  }
  ```


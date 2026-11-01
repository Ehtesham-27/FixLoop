# FixLoop — Production Deployment Guide

This guide details the procedure for deploying FixLoop to production using MongoDB Atlas, Render (for the Node.js Express backend), and Vercel (for the React Vite frontend).

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |       User Browser          |
                      +--------------+--------------+
                                     |
               HTTPS (Static Assets) | HTTPS (API Calls + HttpOnly Cookie)
                                     v
+-----------------------------+             +-------------------------------+
|   Frontend: Vercel SPA      |             |     Backend: Render Web API   |
|   - React 18 + Vite         |             |     - Express ES Modules      |
|   - Tailwind CSS            |             |     - Helmet, CORS, RateLimit |
|   - vercel.json SPA rewrites|             |     - Multer Uploads          |
+-----------------------------+             +---------------+---------------+
                                                            |
                                                            | Mongoose (TLS)
                                                            v
                                            +---------------+---------------+
                                            |   Database: MongoDB Atlas     |
                                            |   - M0 / Shared Cluster       |
                                            |   - Users, Tickets, AuditLogs |
                                            +-------------------------------+
```

---

## 2. Step 1: MongoDB Atlas Configuration

1. **Create Cluster:** Create a cluster in [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0 Free tier or higher).
2. **Database User:**
   - Navigate to **Security** → **Database Access**.
   - Create a database user (e.g., `fixloop_app_user`) with `readWriteAnyDatabase` or scoped to the `fixloop` database.
   - Use a strong, URL-safe password without unescaped special characters.
3. **Network Access (IP Whitelist):**
   - Navigate to **Security** → **Network Access**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from dynamic cloud platform IPs (e.g. Render, Railway).
4. **Retrieve Connection String:**
   - Under **Clusters** → **Connect** → **Drivers** (Node.js).
   - Format: `mongodb+srv://<username>:<password>@<cluster-url>/fixloop?retryWrites=true&w=majority`

---

## 3. Step 2: Backend Deployment (Render / Cloud VPS)

### Option A: Render Web Service

1. Create a new **Web Service** on Render and link your GitHub repository.
2. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Configure **Environment Variables** in Render:

| Variable | Recommended Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security mode and hides stack traces |
| `PORT` | `10000` | Port assigned by Render |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.../fixloop?retryWrites=true&w=majority` | Atlas connection string |
| `CLIENT_ORIGIN` | `https://your-fixloop-app.vercel.app` | Production frontend domain for CORS whitelist |
| `JWT_ACCESS_SECRET` | *32+ character random string* | Access token signing secret |
| `JWT_REFRESH_SECRET` | *32+ character random string* | Refresh token signing secret |
| `ACCESS_TOKEN_TTL` | `15m` | Short-lived access token expiry |
| `REFRESH_TOKEN_TTL` | `7d` | Refresh token lifetime |
| `UPLOAD_DIR` | `uploads` | Local upload directory path |
| `MAX_FILE_SIZE_MB` | `5` | Maximum upload size per image |
| `INITIAL_ADMIN_EMAIL` | `admin@campus.edu` | (Optional) Seed account email |
| `INITIAL_ADMIN_PASSWORD` | *Strong password (8+ chars)* | (Optional) Seed account password |
| `INITIAL_ADMIN_NAME` | `Campus Administrator` | (Optional) Seed account name |

4. **Initialize Database:**
   - Open Render Shell or run locally against Atlas URI:
     ```bash
     npm run seed:backend
     ```

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Import your repository into **Vercel**.
2. Select **Framework Preset**: `Vite`.
3. Set **Root Directory**: `frontend`.
4. Configure Build and Output:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Configure **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
6. Verify `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   This ensures client-side routes (e.g. `/student/my-tickets`, `/admin/tickets`) reload without 404s.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Health Endpoint:** Visit `https://your-backend.onrender.com/api/health` and verify:
  ```json
  { "status": "ok", "service": "FixLoop API", "database": "connected" }
  ```
- [ ] **Registration:** Register a test student at `https://your-app.vercel.app/register`.
- [ ] **Cookie Transmission:** Open DevTools → Application → Cookies and verify `refreshToken` is marked `HttpOnly` and `Secure`.
- [ ] **CORS Verification:** Verify API requests succeed from the frontend domain without CORS errors.
- [ ] **Ticket Submission:** Submit an issue with a photo attachment and verify thumbnail renders.
- [ ] **Admin Triage:** Log in as Admin, assign a Technician, change priority to `HIGH`.
- [ ] **Technician Resolution:** Log in as Technician, change status to `IN_PROGRESS`, resolve with notes.

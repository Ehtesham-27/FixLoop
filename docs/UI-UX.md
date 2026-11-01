# FixLoop — UI/UX Design System & Layout Guidelines

## 1. Visual Aesthetics & Design Direction
FixLoop follows a calm, minimalist campus utility aesthetic rather than an overwhelming generic admin template.

- **Background Palette:** Clean warm off-white (`#F8F9FA` / `slate-50`).
- **Typography:** Charcoal & deep slate (`slate-800` / `slate-900`) with legible sans-serif font system.
- **Primary Action Color:** Deep blue (`#2563EB` / `blue-600`) for primary buttons and active indicators.
- **Surface Elevation:** Subtle borders (`border-slate-200`) and restrained micro-shadows (`shadow-xs` / `shadow-sm`).
- **Status Indicators:**
  - `OPEN`: Amber pill (`bg-amber-100 text-amber-800`)
  - `ASSIGNED`: Blue pill (`bg-blue-100 text-blue-800`)
  - `IN_PROGRESS`: Purple pill (`bg-purple-100 text-purple-800`)
  - `RESOLVED`: Emerald pill (`bg-emerald-100 text-emerald-800`)

## 2. Responsive Breakpoints & Device Adaptations

The application supports mobile phones, tablets, and desktop workstations seamlessly:
- **Mobile (< 640px):**
  - Compact top header.
  - Sticky bottom tab navigation for core screens.
  - Touch-friendly 44px+ interactive targets.
  - Single-column card listings to eliminate horizontal scrolling.
- **Tablet (640px – 1023px):**
  - Grid-based multi-card layouts.
  - Filter rows with accessible dropdown controls.
- **Desktop (>= 1024px):**
  - Fixed left sidebar navigation with role-specific views.
  - High-information density with comfortable maximum page widths.

## 3. Screen Inventory

| Route | Role | Purpose |
|---|---|---|
| `/login` | Public | Campus email and password authentication |
| `/register` | Public | Student/faculty registration |
| `/student/dashboard` | Student | Welcome banner, quick report button, recent requests |
| `/student/create-ticket`| Student | Facility location, category, description submission form |
| `/student/my-tickets` | Student | Complete list of user's submitted maintenance tickets |
| `/technician/dashboard`| Technician | Work queue containing assigned maintenance tasks |
| `/admin/dashboard` | Admin | High-level metrics, pending assignment issues |
| `/admin/tickets` | Admin | Filterable campus ticket directory & tech assignment |
| `/admin/users` | Admin | Campus user directory and roles |
| `/tickets/:id` | Authenticated | Detailed ticket view with location and status history |
| `/unauthorized` | Authenticated | Friendly 403 access denied banner |
| `*` | Any | 404 Not Found fallback |


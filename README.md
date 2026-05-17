# Part Numbers Monitoring System

Track customer inquiries for parts not in inventory and compare supplier prices. React + FastAPI + SQLite.

## Concept

The system is organised around **inquiries**, not individual parts:

- A customer/client makes an inquiry, which can include **one or many part numbers**.
- Each inquiry has a client name, urgency, status, notes, and a list of parts.
- Each part inside the inquiry has its own part number, description, quantity, urgency, status, and supplier prices.
- This lets you search "what did Acme Corp ask about?" and see all their parts at once.

## Features

- **User selection**: 3 internal users (Simos, Lenia, Dimitris) — every action is attributed.
- **Inquiry-centric dashboard**: list of inquiries, with part-number chips inline. Click to open the full inquiry.
- **Per-inquiry detail page**: edit inquiry info, add/remove parts, manage price comparison per part.
- **Automatic timestamps**: every create/update/price action stamps the date server-side. No manual date entry.
- **Price comparison**: two categories — In-Country (A) and Web/Import (B). Side-by-side prices per supplier.
- **Admin panel**: manage the supplier list (password `123`, hardcoded for now).
- **Activity log**: full audit trail across the system.
- **Hard delete for completed orders**: when an inquiry reaches `Delivered` or `Cancelled` a prominent Delete button appears. You can also delete unfinished inquiries, but the confirmation modal warns you.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Query
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **DB**: SQLite file `backend/part_numbers.db` (auto-created on startup, suppliers seeded)

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Swagger docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
http://localhost:5173 — Vite proxies `/api` → backend on `:8000`.

## Database Schema

### `inquiries`
- id, requested_by (client), notes, urgency (1-5), status, logged_by, created_at, updated_at

### `parts`
- id, inquiry_id (FK, cascade delete), part_number, description, quantity, used_in, urgency, status, created_at, updated_at

### `supplier_prices`
- id, part_id (FK, cascade delete), supplier_name, supplier_category (A/B), price, currency, notes, date_checked (auto), checked_by, created_at, updated_at
- UNIQUE(part_id, supplier_name) — one price entry per supplier per part

### `suppliers`
- id, name, category (A/B), is_active, created_at

### `activity_log`
- id, inquiry_id (nullable, SET NULL on delete), part_id (nullable), part_number, action_type, action_detail, performed_by, timestamp
- Activity log survives inquiry/part deletion so you keep history.

## API Endpoints

### Inquiries
- `GET /api/inquiries` — list (filters: search, logged_by, urgency, status)
- `POST /api/inquiries` — create with parts in one call
- `GET /api/inquiries/{id}` — full detail including all parts + prices
- `PUT /api/inquiries/{id}` — update fields
- `PATCH /api/inquiries/{id}/status` — change status
- `DELETE /api/inquiries/{id}` — hard delete (cascades to parts + prices)

### Parts (nested under inquiry)
- `POST /api/inquiries/{inquiry_id}/parts` — add a part to an existing inquiry
- `GET /api/parts/{id}` — single part
- `PUT /api/parts/{id}` — update part fields
- `PATCH /api/parts/{id}/status` — change part status
- `DELETE /api/parts/{id}`

### Prices
- `GET /api/prices/part/{part_id}` — list prices for a part
- `POST /api/prices/part/{part_id}` — add/upsert price (date auto-filled)
- `PUT /api/prices/{price_id}` — update (date_checked refreshes automatically)
- `DELETE /api/prices/{price_id}`

### Activity
- `GET /api/activity` — global log (filters: performed_by, action_type, limit)
- `GET /api/activity/inquiry/{inquiry_id}` — log scoped to one inquiry

### Suppliers
- `GET /api/suppliers` — active suppliers (public)
- `GET/POST/PUT/DELETE /api/admin/suppliers` — admin-only (`?admin_password=...`)
- `POST /api/admin/login` — verify password

### Utilities
- `GET /api/config` — statuses, users, urgency levels, completed_statuses
- `GET /api/health`

## Project Structure
```
part_numbers_monitoring/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py            # Inquiry, Part, SupplierPrice, Supplier, ActivityLog
│   ├── schemas.py
│   ├── crud.py
│   ├── routers/
│   │   ├── inquiries.py     # Inquiry + nested Part endpoints
│   │   ├── prices.py
│   │   ├── activity.py
│   │   └── suppliers.py
│   ├── requirements.txt
│   └── part_numbers.db
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── pages/
        │   ├── UserSelectPage.jsx
        │   ├── DashboardPage.jsx       # Inquiries list + "New Inquiry" multi-part form
        │   ├── InquiryDetailPage.jsx   # Inquiry view: parts, prices, activity, delete
        │   ├── ActivityLogPage.jsx
        │   └── AdminPage.jsx
        ├── components/
        ├── context/UserContext.jsx
        └── api/
            ├── client.js
            ├── inquiries.js   # inquiriesAPI + partsAPI
            ├── prices.js
            ├── activity.js
            └── suppliers.js
```

## Statuses
Pending · Waiting for Order · Under Order · In Transit · Delivered · Cancelled

`Delivered` and `Cancelled` are considered "completed" — the Delete button is prominent on inquiries in those states (see `/api/config.completed_statuses`).

## Notes
- No authentication on the public app — user selected on login screen.
- Admin password is hardcoded as `123` in [backend/routers/suppliers.py](backend/routers/suppliers.py). Fine for an internal LAN tool, not for anything exposed.
- Reset the DB by deleting `backend/part_numbers.db` — tables and default suppliers auto-recreate on startup.

# Part Numbers Monitoring System

A web application to track part numbers not in inventory and compare supplier prices. Built with React + FastAPI + SQLite.

## Features

- **User Management**: 3 internal users (Simos, Lenia, Dimitris) to track who logged actions
- **Part Tracking**: Add and manage part numbers with:
  - Requested by (client/customer name)
  - Quantity (optional)
  - Where it's used
  - Urgency level (1-5)
  - Status tracking
- **Price Comparison**:
  - In-country suppliers (Category A)
  - Web/import suppliers (Category B)
  - Compare prices side-by-side with separate modals per category
  - Suppliers stored in SQLite database, not hardcoded
- **Admin Panel**: Manage suppliers dynamically
  - Add, edit, delete suppliers
  - Toggle supplier active/inactive status
  - Password protected (password: `123`)
  - Separate management for in-country and web suppliers
- **Activity Logging**: Full audit trail of all actions by user
- **Filtering & Search**: Filter by requester, urgency, status, and search by part number/description

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Query
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Data**: SQLite database (auto-created on startup)

## Setup & Installation

### Backend Setup

```bash
cd part_numbers_monitoring/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Or (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (auto-creates database)
uvicorn main:app --reload --port 8000
```

Backend runs on: `http://localhost:8000`
Swagger API docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd part_numbers_monitoring/frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` in your browser
2. Select your user (Simos, Lenia, or Dimitris)
3. **Dashboard**: View all parts, add new parts, filter by various criteria
4. **Part Detail**: View/edit part info, add supplier prices, see activity log
5. **Activity Log**: See all actions across the system

## Project Structure

```
part_numbers_monitoring/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLite setup
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── routers/
│   │   ├── parts.py         # Part endpoints
│   │   ├── prices.py        # Price endpoints
│   │   ├── activity.py      # Activity log endpoints
│   │   └── suppliers.py     # Supplier management endpoints (admin)
│   ├── requirements.txt
│   └── part_numbers.db      # Auto-created SQLite file (with suppliers table)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── pages/
        │   ├── UserSelectPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── PartDetailPage.jsx
        │   ├── ActivityLogPage.jsx
        │   └── AdminPage.jsx         # Admin panel (supplier management)
        ├── components/
        │   ├── layout/AppShell.jsx
        │   └── common/
        ├── context/UserContext.jsx
        └── api/
            ├── client.js
            ├── parts.js
            ├── prices.js
            ├── activity.js
            └── suppliers.js         # Supplier API calls
```

## Database Schema

### parts
- id, part_number (unique), description, requested_by (client name)
- quantity, used_in, urgency (1-5), status
- logged_by (internal user), created_at, updated_at

### supplier_prices
- id, part_id (FK), supplier_name, supplier_category ('A' or 'B')
- price, currency, notes, date_checked, checked_by
- UNIQUE(part_id, supplier_name)

### activity_log
- id, part_id (nullable), part_number, action_type
- action_detail, performed_by, timestamp

## Suppliers (Hardcoded)

**Category A (In-Country):**
- GR-Supplier-1, GR-Supplier-2, GR-Supplier-3, GR-Supplier-4

**Category B (Web/Import):**
- WEB-Supplier-A, WEB-Supplier-B, WEB-Supplier-C

## Statuses

- Pending
- Waiting for Order
- Under Order
- In Transit
- Delivered
- Cancelled

## API Endpoints

### Parts
- `GET /api/parts` - List parts (with filters)
- `POST /api/parts` - Create part
- `GET /api/parts/{id}` - Get part detail
- `PUT /api/parts/{id}` - Update part
- `PATCH /api/parts/{id}/status` - Change status
- `DELETE /api/parts/{id}` - Delete part

### Prices
- `GET /api/prices/part/{part_id}` - Get all prices for a part
- `POST /api/prices/part/{part_id}` - Add price
- `PUT /api/prices/{price_id}` - Update price
- `DELETE /api/prices/{price_id}` - Delete price

### Activity
- `GET /api/activity` - Global activity log
- `GET /api/activity/part/{part_id}` - Activity for a specific part

### Utilities
- `GET /api/suppliers` - List hardcoded suppliers
- `GET /api/config` - Get app configuration
- `GET /api/health` - Health check

## Development Notes

- **No authentication**: Users selected on login screen (no passwords)
- **Activity tracking**: Every action logged with user and timestamp
- **Auto-refresh**: Frontend uses React Query for automatic data syncing
- **Vite Proxy**: `/api` requests automatically forward to backend during dev
- **Database**: SQLite file created in `backend/` on first run

## Building for Production

```bash
# Frontend build
cd frontend
npm run build
# Creates dist/ folder with optimized bundle
```

## Troubleshooting

### Port already in use
- Backend: Change port in `uvicorn main:app --reload --port 8001`
- Frontend: Vite automatically finds next available port

### Database issues
- Delete `backend/part_numbers.db` to reset database
- Tables auto-recreate on next backend startup

### CORS errors
- Ensure both services are running
- Backend on :8000, frontend on :5173
- Check vite.config.js proxy settings

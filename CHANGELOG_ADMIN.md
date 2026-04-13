# Admin Features Changelog

## New Features Added

### 1. Admin Panel with Dynamic Supplier Management
- **Location:** `http://localhost:5174/admin` (accessible from sidebar "Admin Panel" link)
- **Password Protection:** Simple password authentication (password: `123`)
- **No Data Persistence:** Password is per-session only — refreshing the page requires re-authentication

### 2. Suppliers Moved to SQLite Database
- **New Table:** `suppliers` in SQLite database
- **Fields:** id, name, category (A or B), is_active, created_at
- **Default Data:** 7 suppliers auto-seeded on first startup
  - Category A (In-Country): GR-Supplier-1, GR-Supplier-2, GR-Supplier-3, GR-Supplier-4
  - Category B (Web/Import): WEB-Supplier-A, WEB-Supplier-B, WEB-Supplier-C
- **No More Hardcoding:** Removed hardcoded supplier lists from Python code

### 3. Admin Panel Features
- **View All Suppliers:** Two separate sections for Category A and Category B
- **Add Suppliers:** One input per section with "Add" button
- **Edit Suppliers:** Click "Edit" to rename a supplier inline
- **Toggle Active Status:** Click "Active"/"Inactive" button to enable/disable
- **Delete Suppliers:** Click "Delete" and confirm to remove (hard delete from DB)
- **Real-time Updates:** Changes reflected immediately without page reload

### 4. Separate Price Modals by Category
**Changed on PartDetailPage:**
- Removed single "+ Add Price" button
- Added separate "+ Add Price" buttons in each section header:
  - "In-Country Suppliers" section gets its own button
  - "Web/Import Suppliers" section gets its own button
- Modal now pre-filters suppliers to only show relevant category
- Modal title indicates which category (e.g., "Add Price - In-Country")

### 5. Backend API Changes
**New Endpoints:**
- `GET /api/suppliers` — List all active suppliers (public, used by price modals)
- `GET /api/admin/suppliers?admin_password=123` — List all suppliers including inactive (admin only)
- `POST /api/admin/suppliers?admin_password=123` — Create new supplier (admin only)
- `PUT /api/admin/suppliers/{id}?admin_password=123` — Update supplier (admin only)
- `DELETE /api/admin/suppliers/{id}?admin_password=123` — Delete supplier (admin only)
- `POST /api/admin/login` — Verify admin password (returns `{"success": true}`)

**Removed:**
- Old hardcoded `GET /api/suppliers` that returned static list

### 6. Frontend Changes
**New Files:**
- `frontend/src/pages/AdminPage.jsx` — Full admin panel UI
- `frontend/src/api/suppliers.js` — API wrapper for supplier endpoints

**Modified Files:**
- `frontend/src/App.jsx` — Added `/admin` route
- `frontend/src/components/layout/AppShell.jsx` — Added "Admin Panel" link in sidebar
- `frontend/src/pages/PartDetailPage.jsx` — Separate price modals per category

### 7. Backend Changes
**New Files:**
- `backend/routers/suppliers.py` — All supplier endpoints and admin auth

**Modified Files:**
- `backend/models.py` — Added `Supplier` model
- `backend/schemas.py` — Added SupplierCreate, SupplierUpdate, SupplierResponse
- `backend/crud.py` — Added supplier CRUD functions
- `backend/main.py` — Seed suppliers on startup, mount suppliers router, remove hardcoded list

---

## How to Use

### Admin Panel
1. Click "Admin Panel" in the sidebar (bottom of left nav)
2. Enter password `123`
3. See two sections: In-Country and Web/Import suppliers
4. Add new suppliers, edit names, toggle active status, or delete
5. All changes are saved to the database immediately

### Add Part Prices
1. Open a part detail page
2. In "In-Country Suppliers (Category A)" section, click "+ Add Price"
3. Modal opens pre-filtered to only show in-country suppliers
4. Select supplier, enter price, currency, date, notes
5. Click "Add Price"
6. Repeat for "Web/Import Suppliers (Category B)" section with its own button

### Inactive Suppliers
- When a supplier is toggled inactive in the admin panel, it no longer appears in:
  - The price modal dropdowns
  - The `GET /api/suppliers` public endpoint
- Inactive suppliers are only visible in admin panel (`GET /api/admin/suppliers`)
- Existing prices for inactive suppliers remain in the database

---

## Technical Details

### Admin Authentication
- Simple query parameter check: `admin_password=123`
- No session tokens or JWT — password sent with each admin request
- Password is plain text (demo only, not for production)

### Database Seeding
- On first backend startup, checks if `suppliers` table is empty
- If empty, inserts the 7 default suppliers
- If suppliers already exist (from previous run), does nothing
- Can add/delete suppliers via admin panel anytime

### Category Filtering
- Frontend filters suppliers by `category === 'A'` or `'B'` in the price modal
- Backend does NOT filter — the API always returns all active suppliers (with category field)
- Filtering logic is in the React component (`PartDetailPage.jsx`)

---

## Testing Checklist

- [ ] Backend starts without errors and creates `suppliers` table
- [ ] Database contains 7 default suppliers on first run
- [ ] `/admin` page shows password prompt
- [ ] Wrong password shows error, correct password (`123`) logs in
- [ ] Admin panel shows two sections with suppliers listed
- [ ] Can add a new supplier in either section
- [ ] Can edit supplier names inline
- [ ] Can toggle active/inactive status
- [ ] Can delete a supplier
- [ ] Inactive suppliers do NOT appear in price modals
- [ ] Open a part, see separate "+ Add Price" buttons in each section
- [ ] Click in-country button, modal shows only Category A suppliers
- [ ] Click web button, modal shows only Category B suppliers
- [ ] Refreshing admin page requires re-entering password
- [ ] Changes in admin panel are reflected immediately in price modals (no page refresh needed)

---

## Notes

- The admin panel has NO authorization beyond the password check — anyone who knows the password can modify suppliers
- For production, implement proper authentication (JWT, sessions, HTTPS, rate limiting)
- Inactive suppliers are soft-disabled, not hard deleted from historical records

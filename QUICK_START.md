# Quick Start Guide

Get the Part Numbers Monitoring app running in 5 minutes.

## Prerequisites

- Python 3.8+
- Node.js 16+ (with npm)

## Step 1: Backend Setup (Terminal 1)

```bash
cd part_numbers_monitoring/backend

# Windows users:
python -m venv venv
venv\Scripts\activate

# macOS/Linux users:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn main:app --reload --port 8000
```

✓ Backend should start at `http://localhost:8000`
✓ Swagger API docs at `http://localhost:8000/docs`
✓ Database `part_numbers.db` auto-created

## Step 2: Frontend Setup (Terminal 2)

```bash
cd part_numbers_monitoring/frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```

✓ Frontend should open at `http://localhost:5173`

## Step 3: Open & Use

1. Go to `http://localhost:5173`
2. Select your user (Simos, Lenia, or Dimitris)
3. Start adding parts and prices!

## Common Issues

**Backend won't start?**
- Check port 8000 is free: `netstat -tuln | grep 8000`
- Or use different port: `uvicorn main:app --reload --port 8001`

**Frontend build fails?**
- Delete `node_modules` folder
- Run `npm install` again

**Can't reach backend API?**
- Ensure both are running simultaneously
- Check Vite proxy in `frontend/vite.config.js`

**Reset database?**
- Stop backend
- Delete `backend/part_numbers.db`
- Restart backend (recreates DB)

## Testing the API

Open `http://localhost:8000/docs` in your browser. Use Swagger UI to test endpoints.

Example: Create a part
```
POST /api/parts
{
  "part_number": "ABC-123",
  "description": "Electronic component",
  "requested_by": "John Doe",
  "quantity": 5,
  "used_in": "Device assembly",
  "urgency": 3,
  "status": "Pending",
  "logged_by": "Simos"
}
```

## Next Steps

- Add parts and suppliers
- Track status changes
- View activity logs
- Filter and search parts
- Compare supplier prices

Enjoy! 🚀

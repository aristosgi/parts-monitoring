# Installation Without Docker (Native Python + Node.js)

## What You Need

1. **Python 3.11+** - For backend
2. **Node.js 18+** - For frontend  
3. **Git** (optional, for cloning repo)

**Total setup time:** ~15 minutes

---

## Step 1: Install Python 3.11+

### Windows

1. Go to https://www.python.org/downloads/
2. Download Python 3.11+ installer
3. Run installer
4. **IMPORTANT:** Check "Add Python to PATH"
5. Click "Install Now"
6. Verify: Open PowerShell and type:
   ```
   python --version
   ```

### Mac

```bash
# Using Homebrew
brew install python@3.11
python3.11 --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
python3.11 --version
```

---

## Step 2: Install Node.js 18+

### Windows

1. Go to https://nodejs.org/
2. Download LTS version (18+)
3. Run installer, click "Next" through all steps
4. Verify: Open PowerShell and type:
   ```
   node --version
   npm --version
   ```

### Mac

```bash
brew install node@18
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install nodejs npm
# Or for newer version:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

---

## Step 3: Get the Project

### Option A: Clone with Git

```bash
git clone https://github.com/aristosgi/parts-monitoring.git
cd parts-monitoring
```

### Option B: Download Manually

1. Go to: https://github.com/aristosgi/parts-monitoring
2. Click "Code" → "Download ZIP"
3. Extract the folder
4. Open command prompt/terminal in that folder

---

## Step 4: Set Up Backend

### Windows PowerShell

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Mac/Linux Terminal

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi uvicorn sqlalchemy ...
```

---

## Step 5: Set Up Frontend

### All Systems

```bash
cd frontend
npm install
```

**Expected output:**
```
added 200+ packages in 2-3 minutes
```

---

## Step 6: Start the Application

### Terminal 1: Backend

**Windows PowerShell:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Mac/Linux:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Step 7: Open the App

1. Open browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:5173**
3. Select user: Simos, Lenia, or Dimitris
4. Start using the app!

### Admin Panel

- URL: **http://localhost:5173/admin**
- Password: **123**

---

## Database Location

Your data is stored at:
```
backend/part_numbers.db
```

This is a SQLite database file. It's in your project folder.

**Keep this file safe!** Backup regularly.

---

## Stopping the App

1. **Backend terminal:** Press `Ctrl + C`
2. **Frontend terminal:** Press `Ctrl + C`
3. Done!

To start again: Repeat Step 6 in both terminals

---

## Daily Startup (After First Install)

**Windows PowerShell:**
```powershell
# Terminal 1
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
cd frontend
npm run dev
```

**Mac/Linux:**
```bash
# Terminal 1
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
cd frontend
npm run dev
```

---

## Troubleshooting

### "Python not found"
- Python installation failed or not in PATH
- Restart your computer
- Reinstall Python (check "Add to PATH")

### "npm not found"
- Node.js installation failed
- Restart your computer
- Reinstall Node.js

### "Port 8000 or 5173 already in use"
Change the port:
```bash
# Backend on 8001
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Frontend on 5174
npm run dev -- --port 5174
```

### Database file locked
- Make sure only ONE backend is running
- Restart the backend with `Ctrl + C` then start again

### "ModuleNotFoundError: No module named 'fastapi'"
- Virtual environment not activated
- Run: `.\venv\Scripts\Activate.ps1` (Windows) or `source venv/bin/activate` (Mac/Linux)

### "npm ERR! code ERESOLVE"
```bash
cd frontend
npm install --legacy-peer-deps
```

---

## Backing Up Your Database

Since database is in `backend/part_numbers.db`, just copy this file:

```bash
# Create backup
cp backend/part_numbers.db backend/part_numbers.db.backup

# Restore from backup
cp backend/part_numbers.db.backup backend/part_numbers.db
```

**Windows PowerShell:**
```powershell
Copy-Item backend/part_numbers.db backend/part_numbers.db.backup
```

---

## Server Restart Behavior

**When server restarts:**
1. Database file stays on disk
2. All your data is safe
3. Just run the startup commands again
4. Everything loads with all your data intact

**No data loss** (unless you delete the .db file)

---

## Upgrading to Production (Later)

If you want to run this 24/7 on a server:

### Windows: Use Task Scheduler

Create a batch file `start-app.bat`:
```batch
@echo off
cd /d C:\path\to\parts-monitoring
start /min cmd /c "cd backend && venv\Scripts\Activate.ps1 && uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3
start /min cmd /c "cd frontend && npm run dev"
```

Schedule it in Task Scheduler to run at startup.

### Linux: Use Systemd

See `INSTALL_OLD_SERVER.md` for systemd service setup.

---

## Performance Tips

### Backend
- `--reload` flag reloads on code changes (good for dev, slightly slower)
- Remove `--reload` for production: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend
- Development: `npm run dev` (includes hot reload)
- Production: `npm run build` then serve the `dist/` folder

---

## What This Setup Gives You

✅ Full app running on your computer
✅ Database persists between restarts
✅ Easy to modify and develop
✅ No Docker/Podman needed
✅ Fast startup (no container overhead)
✅ Direct file access for debugging

---

## File Structure After Setup

```
parts-monitoring/
├── backend/
│   ├── venv/                 ← Virtual environment
│   ├── part_numbers.db       ← YOUR DATABASE (BACKUP THIS!)
│   ├── main.py
│   ├── models.py
│   ├── routers/
│   └── requirements.txt
├── frontend/
│   ├── node_modules/         ← Dependencies
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── (other files)
```

---

## Common Tasks

### Update dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
npm update
```

### Add new Python package
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
pip install package-name
pip freeze > requirements.txt
```

### Add new npm package
```bash
cd frontend
npm install package-name
```

---

## Need Help?

1. **Backend not starting?** Check if port 8000 is free: `netstat -an | find "8000"`
2. **Frontend not compiling?** Try `npm install --legacy-peer-deps`
3. **Database issues?** Delete `backend/part_numbers.db` and restart (fresh database)
4. **Lost connection between frontend and backend?** Make sure both terminals are running

---

## Summary

| What | Where | How to Start |
|------|-------|-------------|
| Backend | http://localhost:8000 | `uvicorn main:app --reload ...` |
| Frontend | http://localhost:5173 | `npm run dev` |
| Database | backend/part_numbers.db | Auto-created on first run |
| Admin | http://localhost:5173/admin | Password: 123 |

**All commands needed are in this guide. You're ready to go!** 🚀

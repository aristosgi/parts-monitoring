# Docker Setup Guide

This guide explains how to run the Part Numbers Monitoring app on a fresh PC using Docker/Podman without needing Python or Node.js installed locally.

## Prerequisites

Only Podman (or Docker) needs to be installed on the target PC. No Python, Node.js, or any other dependencies required!

### Install Podman

**Windows:**
1. Download Podman from: https://podman.io/docs/installation
2. Install using the official installer
3. Open PowerShell and verify: `podman --version`

**macOS:**
```bash
brew install podman
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install podman
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install podman
```

## Running the App with Podman Compose

### Step 1: Copy Project to Target PC

Copy the entire `part_numbers_monitoring` folder to the target PC.

### Step 2: Navigate to Project Directory

```bash
cd part_numbers_monitoring
```

### Step 3: Start Everything with One Command

```bash
podman compose up --build
```

This single command will:
1. Build the backend Docker image (Python 3.11 + FastAPI)
2. Build the frontend Docker image (Node.js + React)
3. Start both services
4. Create a network so they can communicate
5. Expose ports for access

**Output should look like:**
```
Creating network "part_numbers_monitoring_part-monitor-net" with driver "bridge"
Building backend
Building frontend
Starting part_numbers_monitoring_backend_1
Starting part_numbers_monitoring_frontend_1
...
```

### Step 4: Access the App

Once both services are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

The frontend will automatically connect to the backend at `http://localhost:8000`.

## What's Happening Behind the Scenes

### Docker Images Built

1. **Backend Image**
   - Base: `python:3.11-slim`
   - Contains: FastAPI, SQLAlchemy, uvicorn, all dependencies from `requirements.txt`
   - Size: ~200MB
   - Runs on: port 8000

2. **Frontend Image**
   - Base: `node:20-alpine`
   - Build stage: Installs npm dependencies and builds React app with Vite
   - Production stage: Uses lightweight Alpine Linux with `serve` to run the built app
   - Size: ~100MB
   - Runs on: port 3000

### Networking

- Both services run in a shared Docker network (`part-monitor-net`)
- Frontend can reach backend at `http://backend:8000`
- Browser can access both at `localhost`

### Data Persistence

- SQLite database (`part_numbers.db`) is stored in `./backend/part_numbers.db`
- Data persists between container restarts
- Delete the file to reset the database

## Common Commands

### Stop the App
```bash
podman compose down
```

### Stop and Remove All Data
```bash
podman compose down -v
```

### View Logs
```bash
# All services
podman compose logs -f

# Backend only
podman compose logs -f backend

# Frontend only
podman compose logs -f frontend
```

### Restart Services
```bash
podman compose restart
```

### Check Running Containers
```bash
podman ps
```

## Troubleshooting

### Port Already in Use

If port 3000 or 8000 is already in use, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Changed from 8000:8000
  
  frontend:
    ports:
      - "3001:3000"  # Changed from 3000:3000
```

Then rebuild:
```bash
podman compose up --build
```

Access at: http://localhost:3001

### Frontend Can't Connect to Backend

If you see "Error: Unauthorized" or network errors:

1. Wait 15-20 seconds for backend to fully start (check health check logs)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart containers: `podman compose restart`

### Database Issues

Reset database and restart:
```bash
rm -f backend/part_numbers.db
podman compose up --build
```

## Security Notes

⚠️ **This setup is for local/internal use only!**

For production deployment:
- Use environment variables for sensitive data (not shown in docker-compose.yml)
- Enable HTTPS/SSL
- Add authentication to admin endpoints
- Use stronger password than `123`
- Restrict network access
- Regular backups of SQLite database

## Storage & Resource Requirements

- **Disk Space:** 
  - Docker base images: ~500MB (shared)
  - Backend image: ~200MB
  - Frontend image: ~100MB
  - Database: Grows with data (usually <10MB)

- **RAM:** 
  - Minimum: 512MB per container (~1GB total)
  - Recommended: 2GB+ for comfortable operation

## File Structure Inside Containers

### Backend Container
```
/app/
├── main.py
├── models.py
├── schemas.py
├── crud.py
├── database.py
├── requirements.txt
├── routers/
├── part_numbers.db
```

### Frontend Container
```
/app/
├── dist/           (built React app)
├── node_modules/   (dependencies)
├── package.json
├── vite.config.js
```

## Switching Between Local Dev and Docker

### Local Development (current setup)
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Docker (new setup)
```bash
podman compose up --build
```

Both approaches work fine. Docker is better for:
- Deployment to other PCs
- CI/CD pipelines
- Team collaboration (no version issues)
- Production deployment

## Updating the App

After modifying code, rebuild and restart:

```bash
podman compose up --build
```

This pulls the latest code from your local files and rebuilds the images.

## Using Docker Desktop Instead of Podman

If you prefer Docker Desktop (Windows/Mac):

1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Use the exact same commands:
```bash
docker-compose up --build
```

All commands are the same, just replace `podman compose` with `docker-compose`.

## Advanced: Customization

### Change Ports in docker-compose.yml

```yaml
services:
  backend:
    ports:
      - "8080:8000"  # Access backend at localhost:8080
  frontend:
    ports:
      - "5000:3000"  # Access frontend at localhost:5000
```

### Add Environment Variables

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - LOG_LEVEL=INFO
      - DATABASE_URL=sqlite:////app/part_numbers.db
```

### Build Images Separately

```bash
podman build -f Dockerfile.backend -t part-monitor-backend .
podman build -f Dockerfile.frontend -t part-monitor-frontend .
```

Then reference in `docker-compose.yml`:
```yaml
services:
  backend:
    image: part-monitor-backend
  frontend:
    image: part-monitor-frontend
```

## Getting Help

If something goes wrong:

1. **Check logs:** `podman compose logs -f`
2. **Check running containers:** `podman ps -a`
3. **Inspect a container:** `podman inspect <container_id>`
4. **Full reset:** Stop, remove everything, rebuild
   ```bash
   podman compose down -v
   podman system prune
   podman compose up --build
   ```

## Next Steps

- Bookmark http://localhost:3000
- Create a shortcut/script to run `podman compose up --build`
- Add admin panel features as needed
- Backup database regularly

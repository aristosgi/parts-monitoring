# Deployment Guide - Docker

## Overview

The app is now **fully dockerized**. You can deploy it to any PC with just **Podman installed** (or Docker). No Python, Node.js, or development tools needed.

## What You Get

✅ **Backend** (FastAPI + SQLite)
- Automatically containerized in `Dockerfile.backend`
- All dependencies from `requirements.txt` included
- Database file persists between restarts

✅ **Frontend** (React + Vite)
- Automatically containerized in `Dockerfile.frontend`
- Multi-stage build for optimal size
- Served with `serve` package

✅ **Networking**
- Both services communicate through Docker network
- Frontend accessible at http://localhost:3000
- Backend accessible at http://localhost:8000

## Files Created

```
part_numbers_monitoring/
├── docker-compose.yml          # Defines both services
├── Dockerfile.backend          # Backend image definition
├── Dockerfile.frontend         # Frontend image definition
├── .dockerignore              # Files to exclude from images
├── start.bat                  # Windows startup script
├── start.sh                   # Linux/Mac startup script
├── QUICK_DOCKER_START.md      # 30-second quickstart
├── DOCKER_SETUP.md            # Complete Docker guide
└── DEPLOYMENT.md              # This file
```

## Installation on Fresh PC

### Prerequisite: Install Podman

**Windows:**
1. Visit https://podman.io/docs/installation
2. Download Windows installer
3. Run installer and follow prompts

**macOS:**
```bash
brew install podman
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install podman
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install podman
```

Verify installation:
```bash
podman --version
```

### Run the App

1. Copy `part_numbers_monitoring` folder to the PC
2. Open terminal/PowerShell in that folder
3. Run one of these:

**Windows:**
```bash
./start.bat
# Or manually:
podman-compose up --build
```

**Linux/Mac:**
```bash
bash start.sh
# Or manually:
podman-compose up --build
```

### Access the App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Panel:** http://localhost:3000/admin (password: `123`)

## How Docker Streamlines Everything

### Without Docker (Old Way)
1. Install Python 3.11
2. Create virtual environment
3. Install 5+ Python packages
4. Install Node.js
5. npm install (downloads 1000+ packages)
6. Run backend in one terminal
7. Run frontend in another terminal
8. Total time: 15-20 minutes

### With Docker (New Way)
1. Install Podman (one-time)
2. Run `podman-compose up --build`
3. Total time: 2-3 minutes (first run), <5 seconds (subsequent runs)

## What Happens When You Run It

```
$ podman-compose up --build

# 1. Builds backend image
#    - Pulls Python 3.11 base image
#    - Installs requirements.txt
#    - Copies backend code

# 2. Builds frontend image
#    - Pulls Node.js base image
#    - npm install dependencies
#    - npm run build (creates dist/)
#    - Final image uses lightweight Alpine Linux

# 3. Starts both containers
#    - Backend on port 8000
#    - Frontend on port 3000
#    - Shared network for communication
```

## Image Sizes

| Image | Base | Size | Includes |
|-------|------|------|----------|
| Backend | python:3.11-slim | ~200MB | FastAPI, SQLAlchemy, all Python deps |
| Frontend | node:20-alpine | ~100MB | Built React app, serve package |
| **Total** | - | **~300MB** | Complete production-ready app |

## Data Persistence

SQLite database is stored at:
```
part_numbers_monitoring/backend/part_numbers.db
```

This file:
- Persists between container restarts
- Grows with data (usually <10MB)
- Should be backed up regularly
- Can be deleted to reset database

## Production Considerations

This setup works for:
- ✅ Local/internal company use
- ✅ Small teams (1-10 people)
- ✅ Testing and development
- ✅ Single-server deployment

For production (internet-facing):
- Use environment variables for secrets
- Set up HTTPS/SSL
- Implement stronger authentication
- Use stronger admin password
- Set up database backups
- Monitor container logs
- Consider using Docker Swarm or Kubernetes

## Troubleshooting

### "podman-compose: command not found"

Install podman-compose:

**macOS:**
```bash
brew install podman-compose
```

**Linux:**
```bash
pip install podman-compose
# Or
sudo dnf install podman-compose
# Or
sudo apt install podman-compose
```

**Windows:**
It comes with Podman on Windows. Restart terminal if not found.

### "Bind for 0.0.0.0:3000 failed"

Port 3000 is already in use. Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "3001:3000"  # Changed
```

Then restart: `podman-compose up --build`

### Database file grows too large

SQLite databases can grow with indices. If needed:

```bash
# Vacuum the database (requires backend to be stopped)
podman-compose down
sqlite3 backend/part_numbers.db "VACUUM;"
podman-compose up
```

## Backup Strategy

### Daily Backup
```bash
cp backend/part_numbers.db backups/part_numbers_$(date +%Y%m%d_%H%M%S).db
```

### Automated Backup (Linux/Mac)

Add to crontab (`crontab -e`):
```bash
0 2 * * * cp /path/to/part_numbers_monitoring/backend/part_numbers.db /path/to/backups/part_numbers_$(date +\%Y\%m\%d).db
```

This backs up the database daily at 2am.

## Updating the App

After modifying code:

```bash
podman-compose down
# Pull latest code (from git or copy)
podman-compose up --build
```

The `--build` flag ensures containers are rebuilt with new code.

## Performance

### System Requirements (Minimum)
- **RAM:** 512MB per container (~1GB total for both)
- **Disk:** 500MB for images + database size
- **CPU:** 1 core is sufficient for light usage

### System Requirements (Recommended)
- **RAM:** 2GB+
- **Disk:** 5GB+
- **CPU:** 2+ cores

## Network

Services communicate through Docker bridge network:

```
┌─────────────────────────────────────┐
│     Docker Network (port-monitor)   │
│                                     │
│  ┌──────────────┐  ┌────────────┐  │
│  │   Backend    │  │  Frontend  │  │
│  │ :8000        │  │  :3000     │  │
│  └──────────────┘  └────────────┘  │
│                                     │
│  Frontend can reach:                │
│  http://backend:8000/api            │
│                                     │
└─────────────────────────────────────┘
         ↓ (browser requests)
    http://localhost:3000 or :8000
    (from host machine)
```

## Monitoring Containers

```bash
# See running containers
podman ps

# See all containers (including stopped)
podman ps -a

# View logs
podman logs <container_id>

# Follow logs (live)
podman logs -f <container_id>

# Inspect container
podman inspect <container_id>

# Check resource usage
podman stats
```

## Cleanup

If you want to clean up:

```bash
# Stop all containers
podman-compose down

# Remove images
podman rmi part_numbers_monitoring_backend:latest
podman rmi part_numbers_monitoring_frontend:latest

# Full cleanup (be careful!)
podman system prune -a
```

## Alternative: Use Docker Instead of Podman

If Podman isn't available, use Docker Desktop instead:

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Commands are identical:
   ```bash
   docker-compose up --build
   ```

All configs work with both Podman and Docker.

## Scaling Notes

For multiple users/instances:

```bash
# Run multiple instances on different ports
# In docker-compose.yml, duplicate the service with different port mappings
```

Or use orchestration:
- Docker Swarm (built-in to Docker)
- Kubernetes (more complex, more powerful)
- AWS ECS, Azure Container Instances, etc.

## Next Steps

1. ✅ Install Podman
2. ✅ Copy project folder
3. ✅ Run `podman-compose up --build`
4. ✅ Bookmark http://localhost:3000
5. ✅ Start using the app!

That's it! No lengthy setup, no version conflicts, no missing dependencies.

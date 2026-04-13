# Quick Docker Start

## For Someone With No Python/Node.js/Git

### Step 1: Install Podman (Only dependency!)

**Windows:** Download from https://podman.io/docs/installation and run installer

**macOS:** `brew install podman`

**Linux:** `sudo apt install podman` (Ubuntu) or `sudo dnf install podman` (Fedora)

### Step 2: Copy Project Folder

Copy the `part_numbers_monitoring` folder to the PC

### Step 3: Open Terminal/PowerShell

Navigate to the project:
```
cd path/to/part_numbers_monitoring
```

### Step 4: Run This Single Command

```
podman compose up --build
```

**That's it!** Both the app and backend will start automatically.

### Step 5: Open in Browser

- **App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin (password: `123`)

## What This Does

| What | Where | Without Docker | With Docker |
|------|-------|---|---|
| Frontend | localhost:3000 | Need Node.js + npm | ✓ Automatic |
| Backend API | localhost:8000 | Need Python 3.11 + pip | ✓ Automatic |
| Database | local SQLite file | Created automatically | ✓ Created automatically |
| Setup time | - | 10-15 minutes | 2-3 minutes (first run) |

## If Something Goes Wrong

### App won't start
```bash
# See what's happening
podman compose logs -f

# Full reset
podman compose down -v
podman compose up --build
```

### Ports already in use
Edit `docker-compose.yml` and change ports:
```yaml
ports:
  - "8001:8000"  # Instead of 8000:8000
  - "3001:3000"  # Instead of 3000:3000
```

Then access at http://localhost:3001

### Podman not found
Make sure Podman is installed: `podman --version`

## Using the App

1. Go to http://localhost:3000
2. Select a user (Simos, Lenia, or Dimitris)
3. Add parts, track prices, manage suppliers

Admin panel at http://localhost:3000/admin with password `123`

## Stop Everything

Press `Ctrl+C` in the terminal, or:
```bash
podman compose down
```

## For More Details

Read `DOCKER_SETUP.md` for complete documentation.

## That's All!

No Python installation needed. No Node.js installation needed. Just Podman and that's it!

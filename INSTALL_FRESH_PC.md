# Install on Fresh PC (Zero Software)

## What You Need
- A PC with Windows, Mac, or Linux
- Internet connection
- USB drive OR shared folder (to copy the project)

## Complete Installation (15 minutes)

### STEP 1: Install Podman (5 minutes)

**WINDOWS:**
1. Go to: https://podman.io/docs/installation
2. Click "Windows" → Download installer
3. Run the `.msi` file
4. Click "Next" → "Install" → "Finish"
5. Restart your computer

**MAC:**
```bash
brew install podman
podman machine init
podman machine start
```

**LINUX (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install podman
```

### STEP 2: Get the Project (2 minutes)

Option A - **From USB:**
- Copy the `part_numbers_monitoring` folder from USB to your PC
- Put it somewhere easy, like: `C:\Users\YourName\Desktop\part_numbers_monitoring`

Option B - **From Network/Email:**
- Unzip the `part_numbers_monitoring.zip` file
- Extract to your Desktop or any folder

### STEP 3: Start the App (1 minute)

**WINDOWS:**
1. Open PowerShell (Windows button → type "PowerShell" → Enter)
2. Type: 
   ```
   cd C:\Users\YourName\Desktop\part_numbers_monitoring
   ```
3. Type:
   ```
   podman compose up --build
   ```
4. Wait 2-3 minutes (it will download and start everything)
5. When you see "...listening on 0.0.0.0:3000" → it's ready!

**MAC/LINUX:**
1. Open Terminal
2. Type:
   ```
   cd /path/to/part_numbers_monitoring
   ```
3. Type:
   ```
   podman compose up --build
   ```
4. Wait 2-3 minutes
5. When you see "...listening on 0.0.0.0:3000" → it's ready!

### STEP 4: Open the App (1 minute)

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:3000**
3. Select a user: Simos, Lenia, or Dimitris
4. Start using the app!

### STEP 5: Admin Panel (Optional)

- Go to: **http://localhost:3000/admin**
- Enter password: **123**
- Manage suppliers, change settings, etc.

## That's It! 🎉

No Python. No Node.js. No Git. Just Podman and you're done!

---

## How to Stop the App

1. In PowerShell/Terminal where you ran the app
2. Press **Ctrl + C**
3. Wait a few seconds
4. Done!

To start again: Run `podman compose up --build` again from the same folder

---

## What Was Installed?

| Thing | What it does | Size |
|-------|-------------|------|
| Podman | Runs containerized apps | ~150MB |
| Backend (Python) | Manages data & API | Downloaded when needed |
| Frontend (React) | The web interface | Downloaded when needed |
| Database | Stores your parts & prices | Grows with use |

**Total download:** ~500MB on first run
**Disk space used:** ~1GB after setup

---

## If Something Goes Wrong

### "Podman is not found" or "command not recognized"
- Podman installation failed
- Restart your computer and try again
- Or reinstall Podman from https://podman.io/docs/installation

### "Ports already in use"
Another app is using port 3000 or 8000
- Edit `docker-compose.yml` (open with Notepad)
- Change `3000:3000` to `3001:3000`
- Run `podman compose up --build` again
- Open http://localhost:3001 instead

### "Waiting for dependencies..." takes forever
- Make sure you have internet connection
- First run takes 2-3 minutes (downloading everything)
- Subsequent runs are much faster

### Still stuck?
Run this to see what's happening:
```
podman compose logs -f
```
This shows error messages that might help

---

## Using Multiple PCs

Same process on each PC:
1. Install Podman (one time per PC)
2. Copy the `part_numbers_monitoring` folder
3. Run `podman compose up --build`
4. Open http://localhost:3000

Each PC has its own database (separate from others).

---

## Backup Your Data

Your data is in a Podman volume. To backup:

**Windows PowerShell:**
```powershell
podman run --rm -v part_numbers_monitoring_db_data:/data alpine tar czf - /data > backup.tar.gz
```

**Mac/Linux:**
```bash
podman run --rm -v part_numbers_monitoring_db_data:/data alpine tar czf - /data > backup.tar.gz
```

This creates a `backup.tar.gz` file. Keep it safe!

---

## Need Help?

- Check logs: `podman compose logs -f`
- Restart app: Press Ctrl+C then run `podman compose up --build` again
- Reset everything: `podman compose down -v` then `podman compose up --build`
- Read `DOCKER_SETUP.md` for advanced options

---

**You're all set! Enjoy the app!** 🚀

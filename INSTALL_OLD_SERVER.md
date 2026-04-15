# Installation on Old/Legacy Server

## Safety Considerations

Old servers often have:
- Limited resources (RAM, disk space)
- Legacy OS (Windows Server 2012, CentOS 6, old Ubuntu)
- Security restrictions
- Critical services already running
- No internet or slow internet

This guide prioritizes **safety over convenience**.

---

## Option 1: Docker on Old Server (Recommended)

**Pros:**
- Isolated environment (won't break existing services)
- Predictable dependencies
- Easy to remove

**Cons:**
- Docker needs newer OS kernel

### Prerequisites Check

```bash
# Check OS/kernel version
uname -a  # Linux
systeminfo  # Windows Server

# Windows Server 2016+ or Linux kernel 3.10+
```

### Installation Steps

1. **Install Docker/Podman**
   - Windows Server 2016+: Use Docker Desktop or Podman
   - Linux: `sudo apt install docker.io` or equivalent
   - Older systems: May need manual container runtime setup

2. **Copy project folder** to server (e.g., `/opt/parts-monitoring/`)

3. **Run with network isolation:**
   ```bash
   podman compose up --build -d
   ```

4. **Verify it's running:**
   ```bash
   podman ps
   curl http://localhost:3000
   ```

5. **Configure auto-restart:**
   ```bash
   # Create systemd service
   sudo nano /etc/systemd/system/parts-monitoring.service
   ```
   
   ```ini
   [Unit]
   Description=Part Numbers Monitoring
   After=network.target
   
   [Service]
   Type=simple
   WorkingDirectory=/opt/parts-monitoring
   ExecStart=/usr/bin/podman compose up
   Restart=always
   RestartSec=10
   User=appuser
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl enable parts-monitoring
   sudo systemctl start parts-monitoring
   ```

---

## Option 2: Native Installation (For Older Systems Without Docker)

**Use this if Docker won't run on your server**

### Step 1: Verify Server Resources

```bash
# Check available resources
free -h  # RAM
df -h    # Disk space
# Need: ~500MB RAM, ~2GB disk space minimum
```

### Step 2: Install Python 3.11

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
```

**CentOS/RHEL:**
```bash
sudo yum install python3.11
```

**Windows Server:**
Download from python.org, install with `/quiet` flag

### Step 3: Install Node.js 18 (Frontend Only)

**Ubuntu/Debian:**
```bash
sudo apt install nodejs npm
# Or use NodeSource repo for newer versions
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

**CentOS/RHEL:**
```bash
sudo yum install nodejs npm
```

**Windows Server:**
Download from nodejs.org, run installer

### Step 4: Clone Project

```bash
git clone https://github.com/aristosgi/parts-monitoring.git
cd parts-monitoring
```

Or copy the folder if git isn't available.

### Step 5: Create Isolated User (Linux - Security Best Practice)

```bash
sudo useradd -m -s /bin/bash appuser
sudo chown -R appuser:appuser /opt/parts-monitoring
sudo su - appuser
```

### Step 6: Backend Setup

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 7: Frontend Setup

```bash
cd ../frontend
npm install
npm run build  # Creates production build in dist/
```

### Step 8: Production Server

**Use nginx as reverse proxy:**

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/parts-monitoring`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-server-ip;

    # Frontend (static files)
    location / {
        root /opt/parts-monitoring/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/parts-monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Run Backend as Service

Create `/etc/systemd/system/parts-monitoring-backend.service`:

```ini
[Unit]
Description=Parts Monitoring Backend
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/parts-monitoring/backend
ExecStart=/opt/parts-monitoring/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable parts-monitoring-backend
sudo systemctl start parts-monitoring-backend
```

### Step 10: Verify Installation

```bash
# Check services
sudo systemctl status parts-monitoring-backend
curl http://localhost:8000/api/health
curl http://localhost/

# View logs
sudo journalctl -u parts-monitoring-backend -f
```

---

## Database on Old Server

### Option A: Keep SQLite (Recommended for small deployments)

**Location:** `/var/lib/parts-monitoring/part_numbers.db`

**Backup:**
```bash
sudo cp /var/lib/parts-monitoring/part_numbers.db /backups/part_numbers.db.backup
```

**Restore:**
```bash
sudo cp /backups/part_numbers.db.backup /var/lib/parts-monitoring/part_numbers.db
sudo chown appuser:appuser /var/lib/parts-monitoring/part_numbers.db
```

### Option B: PostgreSQL/MySQL (For critical deployments)

If your server already has PostgreSQL/MySQL:

1. Create database:
   ```sql
   CREATE DATABASE parts_monitoring;
   ```

2. Update `backend/database.py`:
   ```python
   DATABASE_URL = "postgresql://user:pass@localhost/parts_monitoring"
   # or
   DATABASE_URL = "mysql+pymysql://user:pass@localhost/parts_monitoring"
   ```

3. Install driver:
   ```bash
   pip install psycopg2-binary  # For PostgreSQL
   # or
   pip install pymysql  # For MySQL
   ```

---

## Network Security on Old Server

### Restrict Access

**Firewall (UFW - Ubuntu):**
```bash
sudo ufw allow from 192.168.1.0/24 to any port 80  # Internal network only
sudo ufw enable
```

**Windows Firewall:**
Use Windows Defender Firewall with Advanced Security GUI or:
```powershell
New-NetFirewallRule -DisplayName "Parts Monitor" -Direction Inbound -LocalPort 80 -Action Allow
```

### HTTPS (If accessible from internet)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

Update nginx config:
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

---

## Backup Strategy

### Daily Backup Script

Create `/home/appuser/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/parts-monitoring"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /var/lib/parts-monitoring/part_numbers.db $BACKUP_DIR/part_numbers.db.$DATE

# Keep only last 30 days
find $BACKUP_DIR -name "*.db.*" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Schedule Backup (cron)

```bash
# Run daily at 2 AM
0 2 * * * /home/appuser/backup.sh >> /var/log/parts-monitoring-backup.log 2>&1
```

---

## Monitoring on Old Server

### Simple Health Check

```bash
# Create /home/appuser/health-check.sh
#!/bin/bash
curl -f http://localhost:8000/api/health || systemctl restart parts-monitoring-backend
```

### Schedule (every 5 minutes)

```bash
*/5 * * * * /home/appuser/health-check.sh >> /var/log/parts-monitoring-health.log 2>&1
```

### View Logs

```bash
# System logs
sudo journalctl -u parts-monitoring-backend -n 50

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/parts-monitoring-health.log
```

---

## Troubleshooting

### "Address already in use"
Another service is using port 80 or 8000
```bash
sudo lsof -i :80
sudo lsof -i :8000
# Stop the conflicting service or change ports in nginx/systemd
```

### "Permission denied"
Check file ownership:
```bash
sudo chown -R appuser:appuser /opt/parts-monitoring
sudo chown -R appuser:appuser /var/lib/parts-monitoring
```

### "Out of memory"
Old server might not have enough RAM. Check:
```bash
free -h
watch -n 1 free -h  # Monitor in real-time
```

Limit Python memory usage:
```bash
# In systemd service, add:
Environment="MALLOC_TRIM_THRESHOLD_=128000"
```

### "Database locked"
SQLite doesn't handle concurrent access well on old hardware. Either:
1. Use PostgreSQL/MySQL instead
2. Reduce number of users
3. Use Docker for isolation

---

## What NOT to Do

❌ Run as root (security risk)
❌ Disable firewall completely
❌ Use weak admin password
❌ Ignore backups
❌ Install during business hours (test first!)
❌ Skip OS security updates
❌ Store database in /tmp (it gets deleted)

---

## Before Going Live

Checklist:
- [ ] Test on non-production server first
- [ ] Backup existing data
- [ ] Document all changes
- [ ] Create rollback plan
- [ ] Set up monitoring/health checks
- [ ] Test database backups and restores
- [ ] Configure firewall rules
- [ ] Test from different machines
- [ ] Document admin password (store securely)
- [ ] Schedule regular backups

---

## Quick Comparison

| Aspect | Docker | Native |
|--------|--------|--------|
| Setup Time | 5 min | 30 min |
| Isolation | Excellent | Good |
| Old Server Support | 2016+ | 2008+ |
| Resource Usage | Moderate | Light |
| Maintenance | Simpler | More complex |
| Rollback | Easy | Manual |
| Security | Better | OK |

---

## Support

If issues arise:
1. Check `/etc/systemd/journal` for errors
2. Review nginx logs: `/var/log/nginx/`
3. Test backend directly: `curl http://localhost:8000/api/config`
4. Check database permissions: `ls -la /var/lib/parts-monitoring/`
5. Verify firewall isn't blocking: `sudo ufw status`


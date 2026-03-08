# Vite Sandbox Deployment Guide

## Droplet: 159.203.128.171 (8GB / 4 vCPU)

### 1. Deploy updated server.js

```bash
# SSH into the droplet
ssh root@159.203.128.171

# Navigate to the sandbox directory
cd /opt/vite-sandbox

# Backup current server
cp server.js server.js.bak

# Upload new server.js (from local machine)
# Option A: scp from your machine
scp vite-sandbox/server.js root@159.203.128.171:/opt/vite-sandbox/server.js

# Option B: copy-paste via nano
nano server.js
# paste contents, Ctrl+X, Y, Enter
```

### 2. Re-run template setup (syncs node_modules with new packages)

```bash
cd /opt/vite-sandbox
chmod +x setup-template.sh
./setup-template.sh
```

### 3. Restart the service

```bash
# If using systemd:
systemctl restart vite-sandbox

# If using pm2:
pm2 restart vite-sandbox

# If running directly:
pkill -f "node server.js"
nohup node server.js > /var/log/vite-sandbox.log 2>&1 &
```

### 4. Verify it's running

```bash
curl -s http://localhost:3100/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "activeBuildCount": 0,
  "maxConcurrent": 20,
  "warmPoolSize": 8,
  "memoryMB": <current_rss>
}
```

### 5. Deploy compile-vite edge function

This happens automatically when you push changes to the `supabase/functions/compile-vite/` directory. No manual deployment needed in Lovable.

## Capacity Summary (8GB droplet)

| Parameter | Old (2GB) | New (8GB) |
|-----------|-----------|-----------|
| MAX_CONCURRENT | 5 | 20 |
| MAX_QUEUED | 5 | 15 |
| WARM_POOL_SIZE | 3 | 8 |
| MEMORY_LIMIT_MB | 1500 | 6500 |
| Install concurrency | 1 | 3 |

## Rollback

```bash
ssh root@159.203.128.171
cd /opt/vite-sandbox
cp server.js.bak server.js
systemctl restart vite-sandbox
```

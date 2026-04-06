#!/bin/bash
# deploy.sh — Idempotent deployment script for ShopSmart on EC2
# Safe to run multiple times. Uses -p flags, checks before creating.
set -e

echo "==> Starting ShopSmart deployment..."

# ── 1. System dependencies (idempotent: apt is safe to re-run) ──────────────
sudo apt-get update -y
sudo apt-get install -y curl git

# ── 2. Install Node.js 20 if not already installed ──────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node.js already installed: $(node -v)"
fi

# ── 3. Install PM2 globally if not present ──────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "==> Installing PM2..."
  sudo npm install -g pm2
else
  echo "==> PM2 already installed: $(pm2 -v)"
fi

# ── 4. Create app directory (idempotent: -p flag) ───────────────────────────
mkdir -p /home/ubuntu/shopsmart
mkdir -p /home/ubuntu/shopsmart/server/data

# ── 5. Pull latest code ──────────────────────────────────────────────────────
cd /home/ubuntu/shopsmart
if [ -d ".git" ]; then
  echo "==> Pulling latest code..."
  git pull origin main
else
  echo "==> Cloning repository..."
  git clone https://github.com/Suryansh0910/shopsmart.git .
fi

# ── 6. Install backend dependencies ─────────────────────────────────────────
echo "==> Installing backend dependencies..."
cd /home/ubuntu/shopsmart/server
npm ci --omit=dev

# ── 7. Install frontend dependencies and build ──────────────────────────────
echo "==> Building frontend..."
cd /home/ubuntu/shopsmart/client
npm ci
npm run build

# ── 8. Start or restart backend with PM2 (idempotent) ───────────────────────
cd /home/ubuntu/shopsmart
echo "==> Starting backend with PM2..."
if pm2 describe shopsmart-backend &>/dev/null; then
  pm2 restart shopsmart-backend
else
  pm2 start server/src/index.js --name shopsmart-backend
fi

# Save PM2 process list so it survives reboots
pm2 save

# ── 9. Enable PM2 startup on reboot (idempotent) ────────────────────────────
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo ""
echo "==> Deployment complete! Backend running via PM2."
echo "    Run 'pm2 logs shopsmart-backend' to see logs."

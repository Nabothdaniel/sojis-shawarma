#!/bin/bash

# ==========================================
# Integrated Startup Script for BamzySMS
# ==========================================

# 1. Start XAMPP (Apache and MySQL)
# This usually requires sudo privileges
echo "------------------------------------------"
echo "Starting XAMPP services (Apache & MySQL)..."
echo "------------------------------------------"
sudo /opt/lampp/lampp start

# 2. Start PHP Backend Server (Port 8000)
# This is required because the frontend expects the API at localhost:8000
echo ""
echo "------------------------------------------"
echo "Freeing port 8000 to prevent startup conflicts..."
fuser -k 8000/tcp 2>/dev/null || true
echo "Starting PHP Backend Server (Port 8000)..."
echo "------------------------------------------"
# Enable multi-processing for SSE support
export PHP_CLI_SERVER_WORKERS=10
# We use the XAMPP PHP binary for consistency
/opt/lampp/bin/php -S 127.0.0.1:8000 -t backend/public backend/public/index.php &

# 3. Start Migration Watcher
echo ""
echo "------------------------------------------"
echo "Starting Migration Watcher..."
echo "------------------------------------------"
/opt/lampp/bin/php watch_migrations.php &

# 4. Start Next.js Frontend
echo ""
echo "------------------------------------------"
echo "Starting Next.js Frontend Developer Server..."
echo "------------------------------------------"
npm run dev

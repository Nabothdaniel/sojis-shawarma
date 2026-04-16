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
echo "Starting PHP Backend Server (Port 8000)..."
echo "------------------------------------------"
# Enable multi-processing for SSE support
export PHP_CLI_SERVER_WORKERS=5
# We use the XAMPP PHP binary for consistency
/opt/lampp/bin/php -S localhost:8000 -t backend/public &

# 3. Start Next.js Frontend
echo ""
echo "------------------------------------------"
echo "Starting Next.js Frontend Developer Server..."
echo "------------------------------------------"
npm run dev

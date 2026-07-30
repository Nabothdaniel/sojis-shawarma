#!/bin/bash
set -e

# Kill background processes on exit
trap "kill 0" EXIT

echo "🚀 Starting Soji's Shawarma Full-stack Environment..."

# Stop any existing XAMPP services and system Apache for a clean restart
echo "Stopping XAMPP and System Apache/MySQL for a clean restart..."
sudo systemctl stop apache2 2>/dev/null || true
sudo /opt/lampp/lampp stopapache 2>/dev/null || true
sudo /opt/lampp/lampp stopmysql 2>/dev/null || true

# Start XAMPP services
echo "🐬 Starting XAMPP MySQL and Apache..."
sudo /opt/lampp/lampp startmysql
sudo /opt/lampp/lampp startapache

echo "------------------------------------------"
echo "Freeing ports 3000 and 8000 to prevent startup conflicts..."
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true

echo "------------------------------------------"
echo "Starting PHP Backend Server on http://127.0.0.1:8000..."
# Use system PHP instead of XAMPP PHP, with increased upload limits
php -d upload_max_filesize=20M -d post_max_size=20M -S 127.0.0.1:8000 -t backend/public backend/public/index.php &

echo "⚛️  Starting Next.js Frontend on http://localhost:3000..."
npm run dev

# Wait for all background processes
wait

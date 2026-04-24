#!/bin/bash
set -e

# Kill background processes on exit
trap "kill 0" EXIT

echo "🚀 Starting Soji's Shawarma Full-stack Environment..."

# Start XAMPP MySQL only (skip Apache since system Apache is running)
echo "🐬 Starting XAMPP MySQL..."
sudo /opt/lampp/lampp startmysql

echo "------------------------------------------"
echo "Freeing port 8000 to prevent startup conflicts..."
fuser -k 8000/tcp 2>/dev/null || true

echo "------------------------------------------"
echo "Starting PHP Backend Server on http://127.0.0.1:8000..."
# Use system PHP instead of XAMPP PHP
php -S 127.0.0.1:8000 -t backend/public backend/public/index.php &

echo "⚛️  Starting Next.js Frontend on http://localhost:3000..."
npm run dev

# Wait for all background processes
wait

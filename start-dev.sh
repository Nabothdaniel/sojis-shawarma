#!/bin/bash

# Kill background processes on exit
trap "kill 0" EXIT

echo "🚀 Starting Soji's Shawarma Full-stack Environment..."

# Start XAMPP (Apache + MySQL)
# Assuming typical Linux installation path. Adjust if necessary.
echo "🐬 Starting XAMPP Services..."
sudo /opt/lampp/lampp start

# Start Next.js Frontend
echo "⚛️  Starting Next.js Frontend on http://localhost:3000..."
npm run dev

# Wait for all background processes (Next.js is running in foreground above)
wait

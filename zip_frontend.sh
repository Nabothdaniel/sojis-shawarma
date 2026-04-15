#!/bin/bash

# Configuration
PROJECT_DIR="Bamzysms"
OUTPUT_DIR="out"
ZIP_NAME="frontend_ready.zip"

echo "🚀 Preparing Frontend Deployment Package..."

# 1. Check if we are in the right directory
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "❌ Error: '$OUTPUT_DIR' directory not found."
    echo "💡 Tip: Make sure you have 'output: \"export\"' enabled in your next.config.ts and ran 'npm run build'."
    exit 1
fi

# 2. Clean up old zips
if [ -f "$ZIP_NAME" ]; then
    echo "🧹 Removing old $ZIP_NAME..."
    rm "$ZIP_NAME"
fi

# 3. Create new zip
echo "📦 Zipping contents of $OUTPUT_DIR..."
cd "$OUTPUT_DIR" || exit
zip -r "../$ZIP_NAME" .
cd ..

echo "✅ Success! Your deployment package is ready at: $ZIP_NAME"
echo "👉 Upload this file to your cPanel File Manager and extract it in the desired directory."

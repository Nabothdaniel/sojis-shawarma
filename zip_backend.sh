#!/bin/bash

# BamzySMS Backend Packaging Script
# This script prepares a ZIP for cPanel hosting under /api

# 1. Setup temporary directory
TMP_DIR="temp_package"
rm -rf $TMP_DIR
mkdir -p $TMP_DIR/api

echo "📦 Preparing backend package..."

# 2. Copy core backend folders
cp -r backend/src $TMP_DIR/api/
cp -r backend/routes $TMP_DIR/api/
cp -r backend/config $TMP_DIR/api/
cp -r backend/storage $TMP_DIR/api/
cp backend/.env.example $TMP_DIR/api/

# 3. Copy public entry files to api/ root
cp backend/public/index.php $TMP_DIR/api/
cp backend/public/.htaccess $TMP_DIR/api/

# 4. Clean up unnecessary files
find $TMP_DIR -name ".DS_Store" -delete
find $TMP_DIR -name "error_log" -delete

# 5. Add DB Schema and Instructions to the root for reference (outside zip root if zipping api folder)
# Usually better to have them inside the zip or separate. 
# We'll put them in the zip but outside the api/ folder if the user zips the root.
cp backend/database_production.sql $TMP_DIR/
cp backend_deploy_instruct.txt $TMP_DIR/

# 6. Create the ZIP
cd $TMP_DIR
zip -r ../backend_ready.zip .
cd ..

# 7. Cleanup
rm -rf $TMP_DIR

echo "✅ Success! created backend_ready.zip"
echo "👉 Follow the instructions in backend_deploy_instruct.txt to deploy."

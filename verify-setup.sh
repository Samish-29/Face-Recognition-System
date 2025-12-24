#!/bin/bash

# Verification script for FaceWhiz setup
echo "FaceWhiz Setup Verification"
echo "==========================="

# Required files and directories
required_files=(
  "backend/sever.js"
  "backend/db.js"
  "frontend/index.html"
  "frontend/script.js"
  "frontend/style.css"
  "frontend/components/navbar.js"
  "package.json"
  ".env"
  "README.md"
)

required_dirs=(
  "backend/public/models"
  "backend/public/uploads"
  "frontend/models"
)

all_good=true

echo "Checking required files..."
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (MISSING)"
    all_good=false
  fi
done

echo ""
echo "Checking required directories..."
for dir in "${required_dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo "✓ $dir"
  else
    echo "✗ $dir (MISSING)"
    all_good=false
  fi
done

echo ""
echo "Checking database file..."
if [ -f "backend/facewhiz.db" ]; then
  echo "✓ Database file exists"
else
  echo "ℹ Database file will be created on first run"
fi

echo ""
echo "=================================================="
if [ "$all_good" = true ]; then
  echo "✅ All required files and directories are in place!"
  echo ""
  echo "Next steps:"
  echo "1. Install Node.js if not already installed"
  echo "2. Run 'npm install' to install dependencies"
  echo "3. Run 'npm run download-models' to get face recognition models"
  echo "4. Start the backend with 'npm start'"
  echo "5. Start the frontend with 'npm run frontend'"
  echo "6. Open your browser to http://localhost:5173"
else
  echo "⚠️  Some required files are missing."
  echo "Please check the output above and ensure all components are properly set up."
fi
echo "=================================================="
#!/usr/bin/env node

// Verification script for FaceWhiz setup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('FaceWhiz Setup Verification');
console.log('===========================');

// Required files and directories
const requiredPaths = [
  // Backend files
  'backend/sever.js',
  'backend/db.js',
  
  // Frontend files
  'frontend/index.html',
  'frontend/script.js',
  'frontend/style.css',
  'frontend/components/navbar.js',
  
  // Configuration files
  'package.json',
  '.env',
  'README.md'
];

// Required directories
const requiredDirs = [
  'backend/public/models',
  'backend/public/uploads',
  'frontend/models'
];

let allGood = true;

console.log('Checking required files...');
for (const filePath of requiredPaths) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${filePath}`);
  } else {
    console.log(`✗ ${filePath} (MISSING)`);
    allGood = false;
  }
}

console.log('\nChecking required directories...');
for (const dirPath of requiredDirs) {
  const fullPath = path.join(__dirname, dirPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${dirPath}`);
  } else {
    console.log(`✗ ${dirPath} (MISSING)`);
    allGood = false;
  }
}

console.log('\nChecking database file...');
const dbPath = path.join(__dirname, 'backend', 'facewhiz.db');
if (fs.existsSync(dbPath)) {
  console.log('✓ Database file exists');
} else {
  console.log('ℹ Database file will be created on first run');
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All required files and directories are in place!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to install dependencies');
  console.log('2. Run "npm run download-models" to get face recognition models');
  console.log('3. Start the backend with "npm start"');
  console.log('4. Start the frontend with "npm run frontend"');
  console.log('5. Open your browser to http://localhost:5173');
} else {
  console.log('⚠️  Some required files are missing.');
  console.log('Please check the output above and ensure all components are properly set up.');
}
console.log('='.repeat(50));
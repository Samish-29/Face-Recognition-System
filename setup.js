#!/usr/bin/env node

// Setup script for FaceWhiz
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('FaceWhiz Setup Script');
console.log('====================');

// Check if required directories exist
const requiredDirs = [
  path.join(__dirname, 'backend', 'public'),
  path.join(__dirname, 'backend', 'public', 'models'),
  path.join(__dirname, 'backend', 'public', 'uploads'),
  path.join(__dirname, 'frontend', 'models')
];

console.log('Checking required directories...');

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory exists: ${dir}`);
  }
}

console.log('\nSetup complete!');
console.log('\nNext steps:');
console.log('1. Download face recognition models from https://github.com/justadudewhohacks/face-api.js/weights/');
console.log('2. Place the model files in both:');
console.log('   - backend/public/models/');
console.log('   - frontend/models/');
console.log('3. Run "npm install" to install dependencies');
console.log('4. Start the backend with "npm start"');
console.log('5. Start the frontend with "npm run frontend"');
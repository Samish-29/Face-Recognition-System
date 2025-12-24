#!/usr/bin/env node

// Script to download face-api.js models
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URLS = [
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1'
];

const TARGET_DIRS = [
  path.join(__dirname, 'frontend', 'models'),
  path.join(__dirname, 'backend', 'public', 'models')
];

console.log('FaceWhiz Model Downloader');
console.log('========================');
console.log('Downloading face-api.js models...\n');

// Create target directories if they don't exist
for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(destPath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  try {
    for (const url of MODEL_URLS) {
      const fileName = url.split('/').pop();
      console.log(`Downloading ${fileName}...`);
      
      // Download to both locations
      for (const dir of TARGET_DIRS) {
        const destPath = path.join(dir, fileName);
        await downloadFile(url, destPath);
      }
    }
    
    console.log('\n✅ All models downloaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Run "npm install" to install dependencies');
    console.log('2. Start the backend with "npm start"');
    console.log('3. Start the frontend with "npm run frontend"');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    console.log('\nPlease download the models manually from:');
    console.log('https://github.com/justadudewhohacks/face-api.js/weights/');
  }
}

// Run the download
downloadModels();
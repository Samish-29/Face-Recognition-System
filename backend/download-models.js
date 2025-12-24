import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// Model files to download
const models = [
    // Tiny Face Detector
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    
    // Face Landmark 68
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    
    // Face Recognition
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    
    // Face Expression
    'face_expression_model-weights_manifest.json',
    'face_expression_model-shard1'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded: ${path.basename(filepath)}`);
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirects
                file.close();
                fs.unlinkSync(filepath);
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

async function downloadModels() {
    console.log('Starting model download...');
    console.log(`Models will be saved to: ${modelsDir}\n`);
    
    for (const model of models) {
        const url = `${baseUrl}/${model}`;
        const filepath = path.join(modelsDir, model);
        
        try {
            await downloadFile(url, filepath);
        } catch (error) {
            console.error(`✗ Failed to download ${model}:`, error.message);
        }
    }
    
    console.log('\n✓ Model download complete!');
    console.log(`Models are available at: ${modelsDir}`);
}

downloadModels().catch(console.error);
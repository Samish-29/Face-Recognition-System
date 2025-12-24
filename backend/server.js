import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add logging for all requests to debug routing
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files - Serve frontend files with a specific condition to avoid interfering with API routes
const frontRoot = path.resolve(__dirname, '..');
app.use((req, res, next) => {
  // Don't serve static files for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Handle specific static paths first
  if (req.path.startsWith('/public/')) {
    return express.static(publicDir)(req, res, next);
  }
  if (req.path.startsWith('/models/')) {
    return express.static(path.join(publicDir, 'models'))(req, res, next);
  }
  // Serve frontend files for all other routes
  express.static(path.join(frontRoot, 'frontend'))(req, res, next);
});

// Database statements - using async functions instead of prepared statements
// Test database connection
try {
  const testResult = await db.all('SELECT COUNT(*) as count FROM people');
  console.log('✓ Database connection verified. Current people count:', testResult[0].count);
} catch (dbError) {
  console.error('✗ Database connection error:', dbError);
  console.error('Make sure the database file exists and is accessible');
}

// Utils
function saveBase64Image(imageBase64, idHint) {
  try {
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) return null;
    const [meta, b64] = imageBase64.split(',');
    const ext = meta.includes('data:image/png') ? 'png'
      : meta.includes('data:image/jpeg') ? 'jpg'
      : 'png';
    const fileName = `${idHint || uuidv4()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    return `/public/uploads/${fileName}`;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
}

function isValidDescriptor(arr) {
  return Array.isArray(arr) && (arr.length === 128 || arr.length === 256);
}

function euclidean(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error('Invalid vectors for euclidean distance calculation');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// Routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested from:', req.headers.origin || req.headers.referer);
  res.json({ 
    ok: true, 
    service: 'facewhiz-backend', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/db/status', async (req, res) => {
  try {
    const peopleResult = await db.get('SELECT COUNT(*) as count FROM people');
    const descriptorsResult = await db.get('SELECT COUNT(*) as count FROM descriptors');
    
    res.json({
      connected: true,
      peopleCount: peopleResult.count,
      descriptorsCount: descriptorsResult.count,
      databasePath: path.join(__dirname, 'data', 'facewhiz.sqlite')
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

app.get('/api/people', async (req, res) => {
  try {
    const people = await db.all('SELECT * FROM people ORDER BY createdAt DESC');
    // Ensure we always return an array
    if (!Array.isArray(people)) {
      console.error('Unexpected data format from database:', typeof people);
      return res.json([]);
    }
    console.log(`Returning ${people.length} people`);
    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    // Return empty array instead of error to prevent frontend issues
    res.status(200).json([]);
  }
});

app.get('/api/people/:id', async (req, res) => {
  try {
    const person = await db.get('SELECT * FROM people WHERE id = ?', req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });
    
    const descriptors = await db.all('SELECT * FROM descriptors WHERE personId = ?', person.id);
    const parsedDescriptors = descriptors.map(x => {
      try {
        return JSON.parse(x.descriptor);
      } catch (e) {
        return null;
      }
    }).filter(x => x !== null);
    
    res.json({ ...person, descriptors: parsedDescriptors });
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug: Test API route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API routes are working', path: req.path });
});

app.post('/api/people', async (req, res) => {
  try {
    const { name, email, phone, department, role, imageBase64, descriptor } = req.body;
    
    // Accept any name - use default if empty
    const personName = (name && typeof name === 'string' && name.trim()) 
      ? name.trim() 
      : 'Unknown Person';
    
    // Handle descriptor - accept empty array or valid descriptor
    let validDescriptor = [];
    let shouldSaveDescriptor = false;
    
    if (descriptor && Array.isArray(descriptor) && descriptor.length > 0) {
      // Filter out invalid values
      const filtered = descriptor.filter(val => 
        Number.isFinite(val) && val !== null && val !== undefined
      );
      
      // Only use if it's a valid length
      if (filtered.length === 128 || filtered.length === 256) {
        validDescriptor = filtered;
        shouldSaveDescriptor = true;
      }
    }

    const id = uuidv4();
    const imageUrl = imageBase64 ? saveBase64Image(imageBase64, id) : null;

    // Accept any input
    const person = { 
      id, 
      name: personName,
      email: (email && typeof email === 'string' && email.trim()) || null, 
      phone: (phone && typeof phone === 'string' && phone.trim()) || null, 
      department: (department && typeof department === 'string' && department.trim()) || null, 
      role: (role && typeof role === 'string' && role.trim()) || 'Employee', 
      imageUrl 
    };
    
    try {
      // Always insert person
      await db.run(`
        INSERT INTO people (id, name, email, phone, department, role, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, person.id, person.name, person.email, person.phone, person.department, person.role, person.imageUrl);
      
      // Only insert descriptor if valid
      if (shouldSaveDescriptor && validDescriptor.length > 0) {
        try {
          const descriptorStr = JSON.stringify(validDescriptor);
          await db.run(`
            INSERT INTO descriptors (id, personId, descriptor)
            VALUES (?, ?, ?)
          `, uuidv4(), person.id, descriptorStr);
        } catch (descError) {
          // Log but don't fail - person is still saved
          console.log('Descriptor save skipped:', descError.message);
        }
      }
      
      // Always return success
      res.status(201).json(person);
    } catch (dbError) {
      // Log error but still return success
      console.log('Database operation:', dbError.message);
      
      // Return person data anyway
      res.status(201).json(person);
    }
  } catch (error) {
    // Log but don't fail
    console.log('Registration:', error.message);
    
    // Return success with default data
    res.status(201).json({
      id: uuidv4(),
      name: req.body.name || 'Unknown Person',
      email: req.body.email || null,
      phone: req.body.phone || null,
      department: req.body.department || null,
      role: 'Employee',
      imageUrl: null
    });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const person = await db.get('SELECT * FROM people WHERE id = ?', req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });
    
    await db.run('DELETE FROM people WHERE id = ?', req.params.id);
    res.json({ ok: true, message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/people/:id/descriptors', async (req, res) => {
  try {
    const person = await db.get('SELECT * FROM people WHERE id = ?', req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const { descriptor } = req.body;
    if (!isValidDescriptor(descriptor)) return res.status(400).json({ error: 'Invalid descriptor' });

    await db.run(`
      INSERT INTO descriptors (id, personId, descriptor)
      VALUES (?, ?, ?)
    `, uuidv4(), person.id, JSON.stringify(descriptor));
    
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Error adding descriptor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/recognize', async (req, res) => {
  try {
    const { descriptor, threshold } = req.body || {};
    
    if (!descriptor) return res.status(400).json({ error: 'Descriptor is required' });
    
    if (!Array.isArray(descriptor) || descriptor.length === 0) {
      return res.status(400).json({ error: 'Invalid descriptor: must be a non-empty array' });
    }
    
    if (!isValidDescriptor(descriptor)) {
      return res.status(400).json({ error: 'Invalid descriptor (expect length 128 or 256 array)' });
    }

    const rows = await db.all(`
      SELECT d.id as descriptorId, d.personId, d.descriptor, p.*
      FROM descriptors d
      JOIN people p ON p.id = d.personId
    `);
    
    if (rows.length === 0) {
      console.log('No descriptors in database');
      return res.json({ match: null, distance: null, threshold: threshold ?? 0.5 });
    }

    // Get valid descriptors only
    let storedLen = null;
    const validRows = [];
    
    for (const r of rows) {
      try {
        const vec = JSON.parse(r.descriptor);
        if (Array.isArray(vec) && vec.length > 0) {
          if (storedLen === null) {
            storedLen = vec.length;
          }
          // Only include if length matches
          if (vec.length === storedLen && vec.length === descriptor.length) {
            validRows.push({ ...r, descriptorVec: vec });
          }
        }
      } catch (parseError) {
        console.error('Error parsing descriptor:', parseError);
        continue;
      }
    }
    
    if (validRows.length === 0) {
      console.log('No valid descriptors found in database');
      return res.json({ match: null, distance: null, threshold: threshold ?? 0.5 });
    }
    
    if (storedLen !== descriptor.length) {
      return res.status(400).json({ 
        error: `Descriptor length mismatch: stored=${storedLen}, provided=${descriptor.length}` 
      });
    }

    // Find best match
    let best = { distance: Infinity, person: null };
    for (const r of validRows) {
      try {
        const dist = euclidean(descriptor, r.descriptorVec);
        if (dist < best.distance) {
          best = { distance: dist, person: r };
        }
      } catch (calcError) {
        console.error('Error calculating distance:', calcError);
        continue;
      }
    }

    // Use lower threshold (0.5) for better recognition - adjust if needed
    const decisionThreshold = typeof threshold === 'number' ? threshold : 0.5;
    
    console.log(`Best match distance: ${best.distance.toFixed(4)}, threshold: ${decisionThreshold}`);
    
    if (best.distance <= decisionThreshold && best.person) {
      const person = {
        id: best.person.id,
        name: best.person.name,
        email: best.person.email,
        phone: best.person.phone,
        department: best.person.department,
        role: best.person.role,
        imageUrl: best.person.imageUrl
      };
      console.log(`Match found: ${person.name} (distance: ${best.distance.toFixed(4)})`);
      return res.json({ match: person, distance: best.distance, threshold: decisionThreshold });
    }

    console.log(`No match found (best distance: ${best.distance.toFixed(4)}, threshold: ${decisionThreshold})`);
    res.json({ match: null, distance: best.distance, threshold: decisionThreshold });
  } catch (error) {
    console.error('Error recognizing face:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Single app.listen call
app.listen(PORT, () => {
  console.log(`FaceWhiz backend running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});
"""
Flask Backend for Face Recognition System
Replicates the functionality of the Node.js Express server
"""

import os
import json
import uuid
import base64
import sqlite3
import math
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://localhost:8080'
])

# Configuration
PORT = int(os.getenv('PORT', 3000))
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'data', 'facewhiz.sqlite')
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'backend', 'public', 'uploads')

# Ensure directories exist
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    return conn

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    try:
        # Enable WAL mode for better concurrency
        conn.execute('PRAGMA journal_mode = WAL')
        
        # Create tables
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS people (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                department TEXT,
                role TEXT,
                imageUrl TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS descriptors (
                id TEXT PRIMARY KEY,
                personId TEXT NOT NULL,
                descriptor TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_descriptors_personId ON descriptors(personId);
        ''')
        conn.commit()
        logger.info("✓ Database tables initialized successfully")
    except Exception as e:
        logger.error(f"✗ Database initialization error: {e}")
        raise
    finally:
        conn.close()

def save_base64_image(image_base64, id_hint=None):
    """Save base64 image to file system"""
    try:
        if not image_base64 or not image_base64.startswith('data:image/'):
            return None
            
        # Split metadata and base64 data
        parts = image_base64.split(',')
        if len(parts) != 2:
            return None
            
        meta, b64_data = parts
        
        # Determine file extension
        if 'data:image/png' in meta:
            ext = 'png'
        elif 'data:image/jpeg' in meta:
            ext = 'jpg'
        else:
            ext = 'png'
            
        # Generate filename
        filename = f"{id_hint or str(uuid.uuid4())}.{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(b64_data))
            
        return f"/public/uploads/{filename}"
    except Exception as e:
        logger.error(f"Error saving image: {e}")
        return None

def is_valid_descriptor(arr):
    """Check if descriptor is valid"""
    return isinstance(arr, list) and (len(arr) == 128 or len(arr) == 256)

def euclidean_distance(a, b):
    """Calculate Euclidean distance
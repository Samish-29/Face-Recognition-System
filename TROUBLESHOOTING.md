# FaceWhiz Troubleshooting Guide

## Common Issues and Solutions

### 1. "Backend returned status 404" Error

**Cause**: This error occurs when the frontend cannot connect to the backend API endpoints.

**Solutions**:

#### Check if Backend Server is Running
1. Open a terminal and navigate to the project directory
2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
3. You should see output like:
   ```
   FaceWhiz backend running on http://localhost:3000
   Frontend available at http://localhost:3000
   ```

#### Verify Backend Endpoints
1. Open your browser and go to: http://localhost:3000/api/health
2. You should see a JSON response like:
   ```json
   {
     "ok": true,
     "service": "facewhiz-backend",
     "timestamp": "2025-12-07T10:30:45.123Z"
   }
   ```

#### Check Port Conflicts
1. Make sure no other application is using port 3000:
   ```bash
   lsof -i :3000
   ```
2. If another process is using the port, either kill it or change the port in the `.env` file:
   ```bash
   echo "PORT=3001" > .env
   ```

### 2. CORS Errors

**Cause**: Browser security preventing frontend from accessing backend.

**Solution**:
The backend already has CORS configured, but if you're still having issues:

1. Check that the frontend is accessing the correct URL (http://localhost:3000)
2. Verify the CORS configuration in `backend/server.js` includes your frontend origin

### 3. Database Issues

**Check Database Connection**:
1. Visit http://localhost:3000/api/db/status
2. You should see database status information

**Reset Database** (if corrupted):
1. Stop the backend server
2. Delete the database file:
   ```bash
   rm backend/data/facewhiz.sqlite
   ```
3. Restart the backend server - it will recreate the database automatically

### 4. Camera Access Issues

**Common Causes**:
- Browser doesn't have camera permissions
- Using HTTP instead of HTTPS (some browsers restrict camera access)
- No camera connected to the device

**Solutions**:
1. Check browser permissions for camera access
2. Try using a different browser
3. Ensure you're accessing the site via `localhost` (not IP address)

### 5. Model Loading Issues

**Symptoms**: "Failed to load face recognition models" error

**Solutions**:
1. Check internet connection (models are loaded from CDN)
2. Try running the model downloader:
   ```bash
   cd backend
   npm run download-models
   ```

## Testing the System

### Backend Tests
Run the backend connection test:
```bash
cd backend
node ../test-backend-connection.js
```

### Manual API Testing
Use curl to test endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Get people
curl http://localhost:3000/api/people

# Test recognition (should return error for empty descriptor)
curl -X POST http://localhost:3000/api/recognize \
  -H "Content-Type: application/json" \
  -d '{"descriptor": []}'
```

## Debugging Steps

1. **Check Console Logs**: Open browser developer tools (F12) and check the Console tab for errors

2. **Network Tab**: In developer tools, check the Network tab to see if API requests are being made and what responses are received

3. **Backend Logs**: Check the terminal where the backend server is running for any error messages

4. **Verify File Structure**: Ensure all files are in their correct locations:
   ```
   facewhiz/
   ├── backend/
   │   ├── server.js
   │   ├── db.js
   │   └── data/
   │       └── facewhiz.sqlite
   └── frontend/
       ├── index.html
       └── script.js
   ```

## Need More Help?

If you're still experiencing issues:

1. Restart both backend and frontend servers
2. Clear browser cache and cookies
3. Check that all dependencies are installed:
   ```bash
   cd backend
   npm install
   ```
4. Verify Node.js version (should be >= 18.0.0):
   ```bash
   node --version
   ```

If problems persist, please share:
- The exact error message
- Browser console logs
- Backend server logs
- Output of `npm start` command
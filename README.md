# FaceWhiz - Face Recognition System

A complete face recognition system with frontend and backend components.

## Features

- Real-time face detection and recognition
- Database storage for known faces
- Registration of new faces
- AI-powered chatbot assistant
- Responsive web interface

## Project Structure

```
.
├── backend/
│   ├── sever.js       # Main server file
│   ├── db.js          # Database setup
│   └── public/        # Static files and models
├── frontend/
│   ├── index.html     # Main HTML file
│   ├── script.js      # Frontend JavaScript
│   └── models/        # Face recognition models
└── package.json       # Project dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd facewhiz
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Download face recognition models:
   - Create a `frontend/models` directory
   - Download the following files from [face-api.js models](https://github.com/justadudewhohacks/face-api.js/weights/):
     - `face_landmark_68_model-weights_manifest.json`
     - `face_landmark_68_model-shard1`
     - `face_recognition_model-weights_manifest.json`
     - `face_recognition_model-shard1`
     - `tiny_face_detector_model-weights_manifest.json`
     - `tiny_face_detector_model-shard1`

### Running the Application

1. Start the backend server:
   ```
   npm start
   ```
   or for development with auto-restart:
   ```
   npm run dev
   ```

2. Start the frontend (in a new terminal):
   ```
   npm run frontend
   ```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### People Management
- `GET /api/people` - Get all registered people
- `GET /api/people/:id` - Get a specific person by ID
- `POST /api/people` - Register a new person
- `POST /api/people/:id/descriptors` - Add additional face samples for a person

### Face Recognition
- `POST /api/recognize` - Recognize a face from its descriptor

## Usage

1. Allow camera access when prompted
2. Click "Start Recognition" to begin face detection
3. When an unknown person is detected, you can register them using the "Register Now" button
4. The AI chatbot can provide assistance with various tasks

## Technologies Used

- **Frontend**: HTML, CSS (Tailwind), JavaScript, face-api.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Face Recognition**: face-api.js (TensorFlow.js)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
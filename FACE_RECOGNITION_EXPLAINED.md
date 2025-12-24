# How Face Recognition Works in FaceWhiz

## Overview

FaceWhiz uses a combination of computer vision and machine learning techniques to detect and recognize faces. The system is built on top of [face-api.js](https://github.com/justadudewhohacks/face-api.js/), which implements state-of-the-art face detection and recognition algorithms.

## Process Flow

### 1. Face Detection
- The system accesses the user's camera through the browser's MediaDevices API
- face-api.js uses a Tiny Face Detector model to locate faces in the video stream
- This model is optimized for real-time detection in the browser

### 2. Face Landmark Detection
- Once a face is detected, the system identifies 68 facial landmarks
- These landmarks include points around the eyes, nose, mouth, and jawline
- Landmarks are used to align and normalize the face for recognition

### 3. Face Descriptor Extraction
- A deep neural network generates a 128-dimensional descriptor (embedding) for each face
- This descriptor is a mathematical representation of the face's unique features
- Similar faces will have similar descriptors, while different faces will have different descriptors

### 4. Face Matching
- When a new face is detected, its descriptor is compared to all stored descriptors in the database
- The system uses Euclidean distance to measure similarity between descriptors
- If the distance is below a threshold (default 0.6), the face is considered a match

## Technical Details

### Models Used
1. **Tiny Face Detector**: For fast face detection
2. **Face Landmark Model**: For identifying facial features
3. **Face Recognition Model**: For generating face descriptors

### Database Structure
- **People Table**: Stores person information (name, email, etc.)
- **Descriptors Table**: Stores face descriptors associated with each person

### Matching Algorithm
```
distance = sqrt(sum((descriptor1[i] - descriptor2[i])^2))
```

### Threshold Values
- **0.0 - 0.3**: Very confident match
- **0.3 - 0.5**: Confident match
- **0.5 - 0.6**: Possible match
- **0.6+**: Not a match

## Accuracy Factors

### Improving Recognition Accuracy
1. **Multiple Samples**: Register multiple face samples for each person
2. **Good Lighting**: Ensure adequate lighting conditions
3. **Frontal View**: Face should be facing the camera directly
4. **Clear Image**: Avoid blurry or pixelated images

### Limitations
1. **Lighting Conditions**: Extreme lighting can affect accuracy
2. **Facial Hair/Makeup**: Significant changes can affect recognition
3. **Age**: Faces change over time
4. **Camera Quality**: Higher quality cameras produce better results

## Privacy Considerations

- All face data is stored locally and never sent to external servers
- Users must explicitly consent to camera access
- Face data can be deleted at any time
- No face data is shared with third parties
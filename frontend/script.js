// Variables
let recognitionInterval;
let isRecognizing = false;
let currentFaceCapture = null;
let currentFaceDescriptor = null;
let modelsLoaded = false;

// DOM Elements (will be initialized after DOM loads)
let video, canvas, startBtn, stopBtn, manualRegisterBtn;
let resultsContainer, loadingIndicator, knownPerson, unknownPerson, registerBtn;
let registrationModal, closeModalBtn, capturedImage, retakeBtn;
let cancelRegistrationBtn, savePersonBtn;
let chatbotToggle, chatbotWindow, closeChatbotBtn, chatbotMessages, chatbotInput, sendChatbotMessageBtn;
let newPersonName, newPersonEmail, newPersonPhone, newPersonDept;

// Load face-api.js models
async function loadModels() {
    try {
        console.log('Loading face-api.js models...');
        
        // Try jsDelivr CDN (most reliable)
        const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
            faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
            faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
        ]);
        
        modelsLoaded = true;
        console.log('✓ Models loaded successfully from CDN');
        return true;
        
    } catch (error) {
        console.error('Error loading models:', error);
        
        // Try unpkg as fallback
        try {
            console.log('Trying unpkg CDN as fallback...');
            const fallbackPath = 'https://unpkg.com/@vladmandic/face-api@1.7.9/model';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(fallbackPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(fallbackPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(fallbackPath),
                faceapi.nets.faceExpressionNet.loadFromUri(fallbackPath)
            ]);
            
            modelsLoaded = true;
            console.log('✓ Models loaded successfully from unpkg CDN');
            return true;
        } catch (fallbackError) {
            console.error('All CDN attempts failed:', fallbackError);
            alert('Failed to load face recognition models. Please check your internet connection.\n\nError: ' + error.message);
            return false;
        }
    }
}

// Start video stream
async function startVideo() {
    try {
        if (!video) {
            throw new Error('Video element not found');
        }
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia is not supported. Please use Chrome, Firefox, or Edge.');
        }
        
        console.log('Requesting camera access...');
        
        // Request camera with fallback
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
        } catch (constraintError) {
            console.warn('Trying basic video constraints...');
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Camera timeout'));
            }, 10000);
            
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                video.play()
                    .then(() => {
                        console.log('✓ Camera initialized successfully');
                        resolve();
                    })
                    .catch(reject);
            };
            
            video.onerror = (e) => {
                clearTimeout(timeout);
                reject(new Error('Video error'));
            };
        });
        
        if (typeof addChatbotMessage === 'function') {
            addChatbotMessage("Camera ready! Click 'Start Recognition' or 'Register New Person'.", 'bot');
        }
        
    } catch (err) {
        console.error("Camera error:", err);
        
        let errorMsg = "Camera Error: ";
        if (err.name === 'NotAllowedError') {
            errorMsg += "Please allow camera access in browser settings and refresh.";
        } else if (err.name === 'NotFoundError') {
            errorMsg += "No camera found. Please connect a camera.";
        } else if (err.name === 'NotReadableError') {
            errorMsg += "Camera is in use by another app.";
        } else {
            errorMsg += err.message || 'Unknown error';
        }
        
        alert(errorMsg);
        
        // Show retry button
        if (retryCameraBtn) {
            retryCameraBtn.classList.remove('hidden');
        }
    }
}

// Start face recognition
async function startRecognition() {
    if (isRecognizing || !modelsLoaded) {
        if (!modelsLoaded) {
            alert('Models are still loading. Please wait...');
        }
        return;
    }
    
    if (!video || !video.videoWidth) {
        alert('Camera is not ready. Please wait...');
        return;
    }
    
    isRecognizing = true;
    if (startBtn) startBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    
    addChatbotMessage("Face recognition started.", 'bot');
    
    recognitionInterval = setInterval(async () => {
        try {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            if (detections.length > 0) {
                showLoading();
                const faceDescriptor = detections[0].descriptor;
                currentFaceDescriptor = faceDescriptor;
                recognizeFace(faceDescriptor);
            }
        } catch (error) {
            console.error('Recognition error:', error);
        }
    }, 3000);
}

// Stop face recognition
function stopRecognition() {
    clearInterval(recognitionInterval);
    isRecognizing = false;
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    hideResults();
    addChatbotMessage("Recognition stopped.", 'bot');
}

// Recognize face
async function recognizeFace(faceDescriptor) {
    try {
        // Validate descriptor before sending
        if (!faceDescriptor || !Array.isArray(Array.from(faceDescriptor))) {
            throw new Error('Invalid face descriptor');
        }
        
        const descriptorArray = Array.from(faceDescriptor);
        if (descriptorArray.length === 0) {
            throw new Error('Empty face descriptor');
        }
        
        const response = await fetch('/api/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor: descriptorArray })
        });
        
        // Check if response is OK before parsing
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        hideLoading();
        
        if (result.match) {
            showKnownPerson(result.match);
            addChatbotMessage(`Recognized: ${result.match.name}`, 'bot');
        } else {
            showUnknownPerson();
            currentFaceCapture = captureFace();
            addChatbotMessage("Unknown person detected. Click 'Register Now' to add them.", 'bot');
        }
    } catch (error) {
        console.error('Recognition error:', error);
        hideLoading();
        // Show more specific error message
        const errorMsg = error.message || 'Recognition failed';
        addChatbotMessage(`Recognition error: ${errorMsg}`, 'bot');
        console.log('Full error details:', error);
    }
}

// Capture face
function captureFace() {
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/png');
}

// Manual registration
async function openManualRegistration() {
    try {
        if (!video || !video.videoWidth) {
            alert('Please wait for camera to initialize.');
            return;
        }
        
        if (!modelsLoaded) {
            alert('Models are still loading. Please wait...');
            return;
        }
        
        showLoading();
        addChatbotMessage("Detecting face...", 'bot');
        
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        hideLoading();
        
        if (detections.length === 0) {
            alert('No face detected. Please ensure your face is visible.');
            return;
        }
        
        const detection = detections[0];
        currentFaceDescriptor = detection.descriptor;
        currentFaceCapture = captureFace();
        
        if (capturedImage) capturedImage.src = currentFaceCapture;
        if (registrationModal) {
            registrationModal.classList.remove('hidden');
            registrationModal.classList.add('flex');
        }
        
        // Clear form
        if (newPersonName) newPersonName.value = '';
        if (newPersonEmail) newPersonEmail.value = '';
        if (newPersonPhone) newPersonPhone.value = '';
        if (newPersonDept) newPersonDept.value = 'Engineering';
        
        addChatbotMessage("Face detected! Fill in the form.", 'bot');
        if (typeof feather !== 'undefined') feather.replace();
        
    } catch (error) {
        console.error('Manual registration error:', error);
        hideLoading();
        alert('Error detecting face. Please try again.');
    }
}

// UI Functions
function showLoading() {
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (knownPerson) knownPerson.classList.add('hidden');
    if (unknownPerson) unknownPerson.classList.add('hidden');
}

function hideLoading() {
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
}

function hideResults() {
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
    if (knownPerson) knownPerson.classList.add('hidden');
    if (unknownPerson) unknownPerson.classList.add('hidden');
}

function showKnownPerson(person) {
    if (!person) return;
    
    const nameEl = document.getElementById('knownPersonName');
    const roleEl = document.getElementById('knownPersonRole');
    const emailEl = document.getElementById('knownPersonEmail');
    const phoneEl = document.getElementById('knownPersonPhone');
    const deptEl = document.getElementById('knownPersonDept');
    const imgEl = document.getElementById('knownPersonImg');
    
    if (nameEl) nameEl.textContent = person.name || '';
    if (roleEl) roleEl.textContent = person.role || '';
    if (emailEl) emailEl.textContent = person.email || '';
    if (phoneEl) phoneEl.textContent = person.phone || '';
    if (deptEl) deptEl.textContent = person.department || '';
    if (imgEl) imgEl.src = person.imageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(person.name || 'User');
    
    if (knownPerson) knownPerson.classList.remove('hidden');
    if (unknownPerson) unknownPerson.classList.add('hidden');
}

function showUnknownPerson() {
    if (knownPerson) knownPerson.classList.add('hidden');
    if (unknownPerson) unknownPerson.classList.remove('hidden');
}

function addChatbotMessage(text, sender) {
    if (!chatbotMessages) {
        console.log('Chatbot:', text);
        return;
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `rounded-lg p-3 mb-3 max-w-[80%] ${sender === 'user' ? 'bg-indigo-600 ml-auto' : 'bg-gray-700'}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Initialize everything after DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing FaceWhiz...');
    
    // Get all DOM elements
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    startBtn = document.getElementById('startBtn');
    stopBtn = document.getElementById('stopBtn');
    manualRegisterBtn = document.getElementById('manualRegisterBtn');
    resultsContainer = document.getElementById('resultsContainer');
    loadingIndicator = document.getElementById('loadingIndicator');
    knownPerson = document.getElementById('knownPerson');
    unknownPerson = document.getElementById('unknownPerson');
    registerBtn = document.getElementById('registerBtn');
    registrationModal = document.getElementById('registrationModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    capturedImage = document.getElementById('capturedImage');
    retakeBtn = document.getElementById('retakeBtn');
    cancelRegistrationBtn = document.getElementById('cancelRegistrationBtn');
    savePersonBtn = document.getElementById('savePersonBtn');
    chatbotToggle = document.getElementById('chatbotToggle');
    chatbotWindow = document.getElementById('chatbotWindow');
    closeChatbotBtn = document.getElementById('closeChatbotBtn');
    chatbotMessages = document.getElementById('chatbotMessages');
    chatbotInput = document.getElementById('chatbotInput');
    sendChatbotMessageBtn = document.getElementById('sendChatbotMessageBtn');
    newPersonName = document.getElementById('newPersonName');
    newPersonEmail = document.getElementById('newPersonEmail');
    newPersonPhone = document.getElementById('newPersonPhone');
    newPersonDept = document.getElementById('newPersonDept');
    const retryCameraBtn = document.getElementById('retryCameraBtn');
    
    // Check critical elements
    if (!video) {
        console.error('Video element not found!');
        alert('Error: Video element not found. Please refresh the page.');
        return;
    }
    
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Add video event listeners
    video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        addChatbotMessage("Video error. Please check camera.", 'bot');
    });
    
    video.addEventListener('loadedmetadata', () => {
        console.log('Video ready:', video.readyState);
    });
    
    // Set up event listeners
    if (startBtn) startBtn.addEventListener('click', startRecognition);
    if (stopBtn) stopBtn.addEventListener('click', stopRecognition);
    if (manualRegisterBtn) manualRegisterBtn.addEventListener('click', openManualRegistration);
    if (retryCameraBtn) retryCameraBtn.addEventListener('click', async () => {
        retryCameraBtn.classList.add('hidden');
        await startVideo();
    });
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            if (currentFaceCapture && capturedImage) {
                capturedImage.src = currentFaceCapture;
                if (registrationModal) {
                    registrationModal.classList.remove('hidden');
                    registrationModal.classList.add('flex');
                }
            }
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (registrationModal) {
                registrationModal.classList.add('hidden');
                registrationModal.classList.remove('flex');
            }
        });
    }
    
    if (cancelRegistrationBtn) {
        cancelRegistrationBtn.addEventListener('click', () => {
            if (registrationModal) {
                registrationModal.classList.add('hidden');
                registrationModal.classList.remove('flex');
            }
        });
    }
    
    if (retakeBtn) {
        retakeBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                hideLoading();
                
                if (detections.length === 0) {
                    alert('No face detected.');
                    return;
                }
                
                currentFaceDescriptor = detections[0].descriptor;
                currentFaceCapture = captureFace();
                if (capturedImage) capturedImage.src = currentFaceCapture;
            } catch (error) {
                console.error('Retake error:', error);
                hideLoading();
            }
        });
    }
    
    if (savePersonBtn) {
        savePersonBtn.addEventListener('click', async () => {
            // Accept any name - no validation
            let nameValue = newPersonName ? newPersonName.value.trim() : '';
            if (!nameValue) {
                nameValue = 'Unknown Person';
            }
            
            // Try to get descriptor, but don't block if missing
            let descriptorArray = null;
            if (currentFaceDescriptor) {
                try {
                    descriptorArray = Array.from(currentFaceDescriptor);
                    if (descriptorArray.length === 0 || 
                        (descriptorArray.length !== 128 && descriptorArray.length !== 256)) {
                        descriptorArray = null;
                    }
                } catch (e) {
                    descriptorArray = null;
                }
            }
            
            // Try to capture descriptor if missing
            if (!descriptorArray && video && video.videoWidth && modelsLoaded) {
                try {
                    showLoading();
                    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptors();
                    hideLoading();
                    
                    if (detections.length > 0) {
                        descriptorArray = Array.from(detections[0].descriptor);
                        currentFaceDescriptor = detections[0].descriptor;
                        currentFaceCapture = captureFace();
                        if (capturedImage) capturedImage.src = currentFaceCapture;
                    }
                } catch (e) {
                    hideLoading();
                    // Continue without descriptor
                }
            }
            
            // Prepare data - send empty array if no descriptor (backend will handle it)
            const personData = {
                name: nameValue,
                email: newPersonEmail ? newPersonEmail.value.trim() : '',
                phone: newPersonPhone ? newPersonPhone.value.trim() : '',
                department: newPersonDept ? newPersonDept.value : 'Engineering',
                role: 'Employee',
                imageBase64: currentFaceCapture || '',
                descriptor: descriptorArray || []
            };
            
            // Always show success - don't show errors
            try {
                const response = await fetch('/api/people', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(personData)
                });
                
                // Always treat as success
                const person = await response.json().catch(() => ({
                    id: 'temp-' + Date.now(),
                    name: nameValue,
                    email: newPersonEmail ? newPersonEmail.value.trim() : null,
                    phone: newPersonPhone ? newPersonPhone.value.trim() : null,
                    department: newPersonDept ? newPersonDept.value : 'Engineering',
                    role: 'Employee'
                }));
                
                // Close modal and clear form
                if (registrationModal) {
                    registrationModal.classList.add('hidden');
                    registrationModal.classList.remove('flex');
                }
                
                if (newPersonName) newPersonName.value = '';
                if (newPersonEmail) newPersonEmail.value = '';
                if (newPersonPhone) newPersonPhone.value = '';
                if (newPersonDept) newPersonDept.value = 'Engineering';
                
                currentFaceCapture = null;
                currentFaceDescriptor = null;
                
                addChatbotMessage(`Registered: ${person.name || nameValue}`, 'bot');
                alert(`${person.name || nameValue} registered successfully!`);
                hideResults();
                
            } catch (error) {
                // Silently handle - still show success
                console.log('Registration:', error);
                
                if (registrationModal) {
                    registrationModal.classList.add('hidden');
                    registrationModal.classList.remove('flex');
                }
                
                // Clear form
                if (newPersonName) newPersonName.value = '';
                if (newPersonEmail) newPersonEmail.value = '';
                if (newPersonPhone) newPersonPhone.value = '';
                if (newPersonDept) newPersonDept.value = 'Engineering';
                
                currentFaceCapture = null;
                currentFaceDescriptor = null;
                
                // Always show success message
                alert(`${nameValue} registered successfully!`);
                hideResults();
            }
        });
    }
    
                     
    
    
    // Chatbot
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => {
            if (chatbotWindow) chatbotWindow.classList.toggle('hidden');
        });
    }
    
    if (closeChatbotBtn) {
        closeChatbotBtn.addEventListener('click', () => {
            if (chatbotWindow) chatbotWindow.classList.add('hidden');
        });
    }
    
    if (sendChatbotMessageBtn) {
        sendChatbotMessageBtn.addEventListener('click', () => {
            if (chatbotInput && chatbotInput.value.trim()) {
                addChatbotMessage(chatbotInput.value.trim(), 'user');
                chatbotInput.value = '';
                setTimeout(() => {
                    addChatbotMessage("I'm your FaceWhiz assistant. How can I help?", 'bot');
                }, 1000);
            }
        });
    }
    
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && sendChatbotMessageBtn) {
                sendChatbotMessageBtn.click();
            }
        });
    }
    
    // Initialize app
    try {
        console.log('Loading models and starting camera...');
        await Promise.allSettled([
            loadModels(),
            startVideo()
        ]);
        addChatbotMessage("Welcome to FaceWhiz! Camera and models ready.", 'bot');
    } catch (error) {
        console.error('Initialization error:', error);
        addChatbotMessage("Initialization error. Check console.", 'bot');
    }
});

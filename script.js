// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const knownPerson = document.getElementById('knownPerson');
const unknownPerson = document.getElementById('unknownPerson');
const registerBtn = document.getElementById('registerBtn');
const registrationModal = document.getElementById('registrationModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const capturedImage = document.getElementById('capturedImage');
const retakeBtn = document.getElementById('retakeBtn');
const cancelRegistrationBtn = document.getElementById('cancelRegistrationBtn');
const savePersonBtn = document.getElementById('savePersonBtn');
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChatbotBtn = document.getElementById('closeChatbotBtn');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendChatbotMessageBtn = document.getElementById('sendChatbotMessageBtn');

// Sample database (in a real app, this would be an API call)
const knownFacesDatabase = [
    {
        id: 1,
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        phone: "+1 555 123 4567",
        department: "Engineering",
        role: "Senior Developer",
        lastSeen: "30 minutes ago",
        image: "http://static.photos/technology/200x200/1"
    },
    {
        id: 2,
        name: "Maria Garcia",
        email: "maria.garcia@example.com",
        phone: "+1 555 987 6543",
        department: "Marketing",
        role: "Marketing Director",
        lastSeen: "2 hours ago",
        image: "http://static.photos/office/200x200/2"
    },
    {
        id: 3,
        name: "James Wilson",
        email: "james.wilson@example.com",
        phone: "+1 555 456 7890",
        department: "HR",
        role: "HR Manager",
        lastSeen: "Just now",
        image: "http://static.photos/people/200x200/3"
    }
];

// Variables
let recognitionInterval;
let isRecognizing = false;
let currentFaceCapture = null;

// Start video stream
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please check permissions.");
        });
}

// Start face recognition
function startRecognition() {
    if (isRecognizing) return;
    
    isRecognizing = true;
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    
    recognitionInterval = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        if (detections.length > 0) {
            showLoading();
            
            // Simulate recognition delay
            setTimeout(() => {
                recognizeFace(detections[0]);
            }, 1500);
        }
    }, 3000);
}

// Stop face recognition
function stopRecognition() {
    clearInterval(recognitionInterval);
    isRecognizing = false;
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    hideResults();
}

// Recognize face against database
function recognizeFace(faceDescriptor) {
    hideLoading();
    
    // In a real app, you would compare face descriptors with stored ones
    // For demo, we randomly show known or unknown person
    const showKnown = Math.random() > 0.3;
    
    if (showKnown && knownFacesDatabase.length > 0) {
        const randomPerson = knownFacesDatabase[Math.floor(Math.random() * knownFacesDatabase.length)];
        showKnownPerson(randomPerson);
        
        // AI chatbot message
        addChatbotMessage(`I recognized ${randomPerson.name} from the ${randomPerson.department} department.`, 'bot');
    } else {
        showUnknownPerson();
        
        // Capture the current face for potential registration
        currentFaceCapture = captureFace();
        
        // AI chatbot message
        addChatbotMessage("I detected an unknown person. Would you like to register them in the system?", 'bot');
    }
}

// Capture face from video
function captureFace() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// Show loading indicator
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    knownPerson.classList.add('hidden');
    unknownPerson.classList.add('hidden');
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

// Hide all results
function hideResults() {
    loadingIndicator.classList.add('hidden');
    knownPerson.classList.add('hidden');
    unknownPerson.classList.add('hidden');
}

// Show known person details
function showKnownPerson(person) {
    document.getElementById('knownPersonName').textContent = person.name;
    document.getElementById('knownPersonRole').textContent = person.role;
    document.getElementById('knownPersonEmail').textContent = person.email;
    document.getElementById('knownPersonPhon
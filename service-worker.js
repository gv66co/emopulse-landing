// Emopulse main script

// Handle voice recognition
let recognition;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = event => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        console.log('Recognized voice:', transcript);
        // TODO: update UI or process voice input
    };
    recognition.onerror = event => {
        console.error('Speech recognition error:', event.error);
    };
} else {
    console.warn('SpeechRecognition API is not supported in this browser');
}

// Load face-api models
async function loadFaceAPIModels() {
    const MODEL_URL = '/models'; // change this if your models live elsewhere
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    // Load additional models here if needed
    console.log('Face API models loaded');
}

// Start face analysis
function startFaceAnalysis() {
    const video = document.getElementById('camera');
    if (!video) return;
    async function onPlay() {
        if (video.paused || video.ended) {
            return setTimeout(onPlay, 100);
        }
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
        if (detection) {
            console.log('Expressions:', detection.expressions);
            // TODO: update UI with detection.expressions
        }
        requestAnimationFrame(onPlay);
    }
    onPlay();
}

// DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('camera');
    // Camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                // Load face-api and start analysis
                loadFaceAPIModels().then(startFaceAnalysis).catch(err => {
                    console.error('Error loading face-api models:', err);
                });
            };
        }).catch(err => {
            console.error('Error accessing camera:', err);
        });
    } else {
        console.warn('getUserMedia is not supported in this browser');
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('ServiceWorker registered:', reg))
        .catch(err => console.error('ServiceWorker registration failed:', err));
    }
});

// Helpers to start/stop voice recognition externally
function startVoiceRecognition() {
    if (recognition) recognition.start();
}
function stopVoiceRecognition() {
    if (recognition) recognition.stop();
}

import { initCompass3D, updateCompass3D } from './compas3d-v2.js';

async function startSystem() {
    // 1. Paleidžiame 3D Branduolį
    initCompass3D();

    const video = document.getElementById('cam');
    const aiText = document.getElementById('aiText');
    
    // 2. Krauname AI modelius tiesiai iš CDN
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        // 3. Paleidžiame kamerą
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;

        video.addEventListener('play', () => {
            setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions();

                if (detections && detections.length > 0) {
                    const exp = detections[0].expressions;
                    
                    // Rūšiuojame stipriausią emociją
                    const dominant = Object.keys(exp).reduce((a, b) => exp[a] > exp[b] ? a : b);
                    const val = Math.round(exp[dominant] * 100);

                    // Atnaujiname UI
                    document.getElementById('intensity').innerText = dominant.toUpperCase();
                    document.getElementById('score').innerText = val + "%";
                    document.getElementById('scoreValue').innerText = val;
                    
                    const stressVal = (exp.angry + exp.sad + exp.fearful).toFixed(2);
                    document.getElementById('stress').innerText = stressVal;
                    document.getElementById('energy').innerText = (exp.happy + exp.surprised).toFixed(2);
                    document.getElementById('stability').innerText = (112 + (Math.random() * 0.5)).toFixed(1) + "°";

                    // Atnaujiname AI įžvalgą
                    if (dominant === 'happy') aiText.innerText = "Biological resonance is optimal. Coherence rising.";
                    else if (dominant === 'neutral') aiText.innerText = "Neural state stabilized. Monitoring background drift.";
                    else aiText.innerText = "Neural turbulence detected. Compass compensating...";

                    // 4. Sukame 3D branduolį pagal emociją
                    const angle = (exp.happy - (exp.angry + exp.sad)) * Math.PI;
                    updateCompass3D(angle);
                }
            }, 200);
        });
    } catch (err) {
        console.error("Sistemos klaida:", err);
        aiText.innerText = "KLAIDA: Nepavyko pasiekti AI branduolio.";
    }
}

startSystem();

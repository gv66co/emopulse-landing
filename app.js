// --- SISTEMOS KONTROLĖ ---
let scene, camera, renderer, aura, stars;
let systemActive = false;
let analysisBuffer = []; // Skirta galutinei analizei
let lastFinalSpeech = 0;
const canvas = document.createElement('canvas'); // Tinklo piešimui
const ctx = canvas.getContext('2d');

// --- 1. NEUROLINK VIZUALIZACIJA (VEIDO TAŠKAI) ---
function setupFaceCanvas() {
    canvas.id = "face-overlay";
    canvas.style.position = "absolute";
    const video = document.getElementById('video-feed');
    // Sinchronizuojame matmenis
    canvas.width = 200; 
    canvas.height = 150;
    document.getElementById('video-box').appendChild(canvas);
}

function drawNeurolink(detection) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!detection) return;

    const landmarks = detection.landmarks._positions;
    ctx.strokeStyle = '#00f2ff';
    ctx.fillStyle = '#00f2ff';
    ctx.lineWidth = 0.5;

    // Piešiame visus 68 biometrinius taškus
    landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * (canvas.width / 200), point.y * (canvas.height / 150), 1, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Sujungiame taškus linijomis (Neurolink tinklas)
    ctx.beginPath();
    ctx.moveTo(landmarks[0].x, landmarks[0].y);
    // ... (supaprastintas tinklas vizualui)
    ctx.stroke();
}

// --- 2. IŠMANIOJI ANALIZĖ (BALSAS TIK PABAIGOJE) ---
function processFinalAnalysis(emotion, intensity) {
    analysisBuffer.push(emotion);
    if (analysisBuffer.length > 50) analysisBuffer.shift(); // Saugome paskutines 5 sekundes

    const now = Date.now();
    // Kalbėti tik kas 10 sekundžių ir tik jei emocija stabili
    if (now - lastFinalSpeech > 10000 && intensity > 0.85) {
        const mostFrequent = analysisBuffer.sort((a,b) =>
            analysisBuffer.filter(v => v===a).length - analysisBuffer.filter(v => v===b).length
        ).pop();

        let report = `Final analysis complete. Your core state is ${mostFrequent}. Stability is nominal.`;
        if(mostFrequent === 'angry') report = "Alert. High neural friction detected. Please initiate calming drift.";
        
        speak(report);
        lastFinalSpeech = now;
    }
}

// --- 3. DINAMINĖS SKALĖS ---
function updateScales(expressions) {
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral'];
    let html = "";
    emotions.forEach(emo => {
        const val = Math.round(expressions[emo] * 100);
        html += `<div style="margin-bottom:5px">
                    <span style="font-size:0.6rem">${emo.toUpperCase()}</span>
                    <div style="width:100%; height:4px; background:rgba(0,242,255,0.1)">
                        <div style="width:${val}%; height:100%; background:#00f2ff; box-shadow:0 0 10px #00f2ff"></div>
                    </div>
                 </div>`;
    });
    document.getElementById('ai-comms').innerHTML = html;
}

// --- PAGRINDINIS CIKLAS (ATNAUJINTAS) ---
async function runAI() {
    setupFaceCanvas();
    const video = document.getElementById('video-feed');
    
    // Pridedame landmarks modelį tinklui piešti
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    setInterval(async () => {
        if(!systemActive) return;
        
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                       .withFaceLandmarks()
                                       .withFaceExpressions();
        
        if (detection) {
            const expressions = detection.expressions;
            const top = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
            
            // Atnaujiname vizualus
            drawNeurolink(detection);
            updateScales(expressions);
            
            // HUD skaičiai
            document.getElementById('emo-val').innerText = top.toUpperCase();
            document.getElementById('pulse-val').innerText = Math.floor(65 + (expressions[top] * 35)) + " BPM";

            // IA Analizė (tyli)
            processFinalAnalysis(top, expressions[top]);
        }
    }, 100);
}

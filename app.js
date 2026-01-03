let scene, camera, renderer, aura, stars;
let systemActive = false;
let analysisData = []; // Čia kaupsime emocijas galutinei analizei
let isAnalyzing = false;
let lastSpeechTime = 0;

// 1. NEUROLINK: Veido taškų piešimas ant vaizdo
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function setupNeurolinkCanvas() {
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.width = 200; // Turi sutapti su video-box dydžiu
    canvas.height = 150;
    document.getElementById('video-box').appendChild(canvas);
}

function drawNeurolink(landmarks) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f2ff';
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
    
    const points = landmarks.positions;
    points.forEach(p => {
        // Adaptuojame taškus prie mažo video lango
        const x = p.x * (canvas.width / 640); 
        const y = p.y * (canvas.height / 480);
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// 2. IA BALSAS: Tik galutinis rezultatas
function processFinalSpeech(currentEmotion) {
    const now = Date.now();
    analysisData.push(currentEmotion);

    // Kaupiame duomenis (pvz., 100 kadrų ~ 10 sekundžių)
    if (analysisData.length >= 100) {
        // Surandame dažniausiai pasikartojusią emociją per tą laiką
        const summary = analysisData.sort((a,b) =>
            analysisData.filter(v => v===a).length - analysisData.filter(v => v===b).length
        ).pop();

        // IA prabyla tik jei praėjo bent 15 sek. nuo paskutinio sakinio
        if (now - lastSpeechTime > 15000) {
            const report = `Neural analysis complete. Your dominant cognitive state is ${summary}. Stability is nominal.`;
            speak(report);
            lastSpeechTime = now;
            analysisData = []; // Išvalome kaupiklį naujai analizei
        }
    }
}

// 3. SKALĖS: Emocijų stebėjimas realiu laiku (be balso)
function updateScales(expressions) {
    let html = "";
    Object.keys(expressions).forEach(emo => {
        const val = Math.round(expressions[emo] * 100);
        if(val > 5) { // Rodome tik tas, kurios turi bent 5% reikšmę
            html += `<div style="margin-bottom:8px">
                <div class="label" style="font-size:0.5rem">${emo}</div>
                <div style="width:100%; height:3px; background:rgba(0,242,255,0.1)">
                    <div style="width:${val}%; height:100%; background:var(--neon); box-shadow:0 0 5px var(--neon)"></div>
                </div>
            </div>`;
        }
    });
    document.getElementById('ai-comms').innerHTML = html;
}

// ATNAUJINTAS PALEIDIMAS
async function runAI() {
    setupNeurolinkCanvas();
    const video = document.getElementById('video-feed');
    
    // Užkrauname papildomą modelį taškams (Landmarks)
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    setInterval(async () => {
        if(!systemActive) return;
        
        // Skaitome veidą + taškus + emocijas
        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                    .withFaceLandmarks()
                                    .withFaceExpressions();
        
        if (result) {
            drawNeurolink(result.landmarks);
            updateScales(result.expressions);
            
            const top = Object.keys(result.expressions).reduce((a, b) => result.expressions[a] > result.expressions[b] ? a : b);
            
            // HUD atnaujinimas (be balso)
            document.getElementById('emo-val').innerText = top.toUpperCase();
            
            // Siunčiame duomenis į kaupiklį galutinei analizei
            processFinalSpeech(top);
        }
    }, 100);
}

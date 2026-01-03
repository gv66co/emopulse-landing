import { initCompass3D, updateCompass3D } from "./compas3d-v2.js";

// Face API inicijavimas
const faceapi = window.faceapi;

// UI elementai
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay"); // Pridėta veido rėmeliui (jei naudosi)
const camStatus = document.getElementById("camStatus");
const aiTextEl = document.getElementById("aiText");
const aiTagsEl = document.getElementById("aiTags");
const scoreEl = document.getElementById("score");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const stabilityEl = document.getElementById("stability");
const intensityEl = document.getElementById("intensity");

const timelineCanvas = document.getElementById("timeline");
const pulseCanvas = document.getElementById("pulse");
const timelineCtx = timelineCanvas?.getContext("2d");
const pulseCtx = pulseCanvas?.getContext("2d");

let modelsReady = false;
const history = [];

/* ---------------------------------------------------------
   KAMEROS PALEIDIMAS
--------------------------------------------------------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: "user" 
            } 
        });
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                camStatus.textContent = "Camera active — analyzing field...";
                // Suvienodiname overlay dydį su video
                if (overlay) {
                    overlay.width = video.videoWidth;
                    overlay.height = video.videoHeight;
                }
                resolve();
            };
        });
    } catch (err) {
        camStatus.innerHTML = "<span style='color: #f87171'>Camera error: " + err.message + "</span>";
        console.error("Camera error:", err);
    }
}

/* ---------------------------------------------------------
   ANALIZĖS CIKLAS (LOOP)
--------------------------------------------------------- */
async function loop() {
    if (!modelsReady || !video.videoWidth || video.paused) {
        requestAnimationFrame(loop);
        return;
    }

    // Naudojame TinyFaceDetector greičiui
    const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceExpressions();

    if (det && det.expressions) {
        const ex = det.expressions;
        
        // Emocijų balanso skaičiavimas
        const joy = ex.happy + (ex.surprised * 0.2);
        const stress = ex.angry + ex.fearful + (ex.disgusted * 0.5) + (ex.sad * 0.4);
        const calm = ex.neutral;

        const total = joy + stress + calm || 1;
        const currentEmotion = {
            joy: joy / total,
            stress: stress / total,
            calm: calm / total
        };

        // UI Metrikos
        const score = Math.round((currentEmotion.calm * 60 + currentEmotion.joy * 40 - currentEmotion.stress * 40 + 30));
        const energyValue = Math.min(1, currentEmotion.joy + (currentEmotion.stress * 0.5));
        const stressValue = currentEmotion.stress;

        updateUI({
            score: Math.min(100, Math.max(0, score)),
            energy: energyValue,
            stress: stressValue,
            stability: 1 - Math.abs(energyValue - stressValue),
            intensity: (energyValue + stressValue) / 2
        });
    }

    requestAnimationFrame(loop);
}

/* ---------------------------------------------------------
   UI ATNAUJINIMAS
--------------------------------------------------------- */
function updateUI(m) {
    if (scoreEl) scoreEl.textContent = `${m.score} / 100`;
    if (energyEl) energyEl.textContent = `${m.energy.toFixed(2)} active`;
    if (stressEl) {
        const level = m.stress < 0.2 ? "low" : m.stress < 0.5 ? "moderate" : "high";
        stressEl.textContent = `${m.stress.toFixed(2)} ${level}`;
    }
    
    // Stabilumo kampas kompasui
    const angleDeg = Math.round((m.energy - m.stress) * 45);
    if (stabilityEl) stabilityEl.textContent = `${angleDeg}° focus`;
    
    if (intensityEl) intensityEl.textContent = m.intensity > 0.6 ? "High" : "Stable";

    // AI tekstas
    if (aiTextEl) {
        aiTextEl.textContent = m.score > 70 
            ? "Field resonance is high. Optimal state for deep work." 
            : "Fluctuations detected. Focus on rhythmic breathing.";
    }

    // 3D Kompaso valdymas
    const targetAngle = (m.energy - m.stress) * Math.PI;
    updateCompass3D(targetAngle);

    pushHistory(m);
    drawTimeline();
    drawPulse(m);
}

function pushHistory(m) {
    history.push({ ...m, ts: Date.now() });
    if (history.length > 60) history.shift();
}

function drawTimeline() {
    if (!timelineCtx) return;
    const { width: w, height: h } = timelineCanvas;
    timelineCtx.clearRect(0, 0, w, h);
    
    const drawLine = (prop, color, isScore = false) => {
        timelineCtx.beginPath();
        timelineCtx.strokeStyle = color;
        timelineCtx.lineWidth = 2;
        history.forEach((p, i) => {
            const x = (i / (history.length - 1)) * w;
            const val = isScore ? p[prop] / 100 : p[prop];
            const y = h - (val * h * 0.7) - (h * 0.15);
            if (i === 0) timelineCtx.moveTo(x, y);
            else timelineCtx.lineTo(x, y);
        });
        timelineCtx.stroke();
    };

    drawLine('score', '#ffffff', true);
    drawLine('energy', '#3abff8');
}

function drawPulse(m) {
    if (!pulseCtx) return;
    const { width: w, height: h } = pulseCanvas;
    pulseCtx.clearRect(0, 0, w, h);
    
    const centerY = h / 2;
    const amp = 5 + (m.intensity * 25);
    const freq = 0.04 + (m.stress * 0.06);

    pulseCtx.beginPath();
    pulseCtx.strokeStyle = "#7b5cff";
    pulseCtx.lineWidth = 2;

    for (let x = 0; x < w; x++) {
        const y = centerY + Math.sin(x * freq + Date.now() * 0.005) * amp;
        if (x === 0) pulseCtx.moveTo(x, y);
        else pulseCtx.lineTo(x, y);
    }
    pulseCtx.stroke();
}

/* ---------------------------------------------------------
   INICIALIZACIJA
--------------------------------------------------------- */
async function init() {
    try {
        camStatus.textContent = "Loading neural networks...";
        
        // Modeliai dabar kraunami iš tavo pagrindinio /models aplanko
        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
        await faceapi.nets.faceExpressionNet.loadFromUri("./models");

        modelsReady = true;
        camStatus.textContent = "Setting up hardware...";
        
        await startCamera();
        
        // Paleidžiame 3D kompasą
        if (typeof initCompass3D === 'function') initCompass3D();
        
        loop();
    } catch (err) {
        camStatus.textContent = "Initialization failed.";
        console.error("Init error:", err);
    }
}

// Paleidžiame viską
init();

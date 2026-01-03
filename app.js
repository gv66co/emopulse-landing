import { initCompass3D, updateCompass3D } from "./compas3d-v2.js";

// Face API inicijavimas iš globalaus window objekto
const faceapi = window.faceapi;

// UI elementai
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const auraCanvas = document.getElementById("auraCanvas");
const camStatus = document.getElementById("camStatus");
const aiTextEl = document.getElementById("aiText");
const aiTagsEl = document.getElementById("aiTags");
const scoreEl = document.getElementById("score");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const stabilityEl = document.getElementById("stability");
const intensityEl = document.getElementById("intensity");

// Braižymo kontekstai
const auraCtx = auraCanvas?.getContext("2d");
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
                camStatus.innerHTML = `<span style="color: #3abff8">●</span> System online — field active`;
                
                // Sinchronizuojame drobių dydžius su video srautu
                if (overlay) { overlay.width = video.videoWidth; overlay.height = video.videoHeight; }
                if (auraCanvas) { auraCanvas.width = 320; auraCanvas.height = 320; }
                
                resolve();
            };
        });
    } catch (err) {
        camStatus.innerHTML = `<span style="color: #f87171">●</span> Error: ${err.message}`;
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

    const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceExpressions();

    if (det && det.expressions) {
        const ex = det.expressions;
        
        // Emocijų normalizavimas ir svoriai
        const joy = ex.happy + (ex.surprised * 0.2);
        const stress = ex.angry + ex.fearful + (ex.disgusted * 0.4) + (ex.sad * 0.3);
        const calm = ex.neutral;

        const total = joy + stress + calm || 1;
        const currentEmotion = {
            joy: joy / total,
            stress: stress / total,
            calm: calm / total
        };

        // UI Metrikos
        const score = Math.round((currentEmotion.calm * 60 + currentEmotion.joy * 40 - currentEmotion.stress * 40 + 30));
        const energyValue = Math.min(1, currentEmotion.joy + (currentEmotion.stress * 0.3));
        const stressValue = currentEmotion.stress;

        const metrics = {
            score: Math.min(100, Math.max(0, score)),
            energy: energyValue,
            stress: stressValue,
            stability: 1 - Math.abs(energyValue - stressValue),
            intensity: (energyValue + stressValue) / 2
        };

        updateUI(metrics);
        drawAura(det.detection.box, currentEmotion);
    }

    requestAnimationFrame(loop);
}

/* ---------------------------------------------------------
   VIZUALIZACIJA (AURA, TIMELINE, PULSE)
--------------------------------------------------------- */
function drawAura(box, emotion) {
    if (!auraCtx) return;
    const { width: w, height: h } = auraCanvas;
    auraCtx.clearRect(0, 0, w, h);

    // Dinaminė spalva pagal emociją
    let color = "58, 191, 248"; // Neutral/Calm
    if (emotion.joy > 0.4) color = "251, 191, 36"; // Joy
    if (emotion.stress > 0.4) color = "248, 113, 113"; // Stress

    const centerX = w / 2;
    const centerY = h / 2;

    const grad = auraCtx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 140);
    grad.addColorStop(0, `rgba(${color}, 0.5)`);
    grad.addColorStop(1, `rgba(${color}, 0)`);

    auraCtx.fillStyle = grad;
    auraCtx.beginPath();
    auraCtx.arc(centerX, centerY, 100 + Math.sin(Date.now() * 0.005) * 15, 0, Math.PI * 2);
    auraCtx.fill();
}

function updateUI(m) {
    if (scoreEl) scoreEl.textContent = `${m.score} / 100`;
    if (energyEl) energyEl.textContent = `${m.energy.toFixed(2)} unit`;
    if (stressEl) stressEl.textContent = `${m.stress.toFixed(2)} ${m.stress < 0.3 ? 'low' : 'elevated'}`;
    
    const angleDeg = Math.round((m.energy - m.stress) * 45);
    if (stabilityEl) stabilityEl.textContent = `${angleDeg}° focus`;
    if (intensityEl) intensityEl.textContent = m.intensity > 0.7 ? "High Peak" : "Steady";

    if (aiTextEl) {
        aiTextEl.textContent = m.score > 70 
            ? "Coherence level optimal. Resonance is stable." 
            : "Minor fluctuations. Practice rhythmic focus.";
    }

    // 3D Kompaso kampas
    updateCompass3D((m.energy - m.stress) * Math.PI);

    pushHistory(m);
    drawTimeline();
    drawPulse(m);
}

function pushHistory(m) {
    history.push({ ...m });
    if (history.length > 60) history.shift();
}

function drawTimeline() {
    if (!timelineCtx) return;
    const { width: w, height: h } = timelineCanvas;
    timelineCtx.clearRect(0, 0, w, h);
    
    timelineCtx.beginPath();
    timelineCtx.strokeStyle = "#3abff8";
    timelineCtx.lineWidth = 2;
    history.forEach((p, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h - (p.score / 100 * h * 0.8) - 5;
        if (i === 0) timelineCtx.moveTo(x, y);
        else timelineCtx.lineTo(x, y);
    });
    timelineCtx.stroke();
}

function drawPulse(m) {
    if (!pulseCtx) return;
    const { width: w, height: h } = pulseCanvas;
    pulseCtx.clearRect(0, 0, w, h);
    
    pulseCtx.beginPath();
    pulseCtx.strokeStyle = "#7b5cff";
    const midY = h / 2;
    const amp = 5 + (m.intensity * 20);
    for (let x = 0; x < w; x++) {
        const y = midY + Math.sin(x * 0.05 + Date.now() * 0.01) * amp;
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
        camStatus.textContent = "Syncing Neural Networks...";
        
        // Modeliai kraunami iš šakninio /models aplanko
        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
        await faceapi.nets.faceExpressionNet.loadFromUri("./models");

        modelsReady = true;
        await startCamera();
        
        if (typeof initCompass3D === 'function') initCompass3D();
        
        loop();
    } catch (err) {
        camStatus.textContent = "Sync failed. System offline.";
        console.error(err);
    }
}

init();

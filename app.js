import { initCompass3D, updateCompass3D } from "./compas3d-v2.js";

const faceapi = window.faceapi;

// UI elementai
const video = document.getElementById("cam");
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
   CAMERA INITIALIZATION
--------------------------------------------------------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 520, height: 360 } 
        });
        video.srcObject = stream;
        // Užtikriname, kad video tikrai pasileido
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                camStatus.textContent = "Camera active — analyzing field...";
                resolve();
            };
        });
    } catch (err) {
        camStatus.innerHTML = "<span style='color: #f87171'>Camera blocked — check permissions</span>";
        console.error("Camera error:", err);
    }
}

/* ---------------------------------------------------------
   DETECTION LOOP
--------------------------------------------------------- */
async function loop() {
    if (!modelsReady || !video.videoWidth) {
        requestAnimationFrame(loop);
        return;
    }

    const det = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

    if (det && det.expressions) {
        const ex = det.expressions;
        
        // Emocijų normalizavimas
        const joy = ex.happy + (ex.surprised * 0.3);
        const stress = ex.angry + ex.fearful + (ex.disgusted * 0.5) + (ex.sad * 0.3);
        const calm = ex.neutral + (0.2 * (1 - Math.min(1, joy + stress)));

        const total = joy + stress + calm || 1;
        const currentEmotion = {
            joy: joy / total,
            stress: stress / total,
            calm: calm / total
        };

        // Skaičiavimai UI daliai
        const score = Math.round((currentEmotion.calm * 50 + currentEmotion.joy * 40 - currentEmotion.stress * 30 + 40));
        const energyValue = Math.max(currentEmotion.joy, currentEmotion.calm);
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
   UI & VISUALS
--------------------------------------------------------- */
function updateUI(m) {
    scoreEl.textContent = `${m.score} / 100`;
    energyEl.textContent = `${m.energy.toFixed(2)} rising`;
    stressEl.textContent = `${m.stress.toFixed(2)} ${m.stress < 0.33 ? "low" : m.stress < 0.66 ? "medium" : "high"}`;
    
    const angleDeg = Math.round((m.energy - m.stress) * 18);
    stabilityEl.textContent = `${angleDeg}° toward ${m.energy >= m.stress ? "Joy" : "Stress"}`;
    intensityEl.textContent = m.energy < 0.33 ? "Low" : m.energy < 0.66 ? "Medium" : "High";

    aiTextEl.textContent = m.score > 75 ? "Your field looks coherent. Stay focused." : "Balanced but fluctuating. Reduce stimulation.";
    aiTagsEl.textContent = m.score > 75 ? "#focus #calm #momentum" : "#grounded #clarity #steady";

    // Kompaso sukimas (naudojami radianai)
    const targetAngle = (m.energy - m.stress) * Math.PI;
    updateCompass3D(targetAngle);

    pushHistory(m);
    drawTimeline();
    drawPulse(m);
}

function pushHistory(m) {
    history.push({ ...m, ts: Date.now() });
    if (history.length > 50) history.shift();
}

function drawTimeline() {
    if (!timelineCtx) return;
    const { width: w, height: h } = timelineCanvas;
    timelineCtx.clearRect(0, 0, w, h);
    if (history.length < 2) return;

    const drawLine = (prop, color, isScore = false) => {
        timelineCtx.beginPath();
        timelineCtx.strokeStyle = color;
        timelineCtx.lineWidth = 2;
        history.forEach((p, i) => {
            const x = (i / (history.length - 1)) * w;
            const val = isScore ? p[prop] / 100 : p[prop];
            const y = h - (val * h * 0.8) - (h * 0.1);
            if (i === 0) timelineCtx.moveTo(x, y);
            else timelineCtx.lineTo(x, y);
        });
        timelineCtx.stroke();
    };

    drawLine('score', '#ffffff', true);
    drawLine('energy', '#3abff8');
    drawLine('stress', '#f87171');
}

function drawPulse(m) {
    if (!pulseCtx) return;
    const { width: w, height: h } = pulseCanvas;
    pulseCtx.clearRect(0, 0, w, h);
    
    const centerY = h / 2;
    const amp = 10 + (m.intensity * 20);
    const freq = 0.05 + (m.stress * 0.05);

    pulseCtx.beginPath();
    pulseCtx.strokeStyle = "#7b5cff";
    pulseCtx.lineWidth = 3;

    for (let x = 0; x < w; x++) {
        const y = centerY + Math.sin(x * freq + Date.now() * 0.005) * amp;
        if (x === 0) pulseCtx.moveTo(x, y);
        else pulseCtx.lineTo(x, y);
    }
    pulseCtx.stroke();
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function init() {
    try {
        camStatus.textContent = "Loading AI models...";
        
        // Svarbu: Įsitikinkite, kad šie failai yra /models aplanke
        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
        await faceapi.nets.faceExpressionNet.loadFromUri("./models");

        modelsReady = true;
        camStatus.textContent = "Accessing camera...";
        
        await startCamera();
        initCompass3D();
        
        loop();
    } catch (err) {
        camStatus.textContent = "Error during initialization.";
        console.error("Init error:", err);
    }
}

init();

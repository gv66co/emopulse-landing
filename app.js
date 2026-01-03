import { initCompass3D, updateCompass3D } from "./compas3d-v2.js";

const faceapi = window.faceapi;

// UI Elements
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const auraCanvas = document.getElementById("auraCanvas");
const camStatus = document.getElementById("camStatus");
const aiTextEl = document.getElementById("aiText");
const aiTagsEl = document.getElementById("aiTags");
const scoreEl = document.getElementById("score");
const scoreValueEl = document.getElementById("scoreValue"); // Didysis skaičius apačioje
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const stressIconEl = document.getElementById("stressIcon"); // ☀️ piktograma
const stabilityEl = document.getElementById("stability");
const intensityEl = document.getElementById("intensity");

// Drawing Contexts
const auraCtx = auraCanvas?.getContext("2d");
const timelineCanvas = document.getElementById("timeline");
const pulseCanvas = document.getElementById("pulse");
const timelineCtx = timelineCanvas?.getContext("2d");
const pulseCtx = pulseCanvas?.getContext("2d");

let modelsReady = false;
const history = [];

/* ---------------------------------------------------------
   DYNAMIC ASSETS & INSIGHTS
--------------------------------------------------------- */
function getStressVisuals(level) {
    if (level > 0.6) return { icon: "⛈️", tags: ["#storm", "#high_alert", "#unstable"] };
    if (level > 0.3) return { icon: "☁️", tags: ["#cloudy", "#tension", "#processing"] };
    return { icon: "☀️", tags: ["#clear", "#focused", "#tranquil"] };
}

function getHumanInsight(m, emotion) {
    if (emotion.joy > 0.75) return "Exceptional emotional resonance. Your field is optimized for visionary leadership.";
    if (emotion.stress > 0.55) return "High cognitive load detected. Practice rhythmic breathing to restore field coherence.";
    if (emotion.calm > 0.85) return "Profound physiological stillness. Ideal for deep strategic focus.";
    return "Emotional field is harmonized. Stability levels are within optimal operational parameters.";
}

/* ---------------------------------------------------------
   SYSTEM LOGIC
--------------------------------------------------------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                camStatus.innerHTML = `<span style="color: #3abff8">●</span> System online — field active`;
                resolve();
            };
        });
    } catch (err) {
        camStatus.innerHTML = `<span style="color: #f87171">●</span> Camera access denied`;
    }
}

async function loop() {
    if (!modelsReady || !video.videoWidth || video.paused) {
        requestAnimationFrame(loop);
        return;
    }

    try {
        const det = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceExpressions();

        if (det && det.expressions) {
            const ex = det.expressions;
            const joy = ex.happy + (ex.surprised * 0.2);
            const stress = ex.angry + ex.fearful + (ex.disgusted * 0.4) + (ex.sad * 0.3);
            const calm = ex.neutral;
            const total = joy + stress + calm || 1;
            
            const currentEmotion = { joy: joy/total, stress: stress/total, calm: calm/total };
            const score = Math.round((currentEmotion.calm * 60 + currentEmotion.joy * 40 - currentEmotion.stress * 40 + 30));
            
            const metrics = {
                score: Math.min(100, Math.max(0, score)),
                energy: Math.min(1, currentEmotion.joy + (currentEmotion.stress * 0.35)),
                stress: currentEmotion.stress,
                stability: 1 - Math.abs(currentEmotion.joy - currentEmotion.stress),
                intensity: (joy + stress) / 2
            };

            updateUI(metrics, currentEmotion);
            drawAura(det.detection.box, currentEmotion);
        }
    } catch (e) {}
    requestAnimationFrame(loop);
}

function updateUI(m, currentEmotion) {
    // Stats Update
    if (scoreEl) scoreEl.textContent = `${m.score} / 100`;
    if (scoreValueEl) scoreValueEl.textContent = m.score;
    if (energyEl) energyEl.textContent = m.energy.toFixed(2);
    if (stressEl) stressEl.textContent = m.stress.toFixed(2);
    
    // Stability & Intensity
    const angleDeg = Math.round((m.energy - m.stress) * 45);
    if (stabilityEl) stabilityEl.textContent = `${angleDeg}° toward Calm`;
    if (intensityEl) intensityEl.textContent = m.intensity > 0.6 ? "High Peak" : "Steady";

    // Dynamic Visuals (Icon & Tags)
    const visualData = getStressVisuals(m.stress);
    if (stressIconEl) stressIconEl.textContent = visualData.icon;
    if (aiTagsEl) {
        aiTagsEl.innerHTML = visualData.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // AI Insight Text
    const insight = getHumanInsight(m, currentEmotion);
    if (aiTextEl) aiTextEl.textContent = insight;

    // Charts & Compass
    updateCompass3D((m.energy - m.stress) * Math.PI);
    pushHistory(m);
    drawTimeline();
    drawPulse(m);
}

/* ---------------------------------------------------------
   VISUALS
--------------------------------------------------------- */
function drawAura(box, emotion) {
    if (!auraCtx) return;
    auraCtx.clearRect(0, 0, auraCanvas.width, auraCanvas.height);
    let color = emotion.joy > 0.4 ? "251, 191, 36" : emotion.stress > 0.4 ? "248, 113, 113" : "58, 191, 248";
    
    const grad = auraCtx.createRadialGradient(160, 160, 10, 160, 160, 150);
    grad.addColorStop(0, `rgba(${color}, 0.6)`);
    grad.addColorStop(1, `rgba(${color}, 0)`);
    auraCtx.fillStyle = grad;
    auraCtx.beginPath();
    auraCtx.arc(160, 160, 100 + Math.sin(Date.now() * 0.005) * 10, 0, Math.PI * 2);
    auraCtx.fill();
}

function pushHistory(m) {
    history.push({ ...m });
    if (history.length > 50) history.shift();
}

function drawTimeline() {
    if (!timelineCtx) return;
    timelineCtx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
    timelineCtx.beginPath();
    timelineCtx.strokeStyle = "#3abff8";
    history.forEach((p, i) => {
        const x = (i / 49) * timelineCanvas.width;
        const y = timelineCanvas.height - (p.score / 100 * 50);
        i === 0 ? timelineCtx.moveTo(x, y) : timelineCtx.lineTo(x, y);
    });
    timelineCtx.stroke();
}

function drawPulse(m) {
    if (!pulseCtx) return;
    pulseCtx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
    pulseCtx.beginPath();
    pulseCtx.strokeStyle = "#7b5cff";
    for (let x = 0; x < pulseCanvas.width; x++) {
        const y = 30 + Math.sin(x * 0.1 + Date.now() * 0.01) * (5 + m.intensity * 20);
        x === 0 ? pulseCtx.moveTo(x, y) : pulseCtx.lineTo(x, y);
    }
    pulseCtx.stroke();
}

async function init() {
    try {
        const WEIGHTS = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS);
        await faceapi.nets.faceExpressionNet.loadFromUri(WEIGHTS);
        modelsReady = true;
        await startCamera();
        if (typeof initCompass3D === 'function') initCompass3D();
        loop();
    } catch (e) { console.error(e); }
}

init();

import { initCompass3D, updateCompass3D } from "./compas3d-v2.js";

// Face API initialization
const faceapi = window.faceapi;

// UI Elements
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const auraCanvas = document.getElementById("auraCanvas");
const camStatus = document.getElementById("camStatus");
const aiTextEl = document.getElementById("aiText");
const scoreEl = document.getElementById("score");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
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
   HUMAN INSIGHT ENGINE (ENGLISH ONLY)
--------------------------------------------------------- */
function getHumanInsight(m, emotion) {
    // Priority: Strongest emotion first
    if (emotion.joy > 0.75) return "Exceptional emotional resonance. Your field is optimized for visionary leadership and creative output.";
    if (emotion.stress > 0.55) return "System detecting high cognitive load. Practice rhythmic breathing to restore field coherence.";
    if (emotion.calm > 0.85) return "Profound physiological stillness. Ideal state for complex problem solving and deep focus.";
    
    // Pattern based insights
    if (m.energy > 0.65 && m.stress < 0.25) return "Synchronized Flow State achieved. Cognitive processing is highly efficient.";
    if (m.energy < 0.35 && m.stress > 0.35) return "System alerting: Bio-energetic fatigue. Recommend a recovery phase to stabilize resonance.";
    
    // Default steady state
    return "Emotional field is harmonized. Stability levels are within the optimal operational parameters.";
}

/* ---------------------------------------------------------
   AI VOICE SYNTHESIS (ENGLISH VOICE)
--------------------------------------------------------- */
function speakInsight(text) {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); 
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.92; // Slightly robotic but clear AI tone
    msg.pitch = 1.0;
    
    window.speechSynthesis.speak(msg);
}

/* ---------------------------------------------------------
   SYSTEM INITIALIZATION & CAMERA
--------------------------------------------------------- */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } 
        });
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                camStatus.innerHTML = `<span style="color: #3abff8">●</span> System online — emotional field active`;
                
                if (overlay) { overlay.width = video.videoWidth; overlay.height = video.videoHeight; }
                if (auraCanvas) { auraCanvas.width = 320; auraCanvas.height = 320; }
                
                resolve();
            };
        });
    } catch (err) {
        camStatus.innerHTML = `<span style="color: #f87171">●</span> System Error: Camera access denied`;
        console.error("Camera error:", err);
    }
}

/* ---------------------------------------------------------
   CORE ANALYSIS LOOP
--------------------------------------------------------- */
async function loop() {
    if (!modelsReady || !video.videoWidth || video.paused) {
        requestAnimationFrame(loop);
        return;
    }

    try {
        const det = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceExpressions();

        if (det && det.expressions) {
            const ex = det.expressions;
            
            // Core calculation logic
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
    } catch (e) {
        // Silent catch to prevent loop breakage on minor detection glitches
    }

    requestAnimationFrame(loop);
}

/* ---------------------------------------------------------
   UI & VISUAL FEEDBACK
--------------------------------------------------------- */
function updateUI(m, currentEmotion) {
    // Numerical updates
    if (scoreEl) scoreEl.textContent = `${m.score} / 100`;
    if (energyEl) energyEl.textContent = `${m.energy.toFixed(2)} unit`;
    if (stressEl) stressEl.textContent = `${m.stress.toFixed(2)} ${m.stress < 0.3 ? 'low' : 'elevated'}`;
    
    const angleDeg = Math.round((m.energy - m.stress) * 45);
    if (stabilityEl) stabilityEl.textContent = `${angleDeg}° focus`;
    if (intensityEl) intensityEl.textContent = m.intensity > 0.7 ? "High Peak" : "Steady";

    // Textual Insights
    const insight = getHumanInsight(m, currentEmotion);
    if (aiTextEl) aiTextEl.textContent = insight;

    // AI Voice Management (Throttle speech to every 50 seconds)
    if (!window.lastSpeak || Date.now() - window.lastSpeak > 50000) {
        speakInsight(insight);
        window.lastSpeak = Date.now();
    }

    // External Visual Modules
    updateCompass3D((m.energy - m.stress) * Math.PI);
    pushHistory(m);
    drawTimeline();
    drawPulse(m);
}

/* ---------------------------------------------------------
   CANVAS VISUALS (AURA & GRAPHS)
--------------------------------------------------------- */
function drawAura(box, emotion) {
    if (!auraCtx) return;
    const { width: w, height: h } = auraCanvas;
    auraCtx.clearRect(0, 0, w, h);

    let color = "58, 191, 248"; // Default Blue
    if (emotion.joy > 0.45) color = "251, 191, 36"; // Gold
    if (emotion.stress > 0.45) color = "248, 113, 113"; // Red

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
   BOOTSTRAP SYSTEM
--------------------------------------------------------- */
async function init() {
    try {
        camStatus.textContent = "Syncing Neural Networks...";
        
        // Remote weights loading to ensure compatibility
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        modelsReady = true;
        await startCamera();
        
        if (typeof initCompass3D === 'function') initCompass3D();
        
        loop();
    } catch (err) {
        camStatus.textContent = "Sync failed. Check system resources.";
        console.error("Initialization Error:", err);
    }
}

init();

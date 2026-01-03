// =========================================
// EMOPULSE PRO – CORE ENGINE
// =========================================

const video = document.getElementById("cam");
const auraCanvas = document.getElementById("auraCanvas");
const auraCtx = auraCanvas.getContext("2d");
const aiTextEl = document.getElementById("aiText");
const scoreValueEl = document.getElementById("scoreValue");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const scoreEl = document.getElementById("score");
const aiTagsEl = document.getElementById("aiTags");
const stressIconEl = document.getElementById("stressIcon");

// Charts setup
const timelineCanvas = document.getElementById("timelineCanvas");
const pulseCanvas = document.getElementById("pulseCanvas");
const timelineCtx = timelineCanvas?.getContext("2d");
const pulseCtx = pulseCanvas?.getContext("2d");

let modelsReady = false;
let history = new Array(60).fill(50);
let lastInsight = "";
let lastVoiceTrigger = 0;

// Natasha AI Voice Engine
function natashaSpeak(text) {
    const now = Date.now();
    // Neleidžiame kalbėti dažniau nei kas 8 sekundes, kad nebūtų įkyru
    if (window.speechSynthesis.speaking || now - lastVoiceTrigger < 8000) return;
    
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = 0.92;
    msg.pitch = 1.05;
    window.speechSynthesis.speak(msg);
    lastVoiceTrigger = now;
}

/* ---------------------------------------------------------
   INITIALIZATION
--------------------------------------------------------- */
async function init() {
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        modelsReady = true;
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: "user" } 
        });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            auraCanvas.width = video.videoWidth;
            auraCanvas.height = video.videoHeight;
            loop();
        };
    } catch (err) {
        aiTextEl.innerText = "System Error: Camera access required.";
    }
}

/* ---------------------------------------------------------
   MAIN ANALYSIS LOOP
--------------------------------------------------------- */
async function loop() {
    if (modelsReady && video.readyState === 4) {
        const det = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
                                 .withFaceExpressions();
        
        if (det) {
            const ex = det.expressions;
            
            // Emocinė logika (Subalansuota)
            const joy = ex.happy;
            const stress = (ex.angry + ex.fearful + ex.sad * 0.5);
            const calm = ex.neutral;
            
            // Coherence Score (0-100)
            const score = Math.round((calm * 60 + joy * 40 - stress * 50 + 20));
            const finalScore = Math.min(100, Math.max(0, score));
            
            // UI rodmenų atnaujinimas
            updateUI({
                score: finalScore,
                energy: (joy + stress * 0.4 + 0.1).toFixed(2),
                stress: stress.toFixed(2),
                box: det.detection.box,
                emotion: { joy, stress, calm }
            });
        } else {
            // Jei veidas neaptiktas
            aiTextEl.innerText = "Searching for field resonance...";
            auraCtx.clearRect(0, 0, auraCanvas.width, auraCanvas.height);
        }
    }
    requestAnimationFrame(loop);
}

/* ---------------------------------------------------------
   UI & VISUALS
--------------------------------------------------------- */
function updateUI(m) {
    scoreValueEl.innerText = m.score;
    scoreEl.innerText = m.score + "%";
    energyEl.innerText = m.energy;
    stressEl.innerText = m.stress;
    
    // Dinaminės įžvalgos ir Natasha
    let insight = "";
    if (m.score > 75) {
        insight = "Exceptional coherence. Your field is optimized for strategic vision.";
        aiTagsEl.innerHTML = '<span class="tag">#VISIONARY</span><span class="tag">#PEAK</span>';
        stressIconEl.innerText = "☀️";
        natashaSpeak("I detect peak operational harmony. You are in a flow state.");
    } else if (m.stress > 0.4) {
        insight = "High stress load. Physiological stability is compromised.";
        aiTagsEl.innerHTML = '<span class="tag">#STRESS_ALERT</span><span class="tag">#RECOVERY</span>';
        stressIconEl.innerText = "⛈️";
        natashaSpeak("Warning. Your stress markers are rising. Please re-center.");
    } else {
        insight = "Field is harmonized. Stability levels are within optimal parameters.";
        aiTagsEl.innerHTML = '<span class="tag">#STABLE</span><span class="tag">#CALM</span>';
        stressIconEl.innerText = "☁️";
    }
    
    if (aiTextEl.innerText !== insight) aiTextEl.innerText = insight;

    drawAura(m.box, m.emotion);
    drawCharts(m.score, m.energy);
}

function drawAura(box, e) {
    auraCtx.clearRect(0, 0, auraCanvas.width, auraCanvas.height);
    
    // Spalva pagal būseną
    let color = "58, 191, 248"; // Default Blue
    if (e.joy > 0.5) color = "251, 191, 36"; // Gold
    if (e.stress > 0.4) color = "248, 113, 113"; // Red

    // Braižome "kvėpuojantį" rėmelį
    const glow = Math.sin(Date.now() * 0.005) * 5;
    auraCtx.strokeStyle = `rgba(${color}, 0.6)`;
    auraCtx.lineWidth = 4;
    auraCtx.shadowBlur = 15 + glow;
    auraCtx.shadowColor = `rgba(${color}, 0.8)`;
    
    // Apvalintas rėmelis aplink veidą
    const r = 20; // border radius
    auraCtx.beginPath();
    auraCtx.roundRect(box.x, box.y, box.width, box.height, [r]);
    auraCtx.stroke();
}

function drawCharts(score, energy) {
    history.push(score);
    history.shift();

    // Timeline grafikas
    if (timelineCtx) {
        timelineCtx.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
        timelineCtx.beginPath();
        timelineCtx.strokeStyle = "#7b5cff";
        timelineCtx.lineWidth = 2;
        history.forEach((val, i) => {
            const x = (i / (history.length - 1)) * timelineCanvas.width;
            const y = timelineCanvas.height - (val / 100) * timelineCanvas.height;
            i === 0 ? timelineCtx.moveTo(x, y) : timelineCtx.lineTo(x, y);
        });
        timelineCtx.stroke();
    }

    // Pulse grafikas (Sinusoidė pagal energiją)
    if (pulseCtx) {
        pulseCtx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
        pulseCtx.beginPath();
        pulseCtx.strokeStyle = "#3abff8";
        const speed = Date.now() * 0.01;
        const amp = 5 + energy * 15;
        for (let x = 0; x < pulseCanvas.width; x++) {
            const y = 30 + Math.sin(x * 0.1 + speed) * amp;
            x === 0 ? pulseCtx.moveTo(x, y) : pulseCtx.lineTo(x, y);
        }
        pulseCtx.stroke();
    }
}

// Start system
init();

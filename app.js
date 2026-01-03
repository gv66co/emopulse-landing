/**
 * EMOPULSE PRO – CORE AI ENGINE
 * Version: 2.1.0
 * Status: Production Ready
 */

import { initCompass3D, updateCompass3D } from './compas3d-v2.js';

// --- DOM ELEMENTŲ REGISTRACIJA ---
const video = document.getElementById('cam');
const overlay = document.getElementById('overlay');
const ctx = overlay?.getContext('2d');
const aiTextEl = document.getElementById('aiText');
const aiTagsEl = document.getElementById('aiTags');
const scoreValueEl = document.getElementById('scoreValue');
const energyEl = document.getElementById('energy');
const stressEl = document.getElementById('stress');
const stabilityEl = document.getElementById('stability');
const intensityEl = document.getElementById('intensity');
const scoreSmallEl = document.getElementById('score');
const stressIconEl = document.getElementById('stressIcon');
const camStatusEl = document.getElementById('camStatus');

// --- GRAFIKŲ KONFIGŪRACIJA ---
const timelineCanvas = document.getElementById('timelineCanvas');
const pulseCanvas = document.getElementById('pulseCanvas');
const timelineCtx = timelineCanvas?.getContext('2d');
const pulseCtx = pulseCanvas?.getContext('2d');

// --- SISTEMOS BŪSENA ---
let modelsReady = false;
let history = new Array(100).fill(50); // Ilgesnė istorija sklandesniam grafikui
let lastVoiceTrigger = 0;
let frameCount = 0;

/* ---------------------------------------------------------
   NATASHA AI VOICE ENGINE
--------------------------------------------------------- */
function natashaSpeak(text) {
    const now = Date.now();
    // Protingas ribojimas: ne dažniau nei kas 12 sekundžių
    if (window.speechSynthesis.speaking || now - lastVoiceTrigger < 12000) return;
    
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Bandom parinkti geriausią moterišką balsą, jei yra
    msg.voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female')) || voices[0];
    msg.lang = 'en-US';
    msg.rate = 0.88; // Šiek tiek lėtesnis, autoritetingas balsas
    msg.pitch = 1.0;
    
    window.speechSynthesis.speak(msg);
    lastVoiceTrigger = now;
}

/* ---------------------------------------------------------
   SISTEMOS PALEIDIMAS (INITIALIZATION)
--------------------------------------------------------- */
async function startProSystem() {
    try {
        if (camStatusEl) camStatusEl.innerText = "System Status: Loading AI Models...";
        
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
        
        // Krauname abu modelius lygiagrečiai greičiui
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        modelsReady = true;
        if (camStatusEl) camStatusEl.innerText = "System Status: Accessing Camera...";

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                facingMode: "user" 
            } 
        });
        
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            // Overlay drobės pritaikymas prie video matmenų
            if (overlay) {
                overlay.width = video.clientWidth;
                overlay.height = video.clientHeight;
            }
            
            // Inicijuojame 3D kompasą
            initCompass3D();
            
            if (camStatusEl) camStatusEl.innerText = "System Status: Online & Analyzing";
            runMainLoop();
        };
    } catch (err) {
        console.error("AI Core Error:", err);
        if (aiTextEl) aiTextEl.innerText = "Hardware Error: Camera connection failed.";
    }
}

/* ---------------------------------------------------------
   PAGRINDINIS ANALIZĖS CIKLAS
--------------------------------------------------------- */
async function runMainLoop() {
    frameCount++;

    if (modelsReady && video.readyState === 4) {
        // Naudojame TinyFaceDetector greičiui (Real-time performance)
        const detection = await faceapi.detectSingleFace(
            video, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
        ).withFaceExpressions();
        
        if (detection) {
            const expressions = detection.expressions;
            
            // Emociniai svoriai
            const joy = expressions.happy;
            const stressVal = (expressions.angry + expressions.fearful + expressions.sad * 0.6);
            const calm = expressions.neutral;
            const surprised = expressions.surprised;

            // Algoritmas: Coherence Score (Balansas tarp ramybės ir teigiamos energijos)
            const baseScore = (calm * 65 + joy * 45 - stressVal * 55 + surprised * 20 + 15);
            const finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));

            // 1. Sinchronizacija su 3D moduliu (Kampas nuo -PI iki PI)
            const driftAngle = (joy - stressVal) * Math.PI;
            updateCompass3D(driftAngle);

            // 2. UI Atnaujinimas
            renderInterface({
                score: finalScore,
                energy: (joy + stressVal * 0.3 + surprised * 0.5 + 0.1).toFixed(2),
                stress: stressVal.toFixed(2),
                box: detection.detection.box,
                expressions: { joy, stress: stressVal, calm }
            });

        } else if (frameCount % 30 === 0) {
            // Jei veido nėra, pranešame kas 30 kadrų, kad neterštų ekrano
            if (aiTextEl) aiTextEl.innerText = "Scanning for biological field resonance...";
            if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
    }
    
    requestAnimationFrame(runMainLoop);
}

/* ---------------------------------------------------------
   INTERFEISO RENDERINIMAS
--------------------------------------------------------- */
function renderInterface(data) {
    // Pagrindiniai rodikliai
    if (scoreValueEl) scoreValueEl.innerText = data.score;
    if (scoreSmallEl) scoreSmallEl.innerText = `${data.score} / 100`;
    if (energyEl) energyEl.innerText = data.energy;
    if (stressEl) stressEl.innerText = data.stress;

    // Drift skydelis
    if (stabilityEl) {
        const deg = Math.round((data.expressions.joy - data.expressions.stress) * 90);
        stabilityEl.innerText = `${Math.abs(deg)}° toward ${deg >= 0 ? 'Coherence' : 'Drift'}`;
    }
    if (intensityEl) {
        intensityEl.innerText = data.score > 80 ? "Peak Flow" : (data.score > 50 ? "Steady" : "Turbulent");
    }

    // Dinaminės įžvalgos ir Natasha AI Voice
    processInsights(data);

    // Vizualiniai efektai
    drawFaceAura(data.box, data.expressions);
    drawLiveCharts(data.score, parseFloat(data.energy));
}

function processInsights(data) {
    let msg = "";
    let tags = "";

    if (data.score > 78) {
        msg = "Optimal field coherence. Neuro-stability is at peak performance.";
        tags = '<span class="tag">#VISIONARY</span><span class="tag">#PEAK_FLOW</span>';
        if (stressIconEl) stressIconEl.innerText = "☀️";
        natashaSpeak("Your resonance is exceptional. You are currently in a peak flow state.");
    } else if (data.stress > 0.42) {
        msg = "Biometric tension detected. System recommends immediate re-centering.";
        tags = '<span class="tag">#STRESS_ALERT</span><span class="tag">#RECOVERY</span>';
        if (stressIconEl) stressIconEl.innerText = "⛈️";
        natashaSpeak("Warning. High stress load detected. Focus on deep rhythmic breathing.");
    } else {
        msg = "Biological field is stable. Core resonance within safe parameters.";
        tags = '<span class="tag">#STABLE</span><span class="tag">#NEUTRAL</span>';
        if (stressIconEl) stressIconEl.innerText = "☁️";
    }

    if (aiTextEl && aiTextEl.innerText !== msg) {
        aiTextEl.innerText = msg;
        aiTagsEl.innerHTML = tags;
    }
}

/* ---------------------------------------------------------
   GRAFINIAI EFEKTAI (AURA & CHARTS)
--------------------------------------------------------- */
function drawFaceAura(box, ex) {
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Spalva parenkama pagal vyraujančią emociją
    let color = "#3abff8"; // Blue (Calm)
    if (ex.joy > 0.4) color = "#fbbf24"; // Gold (Joy)
    if (ex.stress > 0.35) color = "#f87171"; // Red (Stress)

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    
    // "Glow" efektas rėmeliui
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    // Braižome rėmelį su užapvalintais kampais (HTML5 Canvas roundRect)
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.width, box.height, 15);
        ctx.stroke();
    } else {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    
    ctx.shadowBlur = 0; // Nuimame glow kitiems elementams
}

function drawLiveCharts(score, energy) {
    history.push(score);
    if (history.length > 100) history.shift();

    // 1. Timeline Chart
    if (timelineCtx) {
        const w = timelineCanvas.width;
        const h = timelineCanvas.height;
        timelineCtx.clearRect(0, 0, w, h);
        
        // Gradientas po linija
        const grad = timelineCtx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(123, 92, 255, 0.3)');
        grad.addColorStop(1, 'rgba(123, 92, 255, 0)');

        timelineCtx.beginPath();
        timelineCtx.strokeStyle = "#7b5cff";
        timelineCtx.lineWidth = 3;

        for (let i = 0; i < history.length; i++) {
            const x = (i / (history.length - 1)) * w;
            const y = h - (history[i] / 100) * h;
            if (i === 0) timelineCtx.moveTo(x, y);
            else timelineCtx.lineTo(x, y);
        }
        timelineCtx.stroke();
        
        // Užpildome apačią
        timelineCtx.lineTo(w, h);
        timelineCtx.lineTo(0, h);
        timelineCtx.fillStyle = grad;
        timelineCtx.fill();
    }

    // 2. Pulse Wave Chart
    if (pulseCtx) {
        const w = pulseCanvas.width;
        const h = pulseCanvas.height;
        pulseCtx.clearRect(0, 0, w, h);
        
        pulseCtx.beginPath();
        pulseCtx.strokeStyle = "#3abff8";
        pulseCtx.lineWidth = 2;

        const time = Date.now() * 0.008;
        const amplitude = 10 + energy * 20;

        for (let x = 0; x < w; x++) {
            const y = (h / 2) + Math.sin(x * 0.05 + time) * amplitude;
            if (x === 0) pulseCtx.moveTo(x, y);
            else pulseCtx.lineTo(x, y);
        }
        pulseCtx.stroke();
    }
}

// Paleidžiame sistemą
startProSystem();

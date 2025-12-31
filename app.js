/* -------------------------------------------------------
   PREMIUM API BLOCK (unchanged)
------------------------------------------------------- */

const API_BASE = "https://emopulse-api-1009590211108.europe-west4.run.app";
const DEBUG_OVERLAY = false;

function createDebugOverlay() {
  if (!DEBUG_OVERLAY) return;
  const box = document.createElement("div");
  box.id = "emopulse-debug";
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.padding = "12px 18px";
  box.style.background = "rgba(0,0,0,0.75)";
  box.style.color = "#00eaff";
  box.style.fontFamily = "monospace";
  box.style.fontSize = "13px";
  box.style.borderRadius = "8px";
  box.style.zIndex = "99999";
  box.style.boxShadow = "0 0 12px rgba(0,255,255,0.4)";
  box.innerText = "Emopulse API: initializing…";
  document.body.appendChild(box);
}

function updateDebugOverlay(text) {
  if (!DEBUG_OVERLAY) return;
  const box = document.getElementById("emopulse-debug");
  if (box) box.innerText = text;
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

export const EmopulseAPI = {
  status: "offline",
  lastCheck: null,

  async init() {
    createDebugOverlay();
    updateDebugOverlay("Checking API…");

    try {
      const health = await this.health();
      this.status = "online";
      this.lastCheck = Date.now();
      updateDebugOverlay(`Online ✓ (${new Date().toLocaleTimeString()})`);
      console.log("Emopulse API online:", health);
    } catch (err) {
      this.status = "offline";
      updateDebugOverlay("Offline ✗");
      console.warn("Emopulse API offline:", err);
    }

    setInterval(() => this.recheck(), 10000);
  },

  async recheck() {
    try {
      await this.health();
      this.status = "online";
      this.lastCheck = Date.now();
      updateDebugOverlay(`Online ✓ (${new Date().toLocaleTimeString()})`);
    } catch {
      this.status = "offline";
      updateDebugOverlay("Offline ✗");
    }
  },

  async health() {
    return fetchWithRetry(`${API_BASE}/api/health`);
  },

  async rotate(text) {
    if (!text || typeof text !== "string") {
      throw new Error("rotate(text) requires a string");
    }

    return fetchWithRetry(`${API_BASE}/api/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  }
};

window.addEventListener("DOMContentLoaded", () => {
  EmopulseAPI.init();

  // DEMO call
  EmopulseAPI.rotate("arvydas")
    .then(r => console.log("Rotated:", r))
    .catch(e => console.error("Rotate error:", e));
});

/* -------------------------------------------------------
   FULL LANDING UI BLOCK (unchanged)
------------------------------------------------------- */

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as faceapi from "face-api.js";

/* DOM */
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");

const auraCanvas = document.getElementById("auraCanvas");
const actx = auraCanvas.getContext("2d");

const camStatus = document.getElementById("camStatus");

const analyzeBtn = document.getElementById("analyzeBtn");
const soundBtn = document.getElementById("soundBtn");

const aiText = document.getElementById("aiText");
const aiTags = document.getElementById("aiTags");

const scoreEl = document.getElementById("score");
const score2El = document.getElementById("score2");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const stabilityEl = document.getElementById("stability");
const intensityEl = document.getElementById("intensity");

const timeline = document.getElementById("timeline");
const tctx = timeline.getContext("2d");

const pulse = document.getElementById("pulse");
const pctx = pulse.getContext("2d");

document.getElementById("downloadPitchLeft").addEventListener("click", downloadPitch);
document.getElementById("downloadPitchRight").addEventListener("click", downloadPitch);
document.getElementById("tryLive").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

document.getElementById("send").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("message").value.trim();
  if (!name || !email || !msg) return alert("Fill all contact fields.");
  alert("Message sent.");
});

/* Audio */
let soundOn = true;
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "Sound: On" : "Sound: Off";
  soundBtn.setAttribute("aria-pressed", String(soundOn));
});

function beep(freq = 440, ms = 120) {
  if (!soundOn) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.02;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  setTimeout(() => {
    osc.stop();
    ctx.close();
  }, ms);
}

function downloadPitch() {
  const a = document.createElement("a");
  a.href = "/EMOPULSE.APP%20(1).pdf";
  a.download = "EMOPULSE.APP.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* State */
let landmarker = null;
let modelsReady = false;

let lastFrameTs = 0;
let timelineData = [];
let pulseSignal = [];
let bpm = null;

let lastEmotion = { joy: 0, stress: 0, calm: 0, raw: null };
let lastFaceBox = null;

/* POS rPPG buffers */
let rgbWindow = [];
const POS_WIN = 150;

init().catch((e) => {
  console.error(e);
  camStatus.textContent = "Init failed. Check console.";
});

async function init() {
  camStatus.textContent = "Loading models…";
  await Promise.all([initMediaPipe(), initFaceApi()]);
  camStatus.textContent = "Starting camera…";
  await startCamera();
  camStatus.textContent = "Running (on-device).";
  drawAuraLoop();
  requestAnimationFrame(loop);
}

async function initMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm"
  );

  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: "VIDEO",
    numFaces: 1
  });
}

async function initFaceApi() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("/models");
  modelsReady = true;
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 540 } },
    audio: false
  });
  video.srcObject = stream;
  await video.play();

  overlay.width = 520;
  overlay.height = 360;
}

/* Loop */
async function loop(ts) {
  requestAnimationFrame(loop);
  if (!video.videoWidth) return;

  if (ts - lastFrameTs < 33) return;
  lastFrameTs = ts;

  const mp = landmarker.detectForVideo(video, ts);
  const face = mp.faceLandmarks?.[0] || null;

  octx.clearRect(0, 0, overlay.width, overlay.height);

  if (face) {
    const pts = face.map((p) => ({ x: p.x * overlay.width, y: p.y * overlay.height }));
    const bb = bbox(pts);
    lastFaceBox = bb;

    drawFaceHUD(pts, bb);

    const roi = foreheadROI(pts);
    const rgb = sampleROI(video, roi, video.videoWidth, video.videoHeight);
    if (rgb) {
      rgbWindow.push(rgb);
      if (rgbWindow.length > POS_WIN) rgbWindow.shift();

      const s = posPulse(rgbWindow);
      if (s != null) {
        pulseSignal.push(s);
        if (pulseSignal.length > 420) pulseSignal.shift();
        bpm = estimateBPM(pulseSignal, 30);
      }
    }

    if (modelsReady && (timelineData.length % 6 === 0)) {
      await inferEmotions();
    }

    updateMetrics();
  } else {
    camStatus.textContent = "No face detected — look at the camera.";
    lastEmotion.joy *= 0.97;
    lastEmotion.stress *= 0.97;
    lastEmotion.calm *= 0.97;
    updateMetrics();
  }

  const score = computeScore();
  timelineData.push(score);
  if (timelineData.length > 240) timelineData.shift();
  drawTimeline(timelineData);

  drawPulse(pulseSignal, bpm);
}

/* Emotions */
async function inferEmotions() {
  const det = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
    .withFaceExpressions();

  if (!det?.expressions) return;

  const ex = det.expressions;

  const joy = clamp01(ex.happy + 0.25 * ex.surprised);
  const stress = clamp01(0.35 * ex.angry + 0.35 * ex.fearful + 0.15 * ex.disgusted + 0.25 * ex.sad);
  const calm = clamp01(ex.neutral * 0.9 + (1 - stress) * 0.1);

  lastEmotion.joy = lerp(lastEmotion.joy, joy, 0.25);
  lastEmotion.stress = lerp(lastEmotion.stress, stress, 0.25);
  lastEmotion.calm = lerp(lastEmotion.calm, calm, 0.25);
  lastEmotion.raw = ex;
}

/* Metrics */
function computeScore() {
  const base = 100 * (0.55 * lastEmotion.calm + 0.55 * lastEmotion.joy - 0.65 * lastEmotion.stress);
  const pulsePenalty = bpm ? clamp(0, 18, Math.abs(bpm - 72) * 0.28) : 0;
  return Math.round(clamp(0, 100, base + 55 - pulsePenalty));
}

function updateMetrics() {
  const score = computeScore();
  scoreEl.textContent = `${score} / 100`;
  score2El.textContent = `${score}/100`;

  const e = bpm ? clamp01((bpm - 55) / 70) : 0.5;
  const energy = clamp01(0.55 * e + 0.45 * lastEmotion.joy);
  energyEl.textContent = `${energy.toFixed(2).replace(".", ",")} rising`;

  const hr = bpm ? clamp01((bpm - 75) / 55) : 0.2;
  const stressRisk = clamp01(0.70 * lastEmotion.stress + 0.30 * hr);
  stressEl.textContent = `${stressRisk.toFixed(2).replace(".", ",")} ${
    stressRisk < 0.33 ? "low" : stressRisk < 0.66 ? "medium" : "high"
  }`;

  const stabilityDeg = Math.round((lastEmotion.joy - lastEmotion.stress) * 18);
  stabilityEl.textContent = `${Math.abs(stabilityDeg)}° toward ${stabilityDeg >= 0 ? "Joy" : "Stress"}`;

  const intensity = Math.max(lastEmotion.joy, lastEmotion.stress, lastEmotion.calm);
  intensityEl.textContent = intensity < 0.33 ? "Low" : intensity < 0.66 ? "Medium" : "High`;

  const insight = buildInsight(score, stressRisk, energy);
  aiText.textContent = insight.text;
  aiTags.textContent = insight.tags.join(" ");
}

/* Analyze button */
analyzeBtn.addEventListener("click", () => {
  const score = computeScore();
  beep(score > 75 ? 660 : 440, 120);
  camStatus.textContent = "Analysis refreshed.";
});

function buildInsight(score, stressRisk, energy) {
  if (stressRisk > 0.66) {
    return {
      text: "Your stress signal is elevated. Slow your breathing for 60 seconds and soften your jaw.",
      tags: ["#stabilize", "#breath", "#reset"]
    };
  }
  if (energy < 0.35) {
    return {
      text: "Low energy detected. Take a short movement break and hydrate, then re-check in 2 minutes.",
      tags: ["#energy", "#recover", "#clarity"]
    };
  }
  if (score > 78) {
    return {
      text: "Your field looks coherent. Stay with one task and avoid context switching for the next 10 minutes.",
      tags: ["#focus", "#calm", "#momentum"]
    };
  }
  return {
    text: "Balanced but fluctuating. Reduce stimulation and choose a single next action.",
    tags: ["#grounded", "#clarity", "#steady"]
  };
}

/* Aura */
function drawAuraLoop() {
  requestAnimationFrame(drawAuraLoop);

  const w = auraCanvas.width;
  const h = auraCanvas.height;
  actx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(cx, cy) - 18;

  const grad = actx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  grad.addColorStop(0, "rgba(107,140,255,0.95)");
  grad.addColorStop(0.58, "rgba(0,209,255,0.55)");
  grad.addColorStop(1, "rgba(255,154,107,0.40)");

  actx.fillStyle = grad;
  actx.beginPath();
  actx.arc(cx, cy, r, 0, Math.PI * 2);
  actx.fill();

  const t = performance.now() * 0.001;
  drawDot(cx + Math.cos(t) * r * 0.75, cy + Math.sin(t) * r * 0.35, 2.4);
  drawDot(cx + Math.cos(t + 2.1) * r * 0.62, cy + Math.sin(t + 2.1) * r * 0.62, 2.2);
  drawDot(cx + Math.cos(t + 4.2) * r * 0.42, cy + Math.sin(t + 4.2) * r * 0.78, 2.0);

  actx.fillStyle = "rgba(255,255,255,0.95)";
  actx.font = "700 14px Inter, system-ui, Arial";
  actx.fillText("Ca", cx - r * 0.78, cy - 8);
  actx.fillText("Joy", cx + r * 0.60, cy - 18);
  actx.fillText("Stress", cx - 18, cy + r * 0.80);

  const vx = (lastEmotion.joy - lastEmotion.stress) * 0.9;
  const vy = (lastEmotion.calm - 0.5) * -0.8;
  drawDot(cx + vx * r * 0.55, cy + vy * r * 0.55, 4.0, "rgba(255,255,255,0.95)");
}

function drawDot(x, y, rr, col = "rgba(0,209,255,0.9)") {
  actx.fillStyle = col;
  actx.beginPath();
  actx.arc(x, y, rr, 0, Math.PI * 2);
  actx.fill();
}

/* Overlay HUD */
function drawFaceHUD(pts, bb) {
  camStatus.textContent = "Face detected — on-device processing.";

  octx.strokeStyle = "rgba(0,209,255,0.55)";
  octx

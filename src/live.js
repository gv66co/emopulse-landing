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
  intensityEl.textContent = intensity < 0.33 ? "Low" : intensity < 0.66 ? "Medium" : "High";

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
  octx.lineWidth = 2;
  octx.strokeRect(bb.x, bb.y, bb.w, bb.h);

  octx.fillStyle = "rgba(255,255,255,0.65)";
  for (let i = 0; i < pts.length; i += 18) {
    const p = pts[i];
    octx.fillRect(p.x - 1, p.y - 1, 2, 2);
  }

  const roi = foreheadROI(pts);
  octx.strokeStyle = "rgba(107,140,255,0.55)";
  octx.strokeRect(roi.x, roi.y, roi.w, roi.h);
}

function bbox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function foreheadROI(pts) {
  const p10 = pts[10];
  const p151 = pts[151];
  const p109 = pts[109];
  const p338 = pts[338];

  const left = Math.min(p109.x, p338.x);
  const right = Math.max(p109.x, p338.x);

  const top = Math.min(p10.y, p151.y) - 6;
  const bottom = Math.min(p151.y + 10, top + 44);

  const x = clamp(0, overlay.width - 1, left + (right - left) * 0.18);
  const w = clamp(24, overlay.width, (right - left) * 0.64);
  const y = clamp(0, overlay.height - 1, top + 8);
  const h = clamp(18, overlay.height, bottom - y);

  return { x, y, w, h };
}

/* ROI sampling */
let OFF = null;
function getOffscreen(w, h) {
  if (!OFF) OFF = document.createElement("canvas");
  OFF.width = w;
  OFF.height = h;
  return OFF;
}

function sampleROI(videoEl, roiOverlay, vw, vh) {
  const scaleX = vw / overlay.width;
  const scaleY = vh / overlay.height;

  const rx = Math.floor(roiOverlay.x * scaleX);
  const ry = Math.floor(roiOverlay.y * scaleY);
  const rw = Math.floor(roiOverlay.w * scaleX);
  const rh = Math.floor(roiOverlay.h * scaleY);

  if (rw < 8 || rh < 8) return null;

  const off = getOffscreen(rw, rh);
  const ctx = off.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(videoEl, rx, ry, rw, rh, 0, 0, rw, rh);

  const img = ctx.getImageData(0, 0, rw, rh).data;

  let r = 0, g = 0, b = 0;
  const step = 4 * 3;
  for (let i = 0; i < img.length; i += step) {
    r += img[i];
    g += img[i + 1];
    b += img[i + 2];
  }
  const n = img.length / step;
  return { r: r / n, g: g / n, b: b / n };
}

/* POS rPPG */
function posPulse(rgbArr) {
  if (rgbArr.length < 12) return null;

  const mean = rgbArr.reduce(
    (a, c) => ({ r: a.r + c.r, g: a.g + c.g, b: a.b + c.b }),
    { r: 0, g: 0, b: 0 }
  );
  mean.r /= rgbArr.length;
  mean.g /= rgbArr.length;
  mean.b /= rgbArr.length;

  const X = rgbArr.map((c) => ({
    r: (c.r - mean.r) / mean.r,
    g: (c.g - mean.g) / mean.g,
    b: (c.b - mean.b) / mean.b
  }));

  const S1 = X.map((c) => c.g - c.b);
  const S2 = X.map((c) => -2 * c.r + c.g + c.b);

  const std1 = std(S1);
  const std2 = std(S2) || 1e-9;
  const alpha = std1 / std2;

  const H = S1.map((v, i) => v - alpha * S2[i]);
  return H[H.length - 1];
}

function estimateBPM(sig, fps) {
  if (sig.length < 180) return null;

  const hp = highpass(sig, Math.round(fps * 0.6));
  const bp = lowpass(hp, Math.round(fps * 0.25));

  const window = bp.slice(-Math.min(bp.length, fps * 8));
  const peaks = findPeaks(window, 0.35);

  if (peaks.length < 2) return null;

  const intervals = [];
  for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i] - peaks[i - 1]);

  const med = median(intervals);
  if (!med) return null;

  const out = (60 * fps) / med;
  if (out < 42 || out > 190) return null;
  return Math.round(out);
}

function highpass(x, win) {
  const ma = movingAverage(x, win);
  return x.map((v, i) => v - ma[i]);
}

function lowpass(x, win) {
  return movingAverage(x, win);
}

function movingAverage(x, win) {
  const out = new Array(x.length);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    s += x[i];
    if (i >= win) s -= x[i - win];
    out[i] = s / Math.min(i + 1, win);
  }
  return out;
}

function findPeaks(x, z = 0.35) {
  const m = mean(x);
  const sd = std(x) || 1e-9;
  const thr = m + z * sd;

  const peaks = [];
  for (let i = 1; i < x.length - 1; i++) {
    if (x[i] > thr && x[i] > x[i - 1] && x[i] > x[i + 1]) peaks.push(i);
  }

  const minDist = 8;
  const filtered = [];
  for (const p of peaks) {
    if (!filtered.length || p - filtered[filtered.length - 1] >= minDist) filtered.push(p);
  }
  return filtered;
}

/* Charts */
function drawTimeline(arr) {
  const w = timeline.width;
  const h = timeline.height;
  tctx.clearRect(0, 0, w, h);

  tctx.strokeStyle = "rgba(255,255,255,0.08)";
  tctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h * i) / 5;
    tctx.beginPath();
    tctx.moveTo(0, y);
    tctx.lineTo(w, y);
    tctx.stroke();
  }

  tctx.strokeStyle = "rgba(107,140,255,0.95)";
  tctx.lineWidth = 2;
  tctx.beginPath();
  for (let i = 0; i < arr.length; i++) {
    const x = (i / (arr.length - 1)) * w;
    const y = h - (arr[i] / 100) * h;
    if (i === 0) tctx.moveTo(x, y);
    else tctx.lineTo(x, y);
  }
  tctx.stroke();
}

function drawPulse(sig, bpmNow) {
  const w = pulse.width;
  const h = pulse.height;
  pctx.clearRect(0, 0, w, h);

  pctx.strokeStyle = "rgba(0,209,255,0.95)";
  pctx.lineWidth = 2;

  const window = sig.slice(-Math.min(sig.length, 240));
  if (window.length > 8) {
    const mn = Math.min(...window);
    const mx = Math.max(...window);
    pctx.beginPath();
    for (let i = 0; i < window.length; i++) {
      const x = (i / (window.length - 1)) * w;
      const v = (window[i] - mn) / (mx - mn + 1e-9);
      const y = h - v * h;
      if (i === 0) pctx.moveTo(x, y);
      else pctx.lineTo(x, y);
    }
    pctx.stroke();
  }

  pctx.fillStyle = "rgba(255,255,255,0.9)";
  pctx.font = "800 12px Inter, system-ui, Arial";
  pctx.fillText(`BPM: ${bpmNow ?? "—"}`, 10, 16);
}

/* Utils */
function mean(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
function std(a) {
  const m = mean(a);
  const v = a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length;
  return Math.sqrt(v);
}
function median(a) {
  if (!a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const i = Math.floor(b.length / 2);
  return b.length % 2 ? b[i] : (b[i - 1] + b[i]) / 2;
}
function clamp(a, b, v) { return Math.max(a, Math.min(b, v)); }
function clamp01(v) { return clamp(0, 1, v); }
function lerp(a, b, t) { return a + (b - a) * t; }

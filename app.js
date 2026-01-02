import { initCompass3D, updateCompass3D } from "/compas3d-v2.js";


// Face API iš CDN
const faceapi = window.faceapi;

// UI elementai
const video = document.getElementById("cam");
const camStatus = document.getElementById("camStatus");
const analyzeBtn = document.getElementById("analyzeBtn");

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
let lastEmotion = { joy: 0.3, stress: 0.2, calm: 0.5 };

const history = [];

/* ---------------------------------------------------------
   CAMERA
--------------------------------------------------------- */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    camStatus.textContent = "Camera active — analyzing field…";
  } catch (err) {
    camStatus.textContent = "Camera blocked — enable camera";
    console.error("Camera error:", err);
  }
}

/* ---------------------------------------------------------
   FACE API LOOP
--------------------------------------------------------- */
async function loop() {
  requestAnimationFrame(loop);
  if (!modelsReady || !video.videoWidth) return;

  const det = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!det?.expressions) return;

  const ex = det.expressions;

  const joy = ex.happy + 0.3 * ex.surprised;
  const stress = ex.angry + ex.fearful + 0.5 * ex.disgusted + 0.3 * ex.sad;
  const calm = ex.neutral + 0.2 * (1 - (joy + stress));

  const total = joy + stress + calm || 1;

  lastEmotion = {
    joy: joy / total,
    stress: stress / total,
    calm: calm / total
  };

  const score = Math.round(
    (lastEmotion.calm * 0.5 +
      lastEmotion.joy * 0.4 -
      lastEmotion.stress * 0.3 +
      0.4) * 100
  );

  const energy = Math.max(lastEmotion.joy, lastEmotion.calm);
  const stressRisk = lastEmotion.stress;

  updateUI({
    score,
    energy,
    stress: stressRisk,
    stability: 1 - Math.abs(energy - stressRisk),
    intensity: (energy + stressRisk) / 2
  });
}

/* ---------------------------------------------------------
   UI UPDATE
--------------------------------------------------------- */
function updateUI(m) {
  scoreEl.textContent = `${m.score} / 100`;
  energyEl.textContent = `${m.energy.toFixed(2)} rising`;
  stressEl.textContent = `${m.stress.toFixed(2)} ${
    m.stress < 0.33 ? "low" : m.stress < 0.66 ? "medium" : "high"
  }`;

  stabilityEl.textContent = `${Math.round(
    (m.energy - m.stress) * 18
  )}° toward ${m.energy >= m.stress ? "Joy" : "Stress"}`;

  intensityEl.textContent =
    m.energy < 0.33 ? "Low" : m.energy < 0.66 ? "Medium" : "High";

  aiTextEl.textContent =
    m.score > 75
      ? "Your field looks coherent. Stay focused."
      : "Balanced but fluctuating. Reduce stimulation.";

  aiTagsEl.textContent =
    m.score > 75 ? "#focus #calm #momentum" : "#grounded #clarity #steady";

  updateCompass3D(m);
  pushHistory(m);
  drawTimeline();
  drawPulse(m);
}

/* ---------------------------------------------------------
   TIMELINE
--------------------------------------------------------- */
function pushHistory(m) {
  history.push({
    ts: Date.now(),
    score: m.score,
    energy: m.energy,
    stress: m.stress
  });
  if (history.length > 40) history.shift();
}

function drawTimeline() {
  if (!timelineCtx) return;
  const w = timelineCanvas.width;
  const h = timelineCanvas.height;

  timelineCtx.clearRect(0, 0, w, h);
  if (history.length < 2) return;

  timelineCtx.lineWidth = 2;

  // Score
  timelineCtx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * (w - 20) + 10;
    const y = h - 10 - (p.score / 100) * (h - 20);
    if (i === 0) timelineCtx.moveTo(x, y);
    else timelineCtx.lineTo(x, y);
  });
  timelineCtx.strokeStyle = "#ffffff";
  timelineCtx.stroke();

  // Energy
  timelineCtx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * (w - 20) + 10;
    const y = h - 10 - p.energy * (h - 20);
    if (i === 0) timelineCtx.moveTo(x, y);
    else timelineCtx.lineTo(x, y);
  });
  timelineCtx.strokeStyle = "#3abff8";
  timelineCtx.stroke();

  // Stress
  timelineCtx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * (w - 20) + 10;
    const y = h - 10 - p.stress * (h - 20);
    if (i === 0) timelineCtx.moveTo(x, y);
    else timelineCtx.lineTo(x, y);
  });
  timelineCtx.strokeStyle = "#f87171";
  timelineCtx.stroke();
}

/* ---------------------------------------------------------
   PULSE
--------------------------------------------------------- */
function drawPulse(m) {
  if (!pulseCtx) return;
  const w = pulseCanvas.width;
  const h = pulseCanvas.height;

  pulseCtx.clearRect(0, 0, w, h);

  const centerY = h / 2;
  const amp = 18 + m.intensity * 18;
  const freq = 0.04 + m.stress * 0.04;

  pulseCtx.beginPath();
  for (let x = 0; x < w; x++) {
    const t = x * freq;
    const y = centerY + Math.sin(t) * amp;
    if (x === 0) pulseCtx.moveTo(x, y);
    else pulseCtx.lineTo(x, y);
  }

  pulseCtx.strokeStyle = "#7b5cff";
  pulseCtx.lineWidth = 2;
  pulseCtx.stroke();
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
async function init() {
  camStatus.textContent = "Loading models…";

  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

  modelsReady = true;

  camStatus.textContent = "Starting camera…";
  await startCamera();

  initCompass3D();

  camStatus.textContent = "Running analysis…";
  requestAnimationFrame(loop);
}

init();

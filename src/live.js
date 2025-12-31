// /src/live.js

import { initCompass, updateCompass3D } from './compass3d.js';

// ---------- DOM ELEMENTAI ----------

const camEl = document.getElementById('cam');
const camStatus = document.getElementById('camStatus');
const userText = document.getElementById('userText');
const analyzeBtn = document.getElementById('analyzeBtn');

const aiTextEl = document.getElementById('aiText');
const aiTagsEl = document.getElementById('aiTags');

const scoreEl = document.getElementById('score');
const score2El = document.getElementById('score2');
const energyEl = document.getElementById('energy');
const stressEl = document.getElementById('stress');

const stabilityEl = document.getElementById('stability');
const intensityEl = document.getElementById('intensity');

const timelineCanvas = document.getElementById('timeline');
const pulseCanvas = document.getElementById('pulse');

// ---------- CAMERA ----------

async function initCamera() {
  if (!camEl || !camStatus) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 520, height: 360 },
      audio: false
    });
    camEl.srcObject = stream;
    camStatus.textContent = 'Camera active — reading your field…';
  } catch (err) {
    camStatus.textContent = 'Camera blocked — enable camera to see full model';
    console.error('Camera error:', err);
  }
}

function hasCamera() {
  return camEl && camEl.srcObject != null;
}

// ---------- EMOTION ENGINE ----------

function analyzeEmotion(text, cameraActive) {
  const t = (text || '').toLowerCase();

  let baseScore = 60;
  let energy = 0.5;
  let stress = 0.3;

  if (t.includes('tired') || t.includes('pavarg')) {
    energy -= 0.2;
    stress += 0.1;
    baseScore -= 5;
  }
  if (t.includes('anxious') || t.includes('nerim') || t.includes('stress')) {
    stress += 0.3;
    baseScore -= 10;
  }
  if (t.includes('happy') || t.includes('good') || t.includes('grateful') || t.includes('dėking')) {
    energy += 0.2;
    baseScore += 10;
  }
  if (t.includes('angry') || t.includes('supyk') || t.includes('frustrated')) {
    stress += 0.25;
    baseScore -= 8;
  }

  if (cameraActive) {
    baseScore += 3;
    energy += 0.05;
  }

  energy = Math.min(Math.max(energy, 0), 1);
  stress = Math.min(Math.max(stress, 0), 1);
  baseScore = Math.min(Math.max(Math.round(baseScore), 0), 100);

  const stability = 1 - Math.abs(energy - stress);
  const intensity = (energy + stress) / 2;

  let interpretation = 'Your emotional field is in a balanced, focused state.';
  if (energy < 0.35 && stress < 0.4) {
    interpretation = 'You seem low on energy but relatively calm. Good moment to rest and recharge.';
  } else if (energy > 0.65 && stress < 0.4) {
    interpretation = 'You feel energized and relatively stable. A good window for deep work or creativity.';
  } else if (stress > 0.6) {
    interpretation = 'Your field shows elevated stress. It might help to slow down and ground yourself.';
  }

  const tags = [];
  if (energy < 0.4) tags.push('Low energy');
  if (energy > 0.6) tags.push('High energy');
  if (stress > 0.6) tags.push('High stress');
  if (stability > 0.6) tags.push('Stable field');
  if (cameraActive) tags.push('Camera signal active');

  return {
    score: baseScore,
    energy,
    stress,
    stability,
    intensity,
    interpretation,
    tags
  };
}

// ---------- TIMELINE & PULSE ----------

const timelineCtx = timelineCanvas?.getContext('2d');
const pulseCtx = pulseCanvas?.getContext('2d');
const history = [];

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
  timelineCtx.strokeStyle = '#ffffff';
  timelineCtx.stroke();

  // Energy
  timelineCtx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * (w - 20) + 10;
    const y = h - 10 - p.energy * (h - 20);
    if (i === 0) timelineCtx.moveTo(x, y);
    else timelineCtx.lineTo(x, y);
  });
  timelineCtx.strokeStyle = '#22d3ee';
  timelineCtx.stroke();

  // Stress
  timelineCtx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * (w - 20) + 10;
    const y = h - 10 - p.stress * (h - 20);
    if (i === 0) timelineCtx.moveTo(x, y);
    else timelineCtx.lineTo(x, y);
  });
  timelineCtx.strokeStyle = '#ef4444';
  timelineCtx.stroke();
}

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
  pulseCtx.strokeStyle = '#4f46e5';
  pulseCtx.lineWidth = 2;
  pulseCtx.stroke();
}

// ---------- UI UPDATE ----------

function updateUI(m) {
  scoreEl.textContent = m.score;
  score2El.textContent = m.score;
  energyEl.textContent = Math.round(m.energy * 100) + '%';
  stressEl.textContent = Math.round(m.stress * 100) + '%';

  stabilityEl.textContent = Math.round(m.stability * 100) + '%';
  intensityEl.textContent = Math.round(m.intensity * 100) + '%';

  aiTextEl.textContent = m.interpretation;

  aiTagsEl.innerHTML = '';
  m.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'aiTag';
    span.textContent = tag;
    aiTagsEl.appendChild(span);
  });

  updateCompass3D(m);

  pushHistory(m);
  drawTimeline();
  drawPulse(m);
}

// ---------- ANALYZE BUTTON ----------

analyzeBtn.addEventListener('click', () => {
  const text = userText.value;
  const metrics = analyzeEmotion(text, hasCamera());
  updateUI(metrics);
});

// ---------- INIT ----------

initCamera();
initCompass(); // ← LABAI SVARBU
drawTimeline();
drawPulse({
  score: 50,
  energy: 0.5,
  stress: 0.3,
  stability: 0.7,
  intensity: 0.4
});

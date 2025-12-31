// /src/live.js

import * as THREE from 'three';

const camEl = document.getElementById('cam');
const camStatus = document.getElementById('camStatus');
const userText = document.getElementById('userText');
const analyzeBtn = document.getElementById('analyzeBtn');
const soundBtn = document.getElementById('soundBtn');
const tryLiveBtn = document.getElementById('tryLive');

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
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 520, height: 360 },
      audio: false
    });
    camEl.srcObject = stream;
    camStatus.textContent = 'Camera active — reading your field…';
    camStatus.classList.add('camStatusActive');
  } catch (err) {
    camStatus.textContent = 'Camera blocked — enable camera to see full model';
    camStatus.classList.add('camStatusError');
    console.error('Camera error:', err);
  }
}

// ---------- 3D COSMIC COMPASS ----------

function initCosmicCompass() {
  const canvas = document.getElementById('auraCanvas');
  const width = canvas.width;
  const height = canvas.height;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617); // deep space

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const light = new THREE.PointLight(0xffffff, 1.3);
  light.position.set(4, 6, 8);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starCount = 400;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.04,
    transparent: true,
    opacity: 0.8
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Compass core
  const coreGeo = new THREE.SphereGeometry(1.1, 48, 48);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x4f46e5,
    emissive: 0x4f46e5,
    emissiveIntensity: 0.6,
    metalness: 0.5,
    roughness: 0.2
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Needle (emotional direction)
  const needleGeo = new THREE.ConeGeometry(0.18, 1.6, 32);
  const needleMat = new THREE.MeshStandardMaterial({
    color: 0xff4b8b,
    emissive: 0xff4b8b,
    emissiveIntensity: 0.7,
    metalness: 0.4,
    roughness: 0.3
  });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.y = 1.2;
  needle.rotation.x = Math.PI;
  scene.add(needle);

  // Rings
  function makeRing(inner, outer, tiltX, tiltY, color) {
    const geo = new THREE.RingGeometry(inner, outer, 96);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = tiltX;
    ring.rotation.y = tiltY;
    scene.add(ring);
    return ring;
  }

  const ringOuter = makeRing(2.2, 2.8, Math.PI / 3, 0.2, 0x22d3ee);
  const ringInner = makeRing(1.6, 2.0, -Math.PI / 4, -0.3, 0xa855f7);

  let lastMetrics = {
    energy: 0.5,
    stress: 0.3,
    score: 50
  };

  function updateFromMetrics(m) {
    lastMetrics = m;

    // Color blend based on emotion
    const calm = new THREE.Color(0x22d3ee);
    const active = new THREE.Color(0x22c55e);
    const stressed = new THREE.Color(0xef4444);

    const energyMix = calm.clone().lerp(active, m.energy);
    const stressMix = energyMix.clone().lerp(stressed, m.stress);

    core.material.color.copy(stressMix);
    core.material.emissive.copy(stressMix.clone().multiplyScalar(0.7));

    ringOuter.material.color.copy(energyMix);
    ringInner.material.color.copy(stressMix);

    // Needle tilt: more stress → labiau pakrypęs
    const tilt = (m.stress - 0.5) * 0.8;
    needle.rotation.z = tilt;
  }

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;

    stars.rotation.y += 0.0008;
    stars.rotation.x += 0.0003;

    core.rotation.y += 0.004 + lastMetrics.energy * 0.01;
    core.rotation.x += 0.002;

    ringOuter.rotation.z += 0.002 + lastMetrics.energy * 0.004;
    ringInner.rotation.z -= 0.0015 + lastMetrics.stress * 0.003;

    needle.rotation.y += 0.003;

    renderer.render(scene, camera);
  }

  animate();

  return updateFromMetrics;
}

const updateCompassFromMetrics = initCosmicCompass();

// ---------- EMOTION ENGINE (pseudo) ----------

function analyzeEmotion(text, hasCamera) {
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

  if (hasCamera) {
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
  if (hasCamera) tags.push('Camera signal active');

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

const timelineCtx = timelineCanvas.getContext('2d');
const pulseCtx = pulseCanvas.getContext('2d');
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

// ---------- UI & SOUND ----------

let soundOn = true;

soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  soundBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
});

tryLiveBtn.addEventListener('click', () => {
  userText.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function speak(text) {
  if (!soundOn) return;
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function hasCamera() {
  return camEl && camEl.srcObject != null;
}

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

  updateCompassFromMetrics({
    score: m.score,
    energy: m.energy,
    stress: m.stress
  });

  pushHistory(m);
  drawTimeline();
  drawPulse(m);

  speak(m.interpretation);
}

analyzeBtn.addEventListener('click', () => {
  const text = userTextEl.value;
  const metrics = analyzeEmotion(text);
  updateUI(metrics);
  updateCompass3D(metrics); // ← PRIDĖTA
});


// ---------- INIT ----------

initCamera();
drawTimeline();
drawPulse({
  score: 50,
  energy: 0.5,
  stress: 0.3,
  stability: 0.7,
  intensity: 0.4
});

// ===============================
// 3D COMPASS — BLOCK 5.1
// SCENE + CAMERA + RENDERER SETUP
// ===============================

import * as THREE from 'three';

let scene, camera, renderer;
let canvas;

export function initCompass3D() {
  canvas = document.getElementById('compass3d');

  if (!canvas) {
    console.error("Canvas #compass3d not found");
    return;
  }

  // Scene
  scene = new THREE.Scene();
  scene.background = null;

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3.2);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  window.addEventListener('resize', resizeCompass3D);

  animateCompass3D();
}

function resizeCompass3D() {
  if (!canvas) return;

  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

function animateCompass3D() {
  requestAnimationFrame(animateCompass3D);

  // čia vėliau įdėsime orbitų, sferos ir taškų animacijas

  renderer.render(scene, camera);
}

// ===============================
// CONNECT LIVE.JS → 3D COMPASS
// ===============================

import { updateCompassNodes, updateCompassGlow } from './compass3d.js';

function updateCompass3D(metrics) {
  if (!metrics) return;

  // Mazgų orbitos pagal energiją / stresą
  updateCompassNodes({
    energy: metrics.energy,
    stress: metrics.stress
  });

  // Glow spalva pagal emocinį toną
  updateCompassGlow(metrics);
}

import { updateCompassDirection } from './compass3d.js';

function updateCompass3D(metrics) {
  if (!metrics) return;

  updateCompassNodes({
    energy: metrics.energy,
    stress: metrics.stress
  });

  updateCompassGlow(metrics);

  updateCompassDirection({
    energy: metrics.energy,
    stress: metrics.stress
  });
}

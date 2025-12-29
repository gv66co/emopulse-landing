// ===== GLOBAL STATE =====================================================
const state = {
  running: false,
  currentEmotion: 'Calm',
  intensity: 0.3,
  valence: 0.6,  // 0 negative, 1 positive
  arousal: 0.4,  // 0 low, 1 high
  score: 78,
  stressRisk: 18,
  history: [],
  trend: [],
  challengeActive: false,
  challengeStart: null,
  speechRecognition: null,
  recognizing: false
};

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ===== DOM REFERENCES (AFTER LOAD) ======================================
let emotionLabelEl,
  emotionIntensityEl,
  emotionHistoryEl,
  emotionOutputEl,
  emotionRadarCanvas,
  radarCtx,
  moodMapDot,
  emopulseScoreValue,
  emopulseScoreBarFill,
  stressRiskValue,
  stressRiskLabel,
  miniEmotionValue,
  miniValence,
  confidenceValue,
  patternStability,
  pulseValue,
  pulseQuality,
  emotionalWeatherMain,
  emotionalWeatherTag,
  emotionalSignatureText,
  heroAura,
  emotionalAura,
  ringCalm,
  ringFocus,
  ringStress,
  ringJoy,
  storyLine1,
  storyLine2,
  storyLine3,
  peakCalmEl,
  focusDurationEl,
  stressRecoveryEl,
  compassHeading,
  sessionTags,
  compassTags,
  aiReflectionLine1,
  aiReflectionLine2,
  aiCoachOutput,
  driftValueEl,
  driftCaptionEl,
  driftSpiralEl,
  emotionTrendCanvas,
  trendCtx,
  startLiveButton,
  askNatashaButton,
  aiCoachButton,
  cameraVideo,
  challengeButton;

// ===== EMOTION UPDATE / SIMULATION ======================================

function applyScenario(scenario) {
  if (scenario === 'smile') {
    state.currentEmotion = 'Joy';
    state.valence = 0.9;
    state.arousal = 0.5;
    state.intensity = 0.7;
  } else if (scenario === 'neutral') {
    state.currentEmotion = 'Neutral';
    state.valence = 0.5;
    state.arousal = 0.4;
    state.intensity = 0.3;
  } else if (scenario === 'stress') {
    state.currentEmotion = 'Stress';
    state.valence = 0.3;
    state.arousal = 0.7;
    state.intensity = 0.8;
  } else if (scenario === 'high-stress') {
    state.currentEmotion = 'Stress';
    state.valence = 0.2;
    state.arousal = 0.9;
    state.intensity = 0.95;
  } else if (scenario === 'calm') {
    state.currentEmotion = 'Calm';
    state.valence = 0.7;
    state.arousal = 0.3;
    state.intensity = 0.5;
  } else if (scenario === 'focus') {
    state.currentEmotion = 'Focus';
    state.valence = 0.8;
    state.arousal = 0.6;
    state.intensity = 0.6;
  }
  pushHistory('scenario:' + scenario);
  refreshUI();
}

function pushHistory(source) {
  const entry = {
    emotion: state.currentEmotion,
    intensity: state.intensity,
    valence: state.valence,
    arousal: state.arousal,
    time: new Date(),
    source
  };
  state.history.unshift(entry);
  if (state.history.length > 10) state.history.pop();
  state.trend.push(entry.intensity);
  if (state.trend.length > 40) state.trend.shift();
}

function simulateStep() {
  if (!state.running) return;

  const deltaVal = (Math.random() - 0.5) * 0.05;
  const deltaAro = (Math.random() - 0.5) * 0.05;
  const deltaInt = (Math.random() - 0.5) * 0.08;

  state.valence = clamp(state.valence + deltaVal, 0, 1);
  state.arousal = clamp(state.arousal + deltaAro, 0, 1);
  state.intensity = clamp(state.intensity + deltaInt, 0, 1);

  if (state.valence > 0.7 && state.arousal < 0.5) {
    state.currentEmotion = 'Calm';
  } else if (state.valence > 0.7 && state.arousal >= 0.5) {
    state.currentEmotion = 'Joy';
  } else if (state.valence > 0.5 && state.arousal >= 0.5) {
    state.currentEmotion = 'Focus';
  } else if (state.valence < 0.4 && state.arousal >= 0.6) {
    state.currentEmotion = 'Stress';
  } else {
    state.currentEmotion = 'Neutral';
  }

  const calmFactor = state.currentEmotion === 'Calm' || state.currentEmotion === 'Joy' ? 1 : 0;
  const stressFactor = state.currentEmotion === 'Stress' ? 1 : 0;
  state.score = clamp(state.score + (calmFactor * 2 - stressFactor * 3), 40, 98);
  state.stressRisk = clamp(state.stressRisk + (stressFactor * 4 - calmFactor * 2), 5, 90);

  pushHistory('live');
  refreshUI();
}

// ===== UI BIND ==========================================================

function refreshUI() {
  if (!emotionLabelEl) return; // in case called before init

  emotionLabelEl.textContent = state.currentEmotion;
  emotionIntensityEl.textContent = 'Intensity: ' + Math.round(state.intensity * 100) + '%';
  emotionOutputEl.textContent =
    'Current: ' + state.currentEmotion +
    ' · valence ' + state.valence.toFixed(2) +
    ' · arousal ' + state.arousal.toFixed(2);

  emotionHistoryEl.innerHTML = '';
  state.history.forEach((h) => {
    const li = document.createElement('li');
    li.textContent = `${h.emotion} · ${Math.round(h.intensity * 100)}% (${h.source})`;
    emotionHistoryEl.appendChild(li);
  });

  moodMapDot.style.left = (state.valence * 100) + '%';
  moodMapDot.style.top = ((1 - state.arousal) * 100) + '%';

  emopulseScoreValue.textContent = Math.round(state.score) + ' / 100';
  emopulseScoreBarFill.style.width = Math.round(state.score) + '%';

  stressRiskValue.textContent = Math.round(state.stressRisk) + ' / 100';
  if (state.stressRisk < 30) {
    stressRiskLabel.textContent = 'Low & contained';
  } else if (state.stressRisk < 60) {
    stressRiskLabel.textContent = 'Moderate – watch patterns';
  } else {
    stressRiskLabel.textContent = 'Elevated – consider recovery';
  }

  miniEmotionValue.textContent = state.currentEmotion;
  miniValence.textContent =
    'Valence: ' + (state.valence > 0.6 ? 'positive' : state.valence < 0.4 ? 'negative' : 'balanced');
  confidenceValue.textContent = Math.round((0.7 + state.intensity * 0.3) * 100) + '%';
  patternStability.textContent = state.intensity < 0.5 ? 'Stable pattern' : 'Dynamic but coherent';

  const basePulse = 68;
  const pulse = basePulse + Math.round((state.arousal - 0.4) * 40);
  pulseValue.textContent = clamp(pulse, 52, 110) + ' bpm';
  pulseQuality.textContent = 'Signal quality: high';

  if (state.currentEmotion === 'Calm') {
    emotionalWeatherMain.textContent = 'Clear with a chance of focus';
    emotionalWeatherTag.textContent = 'short-term outlook: low stress, rising clarity';
    emotionalSignatureText.textContent = 'Today’s emotional signature: Calm Focused Energy';
  } else if (state.currentEmotion === 'Stress') {
    emotionalWeatherMain.textContent = 'Storm pockets with recovery gaps';
    emotionalWeatherTag.textContent = 'short-term outlook: elevated stress, prioritize grounding';
    emotionalSignatureText.textContent = 'Today’s emotional signature: Stress with recovery windows';
  } else if (state.currentEmotion === 'Focus') {
    emotionalWeatherMain.textContent = 'Focused skies, low distraction winds';
    emotionalWeatherTag.textContent = 'short-term outlook: high clarity, moderate tension';
    emotionalSignatureText.textContent = 'Today’s emotional signature: Deep Focused Flow';
  } else if (state.currentEmotion === 'Joy') {
    emotionalWeatherMain.textContent = 'Warm with bursts of joy';
    emotionalWeatherTag.textContent = 'short-term outlook: high energy, stable mood';
    emotionalSignatureText.textContent = 'Today’s emotional signature: Uplifted Joyful Presence';
  } else {
    emotionalWeatherMain.textContent = 'Mixed patterns, stabilising';
    emotionalWeatherTag.textContent = 'short-term outlook: evolving, watch for stress/calm swings';
    emotionalSignatureText.textContent = 'Today’s emotional signature: Transitional Emotional State';
  }

  [heroAura, emotionalAura].forEach((el) => {
    if (!el) return;
    el.classList.remove('calm', 'focus', 'stress', 'joy', 'neutral');
    const cls = state.currentEmotion.toLowerCase();
    el.classList.add(
      cls.includes('focus') ? 'focus' :
      cls.includes('stress') ? 'stress' :
      cls.includes('joy') ? 'joy' :
      cls.includes('calm') ? 'calm' : 'neutral'
    );
  });

  ringCalm.style.opacity = state.currentEmotion === 'Calm' ? 1 : 0.4;
  ringFocus.style.opacity = state.currentEmotion === 'Focus' ? 1 : 0.4;
  ringStress.style.opacity = state.currentEmotion === 'Stress' ? 1 : 0.4;
  ringJoy.style.opacity = state.currentEmotion === 'Joy' ? 1 : 0.4;

  const drift = (state.valence - 0.5) * 40 - (state.stressRisk - 20) * 0.15;
  driftValueEl.textContent = (drift >= 0 ? '+' : '') + drift.toFixed(1) + '%';
  driftCaptionEl.textContent =
    drift > 5 ? 'Calmness increasing' :
    drift < -5 ? 'Stress pressure building' :
    'Subtle micro-shifts detected';
  driftSpiralEl.classList.toggle('strong', Math.abs(drift) > 10);

  storyLine1.textContent =
    state.currentEmotion === 'Stress'
      ? 'Your emotional journey shows stress pockets emerging.'
      : 'Your emotional journey is anchored in calmness.';
  storyLine2.textContent =
    state.currentEmotion === 'Focus'
      ? 'You are entering a focused, task-ready state.'
      : 'You maintain capacity for clarity and adjustment.';
  storyLine3.textContent =
    state.stressRisk > 50
      ? 'Stress spikes are visible – recovery rituals would help now.'
      : 'Any stress spikes resolve quickly – resilience is present.';

  peakCalmEl.textContent = Math.round(60 + state.valence * 40) + '%';
  focusDurationEl.textContent = Math.round(5 + state.intensity * 20) + ' min';
  stressRecoveryEl.textContent =
    state.stressRisk < 30 ? 'Fast' : state.stressRisk < 60 ? 'Moderate' : 'Slower – needs support';

  compassHeading.textContent =
    `Current heading: ${state.currentEmotion.toLowerCase()} · valence ${state.valence.toFixed(2)}, arousal ${state.arousal.toFixed(2)}.`;

  aiReflectionLine1.textContent =
    state.stressRisk < 40
      ? '“Your system shows solid emotional resilience today.”'
      : '“Your system is carrying higher stress load than usual.”';
  aiReflectionLine2.textContent =
    state.currentEmotion === 'Stress'
      ? '“Micro-pauses and grounding could shift your curve.”'
      : '“You’re adapting effectively to fluctuations.”';

  drawRadar();
  drawTrend();
}

// ===== RADAR DRAW =======================================================
function drawRadar() {
  const ctx = radarCtx;
  const w = emotionRadarCanvas.width;
  const h = emotionRadarCanvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const maxR = Math.min(w, h) / 2 - 10;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (maxR * i) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(centerX - maxR, centerY);
  ctx.lineTo(centerX + maxR, centerY);
  ctx.moveTo(centerX, centerY - maxR);
  ctx.lineTo(centerX, centerY + maxR);
  ctx.stroke();

  const angle = (1 - state.arousal) * Math.PI;
  const radius = state.intensity * maxR;
  const x = centerX + Math.cos(angle) * radius * (state.valence * 0.8 + 0.2);
  const y = centerY + Math.sin(angle) * radius;

  ctx.fillStyle = 'rgba(104, 219, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

// ===== TREND DRAW =======================================================
function drawTrend() {
  const ctx = trendCtx;
  const w = emotionTrendCanvas.width;
  const h = emotionTrendCanvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  if (state.trend.length < 2) return;

  ctx.strokeStyle = 'rgba(120, 200, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const step = w / Math.max(state.trend.length - 1, 1);

  state.trend.forEach((val, i) => {
    const x = i * step;
    const y = h - val * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// ===== CAMERA SETUP =====================================================
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    emotionOutputEl.textContent = 'Camera not supported – live scan in simulation mode.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cameraVideo.srcObject = stream;
  } catch (err) {
    console.warn('Camera access denied or failed', err);
    emotionOutputEl.textContent = 'Camera unavailable – live scan running in simulation mode.';
  }
}

// ===== VOICE RECOGNITION ===============================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (aiCoachOutput) {
      aiCoachOutput.textContent = 'Voice recognition not supported in this browser.';
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    state.recognizing = true;
    if (aiCoachOutput) aiCoachOutput.textContent = 'Listening...';
  };

  recognition.onerror = (e) => {
    state.recognizing = false;
    if (aiCoachOutput) aiCoachOutput.textContent = 'Recognition error: ' + e.error;
  };

  recognition.onend = () => {
    state.recognizing = false;
    if (aiCoachOutput && aiCoachOutput.textContent === 'Listening...') {
      aiCoachOutput.textContent = 'No voice captured.';
    }
  };

  recognition.onresult = (event) => {
    state.recognizing = false;
    const transcript = event.results[0][0].transcript;
    const lower = transcript.toLowerCase();
    if (!aiCoachOutput) return;

    aiCoachOutput.textContent = 'You said: "' + transcript + '". ';

    let suggestion = '';
    if (lower.includes('stress') || lower.includes('overwhelmed')) {
      suggestion = 'Take 60 seconds for slow breathing and one small, concrete next action.';
    } else if (lower.includes('tired') || lower.includes('fatigue')) {
      suggestion = 'Short pause, hydration, and gentle movement will help reset your system.';
    } else if (lower.includes('focus') || lower.includes('work')) {
      suggestion = 'Pick one important task, set a 20-minute focus block, and silence all other inputs.';
    } else {
      suggestion = 'Name how you feel in one word, then choose one tiny action that supports that state.';
    }
    aiCoachOutput.textContent += 'Natasha suggests: ' + suggestion;
  };

  state.speechRecognition = recognition;
}

function startListening() {
  if (!state.speechRecognition) {
    initSpeechRecognition();
  }
  if (!state.speechRecognition) return;
  if (state.recognizing) return;
  state.speechRecognition.start();
}

// ===== CHALLENGE ========================================================
function startChallenge() {
  if (state.challengeActive) return;
  state.challengeActive = true;
  state.challengeStart = Date.now();
  challengeButton.textContent = 'Challenge running...';
  challengeButton.disabled = true;
  challengeButton.classList.add('active');

  const duration = 60 * 1000;
  setTimeout(() => {
    state.challengeActive = false;
    const keptCalm = state.currentEmotion === 'Calm' || state.currentEmotion === 'Focus';
    challengeButton.textContent = keptCalm ? 'Calm maintained ✔' : 'Try again';
    challengeButton.disabled = false;
    challengeButton.classList.remove('active');
  }, duration);
}

// ===== INTERVALS & INIT ================================================
function startLive() {
  if (state.running) return;
  state.running = true;
  startCamera();
  setInterval(simulateStep, 2000);
  refreshUI();
}

function handleScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal-on-scroll, .section-stagger');
  const triggerBottom = window.innerHeight * 0.9;
  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < triggerBottom) {
      el.classList.add('revealed');
    }
  });
}

// ===== DOMContentLoaded =================================================
window.addEventListener('DOMContentLoaded', () => {
  // grab DOM elements
  emotionLabelEl = document.getElementById('emotionLabel');
  emotionIntensityEl = document.getElementById('emotionIntensity');
  emotionHistoryEl = document.getElementById('emotionHistory');
  emotionOutputEl = document.getElementById('emotionOutput');
  emotionRadarCanvas = document.getElementById('emotionRadar');
  radarCtx = emotionRadarCanvas.getContext('2d');

  moodMapDot = document.getElementById('moodMapDot');
  emopulseScoreValue = document.getElementById('emopulseScoreValue');
  emopulseScoreBarFill = document.getElementById('emopulseScoreBarFill');

  stressRiskValue = document.getElementById('stressRiskValue');
  stressRiskLabel = document.getElementById('stressRiskLabel');

  miniEmotionValue = document.getElementById('miniEmotionValue');
  miniValence = document.getElementById('miniValence');
  confidenceValue = document.getElementById('confidenceValue');
  patternStability = document.getElementById('patternStability');
  pulseValue = document.getElementById('pulseValue');
  pulseQuality = document.getElementById('pulseQuality');

  emotionalWeatherMain = document.getElementById('emotionalWeatherMain');
  emotionalWeatherTag = document.getElementById('emotionalWeatherTag');
  emotionalSignatureText = document.getElementById('emotionalSignatureText');

  heroAura = document.getElementById('heroAura');
  emotionalAura = document.getElementById('emotionalAura');
  ringCalm = document.getElementById('ringCalm');
  ringFocus = document.getElementById('ringFocus');
  ringStress = document.getElementById('ringStress');
  ringJoy = document.getElementById('ringJoy');

  storyLine1 = document.getElementById('storyLine1');
  storyLine2 = document.getElementById('storyLine2');
  storyLine3 = document.getElementById('storyLine3');

  peakCalmEl = document.getElementById('peakCalm');
  focusDurationEl = document.getElementById('focusDuration');
  stressRecoveryEl = document.getElementById('stressRecovery');

  compassHeading = document.getElementById('compassHeading');
  sessionTags = document.getElementById('sessionTags');
  compassTags = document.getElementById('compassTags');

  aiReflectionLine1 = document.getElementById('aiReflectionLine1');
  aiReflectionLine2 = document.getElementById('aiReflectionLine2');
  aiCoachOutput = document.getElementById('aiCoachOutput');

  driftValueEl = document.getElementById('driftValue');
  driftCaptionEl = document.getElementById('driftCaption');
  driftSpiralEl = document.getElementById('driftSpiral');

  emotionTrendCanvas = document.getElementById('emotionTrend');
  trendCtx = emotionTrendCanvas.getContext('2d');

  startLiveButton = document.getElementById('startLiveButton');
  askNatashaButton = document.getElementById('askNatashaButton');
  aiCoachButton = document.getElementById('aiCoachButton');
  cameraVideo = document.getElementById('camera');
  challengeButton = document.getElementById('challengeButton');

  // bind handlers
  document
    .querySelectorAll('.scenario-button[data-scenario]')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        applyScenario(btn.getAttribute('data-scenario'));
      });
    });

  if (startLiveButton) {
    startLiveButton.addEventListener('click', () => {
      startLive();
      startLiveButton.textContent = 'Live scan running';
      startLiveButton.disabled = true;
    });
  }

  if (askNatashaButton) askNatashaButton.addEventListener('click', startListening);
  if (aiCoachButton) aiCoachButton.addEventListener('click', startListening);
  if (challengeButton) challengeButton.addEventListener('click', startChallenge);

  initSpeechRecognition();
  refreshUI();
  handleScrollReveal();
});

window.addEventListener('scroll', handleScrollReveal);

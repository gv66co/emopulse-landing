// =======================
// Emopulse Frontend Logic
// =======================

// Helper: clamp number
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// -----------------------
// DOM references
// -----------------------

// Hero metrics
const emopulseScoreValueEl = document.getElementById('emopulseScoreValue');
const emopulseScoreBarFillEl = document.getElementById('emopulseScoreBarFill');
const emotionalWeatherMainEl = document.getElementById('emotionalWeatherMain');
const emotionalWeatherTagEl = document.getElementById('emotionalWeatherTag');
const emotionalWeatherIconEl = document.getElementById('emotionalWeatherIcon');

// Mini dashboard
const pulseValueEl = document.getElementById('pulseValue');
const pulseQualityEl = document.getElementById('pulseQuality');
const miniEmotionValueEl = document.getElementById('miniEmotionValue');
const miniValenceEl = document.getElementById('miniValence');
const confidenceValueEl = document.getElementById('confidenceValue');
const patternStabilityEl = document.getElementById('patternStability');
const stressRiskValueEl = document.getElementById('stressRiskValue');
const stressRiskLabelEl = document.getElementById('stressRiskLabel');

// Mood map + timeline
const moodMapDotEl = document.getElementById('moodMapDot');
const emotionTimelineProgressEl = document.getElementById('emotionTimelineProgress');
const timelineDot1El = document.getElementById('timelineDot1');
const timelineDot2El = document.getElementById('timelineDot2');
const timelineDot3El = document.getElementById('timelineDot3');
const timelineDot4El = document.getElementById('timelineDot4');

// Rings
const ringCalmEl = document.getElementById('ringCalm');
const ringFocusEl = document.getElementById('ringFocus');
const ringStressEl = document.getElementById('ringStress');
const ringJoyEl = document.getElementById('ringJoy');

// Experience layer
const storyLine1El = document.getElementById('storyLine1');
const storyLine2El = document.getElementById('storyLine2');
const storyLine3El = document.getElementById('storyLine3');
const challengeTextEl = document.getElementById('challengeText');
const challengeButtonEl = document.getElementById('challengeButton');
const calmStreakEl = document.getElementById('calmStreak');
const focusStreakEl = document.getElementById('focusStreak');
const badgeCalmEl = document.getElementById('badgeCalm');
const badgeFocusEl = document.getElementById('badgeFocus');
const badgeStressEl = document.getElementById('badgeStress');

// AI reflection
const aiReflectionLine1El = document.getElementById('aiReflectionLine1');
const aiReflectionLine2El = document.getElementById('aiReflectionLine2');
const aiCoachButtonEl = document.getElementById('aiCoachButton');

// Compass + tags + report
const compassTagsEl = document.getElementById('compassTags');
const compassHeadingEl = document.getElementById('compassHeading');
const sessionTagsEl = document.getElementById('sessionTags');
const peakCalmEl = document.getElementById('peakCalm');
const focusDurationEl = document.getElementById('focusDuration');
const stressRecoveryEl = document.getElementById('stressRecovery');

// Visual layer
const emotionalAuraEl = document.getElementById('emotionalAura');
const emotionDnaEl = document.getElementById('emotionDna');
const emotionTrailEl = document.getElementById('emotionTrail');

// Live emotion scan
const cameraEl = document.getElementById('camera');
const emotionLabelEl = document.getElementById('emotionLabel');
const emotionIntensityEl = document.getElementById('emotionIntensity');
const emotionHistoryTitleEl = document.getElementById('emotionHistoryTitle');
const emotionHistoryEl = document.getElementById('emotionHistory');
const emotionRadarCanvas = document.getElementById('emotionRadar');
const emotionOutputEl = document.getElementById('emotionOutput');

// Scenario buttons
const scenarioButtons = document.querySelectorAll('.scenario-button');

// -----------------------
// State
// -----------------------

const state = {
  emotion: 'Calm',
  valence: 'positive',
  arousal: 0.4,          // 0–1
  score: 78,
  pulse: 74,
  confidence: 0.91,
  stressRisk: 18,        // 0–100
  drift: 12,             // +/-
  moodDot: { x: 0.65, y: 0.42 }, // 0–1
  history: [],
  challengeActive: false,
  challengeStart: null,
  challengeTargetSeconds: 60,
  peakCalm: 82,
  focusMinutes: 14,
  stressRecovery: 'Fast'
};

// -----------------------
// Demo data helpers
// -----------------------

function setEmotion(emotionKey) {
  const presets = {
    smile: {
      emotion: 'Joy',
      valence: 'positive',
      arousal: 0.6,
      score: 84,
      pulse: 78,
      confidence: 0.94,
      stressRisk: 12,
      drift: 15,
      moodDot: { x: 0.75, y: 0.35 }
    },
    neutral: {
      emotion: 'Calm',
      valence: 'neutral',
      arousal: 0.45,
      score: 76,
      pulse: 72,
      confidence: 0.9,
      stressRisk: 20,
      drift: 8,
      moodDot: { x: 0.6, y: 0.5 }
    },
    stress: {
      emotion: 'Stress',
      valence: 'negative',
      arousal: 0.8,
      score: 62,
      pulse: 92,
      confidence: 0.82,
      stressRisk: 58,
      drift: -18,
      moodDot: { x: 0.35, y: 0.2 }
    },
    highStress: {
      emotion: 'High stress',
      valence: 'negative',
      arousal: 0.9,
      score: 54,
      pulse: 102,
      confidence: 0.78,
      stressRisk: 78,
      drift: -32,
      moodDot: { x: 0.25, y: 0.15 }
    },
    calm: {
      emotion: 'Calm',
      valence: 'positive',
      arousal: 0.35,
      score: 82,
      pulse: 70,
      confidence: 0.93,
      stressRisk: 14,
      drift: 18,
      moodDot: { x: 0.7, y: 0.6 }
    },
    focus: {
      emotion: 'Focus',
      valence: 'positive',
      arousal: 0.6,
      score: 86,
      pulse: 80,
      confidence: 0.95,
      stressRisk: 22,
      drift: 20,
      moodDot: { x: 0.8, y: 0.4 }
    }
  };

  const preset = presets[emotionKey];
  if (!preset) return;

  Object.assign(state, preset);
  pushHistory(state.emotion);
  renderAll();
}

function pushHistory(label) {
  state.history.unshift({
    label,
    timestamp: new Date()
  });
  state.history = state.history.slice(0, 10);
}

// -----------------------
// Rendering
// -----------------------

function renderScore() {
  if (!emopulseScoreValueEl || !emopulseScoreBarFillEl) return;

  emopulseScoreValueEl.textContent = `${state.score} / 100`;
  const width = clamp(state.score, 0, 100);
  emopulseScoreBarFillEl.style.width = `${width}%`;
}

function renderWeather() {
  if (!emotionalWeatherMainEl || !emotionalWeatherTagEl || !emotionalWeatherIconEl) return;

  let main = '';
  let tag = '';
  let iconClass = 'calm';

  if (state.emotion.toLowerCase().includes('stress')) {
    main = 'Passing turbulence, strength in progress';
    tag = 'short-term outlook: elevated stress, resilience rising';
    iconClass = 'stress';
  } else if (state.emotion.toLowerCase().includes('focus')) {
    main = 'Clear with a corridor of focus';
    tag = 'short-term outlook: high clarity, grounded drive';
    iconClass = 'focus';
  } else if (state.emotion.toLowerCase().includes('joy')) {
    main = 'Warm surge with pockets of joy';
    tag = 'short-term outlook: light, open, expansive';
    iconClass = 'joy';
  } else {
    main = 'Clear with a chance of focus';
    tag = 'short-term outlook: low stress, rising clarity';
    iconClass = 'calm';
  }

  emotionalWeatherMainEl.textContent = main;
  emotionalWeatherTagEl.textContent = tag;
  emotionalWeatherIconEl.className = `emotional-weather-icon ${iconClass}`;
}

function renderMiniDashboard() {
  if (pulseValueEl) pulseValueEl.textContent = `${state.pulse} bpm`;
  if (pulseQualityEl) pulseQualityEl.textContent = state.pulse > 95 || state.pulse < 55
    ? 'Signal quality: medium'
    : 'Signal quality: high';

  if (miniEmotionValueEl) miniEmotionValueEl.textContent = state.emotion;
  if (miniValenceEl) miniValenceEl.textContent = `Valence: ${state.valence}`;
  if (confidenceValueEl) confidenceValueEl.textContent = `${Math.round(state.confidence * 100)}%`;
  if (patternStabilityEl) patternStabilityEl.textContent = state.confidence > 0.9
    ? 'Stable pattern'
    : 'Shifting pattern';

  if (stressRiskValueEl) stressRiskValueEl.textContent = `${state.stressRisk} / 100`;
  if (stressRiskLabelEl) {
    if (state.stressRisk < 25) {
      stressRiskLabelEl.textContent = 'Low & contained';
    } else if (state.stressRisk < 60) {
      stressRiskLabelEl.textContent = 'Moderate – monitor gently';
    } else {
      stressRiskLabelEl.textContent = 'High – handle with care';
    }
  }
}

function renderMoodMap() {
  if (!moodMapDotEl) return;
  const x = clamp(state.moodDot.x, 0, 1) * 100;
  const y = clamp(state.moodDot.y, 0, 1) * 100;
  moodMapDotEl.style.left = `${x}%`;
  moodMapDotEl.style.top = `${y}%`;
}

function renderTimeline() {
  if (!emotionTimelineProgressEl) return;

  emotionTimelineProgressEl.style.transform = 'scaleX(1)';

  const dots = [timelineDot1El, timelineDot2El, timelineDot3El, timelineDot4El];
  dots.forEach(dot => {
    if (!dot) return;
    dot.classList.remove('calm', 'focus', 'stress', 'joy');
    const e = state.emotion.toLowerCase();
    if (e.includes('stress')) dot.classList.add('stress');
    else if (e.includes('focus')) dot.classList.add('focus');
    else if (e.includes('joy')) dot.classList.add('joy');
    else dot.classList.add('calm');
  });
}

function renderRings() {
  if (ringCalmEl) ringCalmEl.style.opacity = state.emotion.toLowerCase().includes('calm') ? '1' : '0.4';
  if (ringFocusEl) ringFocusEl.style.opacity = state.emotion.toLowerCase().includes('focus') ? '1' : '0.4';
  if (ringStressEl) ringStressEl.style.opacity = state.emotion.toLowerCase().includes('stress') ? '1' : '0.4';
  if (ringJoyEl) ringJoyEl.style.opacity = state.emotion.toLowerCase().includes('joy') ? '1' : '0.4';
}

function renderStory() {
  if (!storyLine1El || !storyLine2El || !storyLine3El) return;

  if (state.emotion.toLowerCase().includes('stress')) {
    storyLine1El.textContent = 'Your emotional journey moved into turbulence for a moment.';
    storyLine2El.textContent = 'You noticed the spike instead of ignoring it.';
    storyLine3El.textContent = 'Recovery has started – you are already moving back to safety.';
  } else if (state.emotion.toLowerCase().includes('focus')) {
    storyLine1El.textContent = 'You’ve shifted into a corridor of focus.';
    storyLine2El.textContent = 'Attention is engaged, but your body stays grounded.';
    storyLine3El.textContent = 'You are holding a calm edge while doing the work.';
  } else if (state.emotion.toLowerCase().includes('joy')) {
    storyLine1El.textContent = 'Lightness and joy are quietly expanding.';
    storyLine2El.textContent = 'Your system remembers what ease feels like.';
    storyLine3El.textContent = 'This is a good place to anchor as a reference point.';
  } else {
    storyLine1El.textContent = 'Your emotional journey today began in calmness.';
    storyLine2El.textContent = 'You transitioned into focused clarity.';
    storyLine3El.textContent = 'A brief stress spike appeared but resolved quickly.';
  }
}

function renderChallenge() {
  if (!challengeTextEl || !challengeButtonEl) return;

  if (!state.challengeActive) {
    challengeTextEl.textContent = `Hold calmness for ${state.challengeTargetSeconds} seconds.`;
    challengeButtonEl.textContent = 'Start challenge';
  } else {
    const elapsed = Math.floor((Date.now() - state.challengeStart) / 1000);
    const remaining = clamp(state.challengeTargetSeconds - elapsed, 0, state.challengeTargetSeconds);
    challengeTextEl.textContent = `Stay in calm / focus for ${remaining}s…`;
    challengeButtonEl.textContent = remaining <= 0 ? 'Challenge complete' : 'Stop challenge';
  }
}

function renderStreaksAndBadges() {
  if (calmStreakEl) calmStreakEl.textContent = '3 days';
  if (focusStreakEl) focusStreakEl.textContent = '1 day';

  if (badgeCalmEl) badgeCalmEl.classList.toggle('active', state.emotion.toLowerCase().includes('calm'));
  if (badgeFocusEl) badgeFocusEl.classList.toggle('active', state.emotion.toLowerCase().includes('focus'));
  if (badgeStressEl) badgeStressEl.classList.toggle('active', state.emotion.toLowerCase().includes('stress'));
}

function renderAIReflection() {
  if (!aiReflectionLine1El || !aiReflectionLine2El) return;

  if (state.emotion.toLowerCase().includes('stress')) {
    aiReflectionLine1El.textContent = '“Your emotional field is under pressure, but not breaking.”';
    aiReflectionLine2El.textContent = '“Right now, your awareness is your strongest protection.”';
  } else if (state.emotion.toLowerCase().includes('focus')) {
    aiReflectionLine1El.textContent = '“You are riding a focused wave with grounded control.”';
    aiReflectionLine2El.textContent = '“This is a good window for meaningful work.”';
  } else if (state.emotion.toLowerCase().includes('joy')) {
    aiReflectionLine1El.textContent = '“Joy is quietly recharging your system.”';
    aiReflectionLine2El.textContent = '“Your nervous system remembers that safety can feel warm.”';
  } else {
    aiReflectionLine1El.textContent = '“Your emotional flow today shows resilience.”';
    aiReflectionLine2El.textContent = '“You adapted well to stress fluctuations.”';
  }
}

function renderCompassAndReport() {
  if (compassHeadingEl) {
    let heading = 'Current heading: calm + focus, low stress, high stability.';
    if (state.emotion.toLowerCase().includes('stress')) {
      heading = 'Current heading: turbulence detected, steering back to safety.';
    } else if (state.emotion.toLowerCase().includes('joy')) {
      heading = 'Current heading: light, open, gently expanding.';
    }
    compassHeadingEl.textContent = heading;
  }

  if (peakCalmEl) peakCalmEl.textContent = `${state.peakCalm}%`;
  if (focusDurationEl) focusDurationEl.textContent = `${state.focusMinutes} min`;
  if (stressRecoveryEl) stressRecoveryEl.textContent = state.stressRecovery;
}

function renderAuraAndTrail() {
  if (emotionalAuraEl) {
    emotionalAuraEl.classList.remove('calm', 'focus', 'stress', 'joy');
    const e = state.emotion.toLowerCase();
    if (e.includes('stress')) emotionalAuraEl.classList.add('stress');
    else if (e.includes('focus')) emotionalAuraEl.classList.add('focus');
    else if (e.includes('joy')) emotionalAuraEl.classList.add('joy');
    else emotionalAuraEl.classList.add('calm');
  }

  if (emotionTrailEl) {
    // Optionally, we could dynamically add trail steps depending on history
    // For now we keep static labels in HTML – demo mode.
  }
}

function renderHistory() {
  if (!emotionHistoryEl || !emotionLabelEl || !emotionIntensityEl || !emotionOutputEl) return;

  emotionLabelEl.textContent = state.emotion;
  emotionIntensityEl.textContent = `Intensity: ${Math.round(state.arousal * 100)}%`;

  emotionHistoryEl.innerHTML = '';
  state.history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.label} · ${item.timestamp.toLocaleTimeString()}`;
    emotionHistoryEl.appendChild(li);
  });

  emotionOutputEl.textContent = `Emotion: ${state.emotion} · Valence: ${state.valence} · Drift: ${state.drift > 0 ? '+' : ''}${state.drift}%`;
}

function renderRadar() {
  if (!emotionRadarCanvas) return;

  const ctx = emotionRadarCanvas.getContext('2d');
  const w = emotionRadarCanvas.width;
  const h = emotionRadarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) / 2 - 10;

  ctx.clearRect(0, 0, w, h);

  // Grid circles
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxR * i) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(cx - maxR, cy);
  ctx.lineTo(cx + maxR, cy);
  ctx.moveTo(cx, cy - maxR);
  ctx.lineTo(cx, cy + maxR);
  ctx.stroke();

  // Emotion point
  const angle = state.arousal * Math.PI * 2 * 0.75; // compress to 270°
  const radius = (state.stressRisk / 100) * maxR;
  const px = cx + radius * Math.cos(angle);
  const py = cy + radius * Math.sin(angle);

  ctx.beginPath();
  ctx.fillStyle = 'rgba(102, 179, 255, 0.9)';
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderAll() {
  renderScore();
  renderWeather();
  renderMiniDashboard();
  renderMoodMap();
  renderTimeline();
  renderRings();
  renderStory();
  renderChallenge();
  renderStreaksAndBadges();
  renderAIReflection();
  renderCompassAndReport();
  renderAuraAndTrail();
  renderHistory();
  renderRadar();
}

// -----------------------
// Interaction logic
// -----------------------

function handleScenarioButtons() {
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.toLowerCase().trim();
      if (text === 'smile') setEmotion('smile');
      else if (text === 'neutral') setEmotion('neutral');
      else if (text === 'stress') setEmotion('stress');
      else if (text === 'high stress') setEmotion('highStress');
      else if (text === 'calm mode') setEmotion('calm');
      else if (text === 'focus mode') setEmotion('focus');
    });
  });
}

function handleChallengeButton() {
  if (!challengeButtonEl) return;

  challengeButtonEl.addEventListener('click', () => {
    if (!state.challengeActive) {
      state.challengeActive = true;
      state.challengeStart = Date.now();
    } else {
      state.challengeActive = false;
      state.challengeStart = null;
    }
    renderChallenge();
  });

  // Simple timer tick to update challenge
  setInterval(() => {
    if (state.challengeActive && state.challengeStart) {
      const elapsed = (Date.now() - state.challengeStart) / 1000;
      if (elapsed >= state.challengeTargetSeconds) {
        state.challengeActive = false;
        state.challengeStart = null;
      }
      renderChallenge();
    }
  }, 500);
}

function handleAICoachButton() {
  if (!aiCoachButtonEl) return;

  aiCoachButtonEl.addEventListener('click', async () => {
    // TODO: Replace this with real backend call, e.g.:
    // const res = await fetch('/api/coach', { method: 'POST', body: JSON.stringify({...}) });
    // const data = await res.json();
    // aiReflectionLine1El.textContent = data.line1;
    // aiReflectionLine2El.textContent = data.line2;

    if (aiReflectionLine1El && aiReflectionLine2El) {
      aiReflectionLine1El.textContent = '“Right now, the kindest move is a small one.”';
      aiReflectionLine2El.textContent = '“Take 3 slow breaths and do the next tiny step only.”';
    }
  });
}

// -----------------------
// Live camera (optional demo)
// -----------------------

async function initCamera() {
  if (!cameraEl) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraEl.srcObject = stream;
    // TODO: connect camera frames to real PPG / emotion model
  } catch (err) {
    console.warn('Camera access denied or unavailable:', err);
  }
}

// -----------------------
// Initialization
// -----------------------

function init() {
  // Initial state
  pushHistory(state.emotion);
  renderAll();

  // Interaction
  handleScenarioButtons();
  handleChallengeButton();
  handleAICoachButton();
  initCamera();

  // Demo: gentle drift over time (if no backend)
  setInterval(() => {
    // small random walk for score / stress / arousal
    state.score = clamp(state.score + (Math.random() * 4 - 2), 40, 95);
    state.stressRisk = clamp(state.stressRisk + (Math.random() * 6 - 3), 5, 85);
    state.arousal = clamp(state.arousal + (Math.random() * 0.1 - 0.05), 0.2, 0.9);
    state.pulse = clamp(state.pulse + Math.round(Math.random() * 4 - 2), 60, 100);
    state.drift = clamp(state.drift + (Math.random() * 6 - 3), -40, 40);

    renderAll();
  }, 4000);
}

document.addEventListener('DOMContentLoaded', init);

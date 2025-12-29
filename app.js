// Smooth scroll buttons
document.getElementById("scroll-to-problem-btn")?.addEventListener("click", () => {
  document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("start-demo-btn")?.addEventListener("click", () => {
  document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
});

/**
 * EMOTION PRESETS – same semantic mapping as API stub:
 * neutral, smile, stress
 */
const EMOTION_PRESETS = {
  neutral: {
    emotion: "neutral",
    confidence: 0.85,
    pulse_bpm: 72,
    latency_ms: 120,
    natasha: "Natasha: Calm, steady, and grounded. Your system is in a neutral, ready state.",
    auraColors: ["#38bdf8", "#0f172a", "#020617"],
  },
  smile: {
    emotion: "joyful",
    confidence: 0.92,
    pulse_bpm: 75,
    latency_ms: 135,
    natasha: "Natasha: I see your joy shining through – let’s keep that pulse aligned with your happiness.",
    auraColors: ["#22c55e", "#38bdf8", "#fbbf24"],
  },
  stress: {
    emotion: "anxious",
    confidence: 0.78,
    pulse_bpm: 90,
    latency_ms: 165,
    natasha: "Natasha: I sense tension in your signal – let’s slow down, breathe, and give your system a softer pace.",
    auraColors: ["#fb7185", "#f97316", "#0f172a"],
  },
};

let currentScenario = "neutral";

/**
 * DEMO PROGRESS + UI UPDATE
 */
const demoButtons = document.querySelectorAll(".demo-btn");
const progressFill = document.getElementById("demo-progress");
const demoStepLabel = document.getElementById("demo-step-label");
const natashaText = document.getElementById("natasha-text");
const demoJsonOutput = document.getElementById("demo-json-output");
const metricEmotion = document.getElementById("metric-emotion");
const metricConfidence = document.getElementById("metric-confidence");
const metricPulse = document.getElementById("metric-pulse");
const metricLatency = document.getElementById("metric-latency");
const demoAuraEmotion = document.getElementById("demo-aura-emotion");
const auraEmotionLabel = document.getElementById("aura-emotion-label");
const auraPulseLabel = document.getElementById("aura-pulse-label");
const heroNatashaText = document.getElementById("hero-natasha-text");

let progressInterval = null;

function setScenario(scenarioKey) {
  if (!EMOTION_PRESETS[scenarioKey]) return;
  currentScenario = scenarioKey;

  demoButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.scenario === scenarioKey);
  });

  animateProgressAndUpdate(EMOTION_PRESETS[scenarioKey]);
}

function animateProgressAndUpdate(preset) {
  if (!progressFill || !demoStepLabel) return;
  if (progressInterval) clearInterval(progressInterval);

  let progress = 0;
  progressFill.style.width = "0%";
  demoStepLabel.textContent = "Calibrating signal...";
  natashaText.textContent = "Natasha: Hold still while I read your emotional pattern.";

  progressInterval = setInterval(() => {
    progress += 10;
    progressFill.style.width = `${progress}%`;

    if (progress >= 40 && progress < 80) {
      demoStepLabel.textContent = "Signal locked. Analyzing emotional micro-signals...";
    } else if (progress >= 80 && progress < 100) {
      demoStepLabel.textContent = "Synthesizing insight...";
    }

    if (progress >= 100) {
      clearInterval(progressInterval);
      demoStepLabel.textContent = "Analysis complete.";
      updateResultUI(preset);
    }
  }, 70);
}

function updateResultUI(preset) {
  if (!preset) return;

  // Top metrics
  metricEmotion.textContent = preset.emotion;
  metricConfidence.textContent = preset.confidence.toFixed(2);
  metricPulse.textContent = preset.pulse_bpm;
  metricLatency.textContent = `${preset.latency_ms} ms`;

  // Hero labels
  auraEmotionLabel.textContent = preset.emotion.charAt(0).toUpperCase() + preset.emotion.slice(1);
  auraPulseLabel.textContent = preset.pulse_bpm;

  // Demo overlay label
  demoAuraEmotion.textContent = preset.emotion.charAt(0).toUpperCase() + preset.emotion.slice(1);

  // Natasha message
  natashaText.textContent = preset.natasha;

  // API JSON preview
  const json = {
    emotion: preset.emotion,
    confidence: preset.confidence,
    pulse_bpm: preset.pulse_bpm,
  };
  demoJsonOutput.textContent = JSON.stringify(json, null, 2);

  // Update aura palettes
  updateAuraColors(preset.auraColors);
}

/**
 * AURA VISUALIZATION
 * Two separate canvases:
 * - aura-canvas (hero)
 * - demo-aura-canvas (demo)
 * Both use the same "meta" state but slightly different motion.
 */

const heroCanvas = document.getElementById("aura-canvas");
const demoCanvas = document.getElementById("demo-aura-canvas");

let heroCtx = null;
let demoCtx = null;

let auraColors = EMOTION_PRESETS.neutral.auraColors.slice();
let t = 0;

if (heroCanvas) {
  heroCtx = heroCanvas.getContext("2d");
}
if (demoCanvas) {
  demoCtx = demoCanvas.getContext("2d");
}

function updateAuraColors(colors) {
  auraColors = colors.slice();
}

function drawAura(ctx, width, height, intensityFactor) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.48;

  // Base radial gradient
  const gradient = ctx.createRadialGradient(
    cx + Math.sin(t * 0.7) * maxRadius * 0.15,
    cy + Math.cos(t * 0.5) * maxRadius * 0.15,
    maxRadius * 0.1,
    cx,
    cy,
    maxRadius
  );

  gradient.addColorStop(0, auraColors[0] + "ee");
  gradient.addColorStop(0.4, auraColors[1] + "dd");
  gradient.addColorStop(1, auraColors[2] + "00");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  // "3D aura" warp – pseudo noise/contours
  const rings = 7;
  for (let i = 0; i < rings; i++) {
    const radius = maxRadius * (0.55 + i * 0.05 + Math.sin(t * 0.6 + i) * 0.02 * intensityFactor);
    const alpha = 0.35 - (i / rings) * 0.3;
    const hueShift = i * 16;

    ctx.beginPath();
    ctx.arc(
      cx + Math.sin(t * 0.4 + i) * 6 * intensityFactor,
      cy + Math.cos(t * 0.3 + i * 0.7) * 6 * intensityFactor,
      radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = `hsla(${198 + hueShift}, 85%, 65%, ${alpha})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
}

function animate() {
  t += 0.016;

  if (heroCtx && heroCanvas) {
    drawAura(heroCtx, heroCanvas.width, heroCanvas.height, 0.9);
  }
  if (demoCtx && demoCanvas) {
    drawAura(demoCtx, demoCanvas.width, demoCanvas.height, 1.3);
  }

  requestAnimationFrame(animate);
}

if (heroCtx || demoCtx) {
  animate();
}

/**
 * HOOK UP BUTTONS
 */
demoButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const scenario = btn.dataset.scenario;
    setScenario(scenario);
  });
});

// Initialize with neutral scenario
setScenario("neutral");

// Small breathing hero Natasha text change after a delay
if (heroNatashaText) {
  setTimeout(() => {
    heroNatashaText.textContent =
      "Natasha: Real-time emotional awareness isn’t magic – it’s your signals, finally being heard.";
  }, 2800);
}

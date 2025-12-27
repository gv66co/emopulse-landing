// ======================================================
// 1. API URL — tavo Cloud Run backend
// ======================================================
const API_URL = "https://emopulse-api-1009590211108.europe-west4.run.app";

// ======================================================
// 2. DOM ELEMENTAI — pagrindiniai
// ======================================================
const video = document.getElementById("camera");
const emotionLabelEl = document.getElementById("emotionLabel");
const emotionIntensityEl = document.getElementById("emotionIntensity");
const emotionHistoryEl = document.getElementById("emotionHistory");
const emotionRadarCanvas = document.getElementById("emotionRadar");
const radarCtx = emotionRadarCanvas.getContext("2d");

// ======================================================
// 3. DOM ELEMENTAI — Emopulse UI (hero, dashboard, map…)
// ======================================================

// HERO METRICS
const emopulseScoreValue = document.getElementById("emopulseScoreValue");
const emopulseScoreBarFill = document.getElementById("emopulseScoreBarFill");
const emotionalWeatherMain = document.getElementById("emotionalWeatherMain");
const emotionalWeatherTag = document.getElementById("emotionalWeatherTag");
const emotionalWeatherIcon = document.getElementById("emotionalWeatherIcon");

// MINI DASHBOARD
const pulseValue = document.getElementById("pulseValue");
const pulseQuality = document.getElementById("pulseQuality");
const miniEmotionValue = document.getElementById("miniEmotionValue");
const miniValence = document.getElementById("miniValence");
const confidenceValue = document.getElementById("confidenceValue");
const patternStability = document.getElementById("patternStability");
const stressRiskValue = document.getElementById("stressRiskValue");
const stressRiskLabel = document.getElementById("stressRiskLabel");

// MOOD MAP
const moodMapDot = document.getElementById("moodMapDot");

// TIMELINE
const emotionTimelineProgress = document.getElementById("emotionTimelineProgress");

// RINGS
const ringCalm = document.getElementById("ringCalm");
const ringFocus = document.getElementById("ringFocus");
const ringStress = document.getElementById("ringStress");
const ringJoy = document.getElementById("ringJoy");

// HEATMAP
const emotionHeatmap = document.getElementById("emotionHeatmap");

// STORY
const storyLine1 = document.getElementById("storyLine1");
const storyLine2 = document.getElementById("storyLine2");
const storyLine3 = document.getElementById("storyLine3");

// COACH
const aiReflectionLine1 = document.getElementById("aiReflectionLine1");
const aiReflectionLine2 = document.getElementById("aiReflectionLine2");

// COMPASS
const compassHeading = document.getElementById("compassHeading");

// TAGS
const sessionTags = document.getElementById("sessionTags");

// MINI REPORT
const peakCalm = document.getElementById("peakCalm");
const focusDuration = document.getElementById("focusDuration");
const stressRecovery = document.getElementById("stressRecovery");

// AURA
const emotionalAura = document.getElementById("emotionalAura");

// STREAKS
const calmStreak = document.getElementById("calmStreak");
const focusStreak = document.getElementById("focusStreak");

// MILESTONES
const badgeCalm = document.getElementById("badgeCalm");
const badgeFocus = document.getElementById("badgeFocus");
const badgeStress = document.getElementById("badgeStress");

// ======================================================
// 4. Emocijų istorija
// ======================================================
const emotionHistory = [];
const MAX_HISTORY = 12;

// ======================================================
// 5. Emocijų spalvos
// ======================================================
const EMOTION_COLORS = {
  happy: "#4ade80",
  joy: "#22c55e",
  sad: "#60a5fa",
  anger: "#f97373",
  fear: "#facc15",
  surprise: "#a855f7",
  neutral: "#94a3b8",
  calm: "#4ade80",
  focus: "#38bdf8",
  stress: "#f97373",
  default: "#38bdf8"
};

// ======================================================
// 6. Kamera
// ======================================================
async function startCamera() {
  if (!video) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.error("Camera error:", err);
    emotionLabelEl.innerText = "Camera access denied";
  }
}

// ======================================================
// 7. Kadro paėmimas
// ======================================================
function captureFrame() {
  if (!video || !video.videoWidth) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

// ======================================================
// 8. Siuntimas į backend
// ======================================================
async function analyzeFrame(frame) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame })
    });

    const data = await response.json();
    console.log("API response:", data);

    handleEmotionResponse(data);
  } catch (error) {
    console.error("API error:", error);
    emotionLabelEl.innerText = "API error";
  }
}

// ======================================================
// 9. API atsakymo apdorojimas
// ======================================================
function handleEmotionResponse(data) {
  if (!data) return;

  const emotion = (data.emotion || "unknown").toLowerCase();
  const intensity = typeof data.intensity === "number" ? data.intensity : data.confidence || 0;

  updateEmotionPanel(emotion, intensity);
  updateHistory(emotion, intensity);
  drawRadar(emotion, intensity);

  // Nauja: maitinti visą Emopulse UI
  updateEmopulseUI(data);
}
// ======================================================
// 10. Emopulse UI atnaujinimas (visos sekcijos)
// ======================================================
function updateEmopulseUI(data) {
  if (!data) return;

  const emotion = (data.emotion || "neutral").toLowerCase();
  const intensity = data.intensity || data.confidence || 0.5;
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;

  // ======================================================
  // HERO — Emopulse Score
  // ======================================================
  if (emopulseScoreValue) {
    const score = Math.round((intensity * 100));
    emopulseScoreValue.innerText = `${score} / 100`;
  }

  if (emopulseScoreBarFill) {
    emopulseScoreBarFill.style.width = `${Math.round(intensity * 100)}%`;
    emopulseScoreBarFill.style.backgroundColor = color;
  }

  // ======================================================
  // HERO — Emotional Weather
  // ======================================================
  if (emotionalWeatherMain) {
    emotionalWeatherMain.innerText = generateWeatherText(emotion, intensity);
  }

  if (emotionalWeatherTag) {
    emotionalWeatherTag.innerText = generateWeatherTag(emotion, intensity);
  }

  if (emotionalWeatherIcon) {
    emotionalWeatherIcon.className = `emotional-weather-icon ${emotion}`;
  }

  // ======================================================
  // MINI DASHBOARD
  // ======================================================
  if (pulseValue) pulseValue.innerText = `${60 + Math.round(intensity * 40)} bpm`;
  if (pulseQuality) pulseQuality.innerText = intensity > 0.6 ? "Signal quality: high" : "Signal quality: medium";

  if (miniEmotionValue) miniEmotionValue.innerText = emotion;
  if (miniValence) miniValence.innerText = intensity > 0.5 ? "Valence: positive" : "Valence: neutral";

  if (confidenceValue) confidenceValue.innerText = `${Math.round(intensity * 100)}%`;
  if (patternStability) patternStability.innerText = intensity > 0.6 ? "Stable pattern" : "Variable pattern";

  if (stressRiskValue) stressRiskValue.innerText = `${Math.round((1 - intensity) * 100)} / 100`;
  if (stressRiskLabel) stressRiskLabel.innerText = intensity > 0.6 ? "Low & contained" : "Rising tension";

  // ======================================================
  // MOOD MAP (valence/arousal)
  // ======================================================
  if (moodMapDot) {
    const valence = intensity;      // 0–1
    const arousal = 1 - intensity;  // 0–1

    moodMapDot.style.left = `${valence * 80 + 10}%`;
    moodMapDot.style.top = `${arousal * 80 + 10}%`;
  }

  // ======================================================
  // TIMELINE (moving bar)
  // ======================================================
  if (emotionTimelineProgress) {
    const scale = 0.4 + intensity * 0.6;
    emotionTimelineProgress.style.transform = `scaleX(${scale})`;
    emotionTimelineProgress.style.backgroundColor = color;
  }

  // ======================================================
  // RINGS (pulse animation)
  // ======================================================
  if (ringCalm) ringCalm.style.opacity = emotion === "calm" ? 1 : 0.2;
  if (ringFocus) ringFocus.style.opacity = emotion === "focus" ? 1 : 0.2;
  if (ringStress) ringStress.style.opacity = emotion === "stress" ? 1 : 0.2;
  if (ringJoy) ringJoy.style.opacity = emotion === "joy" ? 1 : 0.2;

  // ======================================================
  // HEATMAP (shift + add new cell)
  // ======================================================
  if (emotionHeatmap) {
    const cell = document.createElement("div");
    cell.className = "emotion-heatmap-cell";

    if (intensity > 0.75) cell.classList.add("high");
    else if (intensity > 0.45) cell.classList.add("medium");
    else cell.classList.add("low");

    emotionHeatmap.appendChild(cell);

    // limit to 60 cells
    while (emotionHeatmap.children.length > 60) {
      emotionHeatmap.removeChild(emotionHeatmap.firstChild);
    }
  }
}

// ======================================================
// 11. Weather tekstų generatoriai
// ======================================================
function generateWeatherText(emotion, intensity) {
  if (emotion === "calm") return "Clear with a chance of focus";
  if (emotion === "focus") return "Focused clarity rising";
  if (emotion === "stress") return "Stress clouds forming";
  if (emotion === "joy") return "Bright emotional skies";
  if (emotion === "sad") return "Low emotional pressure";
  return "Mixed emotional conditions";
}

function generateWeatherTag(emotion, intensity) {
  if (emotion === "calm") return "short-term outlook: low stress, rising clarity";
  if (emotion === "focus") return "short-term outlook: high clarity, stable flow";
  if (emotion === "stress") return "short-term outlook: elevated tension";
  if (emotion === "joy") return "short-term outlook: positive momentum";
  return "short-term outlook: variable pattern";
}
// ======================================================
// 12. STORY (narrative)
// ======================================================
function updateStory(emotion, intensity) {
  if (!storyLine1 || !storyLine2 || !storyLine3) return;

  if (emotion === "calm") {
    storyLine1.innerText = "Your emotional journey today began in calmness.";
    storyLine2.innerText = "You maintained steady clarity.";
    storyLine3.innerText = "Your system shows stable emotional grounding.";
  }

  if (emotion === "focus") {
    storyLine1.innerText = "Your emotional flow is sharpening.";
    storyLine2.innerText = "Focus is rising with stable clarity.";
    storyLine3.innerText = "Your attention is becoming more precise.";
  }

  if (emotion === "stress") {
    storyLine1.innerText = "A stress spike appeared in your flow.";
    storyLine2.innerText = "Your system is adapting to tension.";
    storyLine3.innerText = "Recovery patterns are forming.";
  }
}

// ======================================================
// 13. AI COACH REFLECTION
// ======================================================
function updateCoach(emotion, intensity) {
  if (!aiReflectionLine1 || !aiReflectionLine2) return;

  if (emotion === "calm") {
    aiReflectionLine1.innerText = "“Your emotional flow shows stability.”";
    aiReflectionLine2.innerText = "“Calmness is shaping your clarity.”";
  }

  if (emotion === "focus") {
    aiReflectionLine1.innerText = "“Your focus is strengthening.”";
    aiReflectionLine2.innerText = "“Your clarity is rising with precision.”";
  }

  if (emotion === "stress") {
    aiReflectionLine1.innerText = "“Your system is under tension.”";
    aiReflectionLine2.innerText = "“Recovery patterns are forming.”";
  }
}

// ======================================================
// 14. COMPASS + TAGS
// ======================================================
function updateCompass(emotion, intensity) {
  if (compassHeading) {
    if (emotion === "calm") {
      compassHeading.innerText = "Current heading: calm + stability";
    } else if (emotion === "focus") {
      compassHeading.innerText = "Current heading: focus + clarity";
    } else if (emotion === "stress") {
      compassHeading.innerText = "Current heading: stress + adaptation";
    } else {
      compassHeading.innerText = "Current heading: mixed emotional flow";
    }
  }

  if (sessionTags) {
    sessionTags.innerHTML = "";

    const tags = [];

    if (emotion === "calm") tags.push("calm", "stable", "low stress");
    if (emotion === "focus") tags.push("focused", "clear", "engaged");
    if (emotion === "stress") tags.push("stress", "tension", "recovery");
    if (emotion === "joy") tags.push("joy", "positive", "uplifted");

    tags.forEach(t => {
      const span = document.createElement("span");
      span.className = "session-tag";
      span.innerText = t;
      sessionTags.appendChild(span);
    });
  }
}

// ======================================================
// 15. MINI REPORT
// ======================================================
function updateMiniReport(emotion, intensity) {
  if (peakCalm) peakCalm.innerText = `${Math.round(intensity * 100)}%`;
  if (focusDuration) focusDuration.innerText = `${Math.round(intensity * 10)} min`;
  if (stressRecovery) {
    stressRecovery.innerText =
      intensity > 0.6 ? "Fast" : intensity > 0.3 ? "Moderate" : "Slow";
  }
}

// ======================================================
// 16. AURA
// ======================================================
function updateAura(emotion, intensity) {
  if (!emotionalAura) return;

  emotionalAura.className = "emo-aura-wrapper " + emotion;
  emotionalAura.style.opacity = 0.6 + intensity * 0.4;
}

// ======================================================
// 17. STREAKS
// ======================================================
function updateStreaks(emotion) {
  if (!calmStreak || !focusStreak) return;

  if (emotion === "calm") {
    calmStreak.innerText = "4 days";
  }

  if (emotion === "focus") {
    focusStreak.innerText = "2 days";
  }
}

// ======================================================
// 18. MILESTONES
// ======================================================
function updateMilestones(emotion) {
  if (!badgeCalm || !badgeFocus || !badgeStress) return;

  badgeCalm.style.opacity = emotion === "calm" ? 1 : 0.3;
  badgeFocus.style.opacity = emotion === "focus" ? 1 : 0.3;
  badgeStress.style.opacity = emotion === "stress" ? 1 : 0.3;
}

// ======================================================
// 19. MASTER UI UPDATE WRAPPER
// ======================================================
function updateEmopulseUI(data) {
  if (!data) return;

  const emotion = (data.emotion || "neutral").toLowerCase();
  const intensity = data.intensity || data.confidence || 0.5;

  // Hero + dashboard + map + timeline + rings + heatmap
  updateHeroAndDashboard(data);
  updateMoodMap(data);
  updateTimeline(data);
  updateRings(data);
  updateHeatmap(data);

  // Story + coach + compass + tags + report + aura + streaks + milestones
  updateStory(emotion, intensity);
  updateCoach(emotion, intensity);
  updateCompass(emotion, intensity);
  updateMiniReport(emotion, intensity);
  updateAura(emotion, intensity);
  updateStreaks(emotion);
  updateMilestones(emotion);
}

// ======================================================
// 20. LOOP — kas 400 ms siunčia kadrą
// ======================================================
function startAnalysisLoop() {
  if (!video) return;

  setInterval(() => {
    const frame = captureFrame();
    if (frame) analyzeFrame(frame);
  }, 400);
}

// ======================================================
// 21. Paleidimas
// ======================================================
window.onload = () => {
  startCamera();
  startAnalysisLoop();
};
// DRIFT ELEMENTAI
const driftValueEl = document.querySelector(".drift-value");
const driftCaptionEl = document.querySelector(".drift-caption");
const driftSpiralEl = document.querySelector(".drift-spiral");
const driftOrbitEl = document.querySelector(".drift-spiral-orbit");
function updateDrift(emotion, intensity) {
  if (!driftValueEl || !driftCaptionEl || !driftSpiralEl || !driftOrbitEl) return;

  // drift reikšmė: kaip keičiasi „bendra emocinė būsena“
  const driftRaw = intensity - 0.5; // -0.5 .. +0.5
  const driftPercent = Math.round(driftRaw * 100); // -50 .. +50

  // tekstas
  if (driftPercent >= 0) {
    driftValueEl.innerText = `+${driftPercent}%`;
    driftValueEl.classList.add("positive");
    driftValueEl.classList.remove("negative");
  } else {
    driftValueEl.innerText = `${driftPercent}%`;
    driftValueEl.classList.add("negative");
    driftValueEl.classList.remove("positive");
  }

  if (emotion === "calm") {
    driftCaptionEl.innerText = driftPercent >= 0
      ? "Calmness increasing"
      : "Calmness softening";
  } else if (emotion === "focus") {
    driftCaptionEl.innerText = driftPercent >= 0
      ? "Focus sharpening"
      : "Focus diffusing";
  } else if (emotion === "stress") {
    driftCaptionEl.innerText = driftPercent >= 0
      ? "Stress building"
      : "Stress releasing";
  } else {
    driftCaptionEl.innerText = "Emotional state drifting";
  }

  // spiralės vizualas
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
  driftSpiralEl.style.borderColor = color;
  driftOrbitEl.style.borderColor = hexToRgba(color, 0.6);

  // greitis pagal intensity
  const speed = 8 - intensity * 5; // 3–8s
  driftSpiralEl.style.animationDuration = `${speed}s`;
  driftOrbitEl.style.animationDuration = `${speed * 0.8}s`;

  // orbitos dydis
  const scale = 0.9 + intensity * 0.4; // 0.9–1.3
  driftOrbitEl.style.transform = `scale(${scale})`;
}
  updateDrift(emotion, intensity);

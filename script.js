// 1. API URL — tavo Cloud Run backend
const API_URL = "https://emopulse-api-1009590211108.europe-west4.run.app";

// 2. Elementai iš DOM
const video = document.getElementById("camera");          // jei turi <video>, gerai, jei ne — galima pridėti vėliau
const emotionLabelEl = document.getElementById("emotionLabel");
const emotionIntensityEl = document.getElementById("emotionIntensity");
const emotionHistoryEl = document.getElementById("emotionHistory");
const emotionRadarCanvas = document.getElementById("emotionRadar");
const radarCtx = emotionRadarCanvas.getContext("2d");

// 3. Emocijų istorija
const emotionHistory = [];
const MAX_HISTORY = 12;

// 4. Emocijų spalvos
const EMOTION_COLORS = {
  happy: "#4ade80",
  joy: "#22c55e",
  sad: "#60a5fa",
  anger: "#f97373",
  fear: "#facc15",
  surprise: "#a855f7",
  neutral: "#94a3b8",
  default: "#38bdf8"
};

// 5. Paleidžia kamerą (jei yra video elementas)
async function startCamera() {
  if (!video) {
    console.warn("No <video id='camera'> element, skipping camera.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.error("Camera error:", err);
    if (emotionLabelEl) emotionLabelEl.innerText = "Camera access denied";
  }
}

// 6. paima kadrą iš video kaip base64 PNG
function captureFrame() {
  if (!video || !video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

// 7. Siunčia kadrą į backend
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
    if (emotionLabelEl) emotionLabelEl.innerText = "API error";
  }
}

// 8. Apdoroja API atsakymą ir atnaujina UI
function handleEmotionResponse(data) {
  if (!data) return;

  const emotion = (data.emotion || "unknown").toLowerCase();
  const intensity = typeof data.intensity === "number" ? data.intensity : data.confidence || 0;

  updateEmotionPanel(emotion, intensity);
  updateHistory(emotion, intensity);
  drawRadar(emotion, intensity);
}

// 9. Pagrindinė emocijų panelė
function updateEmotionPanel(emotion, intensity) {
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
  const roundedIntensity = Math.round(intensity * 100);

  if (emotionLabelEl) {
    emotionLabelEl.innerText = `Emotion: ${emotion}`;
    emotionLabelEl.style.color = color;
  }

  if (emotionIntensityEl) {
    emotionIntensityEl.innerText = `Intensity: ${roundedIntensity}%`;
  }

  // fono pulsavimas
  const section = document.querySelector(".emotion-section");
  if (section) {
    section.style.transition = "background 0.6s ease, box-shadow 0.6s ease";
    section.style.boxShadow = `0 24px 60px ${hexToRgba(color, 0.45)}`;
  }
}

// 10. Istorijos atnaujinimas
function updateHistory(emotion, intensity) {
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);
  const roundedIntensity = Math.round(intensity * 100);

  emotionHistory.unshift({
    emotion,
    intensity: roundedIntensity,
    time: timeStr
  });

  if (emotionHistory.length > MAX_HISTORY) {
    emotionHistory.pop();
  }

  if (!emotionHistoryEl) return;

  emotionHistoryEl.innerHTML = "";
  emotionHistory.forEach(item => {
    const li = document.createElement("li");

    const tag = document.createElement("span");
    tag.className = "emotion-tag";
    tag.innerText = item.emotion;

    const meta = document.createElement("span");
    meta.className = "emotion-time";
    meta.innerText = `${item.time} • ${item.intensity}%`;

    li.appendChild(tag);
    li.appendChild(meta);
    emotionHistoryEl.appendChild(li);
  });
}

// 11. Radar piešimas
function drawRadar(emotion, intensity) {
  if (!radarCtx || !emotionRadarCanvas) return;

  const width = emotionRadarCanvas.width;
  const height = emotionRadarCanvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 10;

  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
  const scaledRadius = maxRadius * clamp(intensity || 0.5, 0.1, 1);

  // fonas
  radarCtx.clearRect(0, 0, width, height);
  const gradient = radarCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0.3)");
  radarCtx.fillStyle = gradient;
  radarCtx.fillRect(0, 0, width, height);

  // koncentriniai ratai
  radarCtx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  radarCtx.lineWidth = 1;
  for (let i = 0.25; i <= 1; i += 0.25) {
    radarCtx.beginPath();
    radarCtx.arc(centerX, centerY, maxRadius * i, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  // kryžius
  radarCtx.beginPath();
  radarCtx.moveTo(centerX - maxRadius, centerY);
  radarCtx.lineTo(centerX + maxRadius, centerY);
  radarCtx.moveTo(centerX, centerY - maxRadius);
  radarCtx.lineTo(centerX, centerY + maxRadius);
  radarCtx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  radarCtx.stroke();

  // aktyvi „banga“
  radarCtx.beginPath();
  radarCtx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
  radarCtx.fillStyle = hexToRgba(color, 0.35);
  radarCtx.fill();

  radarCtx.beginPath();
  radarCtx.arc(centerX, centerY, scaledRadius, 0, Math.PI * 2);
  radarCtx.strokeStyle = color;
  radarCtx.lineWidth = 2;
  radarCtx.stroke();

  // indikatorius dėmė
  radarCtx.beginPath();
  radarCtx.arc(centerX, centerY - scaledRadius, 6, 0, Math.PI * 2);
  radarCtx.fillStyle = color;
  radarCtx.fill();
}

// 12. Pagalbinės funkcijos
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map(ch => ch + ch).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 13. Loop’as — kas 400 ms analizuoja kadrą
function startAnalysisLoop() {
  if (!video) {
    console.warn("No video, skipping capture loop.");
    return;
  }

  setInterval(() => {
    const frame = captureFrame();
    if (frame) {
      analyzeFrame(frame);
    }
  }, 400);
}

// 14. Paleidimas
window.onload = () => {
  startCamera();
  startAnalysisLoop();
};

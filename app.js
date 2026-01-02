import { initCompass3D, updateCompass3D } from "/compas3d.js";

// Face API iš CDN
const faceapi = window.faceapi;

// UI elementai
const video = document.getElementById("cam");
const camStatus = document.getElementById("camStatus");
const analyzeBtn = document.getElementById("analyzeBtn");
const aiText = document.getElementById("aiText");
const aiTags = document.getElementById("aiTags");
const scoreEl = document.getElementById("score");
const energyEl = document.getElementById("energy");
const stressEl = document.getElementById("stress");
const stabilityEl = document.getElementById("stability");
const intensityEl = document.getElementById("intensity");

let modelsReady = false;
let lastEmotion = { joy: 0.3, stress: 0.2, calm: 0.5 };

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

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    camStatus.textContent = "Camera blocked or unavailable.";
    console.error("Camera error:", err);
  }
}

async function loop() {
  requestAnimationFrame(loop);
  if (!modelsReady || !video.videoWidth) return;

  const det = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (det?.expressions) {
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

    scoreEl.textContent = `${score} / 100`;
    energyEl.textContent = `${energy.toFixed(2)} rising`;
    stressEl.textContent = `${stressRisk.toFixed(2)} ${
      stressRisk < 0.33 ? "low" : stressRisk < 0.66 ? "medium" : "high"
    }`;

    stabilityEl.textContent = `${Math.round(
      (lastEmotion.joy - lastEmotion.stress) * 18
    )}° toward ${
      lastEmotion.joy >= lastEmotion.stress ? "Joy" : "Stress"
    }`;

    intensityEl.textContent =
      energy < 0.33 ? "Low" : energy < 0.66 ? "Medium" : "High";

    aiText.textContent =
      score > 75
        ? "Your field looks coherent. Stay focused."
        : "Balanced but fluctuating. Reduce stimulation.";

    aiTags.textContent =
      score > 75 ? "#focus #calm #momentum" : "#grounded #clarity #steady";

    updateCompass3D({ energy, stress: stressRisk, score });
  }
}

analyzeBtn.addEventListener("click", () => {
  alert(
    `Current metrics:\nJoy ${lastEmotion.joy.toFixed(
      2
    )}\nStress ${lastEmotion.stress.toFixed(
      2
    )}\nCalm ${lastEmotion.calm.toFixed(2)}`
  );
});

init();

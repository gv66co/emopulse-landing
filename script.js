const API_URL = "https://emopulse-api-1009590211108.europe-west4.run.app";
async function analyzeFrame(frame) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame })
    });

    const data = await response.json();
    console.log("API response:", data);
    return data;

  } catch (error) {
    console.error("API error:", error);
  }
}
// 🔵 1. API URL — tavo Cloud Run backend
const API_URL = "https://emopulse-api-1009590211108.europe-west4.run.app";

// 🔵 2. HTML elementai (tuos įdėsi į index.html)
const video = document.getElementById("camera");
const output = document.getElementById("emotionOutput");

// 🔵 3. Paleidžia kamerą
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.error("Camera error:", err);
    output.innerText = "Camera access denied";
  }
}

// 🔵 4. Paverčia video kadrą į base64 PNG
function captureFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

// 🔵 5. Siunčia kadrą į backend
async function analyzeFrame(frame) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame })
    });

    const data = await response.json();
    console.log("API response:", data);

    // Atvaizduojam rezultatą
    if (data.emotion) {
      output.innerText = `Emotion: ${data.emotion}`;
    } else {
      output.innerText = "No emotion detected";
    }

  } catch (error) {
    console.error("API error:", error);
    output.innerText = "API error";
  }
}

// 🔵 6. Kas 300 ms siunčia kadrą į backend
function startAnalysisLoop() {
  setInterval(() => {
    const frame = captureFrame();
    analyzeFrame(frame);
  }, 300);
}

// 🔵 7. Paleidimas
window.onload = () => {
  startCamera();
  startAnalysisLoop();
};

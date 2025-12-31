/**
 * Emopulse Landing – Premium API Integration Block
 * Author: arvydelis + Copilot
 * Version: 1.0 (premium)
 */

const API_BASE = "https://emopulse-api-1009590211108.europe-west4.run.app";
const DEBUG_OVERLAY = false;

/* -------------------------------------------------------
   Debug overlay
------------------------------------------------------- */
function createDebugOverlay() {
  if (!DEBUG_OVERLAY) return;

  const box = document.createElement("div");
  box.id = "emopulse-debug";
  box.style.position = "fixed";
  box.style.bottom = "20px";
  box.style.right = "20px";
  box.style.padding = "12px 18px";
  box.style.background = "rgba(0,0,0,0.75)";
  box.style.color = "#00eaff";
  box.style.fontFamily = "monospace";
  box.style.fontSize = "13px";
  box.style.borderRadius = "8px";
  box.style.zIndex = "99999";
  box.style.boxShadow = "0 0 12px rgba(0,255,255,0.4)";
  box.innerText = "Emopulse API: initializing…";
  document.body.appendChild(box);
}

function updateDebugOverlay(text) {
  if (!DEBUG_OVERLAY) return;
  const box = document.getElementById("emopulse-debug");
  if (box) box.innerText = text;
}

/* -------------------------------------------------------
   Fetch wrapper with retry + exponential backoff
------------------------------------------------------- */
async function fetchWithRetry(url, options = {}, retries = 3) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

/* -------------------------------------------------------
   Premium API Client
------------------------------------------------------- */
export const EmopulseAPI = {
  status: "offline",
  lastCheck: null,

  async init() {
    createDebugOverlay();
    updateDebugOverlay("Checking API…");

    try {
      const health = await this.health();
      this.status = "online";
      this.lastCheck = Date.now();
      updateDebugOverlay(`Online ✓ (${new Date().toLocaleTimeString()})`);
      console.log("Emopulse API online:", health);
    } catch (err) {
      this.status = "offline";
      updateDebugOverlay("Offline ✗");
      console.warn("Emopulse API offline:", err);
    }

    setInterval(() => this.recheck(), 10000);
  },

  async recheck() {
    try {
      await this.health();
      this.status = "online";
      this.lastCheck = Date.now();
      updateDebugOverlay(`Online ✓ (${new Date().toLocaleTimeString()})`);
    } catch {
      this.status = "offline";
      updateDebugOverlay("Offline ✗");
    }
  },

  async health() {
    return fetchWithRetry(`${API_BASE}/api/health`);
  },

  async rotate(text) {
    if (!text || typeof text !== "string") {
      throw new Error("rotate(text) requires a string");
    }

    return fetchWithRetry(`${API_BASE}/api/rotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
  }
};

/* -------------------------------------------------------
   Auto‑init on page load
------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  EmopulseAPI.init();

  // DEMO: premium UI-less test
  EmopulseAPI.rotate("arvydas")
    .then(r => console.log("Rotated:", r))
    .catch(e => console.error("Rotate error:", e));
});

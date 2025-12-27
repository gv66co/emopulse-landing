// js/components/sidebar.js
import { MODES, getState, setMode, subscribe } from "../state.js";

const MODE_LABELS = {
  text: { title: "Text", subtitle: "Type what you feel" },
  voice: { title: "Voice", subtitle: "Speak freely (coming soon)" },
  webcam: { title: "Webcam", subtitle: "Face signals (coming soon)" },
  signals: { title: "Signals", subtitle: "PPG & HRV (coming soon)" },
  pulse: { title: "Pulse", subtitle: "Your rhythm (shared)" },
};

export function renderSidebar(root) {
  root.innerHTML = `
    <div class="sidebar-card">
      <div class="sidebar-header">
        <div class="sidebar-logo"></div>
        <div class="sidebar-title">
          <span class="sidebar-name">Emopulse</span>
          <span class="sidebar-tagline">Multimodal emotional demo</span>
        </div>
      </div>
      <nav class="sidebar-modes" id="sidebar-modes"></nav>
    </div>
  `;

  updateSidebar();

  subscribe(() => updateSidebar());
}

export function updateSidebar() {
  const container = document.getElementById("sidebar-modes");
  if (!container) return;

  const state = getState();

  container.innerHTML = MODES.map((mode) => {
    const { title, subtitle } = MODE_LABELS[mode];
    const active = state.mode === mode ? " sidebar-mode--active" : "";
    return `
      <button class="sidebar-mode${active}" data-mode="${mode}">
        <div class="sidebar-mode-icon sidebar-mode-icon--${mode}"></div>
        <div class="sidebar-mode-text">
          <span class="sidebar-mode-title">${title}</span>
          <span class="sidebar-mode-sub">${subtitle}</span>
        </div>
      </button>
    `;
  }).join("");
}

export function bindSidebarEvents() {
  const container = document.getElementById("sidebar-root");
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    const mode = btn.getAttribute("data-mode");
    setMode(mode);
  });
}

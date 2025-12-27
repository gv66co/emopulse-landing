// js/components/miniDashboard.js
import { getState, subscribe } from "../state.js";
import { updateMoodMap } from "./moodMap.js";
import { updateEmotionTimeline } from "./emotionTimeline.js";

export function renderMiniDashboard(root) {
  const container = document.createElement("div");
  container.innerHTML = `
    <div class="mode-header">
      <div class="mode-title">Mini dashboard</div>
      <div class="mode-subtitle">Pulse · Emotion · Confidence · Signal quality</div>
    </div>
    <div class="mini-dashboard-grid" id="mini-dashboard-grid"></div>
    <div class="mood-map-shell" id="mood-map-shell">Mood Map: valence vs arousal</div>
    <div class="timeline-shell" id="timeline-shell">Emotion timeline (last samples)</div>
  `;
  root.appendChild(container);

  subscribe((state) => {
    updateMiniDashboard(state);
    updateMoodMap(state);
    updateEmotionTimeline(state);
  });
}

export function updateMiniDashboard(state = getState()) {
  const grid = document.getElementById("mini-dashboard-grid");
  if (!grid) return;

  const { emotion, confidence, scores, pulse } = state;

  grid.innerHTML = `
    <div class="mini-metric-card">
      <div class="mini-metric-label">Emotion</div>
      <div class="mini-metric-value">${emotion ?? "—"}</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Confidence</div>
      <div class="mini-metric-value">${
        confidence != null ? Math.round(confidence * 100) + "%" : "—"
      }</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Pulse</div>
      <div class="mini-metric-value">${pulse?.bpm ?? "—"} bpm</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Signal quality</div>
      <div class="mini-metric-value">${
        pulse?.signalQuality != null
          ? Math.round(pulse.signalQuality * 100) + "%"
          : "—"
      }</div>
    </div>
  `;
}

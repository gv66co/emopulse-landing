// js/components/resultsBox.js
import { getState, subscribe } from "../state.js";

export function renderResultsBox(root) {
  root.innerHTML = `
    <div class="results-box-title">Emotional summary</div>
    <div class="results-grid" id="results-grid"></div>
  `;

  subscribe((state) => updateResultsBox(state));
}

export function updateResultsBox(state = getState()) {
  const grid = document.getElementById("results-grid");
  if (!grid) return;

  const { emotion, confidence, scores, pulse } = state;

  grid.innerHTML = `
    <div class="result-card">
      <div>Primary emotion</div>
      <div><strong>${emotion ?? "—"}</strong></div>
    </div>
    <div class="result-card">
      <div>Confidence</div>
      <div><strong>${
        confidence != null ? Math.round(confidence * 100) + "%" : "—"
      }</strong></div>
    </div>
    <div class="result-card">
      <div>Pulse</div>
      <div><strong>${pulse?.bpm ?? "—"} bpm</strong></div>
    </div>
    <div class="result-card">
      <div>Stress / Focus / Energy</div>
      <div><strong>${
        scores
          ? `${scores.stress} / ${scores.focus} / ${scores.energy}`
          : "—"
      }</strong></div>
    </div>
  `;
}

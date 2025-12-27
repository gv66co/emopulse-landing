// js/components/emopulseScore.js
import { getState, subscribe } from "../state.js";

export function renderEmopulseScore(root) {
  const el = document.createElement("div");
  el.id = "emopulse-score-block";
  el.className = "mood-map-shell";
  el.textContent = "Emopulse Score: —";
  root.appendChild(el);

  subscribe((state) => updateEmopulseScore(state));
}

export function updateEmopulseScore(state = getState()) {
  const el = document.getElementById("emopulse-score-block");
  if (!el) return;

  const scores = state.scores;
  if (!scores) {
    el.textContent = "Emopulse Score: waiting for first reading.";
    return;
  }

  const raw =
    100 -
    scores.stress * 0.5 +
    scores.focus * 0.3 +
    scores.energy * 0.2;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  el.textContent = `Emopulse Score: ${score} / 100`;
}

// js/components/pulseCanvas.js
import { getState, subscribe } from "../state.js";

export function renderPulseCanvas(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Pulse canvas</div>
        <div class="mode-subtitle">Shared emotional pulse across all modes</div>
      </div>
    </div>
    <div class="pulse-canvas-shell">
      <svg class="pulse-line" viewBox="0 0 100 30" preserveAspectRatio="none">
        <polyline id="pulse-polyline"
          fill="none"
          stroke="#38bdf8"
          stroke-width="0.7"
          points="0,15 10,14 20,16 30,14 40,18 50,12 60,17 70,13 80,16 90,15 100,15"
        />
      </svg>
    </div>
  `;

  subscribe((state) => updatePulseCanvas(state));
}

export function updatePulseCanvas(state = getState()) {
  const poly = document.getElementById("pulse-polyline");
  if (!poly) return;

  const bpm = state.pulse?.bpm ?? 72;
  const stress = state.scores?.stress ?? 30;

  const amp = 3 + Math.min(stress, 80) / 20;
  const base = 15;

  const points = [];
  for (let x = 0; x <= 100; x += 5) {
    const t = x / 100;
    const y = base + Math.sin(t * (4 + bpm / 40) * Math.PI) * amp;
    points.push(`${x},${y.toFixed(2)}`);
  }
  poly.setAttribute("points", points.join(" "));
}

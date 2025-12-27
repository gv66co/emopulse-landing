// js/components/moodMap.js
import { getState } from "../state.js";

export function updateMoodMap(state = getState()) {
  const shell = document.getElementById("mood-map-shell");
  if (!shell) return;

  const v = state.valence ?? state.scores?.stress != null
    ? 1 - state.scores.stress / 100
    : null;
  const a = state.arousal ?? state.scores?.energy != null
    ? state.scores.energy / 100
    : null;

  if (v == null || a == null) {
    shell.textContent = "Mood Map: waiting for first reading...";
    return;
  }

  shell.textContent = `Mood Map: valence ${v.toFixed(
    2
  )}, arousal ${a.toFixed(2)} (higher = more activated)`;
}

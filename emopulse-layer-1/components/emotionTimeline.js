// js/components/emotionTimeline.js
import { getState } from "../state.js";

export function updateEmotionTimeline(state = getState()) {
  const shell = document.getElementById("timeline-shell");
  if (!shell) return;

  const { timeline } = state;
  if (!timeline || !timeline.length) {
    shell.textContent = "Emotion timeline: no history yet.";
    return;
  }

  const last = timeline.slice(-5);
  const items = last
    .map(
      (entry) =>
        `${entry.emotion ?? "—"} (${entry.confidence != null ? Math.round(
          entry.confidence * 100
        ) + "%" : "—"})`
    )
    .join(" → ");

  shell.textContent = `Emotion timeline: ${items}`;
}

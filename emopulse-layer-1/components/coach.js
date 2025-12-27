// js/components/coach.js
import { getState, subscribe } from "../state.js";

export function renderCoach(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div class="mode-title">Coach</div>
      <div class="mode-subtitle">Context-aware micro‑guidance</div>
    </div>
    <div class="coach-bubble">
      <div class="coach-avatar"></div>
      <div class="coach-text-block" id="coach-text">
        Start by typing a few sentences about how you feel. I'm here to help you make sense of it.
      </div>
    </div>
  `;

  subscribe((state) => updateCoach(state));
}

export function updateCoach(state = getState()) {
  const el = document.getElementById("coach-text");
  if (!el) return;

  const { mode, status, emotion } = state;

  if (status === "analyzing") {
    el.textContent =
      "Hold on, I'm feeling into the signals beneath your words...";
    return;
  }

  if (status === "error") {
    el.textContent =
      "Something glitched. Try again, or simplify what you're sharing.";
    return;
  }

  if (mode === "text") {
    if (!emotion) {
      el.textContent =
        "Type as if you were talking to someone safe. I’ll reflect the emotional pattern back to you.";
      return;
    }
    if (emotion === "anxious") {
      el.textContent =
        "I sense tension behind your words. Let's slow it down and name the pressure without judging it.";
      return;
    }
    if (emotion === "calm") {
      el.textContent =
        "There’s a grounded tone in what you wrote. We can explore how to protect that calm in your day.";
      return;
    }
  }

  el.textContent =
    "We’ll keep this space gentle: you bring the signals, I bring the structure.";
}

// js/components/emotionalSignature.js
import { getState, subscribe } from "../state.js";

export function renderEmotionalSignature(root) {
  const el = document.createElement("div");
  el.id = "signature-block";
  el.className = "mood-map-shell";
  el.textContent = "Emotional signature: waiting...";
  root.appendChild(el);

  subscribe((state) => updateEmotionalSignature(state));
}

export function updateEmotionalSignature(state = getState()) {
  const el = document.getElementById("signature-block");
  if (!el) return;

  if (!state.signature) {
    el.textContent = "Emotional signature: will appear after analysis.";
    return;
  }

  el.textContent = `Emotional signature: ${state.signature}`;
}

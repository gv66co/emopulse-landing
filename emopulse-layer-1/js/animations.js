// js/animations.js

export function addAnalyzingShimmer(el) {
  if (!el) return;
  el.style.opacity = "0.7";
}

export function clearAnalyzingShimmer(el) {
  if (!el) return;
  el.style.opacity = "1";
}

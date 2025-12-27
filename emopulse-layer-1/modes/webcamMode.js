// js/modes/webcamMode.js

export function renderWebcamMode(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Webcam mode</div>
        <div class="mode-subtitle">Visual micro‑expressions and facial tension mapping (coming soon).</div>
      </div>
      <div class="coming-soon-badge">
        <span>Coming soon</span>
      </div>
    </div>
    <p style="font-size:0.85rem; opacity:0.8;">
      In the full version, this panel will reflect subtle facial tension, micro‑expressions, and gaze patterns. For now, it's a placeholder for the camera layer.
    </p>
  `;
}

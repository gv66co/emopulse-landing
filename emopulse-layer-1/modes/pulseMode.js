// js/modes/pulseMode.js

export function renderPulseMode(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Pulse focus mode</div>
        <div class="mode-subtitle">Zoom in on the rhythm itself.</div>
      </div>
    </div>
    <p style="font-size:0.85rem; opacity:0.8;">
      This mode will become a dedicated pulse visual layer — for now, the shared canvas above already reflects the emotional pulse across modes.
    </p>
  `;
}

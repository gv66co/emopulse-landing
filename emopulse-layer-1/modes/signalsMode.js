// js/modes/signalsMode.js

export function renderSignalsMode(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Signals mode</div>
        <div class="mode-subtitle">PPG, HRV, and breathing signals (coming soon).</div>
      </div>
      <div class="coming-soon-badge">
        <span>PPG demo exists separately</span>
      </div>
    </div>
    <p style="font-size:0.85rem; opacity:0.8;">
      The dedicated PPG demo shows the raw signal pipeline. Here, those metrics will blend with text and voice into a unified emotional view.
    </p>
  `;
}

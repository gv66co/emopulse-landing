// js/modes/voiceMode.js

export function renderVoiceMode(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Voice mode</div>
        <div class="mode-subtitle">Speak how you actually feel. Voice analysis is coming soon.</div>
      </div>
      <div class="coming-soon-badge">
        <span>Coming soon</span>
      </div>
    </div>
    <p style="font-size:0.85rem; opacity:0.8;">
      This preview focuses on text analysis. Voice patterns, tone, and prosody will appear here in the next build.
    </p>
  `;
}

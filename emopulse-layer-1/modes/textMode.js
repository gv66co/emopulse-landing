// js/modes/textMode.js
import { setStatus, setResult, appendTimeline } from "../state.js";
import { analyze } from "../api.js";

export function renderTextMode(root) {
  root.innerHTML = `
    <div class="mode-header">
      <div>
        <div class="mode-title">Text mode</div>
        <div class="mode-subtitle">Type freely. I’ll infer the emotional pattern underneath.</div>
      </div>
      <div class="coming-soon-badge">
        <span>Live voice & signals coming soon</span>
      </div>
    </div>
    <div class="text-input-area">
      <textarea id="text-input" placeholder="Write a few sentences about your day, your headspace, or what’s weighing on you..."></textarea>
      <div class="button-row">
        <button class="secondary-btn" id="text-scenario-stress">Stress scenario</button>
        <button class="primary-btn" id="text-analyze-btn">Analyze text</button>
      </div>
    </div>
  `;

  const textarea = document.getElementById("text-input");
  const analyzeBtn = document.getElementById("text-analyze-btn");
  const stressBtn = document.getElementById("text-scenario-stress");

  analyzeBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!text) return;
    await runAnalysis(text);
  });

  stressBtn.addEventListener("click", async () => {
    textarea.value =
      "I feel like everything is on top of me lately. My chest feels tight and my thoughts don't stop spinning.";
    await runAnalysis(textarea.value);
  });
}

async function runAnalysis(text) {
  setStatus("analyzing");
  const response = await analyze("text", { text });
  const payload = {
    emotion: response.emotion,
    confidence: response.confidence,
    scores: response.scores,
    pulse: {
      bpm: response.pulse_bpm,
      hrv: response.hrv,
      signalQuality: response.signal_quality,
    },
    signature: response.signature,
    insights: response.insights,
    valence: response.valence,
    arousal: response.arousal,
  };
  setResult(payload);
  appendTimeline({
    emotion: response.emotion,
    confidence: response.confidence,
    at: Date.now(),
  });
  setStatus("done");
}

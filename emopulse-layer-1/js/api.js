// js/api.js

// Fake API – jokio backend nereikia. Viskas generuojama čia.

const SCENARIO_PRESETS = {
  text_default: {
    emotion: "calm",
    confidence: 0.86,
    pulse_bpm: 73,
    hrv: 52,
    signal_quality: 0.9,
    tone: "soft",
    micro_expression: null,
    insights: ["You sound grounded, with a hint of focus."],
    scores: { stress: 28, focus: 72, energy: 61 },
    signature: "Calm Focused Energy",
    valence: 0.6,
    arousal: 0.4,
  },
  text_stress: {
    emotion: "anxious",
    confidence: 0.88,
    pulse_bpm: 92,
    hrv: 32,
    signal_quality: 0.88,
    tone: "tense",
    micro_expression: "brow-tension",
    insights: ["There is clear tension and overload in your narrative."],
    scores: { stress: 81, focus: 39, energy: 57 },
    signature: "High Tension Overdrive",
    valence: 0.2,
    arousal: 0.8,
  },
};

export async function analyze(mode, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mode === "text" && payload?.text?.toLowerCase().includes("stress")) {
        resolve(SCENARIO_PRESETS.text_stress);
      } else {
        resolve(SCENARIO_PRESETS.text_default);
      }
    }, 900);
  });
}

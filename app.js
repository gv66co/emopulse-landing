/* Emopulse landing app.js
   - Aura canvas (lightweight pseudo-3D blob)
   - Demo scenario handlers (fake API fallback)
   - Progress simulation and DOM updates
   - Professional Natasha copy integrated
*/

/* CONFIG */
const AURA_ENABLED = true; // set false to disable heavy canvas
const API_ENDPOINT = '/api/analyze'; // replace with full URL if needed
const PROGRESS_STEP_MS = 300;

/* Emotion presets (professional Natasha lines + color palette) */
const EMOTION_PRESETS = {
  neutral: { color: '#9AA7C7', label: 'Neutral', natasha: 'Natasha: Calm and steady. Signal looks stable.' },
  joyful: { color: '#FFD54F', label: 'Joyful', natasha: 'Natasha: I see your joy shining through — keep breathing gently.' },
  anxious: { color: '#FF6B6B', label: 'Anxious', natasha: 'Natasha: I sense tension — slow your breath and relax your shoulders.' },
  calm: { color: '#7FC8FF', label: 'Calm', natasha: 'Natasha: Soft and steady — nice and calm.' },
  focused: { color: '#8BC34A', label: 'Focused', natasha: 'Natasha: Focused and attentive — good clarity.' }
};

/* UTIL: safe DOM */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* AURA CANVAS: lightweight metaball-like blobs */
function initAuraCanvas(canvasId, options = {}) {
  if (!AURA_ENABLED) return null;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = canvas.width = canvas.clientWidth;
  let height = canvas.height = canvas.clientHeight;
  const blobs = [];
  const count = options.count || 5;

  for (let i = 0; i < count; i++) {
    blobs.push({
      x: width * Math.random(),
      y: height * Math.random(),
      r: 40 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      hue: Math.random() * 360
    });
  }

  function resize() {
    width = canvas.width = canvas.clientWidth;
    height = canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);

  function draw(color = '#9AA7C7', intensity = 0.6) {
    ctx.clearRect(0, 0, width, height);
    // soft background
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(245,250,255,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // draw blobs
    blobs.forEach((b, i) => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -100) b.x = width + 100;
      if (b.x > width + 100) b.x = -100;
      if (b.y < -100) b.y = height + 100;
      if (b.y > height + 100) b.y = -100;

      const grd = ctx.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
      grd.addColorStop(0, hexToRgba(color, 0.95 * intensity));
      grd.addColorStop(0.6, hexToRgba(color, 0.25 * intensity));
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.fillStyle = grd;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // subtle overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  let animId = null;
  function animate(color) {
    draw(color);
    animId = requestAnimationFrame(() => animate(color));
  }

  return {
    setColor: (c) => { /* immediate draw with new color */ draw(c); },
    start: (c) => { if (!animId) animate(c); },
    stop: () => { if (animId) cancelAnimationFrame(animId); animId = null; },
    destroy: () => { window.removeEventListener('resize', resize); if (animId) cancelAnimationFrame(animId); }
  };
}

/* helper: hex to rgba */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Demo logic: simulate progress, call API (or fake) and update UI */
function simulateAnalysis(scenario, onProgress, onDone) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(8 + Math.random() * 12);
    if (progress >= 100) progress = 100;
    onProgress(progress);
    if (progress >= 100) {
      clearInterval(interval);
      // call API (try real, fallback to fake)
      callAnalyzeAPI({ scenario }).then((data) => {
        onDone(null, data);
      }).catch((err) => {
        onDone(err, null);
      });
    }
  }, PROGRESS_STEP_MS);
}

/* callAnalyzeAPI: tries real endpoint, falls back to fakeAnalysis */
async function callAnalyzeAPI(payload) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('api-error');
    const json = await res.json();
    return json;
  } catch (e) {
    // fallback: local fake analysis
    return fakeAnalysis(payload.scenario);
  }
}

/* fakeAnalysis returns same shape as API */
function fakeAnalysis(scenario) {
  const map = {
    neutral: { emotion: 'neutral', confidence: 0.85, pulse_bpm: 72, signature: 'Calm Focused Energy' },
    smile: { emotion: 'joyful', confidence: 0.92, pulse_bpm: 75, signature: 'Warm Bright Energy' },
    stress: { emotion: 'anxious', confidence: 0.78, pulse_bpm: 90, signature: 'Tense High Arousal' },
    calm: { emotion: 'calm', confidence: 0.95, pulse_bpm: 60, signature: 'Soft Steady Calm' },
    focused: { emotion: 'focused', confidence: 0.88, pulse_bpm: 68, signature: 'Sharp Calm Focus' }
  };
  return map[scenario] || map['neutral'];
}

/* UI updates */
function updateProgressUI(pct) {
  const fill = $('#demo-progress');
  if (fill) fill.style.width = `${pct}%`;
  const step = $('#demo-step-label');
  if (step) step.textContent = pct < 100 ? `Analyzing ${pct}%` : 'Finalizing results';
}

function updateResultUI(data) {
  const emotion = data.emotion || 'neutral';
  const preset = EMOTION_PRESETS[emotion] || EMOTION_PRESETS['neutral'];
  // aura labels
  const auraLabel = $('#aura-emotion-label');
  const auraPulse = $('#aura-pulse-label');
  if (auraLabel) auraLabel.textContent = preset.label;
  if (auraPulse) auraPulse.textContent = data.pulse_bpm || '--';
  // demo metrics
  $('#metric-emotion').textContent = (data.emotion || 'neutral');
  $('#metric-confidence').textContent = (data.confidence !== undefined) ? data.confidence : '--';
  $('#metric-pulse').textContent = data.pulse_bpm || '--';
  // natasha bubble
  const nat = $('#natasha-text');
  if (nat) nat.textContent = data.natasha_hint || preset.natasha || `Natasha: ${preset.label}`;
  // JSON preview
  const pre = $('#demo-json-output');
  if (pre) pre.textContent = JSON.stringify(data, null, 2);
  // update aura canvas color if available
  if (window._AURA_INSTANCE && preset.color) {
    window._AURA_INSTANCE.setColor(preset.color);
  }
}

/* wire demo buttons */
function initDemoControls() {
  $$('.demo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const scenario = btn.getAttribute('data-scenario') || 'neutral';
      // UI: reset progress
      updateProgressUI(0);
      $('#demo-step-label').textContent = 'Starting analysis...';
      $('#natasha-text').textContent = 'Natasha: Calibrating and analyzing your signal...';
      // start aura animation with neutral color
      const preset = EMOTION_PRESETS[scenario] || EMOTION_PRESETS['neutral'];
      if (window._AURA_INSTANCE) window._AURA_INSTANCE.start(preset.color);
      // simulate
      simulateAnalysis(scenario, (pct) => {
        updateProgressUI(pct);
      }, (err, data) => {
        if (err) {
          $('#natasha-text').textContent = 'Natasha: Signal unstable, try again — we’ll get it right together.';
          $('#demo-step-label').textContent = 'Error';
          updateProgressUI(0);
          return;
        }
        // done
        updateProgressUI(100);
        $('#demo-step-label').textContent = 'Done';
        updateResultUI(data);
        // small pulse animation on aura card
        pulseAuraCard();
      });
    });
  });
}

/* small pulse effect on aura card */
function pulseAuraCard() {
  const card = document.querySelector('.aura-card');
  if (!card) return;
  card.animate([
    { transform: 'scale(1)', boxShadow: '0 8px 30px rgba(11,37,69,0.06)' },
    { transform: 'scale(1.02)', boxShadow: '0 18px 48px rgba(11,37,69,0.12)' },
    { transform: 'scale(1)', boxShadow: '0 8px 30px rgba(11,37,69,0.06)' }
  ], { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)' });
}

/* init everything on DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  // init aura canvases
  if (AURA_ENABLED) {
    window._AURA_INSTANCE = initAuraCanvas('aura-canvas', { count: 6 });
    window._DEMO_AURA = initAuraCanvas('demo-aura-canvas', { count: 5 });
    // start neutral animation
    const neutralColor = EMOTION_PRESETS['neutral'].color;
    if (window._AURA_INSTANCE) window._AURA_INSTANCE.start(neutralColor);
    if (window._DEMO_AURA) window._DEMO_AURA.start(neutralColor);
  }

  // wire demo controls
  initDemoControls();

  // hero CTA scroll
  const startBtn = document.getElementById('start-demo-btn');
  if (startBtn) startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
  });

  // small accessibility: keyboard support for demo buttons
  $$('.demo-btn').forEach(b => b.setAttribute('tabindex', '0'));

  // initial metrics
  updateResultUI(fakeAnalysis('neutral'));
});

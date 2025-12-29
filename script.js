<!DOCTYPE html>
<html lang="en" class="emopulse-theme">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Emopulse – Emotional AI Demo</title>
  <style>
    /* Base reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; line-height: 1.6; background: #f9f9f9; color: #333; }
    /* Header */
    .emo-page-header { background: #0b0f1c; color: white; padding: 20px; }
    .emo-header-inner { display: flex; justify-content: space-between; align-items: center; }
    .emo-logo-block { display: flex; align-items: center; }
    .emo-logo-mark { width: 32px; height: 32px; background: #61dafb; border-radius: 50%; margin-right: 10px; }
    .emo-logo-text { display: flex; flex-direction: column; }
    .emo-logo-title { font-size: 1.5em; }
    .emo-logo-sub { font-size: 0.8em; }
    .ai-coach-button { background: #61dafb; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; color: #000; font-size: 0.9em; display: flex; align-items: center; }
    .ai-coach-pulse { width: 8px; height: 8px; background: red; border-radius: 50%; margin-right: 8px; animation: pulseAnim 1s infinite alternate; }
    @keyframes pulseAnim { from { transform: scale(1); } to { transform: scale(1.5); } }
    /* Main layout */
    .emo-main { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
    .section-block { background: #fff; padding: 20px; border-radius: 4px; }
    h2 { margin-bottom: 10px; }
    /* Cards and grid */
    .emo-grid { display: flex; flex-wrap: wrap; gap: 20px; }
    .emo-grid-2 { flex-wrap: wrap; }
    .emo-card { background: #f4f4f4; padding: 16px; border-radius: 6px; flex: 1 1 300px; }
    .emo-card-header { margin-bottom: 10px; }
    .emo-card-title { font-weight: bold; font-size: 1.1em; }
    .emo-pill { background: #e0e0e0; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
    /* Timeline styling */
    .timeline { border: 1px solid #ccc; padding: 10px; height: 100px; overflow-y: auto; background: #fff; margin-top: 10px; }
    .timeline-entry { font-size: 0.9em; margin-bottom: 4px; }
    /* Rings styling: target emotion-ring classes */
    .emotion-rings { display: flex; justify-content: center; align-items: center; gap: 10px; }
    .emotion-ring { border-radius: 50%; border: 4px solid #61dafb; width: 80px; height: 80px; transition: all 0.5s ease; }
    /* Buttons and form */
    .btn { display: inline-block; margin: 10px 0; padding: 10px 20px; background: #61dafb; color: #000; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s ease; }
    .btn:hover { transform: scale(1.05); background: #21a1f1; }
    input, textarea { width: 100%; padding: 10px; margin: 5px 0 10px 0; border: 1px solid #ccc; border-radius: 4px; }
    footer { text-align: center; padding: 10px; font-size: 0.8em; color: #666; }
    @media (max-width: 600px) { .emo-main { padding: 10px; } .emo-grid { flex-direction: column; } }
    
  </style>
</head>
<body class="emopulse-theme">
<header class="emo-page-header">
  <div class="emo-header-inner">
    <div class="emo-logo-block">
      <div class="emo-logo-mark"></div>
      <div class="emo-logo-text">
        <span class="emo-logo-title">Emopulse</span>
        <span class="emo-logo-sub">Emotional AI that sees, feels, understands</span>
      </div>
    </div>
    <button class="ai-coach-button">
      <div class="ai-coach-pulse"></div>
      <span>Ask Natasha</span>
    </button>
  </div>
</header>
<main class="emo-main">
<section class="hero-section">
  <div class="hero-grid">
    <div class="hero-visual">
      <!-- Aura & Drift visualization goes here -->
    </div>
    <div class="hero-copy">
      <h1 class="hero-title">Real-time emotional intelligence<br>from your camera & micro-signals</h1>
      <p class="hero-subtitle">Emopulse transforms pulse, micro-signals, and context into a living emotional dashboard: drift, stability, risk, and narrative – in seconds.</p>
      <div class="hero-cta-row">
        <button id="start-btn" class="ai-coach-button">
          <div class="ai-coach-pulse"></div>
          <span>Get Started</span>
        </button>
      </div>
    </div>
  </div>
</section>
<section class="section-block" id="mini-dashboard">
  <h2>Mini dashboard</h2>
  <div class="mini-dashboard">
    <div class="mini-metric-card">
      <div class="mini-metric-label">Pulse</div>
      <div class="mini-metric-value"><span id="pulse">72</span> bpm</div>
      <div class="mini-metric-pill">Signal quality: high</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Emotion</div>
      <div class="mini-metric-value"><span id="emotion">Calm</span></div>
      <div class="mini-metric-pill">Valence: positive</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Confidence</div>
      <div class="mini-metric-value">91%</div>
      <div class="mini-metric-pill">Stable pattern</div>
    </div>
    <div class="mini-metric-card">
      <div class="mini-metric-label">Stress risk</div>
      <div class="mini-metric-value">18 / 100</div>
      <div class="mini-metric-pill">Low & contained</div>
    </div>
  </div>
</section>
<section class="section-block" id="mood-map-timeline">
  <h2>Emotional map & timeline</h2>
  <div class="emo-grid emo-grid-2">
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Mood map</div><span class="emo-pill emo-tag-soft">Valence / arousal</span></div>
      <div class="mood-map">
        <div class="mood-map-grid"></div>
        <div class="mood-map-axis-label top">High arousal</div>
        <div class="mood-map-axis-label bottom">Low arousal</div>
        <div class="mood-map-axis-label left">Negative</div>
        <div class="mood-map-axis-label right">Positive</div>
        <div class="mood-map-dot" style="left: 65%; top: 42%;"></div>
      </div>
    </div>
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Emotion timeline</div><span class="emo-pill emo-tag-soft">Last 60 seconds</span></div>
      <div class="emotion-timeline"><div class="emotion-timeline-track"><div class="emotion-timeline-progress" style="transform: scaleX(1);"></div><div class="emotion-timeline-emotion-dot calm" style="left: 10%;"></div><div class="emotion-timeline-emotion-dot focus" style="left: 35%;"></div><div class="emotion-timeline-emotion-dot stress" style="left: 58%;"></div><div class="emotion-timeline-emotion-dot calm" style="left: 82%;"></div></div></div>
      <div id="timeline" class="timeline">No history yet.</div>
    </div>
  </div>
</section>
<section class="section-block" id="rings-heatmap">
  <h2>Rings & heatmap</h2>
  <div class="emo-grid emo-grid-2">
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Emotion rings</div><span class="emo-pill emo-tag-soft">Calm / Focus / Stress</span></div>
      <div class="emotion-rings animate">
        <div class="emotion-ring calm"></div>
        <div class="emotion-ring focus"></div>
        <div class="emotion-ring stress"></div>
        <div class="emotion-ring joy"></div>
      </div>
    </div>
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Emotion heatmap</div><span class="emo-pill emo-tag-soft">Intensity over time</span></div>
      <div class="emotion-heatmap">
<div class="emotion-heatmap-cell low"></div><div class="emotion-heatmap-cell low"></div><div class="emotion-heatmap-cell medium"></div><div class="emotion-heatmap-cell high"></div><div class="emotion-heatmap-cell medium"></div><div class="emotion-heatmap-cell low"></div><div class="emotion-heatmap-cell low"></div><div class="emotion-heatmap-cell medium"></div><div class="emotion-heatmap-cell high"></div><div class="emotion-heatmap-cell high"></div><div class="emotion-heatmap-cell medium"></div><div class="emotion-heatmap-cell low"></div>
      </div>
    </div>
  </div>
</section>
<section class="section-block" id="experience-layer">
  <h2>Experience layer</h2>
  <div class="emo-grid emo-grid-2">
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Emotion story</div></div>
      <div class="emotion-challenge"><div class="emotion-challenge-label">Session narrative</div><p>Your emotional journey today began in calmness.</p><p>You transitioned into focused clarity.</p><p>A brief stress spike appeared but resolved quickly.</p></div>
    </div>
    <div class="emo-card">
      <div class="emo-card-header"><div class="emo-card-title">Emotion challenge</div></div>
      <div class="emotion-challenge"><div class="emotion-challenge-label">Challenge</div><p>Hold calmness for 60 seconds.</p><button class="scenario-button btn">Start challenge</button></div>
    </div>
  </div>
  <div class="emo-grid emo-grid-2" style="margin-top: 16px;">
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">Emotion streaks</div></div><div class="emotion-streaks"><div class="streak-item"><span class="streak-label">Calm streak</span><span class="streak-value">3 days</span></div><div class="streak-item"><span class="streak-label">Focus streak</span><span class="streak-value">1 day</span></div></div></div>
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">Emotional milestones</div></div><div class="emotion-badges"><div class="emotion-badge calm">Calm Master</div><div class="emotion-badge focus">Focus Achiever</div><div class="emotion-badge stress">Stress Recovery</div></div></div>
  </div>
</section>
<section class="section-block" id="ai-coach-layer">
  <h2>AI insights & coach</h2>
  <div class="emo-grid emo-grid-2">
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">AI reflection</div></div><div class="emotion-challenge"><p>“Your emotional flow today shows resilience.”</p><p>“You adapted well to stress fluctuations.”</p></div></div>
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">AI mood coach</div></div><p class="hero-subtitle" style="margin-bottom: 12px;">Ask: <em>“What should I do now?”</em> and get a short, emotionally precise suggestion.</p><button class="ai-coach-button btn"><div class="ai-coach-pulse"></div><span>What should I do now?</span></button></div>
  </div>
</section>
<section class="section-block" id="compass-tags-report">
  <h2>Compass, tags & mini report</h2>
  <div class="emo-grid emo-grid-3">
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">Emotional compass</div></div><div class="focus-mode-overlay"><div class="session-tags"><span class="session-tag">Calm</span><span class="session-tag">Joy</span><span class="session-tag">Focus</span><span class="session-tag">Stress</span></div><p style="margin-top: 10px; font-size: 13px;">Current heading: calm + focus, low stress, high stability.</p></div></div>
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">Session tags</div></div><div class="session-tags"><span class="session-tag">calm</span><span class="session-tag">focused</span><span class="session-tag">stable</span><span class="session-tag">low stress</span></div></div>
    <div class="emo-card"><div class="emo-card-header"><div class="emo-card-title">Mini emotional report</div></div><div class="mini-report"><div class="report-item"><span class="label">Peak calm</span><span class="value">82%</span></div><div class="report-item"><span class="label">Focus duration</span><span class="value">14 min</span></div><div class="report-item"><span class="label">Stress recovery</span><span class="value">Fast</span></div></div></div>
  </div>
</section>
<section class="section-block" id="roadmap">
  <h2>Roadmap</h2>
  <form id="roadmap-form">
    <input type="email" id="email" placeholder="Your email" required>
    <textarea id="message" placeholder="Tell us what you think" required></textarea>
    <button type="submit" class="btn">Send</button>
  </form>
  <p id="form-status"></p>
</section>
<footer>We never store your data. All processing is real-time. You stay in control.</footer>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const pulseField = document.getElementById('pulse');
        const emotionField = document.getElementById('emotion');
        const timelineDiv = document.getElementById('timeline');
        const history = [];
        function updateEmotion() {
            const pulseVal = Math.floor(Math.random() * (90 - 60 + 1)) + 60;
            const emotions = ['Calm','Happy','Focused','Stressed'];
            const emoVal = emotions[Math.floor(Math.random() * emotions.length)];
            if (pulseField) pulseField.textContent = pulseVal;
            if (emotionField) emotionField.textContent = emoVal;
            const entry = `Pulse: ${pulseVal} - Emotion: ${emoVal}`;
            history.unshift(entry);
            if (history.length > 10) history.pop();
            if (timelineDiv) {
                timelineDiv.innerHTML = history.map(e => `<div class='timeline-entry'>${e}</div>`).join('');
            }
            // randomize sizes of rings if present
            const rings = document.querySelectorAll('.emotion-ring');
            rings.forEach((ring, i) => {
                const base = 60 + i * 20;
                const size = base + Math.random() * 40;
                ring.style.width = size + 'px';
                ring.style.height = size + 'px';
            });
        }
        setInterval(updateEmotion, 5000);
        // Start button alert
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                alert('Welcome to Emopulse! Let the journey begin.');
            });
        }
        // Form validation
        const form = document.getElementById('roadmap-form');
        const status = document.getElementById('form-status');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    status.textContent = 'Please enter a valid email.';
                    status.style.color = 'red';
                    return;
                }
                if (message.trim() === '') {
                    status.textContent = 'Please enter a message.';
                    status.style.color = 'red';
                    return;
                }
                status.textContent = 'Thanks for your feedback!';
                status.style.color = 'green';
                form.reset();
            });
        }
    });
</script>
</main>
</body>
</html>

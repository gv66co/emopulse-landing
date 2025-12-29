
const scenarios = {
  smile: { emotion: "džiaugsmas", confidence: 0.92, pulse: 75, quality: 0.9 },
  neutral: { emotion: "ramybė", confidence: 0.85, pulse: 72, quality: 0.9 },
  stress: { emotion: "įtampa", confidence: 0.78, pulse: 90, quality: 0.8 },
  high_stress: { emotion: "stresas", confidence: 0.65, pulse: 98, quality: 0.7 },
  calm: { emotion: "ramybė", confidence: 0.95, pulse: 68, quality: 0.95 },
  focused: { emotion: "susikaupimas", confidence: 0.88, pulse: 70, quality: 0.92 },
  energy: { emotion: "energija", confidence: 0.90, pulse: 80, quality: 0.93 },
  conf_drop: { emotion: "abejonė", confidence: 0.60, pulse: 85, quality: 0.85 }
};
const natashaLines = {
  smile: "Natasha: Matai, kaip džiaugsmas švyti!",
  neutral: "Natasha: Ramybė, kaip jūra.",
  stress: "Natasha: Jaučiu įtampą — kvėpuokime kartu.",
  high_stress: "Natasha: Didelis stresas — laikas atsipalaiduoti.",
  calm: "Natasha: Ramybė užlieja.",
  focused: "Natasha: Susikaupimas — puikus rezultatas.",
  energy: "Natasha: Energijos banga!",
  conf_drop: "Natasha: Pasitikėjimas sumažėjo — viskas gerai, bandyk dar kartą."
};
document.querySelectorAll('.buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const scenario = btn.getAttribute('data-scenario');
    runDemo(scenario);
  });
});
function runDemo(scenario) {
  const data = scenarios[scenario] || scenarios['neutral'];
  document.getElementById('natasha-line').textContent = natashaLines[scenario] || "Natasha: Pasiruošusi padėti.";
  animateProgress();
  setTimeout(() => {
    document.getElementById('metric-pulse').textContent = data.pulse;
    document.getElementById('metric-emotion').textContent = data.emotion;
    document.getElementById('metric-confidence').textContent = Math.round(data.confidence * 100) + "%";
    document.getElementById('metric-quality').textContent = Math.round(data.quality * 100) + "%";
    renderMoodMap(data.emotion);
    pushTimelinePoint(data.pulse, data.confidence);
  }, 1200);
}
function animateProgress() {
  const bar = document.getElementById('progress');
  bar.style.width = "0";
  setTimeout(() => { bar.style.width = "100%"; }, 400);
}
function renderMoodMap(emotion) {
  const colors = { "ramybė": "#7FC8FF", "džiaugsmas": "#FFD54F", "įtampa": "#FF6B6B", "stresas": "#FF3A4E", "susikaupimas": "#3ABEFF", "energija": "#FFD75E", "abejonė": "#6b7a90" };
  const color = colors[emotion] || "#9AA7C7";
  const dotX = 130 + (Math.random() - 0.5) * 40;
  const dotY = 130 + (Math.random() - 0.5) * 40;
  document.getElementById('moodmap').innerHTML = `
    <svg width="260" height="260" viewBox="0 0 260 260">
      <circle cx="130" cy="130" r="100" fill="${color}" opacity="0.9"/>
      <circle cx="${dotX}" cy="${dotY}" r="8" fill="#fff"/>
      <text x="50%" y="90%" text-anchor="middle" font-size="22" fill="#0b2545">${emotion}</text>
    </svg>
  `;
}
// Timeline Chart.js
const ctx = document.getElementById('timelineChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Pulse', data: [], borderColor: '#0078FF', fill: false },
      { label: 'Confidence', data: [], borderColor: '#FF8A65', fill: false, yAxisID: 'y1' }
    ]
  },
  options: {
    scales: {
      y: { beginAtZero: true },
      y1: { position: 'right', min: 0, max: 1 }
    }
  }
});
function pushTimelinePoint(pulse, conf) {
  const t = new Date().toLocaleTimeString();
  chart.data.labels.push(t);
  chart.data.datasets[0].data.push(pulse);
  chart.data.datasets[1].data.push(conf);
  if (chart.data.labels.length > 30) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(d => d.data.shift());
  }
  chart.update();
}
document.getElementById('explain').addEventListener('click', () => {
  document.getElementById('natasha-line').textContent = "Natasha: Ši sesija parodo, kaip emocijos keičiasi realiu laiku. Visi duomenys apdorojami tik naršyklėje.";
});

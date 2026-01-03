// app.js
const state = {
    emotion: 'neutral',
    pulse: 70,
    intensity: 0,
    isCalibrating: true
};

// 1. Emocijų atpažinimo variklis
async function initNeuralEngine() {
    const video = document.getElementById('video');
    
    // Naudojame Face-api.js skaičiavimus
    setInterval(async () => {
        if (faceapi.nets.tinyFaceDetector.params) {
            const detections = await faceapi.detectAllFaces(video, 
                new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
                
                state.emotion = sorted[0][0];
                state.intensity = sorted[0][1];
                
                // Sinchronizuojame su UI
                updateUI();
                // Perduodame duomenis į 3D Aura variklį
                updateAuraDrift(state.emotion, state.intensity);
            }
        }
    }, 150);
}

// 2. Aura Drift - 3D Dinamika
function updateAuraDrift(emotion, intensity) {
    if (!auraMesh) return;

    // Spalvų žemėlapis pagal emocijas
    const emotionColors = {
        happy: 0x00ffcc,   // Cyan aura
        sad: 0x1a237e,     // Deep blue
        angry: 0xff1744,   // Red drift
        surprised: 0xffff00, // Yellow glow
        neutral: 0x00e5ff  // Standard neon blue
    };

    // Keičiame 3D objekto savybes realiu laiku
    const targetColor = new THREE.Color(emotionColors[emotion] || 0x00e5ff);
    auraMesh.material.emissive.lerp(targetColor, 0.1);
    
    // Drift (judėjimo) greitis priklauso nuo emocijos intensyvumo
    const driftSpeed = 0.005 + (intensity * 0.05);
    auraMesh.rotation.x += driftSpeed;
    auraMesh.rotation.y += driftSpeed;

    // Objekto pulsavimas atitinka tariamą pulsą
    const scale = 1 + (Math.sin(Date.now() * 0.005) * 0.05 * intensity);
    auraMesh.scale.set(scale, scale, scale);
}

// 3. UI Atnaujinimas
function updateUI() {
    document.getElementById('emotion').innerText = state.emotion.toUpperCase();
    
    // Pulso simuliacija: emocinis susijaudinimas didina BPM
    const basePulse = 65;
    const dynamicPulse = basePulse + (state.intensity * 35);
    document.getElementById('pulse').innerText = Math.round(dynamicPulse);
}

// Paleidimas
window.onload = () => {
    initThree(); // Funkcija iš pirmo atsakymo
    initNeuralEngine();
};

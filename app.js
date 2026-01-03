// NEURO-SYNC CORE
async function runNeuroLink() {
    // 1. Įkrauname modelius iš CDN (jokių serverių nereikia)
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

    const video = document.getElementById('video');

    // 2. Pagrindinis ciklas (Main Loop)
    async function onPlay() {
        const result = await faceapi.detectSingleFace(video, 
            new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();

        if (result) {
            const emotion = getDominantEmotion(result.expressions);
            const intensity = result.expressions[emotion];

            // --- ČIA VYKSTA SUJUNGIMAS ---
            // Emocija valdo spalvą, intensyvumas valdo 3D 'Driftą'
            updateAuraVisuals(emotion, intensity);
            updatePulseLogic(intensity);
            // -----------------------------
        }
        
        requestAnimationFrame(onPlay);
    }

    onPlay();
}

function getDominantEmotion(expressions) {
    return Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
}

function updateAuraVisuals(emotion, intensity) {
    // Aura reaguoja į AI modelio rezultatus
    const colors = {
        happy: 0x00FFCC,
        angry: 0xFF3300,
        sad: 0x0033FF,
        surprised: 0xFFCC00,
        neutral: 0x4FC3F7
    };

    // 'Drift' efektas: kuo stipresnė emocija, tuo didesnis 3D objekto iškraipymas
    auraMesh.material.color.setHex(colors[emotion]);
    auraMesh.rotation.y += 0.01 + (intensity * 0.05);
    
    // Vizualinis pulsavimas pagal AI pasitikėjimo lygį
    const s = 1 + (intensity * 0.2);
    auraMesh.scale.set(s, s, s);
}

// Paleidžiame visą grandinę
runNeuroLink();

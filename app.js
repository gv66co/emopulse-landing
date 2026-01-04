/* --- GLOBALŪS KINTAMIEJI --- */
let scene, camera, renderer, core, rings = [];
let systemActive = false;
let analysisData = [];
const ANALYSIS_THRESHOLD = 150; 
const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

// Emocijų temos (Spalva ir intensyvumas)
const EMOTION_THEMES = {
    neutral:  { color: 0x00e5ff, speed: 0.005, scale: 1.0 },
    happy:    { color: 0x00ff88, speed: 0.015, scale: 1.3 },
    sad:      { color: 0x0066ff, speed: 0.002, scale: 0.9 },
    angry:    { color: 0xff3300, speed: 0.040, scale: 1.2 },
    surprised:{ color: 0xffdd00, speed: 0.020, scale: 1.4 }
};

/* --- 1. ŠVELNUS BALSAS --- */
function speak(text) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const softVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Zira'));
    
    if (softVoice) utter.voice = softVoice;
    utter.pitch = 1.1; utter.rate = 0.85;
    synth.speak(utter);

    const comms = document.getElementById('ai-comms');
    if(comms) comms.innerText = "> ANALYSIS: " + text;
}

/* --- 2. 3D BRANDUOLIO INICIALIZACIJA --- */
function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 2));

    // Branduolys
    const geometry = new THREE.IcosahedronGeometry(2.5, 15);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.5 
    });
    core = new THREE.Mesh(geometry, material);
    scene.add(core);

    // Pridedame orbitalinius žiedus geresniam efektui
    for(let i=0; i<2; i++) {
        const rGeo = new THREE.TorusGeometry(4 + i, 0.01, 16, 100);
        const rMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.2 });
        const ring = new THREE.Mesh(rGeo, rMat);
        rings.push(ring);
        scene.add(ring);
    }

    camera.position.z = 10;

    function animate() {
        requestAnimationFrame(animate);
        if (core) {
            core.rotation.y += 0.005;
            rings.forEach((r, i) => r.rotation.z += 0.002 * (i + 1));
        }
        renderer.render(scene, camera);
    }
    animate();
}

/* --- 3. DINAMINĖS AUROS ATNAUJINIMAS --- */
function updateVisuals(emotion, intensity) {
    if (!core) return;
    const theme = EMOTION_THEMES[emotion] || EMOTION_THEMES.neutral;

    // Spalvos perėjimas (lerp)
    core.material.color.lerp(new THREE.Color(theme.color), 0.05);
    
    // Mastelio pulsacija pagal intensyvumą
    const pulse = 1 + (Math.sin(Date.now() * 0.005) * 0.05);
    const targetScale = theme.scale * pulse;
    core.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Drebulys (drift) jei emocija stipri (stresas/pyktis)
    if (intensity > 0.7 && (emotion === 'angry' || emotion === 'surprised')) {
        core.position.x = (Math.random() - 0.5) * 0.1;
        core.position.y = (Math.random() - 0.5) * 0.1;
    } else {
        core.position.set(0, 0, 0);
    }
}

/* --- 4. GEOMETRINIS TINKLAS --- */
function drawNeurolink(landmarks) {
    const canvas = document.getElementById('face-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pts = landmarks.positions;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
            if (dist < 30) {
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(pts[j].x, pts[j].y);
            }
        }
    }
    ctx.stroke();
}

/* --- 5. PAGRINDINIS AI CIKLAS --- */
async function initSystem() {
    if (systemActive) return;
    const comms = document.getElementById('ai-comms');
    const btn = document.getElementById('scan-trigger');
    if (btn) btn.disabled = true;

    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        const video = document.getElementById('video-feed');
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            const canvas = document.getElementById('face-canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            systemActive = true;
            speak("Neural interface online. Commencing biometric scan.");
            runAI();
        };
    } catch (err) {
        if (comms) comms.innerText = "> ERROR: SENSOR ACCESS DENIED.";
        if (btn) btn.disabled = false;
    }
}

async function runAI() {
    const video = document.getElementById('video-feed');
    const bpmEl = document.getElementById('bpm-val');

    setInterval(async () => {
        if (!systemActive) return;

        // Naudojame 416 inputSize geresniam tikslumui
        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
            .withFaceLandmarks()
            .withFaceExpressions();

        if (result) {
            drawNeurolink(result.landmarks);
            const expressions = result.expressions;
            const top = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
            const intensity = expressions[top];

            // Atnaujiname UI
            const emoEl = document.getElementById('emo-val');
            if (emoEl) emoEl.innerText = top.toUpperCase();

            // Simuliuojame BPM (pagal stresą/džiaugsmą)
            if (bpmEl) {
                const baseBpm = 65;
                const stressBonus = (expressions.angry + expressions.surprised + expressions.happy) * 30;
                bpmEl.innerText = Math.round(baseBpm + stressBonus);
            }

            // Atnaujiname 3D branduolį
            updateVisuals(top, intensity);
            
            // Analizė
            performDeepAnalysis(top);
        }
    }, 100);
}

function performDeepAnalysis(currentEmotion) {
    analysisData.push(currentEmotion);
    const progress = Math.round((analysisData.length / ANALYSIS_THRESHOLD) * 100);
    const driftEl = document.getElementById('drift-val');
    const progEl = document.getElementById('prog-val'); // Jei turi progreso ID
    
    if (driftEl) driftEl.innerText = `SYNCING: ${progress}%`;
    if (progEl) progEl.innerText = `${progress}%`;

    if (analysisData.length >= ANALYSIS_THRESHOLD) {
        const counts = {};
        analysisData.forEach(e => counts[e] = (counts[e] || 0) + 1);
        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const reports = {
            happy: "Neural harmony achieved. Your resonance is optimal.",
            neutral: "State: Balanced. All biometric markers are within normal range.",
            sad: "Low frequency detected. Focus on the core light for recalibration.",
            angry: "Neural friction detected. Orbital rings stabilizing your aura now.",
            surprised: "Synaptic spike identified. Your neural field is expanding."
        };

        speak(reports[dominant] || "Analysis complete.");
        analysisData = [];
    }
}

window.onload = () => {
    init3D();
    window.speechSynthesis.getVoices();
};

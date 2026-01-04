/* --- GLOBALŪS KINTAMIEJI --- */
let scene, camera, renderer, core;
let systemActive = false;
let analysisData = [];
const ANALYSIS_THRESHOLD = 150; // ~15 sek. analizės ciklas
const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

/* --- 1. ŠVELNUS BALSAS IR KOMUNIKACIJA --- */
function speak(text) {
    const synth = window.speechSynthesis;
    synth.cancel(); // Nutildome ankstesnį tekstą, kad nesidubliuotų
    
    const utter = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    
    // Ieškome geriausio prieinamo balso
    const softVoice = voices.find(v => 
        v.name.includes('Google UK English Female') || 
        v.name.includes('Zira') || 
        v.name.includes('Samantha')
    );
    
    if (softVoice) utter.voice = softVoice;
    utter.lang = 'en-US';
    utter.pitch = 1.1; 
    utter.rate = 0.85; 
    
    synth.speak(utter);
    
    // Tekstas AI skydelyje pagal tavo CSS (.ai-assistant / #ai-comms)
    const comms = document.getElementById('ai-comms');
    if(comms) comms.innerText = "> ANALYSIS: " + text;
}

/* --- 2. 3D BRANDUOLIO INICIALIZACIJA (Three.js) --- */
function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Šviesos
    const light = new THREE.PointLight(0x00e5ff, 15, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Geometrinis branduolys
    const geometry = new THREE.IcosahedronGeometry(2.5, 15);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00e5ff, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.4 
    });
    core = new THREE.Mesh(geometry, material);
    scene.add(core);

    camera.position.z = 8;

    function animate() {
        requestAnimationFrame(animate);
        core.rotation.y += 0.005;
        core.rotation.x += 0.002;
        renderer.render(scene, camera);
    }
    animate();
}

/* --- 3. GEOMETRINIS VEIDO TINKLAS (NEUROLINK) --- */
function drawNeurolink(landmarks) {
    const canvas = document.getElementById('face-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const pts = landmarks.positions;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 0.5;

    // Jungiame taškus linijomis, kad sukurtume tinklą
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
            // Jungiame tik artimus taškus (pvz. < 30px atstumu)
            if (dist < 30) {
                ctx.moveTo(pts[i].x, pts[i].y);
                ctx.lineTo(pts[j].x, pts[j].y);
            }
        }
    }
    ctx.stroke();

    // Piešiame pačius mazgus (taškus)
    ctx.fillStyle = '#00e5ff';
    pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
    });
}

/* --- 4. GILIOJI ANALIZĖ --- */
function performDeepAnalysis(currentEmotion) {
    analysisData.push(currentEmotion);

    // Progresas dešinėje panelėje (pagal tavo CSS #drift-val)
    const progress = Math.round((analysisData.length / ANALYSIS_THRESHOLD) * 100);
    const driftEl = document.getElementById('drift-val');
    if (driftEl) driftEl.innerText = `SCANNING ${progress}%`;

    if (analysisData.length >= ANALYSIS_THRESHOLD) {
        const counts = {};
        analysisData.forEach(e => counts[e] = (counts[e] || 0) + 1);
        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const reports = {
            happy: "Neural resonance is harmonized. I detect a sustained state of well-being.",
            neutral: "Your bio-signature is perfectly stable. Mind-body connection is in equilibrium.",
            sad: "I've detected some lower frequency shifts. Please focus on steady breathing.",
            angry: "Neural friction identified. Initiating orbital stabilization to calm your aura.",
            surprised: "Heightened cognitive alertness detected. Your neural field is expanding."
        };

        speak(reports[dominant] || `Neural scan complete. Your primary state is ${dominant}.`);
        analysisData = []; // Resetiname kitam ciklui
    }
}

/* --- 5. PAGRINDINIS PALEIDIMAS --- */
async function initSystem() {
    if (systemActive) return;
    
    const comms = document.getElementById('ai-comms');
    const btn = document.getElementById('scan-trigger');
    if (btn) btn.disabled = true;
    if (comms) comms.innerText = "> INITIALIZING NEURAL LINK...";

    try {
        // Krauname visus reikiamus modelius
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
            if (comms) comms.innerText = "> SYSTEM ACTIVE. COMMENCING SCAN.";
            runAI();
        };
    } catch (err) {
        console.error(err);
        if (comms) comms.innerText = "> ERROR: SENSOR ACCESS DENIED.";
        if (btn) btn.disabled = false;
    }
}

async function runAI() {
    const video = document.getElementById('video-feed');

    setInterval(async () => {
        if (!systemActive) return;

        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceLandmarks()
            .withFaceExpressions();

        if (result) {
            // Vizualizacija
            drawNeurolink(result.landmarks);
            
            // Emocijų nustatymas
            const top = Object.keys(result.expressions).reduce((a, b) => 
                result.expressions[a] > result.expressions[b] ? a : b
            );

            // Atnaujiname kairę panelę (#emo-val)
            const emoEl = document.getElementById('emo-val');
            if (emoEl) emoEl.innerText = top.toUpperCase();

            // Vykdome ilgalaikę analizę
            performDeepAnalysis(top);
        }
    }, 100);
}

// Pradedame 3D fone iškart užsikrovus puslapiui
window.onload = () => {
    init3D();
    window.speechSynthesis.getVoices(); // Išankstinis balsų paruošimas
};

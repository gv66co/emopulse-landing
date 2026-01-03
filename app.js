let scene, camera, renderer, aura, stars;
let systemActive = false;
let analysisData = []; 
let lastSpeechTime = 0;
const ANALYSIS_THRESHOLD = 150; // Kiek kadrų analizuoti prieš pasakant išvadą (~15 sek.)

// 1. ŠVELNUS MOTERIŠKAS BALSAS IR TIKSINGA KOMUNIKACIJA
function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    
    // Bandome rasti švelnesnį moterišką balsą (priklauso nuo naršyklės)
    const voices = synth.getVoices();
    // Ieškome balsų pavadinimuose "Google UK English Female", "Microsoft Zira" arba tiesiog "female"
    const softVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira'));
    
    if (softVoice) utter.voice = softVoice;
    
    utter.lang = 'en-US';
    utter.pitch = 1.1; // Šiek tiek aukštesnis tonas suteikia švelnumo
    utter.rate = 0.85; // Lėtesnis tempas skamba ramiau ir profesionaliau
    
    synth.speak(utter);
    document.getElementById('ai-comms').innerText = "> IA ANALIZĖ: " + text;
}

// 2. GALUTINĖ ANALIZĖ (Tylėjimo logika)
function performDeepAnalysis(currentEmotion) {
    const now = Date.now();
    analysisData.push(currentEmotion);

    // Rodyti procesą HUD skydelyje (vizualiai)
    const progress = Math.round((analysisData.length / ANALYSIS_THRESHOLD) * 100);
    document.getElementById('drift-val').innerText = `ANALYZING ${progress}%`;

    // Tik kai sukaupta pakankamai duomenų
    if (analysisData.length >= ANALYSIS_THRESHOLD) {
        // Surandame vyraujančią emociją per visą laikotarpį
        const counts = {};
        analysisData.forEach(e => counts[e] = (counts[e] || 0) + 1);
        const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        // IA prabyla tik dabar
        const reports = {
            happy: "Your neural resonance is harmonized. I detect a sustained state of well-being.",
            neutral: "Your bio-signature is perfectly stable. Mind-body connection is in equilibrium.",
            sad: "I've detected some lower frequency shifts. Please focus on steady breathing for recalibration.",
            angry: "Neural friction identified. Initiating orbital stabilization to calm your aura.",
            surprised: "Heightened cognitive alertness detected. Your neural field is expanding."
        };

        speak(reports[dominant] || `Neural scan complete. Your primary state is ${dominant}.`);
        
        // Išvalome duomenis kitam ciklui
        analysisData = [];
        lastSpeechTime = now;
    }
}

// 3. VEIDO TINKLAS (NEUROLINK) IR ANALIZĖS CIKLAS
async function runAI() {
    setupNeurolinkCanvas(); // Naudojame iš ankstesnio kodo
    const video = document.getElementById('video-feed');
    
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    setInterval(async () => {
        if(!systemActive) return;
        
        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                    .withFaceLandmarks()
                                    .withFaceExpressions();
        
        if (result) {
            // Piešiame 68 taškų tinklą (Neurolink)
            drawNeurolink(result.landmarks); 
            
            // Atnaujiname skales (tik vizualiai, be garso)
            updateScales(result.expressions);
            
            const top = Object.keys(result.expressions).reduce((a, b) => result.expressions[a] > result.expressions[b] ? a : b);
            
            // Pagrindiniai HUD skaičiai
            document.getElementById('emo-val').innerText = top.toUpperCase();
            
            // Vykdome kaupiamąją analizę
            performDeepAnalysis(top);
        }
    }, 100);
}

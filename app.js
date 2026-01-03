import { initCompass3D, updateCompass3D } from './compas3d-v2.js';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

async function setupAI() {
    initCompass3D(); // Paleidžiame 3D Branduolį

    const video = document.getElementById('cam');
    const canvasElement = document.getElementById('face-mesh-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const drawingUtils = new DrawingUtils(canvasCtx);

    // 1. Krovimas iš CDN (ištaiso 404 klaidas)
    const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO"
    });

    // 2. Kameros paleidimas
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
    });
    video.srcObject = stream;

    video.addEventListener('loadeddata', () => {
        // FUNKCIJA: Sutvarkome drobės dydį pagal tai, kaip video atrodo ekrane
        const resizeCanvas = () => {
            canvasElement.width = video.offsetWidth;
            canvasElement.height = video.offsetHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        function predict() {
            const results = faceLandmarker.detectForVideo(video, performance.now());

            // Išvalome drobę prieš kiekvieną nupiešimą
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                for (const landmarks of results.faceLandmarks) {
                    // Piešiame tinklelį (sumažintas ryškumas iki #00f2ff22, kad neatrodytų perkrauta)
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { 
                        color: "#00f2ff22", 
                        lineWidth: 1 
                    });
                }

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const shapes = results.faceBlendshapes[0].categories;
                    
                    // Emocijų skaičiavimas
                    const smile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
                    const stress = shapes.find(s => s.categoryName === "browDownLeft")?.score || 0;
                    const energy = shapes.find(s => s.categoryName === "eyeWideLeft")?.score || 0;
                    
                    // --- UI ATNAUJINIMAS ---
                    
                    // Neural Drift (simuliuojame nedidelį svyravimą dėl gyvumo)
                    const drift = (0.842 + (Math.random() * 0.005)).toFixed(3);
                    const driftElem = document.getElementById('neural-drift-val');
                    if(driftElem) driftElem.innerText = "+" + drift;

                    // Emopulse Score
                    const scoreElem = document.getElementById('scoreValue');
                    if(scoreElem) scoreElem.innerText = Math.round(70 + (smile * 20) - (stress * 10));

                    // Energy
                    const energyElem = document.getElementById('energy');
                    if(energyElem) energyElem.innerText = (0.60 + (energy * 0.4)).toFixed(2);
                    
                    // Stress Risk vizualas
                    const stressText = document.getElementById('stress-lvl');
                    const aiMsg = document.getElementById('aiText');

                    if (stress > 0.25) {
                        if(stressText) { stressText.innerText = "Elevated"; stressText.style.color = "#f87171"; }
                        if(aiMsg) aiMsg.innerText = "Elevated Stress Detected";
                    } else {
                        if(stressText) { stressText.innerText = "Low"; stressText.style.color = "#4ade80"; }
                        if(aiMsg) aiMsg.innerText = "System Synchronized";
                    }

                    // 3. Judiname 3D adatą (šypsena suka į dešinę, stresas į kairę)
                    updateCompass3D((smile - stress) * 1.5);
                }
            }
            requestAnimationFrame(predict);
        }
        predict();
    });
}

setupAI();

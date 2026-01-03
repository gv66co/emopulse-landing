import { initCompass3D, updateCompass3D } from './compas3d-v2.js';

// Naudojame oficialų MediaPipe sprendimą per CDN, kad išvengtume 404 klaidų
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

async function startSystem() {
    // 1. Paleidžiame 3D Branduolį
    initCompass3D();

    const video = document.getElementById('cam');
    const aiText = document.getElementById('aiText');
    const statusDot = document.querySelector('.live-dot');
    
    try {
        // 2. Ruošiame MediaPipe Fileset (tai ištaisys tavo 404 klaidą)
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO"
        });

        // 3. Paleidžiame kamerą
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 } 
        });
        video.srcObject = stream;

        video.addEventListener('loadeddata', async () => {
            if (statusDot) statusDot.style.background = "#00f2ff";
            aiText.innerText = "Neural core synchronized. Monitoring field...";
            
            // Pagrindinis aptikimo ciklas
            function predict() {
                const nowInMs = performance.now();
                const results = faceLandmarker.detectForVideo(video, nowInMs);

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const shapes = results.faceBlendshapes[0].categories;
                    
                    // Ištraukiame reikšmes analizei
                    const smile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
                    const browDown = shapes.find(s => s.categoryName === "browDownLeft")?.score || 0;
                    const eyesWide = shapes.find(s => s.categoryName === "eyeWideLeft")?.score || 0;

                    // Skaičiuojame logiką
                    const stressVal = (browDown * 1.5).toFixed(2);
                    const energyVal = (0.5 + eyesWide).toFixed(2);
                    const coherence = Math.round((1 - browDown + smile) * 50);

                    // Atnaujiname UI elementus
                    document.getElementById('scoreValue').innerText = coherence;
                    document.getElementById('score').innerText = coherence + "%";
                    document.getElementById('stress').innerText = stressVal;
                    document.getElementById('energy').innerText = energyVal;
                    document.getElementById('intensity').innerText = browDown > 0.2 ? "HIGH" : "NORMAL";
                    
                    // Judiname 3D adatą
                    const angle = (smile - browDown) * Math.PI;
                    updateCompass3D(angle);

                    // Dinaminis tekstas
                    if (browDown > 0.3) aiText.innerText = "Elevated stress detected. Adjusting neural core.";
                    else if (smile > 0.3) aiText.innerText = "Optimal coherence detected. Flow state active.";
                    else aiText.innerText = "System stable. Processing biometric drift.";
                }
                
                requestAnimationFrame(predict);
            }
            predict();
        });

    } catch (err) {
        console.error("Sistemos klaida:", err);
        aiText.innerText = "CRITICAL ERROR: AI Core failed to initialize.";
    }
}

startSystem();

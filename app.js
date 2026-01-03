import { initCompass3D, updateCompass3D } from './compas3d-v2.js';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

async function setupAI() {
    initCompass3D(); // Paleidžiame 3D Branduolį centre

    const video = document.getElementById('cam');
    const canvasElement = document.getElementById('face-mesh-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const drawingUtils = new DrawingUtils(canvasCtx);

    // Naudojame CDN, kad išvengtume 404 klaidų
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

    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
    });
    video.srcObject = stream;

    video.addEventListener('loadeddata', () => {
        // FUNKCIJA: Užtikrina, kad tinklelis būtų TIKSLIAI ant vaizdo
        const resizeCanvas = () => {
            canvasElement.width = video.offsetWidth;
            canvasElement.height = video.offsetHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        function predict() {
            const results = faceLandmarker.detectForVideo(video, performance.now());
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // Piešiame tinklelį
                for (const landmarks of results.faceLandmarks) {
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { 
                        color: "#00f2ff22", 
                        lineWidth: 1 
                    });
                }

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const shapes = results.faceBlendshapes[0].categories;
                    
                    // Ištraukiame biometrinius duomenis
                    const smile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
                    const stress = shapes.find(s => s.categoryName === "browDownLeft")?.score || 0;
                    const energy = shapes.find(s => s.categoryName === "eyeWideLeft")?.score || 0;
                    
                    // --- Atnaujiname tavo HTML elementus ---

                    // 1. Emopulse Score
                    const score = Math.round(70 + (smile * 25) - (stress * 15));
                    document.getElementById('scoreValue').innerText = score;

                    // 2. Energy
                    document.getElementById('energy').innerText = (0.50 + (energy * 0.5)).toFixed(2);

                    // 3. Stress Risk (su spalvos keitimu)
                    const stressText = document.getElementById('stress-lvl');
                    if (stress > 0.3) {
                        stressText.innerText = "Elevated";
                        stressText.className = "val stress-high"; // Pridėk šią klasę CSS raudonai spalvai
                        stressText.style.color = "#f87171";
                    } else {
                        stressText.innerText = "Low";
                        stressText.className = "val stress-low";
                        stressText.style.color = "#4ade80";
                    }

                    // 4. Neural Drift (dinamiškas skaičius)
                    const driftVal = (0.840 + (Math.random() * 0.005)).toFixed(3);
                    document.getElementById('neural-drift-val').innerText = "+" + driftVal;

                    // 5. AI Summary tekstas
                    const aiMsg = document.getElementById('aiText');
                    if (stress > 0.3) aiMsg.innerText = "Neural turbulence detected. High stress risk.";
                    else if (smile > 0.2) aiMsg.innerText = "Coherence optimal. Flow state active.";
                    else aiMsg.innerText = "System synchronized. Monitoring field...";

                    // 6. Judiname 3D Core (Compass)
                    updateCompass3D((smile - stress) * 1.5);
                }
            }
            requestAnimationFrame(predict);
        }
        predict();
    });
}

setupAI();

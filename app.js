import { initCompass3D, updateCompass3D } from './compas3d-v2.js';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

async function setupAI() {
    initCompass3D(); // Paleidžiame 3D

    const video = document.getElementById('cam');
    const canvasElement = document.getElementById('face-mesh-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const drawingUtils = new DrawingUtils(canvasCtx);

    // SUTVARKYTA: Krauname WASM iš CDN, kad nebūtų 404 kairų
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

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.addEventListener('loadeddata', () => {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        
        function predict() {
            const results = faceLandmarker.detectForVideo(video, performance.now());

            if (results.faceLandmarks) {
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                
                for (const landmarks of results.faceLandmarks) {
                    // Piešiame tą gražų tinklelį ant veido kaip tavo nuotraukose
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#00f2ff33", lineWidth: 1 });
                }

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const shapes = results.faceBlendshapes[0].categories;
                    
                    // Logika rodmenims
                    const smile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
                    const stress = shapes.find(s => s.categoryName === "browDownLeft")?.score || 0;
                    
                    // Atnaujiname UI
                    const drift = (0.842 + (Math.random() * 0.01)).toFixed(3);
                    document.getElementById('neural-drift-val').innerText = "+" + drift;
                    document.getElementById('scoreValue').innerText = Math.round(76 + (smile * 10));
                    
                    const stressText = document.getElementById('stress-lvl');
                    if (stress > 0.2) {
                        stressText.innerText = "Elevated";
                        stressText.style.color = "#f87171";
                        document.getElementById('aiText').innerText = "Elevated Stress Detected";
                    } else {
                        stressText.innerText = "Low";
                        stressText.style.color = "#4ade80";
                        document.getElementById('aiText').innerText = "System Synchronized";
                    }

                    // Judiname 3D adatą
                    updateCompass3D((smile - stress) * 2);
                }
            }
            requestAnimationFrame(predict);
        }
        predict();
    });
}

setupAI();

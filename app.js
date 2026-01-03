import { initCompass3D, updateCompass3D } from './compas3d-v2.js';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const UI = {
    score: document.getElementById('scoreValue'),
    energy: document.getElementById('energy'),
    stress: document.getElementById('stress-lvl'),
    drift: document.getElementById('neural-drift-val'),
    msg: document.getElementById('aiText')
};

async function initializeNeuralCore() {
    initCompass3D();

    const video = document.getElementById('cam');
    const canvas = document.getElementById('face-mesh-canvas');
    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);

    // Klaidų prevencija: krauname WASM iš patikimo CDN
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO"
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    video.srcObject = stream;

    video.onloadeddata = () => {
        // DINAMINIS MASTELIS: Sulygiuojame Canvas su CSS rėmeliu
        const syncResolution = () => {
            canvas.width = video.offsetWidth;
            canvas.height = video.offsetHeight;
        };
        window.onresize = syncResolution;
        syncResolution();

        const processFrame = () => {
            const startTimeMs = performance.now();
            const results = landmarker.detectForVideo(video, startTimeMs);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks?.[0]) {
                // Piešiame Hi-Tech tinklelį
                drawingUtils.drawConnectors(results.faceLandmarks[0], FaceLandmarker.FACE_LANDMARKS_TESSELATION, 
                    { color: "#00f2ff22", lineWidth: 1 });

                if (results.faceBlendshapes?.[0]) {
                    const shapes = results.faceBlendshapes[0].categories;
                    updateUI(shapes);
                }
            }
            requestAnimationFrame(processFrame);
        };
        processFrame();
    };
}

function updateUI(shapes) {
    const smile = shapes.find(s => s.categoryName === "mouthSmileLeft")?.score || 0;
    const stress = shapes.find(s => s.categoryName === "browDownLeft")?.score || 0;
    
    // Progresyvūs skaičiavimai
    const currentScore = Math.round(70 + (smile * 20) - (stress * 15));
    const drift = (0.842 + (Math.random() * 0.004)).toFixed(3);

    if(UI.score) UI.score.innerText = currentScore;
    if(UI.drift) UI.drift.innerText = "+" + drift;
    
    // Stress lygio indikacija
    if (stress > 0.25) {
        UI.stress.innerText = "Elevated";
        UI.stress.style.color = "#f87171";
        UI.msg.innerText = "Neural Stress Detected";
    } else {
        UI.stress.innerText = "Low";
        UI.stress.style.color = "#4ade80";
        UI.msg.innerText = "System Synchronized";
    }

    updateCompass3D((smile - stress) * 2);
}

initializeNeuralCore();

import { initAura, updateAura } from './compas3d-v2.js';
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let faceLandmarker;
let video;
const aiText = document.getElementById('ai-text');

async function init() {
    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO"
        });

        initAura();
        
        video = document.getElementById('v-stream');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onloadeddata = () => {
            document.getElementById('sys-load').innerText = "CORE_ENGINE: ACTIVE";
            aiText.innerText = "System Synchronized. Monitoring emotions.";
            loop();
        };
    } catch (e) {
        aiText.innerText = "Error: " + e.message;
    }
}

function loop() {
    const results = faceLandmarker.detectForVideo(video, performance.now());

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const categories = results.faceBlendshapes[0].categories;
        
        const smile = categories.find(c => c.categoryName === 'mouthSmileLeft').score;
        const browDown = categories.find(c => c.categoryName === 'browDownLeft').score;
        const eyesWide = categories.find(c => c.categoryName === 'eyeWideLeft').score;

        // UI Updates
        document.getElementById('score-ui').innerText = Math.round(smile * 100) + "%";
        document.getElementById('drift-ui').innerText = (0.842 + Math.random() * 0.01).toFixed(3);
        
        let mood = "NEUTRAL";
        let auraColor = 0x00f2ff;

        if (smile > 0.4) { mood = "HAPPY"; auraColor = 0xffe600; }
        else if (browDown > 0.2) { mood = "STRESSED"; auraColor = 0xff4444; }
        else if (eyesWide > 0.3) { mood = "SURPRISED"; auraColor = 0xff00ff; }

        document.getElementById('mood-ui').innerText = mood;
        document.getElementById('stress-ui').innerText = browDown > 0.2 ? "HIGH" : "LOW";
        document.getElementById('stress-ui').style.color = browDown > 0.2 ? "#ff4444" : "#4ade80";

        updateAura(auraColor, smile, browDown);
    }
    requestAnimationFrame(loop);
}

init();

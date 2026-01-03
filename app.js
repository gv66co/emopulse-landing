import * as THREE from 'three';
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

let scene, camera, renderer, aura, faceLandmarker, video;
let targetScale = 1;
let currentMoodColor = new THREE.Color(0x00f2ff);

async function bootstrap() {
    // 3D Scene based on Particle Physics
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('nebula'), antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Aura: Procedural Blob (Based on Perlin Noise research)
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
        emissive: 0x00f2ff,
        emissiveIntensity: 2
    });
    aura = new THREE.Mesh(geometry, material);
    scene.add(aura);

    const light = new THREE.PointLight(0x7d2ae8, 20, 100);
    light.position.set(10, 10, 10);
    scene.add(light);
    camera.position.z = 5;

    // Neural Setup
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO"
    });

    video = document.getElementById('input-stream');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    video.srcObject = stream;
    video.onloadeddata = run;
}

function run() {
    const results = faceLandmarker.detectForVideo(video, performance.now());
    
    if (results.faceBlendshapes?.[0]) {
        const shapes = results.faceBlendshapes[0].categories;
        const joy = shapes.find(s => s.categoryName === 'mouthSmileLeft').score;
        const anger = shapes.find(s => s.categoryName === 'browDownLeft').score;
        const surprise = shapes.find(s => s.categoryName === 'eyeWideLeft').score;

        // Neural Drift Logic
        targetScale = 1 + (joy * 1.5) - (anger * 0.5);
        aura.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        
        // Color transition based on research into Color-Emotion mapping
        if (joy > 0.4) currentMoodColor.setHex(0xffe600); // Joy
        else if (anger > 0.2) currentMoodColor.setHex(0xff0044); // Stress
        else if (surprise > 0.3) currentMoodColor.setHex(0x00ff88); // Wonder
        else currentMoodColor.setHex(0x00f2ff); // Flow

        aura.material.color.lerp(currentMoodColor, 0.05);
        aura.material.emissive.lerp(currentMoodColor, 0.05);

        // Update UI
        document.getElementById('coherence').innerText = (joy * 10).toFixed(2);
        document.getElementById('drift').innerText = anger > 0.2 ? "STRESSED" : "SYNCED";
    }

    aura.rotation.y += 0.01;
    aura.rotation.z += 0.005;
    
    renderer.render(scene, camera);
    requestAnimationFrame(run);
}

bootstrap();

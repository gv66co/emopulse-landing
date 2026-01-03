import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let canvas, coreSphere, glowMesh, compassNeedleGroup;
let orbitRings = [];
let particles = [];
let needleTargetRotation = 0;

export function initCompass3D() {
    canvas = document.getElementById("compass3d");
    if (!canvas) return;

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);

    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 7);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- CONTROLS ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;

    // --- CENTRAL CORE ---
    const coreGeometry = new THREE.SphereGeometry(1, 64, 64);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x3abff8,
        emissive: 0x000000,
        roughness: 0.2,
        metalness: 0.9
    });
    coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreSphere);

    // --- GLOW EFFECT ---
    const glowGeometry = new THREE.SphereGeometry(1.2, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x3abff8,
        transparent: true,
        opacity: 0.1
    });
    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // --- ORBITAL RINGS ---
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x7b5cff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.RingGeometry(1.5 + i * 0.4, 1.55 + i * 0.4, 64);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        orbitRings.push(ring);
    }

    // --- STARFIELD PARTICLES ---
    const pGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    const pMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 150; i++) {
        const p = new THREE.Mesh(pGeometry, pMaterial);
        p.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        scene.add(p);
        particles.push({ mesh: p, speed: Math.random() * 0.005 });
    }

    // --- COMPASS NEEDLE ---
    compassNeedleGroup = new THREE.Group();
    const needleGeom = new THREE.ConeGeometry(0.12, 1.2, 4); // Pyramid shape
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 1, roughness: 0.1 });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    
    needle.position.z = 2.2; // Move it out to the edge
    needle.rotation.x = Math.PI / 2; // Point it towards the center
    compassNeedleGroup.add(needle);
    scene.add(compassNeedleGroup);

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pointLight = new THREE.PointLight(0x3abff8, 2, 20);
    pointLight.position.set(2, 5, 2);
    scene.add(pointLight);

    // --- POST-PROCESSING (BLOOM) ---
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
        1.5, 0.4, 0.85
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // --- HANDLE RESIZE ---
    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
}

export function updateCompass3D(angle) {
    // Kampo normalizavimas
    needleTargetRotation = angle;
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Animations
    coreSphere.rotation.y += 0.005;
    coreSphere.position.y = Math.sin(time) * 0.1; // Gentle float
    glowMesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

    orbitRings.forEach((ring, i) => {
        ring.rotation.z += 0.002 * (i + 1);
        ring.rotation.y = Math.sin(time * 0.5 + i) * 0.1;
    });

    particles.forEach(p => {
        p.mesh.position.y += Math.sin(time + p.mesh.position.x) * 0.002;
    });

    // Smooth needle movement (Lerp)
    compassNeedleGroup.rotation.y += (needleTargetRotation - compassNeedleGroup.rotation.y) * 0.05;

    // Dynamic Color (Melsva -> Violetinė -> Geltona)
    const colorIntensity = Math.abs(needleTargetRotation) / Math.PI;
    coreSphere.material.color.lerpColors(
        new THREE.Color(0x3abff8), 
        new THREE.Color(0xf87171), 
        colorIntensity
    );

    controls.update();
    composer.render();
}

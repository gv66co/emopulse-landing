// Naudojame trumpus pavadinimus, kuriuos nustatėme Import Map (index.html)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer, controls;
let canvas, coreSphere, glowMesh, compassNeedleGroup;
let orbitRings = [];
let particles = [];
let needleTargetRotation = 0;
let isInitialized = false;

/**
 * Inicijuoja 3D kompaso sceną
 */
export function initCompass3D() {
    if (isInitialized) return;
    
    canvas = document.getElementById("compass3d");
    if (!canvas) {
        console.error("3D Canvas elementas nerastas!");
        return;
    }

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    scene.background = null; // Leidžiame matytis CSS fonui, jei reikia (alpha: true)

    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);

    renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true, 
        alpha: true, // Kad matytųsi gražus fonas iš CSS
        powerPreference: "high-performance" 
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- CONTROLS ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 12;

    // --- CENTRAL CORE (Emopulse branduolys) ---
    const coreGeometry = new THREE.SphereGeometry(1, 64, 64);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x3abff8,
        emissive: 0x0a1a2a,
        roughness: 0.1,
        metalness: 1.0
    });
    coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreSphere);

    // --- GLOW EFFECT ---
    const glowGeometry = new THREE.SphereGeometry(1.25, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x3abff8,
        transparent: true,
        opacity: 0.15
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
        const ringGeometry = new THREE.RingGeometry(1.6 + i * 0.4, 1.63 + i * 0.4, 64);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        orbitRings.push(ring);
    }

    // --- STARFIELD ---
    const pGeometry = new THREE.SphereGeometry(0.012, 8, 8);
    const pMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 150; i++) {
        const p = new THREE.Mesh(pGeometry, pMaterial);
        p.position.set(
            (Math.random() - 0.5) * 12, 
            (Math.random() - 0.5) * 12, 
            (Math.random() - 0.5) * 12
        );
        scene.add(p);
        particles.push({ mesh: p, offset: Math.random() * 100 });
    }

    // --- COMPASS NEEDLE GROUP ---
    compassNeedleGroup = new THREE.Group();
    const needleGeom = new THREE.ConeGeometry(0.15, 1.4, 4); 
    const needleMat = new THREE.MeshStandardMaterial({ 
        color: 0xfbbf24, 
        emissive: 0x443300,
        metalness: 1, 
        roughness: 0.2 
    });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    
    needle.position.z = 2.5; 
    needle.rotation.x = Math.PI / 2; 
    compassNeedleGroup.add(needle);
    scene.add(compassNeedleGroup);

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pointLight = new THREE.PointLight(0x3abff8, 15, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // --- POST-PROCESSING ---
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
        1.8,  // Bloom strength
        0.5,  // Radius
        0.85  // Threshold
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    window.addEventListener('resize', onWindowResize);
    isInitialized = true;
    animate();
}

function onWindowResize() {
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
}

/**
 * Atnaujina kompaso adatos kampą (Radianais)
 */
export function updateCompass3D(angle) {
    needleTargetRotation = angle;
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // Branduolio animacija
    if(coreSphere) {
        coreSphere.rotation.y += 0.005;
        coreSphere.position.y = Math.sin(time * 0.8) * 0.15;
    }
    
    // Švytėjimo pulsavimas
    if(glowMesh) {
        const pulse = 1 + Math.sin(time * 2) * 0.08;
        glowMesh.scale.set(pulse, pulse, pulse);
    }

    // Žiedų sukimasis
    orbitRings.forEach((ring, i) => {
        ring.rotation.z += 0.003 * (i + 1);
        ring.rotation.x = (Math.PI / 2) + Math.sin(time * 0.5 + i) * 0.05;
    });

    // Dalelių judėjimas
    particles.forEach(p => {
        p.mesh.position.y += Math.sin(time + p.offset) * 0.0015;
    });

    // Sklandus adatos judėjimas (Lerp)
    if(compassNeedleGroup) {
        compassNeedleGroup.rotation.y += (needleTargetRotation - compassNeedleGroup.rotation.y) * 0.08;
    }

    // Dinaminė branduolio spalva
    if(coreSphere && glowMesh) {
        const colorIntensity = Math.min(1, Math.abs(needleTargetRotation) / Math.PI);
        coreSphere.material.color.lerpColors(
            new THREE.Color(0x3abff8), // Ramus
            new THREE.Color(0xf87171), // Įtemptas
            colorIntensity
        );
        glowMesh.material.color.copy(coreSphere.material.color);
    }

    controls.update();
    composer.render();
}

// Svarbu: Automatiškai inicijuojame, kai modulis užsikrauna
window.addEventListener('load', initCompass3D);

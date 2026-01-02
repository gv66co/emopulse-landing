import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";

let scene, camera, renderer, composer, controls;
let canvas;
let coreSphere, glowMesh;
let orbitRings = [];
let particles = [];
let emotionalNodes = [];
let compassNeedleGroup;
let targetRotation = 0;
let needleTargetRotation = 0;
let trajectoryPoints = [];
let trajectoryLine;

const TRAJECTORY_MAX = 100;

export function initCompass3D() {
  canvas = document.getElementById("compass3d");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);

  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 2, 6);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 10;

  const coreGeometry = new THREE.SphereGeometry(1, 64, 64);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x3abff8,
    emissive: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.7
  });
  coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(coreSphere);

  const glowGeometry = new THREE.SphereGeometry(1.2, 64, 64);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x3abff8,
    transparent: true,
    opacity: 0.15
  });
  glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  scene.add(glowMesh);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x7b5cff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 3; i++) {
    const ringGeometry = new THREE.RingGeometry(1.4 + i * 0.3, 1.45 + i * 0.3, 128);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    orbitRings.push(ring);
  }

  const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < 200; i++) {
    const p = new THREE.Mesh(particleGeometry, particleMaterial);
    p.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
    scene.add(p);
    particles.push(p);
  }

  const needleGeometry = new THREE.ConeGeometry(0.1, 1.5, 32);
  const needleMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.8,
    roughness: 0.2
  });

  const needle = new THREE.Mesh(needleGeometry, needleMaterial);
  needle.position.y = 1;
  needle.rotation.x = Math.PI;

  compassNeedleGroup = new THREE.Group();
  compassNeedleGroup.add(needle);
  scene.add(compassNeedleGroup);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(5, 5, 5);

  scene.add(ambient);
  scene.add(directional);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    1.2,
    0.4,
    0.85
  );

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  animate();
}

export function updateCompass3D(angle) {
  targetRotation = angle;
  needleTargetRotation = angle;
}

function animate() {
  requestAnimationFrame(animate);

  coreSphere.rotation.y += 0.002;
  glowMesh.rotation.y -= 0.001;

  orbitRings.forEach((ring, i) => {
    ring.rotation.z += 0.001 * (i + 1);
  });

  particles.forEach(p => {
    p.position.x += (Math.random() - 0.5) * 0.01;
    p.position.y += (Math.random() - 0.5) * 0.01;
    p.position.z += (Math.random() - 0.5) * 0.01;
  });

  compassNeedleGroup.rotation.y += (needleTargetRotation - compassNeedleGroup.rotation.y) * 0.05;

  controls.update();
  composer.render();
}

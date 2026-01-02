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

const TRAJECTORY_MAX = 160;

export function initCompass3D() {
  canvas = document.getElementById("compass3d");
  if (!canvas) {
    console.error("Canvas #compass3d not found");
    return;
  }

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3.2);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  addLights();
  setupPostProcessing();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;

  createCoreSphere();
  createGlowShell();
  createOrbitRings();
  createParticles();
  createEmotionalNodes();
  createCompassHousing();
  createCompassNeedle();
  initTrajectory();

  window.addEventListener("resize", resizeCompass3D);
  animateCompass3D();
}

function addLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 10, 6);
  scene.add(key);

  const fill = new THREE.PointLight(0x3abff8, 0.18, 20);
  fill.position.set(-4, 2, -3);
  scene.add(fill);

  const rim = new THREE.PointLight(0xfbbf24, 0.12, 20);
  rim.position.set(3, -2, 4);
  scene.add(rim);
}

function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    0.9,
    0.6,
    0.1
  );
  composer.addPass(bloomPass);
}

function resizeCompass3D() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
}

const GlowShader = {
  uniforms: {
    c: { value: 0.4 },
    p: { value: 2.4 },
    glowColor: { value: new THREE.Color(0x3abff8) },
    viewVector: { value: new THREE.Vector3(0, 0, 3) },
    intensityBoost: { value: 1.0 }
  },
  vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    uniform float intensityBoost;
    varying float intensity;
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 vNormel = normalize(normalMatrix * viewVector);
      intensity = pow(c - dot(vNormal, vNormel), p) * intensityBoost;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying float intensity;
    void main() {
      vec3 glow = glowColor * intensity;
      gl_FragColor = vec4(glow, intensity);
    }
  `
};

function createCoreSphere() {
  const sphereGeo = new THREE.SphereGeometry(0.55, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.35,
    metalness: 0.65,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.45
  });
  coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(coreSphere);
}

function createGlowShell() {
  const glowGeo = new THREE.SphereGeometry(0.78, 64, 64);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(GlowShader.uniforms),
    vertexShader: GlowShader.vertexShader,
    fragmentShader: GlowShader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  glowMesh = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glowMesh);
}

function createOrbitRings() {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.22
  });

  [0.95, 1.25, 1.55].forEach((r) => {
    const ringGeo = new THREE.RingGeometry(r - 0.01, r + 0.01, 256);
    const ring = new THREE.Mesh(ringGeo, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    orbitRings.push(ring);
  });
}

function createParticles() {
  const particleGeo = new THREE.SphereGeometry(0.015, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < 80; i++) {
    const p = new THREE.Mesh(particleGeo, particleMat);
    const radius = 1.8 + Math.random() * 0.9;
    const angle = Math.random() * Math.PI * 2;

    p.userData = {
      radius,
      angle,
      speed: 0.002 + Math.random() * 0.006,
      yOffset: (Math.random() - 0.5) * 0.6
    };

    p.position.set(
      Math.cos(angle) * radius,
      p.userData.yOffset,
      Math.sin(angle) * radius
    );

    particles.push(p);
    scene.add(p);
  }
}

function createEmotionalNodes() {
  const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);

  const configs = [
    { name: "Ca", color: 0x38bdf8, radius: 1.05, speed: 0.6 },
    { name: "Joy", color: 0xf97316, radius: 1.25, speed: 0.45 },
    { name: "Stress", color: 0xf87171, radius: 1.45, speed: 0.35 }
  ];

  configs.forEach((cfg) => {
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.6
    });

    const node = new THREE.Mesh(nodeGeo, mat);
    node.userData = {
      angle: Math.random() * Math.PI * 2,
      radius: cfg.radius,
      speed: cfg.speed * 0.002,
      name: cfg.name
    };

    node.position.set(
      Math.cos(node.userData.angle) * node.userData.radius,
      0,
      Math.sin(node.userData.angle) * node.userData.radius
    );

    emotionalNodes.push(node);
    scene.add(node);
  });
}

function createCompassHousing() {
  const outerGeo = new THREE.TorusGeometry(1.65, 0.06, 16, 200);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.6,
    roughness: 0.35
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  outer.rotation.x = Math.PI / 2;
  scene.add(outer);
}

function createCompassNeedle() {
  compassNeedleGroup = new THREE.Group();

  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 12);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.18
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;

  compassNeedleGroup.add(shaft);
  scene.add(compassNeedleGroup);
}

function initTrajectory() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(TRAJECTORY_MAX * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9
  });

  trajectoryLine = new THREE.Line(geometry, material);
  scene.add(trajectoryLine);
}

function updateTrajectoryLine() {
  const positions = trajectoryLine.geometry.attributes.position.array;

  for (let i = 0; i < TRAJECTORY_MAX; i++) {
    const p = trajectoryPoints[i];
    if (p) {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    } else {
      positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 0;
    }
  }

  trajectoryLine.geometry.attributes.position.needsUpdate = true;
}

function animateCompass3D() {
  requestAnimationFrame(animateCompass3D);

  scene.rotation.y += (targetRotation - scene.rotation.y) * 0.05;

  if (compassNeedleGroup) {
    compassNeedleGroup.rotation.y +=
      (needleTargetRotation - compassNeedleGroup.rotation.y) * 0.08;
  }

  if (glowMesh && glowMesh.material.uniforms) {
    const worldPos = new THREE.Vector3();
    glowMesh.getWorldPosition(worldPos);
    const viewVec = new THREE.Vector3()
      .subVectors(camera.position, worldPos)
      .normalize();
    glowMesh.material.uniforms.viewVector.value.copy(viewVec);
  }

  animateRingsAndParticles();
  animateEmotionalNodes();
  updateTrajectoryLine();

  composer.render();
  controls.update();
}

function animateRingsAndParticles() {
  const t = performance.now() * 0.0003;

  orbitRings.forEach((ring, i) => {
    ring.rotation.z = t * (0.2 + i * 0.12);
  });

  particles.forEach((p) => {
    p.userData.angle += p.userData.speed;
    p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
    p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
  });
}

function animateEmotionalNodes() {
  emotionalNodes.forEach((node) => {
    node.userData.angle += node.userData.speed;
    node.position.x = Math.cos(node.userData.angle) * node.userData.radius;
    node.position.z = Math.sin(node.userData.angle) * node.userData.radius;
  });
}

export function updateCompass3D(metrics) {
  const angle = Math.atan2(metrics.stress, metrics.energy);
  targetRotation = angle;
  needleTargetRotation = angle;

  glowMesh.material.uniforms.glowColor.value.set(
    metrics.stress > 0.6 ? 0xf87171 : metrics.energy > 0.7 ? 0xfbbf24 : 0x3abff8
  );

  const boost = 0.9 + (metrics.score / 100) * 0.6;
  glowMesh.material.uniforms.intensityBoost.value = boost;

  trajectoryPoints.push(
    new THREE.Vector3(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6)
  );
  if (trajectoryPoints.length > TRAJECTORY_MAX) trajectoryPoints.shift();
}

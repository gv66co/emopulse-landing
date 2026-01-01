// compas3d-1.1.js
// Versija 1.1 — pilnas 3D emocinis kompasas su glow ir UI sinchronizacija.
// Import three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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
let particleField;
let subtleLightDisks = [];

const TRAJECTORY_MAX = 160; // slightly larger buffer for smoother history

// UI sync hooks (set by host page)
let uiCallbacks = {
  onMetricsUpdate: null // function(metrics) { ... }
};

// default metrics
let metricsState = {
  energy: 0.66,
  stress: 0.21,
  score: 76
};

// ---------- Initialization ----------
export function initCompass3D(options = {}) {
  canvas = document.getElementById(options.canvasId || 'compass3d');
  if (!canvas) {
    console.error('Canvas #compass3d not found');
    return;
  }

  // Scene and camera
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(
    45,
    Math.max(1, canvas.clientWidth / canvas.clientHeight),
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3.2);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Lights
  addLights();

  // Postprocessing composer with bloom
  setupPostProcessing();

  // Controls (optional, helpful for debugging)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 6;
  controls.enablePan = false;

  // Build scene objects
  createCoreSphere();
  createGlowShell();
  createOrbitRings();
  createParticles();
  createEmotionalNodes();
  createCompassHousing();
  createCompassNeedle();
  initTrajectory();
  createParticleField();
  createSubtleLightDisks();

  // Resize handling
  window.addEventListener('resize', resizeCompass3D);

  // Start animation
  animateCompass3D();
}

// ---------- Lighting ----------
function addLights() {
  // Ambient
  const ambient = new THREE.AmbientLight(0xffffff, 0.28);
  scene.add(ambient);

  // Directional key light
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(6, 10, 6);
  key.castShadow = false;
  scene.add(key);

  // Fill light (cool)
  const fill = new THREE.PointLight(0x3abff8, 0.18, 20);
  fill.position.set(-4, 2, -3);
  scene.add(fill);

  // Warm rim
  const rim = new THREE.PointLight(0xfbbf24, 0.12, 20);
  rim.position.set(3, -2, 4);
  scene.add(rim);
}

// ---------- Postprocessing ----------
function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // UnrealBloomPass parameters tuned for neon glow
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    0.9, // strength
    0.6, // radius
    0.1  // threshold
  );
  bloomPass.renderToScreen = true;
  composer.addPass(bloomPass);
}

// ---------- Resize ----------
function resizeCompass3D() {
  if (!canvas || !camera || !renderer) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera.aspect = Math.max(0.1, w / Math.max(1, h));
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (composer) {
    composer.setSize(w, h);
  }
}

// ---------- Glow shader (improved) ----------
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

// ---------- Core sphere and glow ----------
export function createCoreSphere() {
  const sphereGeo = new THREE.SphereGeometry(0.55, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.35,
    metalness: 0.65,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.45
  });

  coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
  coreSphere.position.set(0, 0, 0);
  coreSphere.castShadow = false;
  coreSphere.receiveShadow = false;
  scene.add(coreSphere);
}

export function createGlowShell() {
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
  glowMesh.position.copy(coreSphere.position);
  scene.add(glowMesh);
}

// ---------- Orbit rings ----------
export function createOrbitRings() {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide
  });

  const radii = [0.95, 1.25, 1.55];
  radii.forEach((r, i) => {
    const ringGeo = new THREE.RingGeometry(r - 0.01, r + 0.01, 256);
    const ring = new THREE.Mesh(ringGeo, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.renderOrder = 1;
    scene.add(ring);
    orbitRings.push(ring);
  });
}

// ---------- Particles orbiting ----------
export function createParticles() {
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
    p.position.set(Math.cos(angle) * radius, p.userData.yOffset, Math.sin(angle) * radius);
    particles.push(p);
    scene.add(p);
  }
}

// ---------- Emotional nodes ----------
export function createEmotionalNodes() {
  const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);

  const configs = [
    { name: 'Ca',    color: 0x38bdf8, radius: 1.05, speed: 0.6 },
    { name: 'Joy',   color: 0xf97316, radius: 1.25, speed: 0.45 },
    { name: 'Stress',color: 0xf87171, radius: 1.45, speed: 0.35 }
  ];

  configs.forEach((cfg) => {
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.6,
      roughness: 0.28,
      metalness: 0.45
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

// ---------- Animate rings and particles ----------
export function animateRingsAndParticles() {
  const t = performance.now() * 0.0003;
  orbitRings.forEach((ring, i) => {
    ring.rotation.z = t * (0.2 + i * 0.12);
  });

  particles.forEach((p) => {
    p.userData.angle += p.userData.speed;
    p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
    p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
    p.position.y = p.userData.yOffset + Math.sin(performance.now() * 0.001 + p.userData.angle) * 0.06;
  });
}

// ---------- Emotional nodes animation ----------
export function animateEmotionalNodes() {
  emotionalNodes.forEach((node) => {
    node.userData.angle += node.userData.speed;
    node.position.x = Math.cos(node.userData.angle) * node.userData.radius;
    node.position.z = Math.sin(node.userData.angle) * node.userData.radius;
    node.position.y = Math.sin(performance.now() * 0.001 + node.userData.angle) * 0.12;
    // subtle scale pulse based on energy
    const pulse = 1 + Math.sin(performance.now() * 0.002 + node.userData.angle) * 0.03;
    node.scale.set(pulse, pulse, pulse);
  });
}

// ---------- Compass housing, ticks, labels ----------
function createCompassHousing() {
  // outer torus
  const outerGeo = new THREE.TorusGeometry(1.65, 0.06, 16, 200);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.6,
    roughness: 0.35
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  outer.rotation.x = Math.PI / 2;
  outer.receiveShadow = false;
  scene.add(outer);

  // inner disk
  const diskGeo = new THREE.CircleGeometry(1.6, 128);
  const diskMat = new THREE.MeshStandardMaterial({
    color: 0x071022,
    metalness: 0.12,
    roughness: 0.8,
    side: THREE.DoubleSide
  });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.rotation.x = Math.PI / 2;
  disk.position.y = -0.002;
  scene.add(disk);

  // tick marks
  const tickGroup = new THREE.Group();
  const tickMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.6 });
  for (let i = 0; i < 360; i += 6) {
    const len = (i % 90 === 0) ? 0.14 : (i % 30 === 0 ? 0.08 : 0.04);
    const geo = new THREE.BoxGeometry(0.02, len, 0.01);
    const tick = new THREE.Mesh(geo, tickMat);
    const rad = THREE.MathUtils.degToRad(i);
    const r = 1.45;
    tick.position.set(Math.cos(rad) * r, 0.01, Math.sin(rad) * r);
    tick.lookAt(0, 0.01, 0);
    tick.rotateX(Math.PI / 2);
    tickGroup.add(tick);
  }
  scene.add(tickGroup);

  // N/E/S/W labels using CanvasTexture
  const labels = ['N', 'E', 'S', 'W'];
  const labelAngles = [0, 90, 180, 270];
  labelAngles.forEach((deg, idx) => {
    const canvasLabel = document.createElement('canvas');
    canvasLabel.width = 128;
    canvasLabel.height = 128;
    const ctx = canvasLabel.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[idx], 64, 64);

    const tex = new THREE.CanvasTexture(canvasLabel);
    tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    const rad = THREE.MathUtils.degToRad(deg);
    const r = 1.9;
    sprite.position.set(Math.cos(rad) * r, 0.02, Math.sin(rad) * r);
    sprite.scale.set(0.42, 0.42, 0.42);
    scene.add(sprite);
  });
}

// ---------- Compass needle ----------
export function createCompassNeedle() {
  compassNeedleGroup = new THREE.Group();

  // shaft
  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 12);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.18,
    metalness: 0.6,
    roughness: 0.25
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.y = 0.01;
  compassNeedleGroup.add(shaft);

  // north head (red)
  const headGeo = new THREE.ConeGeometry(0.06, 0.18, 12);
  const headMatN = new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xf87171, emissiveIntensity: 0.6 });
  const headN = new THREE.Mesh(headGeo, headMatN);
  headN.position.set(0, 0.9, 0);
  headN.rotation.x = Math.PI / 2;
  compassNeedleGroup.add(headN);

  // south head (white)
  const headMatS = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.18 });
  const headS = new THREE.Mesh(headGeo, headMatS);
  headS.position.set(0, -0.9, 0);
  headS.rotation.x = -Math.PI / 2;
  compassNeedleGroup.add(headS);

  // hub
  const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.set(0, 0.01, 0);
  compassNeedleGroup.add(hub);

  compassNeedleGroup.position.set(0, 0.02, 0);
  scene.add(compassNeedleGroup);
}

// ---------- Update needle color based on metrics ----------
export function updateArrowColor(metrics) {
  if (!compassNeedleGroup) return;

  let color = new THREE.Color(0x38bdf8);

  if (metrics.stress > 0.6) {
    color = new THREE.Color(0xf87171);
  } else if (metrics.energy > 0.7) {
    color = new THREE.Color(0xfbbf24);
  }

  compassNeedleGroup.children.forEach((part) => {
    if (part.material) {
      // cones keep their base color but get emissive tint
      part.material.emissive = color;
      if (part.geometry && part.geometry.type !== 'ConeGeometry') {
        part.material.color = color;
      }
    }
  });
}

// ---------- Trajectory ----------
export function initTrajectory() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(TRAJECTORY_MAX * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
    linewidth: 2
  });

  trajectoryLine = new THREE.Line(geometry, material);
  trajectoryLine.frustumCulled = false;
  scene.add(trajectoryLine);
}

export function addTrajectoryPoint({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  const radius = 1.6;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(performance.now() * 0.001) * 0.15;
  const z = Math.sin(angle) * radius;

  trajectoryPoints.push(new THREE.Vector3(x, y, z));
  if (trajectoryPoints.length > TRAJECTORY_MAX) {
    trajectoryPoints.shift();
  }
}

function updateTrajectoryLine() {
  if (!trajectoryLine) return;

  const positions = trajectoryLine.geometry.attributes.position.array;

  for (let i = 0; i < TRAJECTORY_MAX; i++) {
    const p = trajectoryPoints[i];
    if (p) {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    } else {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
  }

  trajectoryLine.geometry.attributes.position.needsUpdate = true;

  const opacity = Math.min(1, trajectoryPoints.length / TRAJECTORY_MAX);
  trajectoryLine.material.opacity = opacity;
}

// ---------- Update compass nodes radii ----------
export function updateCompassNodes({ energy, stress }) {
  emotionalNodes.forEach((node) => {
    if (node.userData.name === 'Ca') {
      node.userData.radius = 1.0 + energy * 0.4;
    }
    if (node.userData.name === 'Joy') {
      node.userData.radius = 1.2 + energy * 0.3;
    }
    if (node.userData.name === 'Stress') {
      node.userData.radius = 1.4 + stress * 0.6;
    }
  });
}

// ---------- Update glow color ----------
export function updateCompassGlow(metrics) {
  if (!glowMesh) return;

  let color = new THREE.Color(0x3abff8);

  if (metrics.stress > 0.6) {
    color = new THREE.Color(0xf87171);
  } else if (metrics.energy > 0.7) {
    color = new THREE.Color(0xfbbf24);
  } else if (metrics.energy < 0.3) {
    color = new THREE.Color(0x64748b);
  }

  glowMesh.material.uniforms.glowColor.value.copy(color);
  // subtle intensity boost based on score
  const boost = 0.9 + (metrics.score / 100) * 0.6;
  glowMesh.material.uniforms.intensityBoost.value = boost;
}

// ---------- Update compass direction ----------
export function updateCompassDirection({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  targetRotation = angle;
}

// ---------- Update arrow direction ----------
export function updateArrowDirection({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  needleTargetRotation = angle;
}

// ---------- Public update entry ----------
export function updateCompass3D(metrics) {
  if (!metrics) return;

  // update internal state
  metricsState.energy = metrics.energy;
  metricsState.stress = metrics.stress;
  metricsState.score = metrics.score !== undefined ? metrics.score : metricsState.score;

  updateCompassNodes({
    energy: metrics.energy,
    stress: metrics.stress
  });

  updateCompassGlow(metrics);

  updateCompassDirection({
    energy: metrics.energy,
    stress: metrics.stress
  });

  updateArrowColor(metrics);

  updateArrowDirection({
    energy: metrics.energy,
    stress: metrics.stress
  });

  addTrajectoryPoint({
    energy: metrics.energy,
    stress: metrics.stress
  });

  // notify UI if callback provided
  if (uiCallbacks.onMetricsUpdate) {
    uiCallbacks.onMetricsUpdate(metricsState);
  }
}

// ---------- Particle field (background subtle stars) ----------
function createParticleField() {
  const geo = new THREE.BufferGeometry();
  const count = 220;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI * 0.6;
    const x = Math.cos(theta) * Math.cos(phi) * r;
    const y = Math.sin(phi) * r * 0.4;
    const z = Math.sin(theta) * Math.cos(phi) * r;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.08, 0.8, 0.6);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, opacity: 0.6 });
  particleField = new THREE.Points(geo, mat);
  particleField.frustumCulled = false;
  scene.add(particleField);
}

// ---------- Subtle light disks behind scene for photo-like glow ----------
function createSubtleLightDisks() {
  const diskGeo = new THREE.CircleGeometry(2.6, 64);
  const coolMat = new THREE.MeshBasicMaterial({ color: 0x3abff8, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending });
  const warmMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending });

  const coolDisk = new THREE.Mesh(diskGeo, coolMat);
  coolDisk.rotation.x = Math.PI / 2;
  coolDisk.position.set(-1.2, -0.6, -1.2);
  scene.add(coolDisk);
  subtleLightDisks.push(coolDisk);

  const warmDisk = new THREE.Mesh(diskGeo, warmMat);
  warmDisk.rotation.x = Math.PI / 2;
  warmDisk.position.set(1.6, -0.8, 1.2);
  scene.add(warmDisk);
  subtleLightDisks.push(warmDisk);
}

// ---------- Animation loop ----------
function animateCompass3D() {
  requestAnimationFrame(animateCompass3D);

  // smooth scene rotation toward targetRotation
  scene.rotation.y += (targetRotation - scene.rotation.y) * 0.05;

  // needle rotation smoothing
  if (compassNeedleGroup) {
    const current = compassNeedleGroup.rotation.y;
    compassNeedleGroup.rotation.y += (needleTargetRotation - current) * 0.08;
  }

  // update glow shader viewVector
  if (glowMesh && glowMesh.material && glowMesh.material.uniforms) {
    const worldPos = new THREE.Vector3();
    glowMesh.getWorldPosition(worldPos);
    const viewVec = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
    glowMesh.material.uniforms.viewVector.value.copy(viewVec);
  }

  // animate core sphere pulse
  if (coreSphere) {
    const t = performance.now() * 0.001;
    const scale = 1 + Math.sin(t * 2.0) * 0.04;
    coreSphere.scale.set(scale, scale, scale);
    const glowScale = 1.12 + Math.sin(t * 1.5) * 0.05;
    if (glowMesh) glowMesh.scale.set(glowScale, glowScale, glowScale);
  }

  // animate other elements
  animateRingsAndParticles();
  animateEmotionalNodes();
  updateTrajectoryLine();

  // subtle background rotation for particle field
  if (particleField) particleField.rotation.y += 0.0006;

  // update composer or renderer
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  // controls update
  if (controls) controls.update();
}

// ---------- UI integration helpers ----------
export function setUICallbacks(callbacks = {}) {
  uiCallbacks = Object.assign(uiCallbacks, callbacks);
}

// ---------- Utilities for external control ----------
export function setMetrics(energy, stress, score) {
  updateCompass3D({ energy, stress, score });
}

// ---------- Cleanup (if needed) ----------
export function disposeCompass() {
  // remove event listeners
  window.removeEventListener('resize', resizeCompass3D);
  // dispose scene objects and renderer
  if (composer) {
    composer.dispose();
    composer = null;
  }
  if (renderer) {
    renderer.dispose();
  }
  // clear arrays
  orbitRings.forEach(o => disposeMesh(o));
  particles.forEach(p => disposeMesh(p));
  emotionalNodes.forEach(n => disposeMesh(n));
  if (trajectoryLine) disposeMesh(trajectoryLine);
  if (coreSphere) disposeMesh(coreSphere);
  if (glowMesh) disposeMesh(glowMesh);
  orbitRings = [];
  particles = [];
  emotionalNodes = [];
  trajectoryPoints = [];
  trajectoryLine = null;
  coreSphere = null;
  glowMesh = null;
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
}

// helper to dispose mesh geometry and material
function disposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose && m.dispose());
    } else {
      mesh.material.dispose && mesh.material.dispose();
    }
  }
  if (mesh.parent) mesh.parent.remove(mesh);
}

// ---------- Auto-init convenience (keeps backward compatibility) ----------
document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('compass3d');
  if (canvasEl) {
    // small delay to allow CSS sizing to settle
    setTimeout(() => {
      initCompass3D();
      // initial metrics push so UI can sync
      updateCompass3D(metricsState);
    }, 60);
  }
});

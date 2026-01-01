import * as THREE from 'three';
// Jei nori interaktyvumo, atkomentuok žemiau ir įtrauk examples modulį į bundler'į
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
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

export function initCompass3D() {
  canvas = document.getElementById('compass3d');
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

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Apšvietimas
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(5, 10, 7);
  scene.add(dir);
  const point = new THREE.PointLight(0xffffff, 0.15);
  point.position.set(-5, -3, -5);
  scene.add(point);

  // Optional: OrbitControls
  // controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.07;
  // controls.minDistance = 1.5;
  // controls.maxDistance = 6;

  window.addEventListener('resize', resizeCompass3D);

  animateCompass3D();
}

function resizeCompass3D() {
  if (!canvas) return;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

const GlowShader = {
  uniforms: {
    c: { value: 0.4 },
    p: { value: 2.4 },
    glowColor: { value: new THREE.Color(0x3abff8) },
    viewVector: { value: new THREE.Vector3(0, 0, 3) }
  },
  vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    varying float intensity;

    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 vNormel = normalize(normalMatrix * viewVector);
      intensity = pow(c - dot(vNormal, vNormel), p);

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

export function createCoreSphere() {
  const sphereGeo = new THREE.SphereGeometry(0.55, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.35,
    metalness: 0.65,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35
  });

  coreSphere = new THREE.Mesh(sphereGeo, sphereMat);
  coreSphere.position.set(0, 0, 0);
  scene.add(coreSphere);

  const glowGeo = new THREE.SphereGeometry(0.75, 64, 64);
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

export function animateCoreSphere() {
  const t = performance.now() * 0.001;
  const scale = 1 + Math.sin(t * 2.0) * 0.04;
  coreSphere.scale.set(scale, scale, scale);

  const glowScale = 1.15 + Math.sin(t * 1.5) * 0.05;
  glowMesh.scale.set(glowScale, glowScale, glowScale);
}

export function createOrbitRings() {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });

  const radii = [0.95, 1.25, 1.55];

  radii.forEach((r) => {
    const ringGeo = new THREE.RingGeometry(r - 0.01, r + 0.01, 128);
    const ring = new THREE.Mesh(ringGeo, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    orbitRings.push(ring);
  });
}

export function createParticles() {
  const particleGeo = new THREE.SphereGeometry(0.015, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });

  for (let i = 0; i < 60; i++) {
    const p = new THREE.Mesh(particleGeo, particleMat);

    const radius = 1.8 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;

    p.userData = {
      radius,
      angle,
      speed: 0.002 + Math.random() * 0.004
    };

    p.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 0.4,
      Math.sin(angle) * radius
    );

    particles.push(p);
    scene.add(p);
  }
}

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
      roughness: 0.3,
      metalness: 0.4
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

export function animateRingsAndParticles() {
  const t = performance.now() * 0.0003;

  orbitRings.forEach((ring, i) => {
    ring.rotation.z = t * (0.2 + i * 0.15);
  });

  particles.forEach((p) => {
    p.userData.angle += p.userData.speed;
    p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
    p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
  });
}

export function animateEmotionalNodes() {
  emotionalNodes.forEach((node) => {
    node.userData.angle += node.userData.speed;
    node.position.x = Math.cos(node.userData.angle) * node.userData.radius;
    node.position.z = Math.sin(node.userData.angle) * node.userData.radius;
    node.position.y = Math.sin(performance.now() * 0.001 + node.userData.angle) * 0.12;
  });
}

/* ---------- Kompaso korpusas, žymėjimai ir adatėlė ---------- */

function createCompassHousing() {
  // pagrindinis žiedas
  const outerGeo = new THREE.TorusGeometry(1.65, 0.06, 16, 200);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.6,
    roughness: 0.4
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  outer.rotation.x = Math.PI / 2;
  scene.add(outer);

  // vidinis diskas (tamsesnis)
  const diskGeo = new THREE.CircleGeometry(1.6, 64);
  const diskMat = new THREE.MeshStandardMaterial({
    color: 0x0b1220,
    metalness: 0.2,
    roughness: 0.7,
    side: THREE.DoubleSide
  });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.rotation.x = Math.PI / 2;
  disk.position.y = -0.001;
  scene.add(disk);

  // tick marks aplink žiedą
  const tickGroup = new THREE.Group();
  const tickMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.6 });
  for (let i = 0; i < 360; i += 10) {
    const len = (i % 90 === 0) ? 0.12 : (i % 30 === 0 ? 0.08 : 0.04);
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

  // N/E/S/W etiketės (CanvasTexture)
  const labels = ['N', 'E', 'S', 'W'];
  const labelAngles = [0, 90, 180, 270];
  labelAngles.forEach((deg, idx) => {
    const canvasLabel = document.createElement('canvas');
    canvasLabel.width = 128;
    canvasLabel.height = 128;
    const ctx = canvasLabel.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 128, 128);
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[idx], 64, 64);

    const tex = new THREE.CanvasTexture(canvasLabel);
    tex.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    const rad = THREE.MathUtils.degToRad(deg);
    const r = 1.9;
    sprite.position.set(Math.cos(rad) * r, 0.02, Math.sin(rad) * r);
    sprite.scale.set(0.4, 0.4, 0.4);
    scene.add(sprite);
  });
}

export function createCompassNeedle() {
  // grupė, kuri sukasi aplink Y ašį (kompaso kryptis)
  compassNeedleGroup = new THREE.Group();

  // adatėlės shaft (plonas cilindras)
  const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 12);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
    metalness: 0.6,
    roughness: 0.25
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.y = 0.01;
  compassNeedleGroup.add(shaft);

  // adatos galvutė (raudona šiaurė)
  const headGeo = new THREE.ConeGeometry(0.06, 0.18, 12);
  const headMatN = new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0xf87171, emissiveIntensity: 0.6 });
  const headN = new THREE.Mesh(headGeo, headMatN);
  headN.position.set(0, 0.9, 0);
  headN.rotation.x = Math.PI / 2;
  compassNeedleGroup.add(headN);

  // pietinė galvutė (balta)
  const headMatS = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2 });
  const headS = new THREE.Mesh(headGeo, headMatS);
  headS.position.set(0, -0.9, 0);
  headS.rotation.x = -Math.PI / 2;
  compassNeedleGroup.add(headS);

  // centrinis stovas
  const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.position.set(0, 0.01, 0);
  compassNeedleGroup.add(hub);

  // pozicija ir rotacija: grupė sukasi aplink Y ašį
  compassNeedleGroup.position.set(0, 0.02, 0);
  scene.add(compassNeedleGroup);
}

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
      if (part.geometry.type === 'ConeGeometry') {
        // keep north red and south white; only change emissive for effect
        part.material.emissive = color;
      } else {
        part.material.emissive = color;
        part.material.color = color;
      }
    }
  });
}

export function initTrajectory() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(120 * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.8,
    linewidth: 2
  });

  trajectoryLine = new THREE.Line(geometry, material);
  scene.add(trajectoryLine);
}

export function addTrajectoryPoint({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  const radius = 1.6;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(performance.now() * 0.001) * 0.15;
  const z = Math.sin(angle) * radius;

  trajectoryPoints.push(new THREE.Vector3(x, y, z));
  if (trajectoryPoints.length > 120) {
    trajectoryPoints.shift();
  }
}

function updateTrajectoryLine() {
  if (!trajectoryLine) return;

  const positions = trajectoryLine.geometry.attributes.position.array;

  for (let i = 0; i < 120; i++) {
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

  const opacity = Math.min(1, trajectoryPoints.length / 120);
  trajectoryLine.material.opacity = opacity;
}

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

  glowMesh.material.uniforms.glowColor.value = color;
  // jei reikia, priverstinai atnaujinti medžiagą:
  // glowMesh.material.needsUpdate = true;
}

export function updateCompassDirection({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  targetRotation = angle;
}

export function updateArrowDirection({ energy, stress }) {
  const angle = Math.atan2(stress, energy);
  needleTargetRotation = angle;
}

export function updateCompass3D(metrics) {
  if (!metrics) return;

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
}

export function initCompass() {
  initCompass3D();
  createCoreSphere();
  createOrbitRings();
  createParticles();
  createEmotionalNodes();
  createCompassHousing();
  createCompassNeedle();
  initTrajectory();
}

/* ---------- Animacijos ciklas ---------- */

function animateCompass3D() {
  requestAnimationFrame(animateCompass3D);

  // scene rotacija (lėtas poslinkis)
  scene.rotation.y += (targetRotation - scene.rotation.y) * 0.05;

  // adatėlės sukimas: grupė sukasi aplink Y ašį
  if (compassNeedleGroup) {
    // sklandus sukimasis
    const current = compassNeedleGroup.rotation.y;
    compassNeedleGroup.rotation.y += (needleTargetRotation - current) * 0.08;
  }

  // atnaujinti glow shader viewVector
  if (glowMesh && glowMesh.material && glowMesh.material.uniforms) {
    const worldPos = new THREE.Vector3();
    glowMesh.getWorldPosition(worldPos);
    const viewVec = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
    glowMesh.material.uniforms.viewVector.value.copy(viewVec);
  }

  if (coreSphere) animateCoreSphere();
  animateRingsAndParticles();
  animateEmotionalNodes();
  updateTrajectoryLine();

  // if (controls) controls.update();

  renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('compass3d');
  if (canvasEl) {
    initCompass();
  }
});

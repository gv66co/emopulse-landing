<canvas id="compass3d"></canvas>

// ===============================
// 3D COMPASS — BLOCK 5.2
// GLOW SHADER + CORE SPHERE
// ===============================

// Glow shader (soft aura around sphere)
const GlowShader = {
  uniforms: {
    "c": { value: 0.4 },
    "p": { value: 2.4 },
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
      gl_FragColor = vec4(glow, 1.0);
    }
  `
};

// Core sphere + glow
let coreSphere, glowMesh;

export function createCoreSphere() {
  // Main sphere
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

  // Glow aura
  const glowGeo = new THREE.SphereGeometry(0.75, 64, 64);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(GlowShader.uniforms),
    vertexShader: GlowShader.vertexShader,
    fragmentShader: GlowShader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.position.copy(coreSphere.position);
  scene.add(glowMesh);
}

// Pulsavimas
export function animateCoreSphere() {
  const t = performance.now() * 0.001;

  // Soft breathing effect
  const scale = 1 + Math.sin(t * 2.0) * 0.04;
  coreSphere.scale.set(scale, scale, scale);

  // Glow breathing
  const glowScale = 1.15 + Math.sin(t * 1.5) * 0.05;
  glowMesh.scale.set(glowScale, glowScale, glowScale);
}

// ===============================
// 3D COMPASS — BLOCK 5.3
// ORBIT RINGS + PARTICLES
// ===============================

let orbitRings = [];
let particles = [];

export function createOrbitRings() {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.35
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

// ===============================
// PARTICLES AROUND COMPASS
// ===============================

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

// ===============================
// ANIMATION FOR RINGS + PARTICLES
// ===============================

export function animateRingsAndParticles() {
  const t = performance.now() * 0.0003;

  // Orbit rings rotation
  orbitRings.forEach((ring, i) => {
    ring.rotation.z = t * (0.2 + i * 0.15);
  });

  // Floating particles
  particles.forEach((p) => {
    p.userData.angle += p.userData.speed;

    p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
    p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
  });
}

// ===============================
// 3D COMPASS — BLOCK 5.4
// EMOTIONAL NODES (CA / JOY / STRESS)
// ===============================

let emotionalNodes = [];

export function createEmotionalNodes() {
  const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);

  const configs = [
    { name: "Ca", color: 0x38bdf8, radius: 1.05, speed: 0.6 },
    { name: "Joy", color: 0xf97316, radius: 1.25, speed: 0.45 },
    { name: "Stress", color: 0xf87171, radius: 1.45, speed: 0.35 }
  ];

  configs.forEach((cfg, i) => {
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

// ===============================
// NODE ANIMATION
// ===============================

export function animateEmotionalNodes() {
  emotionalNodes.forEach((node) => {
    node.userData.angle += node.userData.speed;

    node.position.x = Math.cos(node.userData.angle) * node.userData.radius;
    node.position.z = Math.sin(node.userData.angle) * node.userData.radius;

    // Soft vertical float
    node.position.y = Math.sin(performance.now() * 0.001 + node.userData.angle) * 0.12;
  });
}

// ===============================
// 3D COMPASS — BLOCK 5.5
// FINAL INIT + ANIMATION LOOP
// ===============================

export function initCompass() {
  initCompass3D();          // From Block 5.1
  createCoreSphere();       // From Block 5.2
  createOrbitRings();       // From Block 5.3
  createParticles();        // From Block 5.3
  createEmotionalNodes();   // From Block 5.4
}

// MAIN ANIMATION LOOP
function animateCompass3D() {
  requestAnimationFrame(animateCompass3D);

  // Smooth auto-rotation
  // Auto rotation + emotional direction blend
scene.rotation.y += (targetRotation - scene.rotation.y) * 0.05;


  // Animate core sphere (breathing)
  if (coreSphere) animateCoreSphere();

  // Animate orbit rings + particles
  animateRingsAndParticles();

  // Animate emotional nodes (Ca / Joy / Stress)
  animateEmotionalNodes();

  renderer.render(scene, camera);
}

// AUTO-INIT WHEN CANVAS EXISTS
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("compass3d");
  if (canvas) {
    initCompass();
  }
});

// ===============================
// LIVE EMOTION → NODE ORBITS
// ===============================

export function updateCompassNodes({ energy, stress }) {
  emotionalNodes.forEach((node) => {
    if (node.userData.name === "Ca") {
      node.userData.radius = 1.0 + energy * 0.4; // daugiau energijos → toliau
    }
    if (node.userData.name === "Joy") {
      node.userData.radius = 1.2 + energy * 0.3;
    }
    if (node.userData.name === "Stress") {
      node.userData.radius = 1.4 + stress * 0.6; // daugiau streso → išsiplečia
    }
  });
}

// ===============================
// LIVE EMOTION → GLOW COLOR
// ===============================

export function updateCompassGlow(metrics) {
  if (!glowMesh) return;

  let color = new THREE.Color(0x3abff8); // default calm

  if (metrics.stress > 0.6) {
    color = new THREE.Color(0xf87171); // raudona — stresas
  } else if (metrics.energy > 0.7) {
    color = new THREE.Color(0xfbbf24); // geltona — energija
  } else if (metrics.energy < 0.3) {
    color = new THREE.Color(0x64748b); // pilka — low energy
  }

  glowMesh.material.uniforms.glowColor.value = color;
}

// ===============================
// EMOTION → COMPASS ROTATION
// ===============================

let targetRotation = 0;

export function updateCompassDirection({ energy, stress }) {
  // Emocijos krypties kampas
  const angle = Math.atan2(stress, energy);

  // Tikslinė rotacija
  targetRotation = angle;
}

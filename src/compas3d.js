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

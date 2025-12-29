
// Three.js 3D pulso ratai + neon aura
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, 600);
renderer.setClearColor(0x0a1530, 0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / 600, 0.1, 1000);
camera.position.z = 120;

const neonMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
const auraMaterial = new THREE.MeshBasicMaterial({ color: 0x0078FF, transparent: true, opacity: 0.15 });

function createPulseRing(radius, color, neon=true) {
  const geometry = new THREE.TorusGeometry(radius, neon ? 2.5 : 6, 32, 100);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: neon ? 0.8 : 0.2
  });
  const torus = new THREE.Mesh(geometry, material);
  return torus;
}

// Neon pulso ratai
const ring1 = createPulseRing(32, 0x00f0ff, true);
const ring2 = createPulseRing(44, 0xff00e0, true);
const ring3 = createPulseRing(56, 0x0078FF, false);

scene.add(ring1);
scene.add(ring2);
scene.add(ring3);

// Aura glow (animated sphere)
const auraGeometry = new THREE.SphereGeometry(24, 32, 32);
const aura = new THREE.Mesh(auraGeometry, auraMaterial);
scene.add(aura);

// Neon spiralė (animated line)
const spiralPoints = [];
for (let i = 0; i < 100; i++) {
  const angle = i * 0.2;
  const radius = 18 + i * 0.12;
  spiralPoints.push(new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    (i - 50) * 0.5
  ));
}
const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
const spiralMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 });
const spiral = new THREE.Line(spiralGeometry, spiralMaterial);
scene.add(spiral);

// Animacija
function animate() {
  requestAnimationFrame(animate);
  ring1.rotation.z += 0.008;
  ring2.rotation.z -= 0.012;
  ring3.rotation.z += 0.004;
  aura.material.opacity = 0.12 + 0.08 * Math.abs(Math.sin(Date.now() * 0.002));
  spiral.rotation.z += 0.01;
  renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, 600);
  camera.aspect = window.innerWidth / 600;
  camera.updateProjectionMatrix();
});

import * as THREE from "three";

const canvas = document.getElementById("deck3d");
const label = document.getElementById("slideLabel");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const btnPause = document.getElementById("pause");

const SLIDES = [
  { name: "About us", src: "/slides/01-about.png" },
  { name: "Problem", src: "/slides/02-problem.png" },
  { name: "Solution", src: "/slides/03-solution.png" },
  { name: "Product overview", src: "/slides/04-product.png" },
  { name: "Market", src: "/slides/05-market.png" },
  { name: "Competition", src: "/slides/06-competition.png" },
  { name: "Financials", src: "/slides/07-financials.png" },

  // TEAM — only Arvid Pak slide image
  { name: "Team", src: "/slides/08-team-arvid.png" },

  { name: "Summary", src: "/slides/09-summary.png" },
  { name: "Thank you", src: "/slides/10-thankyou.png" }
];

let renderer, scene, camera;
let group;
let cards = [];
let index = 0;

let isPaused = false;
let timer = null;

let drag = { active: false, x: 0, y: 0 };
let orbit = { yaw: 0, pitch: 0 };

init().catch((e) => {
  console.error(e);
  label.textContent = "Carousel failed. Check console.";
});

async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.1, 5.2);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2, 3, 3);
  scene.add(dir);

  group = new THREE.Group();
  scene.add(group);

  await loadSlides();
  layoutCards();
  updateLabel();
  resize();
  window.addEventListener("resize", resize);

  bindUI();
  startAutoRotate();
  animate();
}

function bindUI() {
  btnPrev.addEventListener("click", () => go(index - 1));
  btnNext.addEventListener("click", () => go(index + 1));

  btnPause.addEventListener("click", () => {
    isPaused = !isPaused;
    btnPause.setAttribute("aria-pressed", String(isPaused));
    btnPause.textContent = isPaused ? "Resume" : "Pause";
    if (isPaused) stopAutoRotate();
    else startAutoRotate();
  });

  const wrap = canvas.parentElement;
  wrap.addEventListener("mouseenter", () => stopAutoRotate());
  wrap.addEventListener("mouseleave", () => { if (!isPaused) startAutoRotate(); });

  wrap.addEventListener("pointerdown", (e) => {
    drag.active = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener("pointermove", (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;

    orbit.yaw += dx * 0.003;
    orbit.pitch += dy * 0.002;
    orbit.pitch = clamp(orbit.pitch, -0.35, 0.35);
  });

  wrap.addEventListener("pointerup", () => (drag.active = false));
  wrap.addEventListener("pointercancel", () => (drag.active = false));

  wrap.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      camera.position.z = clamp(camera.position.z + e.deltaY * 0.002, 3.2, 7.5);
    },
    { passive: false }
  );
}

async function loadSlides() {
  const loader = new THREE.TextureLoader();

  const textures = await Promise.all(
    SLIDES.map(
      (s) =>
        new Promise((resolve, reject) => {
          loader.load(
            s.src,
            (t) => {
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = 8;
              resolve(t);
            },
            undefined,
            (err) => reject(err)
          );
        })
    )
  );

  for (const tex of textures) {
    const card = makeCard(tex);
    group.add(card);
    cards.push(card);
  }
}

function makeCard(tex) {
  const w = 3.6;
  const h = 2.025;

  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(geo, mat);

  const frameGeo = new THREE.PlaneGeometry(w + 0.08, h + 0.08, 1, 1);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0x1b2a4a,
    transparent: true,
    opacity: 0.55
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.02;

  const g = new THREE.Group();
  g.add(mesh);
  g.add(frame);

  return g;
}

function layoutCards() {
  const radius = 5.4;
  const step = 0.42;

  for (let i = 0; i < cards.length; i++) {
    const rel = i - index;
    const a = rel * step;

    const x = Math.sin(a) * 1.9;
    const z = Math.cos(a) * radius - radius;
    const y = -Math.abs(rel) * 0.02;

    cards[i].userData.target = {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, -a * 0.65, 0)
    };
  }
}

function go(nextIdx) {
  index = (nextIdx + cards.length) % cards.length;
  layoutCards();
  updateLabel();
  if (!isPaused) resetAutoRotate();
}

function updateLabel() {
  label.textContent = `${index + 1}/${SLIDES.length} — ${SLIDES[index].name}`;
}

function startAutoRotate() {
  stopAutoRotate();
  timer = setInterval(() => go(index + 1), 3500);
}

function stopAutoRotate() {
  if (timer) clearInterval(timer);
  timer = null;
}

function resetAutoRotate() {
  stopAutoRotate();
  startAutoRotate();
}

function animate() {
  requestAnimationFrame(animate);

  group.rotation.y += (orbit.yaw - group.rotation.y) * 0.08;
  group.rotation.x += (orbit.pitch - group.rotation.x) * 0.08;

  for (const c of cards) {
    const t = c.userData.target;
    if (!t) continue;

    c.position.lerp(t.position, 0.10);
    c.rotation.x += (t.rotation.x - c.rotation.x) * 0.10;
    c.rotation.y += (t.rotation.y - c.rotation.y) * 0.10;
    c.rotation.z += (t.rotation.z - c.rotation.z) * 0.10;
  }

  renderer.render(scene, camera);
}

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

const THREE = window.THREE;

// DOM Elementai
const canvas = document.getElementById("deck3d");
const label = document.getElementById("slideLabel");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const btnPause = document.getElementById("pause");

if (!canvas) {
    console.error("Canvas #deck3d not found.");
}

// Skaidrių sąrašas (SVARBU: keliai pakeisti į ./slides/ dėl stabilumo)
const SLIDES = [
    { name: "About us", src: "./slides/01-about.png" },
    { name: "Problem", src: "./slides/02-problem.png" },
    { name: "Solution", src: "./slides/03-solution.png" },
    { name: "Product overview", src: "./slides/04-product.png" },
    { name: "Market", src: "./slides/05-market.png" },
    { name: "Competition", src: "./slides/06-competition.png" },
    { name: "Financials", src: "./slides/07-financials.png" },
    { name: "Team", src: "./slides/08-team-arvid.png" },
    { name: "Summary", src: "./slides/09-summary.png" },
    { name: "Thank you", src: "./slides/10-thankyou.png" }
];

let renderer, scene, camera;
let group;
let cards = [];
let index = 0;

let isPaused = false;
let timer = null;

let drag = { active: false, x: 0, y: 0 };
let orbit = { yaw: 0, pitch: 0 };

// Inicijavimas
init().catch((e) => {
    console.error("Init Error:", e);
    if (label) label.textContent = "Error loading slides. Check /slides/ folder.";
});

async function init() {
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.1, 5.2);

    // Apšvietimas
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 3);
    scene.add(dir);

    // Pagrindinė grupė karuselei
    group = new THREE.Group();
    scene.add(group);

    // Užkrauname skaidres
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
    btnPrev?.addEventListener("click", () => go(index - 1));
    btnNext?.addEventListener("click", () => go(index + 1));

    btnPause?.addEventListener("click", () => {
        isPaused = !isPaused;
        btnPause.textContent = isPaused ? "Resume" : "Pause";
        if (isPaused) stopAutoRotate();
        else startAutoRotate();
    });

    const wrap = canvas.parentElement;

    // Pelės/Lietimo valdymas
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
        orbit.pitch = Math.max(-0.35, Math.min(0.35, orbit.pitch));
    });

    wrap.addEventListener("pointerup", () => (drag.active = false));

    wrap.addEventListener("wheel", (e) => {
        e.preventDefault();
        camera.position.z = Math.max(3.2, Math.min(7.5, camera.position.z + e.deltaY * 0.002));
    }, { passive: false });
}

async function loadSlides() {
    const loader = new THREE.TextureLoader();
    const textures = await Promise.all(
        SLIDES.map((s) =>
            new Promise((resolve) => {
                loader.load(s.src, (t) => {
                    t.colorSpace = THREE.SRGBColorSpace;
                    t.anisotropy = 8;
                    resolve(t);
                }, undefined, () => {
                    console.warn(`Failed to load: ${s.src}`);
                    resolve(null); // Tęsiam net jei viena skaidrė nerasta
                });
            })
        )
    );

    textures.forEach((tex, i) => {
        if (tex) {
            const card = makeCard(tex);
            group.add(card);
            cards.push(card);
        }
    });
}

function makeCard(tex) {
    const w = 3.6;
    const h = 2.025;
    const g = new THREE.Group();

    // Pagrindinė skaidrė
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);

    // Neoninis rėmelis / fonas
    const frameGeo = new THREE.PlaneGeometry(w + 0.15, h + 0.15);
    const frameMat = new THREE.MeshBasicMaterial({
        color: 0x3abff8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.01;

    g.add(mesh);
    g.add(frame);
    return g;
}

function layoutCards() {
    const radius = 5.0; // Karuselės spindulys
    const step = 0.5;   // Atstumas tarp kortelių radianais

    cards.forEach((card, i) => {
        const rel = i - index;
        const a = rel * step;

        const x = Math.sin(a) * 2.2;
        const z = Math.cos(a) * radius - radius;
        const y = -Math.abs(rel) * 0.05;

        card.userData.target = {
            position: new THREE.Vector3(x, y, z),
            rotation: new THREE.Euler(0, -a * 0.8, 0)
        };
    });
}

function go(nextIdx) {
    index = (nextIdx + cards.length) % cards.length;
    layoutCards();
    updateLabel();
    if (!isPaused) resetAutoRotate();
}

function updateLabel() {
    if (label) label.textContent = `${index + 1}/${SLIDES.length} — ${SLIDES[index].name}`;
}

function startAutoRotate() {
    stopAutoRotate();
    timer = setInterval(() => go(index + 1), 4000);
}

function stopAutoRotate() {
    if (timer) clearInterval(timer);
}

function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
}

function resize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

function animate() {
    requestAnimationFrame(animate);

    // Sklandus grupės pasukimas pagal drag'ą
    group.rotation.y += (orbit.yaw - group.rotation.y) * 0.08;
    group.rotation.x += (orbit.pitch - group.rotation.x) * 0.08;

    // Sklandus kortelių judėjimas į jų vietas
    cards.forEach((c) => {
        const t = c.userData.target;
        if (t) {
            c.position.lerp(t.position, 0.1);
            c.rotation.y += (t.rotation.y - c.rotation.y) * 0.1;
        }
    });

    renderer.render(scene, camera);
}

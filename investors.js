import * as THREE from 'three';

// DOM Elements
const canvas = document.getElementById("deck3d");
const label = document.getElementById("slideLabel");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const btnPause = document.getElementById("pause");

if (!canvas) {
    console.error("Canvas #deck3d not found. Ensure it exists in investors.html");
}

// Slides List (Professional English titles)
const SLIDES = [
    { name: "Vision & Mission", src: "./slides/01-about.png" },
    { name: "The Core Problem", src: "./slides/02-problem.png" },
    { name: "The Emopulse Solution", src: "./slides/03-solution.png" },
    { name: "Product Architecture", src: "./slides/04-product.png" },
    { name: "Market Opportunity", src: "./slides/05-market.png" },
    { name: "Competitive Analysis", src: "./slides/06-competition.png" },
    { name: "Financial Projections", src: "./slides/07-financials.png" },
    { name: "Leadership Team", src: "./slides/08-team-arvid.png" },
    { name: "Strategic Roadmap", src: "./slides/09-summary.png" },
    { name: "Investment Opportunity", src: "./slides/10-thankyou.png" }
];

let renderer, scene, camera, group;
let cards = [];
let index = 0;
let isPaused = false;
let timer = null;

let drag = { active: false, x: 0, y: 0 };
let orbit = { yaw: 0, pitch: 0 };

// Initialization
init().catch((e) => {
    console.error("3D Deck Init Error:", e);
    if (label) label.textContent = "Hardware acceleration error. Please refresh.";
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

    // Lighting for professional look
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

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
    btnPrev?.addEventListener("click", () => go(index - 1));
    btnNext?.addEventListener("click", () => go(index + 1));

    btnPause?.addEventListener("click", () => {
        isPaused = !isPaused;
        btnPause.textContent = isPaused ? "Resume" : "Pause";
        if (isPaused) stopAutoRotate();
        else startAutoRotate();
    });

    const wrap = canvas.parentElement;

    // Interaction management
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
        orbit.pitch = Math.max(-0.3, Math.min(0.3, orbit.pitch));
    });

    wrap.addEventListener("pointerup", () => (drag.active = false));
}

async function loadSlides() {
    const loader = new THREE.TextureLoader();
    
    // Improved texture loading with error handling
    const texturePromises = SLIDES.map(s => {
        return new Promise((resolve) => {
            loader.load(s.src, 
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    resolve(tex);
                },
                undefined,
                () => {
                    console.warn(`Asset missing: ${s.src}`);
                    resolve(null);
                }
            );
        });
    });

    const textures = await Promise.all(texturePromises);

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
    const cardGroup = new THREE.Group();

    // Main Slide Surface
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ 
        map: tex, 
        side: THREE.DoubleSide,
        transparent: true 
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Tech-glow Frame (Emopulse brand color)
    const frameGeo = new THREE.PlaneGeometry(w + 0.1, h + 0.1);
    const frameMat = new THREE.MeshBasicMaterial({
        color: 0x3abff8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.01;

    cardGroup.add(mesh);
    cardGroup.add(frame);
    return cardGroup;
}

function layoutCards() {
    const radius = 4.5; 
    const step = 0.45;

    cards.forEach((card, i) => {
        const rel = i - index;
        const a = rel * step;

        const x = Math.sin(a) * 2.5;
        const z = Math.cos(a) * radius - radius;
        const y = -Math.abs(rel) * 0.1;

        card.userData.target = {
            position: new THREE.Vector3(x, y, z),
            rotation: new THREE.Euler(0, -a * 0.7, 0)
        };
    });
}

function go(nextIdx) {
    if (cards.length === 0) return;
    index = (nextIdx + cards.length) % cards.length;
    layoutCards();
    updateLabel();
    if (!isPaused) resetAutoRotate();
}

function updateLabel() {
    if (label) {
        label.innerHTML = `<span class="idx">${index + 1}/${SLIDES.length}</span> — <span class="title">${SLIDES[index].name}</span>`;
    }
}

function startAutoRotate() {
    stopAutoRotate();
    timer = setInterval(() => go(index + 1), 5000);
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

    // Smooth rotation lag
    group.rotation.y += (orbit.yaw - group.rotation.y) * 0.05;
    group.rotation.x += (orbit.pitch - group.rotation.x) * 0.05;

    // Card movement smoothing
    cards.forEach((c) => {
        const t = c.userData.target;
        if (t) {
            c.position.lerp(t.position, 0.08);
            c.rotation.y += (t.rotation.y - c.rotation.y) * 0.08;
        }
    });

    renderer.render(scene, camera);
}

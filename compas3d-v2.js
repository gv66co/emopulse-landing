/* aura.js */
import * as THREE from 'three';

let scene, camera, renderer, auraSphere, stars, rings = [];

export function initAura() {
    const canvas = document.getElementById('aura-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 1. Pagrindinė sferos geometrija
    // IcosahedronGeometry su dideliu detalių skaičiumi sukuria "tinklo" efektą
    const geometry = new THREE.IcosahedronGeometry(1.2, 15);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
        emissive: 0x00f2ff,
        emissiveIntensity: 0.5
    });
    auraSphere = new THREE.Mesh(geometry, material);
    scene.add(auraSphere);

    // 2. Orbitaliniai žiedai (Saturno tipo efektas)
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.4, 0.01, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x7d2ae8, 
            transparent: true, 
            opacity: 0.3 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / (2 + i * 0.2);
        rings.push(ring);
        scene.add(ring);
    }

    // 3. Žvaigždžių laukas (Starfield)
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 2000; i++) {
        starCoords.push(
            (Math.random() - 0.5) * 100, 
            (Math.random() - 0.5) * 100, 
            (Math.random() - 0.5) * 100
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 }));
    scene.add(stars);

    // Apšvietimas
    const light = new THREE.PointLight(0xffffff, 20);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 2));

    camera.position.z = 6;

    // Responsyvumas
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (auraSphere) {
        auraSphere.rotation.y += 0.005;
        auraSphere.rotation.z += 0.002;
    }
    
    rings.forEach((r, i) => {
        r.rotation.z += 0.002 * (i + 1);
        r.rotation.y += 0.001;
    });

    if (stars) {
        stars.rotation.y += 0.0003;
    }

    renderer.render(scene, camera);
}

// Funkcija auros spalvai ir formai keisti realiu laiku
export function updateAura(color, smileIntensity, stressIntensity) {
    if (!auraSphere) return;

    // Spalvos keitimas (pvz. iš 0x00f2ff į 0xff0000)
    auraSphere.material.color.setHex(color);
    
    // Sferos padidėjimas priklausomai nuo šypsenos (smileIntensity: 0 iki 1)
    const scale = 1 + smileIntensity * 0.8;
    auraSphere.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

    // Drebulio efektas (stresas/angry)
    if (stressIntensity > 0.5) {
        auraSphere.position.x = Math.sin(Date.now() * 0.02) * stressIntensity * 0.1;
        auraSphere.position.y = Math.cos(Date.now() * 0.02) * stressIntensity * 0.1;
    } else {
        auraSphere.position.set(0, 0, 0);
    }
}

import * as THREE from 'three';

let scene, camera, renderer, auraSphere, stars, rings = [];

export function initAura() {
    const canvas = document.getElementById('aura-canvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // 1. The Aura Sphere
    const geometry = new THREE.IcosahedronGeometry(1.2, 15);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00f2ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    auraSphere = new THREE.Mesh(geometry, material);
    scene.add(auraSphere);

    // 2. Orbital Rings
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.4, 0.005, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x7d2ae8, transparent: true, opacity: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / (2 + i * 0.2);
        rings.push(ring);
        scene.add(ring);
    }

    // 3. Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 2000; i++) {
        starCoords.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 }));
    scene.add(stars);

    const light = new THREE.PointLight(0xffffff, 10);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 5;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    auraSphere.rotation.y += 0.005;
    auraSphere.rotation.z += 0.002;
    rings.forEach((r, i) => r.rotation.z += 0.002 * (i + 1));
    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

export function updateAura(color, smileIntensity, stressIntensity) {
    auraSphere.material.color.setHex(color);
    const scale = 1 + smileIntensity;
    auraSphere.scale.set(scale, scale, scale);
    // Drift effect based on stress
    auraSphere.position.x = Math.sin(Date.now() * 0.005) * stressIntensity * 0.5;
}

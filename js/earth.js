/* earth.js – 100 % local, image-free, procedural globe & stars
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';
import { OrbitControls } from '../libs/OrbitControls.js';

/* ---------- 1.  Low-poly land polygons (lat, lon) ---------- */
const land = [
  /* N-America */
  [[50, -130], [25, -110], [30, -80], [45, -60], [60, -70], [70, -150]],
  /* S-America */
  [[10, -80], [-55, -70], [-55, -40], [10, -35]],
  /* Africa */
  [[35, -10], [35, 50], [-35, 50], [-35, -10]],
  /* Eurasia */
  [[35, -10], [35, 180], [70, 180], [70, 30], [50, 10]],
  /* Australia */
  [[-10, 110], [-40, 110], [-40, 155], [-10, 155]],
  /* Greenland */
  [[80, -70], [60, -70], [60, -20], [80, -20]]
];

/* ---------- 2.  Build coloured globe ---------- */
const globe = new THREE.Group();
let earthGeom = new THREE.SphereGeometry(2, 64, 64).toNonIndexed(); // flat-shade
earthGeom.computeVertexNormals();

const pos       = earthGeom.attributes.position;
const colors    = [];
const ocean     = new THREE.Color(0x5bc0eb); // pastel blue
const landCols  = [
  new THREE.Color(0xffd23f), // yellow
  new THREE.Color(0xff6b6b), // coral
  new THREE.Color(0x4ecdc4), // teal
  new THREE.Color(0x95e1d3), // mint
  new THREE.Color(0xf38181), // rose
  new THREE.Color(0xa8e6cf)  // light green
];

const temp = new THREE.Vector3();
for (let i = 0; i < pos.count; i += 3) {
  temp.fromBufferAttribute(pos, i)
      .add(temp.fromBufferAttribute(pos, i + 1))
      .add(temp.fromBufferAttribute(pos, i + 2))
      .divideScalar(3)
      .normalize();

  const lat = 90 - Math.acos(temp.y) * 180 / Math.PI;
  const lon = ((Math.atan2(temp.z, temp.x) * 180 / Math.PI + 180) % 360) - 180;

  let inside = false;
  for (const poly of land) {
    if (pointInPoly([lon, lat], poly)) { inside = true; break; }
  }

  const col = inside
    ? landCols[Math.floor(Math.random() * landCols.length)]
    : ocean;

  colors.push(col.r, col.g, col.b);
  colors.push(col.r, col.g, col.b);
  colors.push(col.r, col.g, col.b);
}
earthGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

const earthMat  = new THREE.MeshBasicMaterial({ vertexColors: true });
const earthMesh = new THREE.Mesh(earthGeom, earthMat);
globe.add(earthMesh);

/* ---------- 3.  Cloud layer ---------- */
const cloudGeom = new THREE.SphereGeometry(2.02, 64, 64);
const cloudMat  = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4
});
const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
globe.add(cloudMesh);

/* ---------- 4.  Scene & camera ---------- */
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 0, 6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping   = true;
controls.minDistance     = 3;
controls.maxDistance     = 18;

/* ---------- 5.  Procedural star dome ---------- */
const starCount = 3000;
const starVerts = [];
for (let i = 0; i < starCount; i++) {
  const v = new THREE.Vector3().randomDirection().multiplyScalar(500);
  starVerts.push(v.x, v.y, v.z);
}
const starGeom = new THREE.BufferGeometry();
starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
const starDome = new THREE.Points(starGeom, starMat);
scene.add(starDome);
scene.add(globe);

/* ---------- 6.  Resize handler ---------- */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- 7.  Export ---------- */
export { scene, camera, renderer, controls, earthMesh, cloudMesh, globe };

/* ---------- 8.  Point-in-polygon helper ---------- */
function pointInPoly([px, py], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

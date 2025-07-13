/* earth.js – accurate, clickable Earth with landmasses
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';
import { OrbitControls } from '../libs/OrbitControls.js';
import { buildEarthMesh } from './countries.js';

/* ---------- Scene setup ---------- */
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0, 0, 6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 15;

/* ---------- Earth mesh (async) ---------- */
const EARTH_RADIUS = 2;
let earthGroup = new THREE.Group();  // will hold land + ocean
scene.add(earthGroup);

buildEarthMesh(EARTH_RADIUS).then(group => {
  earthGroup.add(group);
});

/* ---------- Cloud layer ---------- */
const cloudGeom = new THREE.SphereGeometry(EARTH_RADIUS + 0.02, 64, 64);
const cloudMat  = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.3,
  depthWrite: false
});
const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
scene.add(cloudMesh);

/* ---------- Procedural star dome ---------- */
const starCount = 3000;
const starPos = [];
for (let i = 0; i < starCount; i++) {
  const v = new THREE.Vector3().randomDirection().multiplyScalar(500);
  starPos.push(v.x, v.y, v.z);
}
const starGeom = new THREE.BufferGeometry();
starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
scene.add(new THREE.Points(starGeom, starMat));

/* ---------- Lights ---------- */
scene.add(new THREE.AmbientLight(0x333333));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(5, 3, 5);
scene.add(sun);

/* ---------- Resize handler ---------- */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- Render loop ---------- */
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

/* ---------- Exports ---------- */
export { scene, camera, renderer, controls, earthGroup, cloudMesh };

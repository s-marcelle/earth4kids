/* earth.js — accurate Earth with real country outlines
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';
import { OrbitControls } from '../libs/OrbitControls.js';
import GeoJSONGeometry from '../js/GeoJSONGeometry.js';

/* ---------- 1.  Setup ---------- */
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 0, 6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 15;

/* ---------- 2.  Earth sphere ---------- */
const earthRadius = 2;
const earthGeom   = new THREE.SphereGeometry(earthRadius, 64, 64);
const earthMat    = new THREE.MeshPhongMaterial({
  color: 0x1a4d80,      // deep ocean blue
  shininess: 5
});
const earthMesh = new THREE.Mesh(earthGeom, earthMat);
scene.add(earthMesh);

/* ---------- 3.  Procedural star dome ---------- */
const stars = 3000;
const starPos = [];
for (let i = 0; i < stars; i++) {
  const v = new THREE.Vector3().randomDirection().multiplyScalar(500);
  starPos.push(v.x, v.y, v.z);
}
const starGeom = new THREE.BufferGeometry();
starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
scene.add(new THREE.Points(starGeom, starMat));

/* ---------- 4.  Country outlines ---------- */
let countryLines;
fetch('../geojson/countries-110m.json')
  .then(r => r.json())
  .then(data => {
    const countries = topojson.feature(data, data.objects.countries);
    const lineMat   = new THREE.LineBasicMaterial({ color: 0x88ccff, linewidth:1 });
    countryLines    = new THREE.LineSegments(
      new THREE.GeoJSONGeometry(countries, earthRadius + 0.001),
      lineMat
    );
    earthMesh.add(countryLines);
  });

/* ---------- 5.  Clouds ---------- */
const cloudGeom = new THREE.SphereGeometry(earthRadius + 0.02, 64, 64);
const cloudMat  = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.3,
  depthWrite: false
});
const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
scene.add(cloudMesh);

/* ---------- 6.  Lights ---------- */
scene.add(new THREE.AmbientLight(0x333333));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(5, 3, 5);
scene.add(sun);

/* ---------- 7.  Render loop ---------- */
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

/* ---------- 8.  Resize ---------- */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- 9.  Exports ---------- */
export { scene, camera, renderer, controls, earthMesh, cloudMesh };

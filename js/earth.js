import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.156.0/examples/jsm/controls/OrbitControls.js';

const ASSETS = {
  earth:  './textures/earth-polygon.jpg',
  bump:   './textures/earth-bump.jpg',
  clouds: './textures/clouds.png',
  stars:  'https://threejs.org/examples/textures/2k_stars.jpg'
};

/* Scene basics */
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

/* Lights */
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(5, 3, 5);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x222244));

/* Stars */
const starSphere = new THREE.Mesh(
  new THREE.SphereGeometry(500, 60, 60),
  new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(ASSETS.stars),
    side: THREE.BackSide
  })
);
scene.add(starSphere);

/* Earth */
const earthGroup = new THREE.Group(); scene.add(earthGroup);

const earthMat = new THREE.MeshPhongMaterial({
  map: new THREE.TextureLoader().load(ASSETS.earth),
  bumpMap: new THREE.TextureLoader().load(ASSETS.bump),
  bumpScale: 0.04,
  shininess: 30
});
const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 64), earthMat);
earthMesh.name = 'earth';
earthGroup.add(earthMesh);

/* Clouds */
const cloudMat = new THREE.MeshPhongMaterial({
  map: new THREE.TextureLoader().load(ASSETS.clouds),
  transparent: true, opacity: 0.7, depthWrite: false
});
const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(2.02, 64, 64), cloudMat);
cloudMesh.name = 'clouds';
earthGroup.add(cloudMesh);

/* Camera & controls */
camera.position.set(0, 0, 6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 18;

/* Resize */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* Export what other modules need */
export { scene, camera, renderer, controls, earthMesh, cloudMesh, earthGroup };

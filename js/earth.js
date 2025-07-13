import * as THREE from './three.min.js';
import { OrbitControls } from './OrbitControls.js';

/* 1. Geo helper – VERY small JSON outline (degrees → radians) */
const DEG = Math.PI / 180;
const land = [ /* simplified land polygons (lat, lon) */
  /* N-America */
  [[50,-130],[25,-110],[30,-80],[45,-60],[60,-70],[70,-150]],
  /* S-America */
  [[10,-80],[-55,-70],[-55,-40],[10,-35]],
  /* Africa */
  [[35,-10],[35,50],[-35,50],[-35,-10]],
  /* Eurasia */
  [[35,-10],[35,180],[70,180],[70,30],[50,10]],
  /* Australia */
  [[-10,110],[-40,110],[-40,155],[-10,155]],
  /* Greenland */
  [[80,-70],[60,-70],[60,-20],[80,-20]]
];

/* 2. Build a single BufferGeometry */
const globe = new THREE.Group();
const earthGeom = new THREE.SphereGeometry(2, 64, 64);
/* Flat shading => each triangle owns 3 unique vertices */
earthGeom = earthGeom.toNonIndexed();
earthGeom.computeVertexNormals(); // still flat after toNonIndexed()

/* 3. Color buffer – ocean by default */
const colors = [];
const pos = earthGeom.attributes.position;
const ocean = new THREE.Color(0x5bc0eb); // bright pastel blue
const landColors = [
  new THREE.Color(0xffd23f), // yellow
  new THREE.Color(0xff6b6b), // coral
  new THREE.Color(0x4ecdc4), // teal
  new THREE.Color(0x95e1d3), // mint
  new THREE.Color(0xf38181), // rose
  new THREE.Color(0xa8e6cf)  // light green
];

/* For every triangle decide land vs ocean */
const temp = new THREE.Vector3();
for (let i = 0; i < pos.count; i += 3) {
  /* Use centroid of triangle */
  temp.fromBufferAttribute(pos, i)
      .add(temp.fromBufferAttribute(pos, i + 1))
      .add(temp.fromBufferAttribute(pos, i + 2))
      .divideScalar(3).normalize();

  const lat = 90 - Math.acos(temp.y) * 180 / Math.PI;
  const lon = (Math.atan2(temp.z, temp.x) * 180 / Math.PI + 180) % 360 - 180;

  let inside = false;
  for (const poly of land) {
    if (pointInPoly([lon, lat], poly)) { inside = true; break; }
  }

  const color = inside ? landColors[Math.floor(Math.random() * landColors.length)] : ocean;
  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);
}
earthGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

/* 4. Material & mesh */
const earthMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const earthMesh = new THREE.Mesh(earthGeom, earthMat);
globe.add(earthMesh);

/* 5. Cloud layer – same as before, but now a translucent sphere */
const cloudGeom = new THREE.SphereGeometry(2.02, 64, 64);
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
const cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
globe.add(cloudMesh);

/* 6. Scene & controls (unchanged) */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 0, 6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 18;

/* Starfield */
const starGeom = new THREE.SphereGeometry(500, 60, 60);
const starMat = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/2k_stars.jpg'),
  side: THREE.BackSide
});
scene.add(new THREE.Mesh(starGeom, starMat));
scene.add(globe);

/* Resize */
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* Export */
export { scene, camera, renderer, controls, earthMesh, cloudMesh, globe };

/* --- tiny point-in-poly util (ray-casting) --- */
function pointInPoly([px, py], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi + 1e-10) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

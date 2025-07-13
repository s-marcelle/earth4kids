import { earthMesh } from './earth.js';

const gameCountries = [
  {name:"France",      lat:46.2,  lon:2.2},
  {name:"Brazil",      lat:-14.2, lon:-51.9},
  {name:"Japan",       lat:36.2,  lon:138.2},
  {name:"Kenya",       lat:-0.02, lon:37.9},
  {name:"Canada",      lat:56.1,  lon:-106.3},
  {name:"Australia",   lat:-25.2, lon:133.7}
];

let currentGame = null;

/* Simple mapping lat/lon → 3-D point */
function latLonToVector3(lat, lon) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const x = -(Math.sin(phi) * Math.cos(theta));
  const z =  (Math.sin(phi) * Math.sin(theta));
  const y =  Math.cos(phi);
  return new THREE.Vector3(x, y, z).multiplyScalar(2);
}

/* Mini game */
function startGame() {
  currentGame = gameCountries[Math.floor(Math.random() * gameCountries.length)];
  showBubble(`🎲 Find ${currentGame.name}! Click it on the globe.`);
}

/* Click handler */
export function handleClick(event) {
  const pointer = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(earthMesh);
  if (!intersects.length) return;

  const point = intersects[0].point.clone().normalize();
  const lat = 90 - Math.acos(point.y) * 180 / Math.PI;
  const lon = (Math.atan2(point.z, point.x) * 180 / Math.PI + 180) % 360 - 180;

  if (currentGame) {
    const d = latLonToVector3(lat, lon)
                .distanceTo(latLonToVector3(currentGame.lat, currentGame.lon));
    if (d < 0.35) { // ~500 km tolerance
      showBubble(`🎉 You found ${currentGame.name}!`);
      currentGame = null;
    } else {
      showBubble(`Not quite! Try again.`);
    }
    return;
  }

  /* Fallback: just show coords */
  showBubble(`You clicked:<br>Lat ${lat.toFixed(1)}°, Lon ${lon.toFixed(1)}°`);
}

/* Bubble helper */
function showBubble(html) {
  const b = document.getElementById('bubble');
  document.getElementById('bubbleText').innerHTML = html;
  b.style.display = 'block';
}
document.getElementById('closeBubble').onclick = () => document.getElementById('bubble').style.display='none';

/* Expose game starter */
window.startGame = startGame;

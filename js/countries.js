/* countries.js – clickable landmass polygons + RESTCountries facts
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';
import { camera } from './main.js';
import { earthMesh } from './main.js';

/* ---------- 1.  Build Earth mesh (land + ocean) ---------- */
export async function buildEarthMesh(radius) {
  // 1.1 load world-atlas TopoJSON
  const res   = await fetch('../geojson/countries-110m.json');
  const data  = await res.json();
  const world = topojson.feature(data, data.objects.countries);

  const group = new THREE.Group();

  /* 1.2 Ocean sphere */
  const oceanGeom = new THREE.SphereGeometry(radius, 64, 64);
  const oceanMat  = new THREE.MeshPhongMaterial({ color: 0x1a4d80 });
  group.add(new THREE.Mesh(oceanGeom, oceanMat));

  /* 1.3 Country landmasses as coloured polygons */
  world.features.forEach(country => {
    const props = country.properties;
    const colour = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);

    country.geometry.coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        const shape = new THREE.Shape();
        ring.forEach(([lon, lat], idx) => {
          const { x, y } = latLonToXY(lat, lon, radius + 0.001);
          if (idx === 0) shape.moveTo(x, y);
          else           shape.lineTo(x, y);
        });

        const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
        const mat  = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData = props; // keep country info for click
        group.add(mesh);
      });
    });
  });

  /* 1.4 Ray-mesh click handler */
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();

  window.addEventListener('click', (event) => {
    if (!group.parent) return;

    // convert mouse to NDC
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(group.children);

    if (intersects.length) {
      const props = intersects[0].object.userData;
      showBubble(props);
    }
  });

  return group;
}

/* ---------- 2.  Helper: lat/lon → XY on sphere ---------- */
function latLonToXY(lat, lon, radius) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y =  radius * Math.cos(phi);
  // flatten to XY plane for THREE.Shape (works well enough for low-res topojson)
  return { x, y };
}

/* ---------- 3.  Bubble popup ---------- */
function showBubble(props) {
  const bubble = document.getElementById('bubble');
  const text   = document.getElementById('bubbleText');

  fetch(`https://restcountries.com/v3.1/alpha/${props.ISO_A3}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(([c]) => {
      text.innerHTML = `
        <img src="${c.flags.png}" width="36" style="vertical-align:middle;margin-right:6px;border-radius:4px">
        <strong>${c.name.common}</strong><br>
        Capital: ${c.capital?.[0] || '—'}<br>
        Population: ${c.population.toLocaleString()}
      `;
      bubble.style.display = 'block';
    })
    .catch(() => {
      text.innerHTML = `<strong>${props.NAME || 'Unknown'}</strong>`;
      bubble.style.display = 'block';
    });
}

/* globe.js – builds and wires the clickable globe
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';

export function buildEarth(radius, camera, scene) {
  /* 1. Ocean sphere */
  const oceanGeom = new THREE.SphereGeometry(radius, 64, 64);
  const oceanMat  = new THREE.MeshPhongMaterial({ color: 0x1a4d80 });
  scene.add(new THREE.Mesh(oceanGeom, oceanMat));

  /* 2. Load landmasses */
  fetch('/earth4kids/geojson/countries-110m.json')
    .then(r => r.json())
    .then(data => {
      const world = topojson.feature(data, data.objects.countries);

      world.features.forEach(country => {
        const props = country.properties;
        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);

        country.geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            const shape = new THREE.Shape();
            ring.forEach(([lon, lat], idx) => {
              const { x, z } = llToXZ(lat, lon, radius + 0.001);
              if (idx === 0) shape.moveTo(x, z);
              else           shape.lineTo(x, z);
            });

            const geom = new THREE.ShapeGeometry(shape);
            const mat  = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.userData = props;
            scene.add(mesh);
          });
        });
      });

      /* 3. Click handler */
      const raycaster = new THREE.Raycaster();
      const pointer   = new THREE.Vector2();
      window.addEventListener('click', (e) => {
        pointer.x = (e.clientX / innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / innerHeight) * 2 - 1;

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length) {
          const props = intersects[0].object.userData;
          showBubble(props);
        }
      });
    });

  /* helper */
  function llToXZ(lat, lon, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    const x = -r * Math.sin(phi) * Math.cos(theta);
    const z =  r * Math.sin(phi) * Math.sin(theta);
    return { x, z };
  }

  /* popup */
  function showBubble(props) {
    const bubble = document.getElementById('bubble');
    const text   = document.getElementById('bubbleText');
    const code   = props.ISO_A3 || props.ISO_A2 || 'UNKNOWN';

    fetch(`https://restcountries.com/v3.1/alpha/${code}`)
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
}

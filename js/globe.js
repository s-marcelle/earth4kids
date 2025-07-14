/* globe.js – build the low-poly globe with clickable countries
   Copyright (c) 2025 Sherwin Marcelle, MIT License */

import * as THREE from '../libs/three.js';

/* ---------- Helper: lat/lon → 2-D XY on a sphere ---------- */
function latLonToXY(lat, lon, radius) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y =  radius * Math.cos(phi);
  return { x, y }; // flatten for THREE.Shape
}

/* ---------- Main factory: returns a THREE.Group ---------- */
export async function buildEarthMesh(radius) {
  // 1. load TopoJSON
  const res  = await fetch('./geojson/countries-110m.json');
  const data = await res.json();
  const world = topojson.feature(data, data.objects.countries);

  const group = new THREE.Group();

  // 2. Ocean sphere
  const oceanGeom = new THREE.SphereGeometry(radius, 64, 64);
  const oceanMat  = new THREE.MeshPhongMaterial({ color: 0x1a4d80 });
  group.add(new THREE.Mesh(oceanGeom, oceanMat));

  // 3. Countries (Polygons + MultiPolygons)
  world.features.forEach(country => {
    const props = country.properties;
    const colour = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);

    // Normalize geometry to an array of polygons
    const polygons =
      country.geometry.type === 'Polygon'
        ? [country.geometry.coordinates]
        : country.geometry.coordinates;

    polygons.forEach(rings => {
      // rings[0] is outer boundary; ignore inner holes
      const outer = rings[0];
      const shape = new THREE.Shape();
      outer.forEach(([lon, lat], idx) => {
        const { x, y } = latLonToXY(lat, lon, radius + 0.001);
        idx === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
      });

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 0.01,
        bevelEnabled: false
      });
      const mat = new THREE.MeshBasicMaterial({
        color: colour,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData = props; // store metadata for click handling
      group.add(mesh);
    });
  });

  return group;
}

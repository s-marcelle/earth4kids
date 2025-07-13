/* tiny helper that converts GeoJSON MultiPolygon → THREE.BufferGeometry */
export default class GeoJSONGeometry extends THREE.BufferGeometry {
  constructor(geojson, radius) {
    super();
    const vertices = [];
    geojson.features.forEach(f => {
      f.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          for (let i = 0; i < ring.length - 1; i++) {
            const [lon1, lat1] = ring[i];
            const [lon2, lat2] = ring[i + 1];
            vertices.push(...llToXYZ(lat1, lon1, radius));
            vertices.push(...llToXYZ(lat2, lon2, radius));
          }
        });
      });
    });
    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    function llToXYZ(lat, lon, r) {
      const phi   = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      const x = -r * Math.sin(phi) * Math.cos(theta);
      const y =  r * Math.cos(phi);
      const z =  r * Math.sin(phi) * Math.sin(theta);
      return [x, y, z];
    }
  }
}

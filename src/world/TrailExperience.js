import * as THREE from 'three';

// World-space offsets from the summit anchor. Shared with structural collision.
export const SUMMIT_LAYOUT = Object.freeze({
  fire: { x: 22, z: 42 }, tent: { x: 5, z: 43 },
  shelter: { x: 42, z: 35 }, wood: { x: 12, z: 51 },
  weather: { x: 40, z: 48 }, register: { x: 0, z: 24 },
});

/** A continuous, terrain-draped ribbon. Subdivide in BOTH axes to avoid water
 * planes bridging empty space or disappearing into banks. Also used for gravel. */
export function terrainRibbon(road, points, width, material, lift = 0.18, name = 'CreekRibbon') {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const rows = Math.max(24, Math.ceil(curve.getLength() / 1.5));
  const cols = 8;
  const vertices = [], uvs = [], indices = [];
  let distance = 0, previous = null;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    if (previous) distance += p.distanceTo(previous);
    previous = p;
    const bankWander = 1 + Math.sin(t * 27) * 0.08 + Math.sin(t * 49) * 0.035;
    for (let j = 0; j <= cols; j++) {
      const u = j / cols, off = (u - 0.5) * width * bankWander;
      const x = p.x + n.x * off, z = p.z + n.z * off;
      vertices.push(x, road.getGroundElevation(x, z) + lift, z);
      uvs.push(u, distance / 8);
      if (i < rows && j < cols) {
        const a = i * (cols + 1) + j, b = a + cols + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

export function trailSign(title, subtitle, width = 5.5, color = '#163f39', heightCustom = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 800;
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';

  // Base background
  c.fillStyle = color;
  c.fillRect(0, 0, 2048, 800);

  // Outer border (Cream / Amber reflective border)
  c.strokeStyle = '#f2e6bc';
  c.lineWidth = 28;
  c.strokeRect(26, 26, 1996, 748);

  // Inner decorative pinstripe border
  c.strokeStyle = 'rgba(254, 240, 138, 0.55)';
  c.lineWidth = 10;
  c.strokeRect(58, 58, 1932, 684);

  // Corner mounting rivets
  const rivets = [[58, 58], [1990, 58], [58, 742], [1990, 742]];
  c.fillStyle = '#fde047';
  rivets.forEach(([rx, ry]) => {
    c.beginPath();
    c.arc(rx, ry, 14, 0, Math.PI * 2);
    c.fill();
  });

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  // Title: massive high-contrast bold typography with drop shadow for distance legibility
  const titleLen = (title || '').length;
  const titleFontSize = titleLen > 28 ? 135 : (titleLen > 20 ? 155 : 180);
  const titleY = subtitle ? 295 : 400;

  c.fillStyle = 'rgba(0, 0, 0, 0.85)';
  c.font = `900 ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
  c.fillText(title, 1024 + 4, titleY + 4, 1850);
  c.fillStyle = '#fffbeb';
  c.fillText(title, 1024, titleY, 1850);

  // Subtitle: bold warm amber guidance text
  if (subtitle) {
    const subLen = subtitle.length;
    const subFontSize = subLen > 38 ? 74 : (subLen > 26 ? 88 : 102);
    c.fillStyle = 'rgba(0, 0, 0, 0.85)';
    c.font = `900 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif`;
    c.fillText(subtitle, 1024 + 3, 545 + 3, 1850);
    c.fillStyle = '#fef08a';
    c.fillText(subtitle, 1024, 545, 1850);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  // FrontSide with polygonOffset ensures crisp depth rendering and zero z-fighting
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const signH = heightCustom !== null ? heightCustom : (width * 0.39);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, signH), material);
  mesh.name = `Sign_${title}`;
  return mesh;
}

/** Place amenities on their own pad, not at the original deck's elevation. */
export function placeSummitProp(group, road, anchor, spot) {
  group.position.set(spot.x,
    road.getGroundElevation(anchor.x + spot.x, anchor.z + spot.z) - anchor.y + 0.24,
    spot.z);
}

// Rounded clearing footprint and generous vegetation setback, in summit-local metres.
export const SUMMIT_CLEARING = Object.freeze({ x: 26, z: 25, rx: 32, rz: 33 });
export function isInsideSummitClearing(x, z, margin = 0) {
  const c = SUMMIT_CLEARING;
  return ((x - c.x) / (c.rx + margin)) ** 2 + ((z - c.z) / (c.rz + margin)) ** 2 <= 1;
}

export function buildSummitClearing(road, anchor, gravelMaterial, timberMaterial) {
  const group = new THREE.Group(); group.name = 'SummitOpenClearing';
  // Ground-draped, softly scalloped gravel rather than a floating rectangular slab.
  const c = SUMMIT_CLEARING, positions = [], colors = [], indices = [];
  const rings = 18, slices = 96;
  const inner = new THREE.Color(0xb8a080), outer = new THREE.Color(0x75644e);
  for (let r = 0; r <= rings; r++) {
    for (let i = 0; i <= slices; i++) {
      const a = i / slices * Math.PI * 2, t = r / rings;
      const scallop = 1 + 0.018 * Math.sin(a * 5) + 0.012 * Math.cos(a * 9);
      const x = anchor.x + c.x + Math.cos(a) * c.rx * t * scallop;
      const z = anchor.z + c.z + Math.sin(a) * c.rz * t * scallop;
      positions.push(x, road.getGroundElevation(x, z) + 0.10, z);
      const color = inner.clone().lerp(outer, Math.max(0, (t - 0.78) / 0.22));
      color.multiplyScalar(0.96 + 0.04 * Math.sin(i * 13 + r * 7));
      colors.push(color.r, color.g, color.b);
      if (r < rings && i < slices) {
        const v = r * (slices + 1) + i, n = v + slices + 1;
        indices.push(v, v + 1, n, v + 1, n + 1, n);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide });
  const terrace = new THREE.Mesh(geo, mat);
  terrace.name = 'SummitGravelTerrace'; terrace.receiveShadow = true; group.add(terrace);
  for (const [key, spot] of Object.entries(SUMMIT_LAYOUT)) {
    const r = key === 'shelter' ? 6 : key === 'tent' ? 5 : key === 'fire' ? 4 : 2;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.3, 0.12, 24), gravelMaterial);
    pad.name = `SummitPad_${key}`;
    pad.position.set(anchor.x + spot.x, road.getGroundElevation(anchor.x + spot.x, anchor.z + spot.z) + 0.18, anchor.z + spot.z);
    group.add(pad);
  }
  // Just four low edge markers; no picket line enclosing the camp or turning area.
  for (const a of [0.65, 1.05, 1.9, 2.3]) {
    const x = anchor.x + c.x + Math.cos(a) * (c.rx - 1);
    const z = anchor.z + c.z + Math.sin(a) * (c.rz - 1);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.8, 6), timberMaterial);
    post.position.set(x, road.getGroundElevation(x, z) + 0.4, z);
    group.add(post);
  }
  return group;
}

/** Ground arrows + continuous pale shoulders + repeated blue/cream markers.
 * Shapes and text carry meaning too; navigation does not rely on color alone. */
export function buildDescentWayfinding(road, spine, frames, material) {
  const group = new THREE.Group(); group.name = 'DescentWayfinding';
  const pale = new THREE.MeshStandardMaterial({color:0xddd0a9, roughness:0.95, side:THREE.DoubleSide});
  for (const side of [-1, 1]) {
    const points = spine.map((s,i)=>s.pos.clone().addScaledVector(frames[i].norm, side * (s.width * 0.5 + 0.65)));
    group.add(terrainRibbon(road, points, 1.1, pale, 0.18, `DescentPaleShoulder_${side}`));
  }
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.32, -2); arrowShape.lineTo(0.32, -2);
  arrowShape.lineTo(0.32, 0); arrowShape.lineTo(1.2, 0);
  arrowShape.lineTo(0, 2); arrowShape.lineTo(-1.2, 0);
  arrowShape.lineTo(-0.32, 0); arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(Math.PI / 2); // +shape Y -> forward world +Z
  for (let i = 3; i < spine.length - 3; i += 8) {
    const sp = spine[i], {dir,norm} = frames[i];
    const arrow = new THREE.Mesh(arrowGeo, pale);
    arrow.name = 'DownhillGroundArrow';
    arrow.rotation.y = Math.atan2(dir.x, dir.z);
    arrow.position.copy(sp.pos); arrow.position.y += 0.20;
    // Match the local grade so arrows do not float above a descending slope.
    const next = spine[Math.min(i+1,spine.length-1)].pos;
    const prev = spine[Math.max(i-1,0)].pos;
    arrow.rotation.x = -Math.atan2(next.y-prev.y, Math.hypot(next.x-prev.x,next.z-prev.z));
    group.add(arrow);
    for (const side of [-1,1]) {
      const p = sp.pos.clone().addScaledVector(norm, side*(sp.width*0.5+1.6));
      p.y = road.getGroundElevation(p.x,p.z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.13,1.8,6),material);
      post.position.copy(p); post.position.y += 0.9; group.add(post);
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.55,0.14),pale);
      marker.position.copy(p); marker.position.y += 1.55;
      marker.rotation.y = Math.atan2(dir.x,dir.z); group.add(marker);
    }
  }
  return group;
}

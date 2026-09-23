import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * 🏛️ Authentic San Francisco Painted Ladies Historical Color Palettes
 */
export const PAINTED_LADIES_PALETTES = [
  // 1. Pacific Heights Sky Blue & Cream (Iconic Steiner St. lead house)
  {
    name: 'Pacific Sky Blue',
    body: 0x82b1d6,
    trim: 0xfbfbf8,
    accent: 0x1e3d59,
    roof: 0x2b303a,
    foundation: 0x6e6863,
    door: 0xa83232,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  },
  // 2. Alamo Ochre Gold & Crisp Linen
  {
    name: 'Alamo Ochre',
    body: 0xdfb15b,
    trim: 0xffffff,
    accent: 0x8c3a27,
    roof: 0x343a40,
    foundation: 0x5c554e,
    door: 0x2d4030,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  },
  // 3. Postcard Celadon Sage & Warm Alabaster
  {
    name: 'Celadon Sage',
    body: 0x93b79e,
    trim: 0xfef9ed,
    accent: 0x2c5234,
    roof: 0x283038,
    foundation: 0x555850,
    door: 0x7c2d12,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  },
  // 4. Victorian Dusty Rose & Classic Cream
  {
    name: 'Victorian Rose',
    body: 0xd49b9b,
    trim: 0xfffcf2,
    accent: 0x54233b,
    roof: 0x32353b,
    foundation: 0x615a56,
    door: 0x233142,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  },
  // 5. Queen Anne Mauve & Pearl Ivory
  {
    name: 'Queen Anne Mauve',
    body: 0xb59ec6,
    trim: 0xfbf8f3,
    accent: 0x3d2b56,
    roof: 0x2c2f35,
    foundation: 0x575259,
    door: 0x8b3a3a,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  },
  // 6. Telegraph Hill Mint & Coral Terracotta
  {
    name: 'Telegraph Mint',
    body: 0xa4cbbd,
    trim: 0xfcfbfa,
    accent: 0xb85d43,
    roof: 0x363d45,
    foundation: 0x606660,
    door: 0x1b3b4a,
    glass: 0x1c2b36,
    hardware: 0xd4af37
  }
];

export const Archetypes = {
  VICTORIAN_QUEEN_ANNE: 'victorian_queen_anne',
  VICTORIAN_MANOR: 'victorian_manor',
  MISSION_BASILICA: 'mission_basilica',
  STORYBOOK_COTTAGE: 'storybook_cottage',
  HISTORIC_LODGE: 'historic_lodge',
  CANNERY_FACTORY: 'cannery_factory',
  HISTORIC_BARN: 'historic_barn',
  MARKET_ARCADE: 'market_arcade',
  COMMERCIAL_MAIN_STREET: 'commercial_main_street',
  ROADSIDE_DINER: 'roadside_diner',
  SEAFOOD_SHACK: 'seafood_shack',
  WINERY_CHATEAU: 'winery_chateau',
  COASTAL_COTTAGE: 'coastal_cottage',
  RUSTIC_WAREHOUSE: 'rustic_warehouse'
};

/**
 * 🧱 Procedural Structure Builder
 * Generates authentic architectural buildings compiled into optimal
 * material-slot BufferGeometries for 60 FPS performance and zero floating gaps.
 */
export class ProceduralStructureBuilder {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.cachedMaterials = new Map();
  }

  getMaterial(colorHex, type = 'standard', options = {}) {
    const key = `${type}_${colorHex}_${JSON.stringify(options)}`;
    if (this.cachedMaterials.has(key)) {
      return this.cachedMaterials.get(key);
    }

    let mat;
    if (this.renderer && typeof this.renderer.createToonMaterial === 'function') {
      let normalMap = null;
      let roughness = options.roughness !== undefined ? options.roughness : 0.65;
      let metalness = options.metalness !== undefined ? options.metalness : 0.08;

      if (this.renderer.textures) {
        if (type === 'foundation' || type === 'stone') {
          normalMap = this.renderer.textures.stoneMasonryNormalPBR ? this.renderer.textures.stoneMasonryNormalPBR(512) : null;
          roughness = 0.88;
        } else if (type === 'body' || type === 'trim') {
          normalMap = this.renderer.textures.weatheredWoodNormalPBR ? this.renderer.textures.weatheredWoodNormalPBR(512) : null;
          roughness = 0.72;
        } else if (type === 'glass') {
          roughness = 0.10;
          metalness = 0.85;
        } else if (type === 'hardware' || type === 'metal') {
          metalness = 0.82;
          roughness = 0.32;
        }
      }

      const matParams = {
        color: new THREE.Color(colorHex),
        roughness: roughness,
        metalness: metalness,
        transparent: options.transparent || (type === 'glass'),
        opacity: options.opacity !== undefined ? options.opacity : (type === 'glass' ? 0.82 : 1.0)
      };
      if (normalMap) {
        matParams.normalMap = normalMap;
        matParams.normalScale = new THREE.Vector2(0.6, 0.6);
      }

      mat = new THREE.MeshStandardMaterial(matParams);
    } else {
      mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(colorHex),
        transparent: options.transparent || false,
        opacity: options.opacity !== undefined ? options.opacity : 1.0
      });
    }

    this.cachedMaterials.set(key, mat);
    return mat;
  }

  _createGeometryAccumulator() {
    const slots = {
      body: [],
      trim: [],
      accent: [],
      roof: [],
      foundation: [],
      glass: [],
      door: [],
      hardware: []
    };

    const addBox = (slot, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      if (rx !== 0) geo.rotateX(rx);
      if (ry !== 0) geo.rotateY(ry);
      if (rz !== 0) geo.rotateZ(rz);
      geo.translate(x, y, z);
      slots[slot].push(geo);
    };

    const addCylinder = (slot, rt, rb, h, segs, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const geo = new THREE.CylinderGeometry(rt, rb, h, segs);
      if (rx !== 0) geo.rotateX(rx);
      if (ry !== 0) geo.rotateY(ry);
      if (rz !== 0) geo.rotateZ(rz);
      geo.translate(x, y, z);
      slots[slot].push(geo);
    };

    const addPrism = (slot, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const shape = new THREE.Shape();
      shape.moveTo(-w * 0.5, 0);
      shape.lineTo(w * 0.5, 0);
      shape.lineTo(0, h);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d * 0.5);
      if (rx !== 0) geo.rotateX(rx);
      if (ry !== 0) geo.rotateY(ry);
      if (rz !== 0) geo.rotateZ(rz);
      geo.translate(x, y, z);
      slots[slot].push(geo);
    };

    return { slots, addBox, addCylinder, addPrism };
  }

  _compileToGroup(slots, materials) {
    const group = new THREE.Group();

    for (const [slotName, geoms] of Object.entries(slots)) {
      if (!geoms || geoms.length === 0) continue;

      const mat = materials[slotName] || this.getMaterial(0xcccccc);
      let finalGeo = null;

      if (geoms.length === 1) {
        finalGeo = geoms[0];
      } else {
        try {
          const hasIndexed = geoms.some(g => !g.index);
          const hasNonIndexed = geoms.some(g => !g.index);
          const normalized = (hasIndexed && hasNonIndexed)
            ? geoms.map(g => (g.index ? g.toNonIndexed() : g))
            : geoms;

          finalGeo = mergeGeometries(normalized, false);
          if (!finalGeo) {
            geoms.forEach(g => {
              const m = new THREE.Mesh(g, mat);
              m.castShadow = true;
              m.receiveShadow = true;
              group.add(m);
            });
            continue;
          }
        } catch (e) {
          geoms.forEach(g => {
            const m = new THREE.Mesh(g, mat);
            m.castShadow = true;
            m.receiveShadow = true;
            group.add(m);
          });
          continue;
        }
      }

      if (finalGeo) {
        finalGeo.computeVertexNormals();
        const mesh = new THREE.Mesh(finalGeo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `structure_${slotName}`;
        group.add(mesh);
      }
    }

    return group;
  }

  /**
   * 🏠 Build Queen Anne Victorian House (SF Painted Ladies Style)
   */
  buildVictorianHouse(options = {}) {
    const {
      palette = PAINTED_LADIES_PALETTES[0],
      width = 9.2,
      depth = 13.0,
      stories = 3,
      storyHeight = 3.2,
      foundationHeight = 1.6,
      subterraneanDepth = 4.5,
      baySide = 'right',
      hasGableOrnament = true,
      hasPorchRailings = true
    } = options;

    const materials = {
      body: this.getMaterial(palette.body, 'body'),
      trim: this.getMaterial(palette.trim, 'trim'),
      accent: this.getMaterial(palette.accent, 'accent'),
      roof: this.getMaterial(palette.roof, 'roof'),
      foundation: this.getMaterial(palette.foundation, 'foundation'),
      glass: this.getMaterial(palette.glass, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(palette.door, 'door'),
      hardware: this.getMaterial(palette.hardware, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const totalHeight = stories * storyHeight;

    // Foundation / Plinth
    const groundBaseY = -subterraneanDepth * 0.5 + foundationHeight * 0.5;
    const foundationTotalH = subterraneanDepth + foundationHeight;
    addBox('foundation', width + 0.3, foundationTotalH, depth + 0.3, 0, groundBaseY, 0);
    addBox('trim', width + 0.5, 0.22, depth + 0.5, 0, foundationHeight, 0);

    // Cellar Windows
    const cellarWinW = 1.0;
    const cellarWinH = 0.6;
    [-halfW * 0.5, halfW * 0.5].forEach(cx => {
      addBox('accent', cellarWinW + 0.16, cellarWinH + 0.16, 0.12, cx, foundationHeight * 0.5, halfD + 0.16);
      addBox('glass', cellarWinW, cellarWinH, 0.08, cx, foundationHeight * 0.5, halfD + 0.18);
      [-0.3, 0, 0.3].forEach(bx => {
        addCylinder('hardware', 0.02, 0.02, cellarWinH, 6, cx + bx, foundationHeight * 0.5, halfD + 0.22);
      });
    });

    // Main Massing
    const bodyCenterY = foundationHeight + totalHeight * 0.5;
    addBox('body', width, totalHeight, depth, 0, bodyCenterY, 0);

    for (let s = 1; s <= stories; s++) {
      const beltY = foundationHeight + s * storyHeight;
      if (s !== stories) {
        addBox('trim', width + 0.25, 0.22, depth + 0.25, 0, beltY, 0);
        addBox('accent', width + 0.35, 0.08, depth + 0.35, 0, beltY + 0.1, 0);
      }
    }

    // Corner Quoins
    const quoinW = 0.32;
    const quoinD = 0.08;
    for (let cornerX of [-halfW - 0.02, halfW + 0.02]) {
      for (let cornerZ of [-halfD - 0.02, halfD + 0.02]) {
        addBox('trim', quoinW, totalHeight, quoinD, cornerX + (cornerX > 0 ? -quoinW * 0.5 : quoinW * 0.5), bodyCenterY, cornerZ);
      }
    }

    // Facade Clapboard Relief
    for (let h = foundationHeight + 0.6; h < foundationHeight + totalHeight - 0.4; h += 0.8) {
      addBox('accent', width + 0.04, 0.04, 0.04, 0, h, halfD + 0.02);
    }

    // Queen Anne Canted Bay Windows
    const baySign = baySide === 'right' ? 1 : -1;
    const bayCenterX = baySign * (halfW * 0.46);
    const bayW = 3.6;
    const bayProjection = 1.35;
    const bayFacetW = 1.4;

    const corbelBaseY = foundationHeight + 0.4;
    [-1.2, 0, 1.2].forEach(cbx => {
      addBox('trim', 0.25, 0.8, 0.6, bayCenterX + cbx, corbelBaseY, halfD + 0.3);
      addBox('accent', 0.18, 0.6, 0.5, bayCenterX + cbx, corbelBaseY - 0.1, halfD + 0.35);
    });

    for (let s = 0; s < stories; s++) {
      const storyBaseY = foundationHeight + s * storyHeight;
      const bayStoryH = storyHeight;
      const bayStoryCenterY = storyBaseY + bayStoryH * 0.5;

      const centerZ = halfD + bayProjection;
      addBox('body', bayFacetW, bayStoryH, 0.1, bayCenterX, bayStoryCenterY, centerZ);

      const leftAngle = Math.PI * 0.25;
      const leftX = bayCenterX - bayFacetW * 0.5 - Math.cos(leftAngle) * (bayFacetW * 0.5 * 0.7);
      const leftZ = halfD + bayProjection * 0.55;
      addBox('body', bayFacetW * 0.95, bayStoryH, 0.1, leftX, bayStoryCenterY, leftZ, 0, leftAngle, 0);

      const rightAngle = -Math.PI * 0.25;
      const rightX = bayCenterX + bayFacetW * 0.5 + Math.cos(leftAngle) * (bayFacetW * 0.5 * 0.7);
      const rightZ = halfD + bayProjection * 0.55;
      addBox('body', bayFacetW * 0.95, bayStoryH, 0.1, rightX, bayStoryCenterY, rightZ, 0, rightAngle, 0);

      const winW = 0.85;
      const winH = 1.9;
      const winY = storyBaseY + 1.25;

      addBox('trim', winW + 0.2, winH + 0.3, 0.12, bayCenterX, winY, centerZ + 0.05);
      addBox('glass', winW, winH, 0.06, bayCenterX, winY, centerZ + 0.08);
      addBox('accent', winW + 0.32, 0.12, 0.22, bayCenterX, winY - winH * 0.5 - 0.06, centerZ + 0.1);
      addBox('accent', winW + 0.32, 0.15, 0.22, bayCenterX, winY + winH * 0.5 + 0.08, centerZ + 0.1);
      addBox('trim', winW, 0.04, 0.08, bayCenterX, winY, centerZ + 0.09);
      addBox('trim', 0.04, winH, 0.08, bayCenterX, winY, centerZ + 0.09);

      addBox('trim', winW + 0.16, winH + 0.26, 0.1, leftX, winY, leftZ + 0.04, 0, leftAngle, 0);
      addBox('glass', winW, winH, 0.06, leftX, winY, leftZ + 0.06, 0, leftAngle, 0);
      addBox('trim', winW, 0.04, 0.08, leftX, winY, leftZ + 0.07, 0, leftAngle, 0);

      addBox('trim', winW + 0.16, winH + 0.26, 0.1, rightX, winY, rightZ + 0.04, 0, rightAngle, 0);
      addBox('glass', winW, winH, 0.06, rightX, winY, rightZ + 0.06, 0, rightAngle, 0);
      addBox('trim', winW, 0.04, 0.08, rightX, winY, rightZ + 0.07, 0, rightAngle, 0);

      const apronY = storyBaseY + 0.45;
      addBox('accent', winW, 0.55, 0.08, bayCenterX, apronY, centerZ + 0.05);
      addBox('trim', winW - 0.16, 0.4, 0.1, bayCenterX, apronY, centerZ + 0.07);

      addBox('trim', bayW * 1.05, 0.22, 0.35, bayCenterX, storyBaseY + storyHeight, centerZ);
      addBox('accent', bayW * 1.12, 0.08, 0.42, bayCenterX, storyBaseY + storyHeight + 0.08, centerZ);
    }

    // Porch & Stoop
    const porchSideSign = -baySign;
    const porchCenterX = porchSideSign * (halfW * 0.48);
    const porchLandingW = 3.2;
    const porchLandingD = 2.4;
    const porchLandingY = foundationHeight;

    addBox('foundation', porchLandingW, foundationHeight + subterraneanDepth, porchLandingD, porchCenterX, groundBaseY, halfD + porchLandingD * 0.5);
    addBox('trim', porchLandingW + 0.2, 0.16, porchLandingD + 0.2, porchCenterX, porchLandingY, halfD + porchLandingD * 0.5);

    const stepCount = 6;
    const stepDepth = 0.38;
    const stepHeight = (foundationHeight + 0.1) / stepCount;
    for (let st = 0; st < stepCount; st++) {
      const stepY = porchLandingY - (st + 1) * stepHeight + stepHeight * 0.5;
      const stepZ = halfD + porchLandingD + (st + 0.5) * stepDepth;
      const stepW = porchLandingW - st * 0.08;
      addBox('trim', stepW, stepHeight, stepDepth + 0.04, porchCenterX, stepY, stepZ);
      addBox('foundation', stepW - 0.1, stepHeight, stepDepth, porchCenterX, stepY - 0.02, stepZ);
    }

    if (hasPorchRailings) {
      const railH = 0.95;
      const stairTotalD = stepCount * stepDepth;
      const stairSlopeLen = Math.sqrt(stairTotalD * stairTotalD + foundationHeight * foundationHeight);
      const stairAngle = Math.atan2(foundationHeight, stairTotalD);

      for (let sgn of [-1, 1]) {
        const postX = porchCenterX + sgn * (porchLandingW * 0.5 - 0.1);
        const footZ = halfD + porchLandingD + stairTotalD;
        addBox('trim', 0.22, 1.2, 0.22, postX, 0.55, footZ);
        addCylinder('hardware', 0.09, 0.09, 0.18, 8, postX, 1.22, footZ);

        addBox('trim', 0.22, 1.2, 0.22, postX, porchLandingY + 0.55, halfD + porchLandingD);
        addCylinder('hardware', 0.09, 0.09, 0.18, 8, postX, porchLandingY + 1.22, halfD + porchLandingD);

        const midStairZ = halfD + porchLandingD + stairTotalD * 0.5;
        const midStairY = porchLandingY * 0.5 + railH * 0.85;
        addBox('trim', 0.08, 0.12, stairSlopeLen, postX, midStairY, midStairZ, stairAngle, 0, 0);
        addBox('trim', 0.08, 0.1, porchLandingD, postX, porchLandingY + railH, halfD + porchLandingD * 0.5);
      }
    }

    // Columns & Porch Pediment
    const colHeight = storyHeight - 0.4;
    const colY = porchLandingY + colHeight * 0.5;
    const colZ = halfD + porchLandingD - 0.25;
    for (let sgn of [-1, 1]) {
      const colX = porchCenterX + sgn * (porchLandingW * 0.5 - 0.35);
      addBox('trim', 0.35, 0.4, 0.35, colX, porchLandingY + 0.2, colZ);
      addCylinder('trim', 0.12, 0.14, colHeight - 0.6, 10, colX, colY, colZ);
      addBox('trim', 0.38, 0.25, 0.38, colX, porchLandingY + colHeight - 0.1, colZ);
      addBox('accent', 0.28, 0.35, 0.45, colX, porchLandingY + colHeight, colZ + 0.1);
    }

    const porchRoofY = porchLandingY + colHeight;
    addBox('trim', porchLandingW + 0.4, 0.22, porchLandingD + 0.4, porchCenterX, porchRoofY, halfD + porchLandingD * 0.5);
    addPrism('roof', porchLandingW + 0.3, 0.85, porchLandingD + 0.2, porchCenterX, porchRoofY + 0.1, halfD + porchLandingD * 0.5);
    addBox('accent', porchLandingW * 0.7, 0.3, 0.08, porchCenterX, porchRoofY + 0.35, halfD + porchLandingD + 0.1);

    // Front Door
    const doorW = 1.35;
    const doorH = 2.45;
    const doorY = porchLandingY + doorH * 0.5 + 0.05;
    const doorZ = halfD + 0.04;
    addBox('trim', doorW + 0.35, doorH + 0.45, 0.16, porchCenterX, doorY + 0.08, doorZ);
    addBox('door', doorW, doorH, 0.1, porchCenterX, doorY, doorZ + 0.04);
    [-0.28, 0.28].forEach(px => {
      [doorY - 0.55, doorY + 0.35].forEach(py => {
        addBox('accent', 0.42, 0.68, 0.06, porchCenterX + px, py, doorZ + 0.09);
      });
    });
    addBox('trim', doorW, 0.45, 0.12, porchCenterX, porchLandingY + doorH + 0.32, doorZ + 0.04);
    addBox('glass', doorW - 0.15, 0.35, 0.08, porchCenterX, porchLandingY + doorH + 0.32, doorZ + 0.06);
    addCylinder('hardware', 0.04, 0.04, 0.06, 8, porchCenterX + 0.45, porchLandingY + 1.05, doorZ + 0.11, Math.PI * 0.5, 0, 0);

    // Upper Windows
    for (let s = 1; s < stories; s++) {
      const winFloorBaseY = foundationHeight + s * storyHeight;
      const upperWinW = 1.1;
      const upperWinH = 1.95;
      const upperWinY = winFloorBaseY + 1.3;
      const upperWinZ = halfD + 0.06;

      addBox('trim', upperWinW + 0.3, upperWinH + 0.4, 0.14, porchCenterX, upperWinY, upperWinZ);
      addBox('glass', upperWinW, upperWinH, 0.08, porchCenterX, upperWinY, upperWinZ + 0.04);
      addPrism('trim', upperWinW + 0.45, 0.45, 0.22, porchCenterX, upperWinY + upperWinH * 0.5 + 0.2, upperWinZ + 0.08);
      addBox('accent', upperWinW + 0.4, 0.12, 0.22, porchCenterX, upperWinY - upperWinH * 0.5 - 0.06, upperWinZ + 0.08);
      addBox('trim', upperWinW, 0.04, 0.06, porchCenterX, upperWinY, upperWinZ + 0.05);
      addBox('trim', 0.04, upperWinH, 0.06, porchCenterX, upperWinY, upperWinZ + 0.05);
    }

    // Cornices & Eaves
    const roofBaseY = foundationHeight + totalHeight;
    addBox('trim', width + 0.2, 0.6, depth + 0.2, 0, roofBaseY - 0.3, 0);

    const dentilCount = Math.floor(width / 0.35);
    const dentilSpacing = width / dentilCount;
    for (let i = 0; i < dentilCount; i++) {
      const dx = -halfW + (i + 0.5) * dentilSpacing;
      addBox('accent', 0.16, 0.18, 0.12, dx, roofBaseY - 0.3, halfD + 0.16);
    }

    addBox('trim', width + 0.8, 0.28, depth + 0.8, 0, roofBaseY, 0);
    addBox('accent', width + 1.0, 0.14, depth + 1.0, 0, roofBaseY + 0.15, 0);

    const bracketCount = 8;
    const bracketSpacing = width / (bracketCount - 1);
    for (let b = 0; b < bracketCount; b++) {
      const bx = -halfW + b * bracketSpacing;
      addBox('trim', 0.2, 0.45, 0.45, bx, roofBaseY - 0.2, halfD + 0.35);
      addBox('accent', 0.12, 0.35, 0.38, bx, roofBaseY - 0.22, halfD + 0.38);
    }

    // Roof & Ornaments
    const roofApexHeight = 3.6;
    const roofApexY = roofBaseY + 0.2;
    addPrism('roof', width + 0.6, roofApexHeight, depth + 0.8, 0, roofApexY, 0);

    if (hasGableOrnament) {
      const bargeboardThickness = 0.22;
      addBox('trim', 0.25, roofApexHeight * 1.08, bargeboardThickness, -halfW * 0.52, roofApexY + roofApexHeight * 0.48, halfD + 0.42, 0, 0, -Math.atan2(roofApexHeight, halfW));
      addBox('trim', 0.25, roofApexHeight * 1.08, bargeboardThickness, halfW * 0.52, roofApexY + roofApexHeight * 0.48, halfD + 0.42, 0, 0, Math.atan2(roofApexHeight, halfW));

      const tympanumCenterY = roofApexY + roofApexHeight * 0.45;
      addBox('accent', width * 0.65, roofApexHeight * 0.6, 0.08, 0, tympanumCenterY, halfD + 0.41);

      for (let angleDeg = -60; angleDeg <= 60; angleDeg += 20) {
        const rad = (angleDeg * Math.PI) / 180;
        addBox('trim', 0.08, roofApexHeight * 0.42, 0.12, Math.sin(rad) * 0.8, tympanumCenterY + Math.cos(rad) * 0.4, halfD + 0.44, 0, 0, -rad);
      }

      addCylinder('trim', 0.55, 0.55, 0.16, 12, 0, roofApexY + roofApexHeight * 0.62, halfD + 0.46, Math.PI * 0.5, 0, 0);
      addCylinder('glass', 0.42, 0.42, 0.18, 12, 0, roofApexY + roofApexHeight * 0.62, halfD + 0.46, Math.PI * 0.5, 0, 0);
      addBox('trim', 0.84, 0.05, 0.19, 0, roofApexY + roofApexHeight * 0.62, halfD + 0.46);
      addBox('trim', 0.05, 0.84, 0.19, 0, roofApexY + roofApexHeight * 0.62, halfD + 0.46);

      const finialApexY = roofApexY + roofApexHeight;
      addCylinder('hardware', 0.04, 0.12, 1.4, 8, 0, finialApexY + 0.7, halfD + 0.42);
      addCylinder('hardware', 0.15, 0.15, 0.25, 8, 0, finialApexY + 0.2, halfD + 0.42);
    }

    const chimneyX = -halfW * 0.75;
    const chimneyZ = -halfD * 0.2;
    const chimneyH = totalHeight + roofApexHeight + 1.2;
    addBox('foundation', 1.1, chimneyH, 1.4, chimneyX, chimneyH * 0.5, chimneyZ);
    addBox('accent', 1.25, 0.2, 1.55, chimneyX, chimneyH, chimneyZ);
    [-0.28, 0.28].forEach(pz => {
      addCylinder('accent', 0.18, 0.16, 0.65, 8, chimneyX, chimneyH + 0.4, chimneyZ + pz);
    });

    // Side Fenestration (Freestanding Mansion Flank Windows on Left & Right)
    const sideWinW = 1.1;
    const sideWinH = 1.6;
    for (let s = 0; s < stories; s++) {
      const winY = foundationHeight + s * storyHeight + 1.6;
      [-halfD * 0.35, halfD * 0.35].forEach(wz => {
        // Left Flank (-X)
        addBox('trim', 0.14, sideWinH + 0.3, sideWinW + 0.3, -halfW - 0.04, winY, wz);
        addBox('glass', 0.1, sideWinH, sideWinW, -halfW - 0.06, winY, wz);
        addBox('accent', 0.22, 0.12, sideWinW + 0.4, -halfW - 0.06, winY - sideWinH * 0.5 - 0.06, wz);
        addBox('trim', 0.22, 0.16, sideWinW + 0.4, -halfW - 0.06, winY + sideWinH * 0.5 + 0.08, wz);

        // Right Flank (+X)
        addBox('trim', 0.14, sideWinH + 0.3, sideWinW + 0.3, halfW + 0.04, winY, wz);
        addBox('glass', 0.1, sideWinH, sideWinW, halfW + 0.06, winY, wz);
        addBox('accent', 0.22, 0.12, sideWinW + 0.4, halfW + 0.06, winY - sideWinH * 0.5 - 0.06, wz);
        addBox('trim', 0.22, 0.16, sideWinW + 0.4, halfW + 0.06, winY + sideWinH * 0.5 + 0.08, wz);
      });
    }

    return this._compileToGroup(slots, materials);
  }


  /**
   * 🏰 Build Carson Mansion Eureka Grand Victorian Manor
   */
  buildVictorianManor(options = {}) {
    const {
      colorBody = 0x2e5a44, // Carson Forest Green
      colorTrim = 0xf2ebe1, // Victorian Off-White
      colorAccent = 0xb59a57, // Lumber Baron Gold
      colorRoof = 0x272c33, // Slate Charcoal
      width = 24.0,
      depth = 18.0,
      subterraneanDepth = 4.0
    } = options;

    const materials = {
      body: this.getMaterial(colorBody, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      accent: this.getMaterial(colorAccent, 'accent'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x57524d, 'foundation'),
      glass: this.getMaterial(0x1a2630, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x6b3020, 'door'),
      hardware: this.getMaterial(0xd4af37, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const totalH = 12.5;

    // Deep Foundation Plinth
    addBox('foundation', width + 0.4, subterraneanDepth + 1.4, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.7, 0);
    addBox('trim', width + 0.6, 0.25, depth + 0.6, 0, 1.4, 0);

    // Main 3-Story Manor Massing
    addBox('body', width, totalH, depth, 0, totalH * 0.5 + 1.4, 0);

    // Floor belt courses
    [5.4, 9.4, 13.9].forEach(by => {
      addBox('trim', width + 0.3, 0.25, depth + 0.3, 0, by, 0);
      addBox('accent', width + 0.4, 0.08, depth + 0.4, 0, by + 0.12, 0);
    });

    // 4-Story Octagonal Corner Turret (Carson Tower)
    const turretRadius = 4.2;
    const turretH = 22.0;
    const turretX = halfW * 0.65;
    const turretZ = halfD * 0.65;
    addCylinder('foundation', turretRadius + 0.3, turretRadius + 0.4, subterraneanDepth + 1.4, 8, turretX, -subterraneanDepth * 0.5 + 0.7, turretZ);
    addCylinder('body', turretRadius, turretRadius * 1.05, turretH, 8, turretX, turretH * 0.5 + 1.4, turretZ);
    addCylinder('trim', turretRadius + 0.4, turretRadius + 0.4, 0.4, 8, turretX, turretH + 1.4, turretZ);

    // Turret Windows around facets
    for (let floorY of [4.5, 8.5, 12.5, 16.5]) {
      [-0.4, 0, 0.4].forEach(rot => {
        const wx = turretX + Math.sin(rot) * (turretRadius + 0.1);
        const wz = turretZ + Math.cos(rot) * (turretRadius + 0.1);
        addBox('trim', 1.0, 1.9, 0.15, wx, floorY, wz, 0, rot, 0);
        addBox('glass', 0.8, 1.7, 0.08, wx, floorY, wz + 0.04, 0, rot, 0);
        addBox('accent', 1.2, 0.18, 0.25, wx, floorY + 1.05, wz + 0.06, 0, rot, 0);
      });
    }

    // Conical Turret Roof Spire with Finial
    const spireH = 8.5;
    addCylinder('roof', 0.1, turretRadius + 0.6, spireH, 8, turretX, turretH + 1.4 + spireH * 0.5, turretZ);
    addCylinder('hardware', 0.05, 0.08, 2.5, 8, turretX, turretH + 1.4 + spireH + 1.2, turretZ);

    // Multi-Gabled Complex Roof
    const mainRoofH = 6.5;
    addPrism('roof', width + 0.8, mainRoofH, depth + 0.8, 0, totalH + 1.4, 0);
    // Transverse Cross Gable Wing
    addPrism('roof', depth * 0.7, 5.5, width * 0.6, -halfW * 0.35, totalH + 1.8, 0, 0, Math.PI * 0.5, 0);

    // Wrap-Around Veranda Porch
    const porchD = 3.2;
    const porchW = width * 0.65;
    const porchX = -halfW * 0.25;
    const porchY = 1.4;
    addBox('foundation', porchW, subterraneanDepth + 1.4, porchD, porchX, -subterraneanDepth * 0.5 + 0.7, halfD + porchD * 0.5);
    addBox('trim', porchW + 0.2, 0.15, porchD + 0.2, porchX, porchY, halfD + porchD * 0.5);

    // Porch fluted columns & railing
    for (let px = -porchW * 0.45; px <= porchW * 0.45; px += 2.8) {
      addCylinder('trim', 0.14, 0.16, 3.2, 8, porchX + px, porchY + 1.6, halfD + porchD - 0.2);
      addBox('accent', 0.35, 0.25, 0.35, porchX + px, porchY + 3.1, halfD + porchD - 0.2);
    }
    addBox('trim', porchW, 0.85, 0.08, porchX, porchY + 0.45, halfD + porchD - 0.2);
    addBox('roof', porchW + 0.4, 0.2, porchD + 0.4, porchX, porchY + 3.3, halfD + porchD * 0.5, Math.PI * 0.06, 0, 0);

    // Grand Entrance Door
    addBox('trim', 2.0, 3.2, 0.2, porchX, porchY + 1.6, halfD + 0.05);
    addBox('door', 1.6, 2.8, 0.1, porchX, porchY + 1.4, halfD + 0.1);
    addBox('glass', 1.2, 0.8, 0.08, porchX, porchY + 2.4, halfD + 0.12);

    return this._compileToGroup(slots, materials);
  }

  /**
   * ⛪ Build Spanish Mission Basilica (Carmel Mission & Sonoma Mission)
   */
  buildMissionBasilica(options = {}) {
    const {
      colorWall = 0xe8d5b5, // Sunbaked Adobe
      colorTile = 0xc04928, // Spanish Terracotta Tile
      colorTrim = 0x8c7355, // Weathered Wood / Stone
      width = 18.0,
      depth = 28.0,
      subterraneanDepth = 3.5
    } = options;

    const materials = {
      body: this.getMaterial(colorWall, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      accent: this.getMaterial(0xb8860b, 'accent'), // Bronze Bells
      roof: this.getMaterial(colorTile, 'roof'),
      foundation: this.getMaterial(0x8a7f70, 'foundation'),
      glass: this.getMaterial(0x23272a, 'glass', { opacity: 0.85, transparent: true }),
      door: this.getMaterial(0x5c381e, 'door'),
      hardware: this.getMaterial(0x2b2b2b, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const naveH = 10.5;

    // Foundation
    addBox('foundation', width + 0.4, subterraneanDepth + 0.8, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Main Church Nave
    addBox('body', width, naveH, depth, 0, naveH * 0.5 + 0.8, 0);

    // Spanish Barrel-Tile Gable Roof
    const roofApexH = 4.2;
    addPrism('roof', width + 0.8, roofApexH, depth + 0.8, 0, naveH + 0.8, 0);

    // Front Mission Espadaña / Campanario Bell Tower (Left or Front Corner)
    const towerW = 6.5;
    const towerD = 6.5;
    const towerH = 19.5;
    const towerX = -halfW + towerW * 0.5;
    const towerZ = halfD - towerD * 0.5 + 0.6;
    addBox('foundation', towerW + 0.3, subterraneanDepth + 0.8, towerD + 0.3, towerX, -subterraneanDepth * 0.5 + 0.4, towerZ);
    addBox('body', towerW, towerH, towerD, towerX, towerH * 0.5 + 0.8, towerZ);

    // Pierced Campanario Bell Arches (3 Bells)
    for (let b = 0; b < 2; b++) {
      const bz = towerZ + (b === 0 ? -1.2 : 1.2);
      const by = towerH - 3.5;
      // Arch aperture
      addBox('foundation', 1.6, 2.8, 0.4, towerX, by, bz);
      // Cast Bronze Mission Bell
      addCylinder('accent', 0.35, 0.55, 0.9, 10, towerX, by - 0.2, bz);
      addBox('hardware', 1.4, 0.15, 0.15, towerX, by + 0.7, bz);
    }
    // Top central bell
    addCylinder('accent', 0.4, 0.65, 1.1, 10, towerX, towerH + 0.6, towerZ);

    // Bell Tower Dome & Cross
    addCylinder('roof', 2.8, 3.2, 1.8, 8, towerX, towerH + 1.2, towerZ);
    addCylinder('roof', 0.2, 2.8, 2.5, 8, towerX, towerH + 2.8, towerZ);
    // Wrought Iron Cross
    addCylinder('hardware', 0.06, 0.06, 2.2, 6, towerX, towerH + 4.8, towerZ);
    addBox('hardware', 1.2, 0.08, 0.08, towerX, towerH + 5.2, towerZ);

    // Main Arched Portal Entryway
    const portalW = 3.6;
    const portalH = 4.8;
    addBox('trim', portalW + 0.6, portalH + 0.4, 0.25, 1.8, portalH * 0.5 + 0.8, halfD + 0.1);
    addBox('door', portalW, portalH, 0.15, 1.8, portalH * 0.5 + 0.8, halfD + 0.15);
    // Heavy wooden door studs
    for (let dy = 1.6; dy <= 4.2; dy += 0.8) {
      [-0.8, 0.8].forEach(dx => {
        addCylinder('hardware', 0.04, 0.04, 0.08, 6, 1.8 + dx, dy, halfD + 0.24, Math.PI * 0.5, 0, 0);
      });
    }

    // Rosette Star Window above portal
    addCylinder('trim', 1.4, 1.4, 0.2, 12, 1.8, naveH * 0.75, halfD + 0.1, Math.PI * 0.5, 0, 0);
    addCylinder('glass', 1.1, 1.1, 0.15, 12, 1.8, naveH * 0.75, halfD + 0.15, Math.PI * 0.5, 0, 0);

    // Cloister Quad Arched Colonnade on side
    const arcadeLen = depth * 0.8;
    const arcadeW = 3.2;
    const arcadeH = 4.2;
    const arcadeX = halfW + arcadeW * 0.5;
    addBox('foundation', arcadeW, subterraneanDepth + 0.8, arcadeLen, arcadeX, -subterraneanDepth * 0.5 + 0.4, 0);
    addBox('body', arcadeW, 0.4, arcadeLen, arcadeX, 0.8, 0);
    // Arched pillars
    for (let az = -arcadeLen * 0.4; az <= arcadeLen * 0.4; az += 3.6) {
      addBox('body', 0.8, arcadeH, 0.8, arcadeX + 1.2, arcadeH * 0.5 + 0.8, az);
    }
    // Arcade slanted tile roof
    addBox('roof', arcadeW + 0.6, 0.2, arcadeLen + 0.4, arcadeX, arcadeH + 0.9, 0, 0, 0, Math.PI * 0.1);

    return this._compileToGroup(slots, materials);
  }

  /**
   * 🍄 Build Carmel-by-the-Sea Hugh Comstock Storybook Cottage
   */
  buildStorybookCottage(options = {}) {
    const {
      colorStucco = 0xfdf6e2,
      colorThatch = 0x8a6844,
      colorStone = 0xc8b89a,
      width = 9.5,
      depth = 8.5,
      subterraneanDepth = 2.5
    } = options;

    const materials = {
      body: this.getMaterial(colorStucco, 'body'),
      trim: this.getMaterial(0x4a3424, 'trim'),
      accent: this.getMaterial(0xd060c0, 'accent'), // Window Box Flowers
      roof: this.getMaterial(colorThatch, 'roof'),
      foundation: this.getMaterial(colorStone, 'foundation'),
      glass: this.getMaterial(0x1e2830, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x5c381e, 'door'),
      hardware: this.getMaterial(0x2d3436, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const wallH = 4.2;

    // Foundation
    addBox('foundation', width + 0.3, subterraneanDepth + 0.6, depth + 0.3, 0, -subterraneanDepth * 0.5 + 0.3, 0);

    // Organic Stucco Body
    addBox('body', width, wallH, depth, 0, wallH * 0.5 + 0.6, 0);

    // Fairytale Swept Thatched Roof with Drooping Eaves
    const roofApexH = 4.5;
    addPrism('roof', width + 1.4, roofApexH, depth + 1.4, 0, wallH + 0.6, 0);

    // Storybook Front Dormer with Swooped Peak
    const dormerW = 2.6;
    const dormerH = 2.2;
    addBox('body', dormerW, dormerH, 2.0, -halfW * 0.25, wallH + dormerH * 0.5 + 0.4, halfD - 0.2);
    addPrism('roof', dormerW + 0.6, 1.6, 2.2, -halfW * 0.25, wallH + dormerH + 0.4, halfD - 0.2);
    addBox('trim', 1.4, 1.4, 0.1, -halfW * 0.25, wallH + dormerH * 0.5 + 0.4, halfD + 0.85);
    addBox('glass', 1.1, 1.1, 0.08, -halfW * 0.25, wallH + dormerH * 0.5 + 0.4, halfD + 0.9);

    // Crooked River Stone Chimney with Terracotta Flue Pots
    const chimX = halfW - 0.6;
    const chimZ = -halfD * 0.2;
    const chimH = wallH + roofApexH + 1.5;
    // Tapered stone base
    addCylinder('foundation', 0.9, 1.4, chimH, 8, chimX, chimH * 0.5, chimZ);
    addCylinder('foundation', 1.1, 0.9, 0.4, 8, chimX, chimH + 0.1, chimZ);
    // Double Clay Chimney Pots
    [-0.25, 0.25].forEach(offZ => {
      addCylinder('trim', 0.2, 0.18, 0.7, 8, chimX, chimH + 0.55, chimZ + offZ);
    });

    // Arched Storybook Timber Entrance Door
    const doorW = 1.4;
    const doorH = 2.6;
    const doorX = -halfW * 0.4;
    addBox('trim', doorW + 0.3, doorH + 0.3, 0.15, doorX, doorH * 0.5 + 0.6, halfD + 0.06);
    addBox('door', doorW, doorH, 0.12, doorX, doorH * 0.5 + 0.6, halfD + 0.1);
    addCylinder('hardware', 0.05, 0.05, 0.08, 6, doorX + 0.45, 1.8, halfD + 0.18, Math.PI * 0.5, 0, 0);

    // Multilane Casement Windows with Flower Boxes
    const winX = halfW * 0.35;
    const winY = 2.4;
    addBox('trim', 2.0, 1.6, 0.12, winX, winY, halfD + 0.06);
    addBox('glass', 1.7, 1.3, 0.08, winX, winY, halfD + 0.1);
    // Timber Flower Window Box
    addBox('trim', 2.2, 0.4, 0.45, winX, winY - 0.9, halfD + 0.25);
    // Blossoming Flowers in Window Box
    for (let fx = -0.8; fx <= 0.8; fx += 0.4) {
      addCylinder('accent', 0.15, 0.12, 0.25, 6, winX + fx, winY - 0.6, halfD + 0.25);
    }

    // Side Casement Window with Flower Box on Left Flank (-X)
    addBox('trim', 0.12, 1.6, 1.8, -halfW - 0.06, winY, 0);
    addBox('glass', 0.08, 1.3, 1.5, -halfW - 0.1, winY, 0);
    addBox('trim', 0.45, 0.4, 2.0, -halfW - 0.25, winY - 0.9, 0);
    for (let fz = -0.7; fz <= 0.7; fz += 0.4) {
      addCylinder('accent', 0.15, 0.12, 0.25, 6, -halfW - 0.25, winY - 0.6, fz);
    }

    return this._compileToGroup(slots, materials);
  }


  /**
   * 🌲 Build Cascadian Historic National Park Lodge (Multnomah Falls, Snoqualmie / Salish, Bigfoot Museum)
   */
  buildHistoricLodge(options = {}) {
    const {
      colorStone = 0x4a4f56, // Cascadian Basalt Stone
      colorTimber = 0x5c3a21, // Heavy Peeled Log
      colorRoof = 0x2b332b, // Forest Cedar Shake
      width = 26.0,
      depth = 18.0,
      stories = 3,
      subterraneanDepth = 4.0
    } = options;

    const materials = {
      body: this.getMaterial(colorTimber, 'body'),
      trim: this.getMaterial(0x3e2716, 'trim'),
      accent: this.getMaterial(0x8a5d3b, 'accent'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(colorStone, 'foundation'),
      glass: this.getMaterial(0x1a242f, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x4a2c17, 'door'),
      hardware: this.getMaterial(0x18181b, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const groundFloorH = 4.5;
    const upperFloorH = 3.6;
    const totalH = groundFloorH + (stories - 1) * upperFloorH;

    // Massive River Rock Ground Floor / Foundation
    addBox('foundation', width + 0.6, subterraneanDepth + groundFloorH, depth + 0.6, 0, -subterraneanDepth * 0.5 + groundFloorH * 0.5, 0);

    // Heavy Log Upper Stories
    const upperH = (stories - 1) * upperFloorH;
    addBox('body', width, upperH, depth, 0, groundFloorH + upperH * 0.5, 0);

    // Horizontal peeled log accent relief
    for (let ly = groundFloorH + 0.6; ly < totalH; ly += 0.9) {
      addBox('trim', width + 0.2, 0.2, depth + 0.2, 0, ly, 0);
    }

    // Grand Timber Gabled Roof
    const roofApexH = 6.2;
    addPrism('roof', width + 1.2, roofApexH, depth + 1.2, 0, totalH, 0);

    // Massive Stone Fireplace Chimneys at each gable end
    [-halfW * 0.85, halfW * 0.85].forEach(cx => {
      const chimH = totalH + roofApexH + 2.2;
      addBox('foundation', 2.4, chimH + subterraneanDepth, 2.6, cx, chimH * 0.5, -halfD * 0.2);
      addBox('foundation', 2.8, 0.4, 3.0, cx, chimH, -halfD * 0.2);
      // Double stone flue caps
      [-0.5, 0.5].forEach(cz => {
        addCylinder('foundation', 0.35, 0.4, 0.9, 8, cx, chimH + 0.6, -halfD * 0.2 + cz);
      });
    });

    // Heavy Log Covered Porte-Cochère / Entrance Porch
    const porchW = 8.5;
    const porchD = 5.5;
    const porchH = 4.2;
    addBox('foundation', porchW, subterraneanDepth + 0.6, porchD, 0, -subterraneanDepth * 0.5 + 0.3, halfD + porchD * 0.5);
    // 4 Heavy peeled log pillars
    [-porchW * 0.4, porchW * 0.4].forEach(px => {
      [halfD + 0.8, halfD + porchD - 0.6].forEach(pz => {
        addCylinder('trim', 0.35, 0.45, porchH, 8, px, porchH * 0.5 + 0.6, pz);
      });
    });
    // Log roof trusses & crossbeams
    addBox('trim', porchW + 0.4, 0.4, porchD + 0.4, 0, porchH + 0.6, halfD + porchD * 0.5);
    addPrism('roof', porchW + 0.6, 2.8, porchD + 0.6, 0, porchH + 0.8, halfD + porchD * 0.5);

    // Grand Double Timber Doors
    addBox('trim', 3.2, 3.2, 0.2, 0, 2.2, halfD + 0.1);
    addBox('door', 2.8, 2.8, 0.15, 0, 2.0, halfD + 0.15);
    [-0.5, 0.5].forEach(dx => {
      addCylinder('hardware', 0.06, 0.06, 0.4, 6, dx, 2.0, halfD + 0.24, Math.PI * 0.5, 0, 0);
    });

    // Multi-Casement Lodge Windows on upper floors
    for (let s = 1; s < stories; s++) {
      const fy = groundFloorH + (s - 0.5) * upperFloorH;
      for (let wx = -halfW * 0.7; wx <= halfW * 0.7; wx += 4.5) {
        addBox('trim', 1.8, 2.0, 0.15, wx, fy, halfD + 0.08);
        addBox('glass', 1.5, 1.7, 0.08, wx, fy, halfD + 0.12);
        addBox('trim', 1.5, 0.05, 0.06, wx, fy, halfD + 0.14);
        addBox('trim', 0.05, 1.7, 0.06, wx, fy, halfD + 0.14);
      }
    }

    // Side Casement Windows on Left & Right Flanks
    for (let s = 0; s < stories; s++) {
      const fy = (s === 0 ? groundFloorH * 0.5 : groundFloorH + (s - 0.5) * upperFloorH);
      [-halfD * 0.35, halfD * 0.35].forEach(wz => {
        // Left flank (-X)
        addBox('trim', 0.16, 2.0, 1.8, -halfW - 0.06, fy, wz);
        addBox('glass', 0.1, 1.7, 1.5, -halfW - 0.1, fy, wz);
        // Right flank (+X)
        addBox('trim', 0.16, 2.0, 1.8, halfW + 0.06, fy, wz);
        addBox('glass', 0.1, 1.7, 1.5, halfW + 0.1, fy, wz);
      });
    }

    return this._compileToGroup(slots, materials);
  }


  /**
   * 🏭 Build Cannery Row Brick Canning Factory with Steel Skywalk (Monterey)
   */
  buildCanneryFactory(options = {}) {
    const {
      colorBrick = 0x9e382b,
      colorRoof = 0x5a636e,
      width = 22.0,
      depth = 32.0,
      height = 13.0,
      subterraneanDepth = 3.0
    } = options;

    const materials = {
      body: this.getMaterial(colorBrick, 'body'),
      trim: this.getMaterial(0x3a4149, 'trim'),
      accent: this.getMaterial(0x788491, 'accent'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x4a4f56, 'foundation'),
      glass: this.getMaterial(0x1a252f, 'glass', { opacity: 0.85, transparent: true }),
      door: this.getMaterial(0x3e2716, 'door'),
      hardware: this.getMaterial(0x1f2428, 'hardware')
    };

    const { slots, addBox, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    // Foundation
    addBox('foundation', width + 0.4, subterraneanDepth + 0.8, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Main Brick Warehouse Body
    addBox('body', width, height, depth, 0, height * 0.5 + 0.8, 0);

    // Corrugated Monitor / Clerestory Roof
    const roofApexH = 4.5;
    addPrism('roof', width + 0.8, roofApexH, depth + 0.8, 0, height + 0.8, 0);
    // Raised Clerestory Ventilation Monitor along roof ridge
    const monitorW = width * 0.45;
    const monitorH = 2.2;
    addBox('body', monitorW, monitorH, depth * 0.75, 0, height + roofApexH * 0.65, 0);
    addPrism('roof', monitorW + 0.4, 1.4, depth * 0.75 + 0.4, 0, height + roofApexH * 0.65 + monitorH * 0.5, 0);
    // Continuous clerestory glass strip
    [-monitorW * 0.5, monitorW * 0.5].forEach(mx => {
      addBox('glass', 0.1, 1.2, depth * 0.7, mx, height + roofApexH * 0.65, 0);
    });

    // Multi-Pane Industrial Steel Windows in 3-Tier Grid
    for (let wy = 3.5; wy <= height - 2.0; wy += 3.8) {
      for (let wz = -halfD * 0.75; wz <= halfD * 0.75; wz += 4.8) {
        addBox('trim', 2.4, 2.2, 0.15, halfW + 0.05, wy, wz);
        addBox('glass', 2.2, 2.0, 0.08, halfW + 0.1, wy, wz);
        // Steel window grid bars
        addBox('hardware', 2.2, 0.06, 0.1, halfW + 0.12, wy, wz);
        addBox('hardware', 0.06, 2.0, 0.1, halfW + 0.12, wy, wz);
      }
    }

    // Heavy Timber Loading Dock
    const dockW = 4.0;
    const dockLen = depth * 0.6;
    const dockH = 1.4;
    addBox('foundation', dockW, subterraneanDepth + dockH, dockLen, -halfW - dockW * 0.5, -subterraneanDepth * 0.5 + dockH * 0.5, 0);
    addBox('trim', dockW + 0.2, 0.15, dockLen + 0.2, -halfW - dockW * 0.5, dockH, 0);
    // Heavy Sliding Freight Doors on loading dock
    [-dockLen * 0.25, dockLen * 0.25].forEach(dz => {
      addBox('door', 0.15, 3.4, 3.2, -halfW - 0.05, dockH + 1.7, dz);
      addBox('hardware', 0.2, 0.2, 4.0, -halfW - 0.1, dockH + 3.5, dz);
    });

    return this._compileToGroup(slots, materials);
  }

  /**
   * 🐄 Build Tillamook Historic Giant Gambrel Dairy Barn
   */
  buildHistoricBarn(options = {}) {
    const {
      colorWall = 0xf5f5f5, // Tillamook Crisp White
      colorRoof = 0x1f2428, // Charcoal Gambrel
      colorTrim = 0x2b3138,
      width = 24.0,
      depth = 34.0,
      wallHeight = 8.5,
      subterraneanDepth = 3.5,
      hasSilo = true
    } = options;

    const materials = {
      body: this.getMaterial(colorWall, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      accent: this.getMaterial(0xffb300, 'accent'), // Tillamook Gold
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x57606a, 'foundation'),
      glass: this.getMaterial(0x1e272e, 'glass', { opacity: 0.85, transparent: true }),
      door: this.getMaterial(0x1a1a1a, 'door'),
      hardware: this.getMaterial(0xb0bec5, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    // Foundation plinth
    addBox('foundation', width + 0.4, subterraneanDepth + 0.8, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Board-and-Batten Barn Body
    addBox('body', width, wallHeight, depth, 0, wallHeight * 0.5 + 0.8, 0);

    // Vertical batten strips along walls
    for (let bz = -halfD + 0.8; bz <= halfD - 0.8; bz += 1.2) {
      addBox('trim', 0.08, wallHeight, 0.06, halfW + 0.02, wallHeight * 0.5 + 0.8, bz);
      addBox('trim', 0.08, wallHeight, 0.06, -halfW - 0.02, wallHeight * 0.5 + 0.8, bz);
    }

    // Authentic Dutch Gambrel Roof (two-tier slope)
    const lowerRoofH = 4.5;
    const upperRoofH = 3.5;
    const roofBaseY = wallHeight + 0.8;
    addPrism('roof', width + 1.2, lowerRoofH, depth + 1.2, 0, roofBaseY, 0);
    addPrism('roof', width * 0.65, upperRoofH, depth + 1.2, 0, roofBaseY + lowerRoofH * 0.65, 0);

    // Rooftop Cupola Ventilators with Weather Vanes
    const cupolaCount = 3;
    const cupolaSpacing = depth * 0.3;
    for (let c = 0; c < cupolaCount; c++) {
      const cz = (c - 1) * cupolaSpacing;
      const cy = roofBaseY + lowerRoofH * 0.65 + upperRoofH;
      addBox('body', 2.4, 2.0, 2.4, 0, cy + 1.0, cz);
      addPrism('roof', 3.0, 1.4, 3.0, 0, cy + 2.0, cz);
      // Weather vane spire
      addCylinder('hardware', 0.04, 0.06, 1.8, 6, 0, cy + 3.8, cz);
      addBox('accent', 1.0, 0.12, 0.12, 0, cy + 4.2, cz);
    }

    // Hay Hood / Gable Extension & Loft Door on front
    const hoodY = roofBaseY + lowerRoofH * 0.7;
    addBox('roof', 3.6, 0.2, 2.4, 0, hoodY + 2.4, halfD + 1.2, Math.PI * 0.15, 0, 0);
    // Double Loft Door
    addBox('door', 2.8, 3.2, 0.15, 0, hoodY, halfD + 0.08);
    addBox('trim', 0.12, 3.8, 0.05, 0, hoodY, halfD + 0.16, 0, 0, Math.PI * 0.25);
    addBox('trim', 0.12, 3.8, 0.05, 0, hoodY, halfD + 0.16, 0, 0, -Math.PI * 0.25);

    // Large Double Sliding Barn Doors on Ground Floor
    const barnDoorW = 5.2;
    const barnDoorH = 4.2;
    addBox('door', barnDoorW, barnDoorH, 0.15, 0, barnDoorH * 0.5 + 0.8, halfD + 0.08);
    [-barnDoorW * 0.25, barnDoorW * 0.25].forEach(bx => {
      addBox('trim', 0.15, barnDoorH * 1.2, 0.05, bx, barnDoorH * 0.5 + 0.8, halfD + 0.16, 0, 0, Math.PI * 0.22);
      addBox('trim', 0.15, barnDoorH * 1.2, 0.05, bx, barnDoorH * 0.5 + 0.8, halfD + 0.16, 0, 0, -Math.PI * 0.22);
    });

    // Cylindrical Silver Grain Silo
    if (hasSilo) {
      const siloR = 4.2;
      const siloH = 22.0;
      const siloX = -halfW - siloR * 0.9;
      const siloZ = -halfD * 0.2;
      addCylinder('foundation', siloR + 0.2, siloR + 0.3, subterraneanDepth + 0.8, 12, siloX, -subterraneanDepth * 0.5 + 0.4, siloZ);
      addCylinder('hardware', siloR, siloR, siloH, 12, siloX, siloH * 0.5 + 0.8, siloZ);
      addCylinder('hardware', 0.2, siloR, 3.5, 12, siloX, siloH + 2.5, siloZ); // Silo Dome
    }

    return this._compileToGroup(slots, materials);
  }

  /**
   * 🛍️ Build Pike Place Public Market Arcade (Seattle)
   */
  buildMarketArcade(options = {}) {
    const {
      colorBrick = 0x8a3828,
      colorPillar = 0x1e3f28, // Pike Place Green
      width = 32.0,
      depth = 18.0,
      stories = 2,
      subterraneanDepth = 3.5
    } = options;

    const materials = {
      body: this.getMaterial(colorBrick, 'body'),
      trim: this.getMaterial(colorPillar, 'trim'),
      accent: this.getMaterial(0xd32f2f, 'accent'), // Neon Red Sign
      roof: this.getMaterial(0x2b3035, 'roof'),
      foundation: this.getMaterial(0x525b63, 'foundation'),
      glass: this.getMaterial(0x192734, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x1e3f28, 'door'),
      hardware: this.getMaterial(0xf5f5f5, 'hardware') // White clock
    };

    const { slots, addBox, addCylinder } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const totalH = stories * 4.5;

    // Foundation
    addBox('foundation', width + 0.4, subterraneanDepth + 0.8, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Main Brick Building
    addBox('body', width, totalH, depth, 0, totalH * 0.5 + 0.8, 0);

    // Ground Floor Colonnaded Market Arcade
    const bayCount = 6;
    const baySpacing = width / bayCount;
    for (let b = 0; b <= bayCount; b++) {
      const bx = -halfW + b * baySpacing;
      addBox('trim', 0.8, 4.5, 0.8, bx, 3.0, halfD + 0.4);
    }
    // Continuous ground floor display glass and stalls
    for (let b = 0; b < bayCount; b++) {
      const bx = -halfW + (b + 0.5) * baySpacing;
      addBox('glass', baySpacing - 0.9, 3.0, 0.1, bx, 2.8, halfD + 0.1);
      addBox('foundation', baySpacing - 0.9, 0.8, 0.2, bx, 1.2, halfD + 0.15);
    }

    // Extended Canvas Storefront Awning along entire facade
    addBox('trim', width + 1.2, 0.15, 2.6, 0, 4.8, halfD + 1.3, Math.PI * 0.1, 0, 0);

    // Upper Floor Rhythmic Office Windows
    for (let b = 0; b < bayCount; b++) {
      const bx = -halfW + (b + 0.5) * baySpacing;
      addBox('trim', 2.4, 2.4, 0.15, bx, 7.5, halfD + 0.06);
      addBox('glass', 2.0, 2.0, 0.08, bx, 7.5, halfD + 0.1);
      addBox('trim', 2.0, 0.05, 0.06, bx, 7.5, halfD + 0.12);
      addBox('trim', 0.05, 2.0, 0.06, bx, 7.5, halfD + 0.12);
    }

    // Rooftop Sign Parapet Board with Classic Seattle Street Clock
    const signBoardW = 20.0;
    const signBoardH = 4.2;
    const signY = totalH + 0.8 + signBoardH * 0.5;
    addBox('hardware', signBoardW, signBoardH, 0.6, 0, signY, halfD + 0.3);
    addBox('accent', signBoardW - 1.5, 1.8, 0.2, 0, signY + 0.8, halfD + 0.65);

    // Central Street Clock
    addCylinder('trim', 1.8, 1.8, 0.4, 16, 0, signY - 1.1, halfD + 0.65, Math.PI * 0.5, 0, 0);
    addCylinder('hardware', 1.5, 1.5, 0.42, 16, 0, signY - 1.1, halfD + 0.65, Math.PI * 0.5, 0, 0);
    // Clock hands
    addBox('hardware', 0.8, 0.08, 0.06, 0.3, signY - 1.1, halfD + 0.88);
    addBox('hardware', 0.08, 1.1, 0.06, 0, signY - 0.7, halfD + 0.88);

    // Side Arcade Fenestration (Left & Right Flanks)
    const sideBays = 3;
    const sideSpacing = depth / sideBays;
    for (let sb = 0; sb < sideBays; sb++) {
      const sz = -halfD + (sb + 0.5) * sideSpacing;
      // Ground floor side arcade windows
      addBox('trim', 0.16, 3.4, sideSpacing - 1.2, -halfW - 0.06, 2.6, sz);
      addBox('glass', 0.1, 3.0, sideSpacing - 1.6, -halfW - 0.1, 2.6, sz);
      addBox('trim', 0.16, 3.4, sideSpacing - 1.2, halfW + 0.06, 2.6, sz);
      addBox('glass', 0.1, 3.0, sideSpacing - 1.6, halfW + 0.1, 2.6, sz);

      // Upper floor side windows
      addBox('trim', 0.16, 2.2, 1.8, -halfW - 0.06, 7.2, sz);
      addBox('glass', 0.1, 1.9, 1.5, -halfW - 0.1, 7.2, sz);
      addBox('trim', 0.16, 2.2, 1.8, halfW + 0.06, 7.2, sz);
      addBox('glass', 0.1, 1.9, 1.5, halfW + 0.1, 7.2, sz);
    }

    return this._compileToGroup(slots, materials);
  }


  /**
   * ⛽ Build Route 66 Mid-Century Roadside Diner & Motel (Mojave Desert)
   */
  buildRoadsideDinerOrMotel(options = {}) {
    const {
      colorStucco = 0xf5eedc, // Vintage Off-White / Cream Enamel
      colorTrim = 0x0284c7,   // Streamline Turquoise
      colorAccent = 0xd92d3a, // Retro Fire-Engine Coral Red
      width = 22.0,
      depth = 12.0,
      subterraneanDepth = 3.5
    } = options;

    const materials = {
      body: this.getMaterial(colorStucco, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      accent: this.getMaterial(colorAccent, 'accent'),
      roof: this.getMaterial(0x1e293b, 'roof'),
      foundation: this.getMaterial(0x475569, 'foundation'),
      glass: this.getMaterial(0x38bdf8, 'glass', { opacity: 0.85, transparent: true }),
      door: this.getMaterial(0x0284c7, 'door'),
      hardware: this.getMaterial(0xf1f5f9, 'hardware') // Mirror Polish Stainless Steel / Chrome
    };

    const { slots, addBox, addCylinder } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const bldgH = 5.2;

    // 1. Deep Foundation Plinth & Subterranean Base
    addBox('foundation', width + 1.2, subterraneanDepth + 0.8, depth + 1.2, 0, -subterraneanDepth * 0.5 + 0.4, 0);
    // Concrete perimeter curb step
    addBox('foundation', width + 2.0, 0.3, depth + 2.0, 0, 0.15, 0);

    // 2. Main Porcelain Enamel Streamline Diner Body
    addBox('body', width, bldgH, depth, 0, bldgH * 0.5 + 0.3, 0);

    // 3. Rounded Aerodynamic Corner End-Caps (Streamline Moderne Signature)
    [-halfW + 0.8, halfW - 0.8].forEach(cx => {
      [halfD - 0.8, -halfD + 0.8].forEach(cz => {
        addCylinder('body', 1.2, 1.2, bldgH, 12, cx, bldgH * 0.5 + 0.3, cz);
        // Horizontal Chrome Ribs on corners
        [1.2, 2.0, 3.8, 4.6].forEach(ry => {
          addCylinder('hardware', 1.28, 1.28, 0.1, 12, cx, ry + 0.3, cz);
        });
      });
    });

    // 4. Retro Red Porcelain Tile Wainscoting (Lower 1.4m of facade)
    addBox('accent', width + 0.1, 1.4, depth + 0.1, 0, 1.0, 0);
    // Stainless Steel Fluted Speed-Lines along bottom and mid-belt
    addBox('hardware', width + 0.25, 0.12, depth + 0.25, 0, 0.5, 0);
    addBox('hardware', width + 0.25, 0.12, depth + 0.25, 0, 1.0, 0);
    addBox('hardware', width + 0.25, 0.15, depth + 0.25, 0, 1.7, 0); // Window stool line

    // 5. Continuous Wrap-Around Panoramic Ribbon Windows (Front & Sides)
    const winH = 2.4;
    const winY = 1.7 + winH * 0.5;

    // Front panoramic glass
    addBox('glass', width - 4.5, winH, 0.18, 0, winY, halfD + 0.08);
    // Chrome window frames & muntins across front
    addBox('hardware', width - 4.2, 0.12, 0.25, 0, 1.7, halfD + 0.1);
    addBox('hardware', width - 4.2, 0.12, 0.25, 0, 1.7 + winH, halfD + 0.1);
    for (let mx = -halfW + 3.5; mx <= halfW - 3.5; mx += 2.4) {
      addBox('hardware', 0.1, winH, 0.25, mx, winY, halfD + 0.1);
    }

    // Side ribbon windows
    [-halfW - 0.08, halfW + 0.08].forEach(sx => {
      addBox('glass', 0.18, winH, depth - 4.0, sx, winY, 0);
      addBox('hardware', 0.25, 0.12, depth - 3.8, sx, 1.7, 0);
      addBox('hardware', 0.25, 0.12, depth - 3.8, sx, 1.7 + winH, 0);
      for (let mz = -halfD + 3.0; mz <= halfD - 3.0; mz += 2.4) {
        addBox('hardware', 0.25, winH, 0.1, sx, winY, mz);
      }
    });

    // 6. Central Diner Entrance Vestibule
    addBox('trim', 3.2, 3.4, 0.35, 0, 2.0, halfD + 0.18);
    addBox('door', 1.3, 2.8, 0.18, -0.7, 1.7, halfD + 0.22);
    addBox('door', 1.3, 2.8, 0.18, 0.7, 1.7, halfD + 0.22);
    addBox('glass', 0.9, 2.0, 0.12, -0.7, 1.9, halfD + 0.25);
    addBox('glass', 0.9, 2.0, 0.12, 0.7, 1.9, halfD + 0.25);
    // Chrome push bars
    addCylinder('hardware', 0.05, 0.05, 1.1, 8, -0.3, 1.7, halfD + 0.35);
    addCylinder('hardware', 0.05, 0.05, 1.1, 8, 0.3, 1.7, halfD + 0.35);

    // 7. Cantilevered Googie Bullnose Roof Canopy with Neon Trim
    const canopyW = width + 2.8;
    const canopyD = depth + 2.8;
    addBox('hardware', canopyW, 0.45, canopyD, 0, bldgH + 0.5, 0);
    // Turquoise & Red layered fascia
    addBox('trim', canopyW + 0.2, 0.35, canopyD + 0.2, 0, bldgH + 0.55, 0);
    addBox('accent', canopyW + 0.35, 0.12, canopyD + 0.35, 0, bldgH + 0.75, 0);

    // 8. Rooftop Dimensional "DINER" Letter Pediment & Steel Trusses
    const signBoxW = 14.0;
    const signBoxH = 2.4;
    addBox('hardware', signBoxW + 0.6, signBoxH + 0.4, 0.4, 0, bldgH + 2.0, 0);
    addBox('accent', signBoxW, signBoxH, 0.55, 0, bldgH + 2.0, 0);
    // Steel rooftop support angle struts
    [-5.5, 0, 5.5].forEach(sx => {
      addCylinder('hardware', 0.08, 0.08, 2.2, 6, sx, bldgH + 1.2, -1.2);
    });

    // Individual 3D Block Letter Shapes for D - I - N - E - R on front
    const letterY = bldgH + 2.0;
    const lZ = 0.32;
    // D
    addBox('hardware', 0.25, 1.6, 0.2, -4.8, letterY, lZ);
    addBox('hardware', 0.9, 0.25, 0.2, -4.4, letterY + 0.68, lZ);
    addBox('hardware', 0.9, 0.25, 0.2, -4.4, letterY - 0.68, lZ);
    addBox('hardware', 0.25, 1.1, 0.2, -3.9, letterY, lZ);
    // I
    addBox('hardware', 0.3, 1.6, 0.2, -2.4, letterY, lZ);
    addBox('hardware', 1.0, 0.25, 0.2, -2.4, letterY + 0.68, lZ);
    addBox('hardware', 1.0, 0.25, 0.2, -2.4, letterY - 0.68, lZ);
    // N
    addBox('hardware', 0.25, 1.6, 0.2, -0.6, letterY, lZ);
    addBox('hardware', 0.25, 1.6, 0.2, 0.6, letterY, lZ);
    addBox('hardware', 0.35, 1.6, 0.2, 0.0, letterY, lZ);
    // E
    addBox('hardware', 0.25, 1.6, 0.2, 2.0, letterY, lZ);
    addBox('hardware', 1.0, 0.25, 0.2, 2.4, letterY + 0.68, lZ);
    addBox('hardware', 0.8, 0.25, 0.2, 2.3, letterY, lZ);
    addBox('hardware', 1.0, 0.25, 0.2, 2.4, letterY - 0.68, lZ);
    // R
    addBox('hardware', 0.25, 1.6, 0.2, 4.0, letterY, lZ);
    addBox('hardware', 0.9, 0.25, 0.2, 4.4, letterY + 0.68, lZ);
    addBox('hardware', 0.25, 0.7, 0.2, 4.8, letterY + 0.35, lZ);
    addBox('hardware', 0.9, 0.25, 0.2, 4.4, letterY, lZ);
    addBox('hardware', 0.3, 0.8, 0.2, 4.7, letterY - 0.4, lZ);

    // 9. Rooftop Mechanical Ventilation & Chrome Exhaust Chimney
    addBox('roof', 3.0, 1.2, 2.4, 6.0, bldgH + 1.2, -2.5);
    addCylinder('hardware', 0.45, 0.45, 2.0, 8, -6.5, bldgH + 1.5, -2.5);

    // 10. Angled Retro Googie Boomerang Pylon Sign Tower
    const pylonW = 1.4;
    const pylonH = 12.5;
    const pylonX = -halfW - 2.5;
    addBox('accent', pylonW, pylonH, pylonW, pylonX, pylonH * 0.5, 3.0);
    // Turquoise chevron fin
    addBox('trim', pylonW + 0.6, 3.2, 0.3, pylonX, pylonH - 2.0, 3.0);
    addBox('hardware', 0.3, 3.2, pylonW + 0.6, pylonX, pylonH - 2.0, 3.0);

    return this._compileToGroup(slots, materials);
  }

  /**

   * 🦀 Build Coastal Seafood Shack & Wharf Pier (Neptune's Net, Bodega Bay, Newport)
   */
  buildCoastalSeafoodShack(options = {}) {
    const {
      colorSiding = 0x8a4b38, // Weathered Shiplap / Cedar Red
      colorRoof = 0x4a525d, // Corrugated Tin
      width = 14.0,
      depth = 12.0,
      height = 5.2,
      subterraneanDepth = 2.5
    } = options;

    const materials = {
      body: this.getMaterial(colorSiding, 'body'),
      trim: this.getMaterial(0xf5f5f0, 'trim'),
      accent: this.getMaterial(0xd97706, 'accent'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x5c4a38, 'foundation'), // Pier pilings
      glass: this.getMaterial(0x1a242f, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x3e2c1c, 'door'),
      hardware: this.getMaterial(0xd97706, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    // Wood Pilings Foundation Pier
    const deckH = 1.2;
    for (let px = -halfW; px <= halfW; px += 3.5) {
      for (let pz = -halfD; pz <= halfD + 3.0; pz += 3.5) {
        addCylinder('foundation', 0.22, 0.25, subterraneanDepth + deckH, 8, px, -subterraneanDepth * 0.5 + deckH * 0.5, pz);
      }
    }
    // Heavy timber wharf deck extending in front of shack
    const deckD = depth + 4.0;
    addBox('foundation', width + 1.2, 0.25, deckD, 0, deckH, 2.0);

    // Shack Body
    addBox('body', width, height, depth, 0, height * 0.5 + deckH, 0);

    // Corrugated Tin Gable Roof
    const roofApexH = 3.2;
    addPrism('roof', width + 0.8, roofApexH, depth + 0.8, 0, height + deckH, 0);

    // Wharf Handrails
    for (let rx of [-halfW - 0.4, halfW + 0.4]) {
      addBox('trim', 0.1, 0.9, deckD, rx, deckH + 0.45, 2.0);
    }
    addBox('trim', width + 1.0, 0.9, 0.1, 0, deckH + 0.45, halfD + 3.9);

    // Order Counter / Seafood Display Window
    addBox('trim', 4.2, 2.2, 0.15, 0, deckH + 2.2, halfD + 0.08);
    addBox('glass', 3.8, 1.8, 0.08, 0, deckH + 2.2, halfD + 0.12);
    addBox('trim', 4.6, 0.15, 0.6, 0, deckH + 1.1, halfD + 0.35); // Counter shelf

    // Slanted tin awning over ordering counter
    addBox('roof', 5.2, 0.12, 2.0, 0, deckH + 3.6, halfD + 1.0, Math.PI * 0.12, 0, 0);

    return this._compileToGroup(slots, materials);
  }

  /**
   * 🍷 Build Sonoma Stone Winery Chateau & Aging Cellar
   */
  buildWineryChateau(options = {}) {
    const {
      colorStone = 0xd7ccc8, // Limestone Ashlar
      colorTile = 0xa8422b, // Terracotta Roof
      width = 24.0,
      depth = 16.0,
      height = 9.5,
      subterraneanDepth = 3.5
    } = options;

    const materials = {
      body: this.getMaterial(colorStone, 'body'),
      trim: this.getMaterial(0x8a7a68, 'trim'),
      accent: this.getMaterial(0x2a5a1a, 'accent'), // Ivy relief
      roof: this.getMaterial(colorTile, 'roof'),
      foundation: this.getMaterial(0x5c5042, 'foundation'),
      glass: this.getMaterial(0x1a2630, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x4a2a18, 'door'),
      hardware: this.getMaterial(0x2b2b2b, 'hardware')
    };

    const { slots, addBox, addCylinder, addPrism } = this._createGeometryAccumulator();

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    // Foundation
    addBox('foundation', width + 0.4, subterraneanDepth + 0.8, depth + 0.4, 0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Stone Chateau Body
    addBox('body', width, height, depth, 0, height * 0.5 + 0.8, 0);

    // French Hipped / Gabled Tile Roof
    const roofApexH = 4.8;
    addPrism('roof', width + 0.8, roofApexH, depth + 0.8, 0, height + 0.8, 0);

    // Dual Arched Wine Cellar Portals
    [-halfW * 0.4, halfW * 0.4].forEach(cx => {
      addBox('trim', 3.4, 4.2, 0.25, cx, 2.9, halfD + 0.08);
      addBox('door', 2.8, 3.8, 0.15, cx, 2.7, halfD + 0.14);
      // Heavy wrought iron cellar grille
      for (let gx = -1.0; gx <= 1.0; gx += 0.5) {
        addCylinder('hardware', 0.03, 0.03, 3.6, 6, cx + gx, 2.7, halfD + 0.22);
      }
    });

    // Central Tasting Terrace with Pergola Trellis
    const terraceW = 8.0;
    const terraceD = 4.0;
    addBox('foundation', terraceW, subterraneanDepth + 0.8, terraceD, 0, -subterraneanDepth * 0.5 + 0.4, halfD + terraceD * 0.5);
    addBox('trim', terraceW, 0.15, terraceD, 0, 0.8, halfD + terraceD * 0.5);

    // Pergola Columns & Ivy Climbing Relief
    [-terraceW * 0.45, terraceW * 0.45].forEach(px => {
      addCylinder('trim', 0.18, 0.22, 3.6, 8, px, 2.6, halfD + terraceD - 0.2);
      // Climbing ivy foliage clusters
      addCylinder('accent', 0.35, 0.45, 3.2, 6, px, 2.4, halfD + terraceD - 0.2);
    });
    // Pergola timber trellis beams
    for (let bz = halfD + 0.6; bz <= halfD + terraceD; bz += 0.8) {
      addBox('trim', terraceW + 0.6, 0.18, 0.18, 0, 4.4, bz);
    }

    return this._compileToGroup(slots, materials);
  }

  /**
   * 12. COMMERCIAL MAIN STREET BUILDING
   * 2-3 story masonry commercial building with ground display glass, canvas awning, and ornate cornice
   */
  buildCommercialBuilding(options = {}) {
    const {
      width = 12.0,
      depth = 12.0,
      stories = 2,
      storyHeight = 3.5,
      colorWall = 0xe2d6c3,
      colorTrim = 0x3b82f6,
      colorRoof = 0x1e293b,
      colorFoundation = 0x5a5550,
      subterraneanDepth = 3.5
    } = options;

    const totalHeight = stories * storyHeight;
    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    const materials = {
      body: this.getMaterial(colorWall, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(colorFoundation, 'foundation'),
      glass: this.getMaterial(0x1c2b36, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x2d1b0d, 'door'),
      hardware: this.getMaterial(0xd4af37, 'hardware'),
      accent: this.getMaterial(colorTrim, 'accent')
    };

    const { slots, addBox } = this._createGeometryAccumulator();


    // Subterranean foundation plinth
    addBox('foundation', width + 0.8, subterraneanDepth + 0.6, depth + 0.8,
      0, -subterraneanDepth * 0.5 + 0.3, 0);

    // Main masonry body
    addBox('body', width, totalHeight, depth, 0, totalHeight * 0.5, 0);

    // Ground floor commercial storefront display windows
    const displayW = width * 0.36;
    const displayH = storyHeight * 0.65;
    [-halfW * 0.55, halfW * 0.55].forEach(dx => {
      addBox('glass', displayW, displayH, 0.25, dx, displayH * 0.5 + 0.4, halfD + 0.05);
      addBox('trim', displayW + 0.25, 0.15, 0.35, dx, displayH + 0.45, halfD + 0.05);
      addBox('trim', displayW + 0.25, 0.15, 0.35, dx, 0.35, halfD + 0.05);
    });

    // Central recessed storefront entrance
    addBox('door', 2.2, 2.6, 0.2, 0, 1.3, halfD - 0.1);
    addBox('glass', 1.8, 0.6, 0.15, 0, 2.9, halfD - 0.1);
    addBox('hardware', 0.12, 0.35, 0.15, 0.7, 1.3, halfD + 0.05);

    // Fabric canvas awning over display windows
    const awningW = width * 0.92;
    addBox('accent', awningW, 0.15, 2.0, 0, storyHeight * 0.95, halfD + 1.0);
    addBox('accent', awningW, 0.6, 0.15, 0, storyHeight * 0.95 - 0.25, halfD + 1.95);

    // Upper floor windows
    for (let fl = 1; fl < stories; fl++) {
      const winY = fl * storyHeight + storyHeight * 0.5;
      [-halfW * 0.6, 0, halfW * 0.6].forEach(wx => {
        addBox('glass', 1.6, 2.0, 0.2, wx, winY, halfD + 0.05);
        addBox('trim', 1.85, 0.15, 0.3, wx, winY - 1.05, halfD + 0.05); // Sill
        addBox('trim', 1.85, 0.2, 0.3, wx, winY + 1.05, halfD + 0.05);  // Lintel
      });
    }

    // Parapet roofline cornice with modillions
    addBox('trim', width + 0.8, 0.4, depth + 0.8, 0, totalHeight + 0.2, 0);
    addBox('roof', width + 0.4, 0.8, depth + 0.4, 0, totalHeight + 0.6, 0);

    // Side Fenestration (Freestanding Main Street Flank Windows on Left & Right)
    for (let fl = 0; fl < stories; fl++) {
      const winY = fl * storyHeight + storyHeight * 0.5;
      [-halfD * 0.35, halfD * 0.35].forEach(wz => {
        // Left flank (-X)
        addBox('glass', 0.2, 1.8, 1.5, -halfW - 0.04, winY, wz);
        addBox('trim', 0.28, 0.15, 1.7, -halfW - 0.04, winY - 0.95, wz);
        addBox('trim', 0.28, 0.2, 1.7, -halfW - 0.04, winY + 0.95, wz);

        // Right flank (+X)
        addBox('glass', 0.2, 1.8, 1.5, halfW + 0.04, winY, wz);
        addBox('trim', 0.28, 0.15, 1.7, halfW + 0.04, winY - 0.95, wz);
        addBox('trim', 0.28, 0.2, 1.7, halfW + 0.04, winY + 0.95, wz);
      });
    }

    return this._compileToGroup(slots, materials);

  }

  /**
   * 13. COASTAL CRAFTSMAN COTTAGE
   * Cedar-shingle bungalow with dormer roof, fieldstone chimney, and covered porch
   */
  buildCoastalCottage(options = {}) {
    const {
      width = 8.5,
      depth = 10.0,
      height = 4.5,
      colorSiding = 0x8a7050,
      colorRoof = 0x2e353b,
      colorTrim = 0xf5f0e0,
      subterraneanDepth = 3.0
    } = options;

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    const materials = {
      body: this.getMaterial(colorSiding, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x5a5550, 'foundation'),
      glass: this.getMaterial(0x1c2b36, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x4a2a10, 'door'),
      hardware: this.getMaterial(0xd4af37, 'hardware'),
      accent: this.getMaterial(0x3a4f3a, 'accent')
    };

    const { slots, addBox } = this._createGeometryAccumulator();

    // Subterranean foundation
    addBox('foundation', width + 0.6, subterraneanDepth + 0.5, depth + 0.6,
      0, -subterraneanDepth * 0.5 + 0.25, 0);

    // Body
    addBox('body', width, height, depth, 0, height * 0.5, 0);

    // Gabled roof
    const roofH = 3.2;
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.75, roofH, 4);
    roofGeo.rotateY(Math.PI * 0.25);
    roofGeo.scale(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    roofGeo.translate(0, height + roofH * 0.5, 0);
    slots.roof.push(roofGeo);

    // Stone chimney
    addBox('foundation', 1.4, height + roofH + 0.8, 1.4, halfW - 0.8, (height + roofH + 0.8) * 0.5, -halfD * 0.3);

    // Covered porch veranda
    const porchD = 2.4;
    addBox('foundation', width, 0.4, porchD, 0, 0.2, halfD + porchD * 0.5);
    addBox('roof', width + 0.4, 0.25, porchD + 0.4, 0, height * 0.75, halfD + porchD * 0.5);
    [-halfW + 0.4, halfW - 0.4].forEach(px => {
      addBox('trim', 0.25, height * 0.75, 0.25, px, (height * 0.75) * 0.5, halfD + porchD - 0.2);
    });

    // Front door & windows
    addBox('door', 1.2, 2.3, 0.15, -1.2, 1.15, halfD + 0.05);
    addBox('hardware', 0.08, 0.25, 0.1, -0.7, 1.15, halfD + 0.12);
    addBox('glass', 1.6, 1.5, 0.15, 1.5, 1.8, halfD + 0.05);
    addBox('trim', 1.9, 0.12, 0.22, 1.5, 1.0, halfD + 0.05);

    return this._compileToGroup(slots, materials);
  }

  /**
   * 14. RUSTIC INDUSTRIAL WAREHOUSE OR BARN
   * Heavy timber/corrugated warehouse with freight sliding doors and loading bay
   */
  buildWarehouseOrBarn(options = {}) {
    const {
      width = 16.0,
      depth = 20.0,
      height = 9.0,
      colorWall = 0x8a3a2a,
      colorRoof = 0x3a3f44,
      colorTrim = 0x24282c,
      subterraneanDepth = 3.5
    } = options;

    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    const materials = {
      body: this.getMaterial(colorWall, 'body'),
      trim: this.getMaterial(colorTrim, 'trim'),
      roof: this.getMaterial(colorRoof, 'roof'),
      foundation: this.getMaterial(0x5a5550, 'foundation'),
      glass: this.getMaterial(0x1c2b36, 'glass', { opacity: 0.9, transparent: true }),
      door: this.getMaterial(0x2e1b10, 'door'),
      hardware: this.getMaterial(0x8a9299, 'hardware'),
      accent: this.getMaterial(0xd97706, 'accent')
    };

    const { slots, addBox } = this._createGeometryAccumulator();

    // Subterranean foundation plinth
    addBox('foundation', width + 0.8, subterraneanDepth + 0.8, depth + 0.8,
      0, -subterraneanDepth * 0.5 + 0.4, 0);

    // Main warehouse body
    addBox('body', width, height, depth, 0, height * 0.5, 0);

    // Gabled roof
    const roofH = 3.8;
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.72, roofH, 4);
    roofGeo.rotateY(Math.PI * 0.25);
    roofGeo.scale(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    roofGeo.translate(0, height + roofH * 0.5, 0);
    slots.roof.push(roofGeo);

    // Heavy sliding freight doors
    addBox('door', 4.5, 4.2, 0.25, 0, 2.1, halfD + 0.1);
    addBox('hardware', 5.5, 0.2, 0.25, 0, 4.35, halfD + 0.2); // Steel sliding rail

    // Loading dock platform
    addBox('foundation', width * 0.7, 1.0, 3.5, 0, 0.5, halfD + 1.75);

    // Clerestory multi-pane windows
    for (let wz = -halfD * 0.6; wz <= halfD * 0.6; wz += 4.5) {
      addBox('glass', 0.2, 1.6, 2.4, -halfW - 0.05, height * 0.7, wz);
      addBox('glass', 0.2, 1.6, 2.4, halfW + 0.05, height * 0.7, wz);
    }

    return this._compileToGroup(slots, materials);
  }



  /**
   * Generic entry point to construct any architecture archetype
   */
  createStructure(type, options = {}) {
    switch (type) {
      case Archetypes.VICTORIAN_QUEEN_ANNE:
        return this.buildVictorianHouse(options);
      case Archetypes.VICTORIAN_MANOR:
        return this.buildVictorianManor(options);
      case Archetypes.MISSION_BASILICA:
        return this.buildMissionBasilica(options);
      case Archetypes.STORYBOOK_COTTAGE:
        return this.buildStorybookCottage(options);
      case Archetypes.HISTORIC_LODGE:
        return this.buildHistoricLodge(options);
      case Archetypes.CANNERY_FACTORY:
        return this.buildCanneryFactory(options);
      case Archetypes.HISTORIC_BARN:
        return this.buildHistoricBarn(options);
      case Archetypes.MARKET_ARCADE:
        return this.buildMarketArcade(options);
      case Archetypes.ROADSIDE_DINER:
        return this.buildRoadsideDinerOrMotel(options);
      case Archetypes.SEAFOOD_SHACK:
        return this.buildCoastalSeafoodShack(options);
      case Archetypes.WINERY_CHATEAU:
        return this.buildWineryChateau(options);
      case Archetypes.COMMERCIAL_MAIN_STREET:
        return this.buildCommercialBuilding(options);
      case Archetypes.COASTAL_COTTAGE:
        return this.buildCoastalCottage(options);
      case Archetypes.RUSTIC_WAREHOUSE:
        return this.buildWarehouseOrBarn(options);
      default:
        return this.buildVictorianHouse(options);
    }
  }
}

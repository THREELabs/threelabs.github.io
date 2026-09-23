import * as THREE from 'three';

/**
 * Museum-Quality Cel-Shaded Heavy-Duty Commercial Tow Truck
 * 
 * Features:
 * - Commercial Heavy Diesel Cab in Safety Orange / Highway Yellow livery
 * - Chrome bumper, heavy grille, sun visor, and dual vertical chrome exhaust stacks
 * - Dual roof-mounted emergency strobe lightbars (amber & red) with rotating worklights
 * - Diamond-plate wrecker deck, winch crane mast, braided steel winch cable with hook
 * - Hydraulic wheel-lift stinger cradle that can extend and hitch to the player's car
 * - 6 Commercial dual-rear-axle wheels with rotating rims and steerable front axle
 * - High-visibility hazard chevron rear bumper decals & "BAJA 24HR RESCUE" branding
 */
export class TowTruck {
  constructor(renderer) {
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.group.name = 'TowTruck_Root';

    // Materials Palette
    this.setupMaterials();

    // Model components
    this.wheels = [];
    this.steerNodes = [];
    this.strobeMeshes = [];
    this.strobePhase = 0;

    // Cable & Hitch Rig
    this.winchGroup = null;
    this.cableLine = null;
    this.hookMesh = null;
    this.wheelLiftGroup = null;

    // Build vehicle hierarchy
    this.buildTowTruckModel();

    // Default hidden until dispatched
    this.group.visible = false;
  }

  setupMaterials() {
    // Safety Gold / Commercial Rescue Yellow
    this.matCabPaint = this.renderer.createToonMaterial({
      color: 0xf59e0b,
      gradientBands: 3,
      rimColor: 0xfef08a,
      rimPower: 2.5
    });

    // Dark Industrial Slate Trim / Bed Frame
    this.matChassis = this.renderer.createToonMaterial({
      color: 0x1e293b,
      gradientBands: 2
    });

    // Mirror Polish Chrome (Grille, Stacks, Bumper, Mirrors)
    this.matChrome = this.renderer.createToonMaterial({
      color: 0xf1f5f9,
      gradientBands: 3,
      rimColor: 0xffffff,
      rimPower: 1.5
    });

    // Tinted Automotive Glass
    this.matGlass = this.renderer.createToonMaterial({
      color: 0x091e3a,
      opacity: 0.65,
      transparent: true
    });

    // Heavy Commercial Rubber Tires
    this.matTire = this.renderer.createToonMaterial({
      color: 0x111317,
      gradientBands: 2
    });

    // Steel Wheel Hubs
    this.matSteelRim = this.renderer.createToonMaterial({
      color: 0x94a3b8,
      gradientBands: 2
    });

    // Emissive Emergency Lighting
    this.matStrobeAmber = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.matStrobeRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matStrobeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.matLightOff = this.renderer.createToonMaterial({ color: 0x334155, gradientBands: 2 });

    // Headlights & Tail Lights
    this.matHeadlight = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    this.matTaillight = new THREE.MeshBasicMaterial({ color: 0x991b1b });
    this.matBrakelight = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Braided Steel Cable & Winch Hook
    this.matSteelCable = new THREE.LineBasicMaterial({ color: 0xcfd8dc, linewidth: 3 });
    this.matHook = this.renderer.createToonMaterial({ color: 0xd97706, gradientBands: 2 });
  }

  createDecalTexture(text, subtext = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 128);

    // Dark badge background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 12);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 36px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 56);

    if (subtext) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 20px "Segoe UI", Arial, sans-serif';
      ctx.fillText(subtext, 256, 92);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  createChevronTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = '#0f172a';
    const w = 32;
    for (let x = -64; x < 576; x += w * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w, 0);
      ctx.lineTo(x + w - 24, 64);
      ctx.lineTo(x - 24, 64);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  createCommercialWheel(radius = 0.46, width = 0.32, isDually = false) {
    const wheelHub = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    tireGeo.rotateZ(Math.PI * 0.5);
    const tireMesh = new THREE.Mesh(tireGeo, this.matTire);
    tireMesh.castShadow = true;
    wheelHub.add(tireMesh);

    // Heavy Steel Rim Dish
    const rimRadius = radius * 0.62;
    const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, width + 0.02, 16);
    rimGeo.rotateZ(Math.PI * 0.5);
    const rimMesh = new THREE.Mesh(rimGeo, this.matSteelRim);
    wheelHub.add(rimMesh);

    // Chrome Center Hub Nut
    const centerNut = new THREE.Mesh(
      new THREE.CylinderGeometry(rimRadius * 0.35, rimRadius * 0.35, width + 0.06, 8),
      this.matChrome
    );
    centerNut.rotation.z = Math.PI * 0.5;
    wheelHub.add(centerNut);

    if (isDually) {
      // Second outer tire for dually rear axle
      const outerTire = new THREE.Mesh(tireGeo, this.matTire);
      outerTire.position.x = width * 0.95;
      outerTire.castShadow = true;
      wheelHub.add(outerTire);
    }

    return { wheelHub, tireMesh };
  }

  buildTowTruckModel() {
    const vGroup = new THREE.Group();
    this.bodyGroup = vGroup;
    this.group.add(vGroup);

    // Dimensions
    const len = 7.6;
    const wid = 2.45;

    // -------------------------------------------------------------
    // 1. Heavy Box-Section Steel Truck Frame & Chassis
    // -------------------------------------------------------------
    const frameGeo = new THREE.BoxGeometry(wid * 0.78, 0.35, len);
    const frame = new THREE.Mesh(frameGeo, this.matChassis);
    frame.position.set(0, 0.55, 0);
    frame.castShadow = true;
    vGroup.add(frame);

    // Massive Chrome Front Bumper with Tow Shackles
    const bumperGeo = new THREE.BoxGeometry(wid * 1.05, 0.42, 0.35);
    const bumper = new THREE.Mesh(bumperGeo, this.matChrome);
    bumper.position.set(0, 0.48, len * 0.5 - 0.12);
    bumper.castShadow = true;
    vGroup.add(bumper);

    [-0.65, 0.65].forEach(sx => {
      const shackle = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.028, 8, 16),
        this.matChrome
      );
      shackle.rotation.x = Math.PI * 0.5;
      shackle.position.set(sx, 0.42, len * 0.5 + 0.06);
      vGroup.add(shackle);
    });

    // -------------------------------------------------------------
    // 2. Commercial Diesel Cab & Hood
    // -------------------------------------------------------------
    const cabLen = 2.1;
    const cabWid = wid * 0.92;
    const cabHt = 1.45;
    const cabGeo = new THREE.BoxGeometry(cabWid, cabHt, cabLen);
    const cab = new THREE.Mesh(cabGeo, this.matCabPaint);
    cab.position.set(0, 1.48, 0.95);
    cab.castShadow = true;
    vGroup.add(cab);

    // Sloped Front Hood & Engine Bay
    const hoodLen = 1.65;
    const hoodGeo = new THREE.BoxGeometry(cabWid * 0.88, 0.82, hoodLen);
    const hood = new THREE.Mesh(hoodGeo, this.matCabPaint);
    hood.position.set(0, 1.12, 0.95 + cabLen * 0.5 + hoodLen * 0.5 - 0.05);
    hood.castShadow = true;
    vGroup.add(hood);

    // Huge Chrome Billet Grille
    const grilleGeo = new THREE.BoxGeometry(cabWid * 0.72, 0.70, 0.12);
    const grille = new THREE.Mesh(grilleGeo, this.matChrome);
    grille.position.set(0, 1.08, len * 0.5 - 0.08);
    vGroup.add(grille);

    // Front Windshield (Angled)
    const windshieldGeo = new THREE.PlaneGeometry(cabWid * 0.84, 0.78);
    const windshield = new THREE.Mesh(windshieldGeo, this.matGlass);
    windshield.position.set(0, 1.65, 0.95 + cabLen * 0.5 + 0.02);
    windshield.rotation.x = -Math.PI * 0.16;
    vGroup.add(windshield);

    // Side Windows
    [-cabWid * 0.505, cabWid * 0.505].forEach((wx, idx) => {
      const sideWinGeo = new THREE.PlaneGeometry(cabLen * 0.75, 0.55);
      const sideWin = new THREE.Mesh(sideWinGeo, this.matGlass);
      sideWin.position.set(wx, 1.65, 0.95);
      sideWin.rotation.y = idx === 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      vGroup.add(sideWin);
    });

    // Chrome Sun Visor above Windshield
    const visorGeo = new THREE.BoxGeometry(cabWid * 0.95, 0.06, 0.32);
    const visor = new THREE.Mesh(visorGeo, this.matChrome);
    visor.position.set(0, 2.18, 0.95 + cabLen * 0.5 + 0.08);
    visor.rotation.x = Math.PI * 0.12;
    vGroup.add(visor);

    // Large West-Coast Style Chrome Towing Mirrors
    [-cabWid * 0.56, cabWid * 0.56].forEach(mx => {
      const mirrorBracket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8),
        this.matChrome
      );
      mirrorBracket.position.set(mx, 1.65, 1.45);
      vGroup.add(mirrorBracket);

      const mirrorHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.42, 0.18),
        this.matChrome
      );
      mirrorHousing.position.set(mx + (mx > 0 ? 0.06 : -0.06), 1.65, 1.45);
      vGroup.add(mirrorHousing);
    });

    // Dual Vertical Chrome Exhaust Stacks Behind Cab
    [-cabWid * 0.44, cabWid * 0.44].forEach(sx => {
      const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 2.3, 12),
        this.matChrome
      );
      stack.position.set(sx, 2.35, 0.95 - cabLen * 0.5 - 0.12);
      stack.castShadow = true;
      vGroup.add(stack);

      // Curved Stack Tip
      const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.35, 12),
        this.matChrome
      );
      tip.position.set(sx, 3.55, 0.95 - cabLen * 0.5 - 0.22);
      tip.rotation.x = -Math.PI * 0.22;
      vGroup.add(tip);
    });

    // Side Door Commercial Branding Decal
    const decalTex = this.createDecalTexture('BAJA RESCUE', '24HR HIGHWAY TOW');
    const matDecal = new THREE.MeshBasicMaterial({
      map: decalTex,
      transparent: true,
      depthWrite: false
    });
    [-cabWid * 0.505, cabWid * 0.505].forEach((dx, idx) => {
      const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.45), matDecal);
      decalMesh.position.set(dx, 1.25, 0.95);
      decalMesh.rotation.y = idx === 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      vGroup.add(decalMesh);
    });

    // -------------------------------------------------------------
    // 3. Roof Emergency Strobe Lightbars & Halogen Worklights
    // -------------------------------------------------------------
    const lightbarBase = new THREE.Mesh(
      new THREE.BoxGeometry(cabWid * 0.85, 0.08, 0.28),
      this.matChassis
    );
    lightbarBase.position.set(0, 2.24, 0.95);
    vGroup.add(lightbarBase);

    // Strobe Pods (Amber & Red Alternating LED Clusters)
    const strobeGeo = new THREE.BoxGeometry(0.24, 0.12, 0.24);
    const strobeOffsets = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
    strobeOffsets.forEach((ox, idx) => {
      const isRed = (idx % 2 === 0);
      const strobeMesh = new THREE.Mesh(strobeGeo, isRed ? this.matStrobeRed : this.matStrobeAmber);
      strobeMesh.position.set(ox, 2.32, 0.95);
      vGroup.add(strobeMesh);
      this.strobeMeshes.push({ mesh: strobeMesh, isRed, index: idx });
    });

    // Cab Rear Halogen Work Floodlights
    [-0.55, 0.55].forEach(fx => {
      const floodlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.14, 0.12),
        this.matChrome
      );
      floodlight.position.set(fx, 2.15, 0.95 - cabLen * 0.5 - 0.08);
      vGroup.add(floodlight);

      const floodLens = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 0.10),
        this.matStrobeWhite
      );
      floodLens.position.set(fx, 2.15, 0.95 - cabLen * 0.5 - 0.145);
      floodLens.rotation.y = Math.PI;
      vGroup.add(floodLens);
    });

    // -------------------------------------------------------------
    // 4. Diamond-Plate Wrecker Bed & Tool Boxes
    // -------------------------------------------------------------
    const bedLen = 4.2;
    const bedWid = wid * 0.96;
    const bedGeo = new THREE.BoxGeometry(bedWid, 0.22, bedLen);
    const bed = new THREE.Mesh(bedGeo, this.matChassis);
    bed.position.set(0, 0.82, -1.55);
    bed.castShadow = true;
    vGroup.add(bed);

    // Lower Side Toolboxes & Battery Boxes
    [-bedWid * 0.48, bedWid * 0.48].forEach(bx => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.45, 2.2),
        this.matChrome
      );
      box.position.set(bx, 0.52, -1.2);
      vGroup.add(box);
    });

    // Rear Bumper Hazard Chevron Decal
    const chevronTex = this.createChevronTexture();
    const matChevron = new THREE.MeshBasicMaterial({
      map: chevronTex,
      transparent: true,
      depthWrite: false
    });
    const chevronMesh = new THREE.Mesh(new THREE.PlaneGeometry(bedWid * 0.96, 0.28), matChevron);
    chevronMesh.position.set(0, 0.58, -1.55 - bedLen * 0.5 - 0.02);
    chevronMesh.rotation.y = Math.PI;
    vGroup.add(chevronMesh);

    // Quad Rear Taillights / Strobes
    [-bedWid * 0.40, -bedWid * 0.25, bedWid * 0.25, bedWid * 0.40].forEach((rx, idx) => {
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12),
        idx % 2 === 0 ? this.matTaillight : this.matStrobeAmber
      );
      tail.rotation.x = Math.PI * 0.5;
      tail.position.set(rx, 0.82, -1.55 - bedLen * 0.5 - 0.02);
      vGroup.add(tail);
    });

    // -------------------------------------------------------------
    // 5. Heavy-Duty Hydraulic Winch Boom & Cable Crane
    // -------------------------------------------------------------
    const boomGroup = new THREE.Group();
    boomGroup.position.set(0, 0.92, -0.6);
    vGroup.add(boomGroup);
    this.winchGroup = boomGroup;

    // Twin A-Frame Steel Boom Legs
    [-0.45, 0.45].forEach(ax => {
      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.4, 8);
      const leg = new THREE.Mesh(legGeo, this.matCabPaint);
      leg.position.set(ax, 1.05, -0.6);
      leg.rotation.x = Math.PI * 0.28;
      leg.castShadow = true;
      boomGroup.add(leg);
    });

    // Winch Spool Drum with Hydraulic Motor
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.65, 12),
      this.matChrome
    );
    drum.rotation.z = Math.PI * 0.5;
    drum.position.set(0, 0.45, -0.15);
    boomGroup.add(drum);

    // Boom Crown Head Sheave Wheel & Hook Attachment Point
    const crownHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.25, 0.35),
      this.matChassis
    );
    crownHead.position.set(0, 1.95, -1.45);
    boomGroup.add(crownHead);

    const sheave = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12),
      this.matChrome
    );
    sheave.rotation.z = Math.PI * 0.5;
    sheave.position.set(0, 1.95, -1.55);
    boomGroup.add(sheave);

    // -------------------------------------------------------------
    // 6. Hydraulic Wheel-Lift / Underlift Stinger Arm
    // -------------------------------------------------------------
    const liftArmGroup = new THREE.Group();
    liftArmGroup.position.set(0, 0.45, -3.2);
    vGroup.add(liftArmGroup);
    this.wheelLiftGroup = liftArmGroup;

    // Main Extendable Stinger Beam
    const stingerGeo = new THREE.BoxGeometry(0.32, 0.22, 1.8);
    const stinger = new THREE.Mesh(stingerGeo, this.matChassis);
    stinger.position.set(0, 0, -0.7);
    liftArmGroup.add(stinger);

    // Crossbar T-Bar & Tire Cradles
    const tbarGeo = new THREE.BoxGeometry(2.1, 0.18, 0.22);
    const tbar = new THREE.Mesh(tbarGeo, this.matCabPaint);
    tbar.position.set(0, -0.05, -1.6);
    liftArmGroup.add(tbar);

    // Left & Right Wheel Cradles / L-Arms
    [-0.85, 0.85].forEach(cx => {
      const cradle = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.14, 0.75),
        this.matChassis
      );
      cradle.position.set(cx, -0.05, -1.6);
      liftArmGroup.add(cradle);
    });

    // -------------------------------------------------------------
    // 7. Dynamic Braided Steel Winch Cable Line
    // -------------------------------------------------------------
    const cableGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 2.85, -2.15),
      new THREE.Vector3(0, 0.45, -4.6)
    ]);
    this.cableLine = new THREE.Line(cableGeo, this.matSteelCable);
    this.cableLine.visible = false;
    vGroup.add(this.cableLine);

    // Forged Steel Tow Hook
    const hookGeo = new THREE.TorusGeometry(0.12, 0.038, 8, 16, Math.PI * 1.5);
    this.hookMesh = new THREE.Mesh(hookGeo, this.matHook);
    this.hookMesh.position.set(0, 0.45, -4.6);
    this.hookMesh.rotation.z = Math.PI;
    this.hookMesh.visible = false;
    vGroup.add(this.hookMesh);

    // -------------------------------------------------------------
    // 8. Commercial Wheels (Front Steerable + Rear Tandem Dually)
    // -------------------------------------------------------------
    // Front Axle (Steerable)
    [-wid * 0.48, wid * 0.48].forEach(wx => {
      const steerNode = new THREE.Group();
      steerNode.position.set(wx, 0.46, 2.45);
      vGroup.add(steerNode);
      this.steerNodes.push(steerNode);

      const { wheelHub, tireMesh } = this.createCommercialWheel(0.46, 0.30, false);
      steerNode.add(wheelHub);
      this.wheels.push(tireMesh);
    });

    // Rear Axle 1 (Dually)
    [-wid * 0.44, wid * 0.44].forEach(wx => {
      const { wheelHub, tireMesh } = this.createCommercialWheel(0.46, 0.28, true);
      wheelHub.position.set(wx > 0 ? wx - 0.15 : wx, 0.46, -1.45);
      vGroup.add(wheelHub);
      this.wheels.push(tireMesh);
    });

    // Rear Axle 2 (Dually Tandem)
    [-wid * 0.44, wid * 0.44].forEach(wx => {
      const { wheelHub, tireMesh } = this.createCommercialWheel(0.46, 0.28, true);
      wheelHub.position.set(wx > 0 ? wx - 0.15 : wx, 0.46, -2.65);
      vGroup.add(wheelHub);
      this.wheels.push(tireMesh);
    });

    // Front Headlights
    [-wid * 0.38, wid * 0.38].forEach(hx => {
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.18, 0.05),
        this.matHeadlight
      );
      head.position.set(hx, 0.95, len * 0.5 - 0.05);
      vGroup.add(head);
    });
  }

  update(dt, speedMps = 0, steerAngle = 0, isTowing = false, hookTargetWorld = null) {
    if (!this.group.visible) return;

    // 1. Wheel Spin Rotation
    const spinDelta = (speedMps * dt) / 0.46;
    this.wheels.forEach(w => {
      w.rotation.x += spinDelta;
    });

    // 2. Front Axle Steering
    this.steerNodes.forEach(node => {
      node.rotation.y = THREE.MathUtils.lerp(node.rotation.y, steerAngle, 0.15);
    });

    // 3. Strobe Lightbar Flasher Cycle (High-intensity emergency flash pattern)
    this.strobePhase += dt * 9.0;
    const flashIndex = Math.floor(this.strobePhase) % 4;

    this.strobeMeshes.forEach(item => {
      const isLeft = item.index < 3;
      const isLit = (isLeft && (flashIndex === 0 || flashIndex === 1)) ||
                    (!isLeft && (flashIndex === 2 || flashIndex === 3));

      item.mesh.material = isLit ? (item.isRed ? this.matStrobeRed : this.matStrobeAmber) : this.matLightOff;
    });

    // 4. Update Winch Cable to target vehicle position
    if (isTowing && hookTargetWorld && this.cableLine && this.hookMesh) {
      this.cableLine.visible = true;
      this.hookMesh.visible = true;

      // Transform world target to local tow truck coordinates
      const localTarget = hookTargetWorld.clone();
      this.group.worldToLocal(localTarget);

      // Top sheave anchor point in local space
      const sheaveAnchor = new THREE.Vector3(0, 2.85, -2.15);

      const positions = this.cableLine.geometry.attributes.position;
      positions.setXYZ(0, sheaveAnchor.x, sheaveAnchor.y, sheaveAnchor.z);
      positions.setXYZ(1, localTarget.x, localTarget.y, localTarget.z);
      positions.needsUpdate = true;

      this.hookMesh.position.copy(localTarget);
    } else if (this.cableLine && this.hookMesh) {
      this.cableLine.visible = false;
      this.hookMesh.visible = false;
    }
  }
}

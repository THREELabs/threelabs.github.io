import * as THREE from 'three';
import { gameState } from '../state.js';

/**
 * 🕵️ MYSTERY CRIME SCENE & MULTI-ZONE GTA-STYLE INVESTIGATION SYSTEM
 *
 * Authored Clues Across All 9 Highway 1 Zones:
 * - Zone 0 (Mojave Desert, Z=920m): Crime Scene Shell Casings & Bloodstained Ledger
 * - Zone 1 (Malibu & PCH, Z=2,750m): Abandoned Bullet-Riddled Mob Getaway Sedan
 * - Zone 2 (Big Sur, Z=6,400m): Discarded Burner Phone & Wiretap Cassette at Bixby Lookout
 * - Zone 3 (Monterey & Carmel, Z=9,650m): Smuggler Briefcase & Offshore Fake Passports
 * - Zone 4 (SF Bay & Marin, Z=11,500m): Syndicate Radio Scanner & Wiretap Transponder
 * - Zone 5 (NorCal & Redwood, Z=14,200m): Cartel Flight Manifest & Smuggling Route Map
 * - Zone 6 (Oregon Coast, Z=16,800m): Contraband Cargo Crates & Flashing GPS Beacon
 * - Zone 7 (Columbia Gorge, Z=19,400m): Boss's Encrypted Satellite Radio Transceiver
 * - Zone 8 (Washington & Olympic, Z=22,200m): Hitman's Carbon Sniper Rifle Hardcase & Hit List
 *
 * Law Enforcement Turn-in Precincts:
 * - Malibu Sheriff Station (Z=5,050m)
 * - Washington State Patrol & Federal Regional HQ (Z=22,800m)
 */

export const ZONE_CLUES_CONFIG = [
  {
    zone: 0,
    key: 'zone0',
    name: 'Shell Casings & Drug Ledger',
    locName: 'Mojave Arrowhead Gully (Z=920m)',
    pos: new THREE.Vector3(103.5, 25.5, 920.0),
    radius: 16.0,
    desc: 'Fired 9mm brass casings and bloodstained narcotics delivery ledger on the desert wash.'
  },
  {
    zone: 1,
    key: 'zone1',
    name: 'Abandoned Mob Getaway Sedan',
    locName: 'Malibu Coastal Turnout (Z=2,750m)',
    pos: new THREE.Vector3(13.0, 1.85, 2750.0),
    radius: 18.0,
    desc: 'Black vintage town car crashed into ditch. Windshield bullet holes & steaming radiator.'
  },
  {
    zone: 2,
    key: 'zone2',
    name: 'Burner Phone & Wiretap Cassette',
    locName: 'Big Sur Bixby Lookout (Z=6,400m)',
    pos: new THREE.Vector3(-28.5, 12.4, 6400.0),
    radius: 16.0,
    desc: 'Flashing red LED burner flip-phone with recorded wiretap audio cassette on cliffside rocks.'
  },
  {
    zone: 3,
    key: 'zone3',
    name: 'Smuggler Briefcase & Passports',
    locName: 'Carmel Mission Turnout (Z=9,650m)',
    pos: new THREE.Vector3(32.0, 6.2, 9650.0),
    radius: 16.0,
    desc: 'Heavy flight case with forged international passports and offshore Cayman deposit slips.'
  },
  {
    zone: 4,
    key: 'zone4',
    name: 'Police Scanner & Transponder',
    locName: 'Marin Headlands Bunker (Z=11,500m)',
    pos: new THREE.Vector3(-30.0, 18.5, 11500.0),
    radius: 16.0,
    desc: 'Military radio transponder box tuned to California Highway Patrol tactical channels.'
  },
  {
    zone: 5,
    key: 'zone5',
    name: 'Cartel Flight Manifest & Map',
    locName: 'Chandelier Redwood Turnout (Z=14,200m)',
    pos: new THREE.Vector3(28.0, 8.5, 14200.0),
    radius: 16.0,
    desc: 'Clipboard with clandestine airstrip coordinates spanning the Pacific Northwest corridor.'
  },
  {
    zone: 6,
    key: 'zone6',
    name: 'Contraband Crates & GPS Beacon',
    locName: 'Cannon Beach Driftwood Turnout (Z=16,800m)',
    pos: new THREE.Vector3(-32.0, 3.8, 16800.0),
    radius: 16.0,
    desc: 'Waterproof pelican cases with blinking green GPS tracking puck hidden among driftwood logs.'
  },
  {
    zone: 7,
    key: 'zone7',
    name: 'Encrypted Satellite Radio',
    locName: 'Columbia Gorge Vista Turnout (Z=19,400m)',
    pos: new THREE.Vector3(29.0, 14.2, 19400.0),
    radius: 16.0,
    desc: 'Rugged yellow satellite phone with dish antenna broadcasting encrypted Syndicate signals.'
  },
  {
    zone: 8,
    key: 'zone8',
    name: 'Sniper Rifle Hardcase & Hit List',
    locName: 'Olympic Mountain Vista (Z=22,200m)',
    pos: new THREE.Vector3(-28.0, 7.5, 22200.0),
    radius: 16.0,
    desc: 'Carbon-fiber rifle case with high-power optics and photographic dossier of syndicate targets.'
  }
];

export class MysteryCrimeScene {
  constructor(renderer, splineRoad) {
    this.renderer = renderer;
    this.splineRoad = splineRoad;
    this.group = new THREE.Group();
    this.group.name = 'MysteryCrimeSceneSystem';

    // Animation & Cutscene State
    this.animTime = 0.0;
    this.isCinematicPlaying = false;
    this.cinematicPhase = 'IDLE'; // 'ESTABLISHING', 'STANDOFF', 'DRAW', 'EXECUTION', 'PEELOUT', 'FINISHED'
    this.getawayEscapeT = 0.0;
    this.cutsceneType = 'murder'; // 'murder' | 'police_turnin'
    this.turninTimer = 0.0;

    // References for dynamic animation
    this.canyonGroup = null;
    this.victimMesh = null;
    this.victimArms = null;
    this.victimHead = null;
    this.bossMesh = null;
    this.bossArms = null;
    this.bossHead = null;
    this.enforcerMesh = null;
    this.enforcerArm = null;
    this.enforcerArms = null;
    this.enforcerHead = null;
    this.muzzleFlash = null;
    this.muzzleLight = null;
    this.gunsmoke = null;
    this.getawayCar = null;
    this.getawayCarWheels = [];
    this.getawayDustPool = [];
    this.canyonBreezeParticles = [];
    this.beacons = [];
    this.clue1RadiatorSteam = [];

    // Camera rig for cutscenes
    this.camPos = new THREE.Vector3();
    this.camLookAt = new THREE.Vector3();
    this.camFov = 65.0;

    this.initMaterials();
    this.buildCanyonCrimeScene();
    this.buildAllZoneClues();
    this.buildSheriffStations();
  }

  initMaterials() {
    const r = this.renderer;
    const createMat = (color, gradientBands = 3) => {
      if (r && typeof r.createToonMaterial === 'function') {
        return r.createToonMaterial({ color, gradientBands });
      }
      return new THREE.MeshBasicMaterial({ color });
    };

    this.matMobCarBlack = createMat(0x111317, 4);
    this.matMobCarChrome = createMat(0xd8e0e8, 3);
    this.matHeadlightGlow = new THREE.MeshBasicMaterial({ color: 0xfff0b8 });
    this.matTaillightGlow = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

    this.matBossCoat = createMat(0x1a1c22, 2);
    this.matFedora = createMat(0x0e0f12, 2);
    this.matSkin = createMat(0xdfb48e, 2);
    this.matVictimJacket = createMat(0x7a4b2c, 2);
    this.matPants = createMat(0x1e242d, 2);
    this.matBriefcase = createMat(0x9ca3af, 2);
    this.matBriefcaseGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    this.matMuzzleFlash = new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.95 });
    this.matGunsmoke = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 });
    this.matDust = new THREE.MeshBasicMaterial({ color: 0xc8aa78, transparent: true, opacity: 0.5 });
    this.matSteam = new THREE.MeshBasicMaterial({ color: 0xe0e7ef, transparent: true, opacity: 0.55 });

    this.matBeaconRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matBeaconGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    this.matBeaconBlue = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    this.matBeaconAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matBrass = createMat(0xeab308, 2);
    this.matPaper = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.matWoodCrate = createMat(0x8b5a2b, 2);
    this.matHardcase = createMat(0x18181b, 2);

    // Authored Desert Ranch Adobe Architecture
    this.matRanchAdobeStucco = createMat(0xd8c5a8, 3);
    this.matRanchWhiteStucco = this.matRanchAdobeStucco; // Backwards compatibility
    this.matRanchRoofTile = createMat(0xbf4928, 3);
    this.matRanchWoodBeam = createMat(0x422617, 2);
    this.matRanchDoor = createMat(0x2d1a0e, 2);
    this.matRanchFlagstone = createMat(0xded4c8, 2);
    this.matCourierCar = createMat(0xd5ccbe, 4);
    this.matWhiteCourierCar = this.matCourierCar; // Backwards compatibility
    this.matCarGlass = createMat(0x1a222d, 3);
    this.matRanchFenceWhite = createMat(0xdcdfe4, 2);

    // Law Enforcement Architecture
    this.matStationStucco = createMat(0xe2e8f0, 3);
    this.matStationBrick = createMat(0x8b3a2b, 2);
    this.matStationRoof = createMat(0x334155, 2);
    this.matPoliceBlue = createMat(0x1d4ed8, 3);
    this.matPoliceGold = createMat(0xf59e0b, 2);
  }

  createMobSedan(tinted = false, isWhite = false) {
    const sedan = new THREE.Group();
    const carColorMat = isWhite ? this.matCourierCar : this.matMobCarBlack;
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.8), carColorMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    sedan.add(bodyMesh);

    // Greenhouse cabin with dark automotive tinted glass
    const cabinMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.58, 2.5),
      this.matCarGlass
    );
    cabinMesh.position.set(0, 1.15, -0.2);
    cabinMesh.castShadow = true;
    sedan.add(cabinMesh);

    // Body-colored roof cap
    const roofCap = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.08, 2.56),
      carColorMat
    );
    roofCap.position.set(0, 1.46, -0.2);
    roofCap.castShadow = true;
    sedan.add(roofCap);

    // Chrome window pillars
    [-0.88, 0.88].forEach(px => {
      const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 0.06), this.matMobCarChrome);
      aPillar.position.set(px, 1.15, 0.95);
      sedan.add(aPillar);
      const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.58, 0.06), this.matMobCarChrome);
      cPillar.position.set(px, 1.15, -1.35);
      sedan.add(cPillar);
    });

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 0.22), this.matMobCarChrome);
    frontBumper.position.set(0, 0.35, 2.45);
    sedan.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.16, 0.22), this.matMobCarChrome);
    rearBumper.position.set(0, 0.35, -2.45);
    sedan.add(rearBumper);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.08), this.matMobCarChrome);
    grille.position.set(0, 0.65, 2.44);
    sedan.add(grille);

    [-0.75, 0.75].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), this.matHeadlightGlow);
      hl.rotation.x = Math.PI * 0.5;
      hl.position.set(hx, 0.68, 2.44);
      sedan.add(hl);
    });

    [-0.8, 0.8].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), this.matTaillightGlow);
      tl.position.set(tx, 0.68, -2.43);
      sedan.add(tl);
    });

    const wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12);
    wheelGeo.rotateZ(Math.PI * 0.5);
    const hubcapGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 12);
    hubcapGeo.rotateZ(Math.PI * 0.5);

    [{ x: -1.05, z: 1.4 }, { x: 1.05, z: 1.4 }, { x: -1.05, z: -1.4 }, { x: 1.05, z: -1.4 }].forEach(wPos => {
      const w = new THREE.Mesh(wheelGeo, this.matMobCarBlack);
      w.position.set(wPos.x, 0.38, wPos.z);
      w.castShadow = true;
      sedan.add(w);

      const hub = new THREE.Mesh(hubcapGeo, this.matMobCarChrome);
      hub.position.set(wPos.x, 0.38, wPos.z);
      sedan.add(hub);

      wheels.push(w);
    });

    return { group: sedan, wheels };
  }

  createMobster(type = 'boss') {
    const person = new THREE.Group();
    const coatMat = type === 'boss' ? this.matBossCoat : (type === 'victim' ? this.matVictimJacket : this.matBossCoat);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), this.matPants);
    leftLeg.position.set(-0.14, 0.4, 0);
    person.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), this.matPants);
    rightLeg.position.set(0.14, 0.4, 0);
    person.add(rightLeg);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.3), coatMat);
    torso.position.set(0, 1.12, 0);
    torso.castShadow = true;
    person.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.matSkin);
    headGroup.add(headMesh);

    if (type === 'boss' || type === 'enforcer') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 12), this.matFedora);
      brim.position.set(0, 0.1, 0);
      headGroup.add(brim);

      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.16, 12), this.matFedora);
      crown.position.set(0, 0.19, 0);
      headGroup.add(crown);
    }
    person.add(headGroup);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.32, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), coatMat);
    leftArmMesh.position.set(0, -0.25, 0);
    leftArmPivot.add(leftArmMesh);
    person.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.32, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.14), coatMat);
    rightArmMesh.position.set(0, -0.25, 0);
    rightArmPivot.add(rightArmMesh);

    if (type === 'enforcer') {
      const pistol = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.24), this.matMobCarBlack);
      pistol.position.set(0, -0.52, 0.1);
      rightArmPivot.add(pistol);
    }
    person.add(rightArmPivot);

    return { person, rightArmPivot, leftArmPivot, torso, head: headGroup };
  }

  buildCanyonCrimeScene() {
    this.canyonGroup = new THREE.Group();
    this.canyonGroup.position.set(104.5, 25.5, 920.0);
    this.canyonGroup.name = 'CanyonCrimeScene';

    // 1. Authored Warm Southwestern Adobe Ranch Hacienda Villa
    // Positioned on east flank as architectural backdrop behind the transaction
    const ranchHacienda = new THREE.Group();
    ranchHacienda.position.set(16.0, 0, -5.0);
    ranchHacienda.rotation.y = -Math.PI * 0.35;

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(13.5, 5.4, 8.5), this.matRanchAdobeStucco);
    mainBody.position.y = 2.7;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    ranchHacienda.add(mainBody);

    const tileRoof = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.6, 9.2), this.matRanchRoofTile);
    tileRoof.position.y = 5.6;
    tileRoof.castShadow = true;
    ranchHacienda.add(tileRoof);

    // Second-story adobe tower wing
    const towerWing = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 5.5), this.matRanchAdobeStucco);
    towerWing.position.set(3.8, 7.0, 0.5);
    towerWing.castShadow = true;
    ranchHacienda.add(towerWing);

    const towerRoof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.5, 6.1), this.matRanchRoofTile);
    towerRoof.position.set(3.8, 8.8, 0.5);
    towerRoof.castShadow = true;
    ranchHacienda.add(towerRoof);

    // Deep recessed arched rustic wood entryway
    const archPortal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 0.6), this.matRanchDoor);
    archPortal.position.set(-2.0, 1.7, 4.3);
    ranchHacienda.add(archPortal);

    // Traditional dark timber roof beams (vigas) protruding from facade
    for (let bx = -5.0; bx <= 5.0; bx += 1.8) {
      const viga = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6), this.matRanchWoodBeam);
      viga.rotation.x = Math.PI * 0.5;
      viga.position.set(bx, 5.0, 4.4);
      ranchHacienda.add(viga);
    }

    this.canyonGroup.add(ranchHacienda);

    // 2. Secondary Adobe Outbuilding & Covered Carport
    const outbuilding = new THREE.Group();
    outbuilding.position.set(15.0, 0, 10.0);
    outbuilding.rotation.y = Math.PI * 0.25;

    const outBody = new THREE.Mesh(new THREE.BoxGeometry(9.0, 3.8, 6.0), this.matRanchAdobeStucco);
    outBody.position.y = 1.9;
    outBody.castShadow = true;
    outbuilding.add(outBody);

    const outRoof = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.45, 6.6), this.matRanchRoofTile);
    outRoof.position.y = 4.0;
    outRoof.castShadow = true;
    outbuilding.add(outRoof);

    this.canyonGroup.add(outbuilding);

    // 3. Adobe Courtyard Perimeter Enclosure Walls
    const wallMat = this.matRanchAdobeStucco;
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 2.0, 0.45), wallMat);
    northWall.position.set(15.0, 1.0, 16.0);
    northWall.castShadow = true;
    this.canyonGroup.add(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 2.0, 0.45), wallMat);
    southWall.position.set(15.0, 1.0, -15.0);
    southWall.castShadow = true;
    this.canyonGroup.add(southWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.0, 31.0), wallMat);
    eastWall.position.set(23.0, 1.0, 0.5);
    eastWall.castShadow = true;
    this.canyonGroup.add(eastWall);

    // 5. Classic White Post-and-Rail Corral Fences Framing East Paddock
    for (let fz = -14.0; fz <= 14.0; fz += 4.5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6), this.matRanchFenceWhite);
      post.position.set(24.5, 0.7, fz);
      post.castShadow = true;
      this.canyonGroup.add(post);

      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.5), this.matRanchFenceWhite);
      rail1.position.set(24.5, 1.1, fz + 2.25);
      this.canyonGroup.add(rail1);

      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.5), this.matRanchFenceWhite);
      rail2.position.set(24.5, 0.65, fz + 2.25);
      this.canyonGroup.add(rail2);
    }

    // 6. Courier's Pearl White Vintage Luxury Sedan
    const car1 = this.createMobSedan(false, true);
    car1.group.position.set(-3.5, 0, 0);
    car1.group.rotation.y = Math.PI * 0.25;
    this.canyonGroup.add(car1.group);

    // 7. Mob Boss's Black Vintage Getaway Sedan
    const car2 = this.createMobSedan(true, false);
    car2.group.position.set(3.5, 0, 0);
    car2.group.rotation.y = -Math.PI * 0.25;
    this.canyonGroup.add(car2.group);
    this.getawayCar = car2.group;
    this.getawayCarWheels = car2.wheels;

    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 10), this.matMobCarChrome);
    table.position.set(0, 0.75, 0);
    this.canyonGroup.add(table);

    const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.4), this.matBriefcase);
    briefcase.position.set(0, 0.86, 0);
    this.canyonGroup.add(briefcase);

    const glowPack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.28), this.matBriefcaseGlow);
    glowPack.position.set(0, 0.94, 0);
    this.canyonGroup.add(glowPack);
    this.contrabandGlow = glowPack;

    const victim = this.createMobster('victim');
    victim.person.position.set(-1.2, 0, 0);
    victim.person.rotation.y = Math.PI * 0.5;
    this.canyonGroup.add(victim.person);
    this.victimMesh = victim.person;
    this.victimArms = { left: victim.leftArmPivot, right: victim.rightArmPivot };
    this.victimHead = victim.head;

    const boss = this.createMobster('boss');
    boss.person.position.set(1.2, 0, 0.3);
    boss.person.rotation.y = -Math.PI * 0.5;
    this.canyonGroup.add(boss.person);
    this.bossMesh = boss.person;
    this.bossArms = { left: boss.leftArmPivot, right: boss.rightArmPivot };
    this.bossHead = boss.head;

    const enforcer = this.createMobster('enforcer');
    enforcer.person.position.set(2.0, 0, -0.4);
    enforcer.person.rotation.y = -Math.PI * 0.55;
    this.canyonGroup.add(enforcer.person);
    this.enforcerMesh = enforcer.person;
    this.enforcerArm = enforcer.rightArmPivot;
    this.enforcerArms = { left: enforcer.leftArmPivot, right: enforcer.rightArmPivot };
    this.enforcerHead = enforcer.head;

    this.muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.matMuzzleFlash);
    this.muzzleFlash.position.set(1.5, 1.35, -0.2);
    this.muzzleFlash.visible = false;
    this.canyonGroup.add(this.muzzleFlash);

    this.muzzleLight = new THREE.PointLight(0xff9900, 0.0, 18);
    this.muzzleLight.position.copy(this.muzzleFlash.position);
    this.canyonGroup.add(this.muzzleLight);

    this.gunsmoke = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.matGunsmoke);
    this.gunsmoke.position.copy(this.muzzleFlash.position);
    this.gunsmoke.visible = false;
    this.canyonGroup.add(this.gunsmoke);

    for (let i = 0; i < 8; i++) {
      const dust = new THREE.Mesh(new THREE.SphereGeometry(0.45 + i * 0.1, 6, 6), this.matDust);
      dust.visible = false;
      this.canyonGroup.add(dust);
      this.getawayDustPool.push(dust);
    }

    // Ambient desert wind particles drifting across the canyon wash
    for (let i = 0; i < 10; i++) {
      const breeze = new THREE.Mesh(new THREE.SphereGeometry(0.2 + (i % 3) * 0.08, 5, 5), this.matDust);
      breeze.position.set(-8.0 + (i * 2.2), 0.3 + (i % 4) * 0.4, -6.0 + (i * 1.8));
      this.canyonGroup.add(breeze);
      this.canyonBreezeParticles.push(breeze);
    }

    this.group.add(this.canyonGroup);
  }

  buildAllZoneClues() {
    ZONE_CLUES_CONFIG.forEach(cfg => {
      const clueGrp = new THREE.Group();
      clueGrp.position.copy(cfg.pos);
      clueGrp.name = `Clue_${cfg.key}`;

      if (cfg.zone === 0) {
        // Zone 0: Bullet Casings & Ledger at Arrowhead Canyon ground
        const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.45), this.matPaper);
        ledger.position.set(0, 0.02, 0.5);
        ledger.rotation.y = 0.3;
        clueGrp.add(ledger);

        const blood = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.01, 8), this.matBeaconRed);
        blood.position.set(-0.2, 0.005, 0.2);
        clueGrp.add(blood);
      } else if (cfg.zone === 1) {
        // Zone 1: Crashed Getaway Sedan
        const car = this.createMobSedan(true);
        car.group.rotation.y = 0.65;
        car.group.rotation.z = 0.12;
        clueGrp.add(car.group);

        const openDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 1.1), this.matMobCarBlack);
        openDoor.position.set(-1.45, 0.95, -0.2);
        openDoor.rotation.y = -0.75;
        clueGrp.add(openDoor);

        for (let i = 0; i < 5; i++) {
          const steam = new THREE.Mesh(new THREE.SphereGeometry(0.25 + i * 0.12, 6, 6), this.matSteam);
          steam.position.set(0.1 + (i % 2) * 0.15, 0.75 + i * 0.35, 2.4 + (i * 0.1));
          clueGrp.add(steam);
          this.clue1RadiatorSteam.push(steam);
        }
      } else if (cfg.zone === 2) {
        // Zone 2: Discarded Burner Phone & Wiretap Cassette (Bixby)
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), this.matPants);
        bench.position.set(0, 0.6, 0);
        clueGrp.add(bench);

        const phone = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.22), this.matMobCarBlack);
        phone.position.set(0.2, 0.69, 0);
        clueGrp.add(phone);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), this.matBeaconRed);
        led.position.set(0.2, 0.72, 0);
        clueGrp.add(led);
        this.beacons.push({ mesh: led, freq: 0.008 });
      } else if (cfg.zone === 3) {
        // Zone 3: Aluminum Flight Case & Passports (Carmel)
        const flightCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.45), this.matMobCarChrome);
        flightCase.position.set(0, 0.12, 0);
        clueGrp.add(flightCase);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), this.matBeaconAmber);
        led.position.set(0, 0.25, 0);
        clueGrp.add(led);
        this.beacons.push({ mesh: led, freq: 0.005 });
      } else if (cfg.zone === 4) {
        // Zone 4: Frequency Scanner & Transponder Box (Marin)
        const scannerBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.3), this.matHardcase);
        scannerBox.position.set(0, 0.2, 0);
        clueGrp.add(scannerBox);

        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.2, 6), this.matMobCarChrome);
        ant.position.set(0.18, 0.7, 0);
        clueGrp.add(ant);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), this.matBeaconBlue);
        led.position.set(-0.1, 0.4, 0.16);
        clueGrp.add(led);
        this.beacons.push({ mesh: led, freq: 0.01 });
      } else if (cfg.zone === 5) {
        // Zone 5: Cartel Flight Manifest (Mendocino)
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), this.matWoodCrate);
        table.position.set(0, 0.7, 0);
        clueGrp.add(table);

        const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.48), this.matHardcase);
        clipboard.position.set(0, 0.76, 0);
        clueGrp.add(clipboard);
      } else if (cfg.zone === 6) {
        // Zone 6: Contraband Drop Cargo Crates (Cannon Beach)
        const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), this.matWoodCrate);
        crate1.position.set(0, 0.45, 0);
        clueGrp.add(crate1);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), this.matBeaconGreen);
        led.position.set(0, 0.95, 0);
        clueGrp.add(led);
        this.beacons.push({ mesh: led, freq: 0.006 });
      } else if (cfg.zone === 7) {
        // Zone 7: Encrypted Satellite Transceiver (Columbia Gorge)
        const satBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), this.matBrass);
        satBox.position.set(0, 0.15, 0);
        clueGrp.add(satBox);

        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.02, 0.12, 10), this.matMobCarChrome);
        dish.rotation.x = 0.4;
        dish.position.set(0, 0.35, -0.1);
        clueGrp.add(dish);
      } else if (cfg.zone === 8) {
        // Zone 8: Hitman Sniper Rifle Hardcase & Hit List (Olympic)
        const rifleCase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.16, 0.42), this.matHardcase);
        rifleCase.position.set(0, 0.08, 0);
        clueGrp.add(rifleCase);

        const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), this.matBeaconRed);
        led.position.set(0.5, 0.18, 0);
        clueGrp.add(led);
        this.beacons.push({ mesh: led, freq: 0.012 });
      }

      if (!this.clueGroups) this.clueGroups = [];
      this.clueGroups.push({ group: clueGrp, z: cfg.pos.z });
      this.group.add(clueGrp);
    });
  }

  buildSheriffStations() {
    // 1. Malibu Sheriff Station (Z=5,050m)
    const malibuStation = new THREE.Group();
    malibuStation.position.set(38.8, 2.36, 5050.0);
    malibuStation.name = 'MalibuSheriffStation';
    this.malibuStation = malibuStation;

    const bldg1 = new THREE.Mesh(new THREE.BoxGeometry(22.0, 7.5, 14.0), this.matStationStucco);
    bldg1.position.set(0, 3.75, 0);
    malibuStation.add(bldg1);

    const sign1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.2, 0.2), this.matPoliceBlue);
    sign1.position.set(-4.0, 5.8, 8.8);
    malibuStation.add(sign1);

    this.group.add(malibuStation);

    // 2. Washington State Patrol & Federal Regional HQ (Z=22,800m)
    const fedStation = new THREE.Group();
    fedStation.position.set(38.0, 3.5, 22800.0);
    fedStation.name = 'WashingtonFederalHQ';
    this.fedStation = fedStation;

    const bldg2 = new THREE.Mesh(new THREE.BoxGeometry(28.0, 9.0, 16.0), this.matStationBrick);
    bldg2.position.set(0, 4.5, 0);
    fedStation.add(bldg2);

    const sign2 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.4, 0.2), this.matPoliceBlue);
    sign2.position.set(0, 7.2, 8.2);
    fedStation.add(sign2);

    const apron2 = new THREE.Mesh(new THREE.PlaneGeometry(18.0, 14.0), this.matHardcase);
    apron2.rotation.x = -Math.PI * 0.5;
    apron2.position.set(-18.0, 0.02, 0);
    fedStation.add(apron2);

    this.group.add(fedStation);
  }

  triggerCrimeScene() {
    if (this.isCinematicPlaying) return;
    const mission = gameState.mysteryMission;
    if (!mission || mission.state !== 'unstarted') return;

    this.isCinematicPlaying = true;
    this.cutsceneType = 'murder';
    this.cinematicPhase = 'ESTABLISHING';
    this.animTime = 0.0;
    this.getawayEscapeT = 0.0;

    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'murder';
    gameState.cutsceneDuration = 38.0;

    // Ensure canyon crime scene & all actors are fully visible and reset to initial poses
    if (this.canyonGroup) this.canyonGroup.visible = true;
    if (this.getawayCar) {
      this.getawayCar.visible = true;
      this.getawayCar.position.set(3.5, 0, 0);
      this.getawayCar.rotation.set(0, -Math.PI * 0.25, 0);
    }
    if (this.bossMesh) {
      this.bossMesh.visible = true;
      this.bossMesh.position.set(1.2, 0, 0.3);
      this.bossMesh.rotation.set(0, -Math.PI * 0.5, 0);
    }
    if (this.bossArms && this.bossArms.right) {
      this.bossArms.right.rotation.set(0, 0, 0);
    }
    if (this.enforcerMesh) {
      this.enforcerMesh.visible = true;
      this.enforcerMesh.position.set(2.0, 0, -0.4);
      this.enforcerMesh.rotation.set(0, -Math.PI * 0.55, 0);
    }
    if (this.enforcerArm) {
      this.enforcerArm.rotation.set(0, 0, 0);
    }
    if (this.victimMesh) {
      this.victimMesh.visible = true;
      this.victimMesh.position.set(-1.2, 0, 0);
      this.victimMesh.rotation.set(0, Math.PI * 0.5, 0);
    }
    if (this.victimArms) {
      if (this.victimArms.left) this.victimArms.left.rotation.set(0, 0, 0);
      if (this.victimArms.right) this.victimArms.right.rotation.set(0, 0, 0);
    }
    if (this.contrabandGlow) this.contrabandGlow.visible = true;
    if (this.muzzleFlash) this.muzzleFlash.visible = false;
    if (this.muzzleLight) this.muzzleLight.intensity = 0.0;
    if (this.gunsmoke) this.gunsmoke.visible = false;
    if (this.getawayDustPool) this.getawayDustPool.forEach(d => d.visible = false);

    if (typeof window !== 'undefined' && window.game && window.game.hud) {
      if (window.game.hud.closeTablet) window.game.hud.closeTablet();
      if (window.game.hud.closeBinocularView) window.game.hud.closeBinocularView();
      window.game.hud.showActionToast('🎬 WITNESSING CRIME SCENE', 'Surveilling clandestine Arrowhead Canyon transaction...', 3500);
    }
  }

  triggerPoliceTurnIn(stationName, pts) {
    if (this.isCinematicPlaying) return;
    this.isCinematicPlaying = true;
    this.cutsceneType = 'police_turnin';
    this.turninTimer = 0.0;

    gameState.isCutsceneActive = true;
    gameState.cutsceneName = 'police_turnin';
    gameState.cutsceneDuration = 11.0;

    if (typeof window !== 'undefined' && window.game) {
      if (window.game.hud && window.game.hud.closeTablet) window.game.hud.closeTablet();
      if (window.game.sound) {
        if (window.game.sound.playSheriffRadioReport) window.game.sound.playSheriffRadioReport();
        setTimeout(() => {
          if (window.game.sound.playMissionAccomplishedFanfare) {
            window.game.sound.playMissionAccomplishedFanfare();
          }
        }, 800);
      }
      if (window.game.hud) {
        window.game.hud.showActionToast('⭐ MISSION COMPLETE: CASE RESOLVED ⭐', `${stationName} &bull; REWARD: +${pts.toLocaleString()} PTS`, 7000);
      }
    }
  }

  skipCutscene() {
    if (!this.isCinematicPlaying) return;
    if (this.cutsceneType === 'murder') {
      this.animTime = 38.0;
      const mission = gameState.mysteryMission;
      if (mission && mission.state === 'unstarted') {
        mission.state = 'witnessed';
        mission.witnessedMurder = true;
        mission.witnessedTime = Date.now();
      }
      this.onCutsceneCompleted();
    } else {
      this.turninTimer = 11.0;
    }
    this.isCinematicPlaying = false;
    gameState.isCutsceneActive = false;
    if (this.getawayCar) this.getawayCar.visible = false;
    if (this.getawayDustPool) this.getawayDustPool.forEach(d => d.visible = false);
  }

  onCutsceneCompleted() {
    if (!gameState.downhillUnlocked) {
      gameState.downhillUnlocked = true;
    }
    if (!gameState.downhillAnnounced) {
      gameState.downhillAnnounced = true;
      if (typeof window !== 'undefined' && window.game) {
        if (window.game.sound) {
          if (window.game.sound.triggerPoliceRadio) window.game.sound.triggerPoliceRadio();
          setTimeout(() => {
            if (window.game.sound.playMissionAccomplishedFanfare) {
              window.game.sound.playMissionAccomplishedFanfare();
            }
          }, 500);
        }
        if (window.game.hud) {
          window.game.hud.showActionToast(
            '🏁 DOWNHILL ROUTE UNLOCKED!',
            'Take the Downhill Express Chute to Highway 1 — shift to HIGH gear!',
            7500
          );
        }
      }
    }
  }

  getCurrentCutsceneCam() {
    if (this.cutsceneType === 'murder') {
      const t = this.animTime;
      if (t < 7.5) {
        // Shot 1: Establishing Wide Canyon Panorama (Smooth cinematic crane glide over canyon wash)
        const p1 = t / 7.5;
        this.camPos.set(
          90.0 + Math.sin(p1 * 0.5) * 3.0,
          28.5 + p1 * 0.7,
          932.0 - p1 * 3.6
        );
        this.camLookAt.set(
          104.5 + Math.sin(p1 * 0.4) * 0.8,
          26.0 + Math.sin(p1 * 0.8) * 0.15,
          920.0
        );
        this.camFov = 56.0 - p1 * 2.0;
        if (t < 3.2) {
          gameState.cutsceneSubtitles = '[MOJAVE ARROWHEAD CANYON — 12:45 PM]';
        } else {
          gameState.cutsceneSubtitles = 'A clandestine syndicate transaction unfolds in the secluded desert wash...';
        }
      } else if (t < 16.5) {
        // Shot 2: Standoff Confrontation Medium-Wide (Tense slow dolly push-in & subtle breathing motion)
        const p2 = (t - 7.5) / 9.0;
        this.camPos.set(
          94.5 + p2 * 1.8,
          27.2 - p2 * 0.35 + Math.sin(t * 1.5) * 0.04,
          926.0 - p2 * 1.8
        );
        this.camLookAt.set(
          104.5,
          26.2 + Math.cos(t * 1.2) * 0.04,
          920.0
        );
        this.camFov = 52.0 - p2 * 1.5;
        if (t < 12.0) {
          gameState.cutsceneSubtitles = 'MOB BOSS: "The shipment was tracked, Marco. The feds have the highway corridor."';
        } else {
          gameState.cutsceneSubtitles = 'MOB BOSS: "Deal is dead. And loose ends get tied."';
        }
      } else if (t < 25.0) {
        // Shot 3: Escalation / Weapon Draw Angle (Dynamic low-angle tracking push-in as enforcer draws)
        const p3 = (t - 16.5) / 8.5;
        this.camPos.set(
          96.0 + p3 * 1.5,
          27.0 - p3 * 0.45 + Math.sin(t * 2.0) * 0.03,
          915.0 + p3 * 1.6
        );
        this.camLookAt.set(
          104.0 + p3 * 0.5,
          26.2,
          920.0
        );
        this.camFov = 52.0 - p3 * 2.0;
        if (t < 21.0) {
          gameState.cutsceneSubtitles = 'COURIER: "Wait, Boss! No! I swear I didn\'t talk! Give me 24 hours—!"';
        } else {
          gameState.cutsceneSubtitles = 'ENFORCER: "Boss gave you a week. Time\'s up."';
        }
      } else if (t < 30.5) {
        // Shot 4: Execution / Gunshot Dramatic Profile (Recoil kick shockwave impulse at gunshot)
        const p4 = (t - 25.0) / 5.5;
        const kickTime = Math.max(0.0, 0.45 - (t - 25.0));
        const kickY = kickTime * Math.sin(t * 40.0) * 0.25;
        const kickX = kickTime * Math.cos(t * 35.0) * 0.18;
        this.camPos.set(
          92.5 + p4 * 0.8 + kickX,
          27.2 + kickY,
          921.0 - p4 * 0.5
        );
        this.camLookAt.set(
          104.5,
          26.2 - p4 * 0.2,
          920.0
        );
        this.camFov = 52.0;
        gameState.cutsceneSubtitles = '*GUNSHOT CRACKS & ECHOES ACROSS THE CANYON*';
      } else {
        // Shot 5: Peel-Out High Tracking Overview (Dynamic chase tracking camera following escaping sedan)
        const p5 = (t - 30.5) / 7.5;
        const carX = this.getawayCar ? (this.getawayCar.position.x - 3.5) : 0;
        const carZ = this.getawayCar ? this.getawayCar.position.z : 0;
        this.camPos.set(
          88.0 + carX * 0.35,
          31.0 + Math.sin(p5 * 1.5) * 1.2,
          938.0 + carZ * 0.3
        );
        this.camLookAt.set(
          108.0 + carX * 0.9,
          26.0,
          914.0 + carZ * 0.9
        );
        this.camFov = 62.0;
        gameState.cutsceneSubtitles = '★ MISSION OPENED: HIGHWAY 1 MOB HIT ★ Search all 9 zones for physical evidence!';
      }
    } else {
      // Police station turn-in orbit (Generous wide orbit around precinct and apron)
      const p = (gameState.mysteryMission && gameState.mysteryMission.reportingStation === 'Washington')
        ? new THREE.Vector3(38.0, 3.5, 22800.0)
        : new THREE.Vector3(38.8, 2.36, 5050.0);
      const angle = this.turninTimer * 0.45;
      this.camPos.set(p.x + Math.sin(angle) * 32.0, p.y + 11.0, p.z + Math.cos(angle) * 32.0);
      this.camLookAt.copy(p).add(new THREE.Vector3(0, 3.5, 0));
      this.camFov = 58.0;
      if (this.turninTimer < 5.5) {
        gameState.cutsceneSubtitles = '★ EVIDENCE LOGGED: LAW ENFORCEMENT INVESTIGATION HEADQUARTERS ★';
      } else {
        gameState.cutsceneSubtitles = '★ CASE CLOSED: MOB SYNDICATE HIT RESOLVED • REWARD CLAIMED ★';
      }
    }

    return { pos: this.camPos, lookAt: this.camLookAt, fov: this.camFov };
  }

  update(dt) {
    // 0. Distance culling for clues, canyon murder scene, and distant police stations
    const playerZ = (typeof window !== 'undefined' && window.game && window.game.physics && window.game.physics.position)
      ? window.game.physics.position.z
      : ((typeof gameState !== 'undefined' && typeof gameState.playerZ === 'number')
        ? gameState.playerZ
        : ((typeof gameState !== 'undefined' && typeof gameState.distanceMeters === 'number') ? gameState.distanceMeters : 0));

    if (this.clueGroups) {
      this.clueGroups.forEach(c => {
        c.group.visible = Math.abs(c.z - playerZ) <= 1800;
      });
    }
    if (this.canyonGroup) {
      // Canyon scene is always visible during cutscenes, binocular overlook surveillance, or within 1800m of Arrowhead Canyon wash
      this.canyonGroup.visible = this.isCinematicPlaying ||
        Boolean(gameState.isCutsceneActive) ||
        Boolean(gameState.isBinocularView) ||
        (Math.abs(1050 - playerZ) <= 1800);
    }
    if (this.malibuStation) {
      this.malibuStation.visible = (this.isCinematicPlaying && this.cutsceneType === 'police_turnin') ||
        (Math.abs(5050 - playerZ) <= 1800);
    }
    if (this.fedStation) {
      this.fedStation.visible = (this.isCinematicPlaying && this.cutsceneType === 'police_turnin') ||
        (Math.abs(22800 - playerZ) <= 1800);
    }

    // 1. Strobe beacon lights
    const timeNow = Date.now();
    this.beacons.forEach(b => {
      if (b.mesh) {
        const pulse = 0.5 + 0.5 * Math.sin(timeNow * b.freq);
        b.mesh.scale.setScalar(0.9 + pulse * 0.35);
      }
    });

    // 2. Steam drift for clue 1
    if (this.clue1RadiatorSteam && this.clue1RadiatorSteam.length > 0) {
      const t = timeNow * 0.002;
      this.clue1RadiatorSteam.forEach((steam, idx) => {
        steam.position.y = 0.75 + ((t + idx * 0.4) % 1.2) * 0.8;
      });
    }

    // 3. Ambient desert wind particles drifting across the canyon wash
    if (this.canyonBreezeParticles && this.canyonBreezeParticles.length > 0) {
      const windSpeed = 1.4;
      this.canyonBreezeParticles.forEach((breeze, idx) => {
        breeze.position.x += dt * (windSpeed + (idx % 3) * 0.3);
        breeze.position.y += Math.sin(timeNow * 0.003 + idx) * 0.004;
        if (breeze.position.x > 18.0) {
          breeze.position.x = -16.0;
        }
      });
    }

    // 4. Briefcase contraband subtle blue pulse
    if (this.contrabandGlow && this.contrabandGlow.visible) {
      const glowScale = 0.95 + 0.08 * Math.sin(timeNow * 0.006);
      this.contrabandGlow.scale.set(glowScale, 1.0, glowScale);
    }

    // 5. Police turn-in cutscene update
    if (this.isCinematicPlaying && this.cutsceneType === 'police_turnin') {
      this.turninTimer += dt;
      if (this.turninTimer >= 11.0) {
        this.isCinematicPlaying = false;
        gameState.isCutsceneActive = false;
      }
      return;
    }

    // 6. Murder cutscene sequence update
    if (this.isCinematicPlaying && this.cutsceneType === 'murder') {
      this.animTime += dt;

      if (this.animTime < 7.5) {
        this.cinematicPhase = 'ESTABLISHING';
        // Subtle breathing & idle stance in the canyon
        if (this.bossMesh) {
          this.bossMesh.position.y = Math.sin(this.animTime * 2.5) * 0.02;
        }
        if (this.victimMesh) {
          this.victimMesh.position.y = Math.sin(this.animTime * 2.8 + 1.0) * 0.02;
          if (this.victimHead) {
            this.victimHead.rotation.y = Math.sin(this.animTime * 1.8) * 0.15;
          }
        }
        if (this.enforcerHead) {
          this.enforcerHead.rotation.y = Math.sin(this.animTime * 1.2) * 0.2;
        }
        if (this.getawayCar) {
          this.getawayCar.position.y = Math.sin(this.animTime * 32.0) * 0.004; // subtle engine idle
        }
      } else if (this.animTime < 16.5) {
        this.cinematicPhase = 'STANDOFF';
        const st = this.animTime - 7.5;
        // Mob Boss gestures accusingly
        if (this.bossMesh) {
          this.bossMesh.rotation.y = -Math.PI * 0.5 + Math.sin(this.animTime * 3.5) * 0.14;
          this.bossMesh.position.y = Math.sin(this.animTime * 2.5) * 0.02;
        }
        if (this.bossArms && this.bossArms.right) {
          this.bossArms.right.rotation.x = -0.55 + Math.sin(st * 2.8) * 0.25;
          this.bossArms.right.rotation.z = 0.2 + Math.cos(st * 2.2) * 0.15;
        }
        if (this.bossHead) {
          this.bossHead.rotation.x = Math.sin(st * 2.5) * 0.08;
          this.bossHead.rotation.y = Math.sin(st * 1.8) * 0.12;
        }
        // Courier trembles defensively
        if (this.victimMesh) {
          this.victimMesh.position.x = -1.2 - Math.min(0.35, st * 0.04);
          this.victimMesh.position.y = Math.sin(this.animTime * 3.0) * 0.02;
        }
        if (this.victimArms) {
          if (this.victimArms.left) {
            this.victimArms.left.rotation.x = -0.65 + Math.sin(this.animTime * 8.0) * 0.08;
            this.victimArms.left.rotation.z = -0.15;
          }
          if (this.victimArms.right) {
            this.victimArms.right.rotation.x = -0.7 + Math.cos(this.animTime * 7.5) * 0.08;
            this.victimArms.right.rotation.z = 0.15;
          }
        }
        if (this.victimHead) {
          this.victimHead.rotation.y = Math.sin(this.animTime * 5.5) * 0.25;
        }
        // Getaway car idling
        if (this.getawayCar) {
          this.getawayCar.position.y = Math.sin(this.animTime * 34.0) * 0.005;
        }
      } else if (this.animTime < 25.0) {
        this.cinematicPhase = 'DRAW';
        // Enforcer steps forward and aims pistol
        if (this.enforcerMesh) {
          this.enforcerMesh.position.x = THREE.MathUtils.lerp(this.enforcerMesh.position.x, 1.4, dt * 2.5);
          this.enforcerMesh.position.z = THREE.MathUtils.lerp(this.enforcerMesh.position.z, -0.2, dt * 2.5);
        }
        if (this.enforcerArm) {
          this.enforcerArm.rotation.x = THREE.MathUtils.lerp(this.enforcerArm.rotation.x, -Math.PI * 0.48, dt * 5.0);
        }
        if (this.enforcerHead) {
          this.enforcerHead.rotation.y = 0.15;
        }
        // Boss steps back slightly
        if (this.bossMesh) {
          this.bossMesh.position.x = THREE.MathUtils.lerp(this.bossMesh.position.x, 1.5, dt * 2.0);
        }
        if (this.bossArms && this.bossArms.right) {
          this.bossArms.right.rotation.x = THREE.MathUtils.lerp(this.bossArms.right.rotation.x, 0.0, dt * 3.0);
          this.bossArms.right.rotation.z = 0.0;
        }
        // Courier steps back in panic, arms raised pleading
        if (this.victimMesh) {
          this.victimMesh.position.x = THREE.MathUtils.lerp(this.victimMesh.position.x, -1.8, dt * 2.0);
          this.victimMesh.rotation.z = -0.12; // cower back
        }
        if (this.victimArms) {
          if (this.victimArms.left) {
            this.victimArms.left.rotation.x = THREE.MathUtils.lerp(this.victimArms.left.rotation.x, -1.2, dt * 4.0);
          }
          if (this.victimArms.right) {
            this.victimArms.right.rotation.x = THREE.MathUtils.lerp(this.victimArms.right.rotation.x, -1.25, dt * 4.0);
          }
        }
        if (this.victimHead) {
          this.victimHead.rotation.y = Math.sin(this.animTime * 9.0) * 0.28;
        }
        if (this.getawayCar) {
          this.getawayCar.position.y = Math.sin(this.animTime * 36.0) * 0.006;
        }
      } else if (this.animTime < 30.5) {
        if (this.cinematicPhase !== 'EXECUTION') {
          this.cinematicPhase = 'EXECUTION';
          if (typeof window !== 'undefined' && window.game && window.game.sound && window.game.sound.triggerGunshot) {
            window.game.sound.triggerGunshot();
          }
          if (this.muzzleFlash) this.muzzleFlash.visible = true;
          if (this.muzzleLight) this.muzzleLight.intensity = 4.5;
          if (this.gunsmoke) {
            this.gunsmoke.visible = true;
            this.gunsmoke.position.copy(this.muzzleFlash.position);
            this.gunsmoke.scale.set(1, 1, 1);
          }
        }

        // Weapon recoil kick
        const gunKick = Math.max(0.0, 1.0 - (this.animTime - 25.0) * 4.0);
        if (this.enforcerArm) {
          this.enforcerArm.rotation.x = -Math.PI * 0.48 - gunKick * 0.28;
        }

        if (this.animTime > 25.65) {
          if (this.muzzleFlash) this.muzzleFlash.visible = false;
          if (this.muzzleLight) this.muzzleLight.intensity = Math.max(0.0, this.muzzleLight.intensity - dt * 10.0);
        }

        if (this.gunsmoke && this.gunsmoke.visible) {
          this.gunsmoke.position.y += dt * 0.5;
          this.gunsmoke.position.x -= dt * 0.2;
          this.gunsmoke.scale.addScalar(dt * 0.8);
        }

        if (this.victimMesh) {
          this.victimMesh.rotation.z = Math.min(Math.PI * 0.5, this.victimMesh.rotation.z + dt * 3.5);
          this.victimMesh.rotation.y += dt * 0.6;
          this.victimMesh.position.y = Math.max(0.12, this.victimMesh.position.y - dt * 2.0);
        }
        if (this.victimArms) {
          if (this.victimArms.left) this.victimArms.left.rotation.x += dt * 2.0;
          if (this.victimArms.right) this.victimArms.right.rotation.x += dt * 2.0;
        }

        // Getaway car revving up
        if (this.getawayCar) {
          this.getawayCar.position.y = Math.sin(this.animTime * 48.0) * 0.009;
        }
      } else if (this.animTime < 38.0) {
        if (this.cinematicPhase !== 'PEELOUT') {
          this.cinematicPhase = 'PEELOUT';
          if (this.muzzleFlash) this.muzzleFlash.visible = false;
          if (this.muzzleLight) this.muzzleLight.intensity = 0.0;
          if (this.gunsmoke) this.gunsmoke.visible = false;

          if (typeof window !== 'undefined' && window.game && window.game.sound && window.game.sound.triggerTireScreech) {
            window.game.sound.triggerTireScreech(1.2);
          }

          if (this.bossMesh) this.bossMesh.visible = false;
          if (this.enforcerMesh) this.enforcerMesh.visible = false;
          if (this.contrabandGlow) this.contrabandGlow.visible = false;

          const mission = gameState.mysteryMission;
          if (mission && mission.state === 'unstarted') {
            mission.state = 'witnessed';
            mission.witnessedMurder = true;
            mission.witnessedTime = Date.now();
            if (typeof window !== 'undefined' && window.game && window.game.sound && window.game.sound.playClueDiscoveredChime) {
              window.game.sound.playClueDiscoveredChime();
            }
          }
        }

        this.getawayEscapeT += dt;
        const speed = Math.min(28.0, this.getawayEscapeT * 9.0);
        if (this.getawayCar) {
          this.getawayCar.rotation.y = -Math.PI * 0.75;
          // Torque squat and vibration on dirt
          this.getawayCar.rotation.x = -Math.min(0.06, speed * 0.003);
          this.getawayCar.position.y = Math.sin(this.animTime * 50.0) * 0.015;
          this.getawayCar.position.x -= speed * 0.25 * dt;
          this.getawayCar.position.z -= speed * 0.95 * dt;
        }

        // Rotate getaway car wheels rapidly
        if (this.getawayCarWheels && this.getawayCarWheels.length > 0) {
          const spinSpeed = speed * 3.5;
          this.getawayCarWheels.forEach(w => {
            w.rotation.x += spinSpeed * dt;
          });
        }

        // Trailing tire dust plumes behind getaway sedan
        if (this.getawayDustPool && this.getawayDustPool.length > 0 && this.getawayCar) {
          const carP = this.getawayCar.position;
          this.getawayDustPool.forEach((dust, idx) => {
            const age = (this.getawayEscapeT * 3.0 + idx * 0.38) % 1.6;
            dust.visible = true;
            dust.position.set(
              carP.x + Math.sin(idx * 1.5) * 0.9 + 0.9,
              0.18 + age * 0.75,
              carP.z + 1.2 + age * 2.2
            );
            const s = 0.4 + age * 1.8;
            dust.scale.set(s, s, s);
          });
        }
      } else {
        this.cinematicPhase = 'FINISHED';
        this.isCinematicPlaying = false;
        gameState.isCutsceneActive = false;
        if (this.getawayCar) this.getawayCar.visible = false;
        if (this.getawayDustPool) this.getawayDustPool.forEach(d => d.visible = false);
        this.onCutsceneCompleted();
      }
    }
  }
}

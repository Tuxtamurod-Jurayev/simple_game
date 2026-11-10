import * as THREE from 'three';
import { Unit } from '../../types/game';
import {
  getUSACamoTexture,
  getChinaArmorTexture,
  getGLAArmorTexture,
  getTreadTexture
} from '../materials/militaryTextures';
import { geoCache } from './geometryCache';

export interface Unit3DInstance {
  id: number;
  group: THREE.Group;
  chassis: THREE.Object3D;
  turret?: THREE.Object3D;
  barrels?: THREE.Object3D[];
  rotors?: THREE.Object3D[];
  treads?: THREE.Mesh[];
  shadowDisc?: THREE.Mesh;
  selectionRing: THREE.Mesh;
  targetRing?: THREE.Mesh;
  hpBarMesh: THREE.Mesh;
  hpFillMesh: THREE.Mesh;
  recoilProgress: number; // 0 to 1
  lastShotTime: number;
}

export class Unit3DManager {
  public scene: THREE.Scene;
  private unitInstances: Map<number, Unit3DInstance> = new Map();

  // Camouflage & Military PBR Materials
  private matUSAArmor: THREE.MeshStandardMaterial;
  private matChinaArmor: THREE.MeshStandardMaterial;
  private matGLAArmor: THREE.MeshStandardMaterial;
  private matEnemyArmor = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.5, roughness: 0.45 });
  private matTreads: THREE.MeshStandardMaterial;
  private matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.8, roughness: 0.25 });
  private matGunMetal = new THREE.MeshStandardMaterial({ color: 0x111312, metalness: 0.9, roughness: 0.2 });
  private matGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  private matSelectRing = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
  private matShadow = new THREE.MeshBasicMaterial({ color: 0x09090b, transparent: true, opacity: 0.45 });
  private matMissileRed = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
  private matAfterburner = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  // Shared HP Bar Materials
  private matHpBg = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
  private matHpGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false });
  private matHpYellow = new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false });
  private matHpRed = new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: false });

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.matUSAArmor = new THREE.MeshStandardMaterial({
      map: getUSACamoTexture(),
      metalness: 0.35,
      roughness: 0.55
    });

    this.matChinaArmor = new THREE.MeshStandardMaterial({
      map: getChinaArmorTexture(),
      metalness: 0.45,
      roughness: 0.5
    });

    this.matGLAArmor = new THREE.MeshStandardMaterial({
      map: getGLAArmorTexture(),
      metalness: 0.25,
      roughness: 0.65
    });

    this.matTreads = new THREE.MeshStandardMaterial({
      map: getTreadTexture(),
      roughness: 0.8,
      metalness: 0.3
    });
  }

  private getUnitMaterial(u: Unit): THREE.MeshStandardMaterial {
    if (u.team === 'enemy') return this.matEnemyArmor;
    if (u.faction === 'USA') return this.matUSAArmor;
    if (u.faction === 'China') return this.matChinaArmor;
    return this.matGLAArmor;
  }

  /**
   * Create procedural 3D model for a unit using shared cached geometries
   */
  public createUnitMesh(u: Unit): Unit3DInstance {
    const root = new THREE.Group();
    const chassis = new THREE.Group();
    root.add(chassis);

    let turret: THREE.Object3D | undefined;
    const barrels: THREE.Object3D[] = [];
    const rotors: THREE.Object3D[] = [];
    const treads: THREE.Mesh[] = [];
    let shadowDisc: THREE.Mesh | undefined;

    const unitMat = this.getUnitMaterial(u);

    // 1. Selection Decal Ring (Ground)
    const selectionRing = new THREE.Mesh(
      geoCache.getRing(u.radius * 0.12, u.radius * 0.16, 24),
      this.matSelectRing
    );
    selectionRing.position.y = 0.08;
    selectionRing.visible = false;
    root.add(selectionRing);

    // 2. Specific 3D Geometry by Unit Type
    if (u.type === 'USA_Raptor' || u.type === 'China_MiG') {
      // Reaktiv Qiruvchi Samolyot (Stealth Jet Fighter)
      const fuselage = new THREE.Mesh(geoCache.getCone(0.9, 5.2, 8, 'z'), unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      // Swept Delta Wings
      const wings = new THREE.Mesh(geoCache.getBox(5.2, 0.08, 2.4), unitMat);
      wings.position.set(0, 0, -0.2);
      wings.castShadow = true;
      chassis.add(wings);

      // Twin Angled Tail Stabilizers
      const tailL = new THREE.Mesh(geoCache.getBox(0.08, 1.2, 1.1), unitMat);
      tailL.rotation.z = -Math.PI / 7;
      tailL.position.set(-0.7, 0.65, -1.9);
      const tailR = new THREE.Mesh(geoCache.getBox(0.08, 1.2, 1.1), unitMat);
      tailR.rotation.z = Math.PI / 7;
      tailR.position.set(0.7, 0.65, -1.9);
      chassis.add(tailL);
      chassis.add(tailR);

      // Tinted Canopy Glass
      const cockpit = new THREE.Mesh(geoCache.getSphere(0.44, 8, 6), this.matGlass);
      cockpit.scale.set(0.75, 0.65, 2.0);
      cockpit.position.set(0, 0.38, 0.85);
      chassis.add(cockpit);

      // Afterburner Nozzles
      for (const ex of [-0.35, 0.35]) {
        const exhaust = new THREE.Mesh(geoCache.getCylinder(0.22, 0.25, 0.5, 6, 'z'), this.matGunMetal);
        exhaust.position.set(ex, 0, -2.5);
        chassis.add(exhaust);

        const flame = new THREE.Mesh(geoCache.getCone(0.18, 0.6, 6, 'z'), this.matAfterburner);
        flame.rotation.x = -Math.PI; // Point backwards
        flame.position.set(ex, 0, -2.8);
        chassis.add(flame);
      }

      // Air-to-Ground Missiles under wings
      for (const wx of [-1.9, 1.9]) {
        const m = new THREE.Mesh(geoCache.getCylinder(0.09, 0.09, 1.6, 6, 'z'), this.matMissileRed);
        m.position.set(wx, -0.16, 0);
        chassis.add(m);
      }

      shadowDisc = new THREE.Mesh(geoCache.getCircle(2.4, 16), this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'USA_Comanche' || u.type === 'China_Helix') {
      // Hujumkor Jangovar Vertolyot (Attack Chopper)
      const fuselage = new THREE.Mesh(geoCache.getBox(1.5, 1.6, 4.4), unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      const boom = new THREE.Mesh(geoCache.getCylinder(0.28, 0.42, 3.4, 6, 'z'), unitMat);
      boom.position.set(0, 0.22, -3.4);
      chassis.add(boom);

      // Main Rotor
      const rotor = new THREE.Mesh(geoCache.getBox(6.2, 0.06, 0.38), this.matDarkSteel);
      rotor.position.set(0, 1.15, 0.2);
      chassis.add(rotor);
      rotors.push(rotor);

      if (u.type === 'China_Helix') {
        const rotor2 = new THREE.Mesh(geoCache.getBox(6.2, 0.06, 0.38), this.matDarkSteel);
        rotor2.position.set(0, 1.45, 0.2);
        chassis.add(rotor2);
        rotors.push(rotor2);
      }

      // Chin Gatling Turret
      const chinGun = new THREE.Mesh(geoCache.getCylinder(0.09, 0.12, 1.4, 6, 'z'), this.matGunMetal);
      chinGun.position.set(0, -0.65, 2.1);
      chassis.add(chinGun);
      turret = chinGun;
      barrels.push(chinGun);

      // Stub wings with rocket pods
      for (const sx of [-1.3, 1.3]) {
        const pod = new THREE.Mesh(geoCache.getCylinder(0.32, 0.32, 1.4, 6, 'z'), this.matGunMetal);
        pod.position.set(sx, -0.22, 0.3);
        chassis.add(pod);
      }

      shadowDisc = new THREE.Mesh(geoCache.getCircle(2.5, 16), this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'SupplyChinook') {
      // Twin-Rotor Supply Chinook (Transport Helicopter)
      const fuselage = new THREE.Mesh(geoCache.getBox(1.9, 1.7, 4.8), unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      const frontRotor = new THREE.Mesh(geoCache.getBox(5.6, 0.06, 0.38), this.matDarkSteel);
      frontRotor.position.set(0, 1.3, 1.6);
      const rearRotor = new THREE.Mesh(geoCache.getBox(5.6, 0.06, 0.38), this.matDarkSteel);
      rearRotor.position.set(0, 1.5, -1.6);
      chassis.add(frontRotor);
      chassis.add(rearRotor);
      rotors.push(frontRotor, rearRotor);

      shadowDisc = new THREE.Mesh(geoCache.getCircle(2.8, 16), this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'Overlord') {
      // Ulkan 4-Gusenitsali Overlord Supertank
      const body = new THREE.Mesh(geoCache.getBox(3.8, 1.3, 4.6), unitMat);
      body.position.y = 1.1;
      body.castShadow = true;
      body.receiveShadow = true;
      chassis.add(body);

      // 4 Heavy Tracks with Treads Material
      const tPositions = [
        [-1.65, 0.6, -1.15],
        [-1.65, 0.6, 1.15],
        [1.65, 0.6, -1.15],
        [1.65, 0.6, 1.15]
      ];
      for (const [tx, ty, tz] of tPositions) {
        const tr = new THREE.Mesh(geoCache.getBox(0.75, 0.95, 2.2), this.matTreads);
        tr.position.set(tx, ty, tz);
        tr.castShadow = true;
        chassis.add(tr);
        treads.push(tr);
      }

      // Massive Heavy Turret
      turret = new THREE.Mesh(geoCache.getCylinder(1.5, 1.7, 1.0, 10), unitMat);
      turret.position.set(0, 2.05, -0.2);
      turret.castShadow = true;
      chassis.add(turret);

      // Slotted Muzzle Brakes on Twin Cannons
      const b1 = new THREE.Mesh(geoCache.getCylinder(0.2, 0.24, 3.6, 6, 'z'), this.matGunMetal);
      b1.position.set(-0.6, 0.12, 2.3);
      const b2 = new THREE.Mesh(geoCache.getCylinder(0.2, 0.24, 3.6, 6, 'z'), this.matGunMetal);
      b2.position.set(0.6, 0.12, 2.3);

      const mb1 = new THREE.Mesh(geoCache.getBox(0.55, 0.45, 0.6), this.matDarkSteel);
      mb1.position.set(-0.6, 0.12, 4.0);
      const mb2 = new THREE.Mesh(geoCache.getBox(0.55, 0.45, 0.6), this.matDarkSteel);
      mb2.position.set(0.6, 0.12, 4.0);

      turret.add(b1);
      turret.add(b2);
      turret.add(mb1);
      turret.add(mb2);
      barrels.push(b1, b2);

      // Gatling Cupola on top
      const cupola = new THREE.Mesh(geoCache.getCylinder(0.4, 0.5, 0.5, 8), this.matGunMetal);
      cupola.position.set(0.7, 0.7, -0.3);
      turret.add(cupola);

    } else if (u.type === 'GLA_RocketBuggy') {
      // Raketa Baggi (GLA Rocket Buggy)
      const bFrame = new THREE.Mesh(geoCache.getBox(1.7, 0.65, 2.8), unitMat);
      bFrame.position.y = 0.65;
      chassis.add(bFrame);

      // 4 Wheels
      for (const [wx, wy, wz] of [[-1.0, 0.5, -0.95], [-1.0, 0.5, 0.95], [1.0, 0.5, -0.95], [1.0, 0.5, 0.95]]) {
        const wh = new THREE.Mesh(geoCache.getCylinder(0.48, 0.48, 0.42, 8, 'x'), this.matDarkSteel);
        wh.position.set(wx, wy, wz);
        chassis.add(wh);
      }

      turret = new THREE.Group();
      turret.position.set(0, 1.3, -0.3);
      const rack = new THREE.Mesh(geoCache.getBox(1.3, 0.85, 1.5), this.matGunMetal);
      rack.rotation.x = -Math.PI / 7;
      turret.add(rack);
      chassis.add(turret);
      barrels.push(rack);

    } else if (
      u.type.includes('Tank') ||
      u.type === 'Crusader' ||
      u.type === 'Paladin' ||
      u.type === 'Battlemaster' ||
      u.type === 'Scorpion' ||
      u.type === 'Marauder'
    ) {
      // Asosiy Jangovar Tank (Crusader, Battlemaster, Paladin)
      const body = new THREE.Mesh(geoCache.getBox(2.3, 0.85, 3.3), unitMat);
      body.position.y = 0.78;
      body.castShadow = true;
      chassis.add(body);

      // Twin Caterpillar Tracks with Tread Material
      const leftTrack = new THREE.Mesh(geoCache.getBox(0.58, 0.75, 3.5), this.matTreads);
      leftTrack.position.set(-1.05, 0.48, 0);
      const rightTrack = new THREE.Mesh(geoCache.getBox(0.58, 0.75, 3.5), this.matTreads);
      rightTrack.position.set(1.05, 0.48, 0);
      chassis.add(leftTrack);
      chassis.add(rightTrack);
      treads.push(leftTrack, rightTrack);

      // Turret
      turret = new THREE.Mesh(geoCache.getCylinder(0.9, 1.05, 0.7, 8), unitMat);
      turret.position.set(0, 1.45, -0.15);
      turret.castShadow = true;
      chassis.add(turret);

      if (u.type === 'GattlingTank') {
        const gCluster = new THREE.Group();
        gCluster.position.set(0, 0.12, 1.7);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const bm = new THREE.Mesh(geoCache.getCylinder(0.065, 0.065, 2.5, 6, 'z'), this.matGunMetal);
          bm.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0);
          gCluster.add(bm);
        }
        turret.add(gCluster);
        barrels.push(gCluster);
      } else {
        const barrel = new THREE.Mesh(geoCache.getCylinder(0.13, 0.17, 2.8, 6, 'z'), this.matGunMetal);
        barrel.position.set(0, 0.09, 1.9);
        barrel.castShadow = true;

        const mb = new THREE.Mesh(geoCache.getBox(0.38, 0.32, 0.5), this.matDarkSteel);
        mb.position.set(0, 0.09, 3.3);
        turret.add(barrel);
        turret.add(mb);
        barrels.push(barrel);
      }

      if (u.type === 'Paladin') {
        // Point Defense Laser Emitter Dome
        const pdl = new THREE.Mesh(geoCache.getSphere(0.28, 8, 6), this.matGlass);
        pdl.position.set(0.7, 0.5, -0.35);
        turret.add(pdl);
      } else if (u.type === 'Crusader') {
        // Commander cupola & high-tech antenna
        const cupola = new THREE.Mesh(geoCache.getCylinder(0.28, 0.32, 0.25, 6), this.matDarkSteel);
        cupola.position.set(-0.45, 0.45, -0.2);
        const antenna = new THREE.Mesh(geoCache.getCylinder(0.02, 0.03, 1.4, 6), this.matGunMetal);
        antenna.position.set(-0.55, 1.15, -0.3);
        turret.add(cupola);
        turret.add(antenna);
      } else if (u.type === 'Battlemaster') {
        // Iconic Rear Auxiliary Fuel Barrels (Soviet / Chinese design)
        for (const fx of [-0.6, 0.6]) {
          const barrel = new THREE.Mesh(geoCache.getCylinder(0.24, 0.24, 0.7, 6, 'x'), this.matGunMetal);
          barrel.position.set(fx, 0.75, -1.65);
          chassis.add(barrel);
        }
      }

    } else if (u.type === 'Humvee' || u.type === 'Technical' || u.type.includes('SupplyTruck') || u.type.includes('Worker')) {
      // Yengil G'ildirakli Mashina / Pikap / Ishchi mashinasi
      const body = new THREE.Mesh(geoCache.getBox(1.85, 0.85, 2.7), unitMat);
      body.position.y = 0.72;
      body.castShadow = true;
      chassis.add(body);

      const wPos = [[-0.98, 0.42, -0.85], [-0.98, 0.42, 0.85], [0.98, 0.42, -0.85], [0.98, 0.42, 0.85]];
      for (const [wx, wy, wz] of wPos) {
        const wheel = new THREE.Mesh(geoCache.getCylinder(0.42, 0.42, 0.38, 8, 'x'), this.matDarkSteel);
        wheel.position.set(wx, wy, wz);
        chassis.add(wheel);
      }

      turret = new THREE.Mesh(geoCache.getCylinder(0.08, 0.11, 1.5, 6, 'z'), this.matGunMetal);
      turret.position.set(0, 1.38, 0.2);
      chassis.add(turret);
      barrels.push(turret);

    } else {
      // Piyoda Askar (Ranger / Red Guard / Rebel)
      const soldier = new THREE.Group();
      const body = new THREE.Mesh(geoCache.getCylinder(0.26, 0.22, 0.85, 6), unitMat);
      body.position.y = 0.65;
      soldier.add(body);

      const head = new THREE.Mesh(geoCache.getSphere(0.24, 6, 6), this.matGunMetal);
      head.position.y = 1.2;
      soldier.add(head);

      const rifle = new THREE.Mesh(geoCache.getBox(0.09, 0.14, 0.95), this.matGunMetal);
      rifle.position.set(0.24, 0.8, 0.38);
      soldier.add(rifle);
      chassis.add(soldier);
      turret = soldier;
    }

    // 3. Floating 3D Health Bar Billboard
    const hpBarMesh = new THREE.Mesh(geoCache.getPlane(1.9, 0.26), this.matHpBg);
    hpBarMesh.position.set(0, u.isFlying ? 3.6 : 2.6, 0);
    hpBarMesh.renderOrder = 25;

    const hpFillMesh = new THREE.Mesh(geoCache.getPlane(1.85, 0.2), this.matHpGreen);
    hpFillMesh.position.set(0, 0, 0.02);
    hpBarMesh.add(hpFillMesh);
    root.add(hpBarMesh);

    root.position.set(u.x * 0.1, u.isFlying ? 18 : 0, u.y * 0.1);
    this.scene.add(root);

    const inst: Unit3DInstance = {
      id: u.id,
      group: root,
      chassis,
      turret,
      barrels,
      rotors,
      treads,
      shadowDisc,
      selectionRing,
      hpBarMesh,
      hpFillMesh,
      recoilProgress: 0,
      lastShotTime: u.lastShot
    };

    this.unitInstances.set(u.id, inst);
    return inst;
  }

  /**
   * Update all active unit transforms, turret rotations, rotor animations, recoil, and HP
   */
  public update(units: Unit[], camera: THREE.Camera, isSelected: (id: number) => boolean, delta: number): void {
    const currentIds = new Set(units.map(u => u.id));

    // Remove deleted units
    for (const [id, inst] of this.unitInstances.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(inst.group);
        this.unitInstances.delete(id);
      }
    }

    // Update active units
    for (const u of units) {
      let inst = this.unitInstances.get(u.id);
      if (!inst) {
        inst = this.createUnitMesh(u);
      }

      // Position & Altitude
      const targetY = u.isFlying ? 17.5 : 0;
      inst.group.position.set(u.x * 0.1, targetY, u.y * 0.1);

      // Keep shadow on ground for flying aircraft
      if (inst.shadowDisc) {
        inst.shadowDisc.position.set(0, -targetY + 0.08, 0);
      }

      // Chassis Rotation
      inst.chassis.rotation.y = -u.bodyAngle + Math.PI / 2;

      // Turret Rotation (independent aiming)
      if (inst.turret && !u.isFlying) {
        const targetWorldAngle = -u.turretAngle + Math.PI / 2;
        inst.turret.rotation.y = targetWorldAngle - inst.chassis.rotation.y;
      }

      // Rotor Blades Animation
      if (inst.rotors && inst.rotors.length > 0) {
        for (const rotor of inst.rotors) {
          rotor.rotation.y += delta * 52;
        }
      }

      // Cannon Recoil Animation
      if (u.lastShot !== inst.lastShotTime) {
        inst.lastShotTime = u.lastShot;
        inst.recoilProgress = 1.0;
      }

      if (inst.recoilProgress > 0 && inst.barrels) {
        inst.recoilProgress = Math.max(0, inst.recoilProgress - delta * 6.5);
        const recoilOffset = -0.55 * Math.sin(inst.recoilProgress * Math.PI);
        for (const b of inst.barrels) {
          b.position.z = 1.9 + recoilOffset;
        }
      }

      // Selection Ring
      inst.selectionRing.visible = isSelected(u.id);

      // HP Bar
      const hpPercent = Math.max(0, u.hp / u.maxHp);
      inst.hpFillMesh.scale.x = hpPercent;
      inst.hpFillMesh.position.x = -(1 - hpPercent) * 0.925;

      if (hpPercent > 0.55) {
        inst.hpFillMesh.material = this.matHpGreen;
      } else if (hpPercent > 0.25) {
        inst.hpFillMesh.material = this.matHpYellow;
      } else {
        inst.hpFillMesh.material = this.matHpRed;
      }

      inst.hpBarMesh.quaternion.copy(camera.quaternion);
    }
  }

  public dispose(): void {
    for (const inst of this.unitInstances.values()) {
      this.scene.remove(inst.group);
    }
    this.unitInstances.clear();
  }
}

import * as THREE from 'three';
import { Unit, Faction } from '../../types/game';
import {
  getUSACamoTexture,
  getChinaArmorTexture,
  getGLAArmorTexture,
  getTreadTexture
} from '../materials/militaryTextures';

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
   * Create procedural 3D model for a unit
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
    const ringGeo = new THREE.RingGeometry(u.radius * 0.12, u.radius * 0.16, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const selectionRing = new THREE.Mesh(ringGeo, this.matSelectRing);
    selectionRing.position.y = 0.08;
    selectionRing.visible = false;
    root.add(selectionRing);

    // 2. Specific 3D Geometry by Unit Type
    if (u.type === 'USA_Raptor' || u.type === 'China_MiG') {
      // Reaktiv Qiruvchi Samolyot (Stealth Jet Fighter)
      // Slender faceted fuselage
      const fuseGeo = new THREE.ConeGeometry(0.9, 5.2, 8);
      fuseGeo.rotateX(Math.PI / 2);
      const fuselage = new THREE.Mesh(fuseGeo, unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      // Swept Delta Wings
      const wingGeo = new THREE.BoxGeometry(5.2, 0.08, 2.4);
      const wings = new THREE.Mesh(wingGeo, unitMat);
      wings.position.set(0, 0, -0.2);
      wings.castShadow = true;
      chassis.add(wings);

      // Twin Angled Tail Stabilizers
      const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 1.1), unitMat);
      tailL.rotation.z = -Math.PI / 7;
      tailL.position.set(-0.7, 0.65, -1.9);
      const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 1.1), unitMat);
      tailR.rotation.z = Math.PI / 7;
      tailR.position.set(0.7, 0.65, -1.9);
      chassis.add(tailL);
      chassis.add(tailR);

      // Tinted Canopy Glass
      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), this.matGlass);
      cockpit.scale.set(0.75, 0.65, 2.0);
      cockpit.position.set(0, 0.38, 0.85);
      chassis.add(cockpit);

      // Afterburner Nozzles
      for (const ex of [-0.35, 0.35]) {
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 8), this.matGunMetal);
        exhaust.rotateX(Math.PI / 2);
        exhaust.position.set(ex, 0, -2.5);
        chassis.add(exhaust);

        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 6), this.matAfterburner);
        flame.rotateX(-Math.PI / 2);
        flame.position.set(ex, 0, -2.8);
        chassis.add(flame);
      }

      // Air-to-Ground Missiles under wings
      for (const wx of [-1.9, 1.9]) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6), this.matMissileRed);
        m.rotateX(Math.PI / 2);
        m.position.set(wx, -0.16, 0);
        chassis.add(m);
      }

      const shadowGeo = new THREE.CircleGeometry(2.4, 16);
      shadowGeo.rotateX(-Math.PI / 2);
      shadowDisc = new THREE.Mesh(shadowGeo, this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'USA_Comanche' || u.type === 'China_Helix') {
      // Hujumkor Jangovar Vertolyot (Attack Chopper)
      const fusGeo = new THREE.BoxGeometry(1.5, 1.6, 4.4);
      const fuselage = new THREE.Mesh(fusGeo, unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 3.4, 6), unitMat);
      boom.rotateX(Math.PI / 2);
      boom.position.set(0, 0.22, -3.4);
      chassis.add(boom);

      // 5-Blade Main Rotor
      const rotorGeo = new THREE.BoxGeometry(6.2, 0.06, 0.38);
      const rotor = new THREE.Mesh(rotorGeo, this.matDarkSteel);
      rotor.position.set(0, 1.15, 0.2);
      chassis.add(rotor);
      rotors.push(rotor);

      if (u.type === 'China_Helix') {
        const rotor2 = new THREE.Mesh(rotorGeo, this.matDarkSteel);
        rotor2.position.set(0, 1.45, 0.2);
        chassis.add(rotor2);
        rotors.push(rotor2);
      }

      // Chin 20mm Gatling Turret
      const chinGun = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.4, 6), this.matGunMetal);
      chinGun.rotateX(Math.PI / 2);
      chinGun.position.set(0, -0.65, 2.1);
      chassis.add(chinGun);
      turret = chinGun;
      barrels.push(chinGun);

      // Stub wings with Hellfire rocket pods
      for (const sx of [-1.3, 1.3]) {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 8), this.matGunMetal);
        pod.rotateX(Math.PI / 2);
        pod.position.set(sx, -0.22, 0.3);
        chassis.add(pod);
      }

      const shadowGeo = new THREE.CircleGeometry(2.5, 16);
      shadowGeo.rotateX(-Math.PI / 2);
      shadowDisc = new THREE.Mesh(shadowGeo, this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'SupplyChinook') {
      // Twin-Rotor Supply Chinook (Transport Helicopter)
      const fusGeo = new THREE.BoxGeometry(1.9, 1.7, 4.8);
      const fuselage = new THREE.Mesh(fusGeo, unitMat);
      fuselage.castShadow = true;
      chassis.add(fuselage);

      const rotorGeo = new THREE.BoxGeometry(5.6, 0.06, 0.38);
      const frontRotor = new THREE.Mesh(rotorGeo, this.matDarkSteel);
      frontRotor.position.set(0, 1.3, 1.6);
      const rearRotor = new THREE.Mesh(rotorGeo, this.matDarkSteel);
      rearRotor.position.set(0, 1.5, -1.6);
      chassis.add(frontRotor);
      chassis.add(rearRotor);
      rotors.push(frontRotor, rearRotor);

      const shadowGeo = new THREE.CircleGeometry(2.8, 16);
      shadowGeo.rotateX(-Math.PI / 2);
      shadowDisc = new THREE.Mesh(shadowGeo, this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'Overlord') {
      // Ulkan 4-Gusenitsali Overlord Supertank
      const bodyGeo = new THREE.BoxGeometry(3.8, 1.3, 4.6);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 1.1;
      body.castShadow = true;
      body.receiveShadow = true;
      chassis.add(body);

      // 4 Heavy Tracks with Treads Material
      const trackGeo = new THREE.BoxGeometry(0.75, 0.95, 2.2);
      const tPositions = [
        [-1.65, 0.6, -1.15],
        [-1.65, 0.6, 1.15],
        [1.65, 0.6, -1.15],
        [1.65, 0.6, 1.15]
      ];
      for (const [tx, ty, tz] of tPositions) {
        const tr = new THREE.Mesh(trackGeo, this.matTreads);
        tr.position.set(tx, ty, tz);
        tr.castShadow = true;
        chassis.add(tr);
        treads.push(tr);
      }

      // Massive Heavy Turret
      const turretGeo = new THREE.CylinderGeometry(1.5, 1.7, 1.0, 12);
      turret = new THREE.Mesh(turretGeo, unitMat);
      turret.position.set(0, 2.05, -0.2);
      turret.castShadow = true;
      chassis.add(turret);

      // Slotted Muzzle Brakes on Twin Cannons
      const bGeo = new THREE.CylinderGeometry(0.2, 0.24, 3.6, 8);
      bGeo.rotateX(Math.PI / 2);
      const b1 = new THREE.Mesh(bGeo, this.matGunMetal);
      b1.position.set(-0.6, 0.12, 2.3);
      const b2 = new THREE.Mesh(bGeo, this.matGunMetal);
      b2.position.set(0.6, 0.12, 2.3);

      // Muzzle brakes
      const mb1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.6), this.matDarkSteel);
      mb1.position.set(-0.6, 0.12, 4.0);
      const mb2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.6), this.matDarkSteel);
      mb2.position.set(0.6, 0.12, 4.0);

      turret.add(b1);
      turret.add(b2);
      turret.add(mb1);
      turret.add(mb2);
      barrels.push(b1, b2);

      // Gatling Cupola on top
      const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8), this.matGunMetal);
      cupola.position.set(0.7, 0.7, -0.3);
      turret.add(cupola);

    } else if (u.type === 'GLA_RocketBuggy') {
      // Raketa Baggi (GLA Rocket Buggy)
      const bFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.8), unitMat);
      bFrame.position.y = 0.65;
      chassis.add(bFrame);

      // 4 Wheels
      for (const [wx, wy, wz] of [[-1.0, 0.5, -0.95], [-1.0, 0.5, 0.95], [1.0, 0.5, -0.95], [1.0, 0.5, 0.95]]) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.42, 10), this.matDarkSteel);
        wh.rotateZ(Math.PI / 2);
        wh.position.set(wx, wy, wz);
        chassis.add(wh);
      }

      turret = new THREE.Group();
      turret.position.set(0, 1.3, -0.3);
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 1.5), this.matGunMetal);
      rack.rotation.x = -Math.PI / 7;
      turret.add(rack);
      chassis.add(turret);
      barrels.push(rack);

    } else if (u.type.includes('Tank') || u.type === 'Crusader' || u.type === 'Paladin' || u.type === 'Battlemaster' || u.type === 'Scorpion' || u.type === 'Marauder') {
      // Asosiy Jangovar Tank (Crusader, Battlemaster, Paladin)
      const bodyGeo = new THREE.BoxGeometry(2.3, 0.85, 3.3);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 0.78;
      body.castShadow = true;
      chassis.add(body);

      // Twin Caterpillar Tracks with Tread Material
      const trackGeo = new THREE.BoxGeometry(0.58, 0.75, 3.5);
      const leftTrack = new THREE.Mesh(trackGeo, this.matTreads);
      leftTrack.position.set(-1.05, 0.48, 0);
      const rightTrack = new THREE.Mesh(trackGeo, this.matTreads);
      rightTrack.position.set(1.05, 0.48, 0);
      chassis.add(leftTrack);
      chassis.add(rightTrack);
      treads.push(leftTrack, rightTrack);

      // Turret
      const turretGeo = new THREE.CylinderGeometry(0.9, 1.05, 0.7, 10);
      turret = new THREE.Mesh(turretGeo, unitMat);
      turret.position.set(0, 1.45, -0.15);
      turret.castShadow = true;
      chassis.add(turret);

      if (u.type === 'GattlingTank') {
        const gCluster = new THREE.Group();
        gCluster.position.set(0, 0.12, 1.7);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const bg = new THREE.CylinderGeometry(0.065, 0.065, 2.5, 6);
          bg.rotateX(Math.PI / 2);
          const bm = new THREE.Mesh(bg, this.matGunMetal);
          bm.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0);
          gCluster.add(bm);
        }
        turret.add(gCluster);
        barrels.push(gCluster);
      } else {
        const bGeo = new THREE.CylinderGeometry(0.13, 0.17, 2.8, 8);
        bGeo.rotateX(Math.PI / 2);
        const barrel = new THREE.Mesh(bGeo, this.matGunMetal);
        barrel.position.set(0, 0.09, 1.9);
        barrel.castShadow = true;

        // Slotted Muzzle brake on end
        const mb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.5), this.matDarkSteel);
        mb.position.set(0, 0.09, 3.3);
        turret.add(barrel);
        turret.add(mb);
        barrels.push(barrel);
      }

      if (u.type === 'Paladin') {
        // Point Defense Laser Emitter Dome
        const pdlGeo = new THREE.SphereGeometry(0.28, 8, 8);
        const pdl = new THREE.Mesh(pdlGeo, this.matGlass);
        pdl.position.set(0.7, 0.5, -0.35);
        turret.add(pdl);
      }

    } else if (u.type === 'Humvee' || u.type === 'Technical' || u.type.includes('SupplyTruck') || u.type.includes('Worker')) {
      // Yengil G'ildirakli Mashina / Pikap / Ishchi mashinasi
      const bodyGeo = new THREE.BoxGeometry(1.85, 0.85, 2.7);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 0.72;
      body.castShadow = true;
      chassis.add(body);

      const wPos = [[-0.98, 0.42, -0.85], [-0.98, 0.42, 0.85], [0.98, 0.42, -0.85], [0.98, 0.42, 0.85]];
      for (const [wx, wy, wz] of wPos) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.38, 12), this.matDarkSteel);
        wheel.rotateZ(Math.PI / 2);
        wheel.position.set(wx, wy, wz);
        chassis.add(wheel);
      }

      const gunGeo = new THREE.CylinderGeometry(0.08, 0.11, 1.5, 6);
      gunGeo.rotateX(Math.PI / 2);
      turret = new THREE.Mesh(gunGeo, this.matGunMetal);
      turret.position.set(0, 1.38, 0.2);
      chassis.add(turret);
      barrels.push(turret);

    } else {
      // Piyoda Askar (Ranger / Red Guard / Rebel)
      const soldier = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.85, 6), unitMat);
      body.position.y = 0.65;
      soldier.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.matGunMetal);
      head.position.y = 1.2;
      soldier.add(head);

      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.95), this.matGunMetal);
      rifle.position.set(0.24, 0.8, 0.38);
      soldier.add(rifle);
      chassis.add(soldier);
      turret = soldier;
    }

    // 3. Floating 3D Health Bar Billboard
    const hpBarGeo = new THREE.PlaneGeometry(1.9, 0.26);
    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
    const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
    hpBarMesh.position.set(0, u.isFlying ? 3.6 : 2.6, 0);
    hpBarMesh.renderOrder = 25;

    const hpFillGeo = new THREE.PlaneGeometry(1.85, 0.2);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false });
    const hpFillMesh = new THREE.Mesh(hpFillGeo, hpFillMat);
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

      const fillMat = inst.hpFillMesh.material as THREE.MeshBasicMaterial;
      if (hpPercent > 0.55) fillMat.color.setHex(0x22c55e);
      else if (hpPercent > 0.25) fillMat.color.setHex(0xf59e0b);
      else fillMat.color.setHex(0xef4444);

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

import * as THREE from 'three';
import { Unit, Faction } from '../../types/game';

export interface Unit3DInstance {
  id: number;
  group: THREE.Group;
  chassis: THREE.Object3D;
  turret?: THREE.Object3D;
  barrels?: THREE.Object3D[];
  rotors?: THREE.Object3D[];
  shadowDisc?: THREE.Mesh;
  selectionRing: THREE.Mesh;
  hpBarMesh: THREE.Mesh;
  hpFillMesh: THREE.Mesh;
  recoilProgress: number; // 0 to 1
  lastShotTime: number;
}

export class Unit3DManager {
  public scene: THREE.Scene;
  private unitInstances: Map<number, Unit3DInstance> = new Map();

  // Shared Materials
  private matUSAArmor = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.45, roughness: 0.4 });
  private matChinaArmor = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.5, roughness: 0.45 });
  private matGLAArmor = new THREE.MeshStandardMaterial({ color: 0x166534, metalness: 0.3, roughness: 0.6 });
  private matEnemyArmor = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.4, roughness: 0.5 });
  private matTreads = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.2 });
  private matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7, roughness: 0.3 });
  private matGunMetal = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.75, roughness: 0.25 });
  private matGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  private matSelectRing = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
  private matShadow = new THREE.MeshBasicMaterial({ color: 0x09090b, transparent: true, opacity: 0.45 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
    let shadowDisc: THREE.Mesh | undefined;

    const unitMat = this.getUnitMaterial(u);

    // 1. Selection Ring (Ground decal)
    const ringGeo = new THREE.RingGeometry(u.radius * 0.12, u.radius * 0.15, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const selectionRing = new THREE.Mesh(ringGeo, this.matSelectRing);
    selectionRing.position.y = 0.08;
    selectionRing.visible = false;
    root.add(selectionRing);

    // 2. Specific 3D Geometry by Unit Type
    if (u.type === 'Overlord') {
      // Massive 4-Track Heavy Monster Tank
      const bodyGeo = new THREE.BoxGeometry(3.6, 1.2, 4.4);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 1.0;
      body.castShadow = true;
      body.receiveShadow = true;
      chassis.add(body);

      // 4 Heavy Tracks
      const trackGeo = new THREE.BoxGeometry(0.7, 0.9, 2.1);
      const tPositions = [
        [-1.6, 0.55, -1.1],
        [-1.6, 0.55, 1.1],
        [1.6, 0.55, -1.1],
        [1.6, 0.55, 1.1]
      ];
      for (const [tx, ty, tz] of tPositions) {
        const tr = new THREE.Mesh(trackGeo, this.matTreads);
        tr.position.set(tx, ty, tz);
        tr.castShadow = true;
        chassis.add(tr);
      }

      // Giant Turret
      const turretGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.9, 10);
      turret = new THREE.Mesh(turretGeo, unitMat);
      turret.position.set(0, 1.9, -0.2);
      turret.castShadow = true;
      chassis.add(turret);

      // Twin Cannons
      const bGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8);
      bGeo.rotateX(Math.PI / 2);
      const b1 = new THREE.Mesh(bGeo, this.matGunMetal);
      b1.position.set(-0.55, 0.1, 2.1);
      const b2 = new THREE.Mesh(bGeo, this.matGunMetal);
      b2.position.set(0.55, 0.1, 2.1);
      turret.add(b1);
      turret.add(b2);
      barrels.push(b1, b2);

    } else if (u.type.includes('Tank') || u.type === 'Crusader' || u.type === 'Paladin' || u.type === 'Battlemaster' || u.type === 'Scorpion' || u.type === 'Marauder') {
      // Standard Battle Tank
      const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 3.2);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 0.75;
      body.castShadow = true;
      chassis.add(body);

      // Twin Tracks
      const trackGeo = new THREE.BoxGeometry(0.55, 0.7, 3.4);
      const leftTrack = new THREE.Mesh(trackGeo, this.matTreads);
      leftTrack.position.set(-1.0, 0.45, 0);
      const rightTrack = new THREE.Mesh(trackGeo, this.matTreads);
      rightTrack.position.set(1.0, 0.45, 0);
      chassis.add(leftTrack);
      chassis.add(rightTrack);

      // Turret
      const turretGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.65, 8);
      turret = new THREE.Mesh(turretGeo, unitMat);
      turret.position.set(0, 1.4, -0.15);
      turret.castShadow = true;
      chassis.add(turret);

      if (u.type === 'GattlingTank') {
        // Spinning 6-Barrel Gatling cluster
        const gCluster = new THREE.Group();
        gCluster.position.set(0, 0.1, 1.6);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const bg = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6);
          bg.rotateX(Math.PI / 2);
          const bm = new THREE.Mesh(bg, this.matGunMetal);
          bm.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
          gCluster.add(bm);
        }
        turret.add(gCluster);
        barrels.push(gCluster);
      } else {
        // Single heavy cannon
        const bGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.6, 8);
        bGeo.rotateX(Math.PI / 2);
        const barrel = new THREE.Mesh(bGeo, this.matGunMetal);
        barrel.position.set(0, 0.08, 1.8);
        barrel.castShadow = true;
        turret.add(barrel);
        barrels.push(barrel);
      }

      if (u.type === 'Paladin') {
        // Point Defense Laser Emitter
        const pdlGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const pdl = new THREE.Mesh(pdlGeo, this.matGlass);
        pdl.position.set(0.65, 0.45, -0.3);
        turret.add(pdl);
      }

    } else if (u.isFlying || u.type === 'SupplyChinook') {
      // Twin-Rotor Supply Chinook Helicopter
      const fusGeo = new THREE.BoxGeometry(1.8, 1.6, 4.6);
      const fuselage = new THREE.Mesh(fusGeo, unitMat);
      fuselage.position.y = 0;
      fuselage.castShadow = true;
      chassis.add(fuselage);

      // Cockpit nose
      const noseGeo = new THREE.ConeGeometry(0.9, 1.2, 4);
      noseGeo.rotateX(Math.PI / 2);
      const nose = new THREE.Mesh(noseGeo, this.matGlass);
      nose.position.set(0, -0.1, 2.6);
      chassis.add(nose);

      // Front & Rear Rotors
      const rotorGeo = new THREE.BoxGeometry(5.2, 0.05, 0.35);
      const frontRotor = new THREE.Mesh(rotorGeo, this.matDarkMetal);
      frontRotor.position.set(0, 1.2, 1.5);
      const rearRotor = new THREE.Mesh(rotorGeo, this.matDarkMetal);
      rearRotor.position.set(0, 1.4, -1.5);
      chassis.add(frontRotor);
      chassis.add(rearRotor);
      rotors.push(frontRotor, rearRotor);

      // Dynamic Ground Shadow Disc
      const shadowGeo = new THREE.CircleGeometry(2.4, 16);
      shadowGeo.rotateX(-Math.PI / 2);
      shadowDisc = new THREE.Mesh(shadowGeo, this.matShadow);
      shadowDisc.position.y = 0.06;
      root.add(shadowDisc);

    } else if (u.type === 'Humvee' || u.type === 'Technical' || u.type.includes('SupplyTruck') || u.type.includes('Worker')) {
      // Wheeled Combat Vehicle / Truck
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 2.6);
      const body = new THREE.Mesh(bodyGeo, unitMat);
      body.position.y = 0.7;
      body.castShadow = true;
      chassis.add(body);

      // 4 Off-road wheels
      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 10);
      wheelGeo.rotateZ(Math.PI / 2);
      const wPos = [[-0.95, 0.4, -0.8], [-0.95, 0.4, 0.8], [0.95, 0.4, -0.8], [0.95, 0.4, 0.8]];
      for (const [wx, wy, wz] of wPos) {
        const wheel = new THREE.Mesh(wheelGeo, this.matTreads);
        wheel.position.set(wx, wy, wz);
        chassis.add(wheel);
      }

      // Roof Mounted Gun / Rack
      const gunGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6);
      gunGeo.rotateX(Math.PI / 2);
      turret = new THREE.Mesh(gunGeo, this.matGunMetal);
      turret.position.set(0, 1.35, 0.2);
      chassis.add(turret);
      barrels.push(turret);

    } else {
      // Infantry Soldier (Low-Poly Soldier)
      const soldier = new THREE.Group();
      // Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.8, 6), unitMat);
      body.position.y = 0.6;
      soldier.add(body);
      // Helmet
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.matGunMetal);
      head.position.y = 1.15;
      soldier.add(head);
      // Rifle
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.9), this.matGunMetal);
      rifle.position.set(0.22, 0.75, 0.35);
      soldier.add(rifle);
      chassis.add(soldier);
      turret = soldier;
    }

    // 3. Floating 3D Health Bar Billboard
    const hpBarGeo = new THREE.PlaneGeometry(1.8, 0.25);
    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
    const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
    hpBarMesh.position.set(0, u.isFlying ? 3.5 : 2.5, 0);
    hpBarMesh.renderOrder = 25;

    const hpFillGeo = new THREE.PlaneGeometry(1.75, 0.2);
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

      // 1. Position & Flight Altitude
      const targetY = u.isFlying ? 16.5 : 0;
      inst.group.position.set(u.x * 0.1, targetY, u.y * 0.1);

      // Keep shadow on ground for flying units
      if (inst.shadowDisc) {
        inst.shadowDisc.position.set(0, -targetY + 0.08, 0);
      }

      // 2. Chassis Rotation (facing movement direction)
      // bodyAngle in radians (0 is right/east)
      inst.chassis.rotation.y = -u.bodyAngle + Math.PI / 2;

      // 3. Turret Rotation (independent aiming)
      if (inst.turret && !u.isFlying) {
        // Offset relative to chassis orientation
        const targetWorldAngle = -u.turretAngle + Math.PI / 2;
        inst.turret.rotation.y = targetWorldAngle - inst.chassis.rotation.y;
      }

      // 4. Rotor Blade Animation (60 revs/sec)
      if (inst.rotors && inst.rotors.length > 0) {
        for (const rotor of inst.rotors) {
          rotor.rotation.y += delta * 45;
        }
      }

      // 5. Cannon Recoil Animation
      if (u.lastShot !== inst.lastShotTime) {
        inst.lastShotTime = u.lastShot;
        inst.recoilProgress = 1.0;
      }

      if (inst.recoilProgress > 0 && inst.barrels) {
        inst.recoilProgress = Math.max(0, inst.recoilProgress - delta * 6.0);
        const recoilOffset = -0.5 * Math.sin(inst.recoilProgress * Math.PI);
        for (const b of inst.barrels) {
          b.position.z = 1.8 + recoilOffset;
        }
      }

      // 6. Selection Ring State
      inst.selectionRing.visible = isSelected(u.id);

      // 7. HP Bar update
      const hpPercent = Math.max(0, u.hp / u.maxHp);
      inst.hpFillMesh.scale.x = hpPercent;
      inst.hpFillMesh.position.x = -(1 - hpPercent) * 0.875;

      const fillMat = inst.hpFillMesh.material as THREE.MeshBasicMaterial;
      if (hpPercent > 0.55) fillMat.color.setHex(0x22c55e);
      else if (hpPercent > 0.25) fillMat.color.setHex(0xf59e0b);
      else fillMat.color.setHex(0xef4444);

      // Face camera
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

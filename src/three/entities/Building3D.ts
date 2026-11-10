import * as THREE from 'three';
import { Building, BuildingTypeId, Faction } from '../../types/game';

export interface Building3DInstance {
  id: number;
  group: THREE.Group;
  scaffoldGroup: THREE.Group;
  solidGroup: THREE.Group;
  radarDish?: THREE.Object3D;
  turret?: THREE.Object3D;
  hpBarMesh: THREE.Mesh;
  hpFillMesh: THREE.Mesh;
}

export class Building3DManager {
  public scene: THREE.Scene;
  private buildingInstances: Map<number, Building3DInstance> = new Map();

  // Shared Materials
  private matUSAArmor = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.45, roughness: 0.4 });
  private matChinaArmor = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.45, roughness: 0.45 });
  private matGLAArmor = new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.3, roughness: 0.6 });
  private matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7, roughness: 0.3 });
  private matGunMetal = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });
  private matConcrete = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.85 });
  private matTarmac = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 });
  private matScaffold = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  private matGlowBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  private matGlowGreen = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  private matGlowRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  private matSandbags = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.95 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getFactionMaterial(faction: Faction): THREE.MeshStandardMaterial {
    if (faction === 'USA') return this.matUSAArmor;
    if (faction === 'China') return this.matChinaArmor;
    return this.matGLAArmor;
  }

  /**
   * Create procedural 3D model for a building based on its category & type
   */
  public createBuildingMesh(b: Building): Building3DInstance {
    const root = new THREE.Group();
    const solidGroup = new THREE.Group();
    const scaffoldGroup = new THREE.Group();
    let radarDish: THREE.Object3D | undefined;
    let turret: THREE.Object3D | undefined;

    const factionMat = this.getFactionMaterial(b.faction);

    // Dimensions in 3D scale (world 2400x1600 -> 240x160 units)
    const w = b.width * 0.1;
    const d = b.height * 0.1;
    const h = 4.5;

    // 1. Concrete Foundation Slab
    const slabGeo = new THREE.BoxGeometry(w * 1.05, 0.4, d * 1.05);
    const slab = new THREE.Mesh(slabGeo, this.matConcrete);
    slab.position.y = 0.2;
    slab.receiveShadow = true;
    solidGroup.add(slab);

    // 2. Specific Architecture by Type
    if (b.type.includes('HQ')) {
      // Bosh Qarorgoh (Command Center)
      const bunkerGeo = new THREE.CylinderGeometry(w * 0.42, w * 0.48, h, 8);
      const bunker = new THREE.Mesh(bunkerGeo, factionMat);
      bunker.position.y = h / 2 + 0.4;
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      solidGroup.add(bunker);

      // Helipad roof with 'H' markings
      const helipadGeo = new THREE.CylinderGeometry(w * 0.38, w * 0.38, 0.3, 16);
      const helipad = new THREE.Mesh(helipadGeo, this.matDarkMetal);
      helipad.position.y = h + 0.55;
      helipad.receiveShadow = true;
      solidGroup.add(helipad);

      // Rotating Radar Array Tower
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.0, 6), this.matDarkMetal);
      tower.position.set(-w * 0.22, h + 1.4, -d * 0.22);
      solidGroup.add(tower);

      const dishGeo = new THREE.CylinderGeometry(1.5, 0.2, 0.4, 8, 1, false, 0, Math.PI);
      radarDish = new THREE.Mesh(dishGeo, this.matDarkMetal);
      radarDish.rotation.x = Math.PI / 4;
      radarDish.position.set(-w * 0.22, h + 2.5, -d * 0.22);
      solidGroup.add(radarDish);

    } else if (b.type.includes('WarFactory')) {
      // Mashina Zavodi (Harbiy Zavod - Tanklar va texnikalar)
      const hangarGeo = new THREE.BoxGeometry(w * 0.88, h * 0.9, d * 0.85);
      const hangar = new THREE.Mesh(hangarGeo, factionMat);
      hangar.position.y = (h * 0.9) / 2 + 0.4;
      hangar.castShadow = true;
      hangar.receiveShadow = true;
      solidGroup.add(hangar);

      // Rooftop smokestacks with exhaust vents
      const stackGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 6);
      const stack1 = new THREE.Mesh(stackGeo, this.matGunMetal);
      stack1.position.set(w * 0.28, h + 0.8, -d * 0.25);
      const stack2 = stack1.clone();
      stack2.position.set(w * 0.28, h + 0.8, d * 0.25);
      solidGroup.add(stack1);
      solidGroup.add(stack2);

      // Open Heavy Blast Door at the front
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, h * 0.7, 0.5), this.matDarkMetal);
      doorFrame.position.set(0, (h * 0.7) / 2 + 0.4, d * 0.43);
      solidGroup.add(doorFrame);

    } else if (b.type.includes('Airfield')) {
      // Harbiy Aerodrom (Samolyot va Vertolyotlar bazasi)
      // Runway tarmac strip
      const runway = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.2, d * 0.55), this.matTarmac);
      runway.position.set(0, 0.45, 0);
      runway.receiveShadow = true;
      solidGroup.add(runway);

      // Control Tower
      const cTower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 5.5, 6), factionMat);
      cTower.position.set(-w * 0.35, 3.1, -d * 0.35);
      cTower.castShadow = true;
      solidGroup.add(cTower);

      // Glass Observation Room
      const obsRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 1.2, 8), this.matGlowBlue);
      obsRoom.position.set(-w * 0.35, 6.2, -d * 0.35);
      solidGroup.add(obsRoom);

      // Rotating aerodrome radar
      radarDish = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.4), this.matDarkMetal);
      radarDish.position.set(-w * 0.35, 7.2, -d * 0.35);
      solidGroup.add(radarDish);

      // Aircraft Hangar on side
      const aHangar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.5, 8, 1, false, 0, Math.PI), factionMat);
      aHangar.rotation.z = Math.PI / 2;
      aHangar.position.set(w * 0.25, 1.8, -d * 0.2);
      solidGroup.add(aHangar);

    } else if (b.type.includes('Supply') || b.type.includes('Depot') || b.type.includes('Stash')) {
      // Pul To'plovchi Resurs Ombori (Supply Depot / Stash)
      const depotBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 2.8, d * 0.8), factionMat);
      depotBase.position.y = 1.6;
      depotBase.castShadow = true;
      solidGroup.add(depotBase);

      // Cargo Container Stacks
      const cColors = [0x1e3a8a, 0xb91c1c, 0x15803d, 0x854d0e];
      for (let i = 0; i < 4; i++) {
        const cMat = new THREE.MeshStandardMaterial({ color: cColors[i % 4], roughness: 0.6 });
        const container = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 1.6), cMat);
        const cx = (i % 2 === 0 ? -1 : 1) * 2.2;
        const cz = (i < 2 ? -1 : 1) * 1.8;
        container.position.set(cx, 3.6 + (i > 1 ? 1.4 : 0), cz);
        container.castShadow = true;
        solidGroup.add(container);
      }

      // Cargo Crane
      const craneTower = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 4.5, 4), this.matGunMetal);
      craneTower.position.set(w * 0.35, 3.8, d * 0.3);
      const craneArm = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 0.4), this.matGunMetal);
      craneArm.position.set(w * 0.35 - 1.5, 5.8, d * 0.3);
      solidGroup.add(craneTower);
      solidGroup.add(craneArm);

    } else if (b.type.includes('Patriot') || b.type.includes('GatlingCannon') || b.type.includes('Stinger')) {
      // Himoya Qurollari (Defense Turrets)
      if (b.type.includes('Patriot')) {
        // USA Patriot Missile Launcher Tower
        const pBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 2.2, 8), factionMat);
        pBase.position.y = 1.3;
        solidGroup.add(pBase);

        // Rotating missile platform
        turret = new THREE.Group();
        turret.position.set(0, 2.5, 0);

        // 4 Angled Missile Tubes
        const rackGeo = new THREE.BoxGeometry(1.6, 1.2, 2.8);
        const rack = new THREE.Mesh(rackGeo, this.matDarkMetal);
        rack.rotation.x = -Math.PI / 6; // Angled skyward
        rack.position.set(0, 0.8, 0);
        turret.add(rack);

        // 4 Missile tips
        for (let mx = -0.4; mx <= 0.4; mx += 0.8) {
          for (let my = 0.4; my <= 1.0; my += 0.6) {
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 6), this.matGlowRed);
            tip.rotation.x = Math.PI / 3;
            tip.position.set(mx, my, 1.3);
            turret.add(tip);
          }
        }
        solidGroup.add(turret);

      } else if (b.type.includes('GatlingCannon')) {
        // China Gatling Defense Tower
        const gBase = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 3.0, 8), factionMat);
        gBase.position.y = 1.7;
        solidGroup.add(gBase);

        turret = new THREE.Group();
        turret.position.set(0, 3.3, 0);

        // 4 Barrel Gatling Cluster
        const cupola = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), this.matDarkMetal);
        turret.add(cupola);

        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const bg = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6);
          bg.rotateX(Math.PI / 2);
          const bm = new THREE.Mesh(bg, this.matGunMetal);
          bm.position.set(Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, 1.6);
          turret.add(bm);
        }
        solidGroup.add(turret);

      } else {
        // GLA Stinger Site Bunker
        const sBunker = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 1.6, 8), this.matSandbags);
        sBunker.position.y = 0.9;
        solidGroup.add(sBunker);

        // Camouflage netting
        const net = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.2, 6), this.matGLAArmor);
        net.position.y = 2.0;
        solidGroup.add(net);

        // RPG Rocket tube sticking out
        turret = new THREE.Group();
        turret.position.set(0, 1.4, 0);
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 6), this.matGunMetal);
        tube.rotateX(Math.PI / 2);
        tube.position.set(0, 0, 1.2);
        turret.add(tube);
        solidGroup.add(turret);
      }

    } else if (b.type.includes('Barracks')) {
      // Kazarma (Piyodalar bazasi)
      const barGeo = new THREE.BoxGeometry(w * 0.85, h * 0.75, d * 0.8);
      const barracks = new THREE.Mesh(barGeo, factionMat);
      barracks.position.y = (h * 0.75) / 2 + 0.4;
      barracks.castShadow = true;
      barracks.receiveShadow = true;
      solidGroup.add(barracks);

      // Angled corrugated roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.55, 1.2, 4), this.matDarkMetal);
      roof.position.y = h * 0.75 + 1.0;
      roof.rotation.y = Math.PI / 4;
      solidGroup.add(roof);

    } else if (b.type.includes('Reactor')) {
      // Elektr Energiya Reaktori
      const coreGeo = new THREE.CylinderGeometry(w * 0.32, w * 0.4, h * 0.95, 12);
      const core = new THREE.Mesh(coreGeo, factionMat);
      core.position.y = (h * 0.95) / 2 + 0.4;
      core.castShadow = true;
      solidGroup.add(core);

      // Glowing power coils
      const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.36, 0.25, 8, 16), b.faction === 'USA' ? this.matGlowBlue : this.matGlowGreen);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h * 0.65;
      solidGroup.add(ring);

    } else {
      // Superqurollar (Zarracha to'pi, Yadro shaxtasi, Scud bo'roni)
      const swBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, h * 0.6, d * 0.9), factionMat);
      swBase.position.y = (h * 0.6) / 2 + 0.4;
      swBase.castShadow = true;
      solidGroup.add(swBase);

      if (b.type.includes('ParticleCannon')) {
        const pTower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 4.0, 8), this.matGunMetal);
        pTower.position.y = h + 1.2;
        const pDish = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 0.5, 1.0, 16), this.matGlowBlue);
        pDish.position.y = h + 3.4;
        solidGroup.add(pTower);
        solidGroup.add(pDish);
      } else if (b.type.includes('NukeSilo')) {
        const siloRing = new THREE.Mesh(new THREE.TorusGeometry(w * 0.28, 0.5, 8, 16), this.matGunMetal);
        siloRing.rotation.x = Math.PI / 2;
        siloRing.position.y = h * 0.6 + 0.4;
        const missile = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.0, 8), this.matGlowRed);
        missile.position.y = h * 0.6 + 2.0;
        solidGroup.add(siloRing);
        solidGroup.add(missile);
      } else {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 1.6), this.matGunMetal);
        rack.rotation.z = Math.PI / 6;
        rack.position.set(0, h * 0.6 + 2.0, 0);
        solidGroup.add(rack);
      }
    }

    // 3. Scaffolding Cage (EdgesGeometry wireframe construction box)
    const cageGeo = new THREE.BoxGeometry(w * 1.04, h * 1.1, d * 1.04);
    const edges = new THREE.EdgesGeometry(cageGeo);
    const cageLines = new THREE.LineSegments(edges, this.matScaffold);
    cageLines.position.y = (h * 1.1) / 2 + 0.2;
    scaffoldGroup.add(cageLines);

    root.add(solidGroup);
    root.add(scaffoldGroup);

    // 4. Floating 3D Health Bar Billboard
    const hpBarGeo = new THREE.PlaneGeometry(w * 0.8, 0.45);
    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
    const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
    hpBarMesh.position.set(0, h + 3.6, 0);
    hpBarMesh.renderOrder = 20;

    const hpFillGeo = new THREE.PlaneGeometry(w * 0.78, 0.35);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false });
    const hpFillMesh = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFillMesh.position.set(0, 0, 0.02);
    hpBarMesh.add(hpFillMesh);
    root.add(hpBarMesh);

    root.position.set(b.x * 0.1, 0, b.y * 0.1);
    this.scene.add(root);

    const instance: Building3DInstance = {
      id: b.id,
      group: root,
      scaffoldGroup,
      solidGroup,
      radarDish,
      turret,
      hpBarMesh,
      hpFillMesh
    };

    this.buildingInstances.set(b.id, instance);
    return instance;
  }

  /**
   * Update building transforms, scaffolding construction animation, and health bars
   */
  public update(buildings: Building[], camera: THREE.Camera, delta: number): void {
    const currentIds = new Set(buildings.map(b => b.id));

    // Remove deleted / destroyed buildings
    for (const [id, inst] of this.buildingInstances.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(inst.group);
        this.buildingInstances.delete(id);
      }
    }

    // Update or create active buildings
    for (const b of buildings) {
      let inst = this.buildingInstances.get(b.id);
      if (!inst) {
        inst = this.createBuildingMesh(b);
      }

      inst.group.position.set(b.x * 0.1, 0, b.y * 0.1);

      // Scaffolding Construction Animation
      if (b.buildProgress < 100) {
        const progress = Math.max(0.02, b.buildProgress / 100);
        inst.solidGroup.scale.set(1, progress, 1);
        inst.scaffoldGroup.visible = true;
      } else {
        inst.solidGroup.scale.set(1, 1, 1);
        inst.scaffoldGroup.visible = false;
      }

      // Rotate radar dish if present
      if (inst.radarDish) {
        inst.radarDish.rotation.y += delta * 2.2;
      }

      // If defense turret, slowly scan
      if (inst.turret) {
        inst.turret.rotation.y += delta * 0.5;
      }

      // Update Health Bar
      const hpPercent = Math.max(0, b.hp / b.maxHp);
      inst.hpFillMesh.scale.x = hpPercent;
      inst.hpFillMesh.position.x = -(1 - hpPercent) * (b.width * 0.1 * 0.78 * 0.5);

      const fillMat = inst.hpFillMesh.material as THREE.MeshBasicMaterial;
      if (hpPercent > 0.6) fillMat.color.setHex(0x22c55e);
      else if (hpPercent > 0.3) fillMat.color.setHex(0xf59e0b);
      else fillMat.color.setHex(0xef4444);

      inst.hpBarMesh.quaternion.copy(camera.quaternion);
    }
  }

  public dispose(): void {
    for (const inst of this.buildingInstances.values()) {
      this.scene.remove(inst.group);
    }
    this.buildingInstances.clear();
  }
}

import * as THREE from 'three';
import { Building, Faction } from '../../types/game';
import {
  getUSACamoTexture,
  getChinaArmorTexture,
  getGLAArmorTexture,
  getRunwayTexture,
  getConcreteTexture
} from '../materials/militaryTextures';
import { geoCache } from './geometryCache';

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

  // Procedural Camo & PBR Materials (Metallic Armor, Metal Parts & Glow)
  private matUSAArmor: THREE.MeshStandardMaterial;
  private matChinaArmor: THREE.MeshStandardMaterial;
  private matGLAArmor: THREE.MeshStandardMaterial;
  private matConcrete: THREE.MeshStandardMaterial;
  private matRunway: THREE.MeshStandardMaterial;
  private matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.92 });
  private matGunMetal = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.95 });
  private matScaffold = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  private matGlowBlue = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5, roughness: 0.1 });
  private matGlowGreen = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 1.5, roughness: 0.1 });
  private matGlowRed = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.5, roughness: 0.1 });
  private matSandbags = new THREE.MeshStandardMaterial({ color: 0x928169, roughness: 0.95 });

  // Shared Supply Container Materials
  private matContainerColors = [
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4, metalness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, metalness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.4, metalness: 0.75 })
  ];

  // Shared HP Bar Materials
  private matHpBg = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
  private matHpGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false });
  private matHpYellow = new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false });
  private matHpRed = new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: false });

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Metallic Armor: roughness: 0.35, metalness: 0.85
    this.matUSAArmor = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      map: getUSACamoTexture(),
      roughness: 0.35,
      metalness: 0.85
    });

    this.matChinaArmor = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      map: getChinaArmorTexture(),
      roughness: 0.35,
      metalness: 0.85
    });

    this.matGLAArmor = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      map: getGLAArmorTexture(),
      roughness: 0.45,
      metalness: 0.80
    });

    this.matConcrete = new THREE.MeshStandardMaterial({
      map: getConcreteTexture(),
      roughness: 0.88,
      metalness: 0.1
    });

    this.matRunway = new THREE.MeshStandardMaterial({
      map: getRunwayTexture(),
      roughness: 0.9,
      metalness: 0.15
    });
  }

  public getFactionMaterial(faction: Faction): THREE.MeshStandardMaterial {
    if (faction === 'USA') return this.matUSAArmor;
    if (faction === 'China') return this.matChinaArmor;
    return this.matGLAArmor;
  }

  /**
   * Create procedural 3D model for a building using cached geometries
   */
  public createBuildingMesh(b: Building): Building3DInstance {
    const root = new THREE.Group();
    const solidGroup = new THREE.Group();
    const scaffoldGroup = new THREE.Group();
    let radarDish: THREE.Object3D | undefined;
    let turret: THREE.Object3D | undefined;

    const factionMat = this.getFactionMaterial(b.faction);

    const w = b.width * 0.1;
    const d = b.height * 0.1;
    const h = 4.8;

    // 1. Reinforced Concrete Foundation Slab with Riveted Edges
    const slab = new THREE.Mesh(geoCache.getBox(w * 1.06, 0.45, d * 1.06), this.matConcrete);
    slab.position.y = 0.22;
    slab.receiveShadow = true;
    solidGroup.add(slab);

    // Foundation perimeter curb
    const curb = new THREE.Mesh(geoCache.getBox(w * 1.08, 0.15, d * 1.08), this.matDarkSteel);
    curb.position.y = 0.08;
    solidGroup.add(curb);

    // 2. Specific Architecture by Type
    if (b.type.includes('HQ')) {
      // Bosh Qarorgoh (Hardened Command Bunker)
      const bunker = new THREE.Mesh(geoCache.getCylinder(w * 0.44, w * 0.5, h, 8), factionMat);
      bunker.position.y = h / 2 + 0.45;
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      solidGroup.add(bunker);

      // Helipad
      const helipad = new THREE.Mesh(geoCache.getCylinder(w * 0.38, w * 0.38, 0.35, 12), this.matDarkSteel);
      helipad.position.y = h + 0.6;
      helipad.receiveShadow = true;
      solidGroup.add(helipad);

      // White 'H' landing cross
      const hBar1 = new THREE.Mesh(geoCache.getBox(0.35, 0.05, 1.8), this.matGlowBlue);
      hBar1.position.set(-0.6, h + 0.8, 0);
      const hBar2 = new THREE.Mesh(geoCache.getBox(0.35, 0.05, 1.8), this.matGlowBlue);
      hBar2.position.set(0.6, h + 0.8, 0);
      const hCross = new THREE.Mesh(geoCache.getBox(1.2, 0.05, 0.35), this.matGlowBlue);
      hCross.position.set(0, h + 0.8, 0);
      solidGroup.add(hBar1);
      solidGroup.add(hBar2);
      solidGroup.add(hCross);

      // Communication Spire & Rotating Parabolic Radar Dish
      const tower = new THREE.Mesh(geoCache.getCylinder(0.25, 0.45, 2.8, 6), this.matDarkSteel);
      tower.position.set(-w * 0.25, h + 1.8, -d * 0.25);
      solidGroup.add(tower);

      radarDish = new THREE.Mesh(geoCache.getCylinder(1.6, 0.2, 0.4, 8, 'y', Math.PI), this.matDarkSteel);
      radarDish.rotation.x = Math.PI / 4;
      radarDish.position.set(-w * 0.25, h + 3.2, -d * 0.25);
      solidGroup.add(radarDish);

      const beacon = new THREE.Mesh(geoCache.getSphere(0.2, 6, 6), this.matGlowRed);
      beacon.position.set(-w * 0.25, h + 4.2, -d * 0.25);
      solidGroup.add(beacon);

    } else if (b.type.includes('WarFactory')) {
      // Mashina Zavodi (Armored Industrial War Factory)
      const hangar = new THREE.Mesh(geoCache.getBox(w * 0.9, h * 0.88, d * 0.85), factionMat);
      hangar.position.y = (h * 0.88) / 2 + 0.45;
      hangar.castShadow = true;
      hangar.receiveShadow = true;
      solidGroup.add(hangar);

      // Rooftop Industrial Exhaust Turbine Stacks
      const stack1 = new THREE.Mesh(geoCache.getCylinder(0.4, 0.45, 2.2, 6), this.matGunMetal);
      stack1.position.set(w * 0.28, h + 1.0, -d * 0.25);
      const stack2 = stack1.clone();
      stack2.position.set(w * 0.28, h + 1.0, d * 0.25);
      solidGroup.add(stack1);
      solidGroup.add(stack2);

      // Open Heavy Armored Door Frame
      const doorFrame = new THREE.Mesh(geoCache.getBox(w * 0.58, h * 0.72, 0.5), this.matDarkSteel);
      doorFrame.position.set(0, (h * 0.72) / 2 + 0.45, d * 0.43);
      solidGroup.add(doorFrame);

      // Yellow hazard caution stripes above door
      const hazardStripe = new THREE.Mesh(geoCache.getBox(w * 0.58, 0.25, 0.55), this.matScaffold);
      hazardStripe.position.set(0, h * 0.75 + 0.45, d * 0.43);
      solidGroup.add(hazardStripe);

    } else if (b.type.includes('Airfield')) {
      // Harbiy Aerodrom (Tactical Military Airbase with Runway)
      const runway = new THREE.Mesh(geoCache.getBox(w * 0.96, 0.25, d * 0.6), this.matRunway);
      runway.position.set(0, 0.5, 0);
      runway.receiveShadow = true;
      solidGroup.add(runway);

      // Control Tower
      const cTower = new THREE.Mesh(geoCache.getCylinder(0.85, 1.2, 6.0, 8), factionMat);
      cTower.position.set(-w * 0.36, 3.4, -d * 0.35);
      cTower.castShadow = true;
      solidGroup.add(cTower);

      const obsDeck = new THREE.Mesh(geoCache.getCylinder(1.4, 1.0, 1.3, 8), this.matGlowBlue);
      obsDeck.position.set(-w * 0.36, 6.6, -d * 0.35);
      solidGroup.add(obsDeck);

      radarDish = new THREE.Mesh(geoCache.getBox(2.0, 0.2, 0.4), this.matDarkSteel);
      radarDish.position.set(-w * 0.36, 7.8, -d * 0.35);
      solidGroup.add(radarDish);

      // Reinforced Flight Hangar on side
      const aHangar = new THREE.Mesh(geoCache.getCylinder(2.4, 2.4, 4.8, 8, 'y', Math.PI), factionMat);
      aHangar.rotation.z = Math.PI / 2;
      aHangar.position.set(w * 0.25, 1.9, -d * 0.2);
      solidGroup.add(aHangar);

    } else if (b.type.includes('Supply') || b.type.includes('Depot') || b.type.includes('Stash')) {
      // Pul To'plovchi Resurs Ombori (Supply Logistics Depot)
      const depotBase = new THREE.Mesh(geoCache.getBox(w * 0.88, 3.0, d * 0.8), factionMat);
      depotBase.position.y = 1.8;
      depotBase.castShadow = true;
      solidGroup.add(depotBase);

      // Stacked Heavy Cargo Containers with Pre-cached Materials
      for (let i = 0; i < 4; i++) {
        const cMat = this.matContainerColors[i % 4];
        const container = new THREE.Mesh(geoCache.getBox(3.0, 1.5, 1.7), cMat);
        const cx = (i % 2 === 0 ? -1 : 1) * 2.3;
        const cz = (i < 2 ? -1 : 1) * 1.9;
        container.position.set(cx, 3.8 + (i > 1 ? 1.5 : 0), cz);
        container.castShadow = true;
        solidGroup.add(container);
      }

      // Overhead Gantry Crane
      const craneTower = new THREE.Mesh(geoCache.getCylinder(0.28, 0.35, 5.0, 6), this.matGunMetal);
      craneTower.position.set(w * 0.35, 4.0, d * 0.32);
      const craneArm = new THREE.Mesh(geoCache.getBox(4.4, 0.25, 0.45), this.matGunMetal);
      craneArm.position.set(w * 0.35 - 1.6, 6.3, d * 0.32);
      solidGroup.add(craneTower);
      solidGroup.add(craneArm);

    } else if (b.type.includes('Patriot') || b.type.includes('GatlingCannon') || b.type.includes('Stinger')) {
      // Avtomatik Mudofaa Minoralari (Defense Turrets)
      if (b.type.includes('Patriot')) {
        // USA Patriot Missile Launcher
        const pBase = new THREE.Mesh(geoCache.getCylinder(1.9, 2.4, 2.4, 8), factionMat);
        pBase.position.y = 1.4;
        solidGroup.add(pBase);

        turret = new THREE.Group();
        turret.position.set(0, 2.7, 0);

        const rack = new THREE.Mesh(geoCache.getBox(1.8, 1.4, 3.0), this.matDarkSteel);
        rack.rotation.x = -Math.PI / 6;
        rack.position.set(0, 0.9, 0);
        turret.add(rack);

        // 4 Guided Missile Cones
        for (let mx = -0.45; mx <= 0.45; mx += 0.9) {
          for (let my = 0.5; my <= 1.2; my += 0.7) {
            const tip = new THREE.Mesh(geoCache.getCone(0.2, 0.7, 6), this.matGlowRed);
            tip.rotation.x = Math.PI / 3;
            tip.position.set(mx, my, 1.4);
            turret.add(tip);
          }
        }
        solidGroup.add(turret);

      } else if (b.type.includes('GatlingCannon')) {
        // China Gatling Defense Tower
        const gBase = new THREE.Mesh(geoCache.getCylinder(2.1, 2.5, 3.2, 8), factionMat);
        gBase.position.y = 1.8;
        solidGroup.add(gBase);

        turret = new THREE.Group();
        turret.position.set(0, 3.5, 0);

        const cupola = new THREE.Mesh(geoCache.getSphere(1.3, 8, 6), this.matDarkSteel);
        turret.add(cupola);

        // 4 Long Heavy Gatling Barrels
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const bm = new THREE.Mesh(geoCache.getCylinder(0.09, 0.09, 3.4, 6, 'z'), this.matGunMetal);
          bm.position.set(Math.cos(angle) * 0.32, Math.sin(angle) * 0.32, 1.8);
          turret.add(bm);
        }
        solidGroup.add(turret);

      } else {
        // GLA Stinger Site Bunker
        const sBunker = new THREE.Mesh(geoCache.getCylinder(2.8, 3.2, 1.8, 8), this.matSandbags);
        sBunker.position.y = 1.0;
        solidGroup.add(sBunker);

        const net = new THREE.Mesh(geoCache.getCone(3.4, 1.3, 8), this.matGLAArmor);
        net.position.y = 2.2;
        solidGroup.add(net);

        turret = new THREE.Group();
        turret.position.set(0, 1.5, 0);
        const tube = new THREE.Mesh(geoCache.getCylinder(0.14, 0.18, 2.6, 6, 'z'), this.matGunMetal);
        tube.position.set(0, 0, 1.3);
        turret.add(tube);
        solidGroup.add(turret);
      }

    } else if (b.type.includes('Barracks')) {
      // Kazarma (Barracks Compound)
      const barracks = new THREE.Mesh(geoCache.getBox(w * 0.88, h * 0.78, d * 0.8), factionMat);
      barracks.position.y = (h * 0.78) / 2 + 0.45;
      barracks.castShadow = true;
      barracks.receiveShadow = true;
      solidGroup.add(barracks);

      const roof = new THREE.Mesh(geoCache.getCone(w * 0.58, 1.4, 4), this.matDarkSteel);
      roof.position.y = h * 0.78 + 1.1;
      roof.rotation.y = Math.PI / 4;
      solidGroup.add(roof);

    } else if (b.type.includes('Reactor')) {
      // Sovuq Sintez yoki Yadro Reaktori
      const core = new THREE.Mesh(geoCache.getCylinder(w * 0.35, w * 0.42, h * 0.95, 12), factionMat);
      core.position.y = (h * 0.95) / 2 + 0.45;
      core.castShadow = true;
      solidGroup.add(core);

      // Pulsating High-Voltage Plasma Rings
      for (const ry of [h * 0.35, h * 0.65]) {
        const ring = new THREE.Mesh(
          geoCache.getTorus(w * 0.38, 0.28, 6, 16),
          b.faction === 'USA' ? this.matGlowBlue : this.matGlowGreen
        );
        ring.position.y = ry;
        solidGroup.add(ring);
      }

    } else {
      // Strategik Superqurollar (Zarracha to'pi, Yadro shaxtasi, Scud bo'roni)
      const swBase = new THREE.Mesh(geoCache.getBox(w * 0.92, h * 0.62, d * 0.92), factionMat);
      swBase.position.y = (h * 0.62) / 2 + 0.45;
      swBase.castShadow = true;
      solidGroup.add(swBase);

      if (b.type.includes('ParticleCannon')) {
        const pTower = new THREE.Mesh(geoCache.getCylinder(0.7, 1.0, 4.4, 8), this.matGunMetal);
        pTower.position.y = h + 1.4;
        const pDish = new THREE.Mesh(geoCache.getCylinder(3.6, 0.6, 1.1, 16), this.matGlowBlue);
        pDish.position.y = h + 3.8;
        solidGroup.add(pTower);
        solidGroup.add(pDish);
      } else if (b.type.includes('NukeSilo')) {
        const siloRing = new THREE.Mesh(geoCache.getTorus(w * 0.3, 0.55, 6, 16), this.matGunMetal);
        siloRing.position.y = h * 0.62 + 0.45;
        const missile = new THREE.Mesh(geoCache.getCone(0.9, 4.4, 8), this.matGlowRed);
        missile.position.y = h * 0.62 + 2.2;
        solidGroup.add(siloRing);
        solidGroup.add(missile);
      } else {
        const rack = new THREE.Mesh(geoCache.getBox(1.8, 4.8, 1.8), this.matGunMetal);
        rack.rotation.z = Math.PI / 6;
        rack.position.set(0, h * 0.62 + 2.2, 0);
        solidGroup.add(rack);
      }
    }

    // 3. Scaffolding Cage (Construction Progress Grid)
    const cageLines = new THREE.LineSegments(geoCache.getEdges(w * 1.06, h * 1.12, d * 1.06), this.matScaffold);
    cageLines.position.y = (h * 1.12) / 2 + 0.22;
    scaffoldGroup.add(cageLines);

    root.add(solidGroup);
    root.add(scaffoldGroup);

    // 4. Floating 3D Health Bar Billboard
    const hpBarMesh = new THREE.Mesh(geoCache.getPlane(w * 0.8, 0.45), this.matHpBg);
    hpBarMesh.position.set(0, h + 3.8, 0);
    hpBarMesh.renderOrder = 20;

    const hpFillMesh = new THREE.Mesh(geoCache.getPlane(w * 0.78, 0.35), this.matHpGreen);
    hpFillMesh.position.set(0, 0, 0.02);
    hpBarMesh.add(hpFillMesh);
    root.add(hpBarMesh);

    root.position.set(b.x * 0.1, 0, b.y * 0.1);

    // Frustum Culling optimization for stable 60 FPS
    root.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        child.frustumCulled = true;
      }
    });

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

    // Update active buildings
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

      // If defense turret, scan surroundings
      if (inst.turret) {
        inst.turret.rotation.y += delta * 0.6;
      }

      // Update Health Bar
      const hpPercent = Math.max(0, b.hp / b.maxHp);
      inst.hpFillMesh.scale.x = hpPercent;
      inst.hpFillMesh.position.x = -(1 - hpPercent) * (b.width * 0.1 * 0.78 * 0.5);

      if (hpPercent > 0.6) {
        inst.hpFillMesh.material = this.matHpGreen;
      } else if (hpPercent > 0.3) {
        inst.hpFillMesh.material = this.matHpYellow;
      } else {
        inst.hpFillMesh.material = this.matHpRed;
      }

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

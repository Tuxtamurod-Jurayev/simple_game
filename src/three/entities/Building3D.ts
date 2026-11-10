import * as THREE from 'three';
import { Building, BuildingTypeId, Faction } from '../../types/game';

export interface Building3DInstance {
  id: number;
  group: THREE.Group;
  scaffoldGroup: THREE.Group;
  solidGroup: THREE.Group;
  radarDish?: THREE.Object3D;
  hpBarMesh: THREE.Mesh;
  hpFillMesh: THREE.Mesh;
}

export class Building3DManager {
  public scene: THREE.Scene;
  private buildingInstances: Map<number, Building3DInstance> = new Map();

  // Shared Materials
  private matUSAArmor = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.35, roughness: 0.45 });
  private matChinaArmor = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.4, roughness: 0.5 });
  private matGLAArmor = new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.25, roughness: 0.65 });
  private matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.6, roughness: 0.4 });
  private matConcrete = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.85 });
  private matScaffold = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
  private matGlowBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  private matGlowGreen = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  private matGlowRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public getFactionMaterial(faction: Faction): THREE.MeshStandardMaterial {
    if (faction === 'USA') return this.matUSAArmor;
    if (faction === 'China') return this.matChinaArmor;
    return this.matGLAArmor;
  }

  /**
   * Create procedural 3D model for a building based on its type
   */
  public createBuildingMesh(b: Building): Building3DInstance {
    const root = new THREE.Group();
    const solidGroup = new THREE.Group();
    const scaffoldGroup = new THREE.Group();
    let radarDish: THREE.Object3D | undefined;

    const factionMat = this.getFactionMaterial(b.faction);

    // Calculate dimensions in 3D scale (world 2400x1600 -> 240x160 units)
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
      // Hexagonal / Octagonal Command Bunker
      const bunkerGeo = new THREE.CylinderGeometry(w * 0.42, w * 0.48, h, 8);
      const bunker = new THREE.Mesh(bunkerGeo, factionMat);
      bunker.position.y = h / 2 + 0.4;
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      solidGroup.add(bunker);

      // Helipad roof
      const helipadGeo = new THREE.CylinderGeometry(w * 0.38, w * 0.38, 0.3, 16);
      const helipad = new THREE.Mesh(helipadGeo, this.matDarkMetal);
      helipad.position.y = h + 0.55;
      helipad.receiveShadow = true;
      solidGroup.add(helipad);

      // Rotating Radar Array Tower
      const towerGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.0, 6);
      const tower = new THREE.Mesh(towerGeo, this.matDarkMetal);
      tower.position.set(-w * 0.22, h + 1.4, -d * 0.22);
      solidGroup.add(tower);

      const dishGeo = new THREE.CylinderGeometry(1.4, 0.2, 0.4, 8, 1, false, 0, Math.PI);
      radarDish = new THREE.Mesh(dishGeo, this.matDarkMetal);
      radarDish.rotation.x = Math.PI / 4;
      radarDish.position.set(-w * 0.22, h + 2.5, -d * 0.22);
      solidGroup.add(radarDish);

    } else if (b.type.includes('WarFactory')) {
      // Armored Hangar with arched/angled roof
      const hangarGeo = new THREE.BoxGeometry(w * 0.88, h * 0.9, d * 0.85);
      const hangar = new THREE.Mesh(hangarGeo, factionMat);
      hangar.position.y = (h * 0.9) / 2 + 0.4;
      hangar.castShadow = true;
      hangar.receiveShadow = true;
      solidGroup.add(hangar);

      // Rooftop vents / smokestacks
      const stackGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 6);
      const stack1 = new THREE.Mesh(stackGeo, this.matDarkMetal);
      stack1.position.set(w * 0.28, h + 0.8, -d * 0.25);
      const stack2 = stack1.clone();
      stack2.position.set(w * 0.28, h + 0.8, d * 0.25);
      solidGroup.add(stack1);
      solidGroup.add(stack2);

      // Open Heavy Blast Door at the front
      const doorFrameGeo = new THREE.BoxGeometry(w * 0.55, h * 0.7, 0.5);
      const doorFrame = new THREE.Mesh(doorFrameGeo, this.matDarkMetal);
      doorFrame.position.set(0, (h * 0.7) / 2 + 0.4, d * 0.43);
      solidGroup.add(doorFrame);

    } else if (b.type.includes('Barracks')) {
      // Military Barracks Compound
      const barGeo = new THREE.BoxGeometry(w * 0.85, h * 0.75, d * 0.8);
      const barracks = new THREE.Mesh(barGeo, factionMat);
      barracks.position.y = (h * 0.75) / 2 + 0.4;
      barracks.castShadow = true;
      barracks.receiveShadow = true;
      solidGroup.add(barracks);

      // Angled roof
      const roofGeo = new THREE.ConeGeometry(w * 0.55, 1.2, 4);
      const roof = new THREE.Mesh(roofGeo, this.matDarkMetal);
      roof.position.y = h * 0.75 + 1.0;
      roof.rotation.y = Math.PI / 4;
      solidGroup.add(roof);

      // Communications spire
      const spireGeo = new THREE.CylinderGeometry(0.08, 0.15, 3.2, 4);
      const spire = new THREE.Mesh(spireGeo, this.matDarkMetal);
      spire.position.set(w * 0.3, h + 1.5, -d * 0.28);
      solidGroup.add(spire);

    } else if (b.type.includes('Reactor') || b.type.includes('SupplyStash')) {
      // Power / Cold Fusion Core or GLA Stash
      const coreGeo = new THREE.CylinderGeometry(w * 0.32, w * 0.4, h * 0.95, 12);
      const core = new THREE.Mesh(coreGeo, factionMat);
      core.position.y = (h * 0.95) / 2 + 0.4;
      core.castShadow = true;
      solidGroup.add(core);

      // Glowing power coils
      const ringGeo = new THREE.TorusGeometry(w * 0.36, 0.25, 8, 16);
      const ring = new THREE.Mesh(ringGeo, b.faction === 'USA' ? this.matGlowBlue : this.matGlowGreen);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h * 0.65;
      solidGroup.add(ring);

    } else {
      // Superweapon (Particle Cannon / Nuke Silo / Scud Storm)
      const baseGeo = new THREE.BoxGeometry(w * 0.9, h * 0.6, d * 0.9);
      const swBase = new THREE.Mesh(baseGeo, factionMat);
      swBase.position.y = (h * 0.6) / 2 + 0.4;
      swBase.castShadow = true;
      solidGroup.add(swBase);

      if (b.type.includes('ParticleCannon')) {
        // High-tech satellite transmitter
        const pTower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3.5, 8), this.matDarkMetal);
        pTower.position.y = h + 1.0;
        const pDish = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 0.4, 0.8, 16), this.matGlowBlue);
        pDish.position.y = h + 3.0;
        solidGroup.add(pTower);
        solidGroup.add(pDish);
      } else if (b.type.includes('NukeSilo')) {
        // Open launch silo with missile warhead visible
        const siloRing = new THREE.Mesh(new THREE.TorusGeometry(w * 0.25, 0.4, 8, 16), this.matDarkMetal);
        siloRing.rotation.x = Math.PI / 2;
        siloRing.position.y = h * 0.6 + 0.4;
        const missile = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.2, 8), this.matGlowRed);
        missile.position.y = h * 0.6 + 1.5;
        solidGroup.add(siloRing);
        solidGroup.add(missile);
      } else {
        // Scud launcher launch rack
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.0, 1.4), this.matDarkMetal);
        rack.rotation.z = Math.PI / 6;
        rack.position.set(0, h * 0.6 + 1.8, 0);
        solidGroup.add(rack);
      }
    }

    // 3. Scaffolding Cage (EdgesGeometry wireframe construction box)
    const cageGeo = new THREE.BoxGeometry(w * 1.04, h * 1.1, d * 1.04);
    const edges = new THREE.EdgesGeometry(cageGeo);
    const cageLines = new THREE.LineSegments(edges, this.matScaffold);
    cageLines.position.y = (h * 1.1) / 2 + 0.2;
    scaffoldGroup.add(cageLines);

    // Diagonal construction braces
    const braceGeo = new THREE.CylinderGeometry(0.06, 0.06, Math.sqrt(w * w + h * h), 4);
    const brace1 = new THREE.Mesh(braceGeo, this.matDarkMetal);
    brace1.rotation.z = Math.PI / 4;
    brace1.position.set(0, h / 2, d * 0.52);
    scaffoldGroup.add(brace1);

    root.add(solidGroup);
    root.add(scaffoldGroup);

    // 4. Floating 3D Health Bar (Billboard Mesh above building)
    const hpBarGeo = new THREE.PlaneGeometry(w * 0.8, 0.4);
    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x18181b, depthTest: false, transparent: true, opacity: 0.85 });
    const hpBarMesh = new THREE.Mesh(hpBarGeo, hpBarMat);
    hpBarMesh.position.set(0, h + 3.2, 0);
    hpBarMesh.renderOrder = 20;

    const hpFillGeo = new THREE.PlaneGeometry(w * 0.78, 0.32);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false });
    const hpFillMesh = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFillMesh.position.set(0, 0, 0.02);
    hpBarMesh.add(hpFillMesh);
    root.add(hpBarMesh);

    // Initial scale and position
    root.position.set(b.x * 0.1, 0, b.y * 0.1);
    this.scene.add(root);

    const instance: Building3DInstance = {
      id: b.id,
      group: root,
      scaffoldGroup,
      solidGroup,
      radarDish,
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

      // Update position
      inst.group.position.set(b.x * 0.1, 0, b.y * 0.1);

      // Scaffolding Construction Animation
      if (b.buildProgress < 100) {
        const progress = Math.max(0.02, b.buildProgress / 100);
        // Scale solid geometry up from bottom
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

      // Update Health Bar
      const hpPercent = Math.max(0, b.hp / b.maxHp);
      inst.hpFillMesh.scale.x = hpPercent;
      inst.hpFillMesh.position.x = -(1 - hpPercent) * (b.width * 0.1 * 0.78 * 0.5);

      // Color based on HP status
      const fillMat = inst.hpFillMesh.material as THREE.MeshBasicMaterial;
      if (hpPercent > 0.6) fillMat.color.setHex(0x22c55e); // Green
      else if (hpPercent > 0.3) fillMat.color.setHex(0xf59e0b); // Yellow
      else fillMat.color.setHex(0xef4444); // Red

      // Billboard orientation (face camera)
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

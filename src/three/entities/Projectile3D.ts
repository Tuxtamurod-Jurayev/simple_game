import * as THREE from 'three';
import { Projectile, SuperweaponStrike, SupplyDock, SalvageCrate } from '../../types/game';

export class Projectile3DManager {
  public scene: THREE.Scene;

  // Projectile Meshes Pool
  private projectileGroup: THREE.Group = new THREE.Group();
  private projectilePool: THREE.Mesh[] = [];

  // Superweapon Visuals
  private orbitalLaserMesh: THREE.Mesh;
  private nukeMushroomMesh: THREE.Group;
  private scudStormGroup: THREE.Group;

  // Supply Docks & Crates
  private dockInstances: Map<number, THREE.Group> = new Map();
  private crateInstances: Map<number, THREE.Group> = new Map();

  // Materials (Standard Glowing & Metallic)
  private matShell = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.8 });
  private matRocket = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 1.4, roughness: 0.3, metalness: 0.7 });
  private matLaser = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.8, roughness: 0.1 });
  private matCrate = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3 });
  private matSupplyBox = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.scene.add(this.projectileGroup);

    // 1. Orbital Laser Beam for Particle Cannon
    const laserGeo = new THREE.CylinderGeometry(1.6, 2.2, 120, 16);
    laserGeo.translate(0, 60, 0);
    this.orbitalLaserMesh = new THREE.Mesh(
      laserGeo,
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2, roughness: 0.1, transparent: true, opacity: 0.88 })
    );
    this.orbitalLaserMesh.visible = false;
    this.scene.add(this.orbitalLaserMesh);

    // 2. Nuke Mushroom Cloud & Shockwave
    this.nukeMushroomMesh = new THREE.Group();
    const capGeo = new THREE.SphereGeometry(12, 16, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.7, emissive: 0x7c2d12 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 22;
    this.nukeMushroomMesh.add(cap);

    const stalkGeo = new THREE.CylinderGeometry(3.5, 6, 24, 12);
    stalkGeo.translate(0, 12, 0);
    const stalk = new THREE.Mesh(stalkGeo, capMat);
    this.nukeMushroomMesh.add(stalk);

    this.nukeMushroomMesh.visible = false;
    this.scene.add(this.nukeMushroomMesh);

    // 3. Scud Storm group
    this.scudStormGroup = new THREE.Group();
    this.scene.add(this.scudStormGroup);
  }

  /**
   * Update active projectiles
   */
  public updateProjectiles(projectiles: Projectile[]): void {
    // Ensure sufficient pool
    while (this.projectilePool.length < projectiles.length) {
      const geo = new THREE.SphereGeometry(0.35, 6, 6);
      const mesh = new THREE.Mesh(geo, this.matShell);
      this.projectilePool.push(mesh);
      this.projectileGroup.add(mesh);
    }

    for (let i = 0; i < this.projectilePool.length; i++) {
      const mesh = this.projectilePool[i];
      if (i < projectiles.length) {
        const p = projectiles[i];
        mesh.visible = true;
        mesh.position.set(p.x * 0.1, 1.2, p.y * 0.1);

        if (p.isLaser) {
          mesh.material = this.matLaser;
          mesh.scale.set(0.6, 0.6, 2.2);
        } else if (p.isRocket) {
          mesh.material = this.matRocket;
          mesh.scale.set(0.8, 0.8, 2.0);
        } else {
          mesh.material = this.matShell;
          mesh.scale.set(1, 1, 1);
        }
      } else {
        mesh.visible = false;
      }
    }
  }

  /**
   * Update Supply Docks & Salvage Crates
   */
  public updateDocksAndCrates(docks: SupplyDock[], crates: SalvageCrate[], delta: number): void {
    // 1. Supply Docks
    const dockIds = new Set(docks.map(d => d.id));
    for (const [id, grp] of this.dockInstances.entries()) {
      if (!dockIds.has(id)) {
        this.scene.remove(grp);
        this.dockInstances.delete(id);
      }
    }

    for (const d of docks) {
      let grp = this.dockInstances.get(d.id);
      if (!grp) {
        grp = new THREE.Group();
        // Pallet & shipping containers
        const w = d.width * 0.1;
        const h = d.height * 0.1;
        const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, h), this.matSupplyBox);
        base.position.y = 0.2;
        grp.add(base);

        // Crates stacked on top
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 1.6, h * 0.4), this.matSupplyBox);
        c1.position.set(-w * 0.2, 1.0, -h * 0.2);
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 1.4, h * 0.35), this.matSupplyBox);
        c2.position.set(w * 0.2, 0.9, h * 0.15);
        grp.add(c1);
        grp.add(c2);

        grp.position.set(d.x * 0.1, 0, d.y * 0.1);
        this.scene.add(grp);
        this.dockInstances.set(d.id, grp);
      }
    }

    // 2. Salvage Crates (Spinning green box)
    const crateIds = new Set(crates.map(c => c.id));
    for (const [id, grp] of this.crateInstances.entries()) {
      if (!crateIds.has(id)) {
        this.scene.remove(grp);
        this.crateInstances.delete(id);
      }
    }

    for (const c of crates) {
      let grp = this.crateInstances.get(c.id);
      if (!grp) {
        grp = new THREE.Group();
        const crateMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), this.matCrate);
        crateMesh.position.y = 0.8;
        grp.add(crateMesh);

        grp.position.set(c.x * 0.1, 0, c.y * 0.1);
        this.scene.add(grp);
        this.crateInstances.set(c.id, grp);
      }
      grp.rotation.y += delta * 2.5;
    }
  }

  /**
   * Render and animate superweapon strikes in 3D
   */
  public updateSuperweapons(strikes: SuperweaponStrike[], delta: number): void {
    let hasLaser = false;
    let hasNuke = false;

    for (const s of strikes) {
      if (s.type === 'ParticleCannon') {
        hasLaser = true;
        this.orbitalLaserMesh.visible = true;
        this.orbitalLaserMesh.position.set(s.x * 0.1, 0, s.y * 0.1);
        const pulse = 0.8 + 0.3 * Math.sin(Date.now() * 0.02);
        this.orbitalLaserMesh.scale.set(pulse, 1, pulse);
      } else if (s.type === 'NuclearMissile') {
        hasNuke = true;
        this.nukeMushroomMesh.visible = true;
        this.nukeMushroomMesh.position.set(s.x * 0.1, 0, s.y * 0.1);
        const progress = Math.min(1, s.timer / 4);
        this.nukeMushroomMesh.scale.set(progress * 1.4, progress * 1.4, progress * 1.4);
      }
    }

    if (!hasLaser) this.orbitalLaserMesh.visible = false;
    if (!hasNuke) this.nukeMushroomMesh.visible = false;
  }
}

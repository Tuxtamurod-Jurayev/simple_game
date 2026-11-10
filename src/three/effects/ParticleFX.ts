import * as THREE from 'three';

interface ActiveParticle {
  type: 'spark' | 'smoke' | 'anthrax';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
  maxScale: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleFX {
  public scene: THREE.Scene;
  private maxSparks = 250;
  private maxSmokes = 250;

  // Instanced Meshes for high performance 60 FPS
  private sparkMesh: THREE.InstancedMesh;
  private smokeMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D = new THREE.Object3D();

  private activeSparks: ActiveParticle[] = [];
  private activeSmokes: ActiveParticle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Sparks InstancedMesh (glowing fire & debris)
    const sparkGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.95
    });
    this.sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, this.maxSparks);
    this.sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparkMesh.count = 0;
    this.scene.add(this.sparkMesh);

    // 2. Smoke InstancedMesh (expanding low-poly dark puffs)
    const smokeGeo = new THREE.DodecahedronGeometry(0.65, 0);
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65
    });
    this.smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, this.maxSmokes);
    this.smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.smokeMesh.count = 0;
    this.scene.add(this.smokeMesh);
  }

  /**
   * Spawn a burst of explosion particles (sparks + smoke)
   */
  public spawnExplosion(x: number, y: number, z: number, scale: number = 1.0, isNuke: boolean = false): void {
    const sparkCount = isNuke ? 65 : Math.floor(25 * scale);
    const smokeCount = isNuke ? 45 : Math.floor(18 * scale);

    // 1. Fiery Sparks
    for (let i = 0; i < sparkCount; i++) {
      if (this.activeSparks.length >= this.maxSparks) break;
      const speed = (Math.random() * 8 + 4) * (isNuke ? 2.5 : scale);
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() * 0.8 + 0.2) * Math.PI * 0.5;

      this.activeSparks.push({
        type: 'spark',
        x,
        y: y + 0.5,
        z,
        vx: Math.cos(angle) * Math.cos(elevation) * speed,
        vy: Math.sin(elevation) * speed,
        vz: Math.sin(angle) * Math.cos(elevation) * speed,
        scale: (Math.random() * 0.4 + 0.2) * scale,
        maxScale: (Math.random() * 0.4 + 0.2) * scale,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.5 + Math.random() * 0.4,
        color: new THREE.Color(Math.random() > 0.4 ? 0xff4400 : 0xffcc00)
      });
    }

    // 2. Smoke Clouds
    for (let i = 0; i < smokeCount; i++) {
      if (this.activeSmokes.length >= this.maxSmokes) break;
      const speed = (Math.random() * 2 + 1) * scale;
      const angle = Math.random() * Math.PI * 2;

      this.activeSmokes.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 1.5,
        y: y + 0.4,
        z: z + (Math.random() - 0.5) * 1.5,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * 2.5 + 1.2,
        vz: Math.sin(angle) * speed,
        scale: 0.4 * scale,
        maxScale: (Math.random() * 2.5 + 2.0) * (isNuke ? 3.0 : scale),
        life: 1.2 + Math.random() * 0.8,
        maxLife: 1.2 + Math.random() * 0.8,
        color: new THREE.Color(isNuke ? 0x221105 : 0x2a2a2a)
      });
    }
  }

  /**
   * Spawn GLA Anthrax toxic gas cloud
   */
  public spawnAnthraxCloud(x: number, y: number, z: number): void {
    for (let i = 0; i < 20; i++) {
      if (this.activeSmokes.length >= this.maxSmokes) break;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 3.5;

      this.activeSmokes.push({
        type: 'anthrax',
        x: x + Math.cos(angle) * r,
        y: y + 0.3,
        z: z + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 1.2 + 0.3,
        vz: (Math.random() - 0.5) * 0.8,
        scale: 0.6,
        maxScale: 2.8,
        life: 2.5 + Math.random() * 1.0,
        maxLife: 2.5 + Math.random() * 1.0,
        color: new THREE.Color(0x22c55e)
      });
    }
  }

  /**
   * Update particle positions, scales and instanced buffers
   */
  public update(delta: number): void {
    // 1. Update Sparks
    let sparkIdx = 0;
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const p = this.activeSparks[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.activeSparks.splice(i, 1);
        continue;
      }

      // Physics
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 16.0 * delta; // Gravity

      // Bounce on ground
      if (p.y < 0.1) {
        p.y = 0.1;
        p.vy = -p.vy * 0.4;
        p.vx *= 0.6;
        p.vz *= 0.6;
      }

      const progress = p.life / p.maxLife;
      const s = p.scale * progress;

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.set(s, s, s);
      this.dummy.rotation.x += delta * 6;
      this.dummy.rotation.y += delta * 4;
      this.dummy.updateMatrix();

      this.sparkMesh.setMatrixAt(sparkIdx, this.dummy.matrix);
      this.sparkMesh.setColorAt(sparkIdx, p.color);
      sparkIdx++;
    }
    this.sparkMesh.count = sparkIdx;
    this.sparkMesh.instanceMatrix.needsUpdate = true;
    if (this.sparkMesh.instanceColor) this.sparkMesh.instanceColor.needsUpdate = true;

    // 2. Update Smokes
    let smokeIdx = 0;
    for (let i = this.activeSmokes.length - 1; i >= 0; i--) {
      const p = this.activeSmokes[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.activeSmokes.splice(i, 1);
        continue;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vx *= 0.96;
      p.vz *= 0.96;

      const progress = 1 - p.life / p.maxLife;
      // Expands as it rises
      const s = THREE.MathUtils.lerp(p.scale, p.maxScale, Math.pow(progress, 0.7));

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.set(s, s, s);
      this.dummy.rotation.x += delta * 0.5;
      this.dummy.rotation.y += delta * 0.7;
      this.dummy.updateMatrix();

      this.smokeMesh.setMatrixAt(smokeIdx, this.dummy.matrix);
      this.smokeMesh.setColorAt(smokeIdx, p.color);
      smokeIdx++;
    }
    this.smokeMesh.count = smokeIdx;
    this.smokeMesh.instanceMatrix.needsUpdate = true;
    if (this.smokeMesh.instanceColor) this.smokeMesh.instanceColor.needsUpdate = true;
  }
}

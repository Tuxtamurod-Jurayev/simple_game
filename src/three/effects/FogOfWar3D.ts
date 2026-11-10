import * as THREE from 'three';
import { FogOfWarSystem, GRID_COLS, GRID_ROWS } from '../../systems/fogOfWarSystem';

export class FogOfWar3D {
  public mesh: THREE.Mesh;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private lastUpdate: number = 0;

  constructor(scene: THREE.Scene, worldWidth: number, worldDepth: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GRID_COLS;
    this.canvas.height = GRID_ROWS;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for Fog of War');
    this.ctx = ctx;

    // Initialize with pitch black
    this.ctx.fillStyle = 'rgba(10, 15, 12, 0.96)';
    this.ctx.fillRect(0, 0, GRID_COLS, GRID_ROWS);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    // Single plane hovering just above the ground
    const geometry = new THREE.PlaneGeometry(worldWidth, worldDepth);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(worldWidth / 2, 0.22, worldDepth / 2);
    this.mesh.renderOrder = 10; // Render above ground, below billboard HUDs
    scene.add(this.mesh);
  }

  /**
   * Update the fog texture from the 60x40 simulation grid
   */
  public update(fogSystem: FogOfWarSystem): void {
    const now = performance.now();
    // Update every ~50ms to keep 60 FPS silky smooth
    if (now - this.lastUpdate < 45) return;
    this.lastUpdate = now;

    const imgData = this.ctx.createImageData(GRID_COLS, GRID_ROWS);
    const data = imgData.data;
    const grid = fogSystem.grid;

    for (let i = 0; i < grid.length; i++) {
      const state = grid[i];
      const p = i * 4;

      // Dark military shroud tint
      data[p] = 8;     // R
      data[p + 1] = 12; // G
      data[p + 2] = 10; // B

      if (state === 2) {
        // Visible: completely transparent
        data[p + 3] = 0;
      } else if (state === 1) {
        // Shroud: semi-transparent fog
        data[p + 3] = 140;
      } else {
        // Unexplored: opaque pitch black
        data[p + 3] = 245;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
    this.texture.needsUpdate = true;
  }
}

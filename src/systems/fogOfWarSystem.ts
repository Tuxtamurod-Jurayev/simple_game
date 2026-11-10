import { Unit, Building, Camera } from '../types/game';

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1600;
export const CELL_SIZE = 40;
export const GRID_COLS = 60; // 2400 / 40
export const GRID_ROWS = 40; // 1600 / 40

export class FogOfWarSystem {
  grid: Uint8Array; // 0=Unexplored, 1=Shroud, 2=Visible
  spySatellite: { x: number; y: number; radius: number; expiresAt: number } | null = null;

  constructor() {
    this.grid = new Uint8Array(GRID_COLS * GRID_ROWS);
  }

  reset(): void {
    this.grid.fill(0);
    this.spySatellite = null;
  }

  triggerSpySatellite(worldX: number, worldY: number, durationSeconds = 20): void {
    this.spySatellite = {
      x: worldX,
      y: worldY,
      radius: 350,
      expiresAt: Date.now() + durationSeconds * 1000
    };
  }

  update(units: Unit[], buildings: Building[]): void {
    // 1. Degrade all currently visible cells (2) to shroud (1)
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === 2) {
        this.grid[i] = 1;
      }
    }

    // 2. Mark visible around all player buildings
    buildings.forEach(b => {
      if (b.team === 'player' && b.hp > 0) {
        const radius = b.type.includes('HQ') ? 280 : 180;
        this.revealCircle(b.x + b.width / 2, b.y + b.height / 2, radius);
      }
    });

    // 3. Mark visible around all player units
    units.forEach(u => {
      if (u.team === 'player' && u.hp > 0) {
        const radius = u.isFlying ? 260 : u.type === 'Humvee' ? 240 : 190;
        this.revealCircle(u.x, u.y, radius);
      }
    });

    // 4. Spy Satellite reveal
    if (this.spySatellite) {
      if (Date.now() < this.spySatellite.expiresAt) {
        this.revealCircle(this.spySatellite.x, this.spySatellite.y, this.spySatellite.radius);
      } else {
        this.spySatellite = null;
      }
    }
  }

  private revealCircle(worldX: number, worldY: number, radius: number): void {
    const minCol = Math.max(0, Math.floor((worldX - radius) / CELL_SIZE));
    const maxCol = Math.min(GRID_COLS - 1, Math.floor((worldX + radius) / CELL_SIZE));
    const minRow = Math.max(0, Math.floor((worldY - radius) / CELL_SIZE));
    const maxRow = Math.min(GRID_ROWS - 1, Math.floor((worldY + radius) / CELL_SIZE));

    const rSq = radius * radius;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellCenterX = c * CELL_SIZE + CELL_SIZE / 2;
        const cellCenterY = r * CELL_SIZE + CELL_SIZE / 2;
        const dx = cellCenterX - worldX;
        const dy = cellCenterY - worldY;

        if (dx * dx + dy * dy <= rSq) {
          this.grid[r * GRID_COLS + c] = 2; // Full visibility
        }
      }
    }
  }

  isPointVisible(worldX: number, worldY: number, forMovingEnemy = false): boolean {
    const c = Math.floor(worldX / CELL_SIZE);
    const r = Math.floor(worldY / CELL_SIZE);
    if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return false;

    const state = this.grid[r * GRID_COLS + c];
    if (forMovingEnemy) {
      return state === 2; // Moving enemy units only visible if directly lit!
    }
    return state >= 1; // Terrain / buildings visible in shroud
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera, viewW: number, viewH: number): void {
    const minCol = Math.max(0, Math.floor(camera.x / CELL_SIZE));
    const maxCol = Math.min(GRID_COLS - 1, Math.ceil((camera.x + viewW) / CELL_SIZE));
    const minRow = Math.max(0, Math.floor(camera.y / CELL_SIZE));
    const maxRow = Math.min(GRID_ROWS - 1, Math.ceil((camera.y + viewH) / CELL_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const state = this.grid[r * GRID_COLS + c];
        if (state === 2) continue; // Fully transparent

        const screenX = c * CELL_SIZE - camera.x;
        const screenY = r * CELL_SIZE - camera.y;

        if (state === 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.96)'; // Unexplored
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'; // Shroud
        }
        ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE);
      }
    }

    // Render Spy Satellite scanning ring if active
    if (this.spySatellite && Date.now() < this.spySatellite.expiresAt) {
      const sx = this.spySatellite.x - camera.x;
      const sy = this.spySatellite.y - camera.y;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(sx, sy, this.spySatellite.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating radar beam
      const beamAngle = Date.now() * 0.003;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(beamAngle) * this.spySatellite.radius, sy + Math.sin(beamAngle) * this.spySatellite.radius);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderMinimapFog(ctx: CanvasRenderingContext2D, minimapW: number, minimapH: number): void {
    const scaleX = minimapW / WORLD_WIDTH;
    const scaleY = minimapH / WORLD_HEIGHT;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const state = this.grid[r * GRID_COLS + c];
        if (state === 2) continue;

        ctx.fillStyle = state === 0 ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.48)';
        ctx.fillRect(
          c * CELL_SIZE * scaleX,
          r * CELL_SIZE * scaleY,
          CELL_SIZE * scaleX + 0.5,
          CELL_SIZE * scaleY + 0.5
        );
      }
    }
  }
}

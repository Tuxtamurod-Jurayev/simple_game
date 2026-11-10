import {
  Unit,
  Building,
  SupplyDock,
  SalvageCrate,
  Projectile,
  Particle,
  SuperweaponStrike,
  Camera,
  Faction
} from '../types/game';
import { FACTION_COLORS } from '../config/factions';
import { WORLD_WIDTH, WORLD_HEIGHT } from './fogOfWarSystem';

export class RenderSystem {
  // Render Desert Battlefield Terrain with Bases, River, Bridge, and Supply Stashes
  static renderTerrain(ctx: CanvasRenderingContext2D, camera: Camera, viewW: number, viewH: number): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Base desert earth
    ctx.fillStyle = '#3a3224';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Sand dunes & dirt variation
    ctx.fillStyle = '#443b2b';
    for (let x = 0; x < WORLD_WIDTH; x += 180) {
      for (let y = 0; y < WORLD_HEIGHT; y += 140) {
        if ((x + y) % 3 === 0) {
          ctx.fillRect(x, y, 120, 90);
        }
      }
    }

    // 2. Strategic Chokepoint River / Canyon in Center
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1150, 0, 100, WORLD_HEIGHT);

    // River bridges
    ctx.fillStyle = '#475569';
    ctx.fillRect(1120, 450, 160, 100); // North Bridge
    ctx.fillRect(1120, 1050, 160, 100); // South Bridge
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(1120, 450, 160, 100);
    ctx.strokeRect(1120, 1050, 160, 100);
    ctx.setLineDash([]);

    // 3. Four Corner Military Tarmac Pads
    ctx.fillStyle = '#1e2022';
    // Top-Left (USA/Player Base)
    ctx.fillRect(60, 60, 500, 420);
    // Bottom-Right (Enemy Base)
    ctx.fillRect(1840, 1120, 500, 420);
    // Top-Right & Bottom-Left Expansions
    ctx.fillRect(1840, 60, 480, 360);
    ctx.fillRect(60, 1140, 480, 360);

    // Tarmac hazard edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 500, 420);
    ctx.strokeRect(1840, 1120, 500, 420);

    ctx.restore();
  }

  // Render Supply Docks with Shipping Containers & Pallets
  static renderSupplyDocks(ctx: CanvasRenderingContext2D, docks: SupplyDock[], camera: Camera): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    docks.forEach(dock => {
      // Concrete loading dock slab
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(dock.x, dock.y, dock.width, dock.height);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(dock.x, dock.y, dock.width, dock.height);

      // Shipping Containers
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(dock.x + 8, dock.y + 8, 40, 22);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(dock.x + 55, dock.y + 8, 42, 22);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(dock.x + 18, dock.y + 36, 50, 24);

      // Crane
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(dock.x + dock.width - 24, dock.y + 38, 16, 28);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUPPLY DOCK', dock.x + dock.width / 2, dock.y - 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px Consolas, monospace';
      ctx.fillText(`$${dock.supplies}`, dock.x + dock.width / 2, dock.y + dock.height + 14);
    });

    ctx.restore();
  }

  // Render GLA Salvage Crates
  static renderSalvageCrates(ctx: CanvasRenderingContext2D, crates: SalvageCrate[], camera: Camera): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    crates.forEach(c => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(c.x - 8, c.y - 8, 16, 16);
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x - 8, c.y - 8, 16, 16);

      // Metal hazard stripes
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', c.x, c.y + 3);
    });

    ctx.restore();
  }

  // Render Buildings with Scaffolding Construction Progress
  static renderBuildings(ctx: CanvasRenderingContext2D, buildings: Building[], camera: Camera, selectedBuilding: Building | null): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    buildings.forEach(b => {
      const isPlayer = b.team === 'player';
      const fColor = FACTION_COLORS[b.faction];

      // Soya
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(b.x + 6, b.y + 6, b.width, b.height);

      // 1. SCAFFOLDING (Construction Progress 0% -> 100%)
      if (b.buildProgress < 100) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Yellow-black construction border
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        ctx.setLineDash([]);

        // Vertical scaffold bars
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        for (let i = 12; i < b.width; i += 16) {
          ctx.beginPath();
          ctx.moveTo(b.x + i, b.y);
          ctx.lineTo(b.x + i, b.y + b.height);
          ctx.stroke();
        }

        // Fill progress from bottom to top
        const fillH = (b.height * b.buildProgress) / 100;
        ctx.fillStyle = isPlayer ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(b.x, b.y + b.height - fillH, b.width, fillH);

        // Percentage text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(b.buildProgress)}%`, b.x + b.width / 2, b.y + b.height / 2 + 4);
        return;
      }

      // 2. FULLY COMPLETED BUILDINGS (USA, China, GLA Visual Specs)
      ctx.fillStyle = isPlayer ? fColor.primary : '#4a1515';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeStyle = isPlayer ? fColor.accent : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // A) USA BUILDINGS
      if (b.faction === 'USA') {
        if (b.type === 'USA_HQ') {
          // Helipad 'H'
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', cx, cy);

          // Rotating radar
          const rx = b.x + b.width - 20;
          const ry = b.y + 20;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(b.radarAngle || 0);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-10, -3, 20, 6);
          ctx.restore();
        } else if (b.type === 'USA_Reactor') {
          // Cold Fusion Reactor: 2 pulsing blue domes
          const pulse = Math.sin(Date.now() * 0.006) * 3;
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(b.x + 18, b.y + b.height / 2, 12 + pulse, 0, Math.PI * 2);
          ctx.arc(b.x + b.width - 18, b.y + b.height / 2, 12 + pulse, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.type === 'USA_ParticleCannon') {
          // Triangular optical lens & 3 energy rings
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // B) CHINA BUILDINGS
      if (b.faction === 'China') {
        if (b.type === 'China_HQ') {
          // 4 corner red flags & central antenna
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(b.x + 8, b.y + 8, 8, 8);
          ctx.fillRect(b.x + b.width - 16, b.y + 8, 8, 8);
          ctx.fillRect(b.x + 8, b.y + b.height - 16, 8, 8);
          ctx.fillRect(b.x + b.width - 16, b.y + b.height - 16, 8, 8);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('★', b.x + b.width / 2, b.y + b.height / 2 + 5);
        } else if (b.type === 'China_Reactor') {
          // Nuclear Reactor: cooling tower & green-yellow glow
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#84cc16';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (b.type === 'China_NukeSilo') {
          // Circular hatch & red missile tip
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(cx, cy, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // C) GLA BUILDINGS
      if (b.faction === 'GLA') {
        if (b.type === 'GLA_HQ') {
          // Sandbags perimeter
          ctx.fillStyle = '#78350f';
          ctx.fillRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);
        } else if (b.type === 'GLA_SupplyStash') {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(b.x + 8, b.y + 8, b.width - 16, b.height - 16);
        } else if (b.type === 'GLA_ScudStorm') {
          // 7 Scud missiles
          ctx.fillStyle = '#15803d';
          for (let s = 0; s < 7; s++) {
            const sx = b.x + 12 + (s % 4) * 16;
            const sy = b.y + 16 + Math.floor(s / 4) * 26;
            ctx.fillRect(sx, sy, 7, 18);
          }
        }
      }

      // Selected highlight
      if (selectedBuilding?.id === b.id) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
        ctx.setLineDash([]);
      }

      // HP Bar
      const hpPct = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = '#111';
      ctx.fillRect(b.x, b.y - 10, b.width, 5);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(b.x, b.y - 10, b.width * hpPct, 5);
    });

    ctx.restore();
  }

  // Render Units with Procedural Graphics, Turrets, Rotors, Horde Auras & Veterancy
  static renderUnits(ctx: CanvasRenderingContext2D, units: Unit[], camera: Camera, selectedUnits: Unit[]): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    units.forEach(u => {
      ctx.save();

      // 1. CHINOOK SHADOW (Flying 18px above ground)
      if (u.isFlying) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(u.x, u.y + 20, u.radius * 1.3, u.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. HORDE BONUS AURA FOR CHINA
      if (u.isHordeBoosted) {
        ctx.save();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(u.x, u.y, u.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. SELECTION RING
      const isSel = selectedUnits.some(s => s.id === u.id);
      if (isSel) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(u.x, u.y, u.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.translate(u.x, u.y);

      // --- BODY RENDERING (Rotates to bodyAngle) ---
      ctx.save();
      ctx.rotate(u.bodyAngle);
      const isPlayer = u.team === 'player';
      const fColor = FACTION_COLORS[u.faction];

      if (u.type === 'SupplyChinook') {
        // Dual Rotor Helicopter body
        ctx.fillStyle = isPlayer ? '#1e3a8a' : '#7f1d1d';
        ctx.fillRect(-u.radius * 1.4, -u.radius * 0.65, u.radius * 2.8, u.radius * 1.3);

        // Dual spinning rotors
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        [-u.radius * 0.7, u.radius * 0.7].forEach(rx => {
          ctx.save();
          ctx.translate(rx, 0);
          ctx.rotate(u.rotorAngle || 0);
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
          ctx.restore();
        });
      } else if (u.type === 'Ranger' || u.type === 'RedGuard' || u.type === 'Rebel') {
        // Infantry
        ctx.fillStyle = isPlayer ? fColor.primary : '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -2, 8, 4); // Weapon
      } else if (u.type === 'Humvee' || u.type === 'Technical') {
        // Fast Jeep / Technical
        ctx.fillStyle = isPlayer ? fColor.primary : '#78350f';
        ctx.fillRect(-u.radius, -u.radius * 0.65, u.radius * 2, u.radius * 1.3);
      } else {
        // Tanks (Crusader, Paladin, Battlemaster, Overlord, Scorpion, Marauder)
        const w = u.radius * 1.1;
        const h = u.radius * 0.85;

        // Tracks
        ctx.fillStyle = '#171717';
        ctx.fillRect(-w, -h - 3, w * 2, 5);
        ctx.fillRect(-w, h - 2, w * 2, 5);

        // Hull
        ctx.fillStyle = isPlayer ? fColor.primary : '#4a1515';
        ctx.fillRect(-w + 2, -h + 1, (w - 2) * 2, (h - 1) * 2);
        ctx.strokeStyle = isPlayer ? fColor.accent : '#ef4444';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-w + 2, -h + 1, (w - 2) * 2, (h - 1) * 2);
      }
      ctx.restore(); // Body restored

      // --- TURRET & CANNON (Rotates to turretAngle) ---
      if (u.range > 0 && !u.isFlying && u.type !== 'Ranger' && u.type !== 'RedGuard' && u.type !== 'Rebel') {
        ctx.save();
        ctx.rotate(u.turretAngle);

        ctx.fillStyle = '#94a3b8';
        if (u.type === 'Overlord' || (u.type === 'Marauder' && (u.salvageLevel || 0) >= 2)) {
          // Dual barrels
          ctx.fillRect(0, -6, u.radius + 12, 4);
          ctx.fillRect(0, 2, u.radius + 12, 4);
        } else {
          ctx.fillRect(0, -2.5, u.radius + 10, 5);
        }

        // Turret cap
        ctx.beginPath();
        ctx.arc(0, 0, u.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = isPlayer ? fColor.accent : '#dc2626';
        ctx.fill();
        ctx.restore();
      }

      // 4. VETERANCY CHEVRONS
      if (u.veterancy > 0) {
        ctx.save();
        ctx.fillStyle = u.veterancy === 3 ? '#ef4444' : '#eab308';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        const chevron = u.veterancy === 1 ? 'V' : u.veterancy === 2 ? 'VV' : '★';
        ctx.fillText(chevron, 0, -u.radius - 12);
        ctx.restore();
      }

      // 5. HP Bar
      const hpRatio = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = '#000';
      ctx.fillRect(-12, -u.radius - 7, 24, 3);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-12, -u.radius - 7, 24 * hpRatio, 3);

      ctx.restore();
    });

    ctx.restore();
  }

  // Render Projectiles, Tracers & Rockets
  static renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[], camera: Camera): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isHeavy ? 3.5 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = p.isTracer ? '#ef4444' : p.isRocket ? '#22c55e' : '#fbbf24';
      ctx.fill();
    });

    ctx.restore();
  }

  // Render Particles (Explosions, Smoke, Anthrax Clouds)
  static renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camera: Camera): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= pt.decay;

      if (pt.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Render Active Superweapon Strikes (Particle Cannon, Nuke, Scud Storm)
  static renderSuperweapons(ctx: CanvasRenderingContext2D, strikes: SuperweaponStrike[], camera: Camera): void {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    strikes.forEach(s => {
      if (s.type === 'ParticleCannon') {
        // Descending blue searing laser beam
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 24;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 600);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.restore();
      } else if (s.type === 'NuclearMissile') {
        // Expanding fiery shockwave
        const shockRadius = (s.phase * 220);
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, shockRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.fill();
        ctx.restore();
      } else if (s.type === 'ScudStorm') {
        // Lingering green Anthrax Cloud
        ctx.save();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }
}

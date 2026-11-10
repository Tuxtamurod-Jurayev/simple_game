import {
  Unit,
  Building,
  Projectile,
  Particle,
  SalvageCrate,
  SupplyDock,
  Faction
} from '../types/game';
import { playCannonShot, playLaserBeam, playGatlingFire, playExplosion, playCashSound } from './audioSystem';

export class PhysicsSystem {
  // Separation steering (Boids avoidance)
  static applySeparation(units: Unit[]): void {
    const len = units.length;
    for (let i = 0; i < len; i++) {
      const u1 = units[i];
      if (u1.isFlying) continue; // Flying Chinooks don't collide on ground

      let pushX = 0;
      let pushY = 0;
      let neighbors = 0;
      const avoidDist = u1.radius * 2.2;
      const avoidDistSq = avoidDist * avoidDist;

      for (let j = 0; j < len; j++) {
        if (i === j) continue;
        const u2 = units[j];
        if (u2.isFlying) continue;

        const dx = u1.x - u2.x;
        const dy = u1.y - u2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < avoidDistSq) {
          const dist = Math.sqrt(distSq);
          const force = (avoidDist - dist) / avoidDist;
          pushX += (dx / dist) * force * 1.5;
          pushY += (dy / dist) * force * 1.5;
          neighbors++;
        }
      }

      if (neighbors > 0) {
        u1.x += pushX;
        u1.y += pushY;
      }
    }
  }

  // Update Horde bonus for China units (4+ units within 100px)
  static updateHordeBonus(units: Unit[]): void {
    const chinaUnits = units.filter(u => u.faction === 'China' && !u.isFlying);
    const len = chinaUnits.length;

    for (let i = 0; i < len; i++) {
      const u1 = chinaUnits[i];
      let nearbyCount = 1;

      for (let j = 0; j < len; j++) {
        if (i === j) continue;
        const u2 = chinaUnits[j];
        if (Math.hypot(u1.x - u2.x, u1.y - u2.y) <= 100) {
          nearbyCount++;
        }
      }

      u1.isHordeBoosted = nearbyCount >= 4;
    }
  }

  // Update units movement, gathering, self-healing, and combat
  static updateUnits(
    units: Unit[],
    buildings: Building[],
    supplyDocks: SupplyDock[],
    projectiles: Projectile[],
    particles: Particle[],
    salvageCrates: SalvageCrate[],
    onAddCash: (amount: number, team: 'player' | 'enemy') => void,
    audioEnabled = true
  ): void {
    const now = Date.now();

    units.forEach(u => {
      // 1. Self-healing for Elite (Level 2) and Heroic (Level 3)
      if (u.veterancy >= 2 && u.hp < u.maxHp) {
        u.hp = Math.min(u.maxHp, u.hp + 0.08); // Steady self-heal
      }

      // 2. Rotor animation for flying units
      if (u.isFlying) {
        u.rotorAngle = (u.rotorAngle || 0) + 0.35;
      }

      // 3. Movement
      if (u.targetX !== null && u.targetY !== null) {
        const dx = u.targetX - u.x;
        const dy = u.targetY - u.y;
        const dist = Math.hypot(dx, dy);

        if (dist > u.speed) {
          u.bodyAngle = Math.atan2(dy, dx);
          u.x += (dx / dist) * u.speed;
          u.y += (dy / dist) * u.speed;
        } else {
          u.x = u.targetX;
          u.y = u.targetY;
          u.targetX = null;
          u.targetY = null;
        }
      }

      // 4. Resource collection (Supply Chinook, China Truck, GLA Worker)
      if (u.range === 0) {
        const closestDock = supplyDocks[0]; // Nearest dock
        const friendlyHQ = buildings.find(b => b.team === u.team && b.type.includes('HQ'));

        if (closestDock && friendlyHQ) {
          const dockCX = closestDock.x + closestDock.width / 2;
          const dockCY = closestDock.y + closestDock.height / 2;
          const hqCX = friendlyHQ.x + friendlyHQ.width / 2;
          const hqCY = friendlyHQ.y + friendlyHQ.height / 2;

          const distDock = Math.hypot(u.x - dockCX, u.y - dockCY);
          const distHQ = Math.hypot(u.x - hqCX, u.y - hqCY);

          if (u.carrying === 0) {
            if (distDock < 65) {
              const amount = u.type === 'SupplyChinook' ? 140 : u.type === 'SupplyTruck_China' ? 120 : 100;
              u.carrying = amount;
              u.targetX = hqCX;
              u.targetY = hqCY;
            } else if (u.targetX === null) {
              u.targetX = dockCX;
              u.targetY = dockCY;
            }
          } else {
            if (distHQ < 75) {
              onAddCash(u.carrying, u.team);
              if (u.team === 'player') playCashSound(audioEnabled);
              u.carrying = 0;
              u.targetX = dockCX;
              u.targetY = dockCY;
            } else if (u.targetX === null) {
              u.targetX = hqCX;
              u.targetY = hqCY;
            }
          }
        }
      }

      // 5. GLA Salvage collection
      if (u.faction === 'GLA') {
        for (let i = salvageCrates.length - 1; i >= 0; i--) {
          const crate = salvageCrates[i];
          if (Math.hypot(u.x - crate.x, u.y - crate.y) < u.radius + 14) {
            onAddCash(75, u.team);
            if (u.team === 'player') playCashSound(audioEnabled);
            u.salvageLevel = Math.min(2, (u.salvageLevel || 0) + 1);

            // Level 1: boost HP & max HP
            if (u.salvageLevel === 1) {
              u.maxHp = Math.round(u.maxHp * 1.25);
              u.hp = Math.min(u.maxHp, u.hp + 100);
            }
            salvageCrates.splice(i, 1);
          }
        }
      }

      // 6. Paladin Point Defense Laser
      if (u.type === 'Paladin') {
        if (!u.pdlCooldown) u.pdlCooldown = 0;
        if (now > u.pdlCooldown) {
          const enemyTeam = u.team === 'player' ? 'enemy' : 'player';
          const incoming = projectiles.find(
            p => p.team === enemyTeam && Math.hypot(p.x - u.x, p.y - u.y) < 140
          );
          if (incoming) {
            incoming.damage = 0; // Vaporize projectile
            u.pdlCooldown = now + 3000; // 3 second cooldown
            playLaserBeam(audioEnabled);
            // Spawn little zap spark
            particles.push({
              x: incoming.x,
              y: incoming.y,
              vx: 0,
              vy: 0,
              radius: 6,
              color: '#38bdf8',
              alpha: 1.0,
              decay: 0.1
            });
          }
        }
      }

      // 7. Combat & Auto-Targeting
      if (u.range > 0) {
        const enemyTeam = u.team === 'player' ? 'enemy' : 'player';
        const enemies = [
          ...units.filter(e => e.team === enemyTeam && e.hp > 0),
          ...buildings.filter(b => b.team === enemyTeam && b.hp > 0).map(b => ({
            id: b.id,
            team: b.team,
            faction: b.faction,
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
            hp: b.hp,
            maxHp: b.maxHp,
            radius: b.width / 2,
            isBuilding: true
          }))
        ];

        let target: any = null;
        let minDist = u.range;

        for (const e of enemies) {
          const d = Math.hypot(e.x - u.x, e.y - u.y);
          if (d <= minDist) {
            minDist = d;
            target = e;
          }
        }

        if (target) {
          u.turretAngle = Math.atan2(target.y - u.y, target.x - u.x);

          // Calculate effective fire rate (Horde bonus gives -25% delay)
          let effectiveRate = u.fireRate;
          if (u.isHordeBoosted) effectiveRate = Math.round(effectiveRate * 0.75);
          if (u.type === 'GattlingTank') {
            u.spinUpLevel = Math.min(3, (u.spinUpLevel || 0) + 0.05);
            effectiveRate = Math.round(effectiveRate / (1 + (u.spinUpLevel || 0) * 0.35));
          }

          if (now - u.lastShot >= effectiveRate) {
            u.lastShot = now;

            // Damage multiplier from veterancy
            let dmg = u.damage;
            if (u.veterancy === 1) dmg = Math.round(dmg * 1.15);
            else if (u.veterancy === 2) dmg = Math.round(dmg * 1.3);
            else if (u.veterancy === 3) dmg = Math.round(dmg * 1.5);

            // Spawn projectile
            const muzzleX = u.x + Math.cos(u.turretAngle) * (u.radius + 6);
            const muzzleY = u.y + Math.sin(u.turretAngle) * (u.radius + 6);

            const isHeavy = u.type === 'Overlord' || u.type === 'Crusader' || u.type === 'Marauder';
            const isGattling = u.type === 'GattlingTank';

            projectiles.push({
              id: Date.now() + Math.random(),
              x: muzzleX,
              y: muzzleY,
              tx: target.x,
              ty: target.y,
              speed: isHeavy ? 9.0 : 10.5,
              damage: dmg,
              team: u.team,
              faction: u.faction,
              isHeavy,
              isTracer: u.veterancy === 3 || isGattling,
              isRocket: u.type === 'Scorpion' && Math.random() < 0.4
            });

            if (isGattling) playGatlingFire(audioEnabled);
            else if (isHeavy) playCannonShot(true, audioEnabled);
            else playCannonShot(false, audioEnabled);
          }
        } else {
          if (u.spinUpLevel) u.spinUpLevel = Math.max(0, u.spinUpLevel - 0.04);
        }
      }
    });

    // Automated Defense Towers (Patriot, Gatling Cannon, Stinger Site)
    this.updateDefenseBuildings(buildings, units, projectiles, audioEnabled);
  }

  // Update Automated Defense Towers
  static updateDefenseBuildings(
    buildings: Building[],
    units: Unit[],
    projectiles: Projectile[],
    audioEnabled = true
  ): void {
    const now = Date.now();
    buildings.forEach(b => {
      if (!b.isCompleted || b.hp <= 0 || !b.isDefense || !b.range || !b.damage) return;
      const enemyTeam = b.team === 'player' ? 'enemy' : 'player';
      const bCenterX = b.x + b.width / 2;
      const bCenterY = b.y + b.height / 2;

      let targetUnit: Unit | null = null;
      let minDist = b.range;
      for (const u of units) {
        if (u.team === enemyTeam && u.hp > 0) {
          const d = Math.hypot(u.x - bCenterX, u.y - bCenterY);
          if (d <= minDist) {
            minDist = d;
            targetUnit = u;
          }
        }
      }

      if (targetUnit) {
        const rate = b.fireRate || 1000;
        if (now - (b.lastShot || 0) >= rate) {
          b.lastShot = now;
          const isRocket = b.type.includes('Patriot') || b.type.includes('Stinger');
          projectiles.push({
            id: Date.now() + Math.random(),
            x: bCenterX,
            y: bCenterY,
            tx: targetUnit.x,
            ty: targetUnit.y,
            speed: isRocket ? 8.5 : 9.5,
            damage: b.damage,
            team: b.team,
            faction: b.faction,
            isRocket,
            isHeavy: isRocket,
            isTracer: !isRocket
          });

          if (isRocket) {
            playCannonShot(false, audioEnabled);
          } else {
            playGatlingFire(audioEnabled);
          }
        }
      }
    });
  }

  // Projectiles update & damage application
  static updateProjectiles(
    projectiles: Projectile[],
    units: Unit[],
    buildings: Building[],
    particles: Particle[],
    salvageCrates: SalvageCrate[],
    audioEnabled = true
  ): void {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p.damage <= 0) {
        projectiles.splice(i, 1);
        continue;
      }

      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= p.speed) {
        // Detonate at target
        const blastRadius = p.isHeavy ? 26 : 14;
        const enemyTeam = p.team === 'player' ? 'enemy' : 'player';

        // Hit units
        units.forEach(u => {
          if (u.team === enemyTeam && Math.hypot(u.x - p.tx, u.y - p.ty) <= u.radius + blastRadius) {
            u.hp -= p.damage;
            if (u.hp <= 0) {
              // Tank destroyed! Drop salvage crate
              salvageCrates.push({
                id: Date.now() + Math.random(),
                x: u.x,
                y: u.y,
                life: 600 // lasts 10 seconds
              });
            }
          }
        });

        // Hit buildings
        buildings.forEach(b => {
          if (
            b.team === enemyTeam &&
            p.tx >= b.x - blastRadius &&
            p.tx <= b.x + b.width + blastRadius &&
            p.ty >= b.y - blastRadius &&
            p.ty <= b.y + b.height + blastRadius
          ) {
            b.hp -= p.damage;

            // Nuclear reactor fallout
            if (b.hp <= 0 && b.type === 'China_Reactor') {
              playExplosion('large', audioEnabled);
              for (let n = 0; n < 20; n++) {
                const ang = Math.random() * Math.PI * 2;
                particles.push({
                  x: b.x + b.width / 2,
                  y: b.y + b.height / 2,
                  vx: Math.cos(ang) * 3,
                  vy: Math.sin(ang) * 3,
                  radius: 8,
                  color: '#22c55e',
                  alpha: 1.0,
                  decay: 0.02
                });
              }
            }
          }
        });

        // Spawn explosion particles
        playExplosion(p.isHeavy ? 'large' : 'small', audioEnabled);
        for (let pt = 0; pt < (p.isHeavy ? 14 : 7); pt++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = Math.random() * 3 + 1;
          particles.push({
            x: p.tx,
            y: p.ty,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: Math.random() * 4 + 2,
            color: p.isTracer ? '#ef4444' : Math.random() > 0.5 ? '#f59e0b' : '#ff4d4d',
            alpha: 1.0,
            decay: 0.03
          });
        }

        projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }
    }
  }
}

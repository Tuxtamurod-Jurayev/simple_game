import React, { useEffect, useRef, useState } from 'react';
import {
  Unit,
  Building,
  SupplyDock,
  Projectile,
  Particle,
  TreadTrack,
  BurningWreck,
  FloatingText,
  ClickMarker,
  Entity,
  BuildingType,
  UnitType,
  isBuilding
} from '../types/game';
import { playSound } from '../utils/audio';

interface GameCanvasProps {
  money: number;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
  energy: number;
  setEnemyHqHp: (hp: number) => void;
  selectedUnits: Unit[];
  setSelectedUnits: (units: Unit[]) => void;
  selectedBuilding: Building | null;
  setSelectedBuilding: (b: Building | null) => void;
  audioEnabled: boolean;
  onNotify: (msg: string, type?: 'normal' | 'danger' | 'success') => void;
  onGameOver: (victory: boolean) => void;
  buildQueue: BuildingType | null;
  setBuildQueue: (b: BuildingType | null) => void;
  trainQueue: UnitType | null;
  setTrainQueue: (u: UnitType | null) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  money,
  setMoney,
  setEnemyHqHp,
  selectedUnits,
  setSelectedUnits,
  selectedBuilding,
  setSelectedBuilding,
  audioEnabled,
  onNotify,
  onGameOver,
  buildQueue,
  setBuildQueue,
  trainQueue,
  setTrainQueue
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarRef = useRef<HTMLCanvasElement | null>(null);

  // Drag selection state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  // Entities and game objects managed via refs for 60fps performance
  const unitsRef = useRef<Unit[]>([
    {
      id: 101,
      type: 'Worker',
      team: 'player',
      name: 'Supply Truck (Yuk mashinasi)',
      icon: '🚛',
      x: 220,
      y: 260,
      radius: 15,
      hp: 200,
      maxHp: 200,
      speed: 2.2,
      targetX: null,
      targetY: null,
      range: 0,
      damage: 0,
      lastShot: 0,
      carrying: 0,
      hullAngle: 0,
      turretAngle: 0,
      recoil: 0,
      walkPhase: 0
    },
    {
      id: 102,
      type: 'Tank',
      team: 'player',
      name: 'Crusader Tank',
      icon: '🛡️',
      x: 220,
      y: 340,
      radius: 18,
      hp: 500,
      maxHp: 500,
      speed: 1.5,
      targetX: null,
      targetY: null,
      range: 155,
      damage: 32,
      lastShot: 0,
      carrying: 0,
      hullAngle: 0,
      turretAngle: 0,
      recoil: 0,
      walkPhase: 0
    },
    {
      id: 201,
      type: 'Tank',
      team: 'enemy',
      name: 'GLA Scorpion Tank',
      icon: '⚔️',
      x: 770,
      y: 290,
      radius: 18,
      hp: 440,
      maxHp: 440,
      speed: 1.4,
      targetX: null,
      targetY: null,
      range: 145,
      damage: 24,
      lastShot: 0,
      carrying: 0,
      hullAngle: Math.PI,
      turretAngle: Math.PI,
      recoil: 0,
      walkPhase: 0
    }
  ]);

  const buildingsRef = useRef<Building[]>([
    {
      id: 1,
      type: 'HQ',
      team: 'player',
      name: 'USA Command Center',
      icon: '🏛️',
      x: 80,
      y: 245,
      width: 105,
      height: 95,
      hp: 2200,
      maxHp: 2200,
      radarAngle: 0
    },
    {
      id: 2,
      type: 'EnemyHQ',
      team: 'enemy',
      name: 'GLA Command Outpost',
      icon: '🏰',
      x: 840,
      y: 245,
      width: 105,
      height: 95,
      hp: 1800,
      maxHp: 1800,
      radarAngle: 0
    }
  ]);

  const supplyDocksRef = useRef<SupplyDock[]>([
    {
      id: 1,
      x: 512,
      y: 310,
      width: 110,
      height: 80,
      supplies: 15000,
      maxSupplies: 15000
    }
  ]);

  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const treadTracksRef = useRef<TreadTrack[]>([]);
  const burningWrecksRef = useRef<BurningWreck[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const clickMarkersRef = useRef<ClickMarker[]>([]);

  // Process production queues
  useEffect(() => {
    if (!buildQueue) return;
    const type = buildQueue;
    setBuildQueue(null);

    let cost = 0;
    let name = '';
    let icon = '';
    let w = 85, h = 80;
    let hp = 700;

    if (type === 'Barracks') {
      cost = 500;
      name = 'Barracks (Kazarma)';
      icon = '⛺';
      hp = 700;
      w = 90; h = 75;
    } else if (type === 'WarFactory') {
      cost = 800;
      name = 'War Factory (Zavod)';
      icon = '🏭';
      hp = 1100;
      w = 110; h = 88;
    }

    if (money < cost) {
      onNotify(`Mablag' yetarli emas! ${name} uchun $${cost} lozim.`, 'danger');
      return;
    }

    setMoney(prev => prev - cost);
    const px = 180 + Math.random() * 120;
    const py = 120 + Math.random() * 320;

    buildingsRef.current.push({
      id: Date.now(),
      type,
      team: 'player',
      name,
      icon,
      x: px,
      y: py,
      width: w,
      height: h,
      hp,
      maxHp: hp
    });

    playSound('build', audioEnabled);
    onNotify(`${name} qurildi! (-$${cost})`, 'success');
  }, [buildQueue, money, audioEnabled]);

  useEffect(() => {
    if (!trainQueue) return;
    const type = trainQueue;
    setTrainQueue(null);

    let cost = 0;
    let name = '';
    let icon = '';

    if (type === 'Worker') {
      cost = 200;
      name = 'Supply Truck (Yuk mashinasi)';
      icon = '🚛';
    } else if (type === 'Ranger') {
      cost = 150;
      name = 'US Ranger (Mergan askar)';
      icon = '🎖️';
      const hasBarracks = buildingsRef.current.some(b => b.team === 'player' && b.type === 'Barracks');
      if (!hasBarracks) {
        onNotify("Askar chiqarish uchun avval Kazarma (Barracks) quring!", 'danger');
        return;
      }
    } else if (type === 'Tank') {
      cost = 600;
      name = 'Crusader Tank';
      icon = '🛡️';
      const hasFactory = buildingsRef.current.some(b => b.team === 'player' && (b.type === 'WarFactory' || b.type === 'HQ'));
      if (!hasFactory) {
        onNotify("Tank chiqarish uchun Baza yoki Zavod kerak!", 'danger');
        return;
      }
    }

    if (money < cost) {
      onNotify(`Mablag' yetarli emas! ${name} uchun $${cost} lozim.`, 'danger');
      return;
    }

    setMoney(prev => prev - cost);

    let sx = 180;
    let sy = 280;
    if (type === 'Ranger') {
      const b = buildingsRef.current.find(b => b.team === 'player' && b.type === 'Barracks') || buildingsRef.current[0];
      sx = b.x + b.width + 12;
      sy = b.y + b.height / 2;
    } else if (type === 'Tank') {
      const f = buildingsRef.current.find(b => b.team === 'player' && b.type === 'WarFactory') || buildingsRef.current[0];
      sx = f.x + f.width + 16;
      sy = f.y + f.height / 2;
    }

    const newUnit: Unit = {
      id: Date.now(),
      type,
      team: 'player',
      name,
      icon,
      x: sx,
      y: sy + (Math.random() * 40 - 20),
      radius: type === 'Tank' ? 18 : (type === 'Worker' ? 15 : 10),
      hp: type === 'Tank' ? 500 : (type === 'Worker' ? 200 : 130),
      maxHp: type === 'Tank' ? 500 : (type === 'Worker' ? 200 : 130),
      speed: type === 'Tank' ? 1.5 : (type === 'Worker' ? 2.2 : 1.9),
      targetX: null,
      targetY: null,
      range: type === 'Tank' ? 155 : (type === 'Ranger' ? 120 : 0),
      damage: type === 'Tank' ? 32 : (type === 'Ranger' ? 12 : 0),
      lastShot: 0,
      carrying: 0,
      hullAngle: 0,
      turretAngle: 0,
      recoil: 0,
      walkPhase: 0
    };

    unitsRef.current.push(newUnit);
    playSound('select', audioEnabled);
    onNotify(`${name} jangga tayyor! (-$${cost})`, 'success');
  }, [trainQueue, money, audioEnabled]);

  // AI wave controller
  useEffect(() => {
    const aiInterval = setInterval(() => {
      const enemyHQ = buildingsRef.current.find(b => b.team === 'enemy' && b.type === 'EnemyHQ');
      if (!enemyHQ) return;

      const enemyUnits = unitsRef.current.filter(u => u.team === 'enemy');
      if (enemyUnits.length < 8) {
        const isTank = Math.random() > 0.35;
        unitsRef.current.push({
          id: Date.now() + Math.random(),
          type: isTank ? 'Tank' : 'Ranger',
          team: 'enemy',
          name: isTank ? 'GLA Scorpion Tank' : 'GLA Rebel Soldier',
          icon: isTank ? '⚔️' : '💀',
          x: enemyHQ.x - 25,
          y: enemyHQ.y + Math.random() * enemyHQ.height,
          radius: isTank ? 18 : 10,
          hp: isTank ? 440 : 120,
          maxHp: isTank ? 440 : 120,
          speed: isTank ? 1.4 : 1.8,
          targetX: null,
          targetY: null,
          range: isTank ? 145 : 110,
          damage: isTank ? 25 : 10,
          lastShot: 0,
          carrying: 0,
          hullAngle: Math.PI,
          turretAngle: Math.PI,
          recoil: 0,
          walkPhase: 0
        });
      }

      // Order enemy units to attack closest player target
      const playerTargets: Entity[] = [
        ...buildingsRef.current.filter(b => b.team === 'player'),
        ...unitsRef.current.filter(u => u.team === 'player')
      ];

      if (playerTargets.length > 0) {
        for (const eu of unitsRef.current.filter(u => u.team === 'enemy')) {
          let closest: { x: number; y: number } | null = null;
          let minDist = Infinity;
          for (const pt of playerTargets) {
            const cx = isBuilding(pt) ? pt.x + pt.width / 2 : pt.x;
            const cy = isBuilding(pt) ? pt.y + pt.height / 2 : pt.y;
            const d = Math.hypot(cx - eu.x, cy - eu.y);
            if (d < minDist) {
              minDist = d;
              closest = { x: cx, y: cy };
            }
          }
          if (closest) {
            eu.targetX = closest.x;
            eu.targetY = closest.y;
          }
        }
      }
    }, 4000);

    return () => clearInterval(aiInterval);
  }, []);

  // Main Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const radar = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const radarCtx = radar ? radar.getContext('2d') : null;
    let animId: number;

    const gameLoop = () => {
      if (!ctx) return;

      const playerHQ = buildingsRef.current.find(b => b.team === 'player' && b.type === 'HQ');
      const enemyHQ = buildingsRef.current.find(b => b.team === 'enemy' && b.type === 'EnemyHQ');

      if (enemyHQ) {
        setEnemyHqHp(enemyHQ.hp);
      } else {
        setEnemyHqHp(0);
        onGameOver(true);
      }

      if (!playerHQ) {
        onGameOver(false);
      }

      // Rotate radar dishes
      buildingsRef.current.forEach(b => {
        if (b.radarAngle !== undefined) b.radarAngle += 0.04;
      });

      // 1. UPDATE LOGIC
      // Units movement & combat
      unitsRef.current.forEach(u => {
        if (u.recoil > 0) u.recoil -= 0.5;

        // Move
        if (u.targetX !== null && u.targetY !== null) {
          const dx = u.targetX - u.x;
          const dy = u.targetY - u.y;
          const dist = Math.hypot(dx, dy);

          if (dist > u.speed) {
            u.hullAngle = Math.atan2(dy, dx);
            u.x += (dx / dist) * u.speed;
            u.y += (dy / dist) * u.speed;
            u.walkPhase += 0.25;

            // Tread tracks
            if (u.type === 'Tank' || u.type === 'Worker') {
              if (Math.random() < 0.22) {
                treadTracksRef.current.push({
                  x: u.x,
                  y: u.y,
                  angle: u.hullAngle,
                  isTank: u.type === 'Tank',
                  alpha: 0.35
                });
              }
            }
          } else {
            u.x = u.targetX;
            u.y = u.targetY;
            u.targetX = null;
            u.targetY = null;
          }
        }

        // Supply Truck autonomous resource cycle
        if (u.type === 'Worker' && u.team === 'player') {
          const dock = supplyDocksRef.current[0];
          const hq = playerHQ;
          if (dock && hq) {
            const dockCX = dock.x + dock.width / 2;
            const dockCY = dock.y + dock.height / 2;
            const hqCX = hq.x + hq.width / 2;
            const hqCY = hq.y + hq.height / 2;

            const distToDock = Math.hypot(u.x - dockCX, u.y - dockCY);
            const distToHQ = Math.hypot(u.x - hqCX, u.y - hqCY);

            if (u.carrying === 0) {
              if (distToDock < 65) {
                if (dock.supplies > 0) {
                  u.carrying = 100;
                  dock.supplies -= 100;
                  floatingTextsRef.current.push({
                    x: u.x,
                    y: u.y - 12,
                    text: '+100$ Crates',
                    color: '#ffd152',
                    alpha: 1.0,
                    vy: -1.0
                  });
                  u.targetX = hqCX;
                  u.targetY = hqCY;
                }
              } else if (u.targetX === null) {
                u.targetX = dockCX;
                u.targetY = dockCY;
              }
            } else {
              if (distToHQ < 65) {
                setMoney(prev => prev + u.carrying);
                floatingTextsRef.current.push({
                  x: hqCX,
                  y: hq.y - 15,
                  text: `+$${u.carrying}`,
                  color: '#2ecc71',
                  alpha: 1.0,
                  vy: -1.0
                });
                playSound('cash', audioEnabled);
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

        // Auto Combat
        if (u.range > 0) {
          const enemyTeam = u.team === 'player' ? 'enemy' : 'player';

          // Target units
          let target: Entity | undefined = unitsRef.current.find(
            enemy => enemy.team === enemyTeam && Math.hypot(enemy.x - u.x, enemy.y - u.y) <= u.range
          );

          // Target buildings if no units
          if (!target) {
            target = buildingsRef.current.find(b => {
              if (b.team !== enemyTeam) return false;
              const cx = b.x + b.width / 2;
              const cy = b.y + b.height / 2;
              return Math.hypot(cx - u.x, cy - u.y) <= u.range + b.width / 2;
            });
          }

          if (target) {
            const tx = isBuilding(target) ? target.x + target.width / 2 : target.x;
            const ty = isBuilding(target) ? target.y + target.height / 2 : target.y;

            u.turretAngle = Math.atan2(ty - u.y, tx - u.x);
            const now = Date.now();
            const fireRate = u.type === 'Tank' ? 1400 : 750;

            if (now - u.lastShot > fireRate) {
              u.lastShot = now;
              u.recoil = 6.0;

              projectilesRef.current.push({
                x: u.x + Math.cos(u.turretAngle) * 16,
                y: u.y + Math.sin(u.turretAngle) * 16,
                tx,
                ty,
                target,
                speed: u.type === 'Tank' ? 7.5 : 9.5,
                damage: u.damage,
                team: u.team,
                isCannon: u.type === 'Tank'
              });

              if (u.type === 'Tank') {
                playSound('cannon', audioEnabled);
              } else {
                playSound('rifle', audioEnabled);
              }
            }
          } else {
            u.turretAngle = u.hullAngle;
          }
        }
      });

      // Projectiles update
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        if (p.target && p.target.hp > 0) {
          p.tx = isBuilding(p.target) ? p.target.x + p.target.width / 2 : p.target.x;
          p.ty = isBuilding(p.target) ? p.target.y + p.target.height / 2 : p.target.y;
        }

        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= p.speed) {
          if (p.target && p.target.hp > 0) {
            p.target.hp -= p.damage;
            // Particles
            for (let j = 0; j < (p.isCannon ? 10 : 4); j++) {
              const ang = Math.random() * Math.PI * 2;
              particlesRef.current.push({
                x: p.tx,
                y: p.ty,
                vx: Math.cos(ang) * 2,
                vy: Math.sin(ang) * 2,
                size: Math.random() * 3 + 1,
                color: '#ff9800',
                alpha: 1.0,
                fade: 0.03
              });
            }

            floatingTextsRef.current.push({
              x: p.tx,
              y: p.ty - 10,
              text: `-${p.damage}`,
              color: '#ff4d4d',
              alpha: 1.0,
              vy: -1.0
            });

            if (p.target.hp <= 0) {
              playSound('explosion', audioEnabled);
              burningWrecksRef.current.push({
                x: p.tx,
                y: p.ty,
                type: 'type' in p.target ? (p.target as Unit).type : 'building',
                life: 300,
                color: p.target.team === 'player' ? '#2980b9' : '#c0392b'
              });
              onNotify(`${p.target.name} yo'q qilindi!`, 'danger');
            }
          }
          projectilesRef.current.splice(i, 1);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }
      }

      // Cleanup destroyed entities
      unitsRef.current = unitsRef.current.filter(u => u.hp > 0);
      buildingsRef.current = buildingsRef.current.filter(b => b.hp > 0);

      // 2. RENDER CANVAS
      ctx.fillStyle = '#152216';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(70, 115, 70, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Tread tracks
      for (let i = treadTracksRef.current.length - 1; i >= 0; i--) {
        const t = treadTracksRef.current[i];
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillStyle = `rgba(10, 18, 11, ${t.alpha})`;
        if (t.isTank) {
          ctx.fillRect(-6, -11, 12, 4);
          ctx.fillRect(-6, 7, 12, 4);
        } else {
          ctx.fillRect(-4, -8, 8, 3);
          ctx.fillRect(-4, 5, 8, 3);
        }
        ctx.restore();
        t.alpha -= 0.0008;
        if (t.alpha <= 0) treadTracksRef.current.splice(i, 1);
      }

      // Burning wrecks
      for (let i = burningWrecksRef.current.length - 1; i >= 0; i--) {
        const w = burningWrecksRef.current[i];
        ctx.fillStyle = '#161616';
        ctx.beginPath();
        ctx.arc(w.x, w.y, 14, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() < 0.3) {
          particlesRef.current.push({
            x: w.x + (Math.random() * 12 - 6),
            y: w.y + (Math.random() * 12 - 6),
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.5 - 0.5,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#ff5722' : '#333333',
            alpha: 0.8,
            fade: 0.03
          });
        }
        w.life--;
        if (w.life <= 0) burningWrecksRef.current.splice(i, 1);
      }

      // Supply Dock
      supplyDocksRef.current.forEach(d => {
        ctx.save();
        ctx.fillStyle = '#1e2b20';
        ctx.fillRect(d.x, d.y, d.width, d.height);
        ctx.strokeStyle = '#344e39';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.width, d.height);

        // ISO Containers
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(d.x + 8, d.y + 10, 42, 22);
        ctx.fillStyle = '#0d47a1';
        ctx.fillRect(d.x + 58, d.y + 10, 44, 22);
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(d.x + 20, d.y + 40, 52, 24);

        // Crane
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(d.x + d.width - 24, d.y + 42, 16, 26);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SUPPLY DOCK', d.x + d.width / 2, d.y - 8);
        ctx.fillStyle = '#ffd152';
        ctx.font = 'bold 10px Consolas, monospace';
        ctx.fillText(`$${d.supplies} qoldi`, d.x + d.width / 2, d.y + d.height + 14);
        ctx.restore();
      });

      // Buildings
      buildingsRef.current.forEach(b => {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x + 6, b.y + 6, b.width, b.height);

        if (b.type.includes('HQ')) {
          ctx.fillStyle = b.team === 'player' ? '#213824' : '#471f1f';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.strokeStyle = b.team === 'player' ? '#3d6e42' : '#853939';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // Helipad
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.strokeStyle = '#ffd152';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffd152';
          ctx.font = 'bold 16px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', cx, cy);

          // Radar
          const rX = b.x + b.width - 20;
          const rY = b.y + 20;
          ctx.strokeStyle = '#55d45c';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(rX, rY, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(rX, rY);
          ctx.lineTo(rX + Math.cos(b.radarAngle || 0) * 10, rY + Math.sin(b.radarAngle || 0) * 10);
          ctx.stroke();
        } else if (b.type === 'WarFactory') {
          ctx.fillStyle = '#29332b';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.strokeStyle = '#536b57';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // Bay doors
          ctx.fillStyle = '#161c17';
          ctx.fillRect(b.x + 15, b.y + b.height - 24, b.width - 30, 24);
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 3;
          for (let i = b.x + 15; i < b.x + b.width - 15; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, b.y + b.height - 6);
            ctx.lineTo(i + 6, b.y + b.height);
            ctx.stroke();
          }
          ctx.fillStyle = '#9ee3a7';
          ctx.font = 'bold 10px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('WAR FACTORY', b.x + b.width / 2, b.y + 35);
        } else {
          // Barracks
          ctx.fillStyle = '#3d3021';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.strokeStyle = '#755b3e';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          ctx.fillStyle = '#ffbe6b';
          ctx.font = 'bold 10px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BARRACKS', b.x + b.width / 2, b.y + 20);
        }

        // Selected outline
        if (selectedBuilding?.id === b.id) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
          ctx.setLineDash([]);
        }

        // HP Bar
        const hpPct = Math.max(0, b.hp / b.maxHp);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(b.x, b.y - 12, b.width, 5);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(b.x, b.y - 12, b.width * hpPct, 5);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(b.x, b.y - 12, b.width, 5);
        ctx.restore();
      });

      // Units
      unitsRef.current.forEach(u => {
        const isSelected = selectedUnits.some(su => su.id === u.id);
        ctx.save();
        ctx.translate(u.x, u.y);

        // Selection circle & range
        if (isSelected) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, u.radius + 6, 0, Math.PI * 2);
          ctx.stroke();

          if (u.range > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, u.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Tank Model
        if (u.type === 'Tank') {
          // Hull
          ctx.save();
          ctx.rotate(u.hullAngle);
          ctx.fillStyle = '#1e1f1e';
          ctx.fillRect(-u.radius, -u.radius + 1, u.radius * 2, 5);
          ctx.fillRect(-u.radius, u.radius - 6, u.radius * 2, 5);

          const baseColor = u.team === 'player' ? '#2b5a32' : '#822424';
          ctx.fillStyle = baseColor;
          ctx.fillRect(-u.radius + 3, -u.radius + 5, u.radius * 2 - 6, u.radius * 2 - 10);
          ctx.restore();

          // Turret
          ctx.save();
          ctx.rotate(u.turretAngle);
          const barrelOffset = -u.recoil;
          ctx.fillStyle = '#1c1c1c';
          ctx.fillRect(2 + barrelOffset, -2.5, 18, 5);
          ctx.fillStyle = u.team === 'player' ? '#346d3c' : '#992d2d';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (u.type === 'Worker') {
          // Supply Truck
          ctx.save();
          ctx.rotate(u.hullAngle);
          ctx.fillStyle = '#1b1b1b';
          ctx.fillRect(-u.radius, -u.radius + 1, 7, 3);
          ctx.fillRect(-u.radius, u.radius - 4, 7, 3);
          ctx.fillRect(-2, -u.radius + 1, 7, 3);
          ctx.fillRect(-2, u.radius - 4, 7, 3);
          ctx.fillRect(u.radius - 8, -u.radius + 1, 7, 3);
          ctx.fillRect(u.radius - 8, u.radius - 4, 7, 3);

          ctx.fillStyle = '#26422b';
          ctx.fillRect(-u.radius + 2, -u.radius + 3, u.radius * 1.3, u.radius * 2 - 6);
          ctx.fillStyle = '#3a663e';
          ctx.fillRect(u.radius * 0.3, -u.radius + 4, u.radius * 0.7, u.radius * 2 - 8);

          // Crates
          if (u.carrying > 0) {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(-u.radius + 4, -u.radius + 5, 7, 7);
            ctx.fillRect(-u.radius + 4, 0, 7, 7);
          }
          ctx.restore();
        } else {
          // Ranger
          ctx.save();
          ctx.rotate(u.turretAngle || u.hullAngle);
          const legOffset = Math.sin(u.walkPhase) * 3;
          ctx.fillStyle = '#1e241e';
          ctx.fillRect(-4, -6 + legOffset, 4, 3);
          ctx.fillRect(-4, 3 - legOffset, 4, 3);

          ctx.fillStyle = u.team === 'player' ? '#2e6b36' : '#853232';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = u.team === 'player' ? '#468f50' : '#b04343';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#111';
          ctx.fillRect(2, -1.5, 11, 3);
          ctx.restore();
        }

        ctx.restore();

        // HP Bar
        const hpPct = Math.max(0, u.hp / u.maxHp);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, u.radius * 2, 3);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(u.x - u.radius, u.y - u.radius - 8, (u.radius * 2) * hpPct, 3);
      });

      // Projectiles
      projectilesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isCannon ? 3.5 : 2.0, 0, Math.PI * 2);
        ctx.fillStyle = p.team === 'player' ? '#ffe066' : '#ff7675';
        ctx.fill();
      });

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.fade;
        if (p.alpha <= 0) particlesRef.current.splice(i, 1);
      }

      // Floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y += ft.vy;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) floatingTextsRef.current.splice(i, 1);
      }

      // Click markers
      for (let i = clickMarkersRef.current.length - 1; i >= 0; i--) {
        const m = clickMarkersRef.current[i];
        ctx.save();
        ctx.strokeStyle = `rgba(85, 212, 92, ${m.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        m.radius += 0.8;
        m.alpha -= 0.04;
        if (m.alpha <= 0) clickMarkersRef.current.splice(i, 1);
      }

      // DRAG SELECTION BOX
      if (dragState.isDragging) {
        const minX = Math.min(dragState.startX, dragState.currentX);
        const minY = Math.min(dragState.startY, dragState.currentY);
        const w = Math.abs(dragState.currentX - dragState.startX);
        const h = Math.abs(dragState.currentY - dragState.startY);

        ctx.save();
        ctx.fillStyle = 'rgba(46, 204, 113, 0.12)';
        ctx.fillRect(minX, minY, w, h);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(minX, minY, w, h);
        ctx.restore();
      }

      // RADAR MINIMAP
      if (radarCtx && radar) {
        radarCtx.fillStyle = '#0f1710';
        radarCtx.fillRect(0, 0, radar.width, radar.height);

        const scaleX = radar.width / canvas.width;
        const scaleY = radar.height / canvas.height;

        supplyDocksRef.current.forEach(d => {
          radarCtx.fillStyle = '#f39c12';
          radarCtx.fillRect(d.x * scaleX, d.y * scaleY, d.width * scaleX, d.height * scaleY);
        });

        buildingsRef.current.forEach(b => {
          radarCtx.fillStyle = b.team === 'player' ? '#2ecc71' : '#e74c3c';
          radarCtx.fillRect(b.x * scaleX, b.y * scaleY, b.width * scaleX, b.height * scaleY);
        });

        unitsRef.current.forEach(u => {
          radarCtx.fillStyle = u.team === 'player' ? '#55d45c' : '#ff4d4d';
          radarCtx.beginPath();
          radarCtx.arc(u.x * scaleX, u.y * scaleY, 2.5, 0, Math.PI * 2);
          radarCtx.fill();
        });

        const scanTime = Date.now() * 0.002;
        radarCtx.strokeStyle = 'rgba(85, 212, 92, 0.4)';
        radarCtx.lineWidth = 1;
        radarCtx.beginPath();
        radarCtx.moveTo(radar.width / 2, radar.height / 2);
        radarCtx.lineTo(
          radar.width / 2 + Math.cos(scanTime) * 80,
          radar.height / 2 + Math.sin(scanTime) * 80
        );
        radarCtx.stroke();
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedUnits, selectedBuilding, dragState, audioEnabled]);

  // Mouse handlers for Drag Selection & Movement
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (e.button === 0) {
      // Left Click - start drag selection
      setDragState({
        isDragging: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y
      });
    } else if (e.button === 2) {
      // Right Click - Move selected units
      e.preventDefault();
      if (selectedUnits.length > 0) {
        playSound('select', audioEnabled);
        clickMarkersRef.current.push({ x, y, radius: 4, alpha: 1.0 });

        // Tactical formation offset
        selectedUnits.forEach((su, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const targetUnit = unitsRef.current.find(u => u.id === su.id);
          if (targetUnit) {
            targetUnit.targetX = x + (col - 1) * 28;
            targetUnit.targetY = y + (row - 1) * 28;
          }
        });
        onNotify(`${selectedUnits.length} ta birlik taktik safda harakatlanmoqda.`);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setDragState(prev => ({ ...prev, currentX: x, currentY: y }));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !dragState.isDragging) return;

    const minX = Math.min(dragState.startX, dragState.currentX);
    const maxX = Math.max(dragState.startX, dragState.currentX);
    const minY = Math.min(dragState.startY, dragState.currentY);
    const maxY = Math.max(dragState.startY, dragState.currentY);
    const dragDistance = Math.hypot(maxX - minX, maxY - minY);

    if (dragDistance < 8) {
      // Single Click selection
      const clickedUnit = unitsRef.current.find(
        u => Math.hypot(u.x - minX, u.y - minY) <= u.radius + 6
      );

      const clickedBuilding = !clickedUnit
        ? buildingsRef.current.find(
            b => minX >= b.x && minX <= b.x + b.width && minY >= b.y && minY <= b.y + b.height
          )
        : null;

      if (clickedUnit) {
        setSelectedUnits([clickedUnit]);
        setSelectedBuilding(null);
        playSound('select', audioEnabled);
        onNotify(`${clickedUnit.name} tanlandi.`);
      } else if (clickedBuilding) {
        setSelectedUnits([]);
        setSelectedBuilding(clickedBuilding);
        playSound('select', audioEnabled);
        onNotify(`${clickedBuilding.name} tanlandi.`);
      } else {
        // Clicked ground: if units are selected, move them
        if (selectedUnits.length > 0) {
          playSound('select', audioEnabled);
          clickMarkersRef.current.push({ x: minX, y: minY, radius: 4, alpha: 1.0 });

          selectedUnits.forEach((su, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const targetUnit = unitsRef.current.find(u => u.id === su.id);
            if (targetUnit) {
              targetUnit.targetX = minX + (col - 1) * 28;
              targetUnit.targetY = minY + (row - 1) * 28;
            }
          });
          onNotify(`${selectedUnits.length} ta birlik yangi nuqtaga yo'l oldi.`);
        } else {
          setSelectedUnits([]);
          setSelectedBuilding(null);
        }
      }
    } else {
      // BOX / DRAG SELECTION
      const inBox = unitsRef.current.filter(
        u => u.team === 'player' && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
      );

      if (inBox.length > 0) {
        setSelectedUnits(inBox);
        setSelectedBuilding(null);
        playSound('select', audioEnabled);
        onNotify(`${inBox.length} ta birlik guruhlab tanlandi.`);
      } else {
        setSelectedUnits([]);
        setSelectedBuilding(null);
      }
    }

    setDragState(prev => ({ ...prev, isDragging: false }));
  };

  return (
    <div className="relative w-[1024px] h-[620px] border-2 border-[#28442a] rounded-b-md overflow-hidden shadow-2xl bg-[#121c13]">
      <canvas
        ref={canvasRef}
        width={1024}
        height={620}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
        className="block bg-[#152216] cursor-crosshair"
      />

      {/* Radar Minimap */}
      <div className="absolute top-3 right-3 w-[150px] h-[110px] bg-[#0a140b]/85 border-2 border-[#36663a] rounded overflow-hidden shadow-lg pointer-events-none">
        <canvas ref={radarRef} width={150} height={110} className="w-full h-full block" />
        <div className="absolute bottom-1 left-1.5 text-[9px] text-[#55d45c] font-bold tracking-wider">
          TACTICAL RADAR
        </div>
      </div>
    </div>
  );
};

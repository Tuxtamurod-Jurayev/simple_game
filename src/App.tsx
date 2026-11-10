import React, { useEffect, useRef, useState } from 'react';
import {
  Unit,
  Building,
  Projectile,
  Particle,
  Difficulty,
  UnitType,
  BuildingType,
  DIFFICULTY_SETTINGS
} from './types/game';
import { playSound } from './utils/audio';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // O'yin ekrani holati (Menyu yoki Jang)
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);

  // O'yinchi resurslari va HUD state
  const [money, setMoney] = useState<number>(2500);
  const [power, setPower] = useState<{ produced: number; used: number }>({ produced: 20, used: 10 });
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [airStrikeReady, setAirStrikeReady] = useState<number>(100); // 0 dan 100% gacha
  const [placingBuilding, setPlacingBuilding] = useState<BuildingType | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // O'yin obyektlari (Refs - 60 FPS silliq ishlashi uchun)
  const moneyRef = useRef<number>(2500);
  const unitsRef = useRef<Unit[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; ex: number; ey: number }>({
    active: false, sx: 0, sy: 0, ex: 0, ey: 0
  });

  // Resurs konlari (Supply Docks)
  const supplyDocks = [
    { x: 260, y: 140, crates: 12 },
    { x: 840, y: 420, crates: 12 }
  ];

  // O'yinni boshlash va boshlang'ich bazalarni qurish
  const initGame = (selectedDiff: Difficulty) => {
    setDifficulty(selectedDiff);
    setWinner(null);
    moneyRef.current = 2500;
    setMoney(2500);
    setAirStrikeReady(100);
    setSelectedUnits([]);
    setSelectedBuilding(null);

    buildingsRef.current = [
      // O'yinchi bazasi (USA Blue)
      { id: 1, type: 'HQ', team: 'player', x: 70, y: 240, width: 85, height: 85, hp: 3000, maxHp: 3000, radarAngle: 0 },
      { id: 2, type: 'WarFactory', team: 'player', x: 180, y: 360, width: 80, height: 65, hp: 1500, maxHp: 1500, radarAngle: 0 },
      // Dushman bazasi (GLA/China Red)
      { id: 10, type: 'HQ', team: 'enemy', x: 940, y: 220, width: 85, height: 85, hp: 3000, maxHp: 3000, radarAngle: 0 },
      { id: 11, type: 'WarFactory', team: 'enemy', x: 830, y: 110, width: 80, height: 65, hp: 1500, maxHp: 1500, radarAngle: 0 }
    ];

    unitsRef.current = [
      // O'yinchi boshlang'ich qo'shini
      createUnit('Worker', 'player', 190, 220),
      createUnit('Worker', 'player', 210, 250),
      createUnit('Crusader', 'player', 280, 320),
      createUnit('Humvee', 'player', 280, 380),
      // Dushman boshlang'ich qo'shini
      createUnit('Crusader', 'enemy', 800, 240),
      createUnit('Humvee', 'enemy', 790, 300)
    ];

    projectilesRef.current = [];
    particlesRef.current = [];
    setGameStarted(true);
    playSound('select', audioEnabled);
  };

  // Yangi birlik yaratish fabrikasi
  const createUnit = (type: UnitType, team: 'player' | 'enemy', x: number, y: number): Unit => {
    const stats: Record<UnitType, { hp: number; speed: number; range: number; dmg: number; rate: number; r: number }> = {
      Worker: { hp: 180, speed: 2.2, range: 0, dmg: 0, rate: 0, r: 12 },
      Humvee: { hp: 320, speed: 2.8, range: 135, dmg: 14, rate: 600, r: 15 },
      Crusader: { hp: 650, speed: 1.7, range: 165, dmg: 38, rate: 1400, r: 18 },
      Overlord: { hp: 1300, speed: 1.1, range: 195, dmg: 75, rate: 2000, r: 24 }
    };
    const s = stats[type];
    return {
      id: Math.random() * 1000000,
      type,
      team,
      x,
      y,
      radius: s.r,
      hp: s.hp,
      maxHp: s.hp,
      speed: s.speed,
      targetX: null,
      targetY: null,
      range: s.range,
      damage: s.dmg,
      fireRate: s.rate,
      lastShot: 0,
      bodyAngle: team === 'player' ? 0 : Math.PI,
      turretAngle: team === 'player' ? 0 : Math.PI,
      carrying: 0
    };
  };

  // Portlash va tutun effektlarini hosil qilish
  const spawnExplosion = (x: number, y: number, count = 18, big = false) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (big ? 5 : 2.8);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * (big ? 14 : 7) + 3,
        color: i % 2 === 0 ? '#ff6b00' : i % 3 === 0 ? '#ffd000' : '#444444',
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015
      });
    }
  };

  // Birlik sotib olish (Train Unit)
  const trainPlayerUnit = (type: UnitType, cost: number) => {
    const factory = buildingsRef.current.find(b => b.team === 'player' && (b.type === 'WarFactory' || b.type === 'HQ'));
    if (!factory) {
      alert("Harbiy zavod yoki Bosh bino mavjud emas!");
      return;
    }
    if (moneyRef.current < cost) return;

    moneyRef.current -= cost;
    setMoney(moneyRef.current);
    playSound('select', audioEnabled);

    const spawnX = factory.x + factory.width + 25;
    const spawnY = factory.y + factory.height / 2 + (Math.random() * 40 - 20);
    const newUnit = createUnit(type, 'player', spawnX, spawnY);
    newUnit.targetX = spawnX + 60;
    newUnit.targetY = spawnY;
    unitsRef.current.push(newUnit);
  };

  // Maxsus General Quroli: A-10 Air Strike
  const triggerAirStrike = () => {
    if (airStrikeReady < 100) return;
    setAirStrikeReady(0);
    playSound('airstrike', audioEnabled);

    // Dushmanning eng gavjum nuqtasiga yoki bazasiga zarba berish
    const enemyTargets = [
      ...unitsRef.current.filter(u => u.team === 'enemy'),
      ...buildingsRef.current.filter(b => b.team === 'enemy')
    ];
    if (enemyTargets.length === 0) return;

    const target = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
    const tx = target.x;
    const ty = target.y;

    // Ketma-ket 5 ta kuchli aviabomba portlashi
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const bx = tx + (i - 2) * 35;
        const by = ty + (Math.random() * 30 - 15);
        spawnExplosion(bx, by, 35, true);
        playSound('explosion', audioEnabled);

        unitsRef.current.forEach(u => {
          if (u.team === 'enemy' && Math.hypot(u.x - bx, u.y - by) < 85) {
            u.hp -= 280;
          }
        });
        buildingsRef.current.forEach(b => {
          if (b.team === 'enemy' && Math.hypot(b.x + b.width / 2 - bx, b.y + b.height / 2 - by) < 95) {
            b.hp -= 350;
          }
        });
      }, i * 180);
    }
  };

  // AI va Taymerlar sikli
  useEffect(() => {
    if (!gameStarted || winner) return;
    const config = DIFFICULTY_SETTINGS[difficulty];

    const aiInterval = setInterval(() => {
      const enemyFactory = buildingsRef.current.find(b => b.team === 'enemy' && b.type === 'WarFactory') ||
                           buildingsRef.current.find(b => b.team === 'enemy');
      if (!enemyFactory) return;

      // Qiyinchilik darajasiga qarab tank tanlash
      let unitToSpawn: UnitType = 'Humvee';
      const roll = Math.random();
      if (config.allowOverlord && roll > 0.55) {
        unitToSpawn = 'Overlord';
      } else if (roll > 0.3) {
        unitToSpawn = 'Crusader';
      }

      const sx = enemyFactory.x - 30;
      const sy = enemyFactory.y + 40 + (Math.random() * 60 - 30);
      const aiUnit = createUnit(unitToSpawn, 'enemy', sx, sy);

      // O'yinchi bazasi yoki eng yaqin birlikka hujum buyrug'i
      const playerHQ = buildingsRef.current.find(b => b.team === 'player');
      if (playerHQ) {
        aiUnit.targetX = playerHQ.x + 40 + (Math.random() * 80 - 40);
        aiUnit.targetY = playerHQ.y + 40 + (Math.random() * 80 - 40);
      }
      unitsRef.current.push(aiUnit);
    }, config.spawnInterval);

    const strikeTimer = setInterval(() => {
      setAirStrikeReady(prev => (prev < 100 ? prev + 5 : 100));
    }, 1000);

    return () => {
      clearInterval(aiInterval);
      clearInterval(strikeTimer);
    };
  }, [gameStarted, difficulty, winner]);

  // Asosiy 60 FPS Render va Fizika Dvijogi
  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;
    const ctx = canvas.getContext('2d');
    const mCtx = minimap.getContext('2d');
    let animId: number;

    const updateAndDraw = () => {
      if (!ctx || !mCtx) return;

      // 1. REALISTIK CHO'L HARBIY XARITASINI CHIZISH
      ctx.fillStyle = '#2b261d'; // Asosiy tuproq rangi
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Taktik relyef chiziqlari va qum dog'lari
      ctx.fillStyle = '#332d22';
      for (let i = 0; i < 12; i++) {
        ctx.fillRect((i * 173) % canvas.width, (i * 97) % canvas.height, 140, 70);
      }

      // Harbiy baza asfalt yo'lagi
      ctx.fillStyle = '#222526';
      ctx.fillRect(40, 190, 230, 270);
      ctx.fillRect(800, 90, 250, 260);

      // 2. RESURS OMBORLARI (SUPPLY DOCKS)
      supplyDocks.forEach(dock => {
        ctx.fillStyle = '#4a3b2c';
        ctx.fillRect(dock.x - 35, dock.y - 25, 70, 50);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dock.x - 35, dock.y - 25, 70, 50);

        // Harbiy yuk qutilari (Crates)
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(dock.x - 28 + c * 19, dock.y - 18 + r * 19, 15, 14);
            ctx.strokeStyle = '#78350f';
            ctx.strokeRect(dock.x - 28 + c * 19, dock.y - 18 + r * 19, 15, 14);
          }
        }

        ctx.fillStyle = '#ffd152';
        ctx.font = 'bold 10px Consolas, monospace';
        ctx.fillText('SUPPLY DOCK', dock.x - 32, dock.y - 30);
      });

      // 3. HAQIQIY BINOLARNI CHIZISH
      buildingsRef.current.forEach(b => {
        b.radarAngle += 0.04;
        const isPlayer = b.team === 'player';

        // Bino soyasi
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(b.x + 6, b.y + 6, b.width, b.height);

        // Asosiy bino korpusi
        ctx.fillStyle = isPlayer ? '#2c3e50' : '#4a2323';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = isPlayer ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        if (b.type === 'HQ') {
          // Vertolyot maydonchasi 'H' belgisi va aylanuvchi Radar
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.strokeRect(b.x + 10, b.y + 10, b.width - 20, b.height - 20);

          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.fillStyle = '#ffd152';
          ctx.font = 'bold 18px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', cx, cy);

          const rx = b.x + b.width - 22;
          const ry = b.y + 22;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(b.radarAngle);
          ctx.fillStyle = isPlayer ? '#7dd3fc' : '#fca5a5';
          ctx.fillRect(-12, -3, 24, 6);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(-12, -3, 24, 6);
          ctx.restore();
        } else if (b.type === 'WarFactory') {
          // Zavod angar tomi va tank chiqish chiziqlari
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(b.x + 8, b.y + 8, b.width - 25, b.height - 16);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(b.x + b.width - 12, b.y + 6, 8, b.height - 12);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('WAR FACTORY', b.x + b.width / 2, b.y + b.height / 2);
        } else if (b.type === 'PowerPlant') {
          // Elektr stansiyasi turbinalari
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y + b.height / 2, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.stroke();
        }

        // Bino HP chizig'i
        const hpPercent = Math.max(0, b.hp / b.maxHp);
        ctx.fillStyle = '#111';
        ctx.fillRect(b.x, b.y - 10, b.width, 6);
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(b.x, b.y - 10, b.width * hpPercent, 6);
      });

      // 4. HARBIY TEXNIKALAR (TANKLAR, HUMVEE, ISHCHILAR) HARAKATI VA CHIZILISHI
      const now = Date.now();
      unitsRef.current.forEach(u => {
        // Ishchi resurs tashish mantiqi
        if (u.type === 'Worker' && u.team === 'player') {
          const dock = supplyDocks[0];
          const hq = buildingsRef.current.find(b => b.team === 'player' && b.type === 'HQ');
          if (hq) {
            if (u.carrying === 0) {
              u.targetX = dock.x;
              u.targetY = dock.y;
              if (Math.hypot(u.x - dock.x, u.y - dock.y) < 38) {
                u.carrying = 120;
              }
            } else {
              u.targetX = hq.x + hq.width / 2;
              u.targetY = hq.y + hq.height / 2;
              if (Math.hypot(u.x - u.targetX, u.y - u.targetY) < 48) {
                moneyRef.current += u.carrying;
                setMoney(moneyRef.current);
                playSound('cash', audioEnabled);
                u.carrying = 0;
              }
            }
          }
        }

        // Nishon qidirish va Otishma
        let targetEnemy: { x: number; y: number; hp: number; width?: number; height?: number } | undefined;
        if (u.range > 0) {
          const enemyTeam = u.team === 'player' ? 'enemy' : 'player';
          const enemies: { x: number; y: number; hp: number; width?: number; height?: number }[] = [
            ...unitsRef.current.filter(e => e.team === enemyTeam),
            ...buildingsRef.current.filter(b => b.team === enemyTeam).map(b => ({
              x: b.x + b.width / 2,
              y: b.y + b.height / 2,
              hp: b.hp,
              width: b.width,
              height: b.height
            }))
          ];

          // Qiyin AI eng kam jonli nishonni tanlaydi
          let minDist = u.range;
          enemies.forEach(e => {
            const d = Math.hypot(e.x - u.x, e.y - u.y);
            if (d <= minDist) {
              minDist = d;
              targetEnemy = e;
            }
          });

          if (targetEnemy) {
            const aimX = targetEnemy.x;
            const aimY = targetEnemy.y;
            u.turretAngle = Math.atan2(aimY - u.y, aimX - u.x);

            if (now - u.lastShot >= u.fireRate) {
              u.lastShot = now;
              // Stvoldan olov chaqnashi
              const muzzleX = u.x + Math.cos(u.turretAngle) * (u.radius + 8);
              const muzzleY = u.y + Math.sin(u.turretAngle) * (u.radius + 8);
              spawnExplosion(muzzleX, muzzleY, 5, false);

              if (u.type === 'Overlord' || u.type === 'Crusader') {
                playSound('cannon', audioEnabled);
              } else {
                playSound('rifle', audioEnabled);
              }

              projectilesRef.current.push({
                x: muzzleX,
                y: muzzleY,
                tx: aimX,
                ty: aimY,
                speed: 8.5,
                damage: u.damage,
                team: u.team,
                isHeavy: u.type === 'Overlord' || u.type === 'Crusader'
              });
            }
          }
        }

        // Harakatlanish (Agar dushmanga o'q uzmayotgan bo'lsa yoki Worker bo'lsa)
        if (u.targetX !== null && u.targetY !== null && (!targetEnemy || u.type === 'Worker')) {
          const dx = u.targetX - u.x;
          const dy = u.targetY - u.y;
          const dist = Math.hypot(dx, dy);
          if (dist > u.speed) {
            u.bodyAngle = Math.atan2(dy, dx);
            if (!targetEnemy) u.turretAngle = u.bodyAngle;
            u.x += (dx / dist) * u.speed;
            u.y += (dy / dist) * u.speed;
          } else {
            u.targetX = null;
            u.targetY = null;
          }
        }

        // Yaralangan tankdan tutun chiqishi
        if (u.hp < u.maxHp * 0.4 && Math.random() < 0.2) {
          particlesRef.current.push({
            x: u.x, y: u.y, vx: 0, vy: -0.6, radius: 4, color: '#222', alpha: 0.7, decay: 0.03
          });
        }

        // --- REALISTIK HARBIY MODELNI CHIZISH ---
        ctx.save();
        ctx.translate(u.x, u.y);

        // Tanlanganlik halqasi (Generals yashil indikatori)
        const isSelected = selectedUnits.some(sel => sel.id === u.id);
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(0, 0, u.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 1) Korpus va Gusenitsalar (Tracks)
        ctx.rotate(u.bodyAngle);
        const isP = u.team === 'player';

        if (u.type === 'Worker') {
          // Yuk mashinasi / Chinook Supply Truck
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(-12, -9, 24, 18);
          ctx.fillStyle = isP ? '#0284c7' : '#dc2626';
          ctx.fillRect(2, -8, 10, 16);
          if (u.carrying > 0) {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-10, -6, 10, 12);
          }
        } else {
          // Tank g'ildirak zanjirlari (Tracks)
          const w = u.radius * 1.15;
          const h = u.radius * 0.9;
          ctx.fillStyle = '#171717';
          ctx.fillRect(-w, -h - 3, w * 2, 5);
          ctx.fillRect(-w, h - 2, w * 2, 5);

          // Zirhli korpus
          ctx.fillStyle = isP ? '#1e3a8a' : '#7f1d1d';
          ctx.strokeStyle = isP ? '#60a5fa' : '#f87171';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-w + 2, -h + 1, (w - 2) * 2, (h - 1) * 2);
          ctx.strokeRect(-w + 2, -h + 1, (w - 2) * 2, (h - 1) * 2);
        }
        ctx.restore();

        // 2) Mustaqil Aylanuvchi Tank Minorasi (Turret & Cannon)
        if (u.type !== 'Worker') {
          ctx.save();
          ctx.translate(u.x, u.y);
          ctx.rotate(u.turretAngle);

          // Tank stvoli (Cannon)
          ctx.fillStyle = '#94a3b8';
          if (u.type === 'Overlord') {
            // Ikki stvolli ulkan Overlord tanki
            ctx.fillRect(0, -6, u.radius + 12, 4);
            ctx.fillRect(0, 2, u.radius + 12, 4);
          } else {
            ctx.fillRect(0, -2.5, u.radius + 9, 5);
          }

          // Minora qopqog'i
          ctx.beginPath();
          ctx.arc(0, 0, u.radius * 0.55, 0, Math.PI * 2);
          ctx.fillStyle = isP ? '#2563eb' : '#b91c1c';
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }

        // Birlik HP chizig'i
        const hpRatio = Math.max(0, u.hp / u.maxHp);
        ctx.fillStyle = '#000';
        ctx.fillRect(u.x - 14, u.y - u.radius - 10, 28, 4);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : '#ef4444';
        ctx.fillRect(u.x - 14, u.y - u.radius - 10, 28 * hpRatio, 4);
      });

      // 5. SNARYADLAR HARAKATI VA ZARBA BERISH
      for (let idx = projectilesRef.current.length - 1; idx >= 0; idx--) {
        const p = projectilesRef.current[idx];
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= p.speed) {
          spawnExplosion(p.tx, p.ty, p.isHeavy ? 14 : 6, p.isHeavy);
          const enemyTeam = p.team === 'player' ? 'enemy' : 'player';

          unitsRef.current.forEach(u => {
            if (u.team === enemyTeam && Math.hypot(u.x - p.tx, u.y - p.ty) < u.radius + 18) {
              u.hp -= p.damage;
            }
          });
          buildingsRef.current.forEach(b => {
            if (
              b.team === enemyTeam &&
              p.tx >= b.x - 10 &&
              p.tx <= b.x + b.width + 10 &&
              p.ty >= b.y - 10 &&
              p.ty <= b.y + b.height + 10
            ) {
              b.hp -= p.damage;
            }
          });
          projectilesRef.current.splice(idx, 1);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.isHeavy ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fde047';
          ctx.fill();
        }
      }

      // 6. ZARRALAR (PORTLASH VA TUTUN) CHIZISH
      for (let idx = particlesRef.current.length - 1; idx >= 0; idx--) {
        const pt = particlesRef.current[idx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
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

      // 7. VAYRON BO'LGAN OBYEKTLARNI TOZALASH VA G'OLIBNI ANIQLASH
      unitsRef.current = unitsRef.current.filter(u => {
        if (u.hp <= 0) {
          spawnExplosion(u.x, u.y, 22, true);
          playSound('explosion', audioEnabled);
          return false;
        }
        return true;
      });

      buildingsRef.current = buildingsRef.current.filter(b => {
        if (b.hp <= 0) {
          spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, 40, true);
          playSound('explosion', audioEnabled);
          return false;
        }
        return true;
      });

      const playerAlive = buildingsRef.current.some(b => b.team === 'player');
      const enemyAlive = buildingsRef.current.some(b => b.team === 'enemy');
      if (!enemyAlive && !winner) setWinner('player');
      if (!playerAlive && !winner) setWinner('enemy');

      // 8. TANLASH RAMKASI (DRAG BOX)
      if (dragRef.current.active) {
        const { sx, sy, ex, ey } = dragRef.current;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx, sy, ex - sx, ey - sy);
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      }

      // 9. RADAR (MINI-XARITA) CHIZISH
      mCtx.fillStyle = '#091409';
      mCtx.fillRect(0, 0, minimap.width, minimap.height);
      const scaleX = minimap.width / canvas.width;
      const scaleY = minimap.height / canvas.height;

      // Supply docks on minimap
      supplyDocks.forEach(d => {
        mCtx.fillStyle = '#fbbf24';
        mCtx.fillRect(d.x * scaleX, d.y * scaleY, 6, 6);
      });

      buildingsRef.current.forEach(b => {
        mCtx.fillStyle = b.team === 'player' ? '#38bdf8' : '#ef4444';
        mCtx.fillRect(b.x * scaleX, b.y * scaleY, 10, 10);
      });
      unitsRef.current.forEach(u => {
        mCtx.fillStyle = u.team === 'player' ? '#4ade80' : '#f87171';
        mCtx.fillRect(u.x * scaleX, u.y * scaleY, 4, 4);
      });

      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animId);
  }, [gameStarted, selectedUnits, winner, audioEnabled]);

  // Sichqoncha hodisalari
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Agar yangi bino joylashtirilayotgan bo'lsa
    if (placingBuilding && e.button === 0) {
      const cost = placingBuilding === 'WarFactory' ? 800 : 400;
      if (moneyRef.current >= cost) {
        moneyRef.current -= cost;
        setMoney(moneyRef.current);
        playSound('build', audioEnabled);
        buildingsRef.current.push({
          id: Date.now(),
          type: placingBuilding,
          team: 'player',
          x: x - 35,
          y: y - 35,
          width: 75,
          height: 60,
          hp: 1200,
          maxHp: 1200,
          radarAngle: 0
        });
        if (placingBuilding === 'PowerPlant') {
          setPower(p => ({ ...p, produced: p.produced + 15 }));
        }
      }
      setPlacingBuilding(null);
      return;
    }

    if (e.button === 0) {
      dragRef.current = { active: true, sx: x, sy: y, ex: x, ey: y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current.ex = e.clientX - rect.left;
    dragRef.current.ey = e.clientY - rect.top;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0 && dragRef.current.active) {
      const { sx, sy, ex, ey } = dragRef.current;
      dragRef.current.active = false;

      if (Math.abs(ex - sx) < 6 && Math.abs(ey - sy) < 6) {
        const clickedUnit = unitsRef.current.find(u => u.team === 'player' && Math.hypot(u.x - x, u.y - y) <= u.radius + 6);
        const clickedBuilding = buildingsRef.current.find(
          b => b.team === 'player' && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height
        );
        setSelectedUnits(clickedUnit ? [clickedUnit] : []);
        setSelectedBuilding(clickedBuilding || null);
        if (clickedUnit || clickedBuilding) playSound('select', audioEnabled);
      } else {
        const minX = Math.min(sx, ex), maxX = Math.max(sx, ex);
        const minY = Math.min(sy, ey), maxY = Math.max(sy, ey);
        const group = unitsRef.current.filter(
          u => u.team === 'player' && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
        );
        setSelectedUnits(group);
        setSelectedBuilding(null);
        if (group.length > 0) playSound('select', audioEnabled);
      }
    } else if (e.button === 2) {
      // O'ng tugma — tanlangan guruhni saf tortib yuborish
      if (selectedUnits.length > 0) {
        playSound('select', audioEnabled);
        selectedUnits.forEach((sel, index) => {
          const realUnit = unitsRef.current.find(u => u.id === sel.id);
          if (realUnit) {
            const offsetX = (index % 3) * 32 - 32;
            const offsetY = Math.floor(index / 3) * 32 - 16;
            realUnit.targetX = x + offsetX;
            realUnit.targetY = y + offsetY;
          }
        });
      }
    }
  };

  // --- 1-EKRAN: QIYINCHILIK DARAJASINI TANLASH MENYUSI ---
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-[#0c110d] text-slate-100 flex flex-col items-center justify-center p-6 font-mono select-none">
        <div className="max-w-3xl w-full bg-[#141d15] border-2 border-amber-500/60 rounded-lg p-8 shadow-2xl">
          <div className="text-center border-b border-slate-700 pb-5 mb-6">
            <p className="text-xs tracking-widest text-amber-400 uppercase">Tactical Command System v4.0</p>
            <h1 className="text-3xl font-extrabold text-amber-500 tracking-wider mt-1">
              COMMAND & CONQUER: GENERALS
            </h1>
            <p className="text-sm text-slate-400 mt-2">1 vs 1 Skirmish — Raqib generalning darajasini tanlang</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(lvl => {
              const cfg = DIFFICULTY_SETTINGS[lvl];
              const active = difficulty === lvl;
              return (
                <div
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`cursor-pointer p-4 rounded border-2 transition-all ${
                    active
                      ? 'border-amber-400 bg-amber-500/10 shadow-lg'
                      : 'border-slate-700 bg-[#1a241b] hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg text-amber-400">{cfg.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{cfg.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{cfg.description}</p>
                  <div className="text-[11px] text-slate-400 border-t border-slate-700/80 pt-2">
                    <div>AI Boshlang'ich puli: ${cfg.aiMoney}</div>
                    <div>Qo'shin tezligi: {cfg.spawnInterval / 1000}s</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => initGame(difficulty)}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-lg tracking-widest uppercase rounded shadow-lg transition cursor-pointer"
          >
            JANGNI BOSHLASH (DEPLOY TO BATTLEFIELD)
          </button>
        </div>
      </div>
    );
  }

  // --- 2-EKRAN: HAQIQIY GENERALS JANG MAYDONI VA HUD ---
  return (
    <div className="min-h-screen bg-[#0a0d0a] text-white flex flex-col items-center justify-between select-none font-mono overflow-hidden">
      {/* YUQORI HARBIY PANEL (TOP BAR) */}
      <div className="w-[1100px] bg-gradient-to-b from-[#1e2620] to-[#111712] border-x-2 border-b-2 border-slate-600 px-5 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <div className="bg-black/60 px-4 py-1 rounded border border-amber-500/50">
            <span className="text-xs text-slate-400 mr-2">CREDITS:</span>
            <span className="text-lg font-bold text-amber-400">${money}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">POWER:</span>
            <div className="w-28 h-3 bg-slate-800 rounded overflow-hidden border border-slate-600">
              <div className="h-full bg-emerald-400" style={{ width: '80%' }} />
            </div>
            <span className="text-xs text-emerald-400">{power.produced} GW</span>
          </div>
          <div className="text-xs text-slate-300">
            AI Darajasi: <span className="text-amber-400 font-bold uppercase">{DIFFICULTY_SETTINGS[difficulty].name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(prev => !prev)}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-amber-300"
          >
            {audioEnabled ? '🔊 Ovoz: Yoqilgan' : '🔇 Ovoz: O\'chirilgan'}
          </button>
          {placingBuilding && (
            <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded border border-amber-400">
              Xaritaga bosib {placingBuilding} joylashtiring...
            </span>
          )}
          <button
            onClick={() => setGameStarted(false)}
            className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-500 rounded cursor-pointer"
          >
            MENYUGA QAYTISH
          </button>
        </div>
      </div>

      {/* ASOSIY JANG MAYDONI (CANVAS) */}
      <div className="relative my-1">
        <canvas
          ref={canvasRef}
          width={1100}
          height={520}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={e => e.preventDefault()}
          className="border-2 border-slate-700 shadow-2xl cursor-crosshair"
        />

        {/* G'alaba yoki Mag'lubiyat Oynasi */}
        {winner && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <h2 className={`text-4xl font-black tracking-widest mb-4 ${winner === 'player' ? 'text-emerald-400' : 'text-red-500'}`}>
              {winner === 'player' ? 'VICTORY! SIZ G‘OLIB BO‘LDINGIZ!' : 'DEFEAT! BAZANGIZ VAYRON BO‘LDI'}
            </h2>
            <button
              onClick={() => setGameStarted(false)}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded uppercase cursor-pointer"
            >
              Yangi Jang Boshlash
            </button>
          </div>
        )}
      </div>

      {/* PASTKI KLASSIK "GENERALS" BOSHQARUV PANELI (HUD) */}
      <div className="w-[1100px] h-40 bg-gradient-to-b from-[#1f2721] to-[#121713] border-2 border-slate-600 grid grid-cols-12 gap-3 p-2.5 shadow-2xl">
        {/* 1. RADAR / MINI-MAP (Chap qism) */}
        <div className="col-span-3 bg-black border-2 border-slate-600 rounded p-1 flex flex-col items-center">
          <div className="w-full flex justify-between text-[10px] text-emerald-400 px-1 mb-0.5">
            <span>TACTICAL RADAR</span>
            <span>ONLINE</span>
          </div>
          <canvas ref={minimapRef} width={240} height={115} className="border border-emerald-900/80" />
        </div>

        {/* 2. TANLANGAN BIRLIK YOKI BINO PORTRETI (O'rta qism) */}
        <div className="col-span-4 bg-[#141a15] border-2 border-slate-700 rounded p-3 flex flex-col justify-between">
          {selectedUnits.length > 0 ? (
            <div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                <span className="font-bold text-amber-400 text-sm">
                  {selectedUnits.length === 1 ? `${selectedUnits[0].type} Unit` : `${selectedUnits.length} ta Harbiy Birlik`}
                </span>
                <span className="text-xs text-emerald-400">READY FOR ORDERS</span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Boshqaruv: Xaritaning istalgan nuqtasiga <span className="text-amber-300">Sichqoncha O‘ng Tugmasini</span> bosing. Dushman yaqinlashsa avtomatik o‘t ochadi.
              </p>
            </div>
          ) : selectedBuilding ? (
            <div>
              <span className="font-bold text-sky-400 text-sm">{selectedBuilding.type} — Harbiy Inshoot</span>
              <p className="text-xs text-slate-400 mt-1">
                Holati (HP): {selectedBuilding.hp} / {selectedBuilding.maxHp}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex flex-col justify-center h-full">
              <p className="text-amber-400 font-bold mb-1">USA COMMAND CENTER</p>
              <p>Birliklarni guruhlab tanlash uchun sichqoncha chap tugmasini bosib torting.</p>
            </div>
          )}

          <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-1">
            <span>Zirh: Composite Level II</span>
            <span>Aloqa: Satellite Uplink</span>
          </div>
        </div>

        {/* 3. BUYRUQLAR SETKASI (COMMAND GRID - O'ng qism) */}
        <div className="col-span-5 bg-[#141a15] border-2 border-slate-700 rounded p-2 grid grid-cols-3 gap-2">
          <button
            onClick={() => trainPlayerUnit('Worker', 250)}
            className="bg-[#1e2923] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1.5 flex flex-col justify-between text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-emerald-300">Supply Truck</span>
            <span className="text-[11px] text-amber-400">$250</span>
          </button>

          <button
            onClick={() => trainPlayerUnit('Humvee', 400)}
            className="bg-[#1e2923] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1.5 flex flex-col justify-between text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-emerald-300">Humvee Recon</span>
            <span className="text-[11px] text-amber-400">$400</span>
          </button>

          <button
            onClick={() => trainPlayerUnit('Crusader', 700)}
            className="bg-[#1e2923] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1.5 flex flex-col justify-between text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-sky-300">Crusader Tank</span>
            <span className="text-[11px] text-amber-400">$700</span>
          </button>

          <button
            onClick={() => trainPlayerUnit('Overlord', 1200)}
            className="bg-[#1e2923] hover:bg-emerald-900/60 border border-emerald-600/60 rounded p-1.5 flex flex-col justify-between text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-amber-300">Overlord Tank</span>
            <span className="text-[11px] text-amber-400">$1200</span>
          </button>

          <button
            onClick={() => setPlacingBuilding('WarFactory')}
            className="bg-[#24221b] hover:bg-amber-900/50 border border-amber-600/60 rounded p-1.5 flex flex-col justify-between text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-amber-200">War Factory</span>
            <span className="text-[11px] text-amber-400">$800 (Qurish)</span>
          </button>

          <button
            onClick={triggerAirStrike}
            disabled={airStrikeReady < 100}
            className={`rounded p-1.5 flex flex-col justify-between text-left border transition ${
              airStrikeReady === 100
                ? 'bg-red-900/60 hover:bg-red-700/80 border-red-400 animate-pulse cursor-pointer'
                : 'bg-slate-900 border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="text-xs font-bold text-red-300">A-10 Air Strike</span>
            <span className="text-[11px] text-white">{airStrikeReady === 100 ? 'TAYYOR (ZARBA!)' : `${airStrikeReady}%`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

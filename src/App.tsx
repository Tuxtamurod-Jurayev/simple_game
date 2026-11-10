import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Unit,
  Building,
  SupplyDock,
  SalvageCrate,
  Projectile,
  Particle,
  SuperweaponStrike,
  Camera,
  Faction,
  Difficulty,
  UnitTypeId,
  BuildingTypeId,
  GameSettings,
  GeneralPower
} from './types/game';
import { UNIT_CONFIGS, BUILDING_CONFIGS } from './config/factions';
import { FogOfWarSystem, WORLD_WIDTH, WORLD_HEIGHT } from './systems/fogOfWarSystem';
import { PhysicsSystem } from './systems/physicsSystem';
import { AISystem } from './systems/aiSystem';
import {
  initAudio,
  playExplosion,
  playSiren,
  playBuildSound,
  playLaserBeam,
  speakVoice
} from './systems/audioSystem';

import { SkirmishMenu } from './components/SkirmishMenu';
import { ThreeGameCanvas } from './three/ThreeGameCanvas';
import { UIOverlay } from './components/UIOverlay';

export default function App() {
  const [inSkirmish, setInSkirmish] = useState<boolean>(true);
  const [playerFaction, setPlayerFaction] = useState<Faction>('USA');
  const [enemyFaction, setEnemyFaction] = useState<Faction>('China');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Economic & Base Stats
  const [credits, setCredits] = useState<number>(5000);
  const [aiCredits, setAiCredits] = useState<number>(3000);
  const [powerProduced, setPowerProduced] = useState<number>(0);
  const [powerConsumed, setPowerConsumed] = useState<number>(0);
  const [generalXp, setGeneralXp] = useState<number>(0);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);

  // Entities
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const supplyDocksRef = useRef<SupplyDock[]>([
    { id: 1, x: 260, y: 160, width: 100, height: 75, supplies: 15000, maxSupplies: 15000 },
    { id: 2, x: 1950, y: 1260, width: 100, height: 75, supplies: 15000, maxSupplies: 15000 },
    { id: 3, x: 920, y: 480, width: 100, height: 75, supplies: 18000, maxSupplies: 18000 },
    { id: 4, x: 1380, y: 1020, width: 100, height: 75, supplies: 18000, maxSupplies: 18000 }
  ]);
  const salvageCratesRef = useRef<SalvageCrate[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const superweaponStrikesRef = useRef<SuperweaponStrike[]>([]);

  // Camera & Fog of War
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, speed: 12 });
  const [cameraJump, setCameraJump] = useState<{ x: number; y: number; timestamp: number } | null>(null);
  const fogSystemRef = useRef<FogOfWarSystem>(new FogOfWarSystem());
  const aiSystemRef = useRef<AISystem>(new AISystem());

  // Selections & Interactions
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [placingBuildingType, setPlacingBuildingType] = useState<BuildingTypeId | null>(null);
  const [targetingSuperweapon, setTargetingSuperweapon] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<number>(0);

  // General Powers
  const [generalPowers, setGeneralPowers] = useState<GeneralPower[]>([
    { id: 'SpySatellite', name: 'Spy Satellite', cooldown: 45, currentCooldown: 0, reqRank: 1 },
    { id: 'EmergencyRepair', name: 'Emergency Repair', cooldown: 60, currentCooldown: 0, reqRank: 2 },
    { id: 'A10Strike', name: 'A-10 Thunderbolt', cooldown: 90, currentCooldown: 0, reqRank: 3 }
  ]);

  // Start new Skirmish match
  const handleStartGame = (settings: GameSettings) => {
    initAudio();
    setPlayerFaction(settings.playerFaction);
    setEnemyFaction(settings.enemyFaction);
    setDifficulty(settings.difficulty);
    setCredits(settings.startingCredits);
    setAiCredits(settings.difficulty === 'hard' ? 5500 : settings.difficulty === 'medium' ? 3000 : 1500);
    setGeneralXp(0);
    setWinner(null);

    // Initial Camera centered on player base (top-left)
    setCamera({ x: 0, y: 0, speed: 12 });
    fogSystemRef.current.reset();

    // 1. Initial Player Base (Top-Left 60, 60)
    const pBaseType: BuildingTypeId =
      settings.playerFaction === 'USA' ? 'USA_HQ' : settings.playerFaction === 'China' ? 'China_HQ' : 'GLA_HQ';
    const pCfg = BUILDING_CONFIGS[pBaseType];

    const initialPlayerHQ: Building = {
      id: 1,
      type: pBaseType,
      team: 'player',
      faction: settings.playerFaction,
      x: 120,
      y: 120,
      width: pCfg.width,
      height: pCfg.height,
      hp: pCfg.hp,
      maxHp: pCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: pCfg.powerProduced,
      powerConsumed: pCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: pCfg.cost,
      radarAngle: 0
    };

    // Initial Player Reactor
    const pReactorType: BuildingTypeId =
      settings.playerFaction === 'USA' ? 'USA_Reactor' : settings.playerFaction === 'China' ? 'China_Reactor' : 'GLA_SupplyStash';
    const pRCfg = BUILDING_CONFIGS[pReactorType];
    const initialPlayerReactor: Building = {
      id: 3,
      type: pReactorType,
      team: 'player',
      faction: settings.playerFaction,
      x: 230,
      y: 70,
      width: pRCfg.width,
      height: pRCfg.height,
      hp: pRCfg.hp,
      maxHp: pRCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: pRCfg.powerProduced,
      powerConsumed: pRCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: pRCfg.cost
    };

    // Initial Player Supply Depot
    const pDepotType: BuildingTypeId =
      settings.playerFaction === 'USA' ? 'USA_SupplyDepot' : settings.playerFaction === 'China' ? 'China_SupplyCenter' : 'GLA_Barracks';
    const pDCfg = BUILDING_CONFIGS[pDepotType];
    const initialPlayerDepot: Building = {
      id: 4,
      type: pDepotType,
      team: 'player',
      faction: settings.playerFaction,
      x: 90,
      y: 230,
      width: pDCfg.width,
      height: pDCfg.height,
      hp: pDCfg.hp,
      maxHp: pDCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: pDCfg.powerProduced,
      powerConsumed: pDCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: pDCfg.cost
    };

    // 2. Initial Enemy Base (Bottom-Right 1900, 1150)
    const eBaseType: BuildingTypeId =
      settings.enemyFaction === 'USA' ? 'USA_HQ' : settings.enemyFaction === 'China' ? 'China_HQ' : 'GLA_HQ';
    const eCfg = BUILDING_CONFIGS[eBaseType];

    const initialEnemyHQ: Building = {
      id: 2,
      type: eBaseType,
      team: 'enemy',
      faction: settings.enemyFaction,
      x: 2000,
      y: 1250,
      width: eCfg.width,
      height: eCfg.height,
      hp: eCfg.hp,
      maxHp: eCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: eCfg.powerProduced,
      powerConsumed: eCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: eCfg.cost,
      radarAngle: 0
    };

    const eReactorType: BuildingTypeId =
      settings.enemyFaction === 'USA' ? 'USA_Reactor' : settings.enemyFaction === 'China' ? 'China_Reactor' : 'GLA_SupplyStash';
    const eRCfg = BUILDING_CONFIGS[eReactorType];
    const initialEnemyReactor: Building = {
      id: 5,
      type: eReactorType,
      team: 'enemy',
      faction: settings.enemyFaction,
      x: 2120,
      y: 1200,
      width: eRCfg.width,
      height: eRCfg.height,
      hp: eRCfg.hp,
      maxHp: eRCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: eRCfg.powerProduced,
      powerConsumed: eRCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: eRCfg.cost
    };

    setBuildings([initialPlayerHQ, initialPlayerReactor, initialPlayerDepot, initialEnemyHQ, initialEnemyReactor]);

    // Initial Units
    const pHarvesterType: UnitTypeId =
      settings.playerFaction === 'USA'
        ? 'SupplyChinook'
        : settings.playerFaction === 'China'
        ? 'SupplyTruck_China'
        : 'Worker_GLA';
    const pCombatType: UnitTypeId =
      settings.playerFaction === 'USA' ? 'Crusader' : settings.playerFaction === 'China' ? 'Battlemaster' : 'Scorpion';

    const eHarvesterType: UnitTypeId =
      settings.enemyFaction === 'USA'
        ? 'SupplyChinook'
        : settings.enemyFaction === 'China'
        ? 'SupplyTruck_China'
        : 'Worker_GLA';
    const eCombatType: UnitTypeId =
      settings.enemyFaction === 'USA' ? 'Crusader' : settings.enemyFaction === 'China' ? 'Battlemaster' : 'Scorpion';

    const pU1 = createUnit(pHarvesterType, 'player', settings.playerFaction, 240, 160);
    const pU2 = createUnit(pCombatType, 'player', settings.playerFaction, 280, 240);

    const eU1 = createUnit(eHarvesterType, 'enemy', settings.enemyFaction, 1920, 1260);
    const eU2 = createUnit(eCombatType, 'enemy', settings.enemyFaction, 1880, 1200);

    setUnits([pU1, pU2, eU1, eU2]);
    salvageCratesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    superweaponStrikesRef.current = [];

    setInSkirmish(false);
    speakVoice('select', settings.playerFaction, audioEnabled);
  };

  const createUnit = (type: UnitTypeId, team: 'player' | 'enemy', faction: Faction, x: number, y: number): Unit => {
    const cfg = UNIT_CONFIGS[type];
    return {
      id: Date.now() + Math.random(),
      type,
      team,
      faction,
      x,
      y,
      radius: cfg.radius,
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed,
      targetX: null,
      targetY: null,
      range: cfg.range,
      damage: cfg.damage,
      fireRate: cfg.fireRate,
      lastShot: 0,
      bodyAngle: team === 'player' ? 0 : Math.PI,
      turretAngle: team === 'player' ? 0 : Math.PI,
      kills: 0,
      veterancy: 0,
      carrying: 0,
      isFlying: cfg.isFlying,
      cost: cfg.cost
    };
  };

  // Cash addition handler
  const handleAddCash = useCallback((amount: number, team: 'player' | 'enemy') => {
    if (team === 'player') {
      setCredits(prev => prev + amount);
      setGeneralXp(prev => prev + Math.round(amount * 0.15));
    } else {
      setAiCredits(prev => prev + amount);
    }
  }, []);

  // Superweapon countdown calculation
  const playerSuperweapon = buildings.find(
    b => b.team === 'player' && (b.type.includes('ParticleCannon') || b.type.includes('NukeSilo') || b.type.includes('ScudStorm'))
  );
  const superweaponTimer = playerSuperweapon?.isCompleted ? playerSuperweapon.superweaponTimer ?? 120 : null;
  const isSuperweaponReady = superweaponTimer !== null && superweaponTimer <= 0;

  // General Powers trigger
  const handleTriggerPower = (powerId: GeneralPower['id']) => {
    if (powerId === 'SpySatellite') {
      // Reveal 350px around player base or camera center
      fogSystemRef.current.triggerSpySatellite(camera.x + 550, camera.y + 270, 20);
      playLaserBeam(audioEnabled);
      setGeneralPowers(prev =>
        prev.map(p => (p.id === 'SpySatellite' ? { ...p, currentCooldown: p.cooldown } : p))
      );
    } else if (powerId === 'EmergencyRepair') {
      // Heal all player units 50% & grant $750
      setCredits(prev => prev + 750);
      setUnits(prev =>
        prev.map(u => (u.team === 'player' ? { ...u, hp: Math.min(u.maxHp, u.hp + u.maxHp * 0.5) } : u))
      );
      playBuildSound(audioEnabled);
      setGeneralPowers(prev =>
        prev.map(p => (p.id === 'EmergencyRepair' ? { ...p, currentCooldown: p.cooldown } : p))
      );
    } else if (powerId === 'A10Strike') {
      // Carpet bombing run across camera center
      const cx = camera.x + 550;
      const cy = camera.y + 270;
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const bx = cx - 180 + i * 45;
          const by = cy + (Math.random() * 40 - 20);
          playExplosion('large', audioEnabled);

          for (let p = 0; p < 18; p++) {
            const ang = Math.random() * Math.PI * 2;
            particlesRef.current.push({
              x: bx,
              y: by,
              vx: Math.cos(ang) * 4,
              vy: Math.sin(ang) * 4,
              radius: Math.random() * 8 + 3,
              color: '#ff6b00',
              alpha: 1.0,
              decay: 0.02
            });
          }

          setUnits(prev =>
            prev.map(u =>
              u.team === 'enemy' && Math.hypot(u.x - bx, u.y - by) < 80 ? { ...u, hp: u.hp - 180 } : u
            )
          );
        }, i * 140);
      }
      setGeneralPowers(prev =>
        prev.map(p => (p.id === 'A10Strike' ? { ...p, currentCooldown: p.cooldown } : p))
      );
    }
  };

  // Launch superweapon at world coordinates
  const handleLaunchSuperweaponAt = (worldX: number, worldY: number) => {
    if (!playerSuperweapon) return;
    playerSuperweapon.superweaponTimer = 120; // Reset timer

    const type =
      playerFaction === 'USA'
        ? 'ParticleCannon'
        : playerFaction === 'China'
        ? 'NuclearMissile'
        : 'ScudStorm';

    playSiren(audioEnabled);

    superweaponStrikesRef.current.push({
      type,
      team: 'player',
      x: worldX,
      y: worldY,
      timer: 0,
      phase: 0,
      duration: 10
    });

    if (type === 'NuclearMissile') {
      setScreenShake(8);
      setTimeout(() => setScreenShake(0), 1200);
    }
  };

  // Tactical Commands: Stop, Scatter, Guard, AttackMove
  const handleTacticalCommand = (command: 'stop' | 'scatter' | 'guard' | 'attackMove') => {
    if (selectedUnits.length === 0) return;
    if (command === 'stop') {
      selectedUnits.forEach(u => {
        u.targetX = null;
        u.targetY = null;
        u.attackTargetId = null;
        u.attackTargetType = null;
        u.isAttackMoving = false;
      });
    } else if (command === 'scatter') {
      selectedUnits.forEach(u => {
        u.targetX = u.x + (Math.random() * 140 - 70);
        u.targetY = u.y + (Math.random() * 140 - 70);
        u.attackTargetId = null;
        u.attackTargetType = null;
        u.isAttackMoving = false;
      });
    } else if (command === 'guard') {
      selectedUnits.forEach(u => {
        u.targetX = null;
        u.targetY = null;
        u.isAttackMoving = true;
      });
    } else if (command === 'attackMove') {
      selectedUnits.forEach(u => {
        u.isAttackMoving = true;
      });
    }
  };

  // Train unit in building production queue
  const handleTrainUnit = (type: UnitTypeId) => {
    const cfg = UNIT_CONFIGS[type];
    if (credits < cfg.cost) return;

    // Find factory, barracks, airfield or HQ
    let target = buildings.find(b => {
      if (!b.isCompleted || b.team !== 'player') return false;
      if (cfg.category === 'air' && b.type.includes('Airfield')) return true;
      if (cfg.category === 'vehicle' && b.type.includes('WarFactory')) return true;
      if (cfg.category === 'infantry' && b.type.includes('Barracks')) return true;
      return false;
    });

    if (!target) {
      target = buildings.find(
        b =>
          b.team === 'player' &&
          b.isCompleted &&
          (b.type.includes('HQ') ||
            b.type.includes('WarFactory') ||
            b.type.includes('Barracks') ||
            b.type.includes('Airfield'))
      );
    }

    if (!target) return;

    setCredits(prev => prev - cfg.cost);
    target.productionQueue.push(type);
  };

  // Game Logic / Physics / AI Loop (60 FPS tick)
  useEffect(() => {
    if (inSkirmish || winner) return;

    const gameInterval = setInterval(() => {
      // 1. Update Power production & consumption
      let produced = 0;
      let consumed = 0;
      buildings.forEach(b => {
        if (b.team === 'player' && b.isCompleted) {
          produced += b.powerProduced;
          consumed += b.powerConsumed;
        }
      });
      setPowerProduced(produced);
      setPowerConsumed(consumed);

      // Low power penalty for USA: slows production 50%
      const isLowPower = playerFaction === 'USA' && consumed > produced;
      const prodRate = isLowPower ? 0.6 : 1.2;

      // 2. Building Construction Scaffolding Progress
      buildings.forEach(b => {
        if (!b.isCompleted) {
          b.buildProgress = Math.min(100, b.buildProgress + 1.2);
          if (b.buildProgress >= 100) {
            b.isCompleted = true;
            if (b.team === 'player') {
              playBuildSound(audioEnabled);
              speakVoice('buildComplete', playerFaction, audioEnabled);
            }
          }
        }

        // Superweapon countdown
        if (
          b.isCompleted &&
          (b.type.includes('ParticleCannon') || b.type.includes('NukeSilo') || b.type.includes('ScudStorm'))
        ) {
          if (b.superweaponTimer === undefined) b.superweaponTimer = 120;
          if (b.superweaponTimer > 0) {
            b.superweaponTimer = Math.max(0, b.superweaponTimer - 0.1);
          }
        }

        // Production Queue
        if (b.isCompleted && b.productionQueue.length > 0) {
          b.productionProgress += prodRate;
          if (b.productionProgress >= 100) {
            const nextType = b.productionQueue.shift()!;
            b.productionProgress = 0;

            const spawnX = b.x + b.width + 25;
            const spawnY = b.y + b.height / 2 + (Math.random() * 30 - 15);
            const newUnit = createUnit(nextType, b.team, b.faction, spawnX, spawnY);
            newUnit.targetX = spawnX + 60;
            newUnit.targetY = spawnY;

            setUnits(prev => [...prev, newUnit]);
          }
        }
      });

      // 3. Physics & Combat & Separation Steering
      PhysicsSystem.applySeparation(units);
      PhysicsSystem.updateHordeBonus(units);
      PhysicsSystem.updateUnits(
        units,
        buildings,
        supplyDocksRef.current,
        projectilesRef.current,
        particlesRef.current,
        salvageCratesRef.current,
        handleAddCash,
        audioEnabled
      );
      PhysicsSystem.updateProjectiles(
        projectilesRef.current,
        units,
        buildings,
        particlesRef.current,
        salvageCratesRef.current,
        audioEnabled
      );

      // 4. Fog of War Grid Update
      fogSystemRef.current.update(units, buildings);

      // 5. AI System Update (3-State Machine)
      aiSystemRef.current.update(
        units,
        buildings,
        difficulty,
        enemyFaction,
        aiCredits,
        amt => setAiCredits(prev => Math.max(0, prev - amt)),
        u => setUnits(prev => [...prev, u]),
        b => setBuildings(prev => [...prev, b]),
        strike => superweaponStrikesRef.current.push(strike),
        audioEnabled
      );

      // 6. Superweapon Strikes Resolution
      for (let sIdx = superweaponStrikesRef.current.length - 1; sIdx >= 0; sIdx--) {
        const s = superweaponStrikesRef.current[sIdx];
        s.phase += 0.03;

        // Damage units & buildings inside blast
        const blastRadius = s.type === 'NuclearMissile' ? 220 : s.type === 'ScudStorm' ? 160 : 60;
        const enemyTeam = s.team === 'player' ? 'enemy' : 'player';

        units.forEach(u => {
          if (u.team === enemyTeam && Math.hypot(u.x - s.x, u.y - s.y) <= blastRadius) {
            u.hp -= 8;
          }
        });

        buildings.forEach(b => {
          if (b.team === enemyTeam && Math.hypot(b.x + b.width / 2 - s.x, b.y + b.height / 2 - s.y) <= blastRadius) {
            b.hp -= 12;
          }
        });

        if (s.phase >= 1.0) {
          superweaponStrikesRef.current.splice(sIdx, 1);
        }
      }

      // 7. Cleanup dead entities
      setUnits(prev => prev.filter(u => u.hp > 0));
      setBuildings(prev => prev.filter(b => b.hp > 0));

      // 8. General Powers Cooldowns
      setGeneralPowers(prev =>
        prev.map(p => (p.currentCooldown > 0 ? { ...p, currentCooldown: Math.max(0, p.currentCooldown - 0.1) } : p))
      );

      // 9. Win / Defeat condition
      if (buildings.length > 0) {
        const playerHQAlive = buildings.some(b => b.team === 'player' && b.type.includes('HQ') && b.hp > 0);
        const enemyHQAlive = buildings.some(b => b.team === 'enemy' && b.type.includes('HQ') && b.hp > 0);

        if (!enemyHQAlive && !winner) setWinner('player');
        if (!playerHQAlive && !winner) setWinner('enemy');
      }
    }, 100);

    return () => clearInterval(gameInterval);
  }, [
    inSkirmish,
    winner,
    units,
    buildings,
    credits,
    aiCredits,
    difficulty,
    enemyFaction,
    playerFaction,
    audioEnabled,
    handleAddCash
  ]);

  // SCREEN 1: SKIRMISH SETUP MENU
  if (inSkirmish) {
    return <SkirmishMenu onStartGame={handleStartGame} />;
  }

  // SCREEN 2: 3D THREE.JS BATTLEFIELD & C&C GENERALS COMMAND HUD
  return (
    <div className="w-screen h-screen fixed inset-0 overflow-hidden bg-black select-none font-mono">
      {/* 100VH TO'LIQ 3D THREE.JS MAYDONI */}
      <ThreeGameCanvas
        faction={playerFaction}
        units={units}
        setUnits={setUnits}
        buildings={buildings}
        setBuildings={setBuildings}
        supplyDocks={supplyDocksRef.current}
        salvageCrates={salvageCratesRef.current}
        projectiles={projectilesRef.current}
        particles={particlesRef.current}
        superweaponStrikes={superweaponStrikesRef.current}
        fogSystem={fogSystemRef.current}
        camera={camera}
        setCamera={setCamera}
        selectedUnits={selectedUnits}
        setSelectedUnits={setSelectedUnits}
        selectedBuilding={selectedBuilding}
        setSelectedBuilding={setSelectedBuilding}
        placingBuildingType={placingBuildingType}
        setPlacingBuildingType={setPlacingBuildingType}
        targetingSuperweapon={targetingSuperweapon}
        setTargetingSuperweapon={setTargetingSuperweapon}
        onLaunchSuperweaponAt={handleLaunchSuperweaponAt}
        credits={credits}
        onDeductCredits={amt => setCredits(prev => Math.max(0, prev - amt))}
        audioEnabled={audioEnabled}
        screenShake={screenShake}
        cameraJump={cameraJump}
      />

      {/* C&C GENERALS TAKTIK HUD VA BOSHQARUV PULTI (100% O'ZBEKCHA) */}
      <UIOverlay
        faction={playerFaction}
        credits={credits}
        powerProduced={powerProduced}
        powerConsumed={powerConsumed}
        generalXp={generalXp}
        superweaponTimer={superweaponTimer}
        generalPowers={generalPowers}
        onTriggerPower={handleTriggerPower}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(prev => !prev)}
        onExitMenu={() => setInSkirmish(true)}
        selectedUnits={selectedUnits}
        selectedBuilding={selectedBuilding}
        camera={camera}
        setCamera={setCamera}
        fogSystem={fogSystemRef.current}
        units={units}
        buildings={buildings}
        onOrderMove={(wx, wy) => {
          selectedUnits.forEach((su, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            su.targetX = wx + (col - 1) * 32;
            su.targetY = wy + (row - 1) * 32;
          });
        }}
        onSelectBuildingToPlace={bType => setPlacingBuildingType(bType)}
        onTrainUnit={handleTrainUnit}
        onTriggerSuperweaponTargetMode={() => setTargetingSuperweapon(true)}
        isSuperweaponReady={isSuperweaponReady}
        onTacticalCommand={handleTacticalCommand}
        placingBuildingType={placingBuildingType}
        targetingSuperweapon={targetingSuperweapon}
        onMinimapJump={(wx, wy) => setCameraJump({ x: wx, y: wy, timestamp: Date.now() })}
      />

      {/* G'alaba / Mag'lubiyat oynasi */}
      {winner && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-3 sm:p-6">
          <div className="bg-[#101812] border-4 border-amber-500 p-5 sm:p-8 rounded-lg text-center shadow-2xl max-w-lg w-full">
            <h2
              className={`text-2xl sm:text-4xl font-black tracking-widest mb-3 ${
                winner === 'player' ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {winner === 'player' ? "G'ALABA! DUSHMAN BAZASI YAKSON ETILDI!" : "MAG'LUBIYAT! BAZANGIZ VAYRON BO'LDI"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6 font-mono leading-relaxed">
              {winner === 'player'
                ? "General, barcha dushman kuchlari yo'q qilindi. Maydon to'liq sizning nazoratingizda!"
                : "Afsus, bazangiz dushman hujumiga bardosh bera olmadi. Qayta jang qilishga tayyormisiz?"}
            </p>
            <button
              onClick={() => setInSkirmish(true)}
              className="px-6 sm:px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded cursor-pointer shadow-2xl transition"
            >
              SKIRMISH MENYUGA QAYTISH
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { multiplayerService } from './systems/multiplayerSystem';
import { MoveCommand } from './types/game';

import { SkirmishMenu } from './components/SkirmishMenu';
import { BattlefieldCanvas } from './components/BattlefieldCanvas';
import { UIOverlay } from './components/UIOverlay';

export default function App() {
  const [inSkirmish, setInSkirmish] = useState<boolean>(true);
  const [playerFaction, setPlayerFaction] = useState<Faction>('USA');
  const [enemyFaction, setEnemyFaction] = useState<Faction>('China');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Multiplayer State
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(1);
  const [roomId, setRoomId] = useState<string>('BATTLE_ROOM_1');

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

  const createUnit = (
    type: UnitTypeId,
    team: 'player' | 'enemy',
    faction: Faction,
    x: number,
    y: number,
    customId?: number
  ): Unit => {
    const cfg = UNIT_CONFIGS[type];
    return {
      id: customId !== undefined ? customId : Date.now() + Math.random(),
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

  // Start new Skirmish or Multiplayer match
  const handleStartGame = (settings: GameSettings) => {
    initAudio();
    const isMp = Boolean(settings.isMultiplayer);
    const pNum = (settings.playerNumber ?? 1) as 1 | 2;

    setIsMultiplayer(isMp);
    setPlayerNumber(pNum);
    if (settings.roomId) setRoomId(settings.roomId);

    setPlayerFaction(settings.playerFaction);
    setEnemyFaction(settings.enemyFaction);
    setDifficulty(settings.difficulty);
    setCredits(settings.startingCredits);
    setAiCredits(settings.difficulty === 'hard' ? 5500 : settings.difficulty === 'medium' ? 3000 : 1500);
    setGeneralXp(0);
    setWinner(null);
    fogSystemRef.current.reset();

    const isP2 = isMp && pNum === 2;

    // Initial Camera
    if (isP2) {
      setCamera({ x: 1450, y: 980, speed: 12 });
    } else {
      setCamera({ x: 0, y: 0, speed: 12 });
    }

    // BASE 1: Top-Left (120, 120)
    const base1Faction = isP2 ? settings.enemyFaction : settings.playerFaction;
    const base1Team = isP2 ? 'enemy' : 'player';
    const b1BaseType: BuildingTypeId =
      base1Faction === 'USA' ? 'USA_HQ' : base1Faction === 'China' ? 'China_HQ' : 'GLA_HQ';
    const b1Cfg = BUILDING_CONFIGS[b1BaseType];

    const b1HQ: Building = {
      id: 1,
      type: b1BaseType,
      team: base1Team,
      faction: base1Faction,
      x: 120,
      y: 120,
      width: b1Cfg.width,
      height: b1Cfg.height,
      hp: b1Cfg.hp,
      maxHp: b1Cfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: b1Cfg.powerProduced,
      powerConsumed: b1Cfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: b1Cfg.cost,
      radarAngle: 0
    };

    const b1ReactorType: BuildingTypeId =
      base1Faction === 'USA' ? 'USA_Reactor' : base1Faction === 'China' ? 'China_Reactor' : 'GLA_SupplyStash';
    const b1RCfg = BUILDING_CONFIGS[b1ReactorType];
    const b1Reactor: Building = {
      id: 3,
      type: b1ReactorType,
      team: base1Team,
      faction: base1Faction,
      x: 230,
      y: 70,
      width: b1RCfg.width,
      height: b1RCfg.height,
      hp: b1RCfg.hp,
      maxHp: b1RCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: b1RCfg.powerProduced,
      powerConsumed: b1RCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: b1RCfg.cost
    };

    const b1DepotType: BuildingTypeId =
      base1Faction === 'USA' ? 'USA_SupplyDepot' : base1Faction === 'China' ? 'China_SupplyCenter' : 'GLA_Barracks';
    const b1DCfg = BUILDING_CONFIGS[b1DepotType];
    const b1Depot: Building = {
      id: 4,
      type: b1DepotType,
      team: base1Team,
      faction: base1Faction,
      x: 90,
      y: 230,
      width: b1DCfg.width,
      height: b1DCfg.height,
      hp: b1DCfg.hp,
      maxHp: b1DCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: b1DCfg.powerProduced,
      powerConsumed: b1DCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: b1DCfg.cost
    };

    // BASE 2: Bottom-Right (2000, 1250)
    const base2Faction = isP2 ? settings.playerFaction : settings.enemyFaction;
    const base2Team = isP2 ? 'player' : 'enemy';
    const b2BaseType: BuildingTypeId =
      base2Faction === 'USA' ? 'USA_HQ' : base2Faction === 'China' ? 'China_HQ' : 'GLA_HQ';
    const b2Cfg = BUILDING_CONFIGS[b2BaseType];

    const b2HQ: Building = {
      id: 2,
      type: b2BaseType,
      team: base2Team,
      faction: base2Faction,
      x: 2000,
      y: 1250,
      width: b2Cfg.width,
      height: b2Cfg.height,
      hp: b2Cfg.hp,
      maxHp: b2Cfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: b2Cfg.powerProduced,
      powerConsumed: b2Cfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: b2Cfg.cost,
      radarAngle: 0
    };

    const b2ReactorType: BuildingTypeId =
      base2Faction === 'USA' ? 'USA_Reactor' : base2Faction === 'China' ? 'China_Reactor' : 'GLA_SupplyStash';
    const b2RCfg = BUILDING_CONFIGS[b2ReactorType];
    const b2Reactor: Building = {
      id: 5,
      type: b2ReactorType,
      team: base2Team,
      faction: base2Faction,
      x: 2120,
      y: 1200,
      width: b2RCfg.width,
      height: b2RCfg.height,
      hp: b2RCfg.hp,
      maxHp: b2RCfg.hp,
      buildProgress: 100,
      isCompleted: true,
      powerProduced: b2RCfg.powerProduced,
      powerConsumed: b2RCfg.powerConsumed,
      productionQueue: [],
      productionProgress: 0,
      cost: b2RCfg.cost
    };

    setBuildings([b1HQ, b1Reactor, b1Depot, b2HQ, b2Reactor]);

    // Initial Units
    const b1HarvesterType: UnitTypeId =
      base1Faction === 'USA' ? 'SupplyChinook' : base1Faction === 'China' ? 'SupplyTruck_China' : 'Worker_GLA';
    const b1CombatType: UnitTypeId =
      base1Faction === 'USA' ? 'Crusader' : base1Faction === 'China' ? 'Battlemaster' : 'Scorpion';

    const b2HarvesterType: UnitTypeId =
      base2Faction === 'USA' ? 'SupplyChinook' : base2Faction === 'China' ? 'SupplyTruck_China' : 'Worker_GLA';
    const b2CombatType: UnitTypeId =
      base2Faction === 'USA' ? 'Crusader' : base2Faction === 'China' ? 'Battlemaster' : 'Scorpion';

    const u1 = createUnit(b1HarvesterType, base1Team, base1Faction, 240, 160, 101);
    const u2 = createUnit(b1CombatType, base1Team, base1Faction, 280, 240, 102);

    const u3 = createUnit(b2HarvesterType, base2Team, base2Faction, 1920, 1260, 201);
    const u4 = createUnit(b2CombatType, base2Team, base2Faction, 1880, 1200, 202);

    setUnits([u1, u2, u3, u4]);
    salvageCratesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    superweaponStrikesRef.current = [];

    setInSkirmish(false);
    speakVoice('select', settings.playerFaction, audioEnabled);
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
      fogSystemRef.current.triggerSpySatellite(camera.x + 550, camera.y + 270, 20);
      playLaserBeam(audioEnabled);
      setGeneralPowers(prev =>
        prev.map(p => (p.id === 'SpySatellite' ? { ...p, currentCooldown: p.cooldown } : p))
      );
    } else if (powerId === 'EmergencyRepair') {
      setCredits(prev => prev + 750);
      setUnits(prev =>
        prev.map(u => (u.team === 'player' ? { ...u, hp: Math.min(u.maxHp, u.hp + u.maxHp * 0.5) } : u))
      );
      playBuildSound(audioEnabled);
      setGeneralPowers(prev =>
        prev.map(p => (p.id === 'EmergencyRepair' ? { ...p, currentCooldown: p.cooldown } : p))
      );
    } else if (powerId === 'A10Strike') {
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

    if (isMultiplayer) {
      multiplayerService.sendSuperweapon(type, worldX, worldY);
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
      if (isMultiplayer) {
        multiplayerService.sendMove(selectedUnits.map(u => u.id), selectedUnits[0].x, selectedUnits[0].y, false);
      }
    } else if (command === 'scatter') {
      selectedUnits.forEach(u => {
        const nx = u.x + (Math.random() * 140 - 70);
        const ny = u.y + (Math.random() * 140 - 70);
        u.targetX = nx;
        u.targetY = ny;
        u.attackTargetId = null;
        u.attackTargetType = null;
        u.isAttackMoving = false;
        if (isMultiplayer) {
          multiplayerService.sendMove([u.id], nx, ny, false);
        }
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

  // Multiplayer Event Listeners
  useEffect(() => {
    if (!isMultiplayer) return;

    multiplayerService.onRemoteMove = data => {
      const targetY = data.targetY ?? data.targetZ ?? 0;
      setUnits(prev =>
        prev.map(u => {
          if (data.unitIds.includes(u.id)) {
            return {
              ...u,
              targetX: data.targetX,
              targetY: targetY,
              attackTargetId: null,
              attackTargetType: null,
              isAttackMoving: !!data.isAttackMoving
            };
          }
          return u;
        })
      );
    };

    multiplayerService.onRemoteAttack = data => {
      setUnits(prev =>
        prev.map(u => {
          if (data.attackerIds.includes(u.id)) {
            return {
              ...u,
              attackTargetId: data.targetId,
              attackTargetType: data.targetType,
              isAttackMoving: false
            };
          }
          return u;
        })
      );
    };

    multiplayerService.onRemoteSpawn = data => {
      const cfg = UNIT_CONFIGS[data.unitType];
      const newUnit: Unit = {
        id: data.unitId || Date.now() + Math.random(),
        type: data.unitType,
        team: 'enemy',
        faction: data.faction,
        x: data.x,
        y: data.y,
        radius: cfg.radius,
        hp: cfg.hp,
        maxHp: cfg.hp,
        speed: cfg.speed,
        targetX: data.x + 60,
        targetY: data.y,
        range: cfg.range,
        damage: cfg.damage,
        fireRate: cfg.fireRate,
        lastShot: 0,
        bodyAngle: Math.PI,
        turretAngle: Math.PI,
        kills: 0,
        veterancy: 0,
        carrying: 0,
        isFlying: cfg.isFlying,
        cost: cfg.cost
      };
      setUnits(prev => {
        if (prev.some(u => u.id === newUnit.id)) return prev;
        return [...prev, newUnit];
      });
    };

    multiplayerService.onRemoteBuilding = data => {
      const cfg = BUILDING_CONFIGS[data.type];
      const newB: Building = {
        id: data.id,
        type: data.type,
        team: 'enemy',
        faction: data.faction,
        x: data.x,
        y: data.y,
        width: cfg.width,
        height: cfg.height,
        hp: cfg.hp,
        maxHp: cfg.hp,
        buildProgress: 0,
        isCompleted: false,
        powerProduced: cfg.powerProduced,
        powerConsumed: cfg.powerConsumed,
        productionQueue: [],
        productionProgress: 0,
        cost: cfg.cost,
        radarAngle: 0,
        isDefense: cfg.isDefense,
        range: cfg.range,
        damage: cfg.damage,
        fireRate: cfg.fireRate
      };
      setBuildings(prev => {
        if (prev.some(b => b.id === newB.id)) return prev;
        return [...prev, newB];
      });
    };

    multiplayerService.onRemoteSuperweapon = data => {
      superweaponStrikesRef.current.push({
        type: data.type as any,
        team: 'enemy',
        x: data.x,
        y: data.y,
        timer: 0,
        phase: 0,
        duration: 10
      });
      playSiren(audioEnabled);
    };

    multiplayerService.onRemoteStateSync = data => {
      if (!data.units) return;
      const syncMap = new Map(data.units.map(u => [u.id, u]));
      setUnits(prev =>
        prev.map(u => {
          const sync = syncMap.get(u.id);
          if (sync && u.team === 'enemy') {
            return {
              ...u,
              hp: sync.hp,
              x: Math.abs(u.x - sync.x) > 35 ? sync.x : u.x,
              y: Math.abs(u.y - sync.y) > 35 ? sync.y : u.y
            };
          }
          return u;
        })
      );
    };

    multiplayerService.onOpponentDisconnected = () => {
      setWinner('player');
    };
  }, [isMultiplayer, audioEnabled]);

  // Local Action Relays for Multiplayer
  const handleUnitMoveOrder = useCallback(
    (commands: MoveCommand[]) => {
      if (isMultiplayer && commands.length > 0) {
        multiplayerService.sendMove(
          commands.map(c => c.unitId),
          commands[0].targetX,
          commands[0].targetY,
          false
        );
      }
    },
    [isMultiplayer]
  );

  const handleUnitAttackOrder = useCallback(
    (unitIds: number[], targetId: number, targetType: 'unit' | 'building') => {
      if (isMultiplayer) {
        multiplayerService.sendAttack(unitIds, targetId, targetType);
      }
    },
    [isMultiplayer]
  );

  const handleUnitAttackMoveOrder = useCallback(
    (unitIds: number[], targetX: number, targetY: number) => {
      if (isMultiplayer) {
        multiplayerService.sendMove(unitIds, targetX, targetY, true);
      }
    },
    [isMultiplayer]
  );

  const handleBuildingPlaced = useCallback(
    (b: Building) => {
      if (isMultiplayer) {
        multiplayerService.sendBuildingPlace(b.id, b.type, b.faction, b.x, b.y);
      }
    },
    [isMultiplayer]
  );

  // Game Logic / Physics / Loop (60 FPS tick)
  useEffect(() => {
    if (inSkirmish || winner) return;

    let syncTick = 0;

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

            if (isMultiplayer && b.team === 'player') {
              multiplayerService.sendSpawn(nextType, b.faction, spawnX, spawnY, newUnit.id);
            }
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

      // 5. AI System Update (Only in Single Player mode)
      if (!isMultiplayer) {
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
      }

      // 6. Multiplayer Periodic State Synchronization (every 1.5s)
      if (isMultiplayer) {
        syncTick++;
        if (syncTick % 15 === 0) {
          multiplayerService.sendStateSync(units.filter(u => u.team === 'player'));
        }
      }

      // 7. Superweapon Strikes Resolution
      for (let sIdx = superweaponStrikesRef.current.length - 1; sIdx >= 0; sIdx--) {
        const s = superweaponStrikesRef.current[sIdx];
        s.phase += 0.03;

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

      // 8. Cleanup dead entities
      setUnits(prev => prev.filter(u => u.hp > 0));
      setBuildings(prev => prev.filter(b => b.hp > 0));

      // 9. General Powers Cooldowns
      setGeneralPowers(prev =>
        prev.map(p => (p.currentCooldown > 0 ? { ...p, currentCooldown: Math.max(0, p.currentCooldown - 0.1) } : p))
      );

      // 10. Win / Defeat condition
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
    isMultiplayer,
    handleAddCash
  ]);

  // SCREEN 1: SKIRMISH & MULTIPLAYER SETUP MENU
  if (inSkirmish) {
    return <SkirmishMenu onStartGame={handleStartGame} />;
  }

  // SCREEN 2: 2D RTS MAYDONI & C&C GENERALS COMMAND HUD
  return (
    <div className="w-screen h-screen fixed inset-0 overflow-hidden bg-black select-none font-mono">
      {/* 100VH TO'LIQ 2D BATTLEFIELD MAYDONI */}
      <BattlefieldCanvas
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
        onUnitMoveOrder={handleUnitMoveOrder}
        onUnitAttackOrder={handleUnitAttackOrder}
        onUnitAttackMoveOrder={handleUnitAttackMoveOrder}
        onBuildingPlaced={handleBuildingPlaced}
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
        onExitMenu={() => {
          if (isMultiplayer) multiplayerService.leaveRoom();
          setInSkirmish(true);
        }}
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
          if (isMultiplayer && selectedUnits.length > 0) {
            multiplayerService.sendMove(
              selectedUnits.map(u => u.id),
              wx,
              wy,
              false
            );
          }
        }}
        onSelectBuildingToPlace={bType => setPlacingBuildingType(bType)}
        onTrainUnit={handleTrainUnit}
        onTriggerSuperweaponTargetMode={() => setTargetingSuperweapon(true)}
        isSuperweaponReady={isSuperweaponReady}
        onTacticalCommand={handleTacticalCommand}
        placingBuildingType={placingBuildingType}
        targetingSuperweapon={targetingSuperweapon}
        onMinimapJump={(wx, wy) => setCameraJump({ x: wx, y: wy, timestamp: Date.now() })}
        multiplayerInfo={isMultiplayer ? { roomId, playerNumber } : null}
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
                ? isMultiplayer
                  ? "General, raqib ustidan to'liq g'alaba qozonildi! Jang maydoni sizning nazoratingizda."
                  : "General, barcha dushman kuchlari yo'q qilindi. Maydon to'liq sizning nazoratingizda!"
                : "Afsus, bazangiz dushman hujumiga bardosh bera olmadi. Qayta jang qilishga tayyormisiz?"}
            </p>
            <button
              onClick={() => {
                if (isMultiplayer) multiplayerService.leaveRoom();
                setInSkirmish(true);
              }}
              className="px-6 sm:px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded cursor-pointer shadow-2xl transition"
            >
              {isMultiplayer ? "MULTIPLAYER MENYUGA QAYTISH" : "SKIRMISH MENYUGA QAYTISH"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

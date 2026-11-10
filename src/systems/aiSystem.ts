import { Unit, Building, Difficulty, Faction, UnitTypeId, BuildingTypeId, SuperweaponStrike } from '../types/game';
import { DIFFICULTY_SETTINGS } from '../config/difficulties';
import { UNIT_CONFIGS } from '../config/factions';
import { playSiren } from './audioSystem';

export class AISystem {
  aiState: 'Economy' | 'Staging' | 'Attacking' = 'Economy';
  lastActionTime = 0;
  stagingUnits: Unit[] = [];
  stagingX = 1800;
  stagingY = 1000;

  update(
    units: Unit[],
    buildings: Building[],
    difficulty: Difficulty,
    enemyFaction: Faction,
    aiCredits: number,
    onDeductCredits: (amount: number) => void,
    onSpawnUnit: (unit: Unit) => void,
    onSpawnBuilding: (b: Building) => void,
    onTriggerSuperweapon: (strike: SuperweaponStrike) => void,
    audioEnabled = true
  ): void {
    const config = DIFFICULTY_SETTINGS[difficulty];
    const now = Date.now();

    const enemyBuildings = buildings.filter(b => b.team === 'enemy' && b.hp > 0);
    const enemyUnits = units.filter(u => u.team === 'enemy' && u.hp > 0);
    const enemyHQ = enemyBuildings.find(b => b.type.includes('HQ'));

    if (!enemyHQ) return;

    // 1. STATE 1: ECONOMY & BASE SETUP
    if (this.aiState === 'Economy') {
      const hasFactory = enemyBuildings.some(b => b.type.includes('WarFactory'));
      const workers = enemyUnits.filter(u => u.range === 0);

      if (workers.length < 2 && aiCredits >= 200) {
        // Spawn AI harvester
        const harvesterType: UnitTypeId =
          enemyFaction === 'USA' ? 'SupplyChinook' : enemyFaction === 'China' ? 'SupplyTruck_China' : 'Worker_GLA';
        const cost = UNIT_CONFIGS[harvesterType].cost;

        if (aiCredits >= cost) {
          onDeductCredits(cost);
          onSpawnUnit({
            id: Date.now() + Math.random(),
            team: 'enemy',
            faction: enemyFaction,
            type: harvesterType,
            x: enemyHQ.x - 30,
            y: enemyHQ.y + 20,
            radius: harvesterType === 'SupplyChinook' ? 16 : 12,
            hp: 200,
            maxHp: 200,
            speed: harvesterType === 'SupplyChinook' ? 2.8 : 2.2,
            targetX: null,
            targetY: null,
            range: 0,
            damage: 0,
            fireRate: 0,
            lastShot: 0,
            bodyAngle: Math.PI,
            turretAngle: Math.PI,
            kills: 0,
            veterancy: 0,
            carrying: 0,
            isFlying: harvesterType === 'SupplyChinook',
            cost
          });
        }
      }

      if (!hasFactory && aiCredits >= 700) {
        const factoryType: BuildingTypeId =
          enemyFaction === 'USA' ? 'USA_WarFactory' : enemyFaction === 'China' ? 'China_WarFactory' : 'GLA_WarFactory';
        onDeductCredits(700);
        onSpawnBuilding({
          id: Date.now() + Math.random(),
          team: 'enemy',
          faction: enemyFaction,
          type: factoryType,
          x: enemyHQ.x - 120,
          y: enemyHQ.y + 10,
          width: 95,
          height: 75,
          hp: 1200,
          maxHp: 1200,
          buildProgress: 100,
          isCompleted: true,
          powerProduced: 0,
          powerConsumed: 10,
          productionQueue: [],
          productionProgress: 0,
          cost: 700
        });
      }

      // If we have workers and factory, transition to Staging army
      if (workers.length >= 2 && hasFactory) {
        this.aiState = 'Staging';
      }
    }

    // 2. STATE 2: ARMY GATHERING (STAGING AREA)
    if (now - this.lastActionTime > config.spawnInterval) {
      this.lastActionTime = now;

      // Select army unit based on faction and difficulty
      let unitType: UnitTypeId =
        enemyFaction === 'USA' ? 'Humvee' : enemyFaction === 'China' ? 'Battlemaster' : 'Scorpion';

      const roll = Math.random();
      if (config.allowOverlord && enemyFaction === 'China' && roll > 0.6) {
        unitType = 'Overlord';
      } else if (enemyFaction === 'USA' && roll > 0.5) {
        unitType = 'Crusader';
      } else if (enemyFaction === 'GLA' && roll > 0.5) {
        unitType = 'Marauder';
      }

      const uCfg = UNIT_CONFIGS[unitType];
      if (aiCredits >= uCfg.cost) {
        onDeductCredits(uCfg.cost);
        const newUnit: Unit = {
          id: Date.now() + Math.random(),
          team: 'enemy',
          faction: enemyFaction,
          type: unitType,
          x: enemyHQ.x - 40,
          y: enemyHQ.y + Math.random() * enemyHQ.height,
          radius: uCfg.radius,
          hp: uCfg.hp,
          maxHp: uCfg.hp,
          speed: uCfg.speed,
          targetX: this.stagingX + (Math.random() * 80 - 40),
          targetY: this.stagingY + (Math.random() * 80 - 40),
          range: uCfg.range,
          damage: uCfg.damage,
          fireRate: uCfg.fireRate,
          lastShot: 0,
          bodyAngle: Math.PI,
          turretAngle: Math.PI,
          kills: 0,
          veterancy: 0,
          carrying: 0,
          cost: uCfg.cost
        };
        onSpawnUnit(newUnit);
      }
    }

    // Check if staging army has reached required count
    const combatArmy = enemyUnits.filter(u => u.range > 0);
    if (combatArmy.length >= config.stagingCount) {
      this.aiState = 'Attacking';
    }

    // 3. STATE 3: COORDINATED WAVE ATTACK
    if (this.aiState === 'Attacking') {
      const playerTargets = [
        ...buildings.filter(b => b.team === 'player' && b.hp > 0),
        ...units.filter(u => u.team === 'player' && u.hp > 0)
      ];

      if (playerTargets.length > 0) {
        combatArmy.forEach(u => {
          let chosenTarget: any = null;

          if (config.smartTargeting) {
            // Find lowest HP target within range or on map
            let minHp = Infinity;
            playerTargets.forEach(t => {
              if (t.hp < minHp) {
                minHp = t.hp;
                chosenTarget = t;
              }
            });
          } else {
            // Closest target
            let minDist = Infinity;
            playerTargets.forEach(t => {
              const d = Math.hypot(t.x - u.x, t.y - u.y);
              if (d < minDist) {
                minDist = d;
                chosenTarget = t;
              }
            });
          }

          if (chosenTarget) {
            u.targetX = 'width' in chosenTarget ? chosenTarget.x + chosenTarget.width / 2 : chosenTarget.x;
            u.targetY = 'height' in chosenTarget ? chosenTarget.y + chosenTarget.height / 2 : chosenTarget.y;
          }
        });
      }

      // If army is depleted, return to staging
      if (combatArmy.length <= 1) {
        this.aiState = 'Staging';
      }

      // Hard AI Superweapon attack
      if (config.allowSuperweapon && Math.random() < 0.005) {
        const playerHQ = buildings.find(b => b.team === 'player' && b.type.includes('HQ'));
        if (playerHQ) {
          playSiren(audioEnabled);
          onTriggerSuperweapon({
            type: enemyFaction === 'China' ? 'NuclearMissile' : enemyFaction === 'GLA' ? 'ScudStorm' : 'ParticleCannon',
            team: 'enemy',
            x: playerHQ.x + playerHQ.width / 2,
            y: playerHQ.y + playerHQ.height / 2,
            timer: 0,
            phase: 0,
            duration: 10
          });
        }
      }
    }
  }
}

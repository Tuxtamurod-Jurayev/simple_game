// =============================================================================
// Command & Conquer: Mini-Generals (5-qadam) - Types & Data Models
// =============================================================================

export type Faction = 'USA' | 'China' | 'GLA';
export type Team = 'player' | 'enemy';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type UnitTypeId =
  // USA
  | 'SupplyChinook'
  | 'Ranger'
  | 'Humvee'
  | 'Crusader'
  | 'Paladin'
  | 'USA_Raptor'
  | 'USA_Comanche'
  // China
  | 'SupplyTruck_China'
  | 'RedGuard'
  | 'GattlingTank'
  | 'Battlemaster'
  | 'Overlord'
  | 'China_MiG'
  | 'China_Helix'
  // GLA
  | 'Worker_GLA'
  | 'Rebel'
  | 'Technical'
  | 'Scorpion'
  | 'Marauder'
  | 'GLA_RocketBuggy';

export type BuildingTypeId =
  // USA
  | 'USA_HQ'
  | 'USA_Reactor'
  | 'USA_SupplyDepot'
  | 'USA_Barracks'
  | 'USA_WarFactory'
  | 'USA_Airfield'
  | 'USA_Patriot'
  | 'USA_ParticleCannon'
  // China
  | 'China_HQ'
  | 'China_Reactor'
  | 'China_SupplyCenter'
  | 'China_Barracks'
  | 'China_WarFactory'
  | 'China_Airfield'
  | 'China_GatlingCannon'
  | 'China_NukeSilo'
  // GLA
  | 'GLA_HQ'
  | 'GLA_SupplyStash'
  | 'GLA_Barracks'
  | 'GLA_WarFactory'
  | 'GLA_StingerSite'
  | 'GLA_ScudStorm';

export type VeterancyLevel = 0 | 1 | 2 | 3; // 0=Rookie, 1=Veteran (V), 2=Elite (VV), 3=Heroic (Star)

export interface Entity {
  id: number;
  team: Team;
  faction: Faction;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface Unit extends Entity {
  type: UnitTypeId;
  radius: number;
  speed: number;
  targetX: number | null;
  targetY: number | null;
  range: number;
  damage: number;
  fireRate: number; // ms
  lastShot: number;
  bodyAngle: number;
  turretAngle: number;
  kills: number;
  veterancy: VeterancyLevel;
  carrying: number; // Supplies carried
  // Special Faction attributes
  isFlying?: boolean;
  rotorAngle?: number;
  spinUpLevel?: number; // For Gattling Tank
  salvageLevel?: number; // 0=Normal, 1=Armor, 2=Rocket pod
  pdlCooldown?: number; // For Paladin laser intercept
  isHordeBoosted?: boolean; // China Horde bonus
  cost: number;
  attackTargetId?: number | null;
  attackTargetType?: 'unit' | 'building' | null;
  isAttackMoving?: boolean;
}

export interface Building extends Entity {
  type: BuildingTypeId;
  width: number;
  height: number;
  buildProgress: number; // 0 to 100 (scaffolding)
  isCompleted: boolean;
  powerProduced: number;
  powerConsumed: number;
  radarAngle?: number;
  superweaponTimer?: number; // Seconds remaining (120 -> 0)
  productionQueue: UnitTypeId[];
  productionProgress: number; // 0 to 100
  cost: number;
  isDefense?: boolean;
  range?: number;
  damage?: number;
  fireRate?: number;
  lastShot?: number;
}

export interface SupplyDock {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  supplies: number;
  maxSupplies: number;
}

export interface SalvageCrate {
  id: number;
  x: number;
  y: number;
  life: number; // decays over time
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  damage: number;
  team: Team;
  faction: Faction;
  isHeavy?: boolean;
  isLaser?: boolean;
  isRocket?: boolean;
  isTracer?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  isAnthrax?: boolean;
}

export interface SuperweaponStrike {
  type: 'ParticleCannon' | 'NuclearMissile' | 'ScudStorm';
  team: Team;
  x: number;
  y: number;
  timer: number;
  phase: number;
  duration: number;
}

export interface GeneralPower {
  id: 'SpySatellite' | 'EmergencyRepair' | 'A10Strike';
  name: string;
  cooldown: number; // Total cooldown seconds
  currentCooldown: number; // Countdown
  reqRank: number;
}

export interface Camera {
  x: number;
  y: number;
  speed: number;
}

export interface FogCell {
  state: 0 | 1 | 2; // 0: Unexplored, 1: Shroud, 2: Visible
}

export interface GameSettings {
  playerFaction: Faction;
  enemyFaction: Faction;
  difficulty: Difficulty;
  startingCredits: number;
}

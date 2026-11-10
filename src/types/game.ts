export type Team = 'player' | 'enemy';

export type UnitType = 'Worker' | 'Tank' | 'Ranger';
export type BuildingType = 'HQ' | 'EnemyHQ' | 'Barracks' | 'WarFactory';

export interface Entity {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  team: Team;
  name: string;
  icon: string;
}

export interface Unit extends Entity {
  type: UnitType;
  radius: number;
  speed: number;
  targetX: number | null;
  targetY: number | null;
  range: number;
  damage: number;
  lastShot: number;
  carrying: number;
  hullAngle: number;
  turretAngle: number;
  recoil: number;
  walkPhase: number;
}

export interface Building extends Entity {
  type: BuildingType;
  width: number;
  height: number;
  radarAngle?: number;
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

export interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  target: Entity | null;
  speed: number;
  damage: number;
  team: Team;
  isCannon: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  fade: number;
}

export interface TreadTrack {
  x: number;
  y: number;
  angle: number;
  isTank: boolean;
  alpha: number;
}

export interface BurningWreck {
  x: number;
  y: number;
  type: string;
  life: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface ClickMarker {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface GameState {
  money: number;
  energy: number;
  maxEnergy: number;
  selectedUnits: Unit[];
  selectedBuilding: Building | null;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragEndX: number;
  dragEndY: number;
  isGameOver: boolean;
  victory: boolean;
  audioEnabled: boolean;
}

export function isBuilding(entity: Entity): entity is Building {
  return 'width' in entity && typeof (entity as unknown as Building).width === 'number';
}


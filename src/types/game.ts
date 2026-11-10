export type Team = 'player' | 'enemy';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type UnitType = 'Worker' | 'Humvee' | 'Crusader' | 'Overlord';
export type BuildingType = 'HQ' | 'Barracks' | 'WarFactory' | 'PowerPlant';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  damage: number;
  team: Team;
  isHeavy?: boolean;
}

export interface Unit {
  id: number;
  type: UnitType;
  team: Team;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  targetX: number | null;
  targetY: number | null;
  range: number;
  damage: number;
  fireRate: number;
  lastShot: number;
  bodyAngle: number;
  turretAngle: number;
  carrying: number;
}

export interface Building {
  id: number;
  type: BuildingType;
  team: Team;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  radarAngle: number;
}

export interface DifficultyConfig {
  name: string;
  title: string;
  aiMoney: number;
  spawnInterval: number;
  incomeMultiplier: number;
  allowOverlord: boolean;
  description: string;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: "Oson",
    title: "Kursant (Easy)",
    aiMoney: 1500,
    spawnInterval: 9500,
    incomeMultiplier: 0.8,
    allowOverlord: false,
    description: "Raqib sekin rivojlanadi va faqat yengil texnikalar bilan kichik hujumlar uyushtiradi."
  },
  medium: {
    name: "O'rta",
    title: "Mayor (Medium)",
    aiMoney: 3000,
    spawnInterval: 6000,
    incomeMultiplier: 1.0,
    allowOverlord: false,
    description: "Muvozanatli raqib. Crusader tanklari va Humvee guruhlari bilan muntazam hujum qiladi."
  },
  hard: {
    name: "Qiyin",
    title: "General (Brutal Hard)",
    aiMoney: 5500,
    spawnInterval: 3500,
    incomeMultiplier: 1.6,
    allowOverlord: true,
    description: "Shafqatsiz AI. Ikki barobar tez boyiydi, og'ir Overlord tanklarini chiqaradi va zaif nuqtalarga zarba beradi."
  }
};

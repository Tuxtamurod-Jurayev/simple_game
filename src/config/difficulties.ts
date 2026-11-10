import { Difficulty } from '../types/game';

export interface DifficultyConfig {
  name: string;
  title: string;
  aiMoney: number;
  spawnInterval: number; // in ms
  incomeMultiplier: number;
  allowOverlord: boolean;
  stagingCount: number; // Staging area army count before wave
  smartTargeting: boolean; // Target lowest HP first
  allowSuperweapon: boolean;
  description: string;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'Oson',
    title: 'Kursant (Cadet)',
    aiMoney: 1500,
    spawnInterval: 9500,
    incomeMultiplier: 0.8,
    allowOverlord: false,
    stagingCount: 1, // Single attacks
    smartTargeting: false,
    allowSuperweapon: false,
    description: 'Raqib sekin rivojlanadi va faqat yengil texnikalar bilan bitta-bitta hujum qiladi.'
  },
  medium: {
    name: "O'rta",
    title: 'Mayor (Major)',
    aiMoney: 3000,
    spawnInterval: 6000,
    incomeMultiplier: 1.0,
    allowOverlord: false,
    stagingCount: 4, // Groups of 4
    smartTargeting: false,
    allowSuperweapon: false,
    description: 'Muvozanatli raqib. O\'rta tanklar bilan 4 talik guruh to\'plab muntazam hujum qiladi.'
  },
  hard: {
    name: 'Qiyin',
    title: 'General (Brutal General)',
    aiMoney: 5500,
    spawnInterval: 3500,
    incomeMultiplier: 1.6,
    allowOverlord: true,
    stagingCount: 7, // Waves of 7+
    smartTargeting: true, // Focuses lowest HP units first
    allowSuperweapon: true,
    description: 'Shafqatsiz AI. Tez boyiydi, 7 talik to\'lqin bilan hujum qiladi, Overlord tanklar va Superqurol ishlatadi.'
  }
};

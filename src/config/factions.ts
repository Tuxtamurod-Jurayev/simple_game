import { Faction, UnitTypeId, BuildingTypeId } from '../types/game';

export interface UnitConfig {
  id: UnitTypeId;
  name: string;
  faction: Faction;
  cost: number;
  hp: number;
  speed: number;
  range: number;
  damage: number;
  fireRate: number;
  radius: number;
  description: string;
  isFlying?: boolean;
}

export interface BuildingConfig {
  id: BuildingTypeId;
  name: string;
  faction: Faction;
  cost: number;
  hp: number;
  width: number;
  height: number;
  powerProduced: number;
  powerConsumed: number;
  buildTime: number; // in seconds
  description: string;
}

export const FACTION_COLORS: Record<Faction, { primary: string; secondary: string; accent: string; hud: string }> = {
  USA: {
    primary: '#1e3a8a',
    secondary: '#64748b',
    accent: '#38bdf8',
    hud: 'from-[#142338] to-[#0a121e]'
  },
  China: {
    primary: '#7f1d1d',
    secondary: '#b91c1c',
    accent: '#f59e0b',
    hud: 'from-[#2b1212] to-[#140808]'
  },
  GLA: {
    primary: '#78350f',
    secondary: '#a16207',
    accent: '#16a34a',
    hud: 'from-[#241a10] to-[#120d08]'
  }
};

export const UNIT_CONFIGS: Record<UnitTypeId, UnitConfig> = {
  // USA
  SupplyChinook: {
    id: 'SupplyChinook',
    name: 'Supply Chinook',
    faction: 'USA',
    cost: 350,
    hp: 250,
    speed: 2.8,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 16,
    isFlying: true,
    description: 'Havoda uchuvchi ikki parrakli vertolyot. To\'siqlarga qaramay to\'g\'ri uchib resurs tashiydi (+$140).'
  },
  Ranger: {
    id: 'Ranger',
    name: 'US Ranger',
    faction: 'USA',
    cost: 150,
    hp: 120,
    speed: 2.0,
    range: 110,
    damage: 10,
    fireRate: 500,
    radius: 8,
    description: 'Ko\'k dubulg\'ali tezkor piyoda askar, yaqin masofada pulemyotdan o\'t ochadi.'
  },
  Humvee: {
    id: 'Humvee',
    name: 'Humvee Recon',
    faction: 'USA',
    cost: 450,
    hp: 320,
    speed: 3.0,
    range: 135,
    damage: 14,
    fireRate: 550,
    radius: 14,
    description: 'Juda tezkor jip (speed: 3.0), tom qismida 360 daraja aylanuvchi pulemyot minorasi.'
  },
  Crusader: {
    id: 'Crusader',
    name: 'Crusader Tank',
    faction: 'USA',
    cost: 750,
    hp: 650,
    speed: 1.7,
    range: 165,
    damage: 38,
    fireRate: 1400,
    radius: 18,
    description: 'Asosiy jangovar tank, burchakli zirh va mustaqil aylanuvchi minora.'
  },
  Paladin: {
    id: 'Paladin',
    name: 'Paladin Tank',
    faction: 'USA',
    cost: 1100,
    hp: 950,
    speed: 1.6,
    range: 175,
    damage: 46,
    fireRate: 1500,
    radius: 20,
    description: 'Point Defense Laser: Har 3 soniyada yaqinlashayotgan 1 ta dushman snaryadini lazer bilan urib tushiradi.'
  },

  // China
  SupplyTruck_China: {
    id: 'SupplyTruck_China',
    name: 'China Supply Truck',
    faction: 'China',
    cost: 250,
    hp: 200,
    speed: 2.2,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 14,
    description: 'Og\'ir yuk mashinasi, konlardan resurs tashib bazaga pul yig\'adi (+$120).'
  },
  RedGuard: {
    id: 'RedGuard',
    name: 'Red Guard (x2)',
    faction: 'China',
    cost: 120,
    hp: 130,
    speed: 1.9,
    range: 110,
    damage: 9,
    fireRate: 550,
    radius: 8,
    description: 'Bir marta sotib olinganda birdaniga 2 ta askar chiqariladi. Oltin yulduzli qizil forma.'
  },
  GattlingTank: {
    id: 'GattlingTank',
    name: 'Gattling Tank',
    faction: 'China',
    cost: 550,
    hp: 420,
    speed: 2.3,
    range: 140,
    damage: 8,
    fireRate: 200,
    radius: 15,
    description: 'Aylanuvchi 6 stvolli pulemyot. O\'t ochgan sari otish tezligi yanada kuchayadi (Spin-up).'
  },
  Battlemaster: {
    id: 'Battlemaster',
    name: 'Battlemaster Tank',
    faction: 'China',
    cost: 700,
    hp: 620,
    speed: 1.8,
    range: 160,
    damage: 36,
    fireRate: 1350,
    radius: 17,
    description: 'Klassik Xitoy tanki, dumaloq minora va Horde Bonus bilan juda samarali.'
  },
  Overlord: {
    id: 'Overlord',
    name: 'Overlord Tank',
    faction: 'China',
    cost: 1500,
    hp: 1600,
    speed: 1.1,
    range: 195,
    damage: 75,
    fireRate: 2000,
    radius: 25,
    description: 'Ulkan 4 gusenitsali monstr tank. Minorasida 2 ta parallel og\'ir stvol va gattling pulemyoti.'
  },

  // GLA
  Worker_GLA: {
    id: 'Worker_GLA',
    name: 'GLA Worker',
    faction: 'GLA',
    cost: 150,
    hp: 150,
    speed: 2.1,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 10,
    description: 'Fidoyi ishchi: bino quradi va resurs tashib bazaga pul keltiradi (+$100).'
  },
  Rebel: {
    id: 'Rebel',
    name: 'GLA Rebel',
    faction: 'GLA',
    cost: 100,
    hp: 100,
    speed: 2.1,
    range: 105,
    damage: 9,
    fireRate: 500,
    radius: 8,
    description: 'Yashil ro\'molli eng arzon partizan askar, AK-47 quroli bilan qurollangan.'
  },
  Technical: {
    id: 'Technical',
    name: 'Technical Pickup',
    faction: 'GLA',
    cost: 350,
    hp: 260,
    speed: 3.4,
    range: 125,
    damage: 13,
    fireRate: 500,
    radius: 13,
    description: 'Eng tezkor birlik (speed: 3.4). Ochiq kuzovli pikap mashinasi, orqasida pulemyot.'
  },
  Scorpion: {
    id: 'Scorpion',
    name: 'Scorpion Tank',
    faction: 'GLA',
    cost: 550,
    hp: 500,
    speed: 2.0,
    range: 150,
    damage: 30,
    fireRate: 1300,
    radius: 16,
    description: 'Yengil qum rangli tank. Minorasi ustiga uzun yashil Scorpion raketasi o\'rnatilgan.'
  },
  Marauder: {
    id: 'Marauder',
    name: 'Marauder Tank',
    faction: 'GLA',
    cost: 950,
    hp: 1100,
    speed: 1.4,
    range: 170,
    damage: 55,
    fireRate: 1700,
    radius: 20,
    description: 'Og\'ir tank, korpusiga mahkamlangan stvol. Salvage olsa 2 stvolli gigantga aylanadi.'
  }
};

export const BUILDING_CONFIGS: Record<BuildingTypeId, BuildingConfig> = {
  // USA
  USA_HQ: {
    id: 'USA_HQ',
    name: 'USA Command Center',
    faction: 'USA',
    cost: 2000,
    hp: 3000,
    width: 90,
    height: 90,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 10,
    description: 'USA Bosh qarorgohi. Chinook ishlab chiqaradi va radar beradi.'
  },
  USA_Reactor: {
    id: 'USA_Reactor',
    name: 'Cold Fusion Reactor',
    faction: 'USA',
    cost: 500,
    hp: 800,
    width: 55,
    height: 55,
    powerProduced: 20,
    powerConsumed: 0,
    buildTime: 6,
    description: '+20 GW energiya beradi. Ichidan moviy plazma nuri pulsatsiya berib turadi.'
  },
  USA_Barracks: {
    id: 'USA_Barracks',
    name: 'USA Barracks',
    faction: 'USA',
    cost: 500,
    hp: 750,
    width: 75,
    height: 65,
    powerProduced: 0,
    powerConsumed: 5,
    buildTime: 7,
    description: 'USA piyoda kuchlarini (Ranger) tayyorlaydi.'
  },
  USA_WarFactory: {
    id: 'USA_WarFactory',
    name: 'USA War Factory',
    faction: 'USA',
    cost: 800,
    hp: 1200,
    width: 95,
    height: 75,
    powerProduced: 0,
    powerConsumed: 10,
    buildTime: 9,
    description: 'Humvee, Crusader va Paladin tanklarini ishlab chiqaradi.'
  },
  USA_ParticleCannon: {
    id: 'USA_ParticleCannon',
    name: 'Particle Cannon',
    faction: 'USA',
    cost: 2500,
    hp: 1500,
    width: 80,
    height: 80,
    powerProduced: 0,
    powerConsumed: 15,
    buildTime: 12,
    description: 'USA Superquroli: Osmondan tushuvchi moviy lazer nuri bilan dushmanni kuydiradi.'
  },

  // China
  China_HQ: {
    id: 'China_HQ',
    name: 'China Command Center',
    faction: 'China',
    cost: 2000,
    hp: 3200,
    width: 90,
    height: 90,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 10,
    description: 'China Bosh qarorgohi. Supply Truck chiqaradi va radar ta\'minlaydi.'
  },
  China_Reactor: {
    id: 'China_Reactor',
    name: 'Nuclear Reactor',
    faction: 'China',
    cost: 600,
    hp: 900,
    width: 60,
    height: 60,
    powerProduced: 30,
    powerConsumed: 0,
    buildTime: 7,
    description: '+30 GW energiya beradi. Portlasa atrofdagi birliklarga zarar yetkazadi.'
  },
  China_Barracks: {
    id: 'China_Barracks',
    name: 'China Barracks',
    faction: 'China',
    cost: 500,
    hp: 800,
    width: 75,
    height: 65,
    powerProduced: 0,
    powerConsumed: 5,
    buildTime: 7,
    description: 'Red Guard askarlarini juft-juft chiqaradi.'
  },
  China_WarFactory: {
    id: 'China_WarFactory',
    name: 'China War Factory',
    faction: 'China',
    cost: 800,
    hp: 1300,
    width: 95,
    height: 75,
    powerProduced: 0,
    powerConsumed: 10,
    buildTime: 9,
    description: 'Gattling, Battlemaster va ulkan Overlord tanklarini chiqaradi.'
  },
  China_NukeSilo: {
    id: 'China_NukeSilo',
    name: 'Nuclear Missile Silo',
    faction: 'China',
    cost: 2500,
    hp: 1500,
    width: 80,
    height: 80,
    powerProduced: 0,
    powerConsumed: 15,
    buildTime: 12,
    description: 'China Superquroli: Katta maydonga yadroviy zarba beruvchi raketa.'
  },

  // GLA
  GLA_HQ: {
    id: 'GLA_HQ',
    name: 'GLA Command Center',
    faction: 'GLA',
    cost: 1800,
    hp: 2600,
    width: 85,
    height: 85,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 8,
    description: 'GLA Bosh qarorgohi. Qum qoplari va kamuflyaj bilan o\'ralgan.'
  },
  GLA_SupplyStash: {
    id: 'GLA_SupplyStash',
    name: 'Supply Stash',
    faction: 'GLA',
    cost: 400,
    hp: 700,
    width: 60,
    height: 50,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 5,
    description: 'GLA resurs omborxonasi. Resurslarni tez qabul qilish punkti.'
  },
  GLA_Barracks: {
    id: 'GLA_Barracks',
    name: 'GLA Barracks',
    faction: 'GLA',
    cost: 400,
    hp: 650,
    width: 70,
    height: 60,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 6,
    description: 'GLA Rebel isyonchilarini arzon narxda tayyorlaydi.'
  },
  GLA_WarFactory: {
    id: 'GLA_WarFactory',
    name: 'GLA Arms Dealer',
    faction: 'GLA',
    cost: 700,
    hp: 1050,
    width: 90,
    height: 70,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 8,
    description: 'Technical, Scorpion va Marauder jangovar texnikalarini chiqaradi.'
  },
  GLA_ScudStorm: {
    id: 'GLA_ScudStorm',
    name: 'Scud Storm',
    faction: 'GLA',
    cost: 2500,
    hp: 1500,
    width: 80,
    height: 80,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 12,
    description: 'GLA Superquroli: 7 ta zaharli Scud raketasi va uzoq vaqt saqlanuvchi Anthrax gazi.'
  }
};

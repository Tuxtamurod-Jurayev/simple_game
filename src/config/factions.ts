import { Faction, UnitTypeId, BuildingTypeId } from '../types/game';

export interface UnitConfig {
  id: UnitTypeId;
  name: string;
  uzbekName: string;
  faction: Faction;
  cost: number;
  hp: number;
  speed: number;
  range: number;
  damage: number;
  fireRate: number;
  radius: number;
  description: string;
  category: 'infantry' | 'vehicle' | 'air';
  isFlying?: boolean;
}

export interface BuildingConfig {
  id: BuildingTypeId;
  name: string;
  uzbekName: string;
  faction: Faction;
  cost: number;
  hp: number;
  width: number;
  height: number;
  powerProduced: number;
  powerConsumed: number;
  buildTime: number; // in seconds
  description: string;
  category: 'base' | 'economy' | 'production' | 'air' | 'defense' | 'superweapon';
  isDefense?: boolean;
  range?: number;
  damage?: number;
  fireRate?: number;
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
  // ==================== USA BO'LINMALARI ====================
  SupplyChinook: {
    id: 'SupplyChinook',
    name: 'Supply Chinook',
    uzbekName: 'Chinook (Resurs tashuvchi)',
    faction: 'USA',
    cost: 350,
    hp: 250,
    speed: 2.8,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 16,
    isFlying: true,
    category: 'air',
    description: 'Havoda uchuvchi ikki parrakli vertolyot. Daryo va to\'siqlarga qaramay to\'g\'ridan-to\'g\'ri uchib omborga pul tashiydi (+$140).'
  },
  Ranger: {
    id: 'Ranger',
    name: 'US Ranger',
    uzbekName: 'Reyndjer (Piyoda askar)',
    faction: 'USA',
    cost: 150,
    hp: 120,
    speed: 2.0,
    range: 110,
    damage: 10,
    fireRate: 500,
    radius: 8,
    category: 'infantry',
    description: 'Tezkor piyoda maxsus askar, dushmanga pulemyotdan qisqa masofada o\'t ochadi.'
  },
  Humvee: {
    id: 'Humvee',
    name: 'Humvee Recon',
    uzbekName: 'Humvee (Jangovar jip)',
    faction: 'USA',
    cost: 450,
    hp: 320,
    speed: 3.0,
    range: 135,
    damage: 14,
    fireRate: 550,
    radius: 14,
    category: 'vehicle',
    description: 'Yuqori tezlikka ega zirhli mashina, tomida 360 daraja mustaqil aylanuvchi pulemyot.'
  },
  Crusader: {
    id: 'Crusader',
    name: 'Crusader Tank',
    uzbekName: 'Krusader (Asosiy tank)',
    faction: 'USA',
    cost: 750,
    hp: 650,
    speed: 1.7,
    range: 165,
    damage: 38,
    fireRate: 1400,
    radius: 18,
    category: 'vehicle',
    description: 'AQSH asosiy zarba beruvchi tanki, mustahkam burchakli zirh va og\'ir to\'p.'
  },
  Paladin: {
    id: 'Paladin',
    name: 'Paladin Tank',
    uzbekName: 'Paladin (Lazerli tank)',
    faction: 'USA',
    cost: 1100,
    hp: 950,
    speed: 1.6,
    range: 175,
    damage: 46,
    fireRate: 1500,
    radius: 20,
    category: 'vehicle',
    description: 'Himoya lazerli tank: Har 3 soniyada havoda yaqinlashayotgan 1 ta dushman raketasini yo\'q qiladi.'
  },
  USA_Raptor: {
    id: 'USA_Raptor',
    name: 'F-22 Raptor',
    uzbekName: 'Raptor (Qiruvchi samolyot)',
    faction: 'USA',
    cost: 1200,
    hp: 450,
    speed: 4.5,
    range: 220,
    damage: 70,
    fireRate: 2200,
    radius: 18,
    isFlying: true,
    category: 'air',
    description: 'Tovushdan tez qiruvchi reaktiv samolyot. Dushmanning har qanday nuqtasiga kutilmagan kuchli havo zarbasi beradi.'
  },
  USA_Comanche: {
    id: 'USA_Comanche',
    name: 'Comanche Stealth',
    uzbekName: 'Komanche (Hujumkor vertolyot)',
    faction: 'USA',
    cost: 1000,
    hp: 520,
    speed: 3.2,
    range: 180,
    damage: 48,
    fireRate: 900,
    radius: 17,
    isFlying: true,
    category: 'air',
    description: 'Hellfire raketalari va 20mm to\'p bilan jihozlangan ko\'p funksiyali hujum vertolyoti.'
  },

  // ==================== CHINA BO'LINMALARI ====================
  SupplyTruck_China: {
    id: 'SupplyTruck_China',
    name: 'China Supply Truck',
    uzbekName: 'Yuk mashinasi (Resurs tashuvchi)',
    faction: 'China',
    cost: 250,
    hp: 200,
    speed: 2.2,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 14,
    category: 'vehicle',
    description: 'Resurs konlaridan muntazam pul tashuvchi og\'ir transport mashinasi (+$120).'
  },
  RedGuard: {
    id: 'RedGuard',
    name: 'Red Guard (x2)',
    uzbekName: 'Qizil Gvardiya (Piyodalar)',
    faction: 'China',
    cost: 120,
    hp: 130,
    speed: 1.9,
    range: 110,
    damage: 9,
    fireRate: 550,
    radius: 8,
    category: 'infantry',
    description: 'Bir marta buyurtma berilganda ikkita askar bir vaqtda safga qo\'shiladi.'
  },
  GattlingTank: {
    id: 'GattlingTank',
    name: 'Gattling Tank',
    uzbekName: 'Gatling tanki (Tezotuvchi)',
    faction: 'China',
    cost: 550,
    hp: 420,
    speed: 2.3,
    range: 140,
    damage: 8,
    fireRate: 200,
    radius: 15,
    category: 'vehicle',
    description: '6 stvolli aylanuvchi avtomat minora. O\'q otgan sari aylanish tezligi va kuchi yanada ortadi.'
  },
  Battlemaster: {
    id: 'Battlemaster',
    name: 'Battlemaster Tank',
    uzbekName: 'Battlemaster (Jang ustasi)',
    faction: 'China',
    cost: 700,
    hp: 620,
    speed: 1.8,
    range: 160,
    damage: 36,
    fireRate: 1350,
    radius: 17,
    category: 'vehicle',
    description: 'Klassik Xitoy og\'ir tanki. 4 tasi birga to\'planganda O\'rda bonusi (+25% tezlik) oladi.'
  },
  Overlord: {
    id: 'Overlord',
    name: 'Overlord Tank',
    uzbekName: 'Overlord (Ulkan supertank)',
    faction: 'China',
    cost: 1500,
    hp: 1600,
    speed: 1.1,
    range: 195,
    damage: 75,
    fireRate: 2000,
    radius: 25,
    category: 'vehicle',
    description: '4 ta gusenitsali ulkan platforma, qo\'shaloq og\'ir stvollar va barcha to\'siqlarni ezib o\'tuvchi kuch.'
  },
  China_MiG: {
    id: 'China_MiG',
    name: 'MiG Fighter',
    uzbekName: 'MiG (Qiruvchi samolyot)',
    faction: 'China',
    cost: 1100,
    hp: 420,
    speed: 4.4,
    range: 210,
    damage: 65,
    fireRate: 2100,
    radius: 17,
    isFlying: true,
    category: 'air',
    description: 'Reaktiv qiruvchi samolyot, qora tutun va olovli raketalar bilan dushman bazasini yoqadi.'
  },
  China_Helix: {
    id: 'China_Helix',
    name: 'Helix Heavy Chopper',
    uzbekName: 'Helix (Og\'ir jangovar vertolyot)',
    faction: 'China',
    cost: 1150,
    hp: 680,
    speed: 2.7,
    range: 170,
    damage: 55,
    fireRate: 1100,
    radius: 20,
    isFlying: true,
    category: 'air',
    description: 'Katta yuk ko\'taruvchi va jangovar qanotlarga ega og\'ir Xitoy vertolyoti.'
  },

  // ==================== GLA BO'LINMALARI ====================
  Worker_GLA: {
    id: 'Worker_GLA',
    name: 'GLA Worker',
    uzbekName: 'Ishchi (Bino quruvchi / Yig\'uvchi)',
    faction: 'GLA',
    cost: 150,
    hp: 150,
    speed: 2.1,
    range: 0,
    damage: 0,
    fireRate: 0,
    radius: 10,
    category: 'infantry',
    description: 'Barcha binolarni quradi va resurs konlaridan bazaga yuk tashiydi (+$100).'
  },
  Rebel: {
    id: 'Rebel',
    name: 'GLA Rebel',
    uzbekName: 'Qo\'zg\'olonchi (Avtomatli askar)',
    faction: 'GLA',
    cost: 100,
    hp: 100,
    speed: 2.1,
    range: 105,
    damage: 9,
    fireRate: 500,
    radius: 8,
    category: 'infantry',
    description: 'Yashil kiyingan arzon partizan askar, AK-47 quroli bilan o\'t ochadi.'
  },
  Technical: {
    id: 'Technical',
    name: 'Technical Pickup',
    uzbekName: 'Texnik (Pulemyotli pikap)',
    faction: 'GLA',
    cost: 350,
    hp: 260,
    speed: 3.4,
    range: 125,
    damage: 13,
    fireRate: 500,
    radius: 13,
    category: 'vehicle',
    description: 'O\'yindagi eng tezkor yengil avtomobil. Orqa kuzoviga pulemyot o\'rnatilgan.'
  },
  Scorpion: {
    id: 'Scorpion',
    name: 'Scorpion Tank',
    uzbekName: 'Chayon (Raketali tank)',
    faction: 'GLA',
    cost: 550,
    hp: 500,
    speed: 2.0,
    range: 150,
    damage: 30,
    fireRate: 1300,
    radius: 16,
    category: 'vehicle',
    description: 'Harakatlanuvchan tank, to\'pi ustiga o\'rnatilgan Scorpion raketasi bilan qurollangan.'
  },
  Marauder: {
    id: 'Marauder',
    name: 'Marauder Tank',
    uzbekName: 'Qaroqchi (Og\'ir tank)',
    faction: 'GLA',
    cost: 950,
    hp: 1100,
    speed: 1.4,
    range: 170,
    damage: 55,
    fireRate: 1700,
    radius: 20,
    category: 'vehicle',
    description: 'Og\'ir jangovar tank. Maydonda qolgan temir qutilarni (Salvage) terib ikkita stvolga ega bo\'ladi.'
  },
  GLA_RocketBuggy: {
    id: 'GLA_RocketBuggy',
    name: 'Rocket Buggy',
    uzbekName: 'Raketa Baggi (Uzoq masofa)',
    faction: 'GLA',
    cost: 650,
    hp: 280,
    speed: 3.3,
    range: 220,
    damage: 42,
    fireRate: 1800,
    radius: 14,
    category: 'vehicle',
    description: 'Uzoq masofadan dushman bazasi va mudofaasiga raketalar yo\'llaydigan chaqqon mashina.'
  }
};

export const BUILDING_CONFIGS: Record<BuildingTypeId, BuildingConfig> = {
  // ==================== USA BINOLARI ====================
  USA_HQ: {
    id: 'USA_HQ',
    name: 'USA Command Center',
    uzbekName: 'Bosh qarorgoh (HQ)',
    faction: 'USA',
    cost: 2000,
    hp: 3000,
    width: 90,
    height: 90,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 10,
    category: 'base',
    description: 'AQSH armiyasining asosiy qo\'mondonlik markazi. Chinook vertolyotlarini chiqaradi va radarni ta\'minlaydi.'
  },
  USA_Reactor: {
    id: 'USA_Reactor',
    name: 'Cold Fusion Reactor',
    uzbekName: 'Sovuq sintez reaktori',
    faction: 'USA',
    cost: 500,
    hp: 800,
    width: 55,
    height: 55,
    powerProduced: 25,
    powerConsumed: 0,
    buildTime: 6,
    category: 'base',
    description: 'Bazaga +25 GW elektr quvvati beradi. Binolar va lazer qurollari ishlashi uchun zarur.'
  },
  USA_SupplyDepot: {
    id: 'USA_SupplyDepot',
    name: 'Supply Center',
    uzbekName: 'Resurs ombori (Depo)',
    faction: 'USA',
    cost: 800,
    hp: 1000,
    width: 75,
    height: 70,
    powerProduced: 0,
    powerConsumed: 2,
    buildTime: 8,
    category: 'economy',
    description: 'Pul va resurslarni qabul qiluvchi bosh omborxona. Qurilgach, o\'ziga qo\'shimcha Chinook beradi.'
  },
  USA_Barracks: {
    id: 'USA_Barracks',
    name: 'USA Barracks',
    uzbekName: 'Kazarma (Piyodalar bazasi)',
    faction: 'USA',
    cost: 500,
    hp: 750,
    width: 75,
    height: 65,
    powerProduced: 0,
    powerConsumed: 4,
    buildTime: 7,
    category: 'production',
    description: 'Piyoda qo\'shinlarni (Reyndjer) tayyorlovchi harbiy bino.'
  },
  USA_WarFactory: {
    id: 'USA_WarFactory',
    name: 'USA War Factory',
    uzbekName: 'Mashina zavodi (Tanklar)',
    faction: 'USA',
    cost: 1000,
    hp: 1300,
    width: 95,
    height: 75,
    powerProduced: 0,
    powerConsumed: 8,
    buildTime: 9,
    category: 'production',
    description: 'Humvee, Krusader va Paladin og\'ir tanklarini chiqaruvchi mexanizatsiyalashgan zavod.'
  },
  USA_Airfield: {
    id: 'USA_Airfield',
    name: 'Military Airfield',
    uzbekName: 'Harbiy Aerodrom (Samolyotlar)',
    faction: 'USA',
    cost: 1200,
    hp: 1100,
    width: 105,
    height: 85,
    powerProduced: 0,
    powerConsumed: 10,
    buildTime: 10,
    category: 'air',
    description: 'Raptor qiruvchi samolyotlari va Comanche hujumkor vertolyotlarini ishlab chiqaruvchi va yoqilg\'i quyuvchi aerodrom.'
  },
  USA_Patriot: {
    id: 'USA_Patriot',
    name: 'Patriot Missile System',
    uzbekName: 'Patriot himoya minorasi',
    faction: 'USA',
    cost: 600,
    hp: 700,
    width: 45,
    height: 45,
    powerProduced: 0,
    powerConsumed: 6,
    buildTime: 6,
    category: 'defense',
    isDefense: true,
    range: 220,
    damage: 35,
    fireRate: 1100,
    description: 'Avtomatik mudofaa: 4 ta konteynerdan dushman samolyotlari va tanklariga uzoq masofali raketalar otadi.'
  },
  USA_ParticleCannon: {
    id: 'USA_ParticleCannon',
    name: 'Particle Cannon',
    uzbekName: 'Zarracha to\'pi (Superqurol)',
    faction: 'USA',
    cost: 2500,
    hp: 1600,
    width: 85,
    height: 85,
    powerProduced: 0,
    powerConsumed: 15,
    buildTime: 14,
    category: 'superweapon',
    description: 'AQSH strategik superquroli: Kosmik orbital sun\'iy yo\'ldoshdan yerga moviy lazer nuri yo\'llaydi.'
  },

  // ==================== CHINA BINOLARI ====================
  China_HQ: {
    id: 'China_HQ',
    name: 'China Command Center',
    uzbekName: 'Bosh qarorgoh (HQ)',
    faction: 'China',
    cost: 2000,
    hp: 3200,
    width: 90,
    height: 90,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 10,
    category: 'base',
    description: 'Xitoy Qurolli Kuchlari qo\'mondonlik markazi. Yuk mashinalari chiqaradi va radarni ta\'minlaydi.'
  },
  China_Reactor: {
    id: 'China_Reactor',
    name: 'Nuclear Reactor',
    uzbekName: 'Yadro reaktori',
    faction: 'China',
    cost: 600,
    hp: 900,
    width: 60,
    height: 60,
    powerProduced: 35,
    powerConsumed: 0,
    buildTime: 7,
    category: 'base',
    description: 'Bazaga +35 GW quvvat beradi. Buzilganda qisqa radiatsiya to\'lqini tarqaladi.'
  },
  China_SupplyCenter: {
    id: 'China_SupplyCenter',
    name: 'China Supply Center',
    uzbekName: 'Resurs ombori (Depo)',
    faction: 'China',
    cost: 750,
    hp: 1050,
    width: 75,
    height: 70,
    powerProduced: 0,
    powerConsumed: 2,
    buildTime: 8,
    category: 'economy',
    description: 'Resurs yuk mashinalari olib kelgan mablag\'larni qabul qiluvchi asosiy ombor.'
  },
  China_Barracks: {
    id: 'China_Barracks',
    name: 'China Barracks',
    uzbekName: 'Kazarma (Piyodalar bazasi)',
    faction: 'China',
    cost: 500,
    hp: 800,
    width: 75,
    height: 65,
    powerProduced: 0,
    powerConsumed: 4,
    buildTime: 7,
    category: 'production',
    description: 'Qizil Gvardiya piyoda askarlarini juftlikda safga kiritadi.'
  },
  China_WarFactory: {
    id: 'China_WarFactory',
    name: 'China War Factory',
    uzbekName: 'Mashina zavodi (Tanklar)',
    faction: 'China',
    cost: 1000,
    hp: 1350,
    width: 95,
    height: 75,
    powerProduced: 0,
    powerConsumed: 8,
    buildTime: 9,
    category: 'production',
    description: 'Gatling tanki, Battlemaster va gigant Overlord tanklarini yig\'uvchi og\'ir harbiy zavod.'
  },
  China_Airfield: {
    id: 'China_Airfield',
    name: 'China Airbase',
    uzbekName: 'Aerodrom (Aviabaza)',
    faction: 'China',
    cost: 1100,
    hp: 1150,
    width: 105,
    height: 85,
    powerProduced: 0,
    powerConsumed: 8,
    buildTime: 10,
    category: 'air',
    description: 'MiG qiruvchi samolyotlari va og\'ir Helix vertolyotlarini ishlab chiqaradi.'
  },
  China_GatlingCannon: {
    id: 'China_GatlingCannon',
    name: 'Gatling Cannon Tower',
    uzbekName: 'Gatling himoya minorasi',
    faction: 'China',
    cost: 650,
    hp: 750,
    width: 45,
    height: 45,
    powerProduced: 0,
    powerConsumed: 5,
    buildTime: 6,
    category: 'defense',
    isDefense: true,
    range: 190,
    damage: 18,
    fireRate: 350,
    description: 'Avtomatik mudofaa: 4 stvolli aylanuvchi to\'p yaqinlashgan dushmanga shiddatli o\'q yog\'diradi.'
  },
  China_NukeSilo: {
    id: 'China_NukeSilo',
    name: 'Nuclear Missile Silo',
    uzbekName: 'Yadro shaxtasi (Superqurol)',
    faction: 'China',
    cost: 2500,
    hp: 1600,
    width: 85,
    height: 85,
    powerProduced: 0,
    powerConsumed: 15,
    buildTime: 14,
    category: 'superweapon',
    description: 'Xitoy strategik superquroli: Dushman bazasini yer bilan yakson qiluvchi termoyadroviy ballistik raketa.'
  },

  // ==================== GLA BINOLARI ====================
  GLA_HQ: {
    id: 'GLA_HQ',
    name: 'GLA Command Center',
    uzbekName: 'Bosh qarorgoh (HQ)',
    faction: 'GLA',
    cost: 1800,
    hp: 2600,
    width: 85,
    height: 85,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 8,
    category: 'base',
    description: 'GLA partizan qo\'mondonlik markazi. Ishchilarni chiqaradi, elektr energiyasiga muhtoj emas.'
  },
  GLA_SupplyStash: {
    id: 'GLA_SupplyStash',
    name: 'Supply Stash',
    uzbekName: 'Resurs yashirin ombori',
    faction: 'GLA',
    cost: 450,
    hp: 750,
    width: 65,
    height: 55,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 5,
    category: 'economy',
    description: 'Partizanlar resurs yashiradigan va tez mablag\' qabul qiladigan omborxona.'
  },
  GLA_Barracks: {
    id: 'GLA_Barracks',
    name: 'GLA Barracks',
    uzbekName: 'Kazarma (Piyodalar bazasi)',
    faction: 'GLA',
    cost: 400,
    hp: 650,
    width: 70,
    height: 60,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 6,
    category: 'production',
    description: 'Qo\'zg\'olonchi arzon piyodalarni safga tayyorlaydi.'
  },
  GLA_WarFactory: {
    id: 'GLA_WarFactory',
    name: 'GLA Arms Dealer',
    uzbekName: 'Mashina ustaxonasi (Texnika)',
    faction: 'GLA',
    cost: 750,
    hp: 1100,
    width: 90,
    height: 70,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 8,
    category: 'production',
    description: 'Texnik pikaplari, Chayon tanklari va Raketa baggilarini yig\'adi.'
  },
  GLA_StingerSite: {
    id: 'GLA_StingerSite',
    name: 'Stinger Site Bunker',
    uzbekName: 'Stinger raketa bunkeri',
    faction: 'GLA',
    cost: 550,
    hp: 650,
    width: 45,
    height: 45,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 6,
    category: 'defense',
    isDefense: true,
    range: 200,
    damage: 32,
    fireRate: 1200,
    description: 'Avtomatik mudofaa: Qum qoplari ortidan dushman tank va vertolyotlariga Stinger raketalari otadi.'
  },
  GLA_ScudStorm: {
    id: 'GLA_ScudStorm',
    name: 'Scud Storm',
    uzbekName: 'Skad bo\'roni (Superqurol)',
    faction: 'GLA',
    cost: 2500,
    hp: 1500,
    width: 85,
    height: 85,
    powerProduced: 0,
    powerConsumed: 0,
    buildTime: 14,
    category: 'superweapon',
    description: 'GLA strategik superquroli: 9 ta zaharli kimyoviy Scud raketasi va uzoq saqlanuvchi Antraks buluti.'
  }
};

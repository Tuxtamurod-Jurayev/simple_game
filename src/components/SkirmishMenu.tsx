import React from 'react';
import { Faction, Difficulty, GameSettings } from '../types/game';
import { DIFFICULTY_SETTINGS } from '../config/difficulties';

interface SkirmishMenuProps {
  onStartGame: (settings: GameSettings) => void;
}

export const SkirmishMenu: React.FC<SkirmishMenuProps> = ({ onStartGame }) => {
  const [playerFaction, setPlayerFaction] = React.useState<Faction>('USA');
  const [enemyFaction, setEnemyFaction] = React.useState<Faction>('China');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('medium');
  const [startingCredits, setStartingCredits] = React.useState<number>(5000);

  const factionsList: { id: Faction; name: string; title: string; desc: string; perks: string[] }[] = [
    {
      id: 'USA',
      name: 'United States of America',
      title: 'Yuqori Texnologiya va Lazer',
      desc: 'Kuchli havo floti (Supply Chinook), lazer bilan himoyalangan Paladin tanklari va osmondan uruvchi Particle Cannon.',
      perks: ['Supply Chinook (Uchuvchi vertolyot)', 'Paladin Point Defense Laser', 'Particle Cannon Superquroli']
    },
    {
      id: 'China',
      name: 'People\'s Republic of China',
      title: 'Og\'ir Zirh va Horde Bonus',
      desc: 'Ulkan Overlord tanklari, tez otuvchi Gattling texnikasi va 4+ tank birga turganda 25% tezroq otuvchi Horde Bonusi.',
      perks: ['Horde Bonus (+25% otish tezligi)', 'Overlord 2 stvolli gigant tank', 'Taktik Yadroviy Raketa (Nuke)']
    },
    {
      id: 'GLA',
      name: 'Global Liberation Army',
      title: 'Partizanlik va Salvage',
      desc: 'Elektr energiyasiga muhtoj emas! Dushman tanklari portlaganda tushgan Salvage qutilarini olib qurollarini kuchaytiradi.',
      perks: ['Elektr energiyasi shart emas (0 Power)', 'Salvage Crates qurollarni kuchaytiradi', 'Scud Storm zaharli gazi']
    }
  ];

  const handleStart = () => {
    onStartGame({
      playerFaction,
      enemyFaction,
      difficulty,
      startingCredits
    });
  };

  return (
    <div className="min-h-screen bg-[#070b08] text-slate-100 flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="max-w-4xl w-full bg-[#111712] border-2 border-amber-500/70 rounded-lg p-6 shadow-2xl">
        {/* Sarlavha */}
        <div className="text-center border-b border-slate-700/80 pb-4 mb-6">
          <div className="text-[11px] tracking-widest text-amber-400 uppercase font-bold">
            Tactical Skirmish Simulator v5.0 — Asymmetric Factions
          </div>
          <h1 className="text-3xl font-black text-amber-500 tracking-wider mt-1">
            COMMAND & CONQUER: GENERALS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            USA, China va GLA fraktsiyalari to'qnashuvi — Haqiqiy C&C strategiya dvijogi
          </p>
        </div>

        {/* 1. O'YINCHI FRAKTSIYASINI TANLASH */}
        <div className="mb-6">
          <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
            1. O'zingizning Fraktsiyangizni Tanlang:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {factionsList.map(f => {
              const active = playerFaction === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setPlayerFaction(f.id)}
                  className={`cursor-pointer p-3.5 rounded border-2 transition-all ${
                    active
                      ? f.id === 'USA'
                        ? 'border-sky-400 bg-sky-950/40 shadow-lg'
                        : f.id === 'China'
                        ? 'border-red-400 bg-red-950/40 shadow-lg'
                        : 'border-amber-400 bg-amber-950/40 shadow-lg'
                      : 'border-slate-700/80 bg-[#161e18] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-base text-white">{f.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-amber-400 border border-slate-600">
                      {f.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{f.desc}</p>
                  <ul className="text-[10px] text-emerald-400 space-y-0.5 border-t border-slate-700/60 pt-1.5">
                    {f.perks.map((p, idx) => (
                      <li key={idx}>✓ {p}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. RAQIB AI SOZLAMALARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-t border-slate-800 pt-4">
          {/* Raqib Fraktsiyasi */}
          <div>
            <label className="text-xs font-bold text-amber-300 uppercase block mb-1.5">
              2. Raqib Fraktsiyasi:
            </label>
            <div className="flex gap-2">
              {(['China', 'GLA', 'USA'] as Faction[]).map(f => (
                <button
                  key={f}
                  onClick={() => setEnemyFaction(f)}
                  className={`flex-1 py-2 text-xs font-bold rounded border cursor-pointer transition ${
                    enemyFaction === f
                      ? 'bg-amber-500 text-black border-amber-300 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* AI Qiyinchilik Darajasi */}
          <div>
            <label className="text-xs font-bold text-amber-300 uppercase block mb-1.5">
              3. AI Darajasi:
            </label>
            <div className="flex gap-1.5">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 text-xs font-bold rounded border cursor-pointer transition ${
                    difficulty === d
                      ? 'bg-amber-500 text-black border-amber-300 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {DIFFICULTY_SETTINGS[d].name}
                </button>
              ))}
            </div>
          </div>

          {/* Boshlang'ich Mablag' */}
          <div>
            <label className="text-xs font-bold text-amber-300 uppercase block mb-1.5">
              4. Boshlang'ich Mablag':
            </label>
            <div className="flex gap-1.5">
              {[2500, 5000, 10000].map(cash => (
                <button
                  key={cash}
                  onClick={() => setStartingCredits(cash)}
                  className={`flex-1 py-2 text-xs font-bold rounded border cursor-pointer transition ${
                    startingCredits === cash
                      ? 'bg-amber-500 text-black border-amber-300 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  ${cash}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* JANGNI BOSHLASH TUGMASI */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-base tracking-widest uppercase rounded shadow-xl transition cursor-pointer"
        >
          JANG MAYDONIGA KIRISH (DEPLOY TO BATTLEFIELD)
        </button>
      </div>
    </div>
  );
};

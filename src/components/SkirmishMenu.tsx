import React, { useState } from 'react';
import { Faction, Difficulty, GameSettings } from '../types/game';
import { playBuildSound } from '../systems/audioSystem';

interface SkirmishMenuProps {
  onStartGame: (settings: GameSettings) => void;
}

export const SkirmishMenu: React.FC<SkirmishMenuProps> = ({ onStartGame }) => {
  const [playerFaction, setPlayerFaction] = useState<Faction>('USA');
  const [enemyFaction, setEnemyFaction] = useState<Faction>('China');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingCredits, setStartingCredits] = useState<number>(5000);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const factions = [
    {
      id: 'USA' as Faction,
      name: 'AQSH (USA)',
      sub: 'Yuqori Texnologiya',
      color: 'from-blue-600/30 to-blue-950/80',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/30',
      accent: 'text-blue-400',
      features: ['Lazerli Paladin tanki', 'Supply Chinook vertolyoti', 'Orbital Zarracha to\'pi'],
      stats: { attack: '85%', armor: '75%', tech: '100%' }
    },
    {
      id: 'China' as Faction,
      name: 'Xitoy (CHINA)',
      sub: 'Og\'ir Zirh & O\'rda',
      color: 'from-red-600/30 to-red-950/80',
      border: 'border-red-500',
      glow: 'shadow-red-500/30',
      accent: 'text-red-400',
      features: ['Overlord supertanki', 'Gatling tezotuvchi to\'p', 'Yadroviy raketa zarbasi'],
      stats: { attack: '100%', armor: '95%', tech: '70%' }
    },
    {
      id: 'GLA' as Faction,
      name: 'GLA (Partizanlar)',
      sub: 'Resurssiz & Salvage',
      color: 'from-emerald-600/30 to-emerald-950/80',
      border: 'border-emerald-500',
      glow: 'shadow-emerald-500/30',
      accent: 'text-emerald-400',
      features: ['Elektr quvvati shart emas', 'Texnikani kuchaytirish', 'Skad zaharli bo\'roni'],
      stats: { attack: '80%', armor: '60%', tech: '85%' }
    }
  ];

  const handleStart = () => {
    setIsDeploying(true);
    playBuildSound();
    setTimeout(() => {
      onStartGame({
        playerFaction,
        enemyFaction,
        difficulty,
        startingCredits
      });
    }, 450);
  };

  return (
    <div className="w-screen h-screen fixed inset-0 bg-[#050906] flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      {/* Background Military Radar Sweeper Animation */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="w-[750px] h-[750px] rounded-full border border-emerald-500/30 relative flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/20" />
          <div className="w-[250px] h-[250px] rounded-full border border-emerald-500/20" />
          <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />
          {/* Rotating radar sweep beam */}
          <div className="absolute w-full h-full rounded-full animate-spin [animation-duration:8s] bg-gradient-to-tr from-transparent via-transparent to-emerald-500/20 pointer-events-none" />
        </div>
      </div>

      {/* Main Tactical Card */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0c140e]/95 border-2 border-amber-500/80 rounded-xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <h1 className="text-2xl font-black tracking-widest text-amber-400 uppercase drop-shadow">
                COMMAND & CONQUER: GENERALS 3D
              </h1>
              <p className="text-[11px] text-slate-400 font-bold">
                HARBIY TAKTIK SİMULYATOR • THREE.JS 3D DVIJOK
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded">
            HOLAT: TIZIM FAOL (60 FPS)
          </div>
        </div>

        {/* 1. Faction Selection (Concise, animated cards) */}
        <div>
          <label className="text-xs font-black text-amber-300 uppercase tracking-wider block mb-2.5">
            1. FRAKTSIYANGIZNI TANLANG:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {factions.map(f => {
              const isSelected = playerFaction === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setPlayerFaction(f.id)}
                  className={`cursor-pointer rounded-lg p-3.5 border-2 transition-all duration-200 relative overflow-hidden bg-gradient-to-b ${f.color} ${
                    isSelected
                      ? `${f.border} shadow-xl scale-[1.02] bg-opacity-90`
                      : 'border-slate-700/80 hover:border-slate-500 opacity-75 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl uppercase">
                      TANLANDI
                    </div>
                  )}

                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-base font-black text-white tracking-wide">{f.name}</span>
                  </div>
                  <div className={`text-[11px] font-bold ${f.accent} mb-2.5`}>{f.sub}</div>

                  {/* Feature Bullets */}
                  <div className="space-y-1 text-[11px] text-slate-200 mb-3 border-t border-white/10 pt-2">
                    {f.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Concise Stats Bars */}
                  <div className="space-y-1 text-[10px] text-slate-300 border-t border-white/10 pt-2">
                    <div className="flex justify-between">
                      <span>Hujum:</span>
                      <span className="font-bold text-amber-300">{f.stats.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zirh:</span>
                      <span className="font-bold text-sky-300">{f.stats.armor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Texnologiya:</span>
                      <span className="font-bold text-emerald-300">{f.stats.tech}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Tactical Settings Grid (Compact, responsive) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-700/80 pt-3">
          {/* Raqib Fraktsiyasi */}
          <div className="bg-black/60 border border-slate-700 rounded p-2.5">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
              2. Raqib (AI) Fraktsiyasi:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['USA', 'China', 'GLA'] as Faction[]).map(f => (
                <button
                  key={f}
                  onClick={() => setEnemyFaction(f)}
                  className={`py-1 text-xs font-bold rounded transition cursor-pointer ${
                    enemyFaction === f
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-[#141e16] text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* AI Qiyinchilik Darajasi */}
          <div className="bg-black/60 border border-slate-700 rounded p-2.5">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
              3. AI Qiyinchiligi:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'easy' as Difficulty, label: 'Oson' },
                { id: 'medium' as Difficulty, label: 'O\'rta' },
                { id: 'hard' as Difficulty, label: 'Qiyin' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`py-1 text-xs font-bold rounded transition cursor-pointer ${
                    difficulty === d.id
                      ? 'bg-amber-500 text-black shadow'
                      : 'bg-[#141e16] text-slate-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boshlang'ich Mablag' */}
          <div className="bg-black/60 border border-slate-700 rounded p-2.5">
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
              4. Boshlang'ich Mablag':
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[2500, 5000, 10000].map(cash => (
                <button
                  key={cash}
                  onClick={() => setStartingCredits(cash)}
                  className={`py-1 text-xs font-bold rounded transition cursor-pointer ${
                    startingCredits === cash
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#141e16] text-slate-400 hover:text-white'
                  }`}
                >
                  ${cash}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Launch Button */}
        <button
          onClick={handleStart}
          disabled={isDeploying}
          className={`w-full py-4 text-base font-black tracking-widest uppercase rounded-lg shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${
            isDeploying
              ? 'bg-emerald-400 text-black border-emerald-300 scale-[0.98] animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black border-amber-300 shadow-amber-500/30 hover:scale-[1.01]'
          }`}
        >
          <span>{isDeploying ? 'JANG MAYDONIGA YUKLANMOQDA...' : 'JANG MAYDONIGA KIRISH (DEPLOY)'}</span>
          <span className="text-xl">➔</span>
        </button>
      </div>
    </div>
  );
};

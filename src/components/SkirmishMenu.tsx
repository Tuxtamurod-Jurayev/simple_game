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
      name: 'USA',
      sub: 'Yuqori texnologiya',
      color: 'from-blue-600/30 to-blue-950/80',
      border: 'border-blue-500',
      accent: 'text-blue-400',
      features: ['Paladin lazer tanki', 'Chinook vertolyoti', 'Zarracha to\'pi'],
      stats: { attack: '85%', armor: '75%', tech: '100%' }
    },
    {
      id: 'China' as Faction,
      name: 'Xitoy',
      sub: 'Og\'ir zirh & o\'rda',
      color: 'from-red-600/30 to-red-950/80',
      border: 'border-red-500',
      accent: 'text-red-400',
      features: ['Overlord supertanki', 'Gatling tezotar to\'pi', 'Yadroviy raketa'],
      stats: { attack: '100%', armor: '95%', tech: '70%' }
    },
    {
      id: 'GLA' as Faction,
      name: 'GLA',
      sub: 'Partizan & Salvage',
      color: 'from-emerald-600/30 to-emerald-950/80',
      border: 'border-emerald-500',
      accent: 'text-emerald-400',
      features: ['Elektr talab etilmaydi', 'Salvage qurol kuchi', 'Skad bo\'roni'],
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
    <div className="w-screen h-screen fixed inset-0 bg-[#050906] flex items-center justify-center p-2 sm:p-4 font-mono select-none overflow-y-auto">
      {/* Background Military Radar Sweeper */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-[750px] h-[750px] rounded-full border border-emerald-500/30 relative flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/20" />
          <div className="w-[250px] h-[250px] rounded-full border border-emerald-500/20" />
          <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          <div className="absolute h-full w-[1px] bg-emerald-500/20" />
          <div className="absolute w-full h-full rounded-full animate-spin [animation-duration:8s] bg-gradient-to-tr from-transparent via-transparent to-emerald-500/20 pointer-events-none" />
        </div>
      </div>

      {/* Main Tactical Skirmish Card */}
      <div className="relative z-10 w-full max-w-4xl my-auto bg-[#0c140e]/95 border-2 border-amber-500/80 rounded-xl p-3 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3 sm:gap-4 max-h-[96vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-widest text-amber-400 uppercase drop-shadow">
                C&C: GENERALS 3D
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                Harbiy Taktika • Three.js Dvijok
              </p>
            </div>
          </div>
          <div className="text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 sm:px-2.5 py-0.5 rounded font-bold shrink-0">
            3D FAOL (60 FPS)
          </div>
        </div>

        {/* 1. Faction Selection (Responsive Cards) */}
        <div>
          <label className="text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider block mb-1.5 sm:mb-2">
            1. FRAKTSIYA:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {factions.map(f => {
              const isSelected = playerFaction === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setPlayerFaction(f.id)}
                  className={`cursor-pointer rounded-lg p-2.5 sm:p-3 border-2 transition-all duration-200 relative overflow-hidden bg-gradient-to-b ${f.color} ${
                    isSelected
                      ? `${f.border} shadow-lg scale-[1.01] bg-opacity-95`
                      : 'border-slate-700/80 hover:border-slate-500 opacity-75 hover:opacity-100'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-bl uppercase">
                      ✓
                    </div>
                  )}

                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-sm font-black text-white tracking-wide">{f.name}</span>
                  </div>
                  <div className={`text-[10px] font-bold ${f.accent} mb-1.5`}>{f.sub}</div>

                  {/* Bullet points */}
                  <div className="space-y-1 text-[9px] sm:text-[10px] text-slate-200 mb-2 border-t border-white/10 pt-1.5">
                    {f.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-300 border-t border-white/10 pt-1.5 text-center">
                    <div>
                      <span className="text-slate-400 block">Hujum</span>
                      <span className="font-bold text-amber-300">{f.stats.attack}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Zirh</span>
                      <span className="font-bold text-sky-300">{f.stats.armor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tech</span>
                      <span className="font-bold text-emerald-300">{f.stats.tech}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Tactical Settings Grid (Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 border-t border-slate-700/80 pt-2 sm:pt-2.5">
          {/* Raqib Fraktsiyasi */}
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              2. RAQIB (AI):
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['USA', 'China', 'GLA'] as Faction[]).map(f => (
                <button
                  key={f}
                  onClick={() => setEnemyFaction(f)}
                  className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
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
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              3. AI DARAJASI:
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
                  className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
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
          <div className="bg-black/60 border border-slate-700 rounded p-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mb-1 uppercase">
              4. MABLAG':
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[2500, 5000, 10000].map(cash => (
                <button
                  key={cash}
                  onClick={() => setStartingCredits(cash)}
                  className={`py-1 text-[11px] sm:text-xs font-bold rounded transition cursor-pointer ${
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
          className={`w-full py-2.5 sm:py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-lg shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${
            isDeploying
              ? 'bg-emerald-400 text-black border-emerald-300 scale-[0.99] animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black border-amber-300 shadow-amber-500/20 hover:scale-[1.005]'
          }`}
        >
          <span>{isDeploying ? 'YUKLANMOQDA...' : 'JANGNI BOSHLASH'}</span>
          <span className="text-base sm:text-lg">➔</span>
        </button>
      </div>
    </div>
  );
};

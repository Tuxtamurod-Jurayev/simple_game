import React from 'react';
import { Faction, GeneralPower } from '../types/game';

interface TopTacticalBarProps {
  faction: Faction;
  credits: number;
  powerProduced: number;
  powerConsumed: number;
  generalXp: number;
  superweaponTimer: number | null; // null if not built, else seconds
  generalPowers: GeneralPower[];
  onTriggerPower: (powerId: GeneralPower['id']) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExitMenu: () => void;
}

export const TopTacticalBar: React.FC<TopTacticalBarProps> = ({
  faction,
  credits,
  powerProduced,
  powerConsumed,
  generalXp,
  superweaponTimer,
  generalPowers,
  onTriggerPower,
  audioEnabled,
  onToggleAudio,
  onExitMenu
}) => {
  const isLowPower = faction === 'USA' && powerConsumed > powerProduced;
  const rank = generalXp >= 1500 ? 3 : generalXp >= 800 ? 2 : generalXp >= 300 ? 1 : 0;
  const stars = rank === 3 ? '★★★' : rank === 2 ? '★★' : rank === 1 ? '★' : '☆';

  // Format superweapon timer mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-[1100px] bg-gradient-to-b from-[#1c241e] to-[#0f1510] border-x-2 border-b-2 border-slate-600 px-4 py-2 flex items-center justify-between shadow-xl text-xs select-none font-mono">
      {/* 1. Pul va Energiya */}
      <div className="flex items-center gap-5">
        <div className="bg-black/60 px-3.5 py-1 rounded border border-amber-500/50 flex items-center gap-2">
          <span className="text-slate-400">CREDITS:</span>
          <span className="text-base font-bold text-amber-400">${Math.floor(credits)}</span>
        </div>

        {/* Power Status */}
        {faction === 'GLA' ? (
          <div className="text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1 rounded border border-emerald-600/40">
            GLA: No Power Required (100% Online)
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">POWER:</span>
            <div className="w-24 h-2.5 bg-slate-800 rounded overflow-hidden border border-slate-600">
              <div
                className={`h-full ${isLowPower ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}
                style={{
                  width: `${Math.min(100, powerProduced > 0 ? (powerConsumed / powerProduced) * 100 : 100)}%`
                }}
              />
            </div>
            <span className={`font-bold ${isLowPower ? 'text-red-400 font-extrabold' : 'text-emerald-400'}`}>
              {powerProduced} / {powerConsumed} GW {isLowPower && '⚠️ LOW POWER!'}
            </span>
          </div>
        )}

        {/* General Rank & XP */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded border border-slate-700">
          <span className="text-amber-400 text-sm font-bold">{stars}</span>
          <span className="text-slate-300">
            Rank {rank} ({generalXp} XP)
          </span>
        </div>
      </div>

      {/* 2. Superqurol Taymeri va General Powers */}
      <div className="flex items-center gap-3">
        {superweaponTimer !== null && (
          <div className="bg-black/80 border border-red-500/80 px-3 py-1 rounded flex items-center gap-2 animate-pulse">
            <span className="text-red-400 font-bold uppercase">SUPERWEAPON:</span>
            <span className="text-sm font-black text-amber-400">
              {superweaponTimer <= 0 ? 'READY TO FIRE!' : formatTimer(superweaponTimer)}
            </span>
          </div>
        )}

        {/* General Powers Buttons */}
        <div className="flex gap-1.5">
          {generalPowers.map(p => {
            const isReady = p.currentCooldown <= 0 && rank >= p.reqRank;
            return (
              <button
                key={p.id}
                onClick={() => isReady && onTriggerPower(p.id)}
                disabled={!isReady}
                title={`${p.name} (Req Rank ${p.reqRank})`}
                className={`px-2.5 py-1 rounded border font-bold text-[11px] transition ${
                  isReady
                    ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-300 cursor-pointer shadow-md'
                    : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                {p.name} {p.currentCooldown > 0 ? `(${p.currentCooldown}s)` : ''}
              </button>
            );
          })}
        </div>

        {/* Audio Toggle & Exit */}
        <button
          onClick={onToggleAudio}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-amber-300 cursor-pointer"
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>

        <button
          onClick={onExitMenu}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 cursor-pointer"
        >
          Menyu
        </button>
      </div>
    </div>
  );
};

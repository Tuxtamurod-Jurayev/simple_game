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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPowerShortName = (id: GeneralPower['id']) => {
    if (id === 'SpySatellite') return 'Sun\'iy yo\'ldosh';
    if (id === 'EmergencyRepair') return 'Ta\'mirlash';
    return 'Aviazarba';
  };

  return (
    <div className="w-full bg-[#09100a]/95 border-b border-amber-500/50 backdrop-blur-md px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 shadow-2xl text-[10px] sm:text-xs select-none font-mono">
      {/* 1. Pul, Quvvat, Unvon */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Mablag' */}
        <div className="bg-black/80 px-2 sm:px-2.5 py-1 rounded border border-amber-500/70 flex items-center gap-1 shadow-inner">
          <span className="text-slate-400 font-bold text-[9px] sm:text-[10px]">PUL:</span>
          <span className="text-xs sm:text-sm font-black text-amber-400">${Math.floor(credits).toLocaleString()}</span>
        </div>

        {/* Elektr quvvati */}
        {faction !== 'GLA' ? (
          <div
            className={`px-2 sm:px-2.5 py-1 rounded border flex items-center gap-1 shadow-inner ${
              isLowPower
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-black/80 border-sky-500/70 text-sky-300'
            }`}
          >
            <span className="text-slate-400 font-bold text-[9px] sm:text-[10px]">QUVVAT:</span>
            <span className="font-bold text-[10px] sm:text-xs">
              {powerProduced}/{powerConsumed} GW
            </span>
            {isLowPower && <span className="text-[8px] bg-red-600 text-white px-1 rounded font-black">!</span>}
          </div>
        ) : (
          <div className="bg-black/80 px-2 sm:px-2.5 py-1 rounded border border-emerald-500/70 text-emerald-400 font-bold text-[10px] sm:text-xs">
            QUVVAT: 100%
          </div>
        )}

        {/* Qo'mondon unvoni */}
        <div className="bg-black/80 px-2 sm:px-2.5 py-1 rounded border border-amber-500/60 text-amber-300 flex items-center gap-1 text-[10px] sm:text-xs">
          <span className="text-slate-400 font-bold">UNVON:</span>
          <span className="text-amber-400">{stars}</span>
          <span className="font-bold">{rank}</span>
        </div>
      </div>

      {/* 2. Superqurol Taymeri (agar qurilgan bo'lsa) */}
      {superweaponTimer !== null && (
        <div className="bg-red-950/90 border border-red-500 px-2.5 py-1 rounded animate-pulse flex items-center gap-1.5 shadow-lg shrink-0">
          <span className="text-red-300 font-bold text-[9px] sm:text-[10px]">QUROL:</span>
          <span className="text-xs sm:text-sm font-black text-red-400 tracking-wider">
            {superweaponTimer <= 0 ? 'TAYYOR!' : formatTimer(superweaponTimer)}
          </span>
        </div>
      )}

      {/* 3. General Qobiliyatlari va Tizim Sozlamalari */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {generalPowers.map(p => {
            const isReady = p.currentCooldown <= 0 && rank >= p.reqRank;
            return (
              <button
                key={p.id}
                disabled={!isReady}
                onClick={() => onTriggerPower(p.id)}
                className={`px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-bold rounded border transition-all cursor-pointer ${
                  isReady
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black shadow'
                    : 'bg-black/50 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {getPowerShortName(p.id)}
                {p.currentCooldown > 0 && ` (${p.currentCooldown}s)`}
              </button>
            );
          })}
        </div>

        {/* Ovoz */}
        <button
          onClick={onToggleAudio}
          className={`px-1.5 sm:px-2 py-1 rounded border font-bold text-[9px] sm:text-[10px] transition cursor-pointer ${
            audioEnabled
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 hover:bg-emerald-800'
              : 'bg-red-950 border-red-500 text-red-300 hover:bg-red-800'
          }`}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>

        {/* Chiqish */}
        <button
          onClick={onExitMenu}
          className="px-2 sm:px-2.5 py-1 bg-red-900/80 hover:bg-red-700 text-white font-bold text-[9px] sm:text-[10px] rounded border border-red-600 transition cursor-pointer shadow"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

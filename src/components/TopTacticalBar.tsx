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

  const getPowerUzbekName = (id: GeneralPower['id']) => {
    if (id === 'SpySatellite') return 'Ayg\'oqchi sun\'iy yo\'ldosh';
    if (id === 'EmergencyRepair') return 'Tezkor ta\'mirlash';
    return 'A-10 Aviahujumi';
  };

  return (
    <div className="w-full max-w-[1240px] bg-gradient-to-b from-[#1a241b]/95 to-[#0e140f]/95 backdrop-blur-md border-x-2 border-b-2 border-slate-600/90 px-4 py-2 flex items-center justify-between shadow-2xl text-xs select-none font-mono rounded-b-lg">
      {/* 1. Pul va Elektr energiyasi */}
      <div className="flex items-center gap-4">
        {/* Mablag' */}
        <div className="bg-black/70 px-3.5 py-1 rounded border border-amber-500/60 flex items-center gap-2 shadow-inner">
          <span className="text-slate-400 font-bold">MABLAG' (PUL):</span>
          <span className="text-base font-black text-amber-400">${Math.floor(credits)}</span>
        </div>

        {/* Elektr quvvati */}
        {faction !== 'GLA' ? (
          <div
            className={`px-3 py-1 rounded border flex items-center gap-2 shadow-inner ${
              isLowPower
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-black/70 border-sky-500/60 text-sky-300'
            }`}
          >
            <span className="text-slate-400 font-bold">ELEKTR QUVVATI:</span>
            <span className="font-bold">
              {powerProduced} / {powerConsumed} GW
            </span>
            {isLowPower && <span className="text-[10px] bg-red-600 text-white px-1.5 rounded font-black">QUVVAT YETISHMAYAPTI!</span>}
          </div>
        ) : (
          <div className="bg-black/70 px-3 py-1 rounded border border-emerald-500/60 text-emerald-400 font-bold">
            GLA: QUVVAT TALAB ETILMAYDI (100%)
          </div>
        )}

        {/* Qo'mondon unvoni */}
        <div className="bg-black/70 px-3 py-1 rounded border border-amber-500/60 text-amber-300 flex items-center gap-2">
          <span className="text-slate-400 font-bold">UNVON:</span>
          <span className="text-amber-400 text-sm">{stars}</span>
          <span className="text-[11px] font-bold">Daraja {rank}</span>
        </div>
      </div>

      {/* 2. Superqurol Taymeri (Agar qurilgan bo'lsa) */}
      {superweaponTimer !== null && (
        <div className="bg-red-950/90 border-2 border-red-500 px-4 py-1 rounded animate-pulse flex items-center gap-2 shadow-lg">
          <span className="text-red-300 font-bold">STRATEGIK QUROL ZARBASI:</span>
          <span className="text-base font-black text-red-400 tracking-wider">
            {superweaponTimer <= 0 ? 'TAYYOR! (ZARBA BERING)' : formatTimer(superweaponTimer)}
          </span>
        </div>
      )}

      {/* 3. General Qobiliyatlari va Tizim Sozlamalari */}
      <div className="flex items-center gap-3">
        {/* General qobiliyatlari */}
        <div className="flex items-center gap-1.5">
          {generalPowers.map(p => {
            const isReady = p.currentCooldown <= 0 && rank >= p.reqRank;
            return (
              <button
                key={p.id}
                disabled={!isReady}
                onClick={() => onTriggerPower(p.id)}
                title={`${getPowerUzbekName(p.id)} (Talab: Daraja ${p.reqRank})`}
                className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                  isReady
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black shadow-md'
                    : 'bg-black/50 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {getPowerUzbekName(p.id)}
                {p.currentCooldown > 0 && ` (${p.currentCooldown}s)`}
              </button>
            );
          })}
        </div>

        {/* Ovoz sozlamasi */}
        <button
          onClick={onToggleAudio}
          className={`px-2.5 py-1 rounded border font-bold text-[11px] transition cursor-pointer ${
            audioEnabled
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 hover:bg-emerald-800'
              : 'bg-red-950 border-red-500 text-red-300 hover:bg-red-800'
          }`}
        >
          {audioEnabled ? '🔊 OVOZ: YONIQ' : '🔇 OVOZ: O\'CHIQ'}
        </button>

        {/* Menyu/Chiqish */}
        <button
          onClick={onExitMenu}
          className="px-3 py-1 bg-red-900/80 hover:bg-red-700 text-white font-bold text-[11px] rounded border border-red-600 transition cursor-pointer shadow-md"
        >
          ✕ MENYUGA CHIQISH
        </button>
      </div>
    </div>
  );
};

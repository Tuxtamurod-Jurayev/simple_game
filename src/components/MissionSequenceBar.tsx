import React, { useState } from 'react';
import { Building, Unit } from '../types/game';

interface MissionSequenceBarProps {
  buildings: Building[];
  units: Unit[];
}

export const MissionSequenceBar: React.FC<MissionSequenceBarProps> = ({ buildings, units }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const playerBuildings = buildings.filter(b => b.team === 'player' && b.hp > 0);
  const playerUnits = units.filter(u => u.team === 'player' && u.hp > 0);
  const combatUnits = playerUnits.filter(u => !u.type.includes('Supply') && !u.type.includes('Worker'));
  const enemyBuildings = buildings.filter(b => b.team === 'enemy' && b.hp > 0);

  // Stage checks matching C&C Generals sequence
  const hasPowerAndSupply = playerBuildings.some(b => b.type.includes('Reactor') || b.type.includes('SupplyStash')) &&
    playerBuildings.some(b => b.type.includes('Supply') || b.type.includes('Depot') || b.type.includes('Center'));

  const hasFactoryOrBarracks = playerBuildings.some(
    b => b.type.includes('WarFactory') || b.type.includes('Barracks') || b.type.includes('Airfield')
  );

  const combatUnitsCount = combatUnits.length;
  const hasArmy = combatUnitsCount >= 4;

  const hasSuperweaponOrDefense = playerBuildings.some(
    b => b.isDefense || b.type.includes('ParticleCannon') || b.type.includes('NukeSilo') || b.type.includes('ScudStorm')
  );

  const enemyDestroyed = enemyBuildings.length === 0;

  // Current active stage
  const currentStage = !hasPowerAndSupply
    ? 1
    : !hasFactoryOrBarracks
    ? 2
    : !hasArmy
    ? 3
    : !hasSuperweaponOrDefense
    ? 4
    : 5;

  return (
    <div className="absolute top-12 right-3 pointer-events-auto z-30 font-mono select-none">
      <div className="bg-[#0c140e]/95 border border-amber-500/70 rounded-lg shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200 w-64 sm:w-72">
        {/* Header toggle */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="w-full px-3 py-1.5 bg-gradient-to-r from-[#18261a] to-[#0e1710] flex items-center justify-between text-left cursor-pointer hover:bg-slate-800/50 border-b border-slate-700/80"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
              Jang Ketma-ketligi
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-bold">
              {currentStage}/5
            </span>
            <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {/* Current Active Goal Banner (Always visible) */}
        <div className="px-3 py-1.5 bg-black/60 text-[10px] flex items-center justify-between border-b border-slate-800">
          <span className="text-slate-400">Joriy maqsad:</span>
          <span className="font-bold text-amber-400 truncate ml-2">
            {currentStage === 1 && '1. Energiya & Ombor'}
            {currentStage === 2 && '2. Harbiy Zavod / Kazarma'}
            {currentStage === 3 && `3. Qo'shin to'plash (${combatUnitsCount}/4)`}
            {currentStage === 4 && '4. Mudofaa & Xarita nazorati'}
            {currentStage === 5 && `5. Dushmanni yo'q qilish (${enemyBuildings.length} ta bino)`}
          </span>
        </div>

        {/* Collapsible Steps Breakdown */}
        {isExpanded && (
          <div className="p-2.5 space-y-2 text-[10px] bg-[#090f0a]">
            {/* 1-Bosqich */}
            <div className={`flex items-start gap-2 p-1 rounded ${hasPowerAndSupply ? 'text-emerald-400' : 'text-slate-300'}`}>
              <span>{hasPowerAndSupply ? '✓' : '○'}</span>
              <div className="flex-1">
                <div className="font-bold">1. Energiya va Resurs Ombori</div>
                <div className="text-[9px] text-slate-400">Reaktor va ta'minot ombori qurish</div>
              </div>
            </div>

            {/* 2-Bosqich */}
            <div className={`flex items-start gap-2 p-1 rounded ${hasFactoryOrBarracks ? 'text-emerald-400' : currentStage === 2 ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
              <span>{hasFactoryOrBarracks ? '✓' : '○'}</span>
              <div className="flex-1">
                <div className="font-bold">2. Ishlab Chiqarish Bazasini Quring</div>
                <div className="text-[9px] text-slate-400">Kazarma, Zavod yoki Aerodrom</div>
              </div>
            </div>

            {/* 3-Bosqich */}
            <div className={`flex items-start gap-2 p-1 rounded ${hasArmy ? 'text-emerald-400' : currentStage === 3 ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
              <span>{hasArmy ? '✓' : '○'}</span>
              <div className="flex-1">
                <div className="font-bold">3. Armiya Shakllantirish</div>
                <div className="text-[9px] text-slate-400">Kamida 4 ta tank yoki qiruvchi ({combatUnitsCount}/4)</div>
              </div>
            </div>

            {/* 4-Bosqich */}
            <div className={`flex items-start gap-2 p-1 rounded ${hasSuperweaponOrDefense ? 'text-emerald-400' : currentStage === 4 ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
              <span>{hasSuperweaponOrDefense ? '✓' : '○'}</span>
              <div className="flex-1">
                <div className="font-bold">4. Mudofaa va Strategik Qurol</div>
                <div className="text-[9px] text-slate-400">Mudofaa to'pi yoki Superqurol qurish</div>
              </div>
            </div>

            {/* 5-Bosqich */}
            <div className={`flex items-start gap-2 p-1 rounded ${enemyDestroyed ? 'text-emerald-400' : currentStage === 5 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}`}>
              <span>{enemyDestroyed ? '✓' : '○'}</span>
              <div className="flex-1">
                <div className="font-bold">5. Dushman Bazasini Yakson Qiling</div>
                <div className="text-[9px] text-slate-400">Dushman binolari: {enemyBuildings.length} ta qoldi</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

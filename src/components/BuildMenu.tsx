import React from 'react';
import { Entity, BuildingType, UnitType } from '../types/game';

interface BuildMenuProps {
  onBuild: (type: BuildingType) => void;
  onTrain: (type: UnitType) => void;
  selectedEntity: Entity | null;
  selectedUnitsCount: number;
}

export const BuildMenu: React.FC<BuildMenuProps> = ({
  onBuild,
  onTrain,
  selectedEntity,
  selectedUnitsCount
}) => {
  const hpPercent = selectedEntity
    ? Math.max(0, Math.min(100, (selectedEntity.hp / selectedEntity.maxHp) * 100))
    : 0;

  return (
    <div className="w-full max-w-[1024px] flex gap-3 mt-2 justify-between items-stretch">
      {/* Tanlangan obyekt kartasi (Generals Portrait) */}
      <div className="w-[300px] bg-gradient-to-b from-[#142115] to-[#0c140d] border border-[#2d4f2f] rounded p-2 flex items-center gap-3">
        <div className="w-12 h-12 bg-[#1b2e1c] border border-[#437a47] rounded flex items-center justify-center text-2xl">
          {selectedUnitsCount > 1 ? '🛡️' : selectedEntity?.icon || '📡'}
        </div>
        <div className="flex flex-col gap-1 text-xs flex-1">
          <div className="font-bold text-[#92f099] truncate">
            {selectedUnitsCount > 1
              ? `Taktik Guruh (${selectedUnitsCount} birlik)`
              : selectedEntity?.name || 'Nishon tanlanmagan'}
          </div>
          <div className="text-gray-400">
            {selectedUnitsCount > 1
              ? 'Barcha birliklar buyruqqa tayyor'
              : selectedEntity
              ? `${Math.max(0, Math.floor(selectedEntity.hp))} / ${selectedEntity.maxHp} HP`
              : 'Sichqoncha bilan ramka chizing'}
          </div>
          <div className="w-full h-2 bg-[#3a1515] border border-black rounded-sm overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                hpPercent > 45 ? 'bg-[#2ecc71]' : hpPercent > 20 ? 'bg-[#f39c12]' : 'bg-[#e74c3c]'
              }`}
              style={{ width: `${selectedUnitsCount > 1 ? 100 : hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Buyruqlar va ishlab chiqarish tugmalari */}
      <div className="flex gap-2 flex-1 justify-end">
        <button
          onClick={() => onBuild('Barracks')}
          className="bg-[#172c19] hover:bg-[#254a29] text-[#97ebb0] border border-[#3c7040] hover:border-[#61b867] px-3 py-2 rounded flex flex-col items-center justify-center gap-0.5 min-w-[110px] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-1 font-bold text-xs">
            <kbd className="bg-[#0d170e] text-[#ffd152] border border-[#3c7040] px-1 py-0.2 rounded text-[10px]">
              Q
            </kbd>
            Kazarma
          </div>
          <span className="text-[11px] text-[#ffd152] font-semibold">$500</span>
        </button>

        <button
          onClick={() => onBuild('WarFactory')}
          className="bg-[#172c19] hover:bg-[#254a29] text-[#97ebb0] border border-[#3c7040] hover:border-[#61b867] px-3 py-2 rounded flex flex-col items-center justify-center gap-0.5 min-w-[110px] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-1 font-bold text-xs">
            <kbd className="bg-[#0d170e] text-[#ffd152] border border-[#3c7040] px-1 py-0.2 rounded text-[10px]">
              W
            </kbd>
            Zavod
          </div>
          <span className="text-[11px] text-[#ffd152] font-semibold">$800</span>
        </button>

        <button
          onClick={() => onTrain('Worker')}
          className="bg-[#172c19] hover:bg-[#254a29] text-[#97ebb0] border border-[#3c7040] hover:border-[#61b867] px-3 py-2 rounded flex flex-col items-center justify-center gap-0.5 min-w-[110px] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-1 font-bold text-xs">
            <kbd className="bg-[#0d170e] text-[#ffd152] border border-[#3c7040] px-1 py-0.2 rounded text-[10px]">
              E
            </kbd>
            Yuk Mashina
          </div>
          <span className="text-[11px] text-[#ffd152] font-semibold">$200</span>
        </button>

        <button
          onClick={() => onTrain('Ranger')}
          className="bg-[#172c19] hover:bg-[#254a29] text-[#97ebb0] border border-[#3c7040] hover:border-[#61b867] px-3 py-2 rounded flex flex-col items-center justify-center gap-0.5 min-w-[110px] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-1 font-bold text-xs">
            <kbd className="bg-[#0d170e] text-[#ffd152] border border-[#3c7040] px-1 py-0.2 rounded text-[10px]">
              R
            </kbd>
            US Ranger
          </div>
          <span className="text-[11px] text-[#ffd152] font-semibold">$150</span>
        </button>

        <button
          onClick={() => onTrain('Tank')}
          className="bg-[#172c19] hover:bg-[#254a29] text-[#97ebb0] border border-[#3c7040] hover:border-[#61b867] px-3 py-2 rounded flex flex-col items-center justify-center gap-0.5 min-w-[125px] cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-1 font-bold text-xs">
            <kbd className="bg-[#0d170e] text-[#ffd152] border border-[#3c7040] px-1 py-0.2 rounded text-[10px]">
              T
            </kbd>
            Crusader Tank
          </div>
          <span className="text-[11px] text-[#ffd152] font-semibold">$600</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Entity } from '../types/game';

interface UIOverlayProps {
  money: number;
  energy: number;
  maxEnergy: number;
  enemyHqHp: number;
  selectedUnitsCount: number;
  selectedEntity: Entity | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  toast: string;
  toastType: 'normal' | 'danger' | 'success';
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  money,
  energy,
  maxEnergy,
  enemyHqHp,
  selectedUnitsCount,
  selectedEntity,
  audioEnabled,
  onToggleAudio,
  toast,
  toastType
}) => {
  return (
    <div className="w-full max-w-[1024px] flex flex-col gap-1">
      {/* Header */}
      <header className="flex justify-between items-center py-1 px-2 border-b-2 border-[#233b26]">
        <h1 className="text-lg font-bold text-[#55d45c] tracking-widest uppercase flex items-center gap-2">
          <span>Command & Conquer: Generals</span>
          <span className="text-xs bg-[#17331a] text-[#92f099] border border-[#3c7d42] px-2 py-0.5 rounded tracking-normal">
            React + TypeScript Edition
          </span>
        </h1>
        <button
          onClick={onToggleAudio}
          className="bg-[#152917] border border-[#39663b] text-[#ffd152] hover:bg-[#254a29] hover:text-white px-3 py-1 rounded text-xs transition-colors cursor-pointer"
        >
          {audioEnabled ? '🔊 Ovoz: Yoqilgan' : '🔇 Ovoz: O\'chirilgan'}
        </button>
      </header>

      {/* Taktik Panel */}
      <div className="flex items-center justify-between bg-gradient-to-b from-[#182619] to-[#0d160e] px-4 py-2 border-2 border-[#28442a] border-b-0 rounded-t-md text-sm">
        <div className="flex gap-5 items-center">
          <div className="text-[#8da68f] flex items-center gap-1.5">
            Mablag':{' '}
            <span className="text-[#ffd152] font-bold text-base drop-shadow-[0_0_8px_rgba(255,209,82,0.6)]">
              ${Math.floor(money)}
            </span>
          </div>
          <div className="text-[#8da68f] flex items-center gap-1.5">
            Energiya:{' '}
            <span className="text-[#55c8ff] font-bold">
              {energy}/{maxEnergy}
            </span>
          </div>
          <div className="text-[#8da68f] flex items-center gap-1.5">
            Tanlangan:{' '}
            <span className="bg-[#112113] text-[#92f099] border border-[#2f5933] px-2.5 py-0.5 rounded text-xs font-semibold">
              {selectedUnitsCount > 1
                ? `${selectedUnitsCount} ta jangovar birlik (Guruh)`
                : selectedEntity
                ? selectedEntity.name
                : 'Hech narsa'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[#8da68f] flex items-center gap-1.5">
            Dushman HQ:{' '}
            <span className="text-[#ff5252] font-bold text-base drop-shadow-[0_0_8px_rgba(255,82,82,0.6)]">
              {Math.max(0, Math.floor(enemyHqHp))} HP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

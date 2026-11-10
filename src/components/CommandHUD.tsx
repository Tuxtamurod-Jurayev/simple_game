import React, { useRef, useEffect, useState } from 'react';
import {
  Unit,
  Building,
  Faction,
  UnitTypeId,
  BuildingTypeId,
  Camera
} from '../types/game';
import { UNIT_CONFIGS, BUILDING_CONFIGS, FACTION_COLORS } from '../config/factions';
import { FogOfWarSystem, WORLD_WIDTH, WORLD_HEIGHT } from '../systems/fogOfWarSystem';

interface CommandHUDProps {
  faction: Faction;
  selectedUnits: Unit[];
  selectedBuilding: Building | null;
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  fogSystem: FogOfWarSystem;
  units: Unit[];
  buildings: Building[];
  onOrderMove: (worldX: number, worldY: number) => void;
  onSelectBuildingToPlace: (type: BuildingTypeId) => void;
  onTrainUnit: (type: UnitTypeId) => void;
  onTriggerSuperweaponTargetMode: () => void;
  isSuperweaponReady: boolean;
  onTacticalCommand: (command: 'stop' | 'scatter' | 'guard' | 'attackMove') => void;
  onMinimapJump?: (worldX: number, worldY: number) => void;
}

export const CommandHUD: React.FC<CommandHUDProps> = ({
  faction,
  selectedUnits,
  selectedBuilding,
  camera,
  setCamera,
  fogSystem,
  units,
  buildings,
  onOrderMove,
  onSelectBuildingToPlace,
  onTrainUnit,
  onTriggerSuperweaponTargetMode,
  isSuperweaponReady,
  onTacticalCommand,
  onMinimapJump
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'train' | 'tactics'>('build');

  // 1. MINIMAP RENDER & INTERACTION
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background (Desert minimap ground)
    ctx.fillStyle = '#1c150c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / WORLD_WIDTH;
    const scaleY = canvas.height / WORLD_HEIGHT;

    // Draw central river
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(1150 * scaleX, 0, 100 * scaleX, canvas.height);

    // Draw Bridge
    ctx.fillStyle = '#71717a';
    ctx.fillRect(1130 * scaleX, 720 * scaleY, 140 * scaleX, 160 * scaleY);

    // Render buildings
    buildings.forEach(b => {
      ctx.fillStyle = b.team === 'player' ? '#38bdf8' : '#ef4444';
      ctx.fillRect(b.x * scaleX, b.y * scaleY, Math.max(3, b.width * scaleX), Math.max(3, b.height * scaleY));
    });

    // Render units
    units.forEach(u => {
      ctx.fillStyle = u.team === 'player' ? '#22c55e' : '#f87171';
      ctx.fillRect(u.x * scaleX, u.y * scaleY, 3, 3);
    });

    // Render Fog overlay on minimap
    fogSystem.renderMinimapFog(ctx, canvas.width, canvas.height);

    // Draw Camera Viewport Box
    const viewW = 1100 * scaleX;
    const viewH = 540 * scaleY;
    const camX = camera.x * scaleX;
    const camY = camera.y * scaleY;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(camX, camY, viewW, viewH);
  }, [camera, units, buildings, fogSystem]);

  // Handle Minimap clicks (responsive rect)
  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = (clickX / rect.width) * WORLD_WIDTH;
    const targetWorldY = (clickY / rect.height) * WORLD_HEIGHT;

    if (e.button === 0) {
      if (onMinimapJump) {
        onMinimapJump(targetWorldX, targetWorldY);
      }
      setCamera(prev => ({
        ...prev,
        x: Math.max(0, Math.min(WORLD_WIDTH - 1100, targetWorldX - 550)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - 540, targetWorldY - 270))
      }));
    } else if (e.button === 2) {
      onOrderMove(targetWorldX, targetWorldY);
    }
  };

  // 2. PROCEDURAL PORTRAIT DRAWING
  useEffect(() => {
    const canvas = portraitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selectedUnits.length === 1) {
      const u = selectedUnits[0];
      ctx.fillStyle = '#090d0b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = u.team === 'player' ? FACTION_COLORS[u.faction].primary : '#7f1d1d';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -2, 20, 4);
      ctx.restore();
    } else if (selectedBuilding) {
      ctx.fillStyle = '#090d0b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BINO', canvas.width / 2, canvas.height / 2 + 3);
    }
  }, [selectedUnits, selectedBuilding]);

  // Determine available build options based on faction
  const getFactionBuildings = (): BuildingTypeId[] => {
    if (faction === 'USA') {
      return [
        'USA_Reactor',
        'USA_SupplyDepot',
        'USA_Barracks',
        'USA_WarFactory',
        'USA_Airfield',
        'USA_Patriot',
        'USA_ParticleCannon'
      ];
    }
    if (faction === 'China') {
      return [
        'China_Reactor',
        'China_SupplyCenter',
        'China_Barracks',
        'China_WarFactory',
        'China_Airfield',
        'China_GatlingCannon',
        'China_NukeSilo'
      ];
    }
    return [
      'GLA_SupplyStash',
      'GLA_Barracks',
      'GLA_WarFactory',
      'GLA_StingerSite',
      'GLA_ScudStorm'
    ];
  };

  // Determine available train options based on selected building
  const getTrainableUnits = (): UnitTypeId[] => {
    if (selectedBuilding) {
      if (selectedBuilding.type.includes('WarFactory')) {
        if (faction === 'USA') return ['Humvee', 'Crusader', 'Paladin'];
        if (faction === 'China') return ['SupplyTruck_China', 'GattlingTank', 'Battlemaster', 'Overlord'];
        return ['Technical', 'Scorpion', 'Marauder', 'GLA_RocketBuggy'];
      }
      if (selectedBuilding.type.includes('Barracks')) {
        if (faction === 'USA') return ['Ranger'];
        if (faction === 'China') return ['RedGuard'];
        return ['Worker_GLA', 'Rebel'];
      }
      if (selectedBuilding.type.includes('Airfield') || selectedBuilding.type.includes('HQ')) {
        if (faction === 'USA') return ['SupplyChinook', 'USA_Raptor', 'USA_Comanche'];
        if (faction === 'China') return ['SupplyTruck_China', 'China_MiG', 'China_Helix'];
        return ['Worker_GLA'];
      }
    }
    if (faction === 'USA') return ['SupplyChinook', 'Ranger', 'Humvee', 'Crusader', 'Paladin', 'USA_Raptor', 'USA_Comanche'];
    if (faction === 'China') return ['SupplyTruck_China', 'RedGuard', 'GattlingTank', 'Battlemaster', 'Overlord', 'China_MiG', 'China_Helix'];
    return ['Worker_GLA', 'Rebel', 'Technical', 'Scorpion', 'Marauder', 'GLA_RocketBuggy'];
  };

  const hotkeys = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];

  return (
    <div className="w-full h-[140px] sm:h-[155px] bg-[#0c140e]/98 backdrop-blur-md border-t-2 border-amber-500/70 shadow-2xl flex items-stretch gap-1.5 sm:gap-2 p-1.5 sm:p-2 select-none font-mono overflow-hidden">
      {/* 1. CHAP BLOK — TAKTIK RADAR */}
      <div className="w-[170px] sm:w-[220px] shrink-0 bg-black/90 border border-slate-700/80 rounded p-1 flex flex-col justify-between shadow-inner overflow-hidden">
        <div className="w-full flex justify-between text-[8px] sm:text-[9px] text-emerald-400 px-1 font-bold">
          <span>RADAR</span>
          <span className="text-slate-400">FAOL</span>
        </div>
        <div className="w-full flex-1 flex items-center justify-center min-h-0">
          <canvas
            ref={minimapCanvasRef}
            width={240}
            height={115}
            onMouseDown={handleMinimapClick}
            onContextMenu={e => e.preventDefault()}
            className="cursor-crosshair border border-emerald-950/80 block rounded w-full h-auto aspect-[240/115] max-h-[110px] object-contain"
          />
        </div>
      </div>

      {/* 2. O'RTA BLOK — STATUS VA OBYEKT */}
      <div className="w-[200px] sm:w-[260px] md:w-[300px] shrink-0 bg-[#121c13]/90 border border-slate-700/80 rounded p-1.5 flex gap-1.5 sm:gap-2 shadow-inner overflow-hidden">
        <canvas
          ref={portraitCanvasRef}
          width={55}
          height={55}
          className="border border-slate-700 rounded bg-slate-950 self-start shadow shrink-0 w-11 h-11 sm:w-14 sm:h-14"
        />

        <div className="flex-1 flex flex-col justify-between text-xs overflow-hidden min-w-0">
          {selectedUnits.length > 0 ? (
            <div className="overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-700 pb-0.5 mb-0.5">
                <span className="font-bold text-amber-400 truncate text-[10px] sm:text-[11px]">
                  {selectedUnits.length === 1
                    ? (UNIT_CONFIGS[selectedUnits[0].type]?.uzbekName || selectedUnits[0].type).split('(')[0]
                    : `${selectedUnits.length} ta birlik`}
                </span>
                {selectedUnits.length === 1 && selectedUnits[0].veterancy > 0 && (
                  <span className="text-[8px] sm:text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-400 shrink-0">
                    ★{selectedUnits[0].veterancy}
                  </span>
                )}
              </div>
              {selectedUnits.length === 1 ? (
                <div className="text-[9px] sm:text-[10px] text-slate-300 space-y-0.5 truncate">
                  <div>
                    HP: {Math.max(0, Math.floor(selectedUnits[0].hp))}/{selectedUnits[0].maxHp}
                  </div>
                  <div className="truncate">
                    Zarar: {selectedUnits[0].damage} | Masofa: {selectedUnits[0].range}
                  </div>
                  {selectedUnits[0].carrying > 0 && (
                    <div className="text-amber-400 font-bold">+${selectedUnits[0].carrying}</div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] sm:text-[10px] text-slate-400">
                  Buyruqqa tayyor. Harakat: O'ng tugma.
                </div>
              )}
            </div>
          ) : selectedBuilding ? (
            <div className="overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-700 pb-0.5 mb-0.5">
                <span className="font-bold text-sky-400 truncate text-[10px] sm:text-[11px]">
                  {(BUILDING_CONFIGS[selectedBuilding.type]?.uzbekName || selectedBuilding.type).split('(')[0]}
                </span>
                <span className="text-[8px] sm:text-[9px] text-emerald-400 shrink-0">
                  {selectedBuilding.buildProgress < 100
                    ? `${Math.floor(selectedBuilding.buildProgress)}%`
                    : 'TAYYOR'}
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 space-y-0.5 truncate">
                <div>
                  HP: {Math.max(0, Math.floor(selectedBuilding.hp))}/{selectedBuilding.maxHp}
                </div>
                {selectedBuilding.productionQueue.length > 0 && (
                  <div className="text-amber-300 font-bold truncate">
                    Chiqarilmoqda: {selectedBuilding.productionQueue[0]} ({Math.floor(selectedBuilding.productionProgress)}%)
                  </div>
                )}
                {selectedBuilding.isDefense && (
                  <div className="text-red-400 font-bold">Mudofaa: Masofa {selectedBuilding.range}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col justify-center h-full">
              <span className="text-amber-400 font-bold text-[10px] sm:text-[11px] uppercase">{faction}</span>
              <span className="text-[9px] sm:text-[10px] truncate">Birliklarni tanlang yoki buyruq bering.</span>
            </div>
          )}

          <div className="text-[8px] sm:text-[9px] text-slate-500 border-t border-slate-800 pt-0.5 flex justify-between">
            <span>2400x1600</span>
            <span className="truncate">ALOQA: BARQAROR</span>
          </div>
        </div>
      </div>

      {/* 3. O'NG BLOK — SETKA (COMMAND GRID) */}
      <div className="flex-1 min-w-[260px] bg-[#0f1710]/90 border border-slate-700/80 rounded p-1 flex flex-col justify-between shadow-inner overflow-hidden">
        {/* Toifalar */}
        <div className="flex gap-1 border-b border-slate-700/80 pb-0.5 mb-1">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-1 py-0.5 text-[8px] sm:text-[9px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'build'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            🏗️ Inshoot
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`flex-1 py-0.5 text-[8px] sm:text-[9px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'train'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚔️ Qo'shin
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex-1 py-0.5 text-[8px] sm:text-[9px] font-bold rounded uppercase transition cursor-pointer ${
              activeTab === 'tactics'
                ? 'bg-amber-500 text-black shadow'
                : 'bg-black/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Buyruq
          </button>
        </div>

        {/* 12-Tugmali Setka */}
        <div className="grid grid-cols-4 gap-1 flex-1 overflow-y-auto">
          {activeTab === 'build' && (
            <>
              {getFactionBuildings().map((bType, idx) => {
                const cfg = BUILDING_CONFIGS[bType];
                return (
                  <button
                    key={bType}
                    onClick={() => onSelectBuildingToPlace(bType)}
                    className="bg-[#1b261c] hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-400 text-white p-0.5 sm:p-1 rounded flex flex-col justify-between text-left transition cursor-pointer shadow min-h-[32px]"
                  >
                    <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold truncate block">
                      [{hotkeys[idx]}] {cfg.uzbekName.split('(')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-emerald-300 font-black">${cfg.cost}</span>
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'train' && (
            <>
              {getTrainableUnits().map((uType, idx) => {
                const cfg = UNIT_CONFIGS[uType];
                return (
                  <button
                    key={uType}
                    onClick={() => onTrainUnit(uType)}
                    className="bg-[#1b261c] hover:bg-amber-900/60 border border-amber-600/40 hover:border-amber-400 text-white p-0.5 sm:p-1 rounded flex flex-col justify-between text-left transition cursor-pointer shadow min-h-[32px]"
                  >
                    <span className="text-[8px] sm:text-[9px] text-amber-300 font-bold truncate block">
                      [{hotkeys[idx]}] {cfg.uzbekName.split('(')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-amber-400 font-black">${cfg.cost}</span>
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'tactics' && (
            <>
              <button
                onClick={() => onTacticalCommand('stop')}
                className="bg-red-950/70 hover:bg-red-800 border border-red-600 p-0.5 sm:p-1 rounded text-left transition cursor-pointer flex flex-col justify-between min-h-[32px]"
              >
                <span className="text-[8px] sm:text-[9px] text-red-300 font-bold block">[Q] TO'XTA</span>
                <span className="text-[7px] sm:text-[8px] text-slate-400">To'xtatish</span>
              </button>
              <button
                onClick={() => onTacticalCommand('attackMove')}
                className="bg-orange-950/70 hover:bg-orange-800 border border-orange-500 p-0.5 sm:p-1 rounded text-left transition cursor-pointer flex flex-col justify-between min-h-[32px]"
              >
                <span className="text-[8px] sm:text-[9px] text-orange-300 font-bold block">[A] HUJUM</span>
                <span className="text-[7px] sm:text-[8px] text-slate-400">Attack-Move</span>
              </button>
              <button
                onClick={() => onTacticalCommand('scatter')}
                className="bg-amber-950/70 hover:bg-amber-800 border border-amber-600 p-0.5 sm:p-1 rounded text-left transition cursor-pointer flex flex-col justify-between min-h-[32px]"
              >
                <span className="text-[8px] sm:text-[9px] text-amber-300 font-bold block">[W] TARQAL</span>
                <span className="text-[7px] sm:text-[8px] text-slate-400">Tarqalish</span>
              </button>
              <button
                onClick={() => onTacticalCommand('guard')}
                className="bg-sky-950/70 hover:bg-sky-800 border border-sky-600 p-0.5 sm:p-1 rounded text-left transition cursor-pointer flex flex-col justify-between min-h-[32px]"
              >
                <span className="text-[8px] sm:text-[9px] text-sky-300 font-bold block">[E] QO'RIQ</span>
                <span className="text-[7px] sm:text-[8px] text-slate-400">Himoya</span>
              </button>
              <button
                disabled={!isSuperweaponReady}
                onClick={onTriggerSuperweaponTargetMode}
                className={`p-0.5 sm:p-1 rounded text-left transition cursor-pointer border flex flex-col justify-between min-h-[32px] ${
                  isSuperweaponReady
                    ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white animate-pulse shadow'
                    : 'bg-black/40 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="text-[8px] sm:text-[9px] font-bold block">[R] ZARBA</span>
                <span className="text-[7px] sm:text-[8px]">{isSuperweaponReady ? 'TAYYOR' : 'Quvvat'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
